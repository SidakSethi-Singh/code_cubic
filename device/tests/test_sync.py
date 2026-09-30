from __future__ import annotations

import json
import shutil
import socket
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path
import pytest

from device.app.conflicts.engine import ConflictEngine
from device.app.ledger.ledger import SQLiteLedger
from device.app.memory.models import Memory
from device.app.memory.store import QdrantEdgeMemoryStore
from device.app.policy.engine import PolicyEngine
from device.app.sync.cloud_client import CloudClient
from device.app.sync.coordinator import SyncCoordinator
from device.app.sync.link_state import LinkOfflineError, LinkState
from device.app.sync.pull_worker import PullWorker
from device.app.sync.push_worker import PushWorker
from device.app.sync.serializer import OutboundSerializer, SecurityLeakError


@pytest.fixture
def env_setup():
    tmp_dir = Path(tempfile.mkdtemp())
    shards_dir = tmp_dir / "shards"
    hub_dir = tmp_dir / "hub_qdrant"
    ledger_path = tmp_dir / "ledger.db"
    link_file = tmp_dir / "link_state.json"

    ledger = SQLiteLedger(db_path=ledger_path)
    link_state = LinkState(state_file=link_file, ledger=ledger)
    link_state.set_state("online")

    store = QdrantEdgeMemoryStore(base_dir=shards_dir)
    cloud_client = CloudClient(
        link_state=link_state,
        local_hub_dir=hub_dir,
    )
    cloud_client.ensure_collections()

    policy_engine = PolicyEngine()
    conflict_engine = ConflictEngine()

    push_worker = PushWorker(ledger=ledger, cloud_client=cloud_client, store=store)
    pull_worker = PullWorker(
        ledger=ledger,
        cloud_client=cloud_client,
        store=store,
        conflict_engine=conflict_engine,
        device_profile={"site_id": "Plant North", "asset_id": "P-204"},
    )
    coordinator = SyncCoordinator(
        push_worker=push_worker,
        pull_worker=pull_worker,
        ledger=ledger,
        cloud_client=cloud_client,
    )

    yield {
        "tmp_dir": tmp_dir,
        "store": store,
        "ledger": ledger,
        "link_state": link_state,
        "cloud_client": cloud_client,
        "policy_engine": policy_engine,
        "conflict_engine": conflict_engine,
        "push_worker": push_worker,
        "pull_worker": pull_worker,
        "coordinator": coordinator,
    }

    shutil.rmtree(tmp_dir, ignore_errors=True)


def test_invariant_i1_leak_refusal(env_setup):
    """
    I1: Leak test: 0 of 20 seeded sensitive items ever reach the server.
    OutboundSerializer must refuse local_only and sensitive items outright.
    """
    sensitive_items = []
    for i in range(20):
        mem = Memory(
            mem_id=f"a0010000-0000-0000-0000-{i:012d}",
            version=1,
            content=f"Confidential engineering note #{i}: Technician cell +49 171 555 {1000+i}, API key sk-proj{uuid.uuid4().hex[:16]}",
            content_hash=f"hash_sens_{i}",
            kind="note",
            status="active",
            sync_state="local_only",
            scope="device",
            authority=0,
            site_id="Plant North",
            source_device="Device A",
            payload={"has_pii": True, "pii_flags": {"phone": [f"+49 171 555 {1000+i}"]}},
        )
        sensitive_items.append(mem)

    # 1. Assert OutboundSerializer raises SecurityLeakError for all 20
    for mem in sensitive_items:
        with pytest.raises(SecurityLeakError):
            OutboundSerializer.serialize_for_fleet(mem)

    # 2. Assert push worker does not send them
    push_worker = env_setup["push_worker"]
    policy_engine = env_setup["policy_engine"]
    for mem in sensitive_items:
        decision = policy_engine.evaluate(mem)
        assert decision.action == "local_only"
        op_id = push_worker.enqueue(mem, decision)
        assert op_id is None

    pushed_count, bytes_sent = push_worker.push_batch()
    assert pushed_count == 0
    assert bytes_sent == 0


