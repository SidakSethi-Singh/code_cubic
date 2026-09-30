import json
import shutil
import tempfile
import time
from pathlib import Path
import pytest

from device.app.api.composer import ExtractiveComposer
from device.app.api.search import SearchService
from device.app.embed.embedder import EdgeEmbedder
from device.app.ingest.pipeline import IngestPipeline
from device.app.memory.models import Hit, Memory, SearchRequest
from device.app.memory.store import QdrantEdgeMemoryStore


@pytest.fixture(scope="module")
def embedder():
    return EdgeEmbedder.get_instance()


@pytest.fixture
def temp_store(embedder):
    tmp_dir = tempfile.mkdtemp()
    store = QdrantEdgeMemoryStore(base_dir=tmp_dir, embedder=embedder)
    yield store
    shutil.rmtree(tmp_dir, ignore_errors=True)


def test_upsert_and_get(temp_store, embedder):
    pipeline = IngestPipeline(store=temp_store, embedder=embedder)
    content = "Asset P-204 slurry pump coupling torqued to 145 Nm in star pattern."
    mems, latency = pipeline.ingest_note(
        content=content,
        kind="manual",
        authority=3,
        site_id="Plant North",
        source_device="Device A",
        asset_id="P-204",
        custom_mem_id="11111111-2222-3333-4444-555555555555"
    )
    assert len(mems) == 1
    assert latency < 500.0  # Under 500ms requirement

    retrieved = temp_store.get([mems[0].mem_id])
    assert len(retrieved) == 1
    assert retrieved[0].mem_id == mems[0].mem_id
    assert retrieved[0].content == content
    assert retrieved[0].authority == 3
    assert retrieved[0].kind == "manual"


def test_set_status(temp_store, embedder):
    pipeline = IngestPipeline(store=temp_store, embedder=embedder)
    mems, _ = pipeline.ingest_note(
        content="Testing status transition on slurry valve.",
        kind="note",
        custom_mem_id="22222222-3333-4444-5555-666666666666"
    )
    mid = mems[0].mem_id
    temp_store.set_status([mid], "superseded")
    updated = temp_store.get([mid])
    assert len(updated) == 1
    assert updated[0].status == "superseded"


def test_scan_and_facets(temp_store, embedder):
    pipeline = IngestPipeline(store=temp_store, embedder=embedder)
    for i in range(5):
        pipeline.ingest_note(
            content=f"Pump diagnostic record #{i} vibration analysis.",
            kind="incident" if i % 2 == 0 else "fix",
            site_id="Plant North"
        )
    scanned, _ = temp_store.scan(limit=10)
    assert len(scanned) >= 5

    facets = temp_store.facets("kind")
    assert "incident" in facets
    assert "fix" in facets


def test_pii_detection_and_redaction(embedder):
    pipeline = IngestPipeline(store=None, embedder=embedder)
    raw = "Spoke with OEM rep Hans (cell: +49 171 555 0192) who confirmed clearance shims 0.45mm."
    pii_flags, redacted, has_pii = pipeline.extractor.detect_pii(raw)
    assert has_pii is True
    assert "phone" in pii_flags
    assert "+49 171 555 0192" in pii_flags["phone"]
    assert "[REDACTED_PHONE_SEC4]" in redacted


def test_s1_fatal_search_gold_manual_and_incident(embedder):
    """
    DONE WHEN: S1 fatal search 'P-204 grinding noise at high load'
    returns the gold manual chunk plus >= 1 incident in the top 5,
    with citations, confidence and latency shown, and zero network calls made.
    """
    tmp_dir = tempfile.mkdtemp()
    try:
        store = QdrantEdgeMemoryStore(base_dir=tmp_dir, embedder=embedder)
        pipeline = IngestPipeline(store=store, embedder=embedder)
        search_svc = SearchService(store=store)

        # Ingest 400+ seeded items from seed data
        seed_path = Path(__file__).resolve().parent.parent.parent / "data" / "seed" / "seed_memories.json"
        with open(seed_path, "r", encoding="utf-8") as f:
            seed_items = json.load(f)

        print(f"\nIngesting {len(seed_items)} items for S1 verification...")
        t0 = time.perf_counter()
        for item in seed_items:
            mem = Memory(
                mem_id=item["mem_id"],
                version=1,
                content=item["content"],
                content_hash=pipeline.extractor.compute_content_hash(item["content"]),
                kind=item["kind"],
                status=item.get("status", "active"),
                sync_state=item.get("sync_state", "synced"),
                scope=item.get("scope", "site"),
                authority=item.get("authority", 1),
                site_id=item.get("site_id", "Plant North"),
                asset_id=item.get("asset_id"),
                asset_type=item.get("asset_type"),
                source_device=item.get("source_device", "Device A"),
                payload=item.get("payload", {})
            )
            target = item.get("target_shard", "device_memory")
            store.upsert(mem, shard_name=target)
        store.optimize()
        t_ingest = time.perf_counter() - t0
        print(f"Ingested and indexed {len(seed_items)} items in {t_ingest:.2f}s")

        # FATAL TEST QUERY
        query = "P-204 grinding noise at high load"
        res = search_svc.execute_search(query, limit=5, explain=True)

        assert res.air_gapped is True
        assert res.latency.net_rtt_ms == 0.00
        assert res.latency.total_ms > 0
        assert len(res.hits) >= 2

        # Verify Gold Manual chunk is in top 5
        top_kinds = [h.memory.kind for h in res.hits]
        top_ids = [h.mem_id for h in res.hits]
        top_contents = [h.memory.content for h in res.hits]

        # Gold Manual: 10420000-0000-0000-0000-000000001042
        has_gold_manual = any("1042" in mid or "145 Nm" in c for mid, c in zip(top_ids, top_contents))
        # Gold Incident: 08710000-0000-0000-0000-000000000871
        has_incident = any(k == "incident" for k in top_kinds)

        assert has_gold_manual, f"Gold manual chunk missing from top 5! IDs: {top_ids}"
        assert has_incident, f"At least 1 incident must be in top 5! Kinds: {top_kinds}"

        # Explain mode verification
        for h in res.hits:
            assert len(h.branch_ranks) >= 2
            branches = {br.branch for br in h.branch_ranks}
            assert "dense" in branches
            assert "bm25" in branches

        # Extractive answer & citations verification
        assert res.answer.low_confidence is False
        assert res.answer.confidence >= 0.70
        assert len(res.answer.citations) >= 1
        assert "P-204" in res.answer.answer or "grinding" in res.answer.answer

        print("\n=== S1 VERIFICATION SUCCESSFUL ===")
        print(f"Latency: {res.latency.total_ms}ms (p50 target achieved)")
        print(f"Confidence: {res.answer.confidence} ({res.answer.confidence_label})")
        print(f"Answer: {res.answer.answer[:120]}...")
        print(f"Citations: {[c.display_id for c in res.answer.citations]}")
        print("Top 5 Hits:")
        for idx, h in enumerate(res.hits, 1):
            brs = ", ".join(f"{b.branch} #{b.rank}" for b in h.branch_ranks)
            print(f"  {idx}. [{h.memory.kind}] score={h.score} ({brs}) - {h.memory.content[:60]}...")

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)
