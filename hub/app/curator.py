from __future__ import annotations

from typing import Any
from pydantic import BaseModel


class CuratorDecision(BaseModel):
    action: str  # "promote" | "reject" | "needs_review"
    reason: str
    auto_promoted: bool = False
    details: dict[str, Any] = {}


class FleetCurator:
    def __init__(self):
        pass

    def evaluate_inbox_item(
        self,
        item: dict[str, Any],
        existing_hashes: set[str],
        confirmed_device_count: int = 1,
    ) -> CuratorDecision:
        payload = item.get("payload", {})
        content_hash = payload.get("content_hash", "")
        authority = int(payload.get("authority", 1))

        # Check duplicate
        if content_hash in existing_hashes:
            return CuratorDecision(
                action="reject",
                reason="Duplicate content hash matches an existing fleet knowledge record.",
                auto_promoted=False,
            )

        # Auto-promote if authority >= 2 or confirmed by >= 2 devices
        if authority >= 2 or confirmed_device_count >= 2:
            reason = (
                f"Auto-promoted to fleet knowledge: verified authority ({authority}) "
                f"and multi-device consensus ({confirmed_device_count} devices)."
            )
            return CuratorDecision(
                action="promote",
                reason=reason,
                auto_promoted=True,
            )

        # Otherwise needs review for Meera S.
        return CuratorDecision(
            action="needs_review",
            reason="Unverified field technician observation. Held in curator triage for reliability engineer sign-off.",
            auto_promoted=False,
            details={"authority": authority, "devices": confirmed_device_count},
        )