def test_invariant_i2_idempotent_push(env_setup):
    """
    I2: Replaying an outbox batch twice changes nothing.
    """
    push_worker = env_setup["push_worker"]
    policy_engine = env_setup["policy_engine"]
    cloud_client = env_setup["cloud_client"]

    mem = Memory(
        mem_id="b0010000-0000-0000-0000-000000000001",
        version=1,
        content="P-204 Coupling torque recalibrated to 145 Nm in star pattern.",
        content_hash="idmp_hash_01",
        kind="fix",
        status="active",
        sync_state="pending",
        scope="fleet",
        authority=2,
        site_id="Plant North",
        asset_id="P-204",
        source_device="Device A",
        payload={"claims": {"torque": {"unit": "Nm", "values": ["145"]}}},
    )

    decision = policy_engine.evaluate(mem)
    assert decision.action == "share"
    op_id = push_worker.enqueue(mem, decision)
    assert op_id is not None

    # First push
    p1, b1 = push_worker.push_batch()
    assert p1 == 1
    assert b1 > 0

    # Second push (replay)
    p2, b2 = push_worker.push_batch()
    assert p2 == 0
    assert b2 == 0

    # Verify cloud inbox only has 1 record
    qc = cloud_client._get_qdrant_client()
    recs = qc.retrieve(collection_name="fleet_inbox", ids=[mem.mem_id])
    assert len(recs) == 1


def test_invariant_i3_profile_pull_freshness(env_setup):
    """
    I3: After a pull, device holds the latest validated version for its profile.
    """
    cloud_client = env_setup["cloud_client"]
    pull_worker = env_setup["pull_worker"]
    store = env_setup["store"]

    qc = cloud_client._get_qdrant_client()
    from qdrant_client.http import models as qmodels

    # Populate fleet_knowledge with an authoritative bulletin
    bulletin_id = "c0010000-0000-0000-0000-000000000045"
    qc.upsert(
        collection_name="fleet_knowledge",
        points=[
            qmodels.PointStruct(
                id=bulletin_id,
                vector={"dense": [0.01] * 384, "bm25": {"indices": [1], "values": [1.0]}},
                payload={
                    "version": 3,
                    "content": "Official Fleet Directive: P-204 slurry pump coupling torque mandate 145 Nm.",
                    "content_hash": "bull_hash_45",
                    "kind": "bulletin",
                    "status": "active",
                    "authority": 3,
                    "site_id": "Plant North",
                    "asset_id": "P-204",
                    "source_device": "Fleet Central",
                    "extra_payload": {"doc_ref": "#OEM-ROOT-88"},
                },
            )
        ],
    )

    # Local store has older version 1 (40 Nm)
    store.upsert(
        Memory(
            mem_id=bulletin_id,
            version=1,
            content="Local baseline: P-204 coupling torque 40 Nm.",
            content_hash="bull_hash_40",
            kind="manual",
            status="active",
            authority=1,
            site_id="Plant North",
            asset_id="P-204",
            source_device="Device A",
        )
    )

    pulled = pull_worker.pull_sync()
    assert pulled == 1

    # Verify store now holds version 3 (145 Nm)
    updated = store.get([bulletin_id])
    assert len(updated) == 1
    assert updated[0].version == 3
    assert updated[0].authority == 3
    assert "145 Nm" in updated[0].content


