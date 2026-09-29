"""Turns policy decisions into outbox rows. Only `share` ever leaves the device."""
import hashlib
import time

from sync.store import log_event


def enqueue_decision(conn, decision: dict) -> str:
    """decision = {mem_id, text, outcome: local_only|share|hold, reason}.
    Returns 'queued' | 'kept_local' | 'held'."""
    outcome = decision["outcome"].lower()
    size = len(decision["text"].encode())
    if outcome != "share":
        kind = "kept_local" if outcome == "local_only" else "held"
        log_event(conn, kind, mem_id=decision["mem_id"], bytes=size, reason=decision.get("reason"))
        return kind
    key = hashlib.sha256(f'{decision["mem_id"]}|{decision["text"]}'.encode()).hexdigest()[:24]
    conn.execute(
        "INSERT OR IGNORE INTO sync_outbox(idem_key, mem_id, text, reason, created_at) "
        "VALUES (?,?,?,?,?)",
        (key, decision["mem_id"], decision["text"], decision.get("reason"), time.time()),
    )
    conn.commit()
    log_event(conn, "queued", mem_id=decision["mem_id"], bytes=size)
    return "queued"