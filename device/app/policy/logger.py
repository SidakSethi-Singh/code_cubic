"""device/app/policy/logger.py — persists decisions + fires events."""
import json, time
from ..ledger.db import get_conn, log_event

def log_decision(decision: dict):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO decisions (mem_id, outcome, score, factors, reason, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (decision["mem_id"], decision["outcome"], decision.get("score"),
             json.dumps(decision.get("factors", {})), decision["reason"], time.time()),
        )
    log_event("decision", decision)