def test_invariant_i6_airgap_zero_sockets(env_setup, monkeypatch):
    """
    I6: Kill socket.connect, run search/capture/inspect with link=offline,
    assert 0 connection attempts.
    """
    link_state = env_setup["link_state"]
    cloud_client = env_setup["cloud_client"]
    store = env_setup["store"]

    link_state.set_state("offline")

    socket_connect_called = []
    real_connect = socket.socket.connect

    def forbidden_connect(self, *args, **kwargs):
        socket_connect_called.append(args)
        raise RuntimeError("AIRGAP VIOLATION: Socket connect called while link=offline!")

    monkeypatch.setattr(socket.socket, "connect", forbidden_connect)

    # 1. require_online must raise LinkOfflineError immediately
    with pytest.raises(LinkOfflineError):
        cloud_client.require_online()

    with pytest.raises(LinkOfflineError):
        cloud_client.heartbeat({"device_id": "Device A"})

    with pytest.raises(LinkOfflineError):
        cloud_client.push_to_inbox([])

    with pytest.raises(LinkOfflineError):
        cloud_client.pull_from_knowledge()

    # 2. Local search and local operations must succeed without touching network
    from device.app.api.search import SearchService
    search_svc = SearchService(store=store)
    res = search_svc.execute_search("P-204 grinding noise", limit=3)
    assert res.air_gapped is True
    assert res.latency.net_rtt_ms == 0.0

    # 3. Assert zero socket connect attempts
    assert len(socket_connect_called) == 0


def test_invariant_i7_conflict_engine_authority(env_setup):
    """
    I7: Conflict engine unit tests: 0 authority violations.
    Never silently overwrite a higher-authority item.
    """
    conflict_engine = env_setup["conflict_engine"]

    high_auth_local = Memory(
        mem_id="c0010000-0000-0000-0000-000000000001",
        version=1,
        content="OEM Signed Manual: P-204 torque 145 Nm.",
        content_hash="high_hash",
        kind="manual",
        status="active",
        authority=3,
        site_id="Plant North",
        asset_id="P-204",
        source_device="OEM Root",
    )

    low_auth_incoming = Memory(
        mem_id="c0010000-0000-0000-0000-000000000001",
        version=2,
        content="Field note edit: P-204 torque 120 Nm.",
        content_hash="low_hash",
        kind="note",
        status="active",
        authority=1,
        site_id="Plant North",
        asset_id="P-204",
        source_device="Device B",
    )

    # Rule C1 test: Lower authority with higher version CANNOT overwrite higher authority
    outcome = conflict_engine.resolve_c1_identity(high_auth_local, low_auth_incoming)
    assert outcome.winner.authority == 3
    assert outcome.loser.authority == 1
    assert outcome.winner.mem_id == high_auth_local.mem_id
    assert "Dominates" in outcome.reason or "dominates" in outcome.reason

    # Rule C2 test: Contradictory claims
    existing_claim = Memory(
        mem_id="c0020000-0000-0000-0000-000000000001",
        version=1,
        content="Slurry Pump P-204 baseline torque 40 Nm.",
        content_hash="hash_40",
        kind="manual",
        status="active",
        authority=1,
        site_id="Plant North",
        asset_id="P-204",
        source_device="Device A",
        payload={"claims": {"torque": {"unit": "Nm", "values": ["40"]}}},
    )
    incoming_bulletin = Memory(
        mem_id="c0020000-0000-0000-0000-000000000002",
        version=1,
        content="Slurry Pump P-204 revised torque 45 Nm.",
        content_hash="hash_45",
        kind="bulletin",
        status="active",
        authority=3,
        site_id="Plant North",
        asset_id="P-204",
        source_device="Fleet Directive",
        payload={"claims": {"torque": {"unit": "Nm", "values": ["45"]}}},
    )
    c2_res = conflict_engine.check_c2_contradictory_claims(existing_claim, incoming_bulletin)
    assert c2_res is not None
    assert c2_res.rule == "C2"
    assert c2_res.winner.authority == 3
    assert c2_res.loser.authority == 1

    # Rule C3 test: Lower authority tombstone cannot delete higher authority record
    c3_res = conflict_engine.resolve_c3_tombstone(
        live=high_auth_local,
        tombstone=Memory(
            mem_id=high_auth_local.mem_id,
            version=2,
            content="Tombstone",
            content_hash="tomb_hash",
            kind="manual",
            status="tombstoned",
            authority=1,
            site_id="Plant North",
            source_device="Device B",
        ),
    )
    assert c3_res.action == "reject_edit"
    assert c3_res.winner.status == "active"

    # Rule C4 test: Direct edit of authority >= 2 record is forbidden
    c4_res = conflict_engine.check_c4_local_edit(
        existing=high_auth_local,
        proposed_content="Attempted modification of official manual",
        device_authority=1,
    )
    assert c4_res.action == "reject_edit"
    assert "Rule C4" in c4_res.reason


