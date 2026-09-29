"""Beat 5: fetch curator-approved fleet knowledge newer than our cursor."""
import time
from urllib.parse import quote

from sync import cloud_client
from sync.store import get_cursor, log_event, set_cursor


def pull_new(conn, device_id: str) -> list[dict]:
    since = get_cursor(conn, "fleet_version")
    try:
        data = cloud_client.get(f"/pull?since={since}&device_id={quote(device_id)}")
    except cloud_client.Offline:
        return []
    learned = []
    for it in data["items"]:
        prov = f'learned from {it["source_device"]} · verified by curator'
        conn.execute(
            "INSERT OR IGNORE INTO sync_learned(version, mem_id, text, source, provenance, learned_at) "
            "VALUES (?,?,?,?,?,?)",
            (it["version"], it["mem_id"], it["text"], it["source_device"], prov, time.time()),
        )
        learned.append({**it, "provenance": prov})
        log_event(conn, "pulled", version=it["version"], mem_id=it["mem_id"], provenance=prov)
    set_cursor(conn, "fleet_version", data["latest_version"])
    conn.commit()
    return learned