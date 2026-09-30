#!/usr/bin/env python3
"""
S2 Spike Script:
- Connects via CloudClient
- Ensures 'fleet_inbox' collection exists
- Dual-writes one point to fleet_inbox
- Reads it back and confirms point appears
"""
import sys
import time
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from device.app.sync.cloud_client import CloudClient
from device.app.sync.link_state import LinkState


def run_spike_s2():
    print("=" * 60)
    print("EDGEMIND: SPIKE S2 - CLOUD CLIENT DUAL-WRITE & INBOX VERIFICATION")
    print("=" * 60)

    # Initialize LinkState set to online
    link_state = LinkState(state_file="data/test_spike_link_state.json")
    link_state.set_state("online")

    client = CloudClient(
        link_state=link_state,
        qdrant_url="http://localhost:6333",
        local_hub_dir="data/hub_qdrant",
    )

    print("1. Ensuring fleet_inbox collection exists...")
    client.ensure_collections()

    test_point = {
        "id": "11110000-0000-0000-0000-000000001111",
        "vectors": {
            "dense": [0.05] * 384,
            "bm25": {"indices": [10, 20], "values": [1.0, 1.5]},
        },
        "payload": {
            "mem_id": "11110000-0000-0000-0000-000000001111",
            "content": "S2 Spike Test Point: Slurry pump P-204 bearing vibration baseline.",
            "authority": 2,
            "site_id": "Plant North",
            "asset_id": "P-204",
            "sync_state": "synced",
        },
    }

    print(f"2. Dual-writing test point #{test_point['id']} to fleet_inbox...")
    res = client.push_to_inbox([test_point])
    print(f"Push result: {res}")

    print("3. Reading point back from fleet_inbox...")
    q_client = client._get_qdrant_client()
    recs = q_client.retrieve(collection_name="fleet_inbox", ids=[test_point["id"]], with_payload=True)

    assert len(recs) == 1, f"Expected 1 point, found {len(recs)}"
    assert str(recs[0].id) == test_point["id"]
    print(f"Retrieved point successfully: ID={recs[0].id}")
    print(f"Payload: {recs[0].payload}")

    print("-" * 60)
    print("SPIKE S2 COMPLETE: POINT APPEARS IN FLEET_INBOX")
    print("=" * 60)


if __name__ == "__main__":
    run_spike_s2()
