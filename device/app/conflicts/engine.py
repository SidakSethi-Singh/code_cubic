from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any
from device.app.conflicts.models import ConflictOutcome, LineageEntry
from device.app.ingest.extractors import PatternExtractor
from device.app.memory.models import Memory


class ConflictEngine:
    def __init__(self, extractor: PatternExtractor | None = None):
        self.extractor = extractor or PatternExtractor()

    def arbitrate(self, local: Memory, incoming: Memory) -> ConflictOutcome:
        """
        Universal arbitration dispatcher:
        Checks C3 (Tombstone vs Live), C1 (Identity divergence), and C2 (Contradictory claims).
        """
        # C3: Tombstone vs Live
        if local.status == "tombstoned" or incoming.status == "tombstoned":
            live = local if incoming.status == "tombstoned" else incoming
            tomb = incoming if incoming.status == "tombstoned" else local
            return self.resolve_c3_tombstone(live, tomb)

        # C1: Same mem_id, divergent content
        if local.mem_id == incoming.mem_id and local.content_hash != incoming.content_hash:
            return self.resolve_c1_identity(local, incoming)

        # C2: Different mem_id, same asset/topic, contradictory parametric claims
        if local.asset_id and local.asset_id == incoming.asset_id:
            c2_res = self.check_c2_contradictory_claims(local, incoming)
            if c2_res:
                return c2_res

        # If identical or normal version upgrade
        if incoming.version > local.version:
            cid = f"CR-{uuid.uuid4().hex[:6].upper()}"
            lineage = [
                LineageEntry(
                    mem_id=incoming.mem_id,
                    version=incoming.version,
                    action="converged",
                    reason=f"Standard sequential version advance (v{local.version} -> v{incoming.version})",
                )
            ]
            return ConflictOutcome(
                conflict_id=cid,
                rule="NONE",
                winner=incoming,
                loser=local,
                action="accept_winner",
                reason=f"Sequential version bump from {local.version} to {incoming.version}.",
                lineage=lineage,
            )

        # Default no conflict
        cid = f"CR-{uuid.uuid4().hex[:6].upper()}"
        return ConflictOutcome(
            conflict_id=cid,
            rule="NONE",
            winner=local,
            loser=incoming,
            action="noop",
            reason="Records are identical or local version dominates.",
            lineage=[],
        )

    def resolve_c1_identity(self, local: Memory, incoming: Memory) -> ConflictOutcome:
        """
        C1: Same mem_id, divergent content.
        Resolution order: authority -> version -> time -> human review.
        """
        cid = f"CR-{uuid.uuid4().hex[:6].upper()}"
        rule_trail = []
        now_iso = datetime.now(timezone.utc).isoformat()

        # Step 1: Authority comparison
        rule_trail.append(
            f"RULE 01: AUTHORITY EVALUATION — Incoming (Auth {incoming.authority}) vs Local (Auth {local.authority})"
        )
        if incoming.authority > local.authority:
            rule_trail.append("WINNER: Incoming record dominates by higher authority.")
            lineage = [
                LineageEntry(mem_id=local.mem_id, version=local.version, action="superseded", reason=f"Superseded by authority {incoming.authority}"),
                LineageEntry(mem_id=incoming.mem_id, version=incoming.version, action="converged", reason=f"Authoritative fleet update (Auth {incoming.authority})"),
            ]
            return ConflictOutcome(
                conflict_id=cid,
                rule="C1",
                winner=incoming,
                loser=local,
                action="accept_winner",
                reason=f"Higher authority ({incoming.authority} > {local.authority}) wins under Rule C1.",
                lineage=lineage,
                rule_trail=rule_trail,
            )
        elif local.authority > incoming.authority:
            rule_trail.append("WINNER: Local record dominates by higher authority. Invariant I7 preserved.")
            lineage = [
                LineageEntry(mem_id=incoming.mem_id, version=incoming.version, action="disputed", reason=f"Rejected: lower authority ({incoming.authority}) cannot overwrite local authority ({local.authority})"),
            ]
            return ConflictOutcome(
                conflict_id=cid,
                rule="C1",
                winner=local,
                loser=incoming,
                action="accept_winner",
                reason=f"Local record authority ({local.authority}) dominates incoming ({incoming.authority}). Preserving Invariant I7.",
                lineage=lineage,
                rule_trail=rule_trail,
            )

        # Step 2: Version comparison (equal authority)
        rule_trail.append(
            f"RULE 02: VERSION EVALUATION — Incoming (v{incoming.version}) vs Local (v{local.version})"
        )
        if incoming.version > local.version:
            rule_trail.append("WINNER: Incoming record dominates by higher version.")
            lineage = [
                LineageEntry(mem_id=local.mem_id, version=local.version, action="superseded", reason=f"Superseded by v{incoming.version}"),
                LineageEntry(mem_id=incoming.mem_id, version=incoming.version, action="converged", reason=f"Version advance to v{incoming.version}"),
            ]
            return ConflictOutcome(
                conflict_id=cid,
                rule="C1",
                winner=incoming,
                loser=local,
                action="accept_winner",
                reason=f"Equal authority ({local.authority}): incoming version v{incoming.version} exceeds local v{local.version}.",
                lineage=lineage,
                rule_trail=rule_trail,
            )
        elif local.version > incoming.version:
            rule_trail.append("WINNER: Local record dominates by higher version.")
            lineage = [
                LineageEntry(mem_id=incoming.mem_id, version=incoming.version, action="disputed", reason=f"Stale version v{incoming.version} < local v{local.version}"),
            ]
            return ConflictOutcome(
                conflict_id=cid,
                rule="C1",
                winner=local,
                loser=incoming,
                action="accept_winner",
                reason=f"Equal authority ({local.authority}): local version v{local.version} dominates incoming v{incoming.version}.",
                lineage=lineage,
                rule_trail=rule_trail,
            )

        # Step 3: Timestamp comparison (equal authority and version)
        rule_trail.append(
            f"RULE 03: TIMESTAMP & VCLOCK RECENCY — Incoming ({incoming.updated_at.isoformat()}) vs Local ({local.updated_at.isoformat()})"
        )
        if incoming.updated_at > local.updated_at:
            rule_trail.append("WINNER: Incoming record dominates by newer timestamp.")
            lineage = [
                LineageEntry(mem_id=local.mem_id, version=local.version, action="superseded", reason="Superseded by newer timestamp"),
                LineageEntry(mem_id=incoming.mem_id, version=incoming.version, action="converged", reason="Newer timestamp applied"),
            ]
            return ConflictOutcome(
                conflict_id=cid,
                rule="C1",
                winner=incoming,
                loser=local,
                action="accept_winner",
                reason="Equal authority and version: incoming record is newer.",
                lineage=lineage,
                rule_trail=rule_trail,
            )
        elif local.updated_at > incoming.updated_at:
            rule_trail.append("WINNER: Local record dominates by newer timestamp.")
            return ConflictOutcome(
                conflict_id=cid,
                rule="C1",
                winner=local,
                loser=incoming,
                action="accept_winner",
                reason="Equal authority and version: local record is newer.",
                lineage=[],
                rule_trail=rule_trail,
            )

        # Step 4: Human Review Required
        rule_trail.append("RULE 04: IDENTICAL ATTRIBUTES DETECTED — Escalating to human curator triage.")
        return ConflictOutcome(
            conflict_id=cid,
            rule="C1",
            winner=None,
            loser=None,
            action="human_review",
            reason="Exact tie across authority, version, and timestamp. Routed to technician review queue.",
            lineage=[
                LineageEntry(mem_id=local.mem_id, version=local.version, action="disputed", reason="Pending operator review"),
            ],
            rule_trail=rule_trail,
        )

    def check_c2_contradictory_claims(self, existing: Memory, incoming: Memory) -> ConflictOutcome | None:
        """
        C2: Contradictory claims (e.g. torque 40 Nm vs 45 Nm).
        Extracts claims; if conflicting values for same property on same asset,
        higher authority supersedes, loser becomes disputed + review queue.
        """
        c_exist = existing.payload.get("claims") or self.extractor.extract_claims(existing.content)
        c_in = incoming.payload.get("claims") or self.extractor.extract_claims(incoming.content)

        # Look for overlapping claim properties with divergent values
        contradictions = []
        for prop, spec in c_in.items():
            if prop in c_exist:
                vals_in = spec.get("values", [])
                vals_ex = c_exist[prop].get("values", [])
                # If values differ (e.g. 45 vs 40)
                if vals_in and vals_ex and vals_in != vals_ex:
                    contradictions.append(f"{prop}: '{vals_in[0]}' vs '{vals_ex[0]}'")

        if not contradictions:
            return None

        cid = f"CR-{uuid.uuid4().hex[:6].upper()}"
        rule_trail = [
            f"RULE 01: CONTRADICTORY CLAIM DETECTION — {', '.join(contradictions)}",
            f"RULE 02: AUTHORITY EVALUATION — Incoming (Auth {incoming.authority}) vs Existing (Auth {existing.authority})",
        ]

        if incoming.authority >= existing.authority:
            winner = incoming
            loser = existing
            rule_trail.append(f"WINNER: Incoming record (Auth {incoming.authority}) supersedes Existing (Auth {existing.authority}).")
            lineage = [
                LineageEntry(mem_id=existing.mem_id, version=existing.version, action="disputed", reason=f"Contradicted by higher authority #{incoming.mem_id}"),
                LineageEntry(mem_id=incoming.mem_id, version=incoming.version, action="converged", reason="Authoritative claim accepted into active runtime"),
            ]
            return ConflictOutcome(
                conflict_id=cid,
                rule="C2",
                winner=winner,
                loser=loser,
                action="mark_disputed",
                reason=f"Rule C2 contradiction detected ({contradictions[0]}): higher authority {winner.authority} supersedes lower authority {loser.authority} (marked disputed).",
                lineage=lineage,
                rule_trail=rule_trail,
            )
        else:
            winner = existing
            loser = incoming
            rule_trail.append(f"WINNER: Existing record (Auth {existing.authority}) dominates Incoming (Auth {incoming.authority}).")
            lineage = [
                LineageEntry(mem_id=incoming.mem_id, version=incoming.version, action="disputed", reason=f"Contradicts authoritative record #{existing.mem_id}"),
            ]
            return ConflictOutcome(
                conflict_id=cid,
                rule="C2",
                winner=winner,
                loser=loser,
                action="mark_disputed",
                reason=f"Rule C2 contradiction detected ({contradictions[0]}): incoming lower authority ({incoming.authority}) cannot overwrite official claim ({existing.authority}).",
                lineage=lineage,
                rule_trail=rule_trail,
            )

    def resolve_c3_tombstone(self, live: Memory, tombstone: Memory) -> ConflictOutcome:
        """
        C3: Tombstone vs Live.
        Tombstone wins if tombstone.authority >= live.authority.
        """
        cid = f"CR-{uuid.uuid4().hex[:6].upper()}"
        rule_trail = [
            f"RULE 01: TOMBSTONE EVALUATION — Tombstone (Auth {tombstone.authority}) vs Live (Auth {live.authority})"
        ]

        if tombstone.authority >= live.authority:
            rule_trail.append("WINNER: Tombstone accepted. Point transitioned to tombstoned.")
            lineage = [
                LineageEntry(mem_id=live.mem_id, version=live.version, action="tombstoned", reason=f"Deleted by tombstone (Auth {tombstone.authority})"),
            ]
            return ConflictOutcome(
                conflict_id=cid,
                rule="C3",
                winner=tombstone,
                loser=live,
                action="accept_winner",
                reason=f"Rule C3: Tombstone authority ({tombstone.authority}) >= live record ({live.authority}). Record deleted.",
                lineage=lineage,
                rule_trail=rule_trail,
            )
        else:
            rule_trail.append("WINNER: Live record preserved. Lower-authority tombstone rejected.")
            lineage = [
                LineageEntry(mem_id=tombstone.mem_id, version=tombstone.version, action="disputed", reason="Unauthorized tombstone deletion attempt"),
            ]
            return ConflictOutcome(
                conflict_id=cid,
                rule="C3",
                winner=live,
                loser=tombstone,
                action="reject_edit",
                reason=f"Rule C3: Tombstone authority ({tombstone.authority}) is insufficient to delete higher-authority live record ({live.authority}).",
                lineage=lineage,
                rule_trail=rule_trail,
            )

    def check_c4_local_edit(self, existing: Memory, proposed_content: str, device_authority: int = 1) -> ConflictOutcome:
        """
        C4: Local edit of an official (authority >= 2) item is strictly forbidden.
        Device may only annotate (child memory with parent link), original stays read-only.
        """
        cid = f"CR-{uuid.uuid4().hex[:6].upper()}"
        if existing.authority >= 2:
            annotation_id = str(uuid.uuid4())
            rule_trail = [
                f"RULE 01: OFFICIAL IMMUTABILITY CHECK — Target record has Authority {existing.authority} >= 2.",
                "RULE 02: Direct modification rejected. Converting proposed content into linked annotation.",
            ]
            lineage = [
                LineageEntry(mem_id=existing.mem_id, version=existing.version, action="annotated", reason=f"Linked annotation created #{annotation_id}"),
            ]
            return ConflictOutcome(
                conflict_id=cid,
                rule="C4",
                winner=existing,
                loser=None,
                action="reject_edit",
                reason=f"Rule C4: Direct edit of official record #{existing.mem_id} (Authority {existing.authority}) is forbidden. Created child annotation #{annotation_id}.",
                lineage=lineage,
                rule_trail=rule_trail,
            )

        return ConflictOutcome(
            conflict_id=cid,
            rule="C4",
            winner=None,
            loser=None,
            action="accept_winner",
            reason="Target record authority < 2; edit permitted.",
            lineage=[],
        )
