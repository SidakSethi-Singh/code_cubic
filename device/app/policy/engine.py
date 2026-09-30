from __future__ import annotations

import re
from typing import Any
from device.app.memory.models import Memory
from device.app.policy.models import Decision, PolicyFactors


class PolicyEngine:
    def __init__(
        self,
        max_payload_bytes: int = 25 * 1024 * 1024,  # 25 MB mesh budget
        text_size_limit_bytes: int = 25 * 1024,     # 25 KB text budget
    ):
        self.max_payload_bytes = max_payload_bytes
        self.text_size_limit_bytes = text_size_limit_bytes

    def evaluate(
        self,
        mem: Memory,
        synced_hashes: set[str] | None = None,
        override: dict[str, Any] | None = None,
    ) -> Decision:
        # Check User Override first (wins absolutely, logged with who and why)
        if override and override.get("action"):
            factors = PolicyFactors(
                has_pii=mem.payload.get("has_pii", False),
                size_bytes=len(mem.content.encode("utf-8")),
                raw_score=1.0 if override["action"] == "share" else 0.0,
            )
            return Decision(
                action=override["action"],
                score=1.0 if override["action"] == "share" else 0.0,
                factors=factors,
                reason=f"Technician override applied by {override.get('who', 'user')}: {override.get('why', 'Manual operator disposition')}.",
                override=override,
            )

        content_bytes = len(mem.content.encode("utf-8"))
        attached_size = mem.payload.get("attachment_size_bytes", 0)
        total_size = content_bytes + attached_size

        # ---------------------------------------------------------
        # HARD RULES (Always win)
        # ---------------------------------------------------------
        # 1. PII / Secret Detection
        has_pii = bool(mem.payload.get("has_pii", False))
        pii_flags = mem.payload.get("pii_flags", {})
        if not has_pii:
            # Inline fallback check for phone, email, secrets
            phone_pat = r"(?:\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{2,4}[-.\s]?\d{2,4}"
            email_pat = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
            secret_pat = r"(?:AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9]{24,}|ghp_[a-zA-Z0-9]{36})"
            if re.search(phone_pat, mem.content) or re.search(email_pat, mem.content) or re.search(secret_pat, mem.content):
                has_pii = True

        if has_pii:
            flag_names = list(pii_flags.keys()) if pii_flags else ["unredacted contact/token"]
            factors = PolicyFactors(
                has_pii=True,
                size_bytes=total_size,
                raw_score=0.10,
            )
            return Decision(
                action="local_only",
                score=0.10,
                factors=factors,
                reason=f"Contains unredacted sensitive entities ({', '.join(flag_names)}). Restricted to local storage under fleet privacy policy §4.1.",
            )

        # 2. Byte Budget Exceeded
        if total_size > self.max_payload_bytes:
            factors = PolicyFactors(
                has_pii=False,
                size_bytes=total_size,
                size_over_budget=True,
                raw_score=0.20,
            )
            return Decision(
                action="hold",
                score=0.20,
                factors=factors,
                reason=f"Raw payload size ({total_size / (1024*1024):.1f} MB) exceeds mesh transfer limit ({self.max_payload_bytes / (1024*1024):.1f} MB). Held locally awaiting direct wired dock sync.",
            )

        # ---------------------------------------------------------
        # SOFT FACTORS (Weighted, explainable)
        # ---------------------------------------------------------
        factors = PolicyFactors(
            has_pii=False,
            size_bytes=total_size,
        )

        base_score = 0.50
        reasons: list[str] = []

        # Soft factor 1: Duplicate check (-0.4)
        if synced_hashes and mem.content_hash in synced_hashes:
            factors.duplicate_factor = -0.40
            base_score += factors.duplicate_factor
            reasons.append("Exact near-duplicate of existing fleet record (content hash match)")

        # Soft factor 2: Authority bonus (+0.15 per authority level above 0)
        if mem.authority >= 2:
            factors.authority_factor = 0.30
            base_score += factors.authority_factor
            reasons.append(f"High authority level ({mem.authority}) carries verified fleet value")
        elif mem.authority == 1:
            factors.authority_factor = 0.15
            base_score += factors.authority_factor

        # Soft factor 3: Novelty factor (+0.20 if specific technical claims exist)
        claims = mem.payload.get("claims", {})
        if claims:
            factors.novelty_factor = 0.20
            base_score += factors.novelty_factor
            reasons.append(f"Contains {len(claims)} verified parametric engineering claims ({', '.join(claims.keys())})")
        else:
            factors.novelty_factor = 0.0

        # Soft factor 4: Vague / Low-information penalty (-0.35)
        # Check text length and technical term count
        is_vague = False
        words = mem.content.strip().split()
        if len(mem.content.strip()) < 40 or len(words) < 7:
            is_vague = True
        elif not claims and not any(term in mem.content.lower() for term in ["pump", "valve", "bearing", "torque", "clearance", "rpm", "vibration", "leak"]):
            is_vague = True

        if is_vague:
            factors.vagueness_factor = -0.35
            base_score += factors.vagueness_factor
            reasons.append("Low informational density (<40 chars or lacking technical operational claims)")

        final_score = max(0.01, min(0.99, base_score))
        factors.raw_score = round(final_score, 3)

        # Action thresholding
        if factors.duplicate_factor < -0.30:
            action = "local_only"
            reason = reasons[0] if reasons else "Near-duplicate suppressed to conserve air-gap bandwidth."
        elif is_vague or final_score < 0.45:
            action = "hold"
            reason = "Held pending technician review: " + (reasons[-1] if reasons else "Insufficient technical detail.")
        else:
            action = "share"
            reason = "Approved for fleet synchronization: " + ("; ".join(reasons) if reasons else "Meets quality standards.")

        return Decision(
            action=action,
            score=factors.raw_score,
            factors=factors,
            reason=reason,
        )

    def rank_downlink(
        self,
        items: list[Memory],
        device_profile: dict[str, Any],
        byte_budget: int = 10 * 1024 * 1024,
    ) -> list[Memory]:
        """
        Ranks incoming fleet items for pull:
        1. Relevance to device profile (site_id, asset_types)
        2. Authority (3 -> 2 -> 1)
        3. Recency
        Respects remaining byte budget.
        """
        device_site = device_profile.get("site_id")
        device_assets = set(device_profile.get("asset_ids", []))
        device_types = set(device_profile.get("asset_types", []))

        def sort_key(m: Memory) -> tuple[int, int, float]:
            rel_score = 0
            if m.site_id == device_site:
                rel_score += 3
            if m.asset_id and m.asset_id in device_assets:
                rel_score += 4
            if m.asset_type and m.asset_type in device_types:
                rel_score += 2

            recency = m.updated_at.timestamp()
            return (rel_score, m.authority, recency)

        sorted_items = sorted(items, key=sort_key, reverse=True)

        selected: list[Memory] = []
        spent_bytes = 0
        for item in sorted_items:
            item_bytes = len(item.content.encode("utf-8")) + 500  # Estimate JSON overhead
            if spent_bytes + item_bytes <= byte_budget:
                selected.append(item)
                spent_bytes += item_bytes

        return selected
