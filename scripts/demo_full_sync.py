"""Full sync demo: Device A -> hub -> curator -> Device B.
Run from the project root:  python scripts\\demo_full_sync.py
Uses only your own sync/ code + a local hub. No paid APIs, no Docker."""
import os
import subprocess
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
os.chdir(ROOT)
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

os.makedirs("data", exist_ok=True)
HUB_DB = os.path.abspath("data/demo_hub.db")
DEV_A_DB = "data/demo_device_a.db"
DEV_B_DB = "data/demo_device_b.db"
for p in (HUB_DB, DEV_A_DB, DEV_B_DB):
    if os.path.exists(p):
        os.remove(p)

os.environ["HUB_DB"] = HUB_DB

from sync import cloud_client, link, outbox, pull, push, store  # noqa: E402


def banner(t):
    print("\n" + "=" * 70 + f"\n{t}\n" + "=" * 70)


def start_hub():
    env = dict(os.environ, HUB_DB=HUB_DB)
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "hub.app.main:app", "--port", "8765", "--log-level", "warning"],
        cwd=ROOT, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    for _ in range(40):
        try:
            urllib.request.urlopen(cloud_client.HUB_URL + "/health", timeout=1)
            return proc
        except Exception:
            time.sleep(0.25)
    proc.terminate()
    sys.exit("Hub did not start. Try manually: uvicorn hub.app.main:app --port 8765")


DECISIONS_A = [
    {"mem_id": "mem_fix_001", "outcome": "share",
     "text": "Torque for M8 flange bolts is 45 Nm per the latest service bulletin.",
     "reason": "High authority, novel, no PII."},
    {"mem_id": "mem_fix_002", "outcome": "share",
     "text": "Torque for M8 flange bolts is 45 Nm per the latest service bulletin.",
     "reason": "Duplicate of an existing fix (curator should catch it)."},
    {"mem_id": "mem_note_003", "outcome": "local_only",
     "text": "Call Ramesh on +91 98765 43210 or ramesh@example.com about the gasket.",
     "reason": "Contains PII (phone, email) - kept on-device."},
    {"mem_id": "mem_dump_004", "outcome": "hold",
     "text": "sensor_dump " + "0.123," * 400,
     "reason": "Oversized sensor dump - held for size."},
]


def main():
    hub = start_hub()
    try:
        conn_a = store.connect(DEV_A_DB)
        conn_b = store.connect(DEV_B_DB)

        banner("BEAT 2 - Device A captures notes (OFFLINE). Policy decides what may leave.")
        link.set_online(False)
        for d in DECISIONS_A:
            res = outbox.enqueue_decision(conn_a, d)
            print(f"  {d['mem_id']:<14} -> {res:<11} | {d['reason']}")

        banner("BEAT 3a - Still offline: push attempt makes NO network call")
        rep = push.push_pending(conn_a, "device-A")
        print("  report:", rep)

        banner("BEAT 3b - Reconnect: outbox drains to the cloud hub")
        link.set_online(True)
        rep = push.push_pending(conn_a, "device-A")
        print("  report:", rep)
        print(f"  bytes pushed to cloud : {rep['bytes_pushed']}")
        print(f"  bytes kept on device  : {push.local_bytes_kept(conn_a)}  (PII + oversized never left)")

        banner("Retry safety - pushing again is idempotent (nothing pending)")
        print("  report:", push.push_pending(conn_a, "device-A"))

        banner("CURATOR - rule-based review on the hub (no LLM)")
        print("  inbox before:", [(i["mem_id"], i["status"]) for i in cloud_client.get("/inbox")["items"]])
        print("  curator     :", cloud_client.post("/curate-auto", {}))
        for st in ("approved", "rejected"):
            for i in cloud_client.get(f"/inbox?status={st}")["items"]:
                print(f"    {st:<9} {i['mem_id']:<12} note: {i['curator_note']}")

        banner("BEAT 5 - Device B pulls verified fleet knowledge")
        learned = pull.pull_new(conn_b, "device-B")
        if not learned:
            print("  (nothing new)")
        for it in learned:
            print(f"  v{it['version']} {it['mem_id']}: {it['text']}")
            print(f"     provenance: {it['provenance']}")

        banner("Device A pulls too - it must NOT get its own fix back")
        print("  learned:", pull.pull_new(conn_a, "device-A"))

        banner("Device B pulls again - cursor advanced, nothing duplicated")
        print("  learned:", pull.pull_new(conn_b, "device-B"))

        banner("DONE - Fix traveled: Device A -> Cloud -> Curator -> Device B")
    finally:
        hub.terminate()
        try:
            hub.wait(timeout=5)
        except Exception:
            hub.kill()


if __name__ == "__main__":
    main()