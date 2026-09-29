"""Beat 3: reconnect -> pending outbox items are pushed to the hub."""
import json
import time

from sync import cloud_client
from sync.store import log_event


def push_pending(conn, device_id: str) -> dict:
    rows = conn.execute("SELECT * FROM sync_outbox WHERE status='pending' ORDER BY created_at").fetchall()
    report = {"pushed": 0, "bytes_pushed": 0, "pending": len(rows),
              "bytes_pending": sum(len(r["text"].encode()) for r in rows), "error": None}
    for r in rows:
        try:
            cloud_client.post("/push", {
                "idem_key": r["idem_key"], "device_id": device_id,
                "mem_id": r["mem_id"], "text": r["text"], "reason": r["reason"],
            })
        except cloud_client.Offline:
            report["error"] = "offline"
            break
        except Exception as e:  # network/hub error: leave pending, retry next time
            conn.execute("UPDATE sync_outbox SET attempts=attempts+1 WHERE idem_key=?", (r["idem_key"],))
            conn.commit()
            report["error"] = str(e)
            break
        conn.execute("UPDATE sync_outbox SET status='synced', synced_at=? WHERE idem_key=?",
                     (time.time(), r["idem_key"]))
        conn.commit()
        size = len(r["text"].encode())
        report["pushed"] += 1
        report["bytes_pushed"] += size
        report["pending"] -= 1
        report["bytes_pending"] -= size
        log_event(conn, "pushed", mem_id=r["mem_id"], bytes=size)
    return report


def local_bytes_kept(conn) -> int:
    total = 0
    for r in conn.execute("SELECT payload FROM sync_events WHERE kind IN ('kept_local','held')"):
        total += json.loads(r["payload"]).get("bytes", 0)
    return total