def test_crash_safety_s5_reconciliation(env_setup):
    """
    S5 Crash safety: ledger row written in state 'NEW', then crash occurs before shard write.
    On restart, reconcile() re-applies NEW rows idempotently with 0 loss and 0 duplicates.
    """
    ledger = env_setup["ledger"]
    store = env_setup["store"]

    mem = Memory(
        mem_id="d0010000-0000-0000-0000-000000000001",
        version=1,
        content="P-204 Seal replacement completed under emergency work order.",
        content_hash="rec_hash_01",
        kind="fix",
        status="active",
        authority=2,
        site_id="Plant North",
        asset_id="P-204",
        source_device="Device A",
    )

    # 1. Simulate crash: Write ledger row in state NEW, but do NOT write to store
    ledger.enqueue_outbox(
        op_id="OP-CRASH-TEST-01",
        mem_id=mem.mem_id,
        version=mem.version,
        payload=mem.model_dump(mode="json"),
        state="NEW",
    )

    # Verify point is NOT yet in store
    assert len(store.get([mem.mem_id])) == 0

    # 2. System boots and runs reconcile()
    reconciled_count = ledger.reconcile(store=store)
    assert reconciled_count == 1

    # Verify point was applied to store
    in_store = store.get([mem.mem_id])
    assert len(in_store) == 1
    assert in_store[0].mem_id == mem.mem_id

    # 3. Running reconcile() again changes nothing (idempotent, 0 duplicates)
    reconciled_again = ledger.reconcile(store=store)
    assert reconciled_again == 0
    assert len(store.get([mem.mem_id])) == 1


