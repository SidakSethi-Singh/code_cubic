#!/usr/bin/env python3
"""
S1 Spike Script:
- Creates an EdgeShard (or loads if existing)
- Upserts 100 synthetic points with dense + BM25 embeddings
- Runs hybrid query completely offline
- Prints latency breakdown
"""
import os
import sys
import time
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from device.app.memory.models import Memory, SearchRequest
from device.app.memory.store import QdrantEdgeMemoryStore
from device.app.embed.embedder import EdgeEmbedder
from device.app.ingest.pipeline import IngestPipeline
from device.app.api.search import SearchService


def run_spike():
    print("=" * 60)
    print("EDGEMIND: SPIKE S1 - QDRANT EDGE + FASTEMBED HYBRID OFFLINE")
    print("=" * 60)

    t_start = time.perf_counter()
    embedder = EdgeEmbedder.get_instance()
    store = QdrantEdgeMemoryStore(base_dir="data/shards", embedder=embedder)
    pipeline = IngestPipeline(store=store, embedder=embedder)
    search_service = SearchService(store=store)

    print("Generating 100 synthetic industrial memory records...")
    equipment = ["Pump P-204", "Compressor C-102", "Turbine T-34", "Valve V-109", "Casing C-50"]
    symptoms = [
        "grinding noise at high load above 1,750 RPM",
        "cavitation vibration on suction flange 4.2mm/s",
        "bearing thermal excursion exceeding 85 C",
        "eccentric shaft deflection 0.38mm runout",
        "coupling torque loosening below 145 Nm"
    ]
    actions = [
        "retorqued bolts in star pattern to 145 Nm",
        "replaced outboard roller bearing race SKF-7314",
        "purged lube oil reservoir and refilled with synthetic VG 220",
        "adjusted clearance shims to 0.45mm tolerance",
        "calibrated dynamic balance protocol rev 4.1"
    ]

    # Seed 100 records
    seeded_count = 0
    t_ingest_start = time.perf_counter()
    for i in range(100):
        eq = equipment[i % len(equipment)]
        sym = symptoms[i % len(symptoms)]
        act = actions[i % len(actions)]
        kind = "manual" if i % 4 == 0 else ("incident" if i % 2 == 0 else "fix")
        auth = 3 if kind == "manual" else (2 if kind == "incident" else 1)
        text = f"{eq} operational report #{1000 + i}: detected {sym}. Field procedure: {act}."
        pipeline.ingest_note(
            content=text,
            kind=kind,
            site_id="Plant North" if i % 2 == 0 else "Plant South",
            source_device="Device A" if i % 2 == 0 else "Device B",
            asset_id=eq.split()[1],
            authority=auth,
            scope="fleet" if auth >= 2 else "device",
            target_shard="fleet_mirror" if kind == "manual" else "device_memory",
        )
        seeded_count += 1
    t_ingest_end = time.perf_counter()
    print(f"Upserted {seeded_count} points in {(t_ingest_end - t_ingest_start)*1000:.1f}ms")

    # Fatal test query
    query = "P-204 grinding noise at high load"
    print(f"\nRunning hybrid query offline: '{query}'")

    # Warmup
    search_service.execute_search(query, limit=5, explain=True)

    # Timed run
    t0 = time.perf_counter()
    response = search_service.execute_search(query, limit=5, explain=True)
    t_query = (time.perf_counter() - t0) * 1000.0

    print("-" * 60)
    print(f"QUERY LATENCY: {t_query:.2f} ms (Air-gapped: {response.air_gapped})")
    print(f"LATENCY BREAKDOWN: embed={response.latency.embed_ms}ms, retrieve={response.latency.retrieve_ms}ms, fuse={response.latency.fuse_ms}ms, net_rtt={response.latency.net_rtt_ms}ms")
    print(f"EXTRACTIVE SYNTHESIS (Confidence: {response.answer.confidence} {response.answer.confidence_label}):")
    print(f"'{response.answer.answer}'")
    print(f"CITATIONS ({len(response.answer.citations)} verified):")
    for cit in response.answer.citations:
        print(f"  * [{cit.display_id}] (Auth {cit.authority}) {cit.title} - {cit.source}")

    print("\nTOP-5 RETRIEVED HITS:")
    for idx, hit in enumerate(response.hits, start=1):
        branches = " | ".join(f"{br.branch} #{br.rank}" for br in hit.branch_ranks) if hit.branch_ranks else "n/a"
        print(f"{idx}. [{hit.memory.kind.upper()}] (score: {hit.score}) {hit.memory.content[:70]}... [{branches}]")

    print("-" * 60)
    print(f"SPIKE S1 COMPLETE in {(time.perf_counter() - t_start):.2f}s")
    print("=" * 60)


if __name__ == "__main__":
    run_spike()
