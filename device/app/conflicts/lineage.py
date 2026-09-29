"""device/app/conflicts/lineage.py — persists conflict resolutions."""
import json, time
from ..ledger.db import get_conn, log_event

def record_conflict(mem_id_a: str, mem_id_b: str, conflict_type: str, resolution: dict):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO conflicts (mem_id_a, mem_id_b, conflict_type, resolution, status, lineage, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (mem_id_a, mem_id_b, conflict_type, resolution["rule_used"],
             "disputed" if resolution["rule_used"] == "human" else "resolved",
             json.dumps(resolution["lineage"]), time.time()),
        )
    log_event("conflict", resolution)