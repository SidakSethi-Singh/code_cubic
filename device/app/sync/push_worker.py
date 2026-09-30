from __future__ import annotations

import json
import random
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from device.app.ledger.ledger import SQLiteLedger
from device.app.memory.models import Memory, MemoryStore
from device.app.policy.models import Decision
from device.app.sync.cloud_client import CloudClient
from device.app.sync.link_state import LinkOfflineError
from device.app.sync.serializer import OutboundSerializer, SecurityLeakError


class PushWorker:
    def __init__(
        self,
        ledger: SQLiteLedger,
        cloud_client: CloudClient,
        store: MemoryStore,
    ):
        self.ledger = ledger
        self.cloud_client = cloud_client
        self.store = store

    def enqueue(self, mem: Memory, decision: Decision) -> str | None:
        """
        If policy action is 'share', enqueues an outbox row.
        Returns op_id or None.
        """
        # Always record decision in ledger first
        self.ledger.record_decision(
            mem_id=mem.mem_id,
            action=decision.action,
            score=decision.score,
            factors=decision.factors.model_dump(),
            reason=decision.reason,
            override=decision.override,
        )

        if decision.action != "share":
            return None

        mem.sync_state = "pending"
        op_id = f"OP-{uuid.uuid4().hex[:6].upper()}"
        payload = mem.model_dump(mode="json")
        self.ledger.enqueue_outbox(
            op_id=op_id,
            mem_id=mem.mem_id,
            version=mem.version,
            payload=payload,
            state="NEW",
        )
        return op_id

    def push_batch(self, byte_budget: int = 5 * 1024 * 1024) -> tuple[int, int]:
        """
        Reads pending outbox rows, serializes them safely, batches by budget,
        and pushes to cloud inbox.
        Returns: (pushed_count, bytes_sent)
        """
        pending_rows = self.ledger.get_pending_outbox(limit=50)
        if not pending_rows:
            return 0, 0

        # Sort by authority / priority (higher authority first)
        def sort_priority(r: dict[str, Any]) -> int:
            return int(r["payload"].get("authority", 0))

        sorted_rows = sorted(pending_rows, key=sort_priority, reverse=True)

        batch_points: list[dict[str, Any]] = []
        op_ids_to_ack: list[str] = []
        bytes_sent = 0

        for r in sorted_rows:
            op_id = r["op_id"]
            mem_dict = r["payload"]
            mem = Memory(**mem_dict)

            try:
                # Invariant I1: Outbound serializer verifies no leaks
                point_data = OutboundSerializer.serialize_for_fleet(mem)
                point_bytes = len(json.dumps(point_data).encode("utf-8"))

                if bytes_sent + point_bytes > byte_budget:
                    break

                batch_points.append(point_data)
                op_ids_to_ack.append(op_id)
                bytes_sent += point_bytes
            except SecurityLeakError as e:
                # Invariant I1: Mark failed / blocked in ledger
                self.ledger.update_outbox_state(op_id=op_id, state="BLOCKED_LEAK")
                self.ledger.log_event("security_violation_blocked", {"op_id": op_id, "mem_id": mem.mem_id, "error": str(e)})

        if not batch_points:
            return 0, 0

        # Try push to fleet inbox
        try:
            self.cloud_client.push_to_inbox(batch_points)

            # Mark ACKed and update memory sync_state in store
            for op_id in op_ids_to_ack:
                self.ledger.update_outbox_state(op_id=op_id, state="SYNCED")

            # Update memory store sync_state
            synced_ids = [p["id"] for p in batch_points]
            self.store.set_status(synced_ids, status="active", sync_state="synced")

            self.ledger.log_event(
                "fleet_push_ack",
                {"count": len(batch_points), "bytes_sent": bytes_sent, "mem_ids": synced_ids},
            )
            return len(batch_points), bytes_sent

        except LinkOfflineError:
            # Expected when air-gapped, do not increment retry penalty
            return 0, 0
        except Exception as e:
            # Network failure: exponential backoff with jitter
            now = datetime.now(timezone.utc)
            for r in pending_rows:
                attempts = r["attempts"] + 1
                base_delay = 2 ** min(attempts, 6)
                jitter = random.uniform(0.1, 1.0)
                next_try = (now + timedelta(seconds=base_delay + jitter)).isoformat()
                self.ledger.update_outbox_state(
                    op_id=r["op_id"],
                    state="FAILED_RETRY",
                    attempts=attempts,
                    next_try=next_try,
                )
            self.ledger.log_event("fleet_push_error", {"error": str(e), "failed_count": len(batch_points)})
            return 0, 0
