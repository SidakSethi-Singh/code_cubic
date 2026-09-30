from __future__ import annotations

import json
import time
from typing import Any
from pydantic import BaseModel, Field

from device.app.conflicts.engine import ConflictEngine
from device.app.ledger.ledger import SQLiteLedger
from device.app.memory.models import Memory, MemoryStore
from device.app.sync.cloud_client import CloudClient
from device.app.sync.link_state import LinkOfflineError


class SyncReport(BaseModel):
    pushed: int = 0
    held: int = 0
    pulled: int = 0
    bytes_sent: int = 0
    bytes_baseline: int = 0
    saved_pct: float = 0.0
    duration_ms: float = 0.0
    status: str = "completed"


class PullWorker:
    def __init__(
        self,
        ledger: SQLiteLedger,
        cloud_client: CloudClient,
        store: MemoryStore,
        conflict_engine: ConflictEngine,
        device_profile: dict[str, Any] | None = None,
    ):
        self.ledger = ledger
        self.cloud_client = cloud_client
        self.store = store
        self.conflict_engine = conflict_engine
        self.device_profile = device_profile or {"site_id": "Plant North", "asset_id": "P-204"}

    def pull_sync(self) -> int:
        """
        Executes a pull cycle against fleet_knowledge.
        Returns number of applied items.
        """
        try:
            # 1. Heartbeat to check policy and budget
            hb = self.cloud_client.heartbeat(self.device_profile)
            byte_budget = hb.get("byte_budget", 5 * 1024 * 1024)

            # 2. Cursor-based pull
            cursor = self.ledger.get_cursor("fleet_knowledge")
            remote_records, next_cursor = self.cloud_client.pull_from_knowledge(
                site_id=self.device_profile.get("site_id"),
                asset_id=self.device_profile.get("asset_id"),
                cursor=cursor,
                limit=30,
            )

            pulled_count = 0
            for r in remote_records:
                payload = r.get("payload", {})
                mid = r["id"]

                incoming_mem = Memory(
                    mem_id=mid,
                    version=int(payload.get("version", 1)),
                    content=str(payload.get("content", "")),
                    content_hash=str(payload.get("content_hash", "")),
                    kind=str(payload.get("kind", "manual")),
                    status=str(payload.get("status", "active")),
                    sync_state="synced",
                    scope=str(payload.get("scope", "fleet")),
                    authority=int(payload.get("authority", 2)),
                    site_id=str(payload.get("site_id", self.device_profile.get("site_id", ""))),
                    asset_id=payload.get("asset_id"),
                    asset_type=payload.get("asset_type"),
                    source_device=str(payload.get("source_device", "Fleet Central")),
                    payload=payload.get("extra_payload", {}),
                    vectors=r.get("vectors", {}),
                )

                # Check local store
                local_mems = self.store.get([mid])
                if local_mems:
                    local_mem = local_mems[0]
                    # If local version is already >= incoming, skip
                    if local_mem.version >= incoming_mem.version and local_mem.content_hash == incoming_mem.content_hash:
                        continue

                    # Run through conflict engine before applying
                    outcome = self.conflict_engine.arbitrate(local_mem, incoming_mem)

                    if outcome.rule != "NONE":
                        # Record conflict in ledger
                        self.ledger.record_conflict(
                            conflict_id=outcome.conflict_id,
                            mem_ids=[local_mem.mem_id, incoming_mem.mem_id],
                            rule=outcome.rule,
                            resolution=outcome.action,
                            status="resolved" if outcome.action == "accept_winner" else "open",
                            details={
                                "reason": outcome.reason,
                                "winner_id": outcome.winner.mem_id if outcome.winner else None,
                                "lineage": [le.model_dump() for le in outcome.lineage],
                                "rule_trail": outcome.rule_trail,
                            },
                        )

                    if outcome.action == "accept_winner" and outcome.winner:
                        self.store.upsert(outcome.winner)
                        pulled_count += 1
                    elif outcome.action == "mark_disputed":
                        if outcome.loser:
                            self.store.set_status([outcome.loser.mem_id], "disputed")
                        if outcome.winner:
                            self.store.upsert(outcome.winner)
                        pulled_count += 1
                else:
                    # Brand new item from fleet, apply cleanly
                    self.store.upsert(incoming_mem)
                    pulled_count += 1

            if next_cursor:
                self.ledger.set_cursor("fleet_knowledge", next_cursor)

            self.ledger.log_event("fleet_pull_completed", {"pulled": pulled_count, "cursor": next_cursor})
            return pulled_count

        except LinkOfflineError:
            return 0
        except Exception as e:
            self.ledger.log_event("fleet_pull_error", {"error": str(e)})
            return 0