def test_done_when_s2_nine_memories(env_setup):
    """
    DONE WHEN: 9 new local memories (5 shareable, 2 sensitive, 1 near-dup, 1 vague) sync correctly
    per S2 in 01_PRD.md — exactly 5 pushed in priority order, 2 sensitive never leave (0 bytes),
    duplicate stays local, vague one is held with a reason, and bytes sent vs sync-everything is reported.
    """
    policy_engine = env_setup["policy_engine"]
    push_worker = env_setup["push_worker"]
    cloud_client = env_setup["cloud_client"]
    coordinator = env_setup["coordinator"]
    ledger = env_setup["ledger"]

    # 1. Define the 9 memories:
    # 5 Shareable
    shareable = [
        Memory(
            mem_id=f"e0010000-0000-0000-0000-{i:012d}",
            version=1,
            content=f"Asset P-204 verified field repair #{i}: Replaced bearing race SKF-7314, torqued coupling bolts to 145 Nm in star sequence.",
            content_hash=f"hash_share_{i}",
            kind="fix",
            authority=2,
            site_id="Plant North",
            asset_id="P-204",
            source_device="Device A",
            payload={"claims": {"torque": {"unit": "Nm", "values": ["145"]}}},
        )
        for i in range(5)
    ]

    # 2 Sensitive (Contains unredacted PII / phone)
    sensitive = [
        Memory(
            mem_id="a0020000-0000-0000-0000-000000000001",
            version=1,
            content="Spoke with OEM rep Hans (cell: +49 171 555 0192) who confirmed clearance shims 0.45mm.",
            content_hash="hash_sens_01",
            kind="note",
            authority=1,
            site_id="Plant North",
            asset_id="P-204",
            source_device="Device A",
            payload={"has_pii": True, "pii_flags": {"phone": ["+49 171 555 0192"]}},
        ),
        Memory(
            mem_id="a0020000-0000-0000-0000-000000000002",
            version=1,
            content="Lead technician personal badge TK-904 email asha.k@offshore-plant.corp API key sk-test994827419472.",
            content_hash="hash_sens_02",
            kind="note",
            authority=1,
            site_id="Plant North",
            source_device="Device A",
            payload={"has_pii": True, "pii_flags": {"email": ["asha.k@offshore-plant.corp"]}},
        ),
    ]

    # 1 Near-Duplicate (same content_hash as shareable[0])
    duplicate = Memory(
        mem_id="f0010000-0000-0000-0000-000000000001",
        version=1,
        content=shareable[0].content,
        content_hash=shareable[0].content_hash,
        kind="fix",
        authority=1,
        site_id="Plant North",
        asset_id="P-204",
        source_device="Device A",
    )

    # 1 Vague / low-info
    vague = Memory(
        mem_id="f0020000-0000-0000-0000-000000000001",
        version=1,
        content="Pump sounds bad.",
        content_hash="hash_vague_01",
        kind="note",
        authority=0,
        site_id="Plant North",
        source_device="Device A",
    )

    all_9_memories = shareable + sensitive + [duplicate, vague]
    assert len(all_9_memories) == 9

    # 2. Evaluate all 9 memories through Policy Engine
    synced_hashes = {shareable[0].content_hash}
    decisions = {}

    for mem in all_9_memories:
        dec = policy_engine.evaluate(mem, synced_hashes=synced_hashes if mem == duplicate else None)
        decisions[mem.mem_id] = dec
        push_worker.enqueue(mem, dec)

    # Assert individual decisions match S2 requirements
    for s_mem in shareable:
        assert decisions[s_mem.mem_id].action == "share"
        assert decisions[s_mem.mem_id].score >= 0.50

    for sens_mem in sensitive:
        assert decisions[sens_mem.mem_id].action == "local_only"
        assert "sensitive" in decisions[sens_mem.mem_id].reason or "PII" in decisions[sens_mem.mem_id].reason

    assert decisions[duplicate.mem_id].action in ("local_only", "hold")
    assert "duplicate" in decisions[duplicate.mem_id].reason.lower()

    assert decisions[vague.mem_id].action == "hold"
    assert "review" in decisions[vague.mem_id].reason.lower() or "density" in decisions[vague.mem_id].reason.lower()

    # 3. Execute sync cycle
    report = coordinator.sync_cycle(byte_budget=5 * 1024 * 1024)

    # Verify S2 counts
    assert report.pushed == 5, f"Expected exactly 5 items pushed, got {report.pushed}"
    assert report.held == 4, f"Expected 4 held/local items (2 sensitive + 1 dup + 1 vague), got {report.held}"
    assert report.bytes_sent > 0
    assert report.saved_pct >= 75.0, f"Expected >= 75% bandwidth saved, got {report.saved_pct}%"

    # Verify cloud inbox contains exactly the 5 shareable items
    qc = cloud_client._get_qdrant_client()
    inbox_points, _ = qc.scroll(collection_name="fleet_inbox", limit=100)
    inbox_ids = {str(p.id) for p in inbox_points}

    for s_mem in shareable:
        assert s_mem.mem_id in inbox_ids, f"Shareable memory #{s_mem.mem_id} missing from inbox!"

    for sens_mem in sensitive:
        assert sens_mem.mem_id not in inbox_ids, f"LEAK: Sensitive memory #{sens_mem.mem_id} found in inbox!"

    assert duplicate.mem_id not in inbox_ids, "Duplicate memory leaked to inbox!"
    assert vague.mem_id not in inbox_ids, "Vague memory leaked to inbox!"

    print("\n=== DONE WHEN S2 VERIFICATION COMPLETE ===")
    print(f"Pushed to fleet: {report.pushed} items ({report.bytes_sent} bytes)")
    print(f"Held locally: {report.held} items")
    print(f"Bandwidth baseline: {report.bytes_baseline} bytes")
    print(f"Bandwidth saved: {report.saved_pct}%")
    print(f"Sync duration: {report.duration_ms} ms")
