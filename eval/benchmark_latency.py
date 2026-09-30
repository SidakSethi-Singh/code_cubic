import json
import os
import shutil
import sys
import tempfile
import time
from pathlib import Path
import numpy as np

# Ensure repo root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from device.app.embed.embedder import EdgeEmbedder
from device.app.ingest.pipeline import IngestPipeline
from device.app.memory.models import Memory
from device.app.memory.store import QdrantEdgeMemoryStore
from device.app.api.search import SearchService


def run_benchmark_for_scale(scale_size: int, embedder: EdgeEmbedder):
    print(f"\n--- Running Benchmark at {scale_size} points ---")
    tmp_dir = tempfile.mkdtemp()
    try:
        store = QdrantEdgeMemoryStore(base_dir=tmp_dir, embedder=embedder)
        pipeline = IngestPipeline(store=store, embedder=embedder)
        search_svc = SearchService(store=store)

        # Generate synthetic points
        equipment = ["P-204", "C-102", "T-34", "V-109", "M-50"]
        symptoms = ["grinding noise", "bearing overheating", "suction cavitation", "seal leakage", "vibration harmonics"]
        actions = ["retorqued bolts 145 Nm", "flushed seal barrier line", "replaced roller bearing", "adjusted shims 0.45mm"]

        texts = []
        for i in range(scale_size):
            eq = equipment[i % len(equipment)]
            sym = symptoms[i % len(symptoms)]
            act = actions[i % len(actions)]
            t = f"Asset {eq} telemetry log #{i}: observed {sym} at high load. Recommended action: {act}."
            texts.append((i, eq, t))

        # Batch embed and insert
        batch_size = 100
        t0_ingest = time.perf_counter()
        for b in range(0, scale_size, batch_size):
            batch = texts[b : b + batch_size]
            dense_vecs, sparse_vecs = embedder.embed_document([x[2] for x in batch])
            for idx, (i, eq, txt) in enumerate(batch):
                mem = Memory(
                    mem_id=f"10000000-0000-0000-0000-{i:012d}",
                    version=1,
                    content=txt,
                    content_hash=pipeline.extractor.compute_content_hash(txt),
                    kind="manual" if i % 4 == 0 else "incident",
                    status="active",
                    sync_state="synced",
                    scope="site",
                    authority=3 if i % 4 == 0 else 2,
                    site_id="Plant North",
                    asset_id=eq,
                    source_device="Device A",
                    vectors={"dense": dense_vecs[idx], "bm25": sparse_vecs[idx]},
                )
                store.upsert(mem)

        store.optimize()
        ingest_time = time.perf_counter() - t0_ingest
        print(f"Loaded and indexed {scale_size} points in {ingest_time:.2f}s")

        # Warmup (5 queries)
        queries = [
            "P-204 grinding noise at high load",
            "C-102 bearing overheating above 85 C",
            "T-34 suction cavitation 4.2mm/s vibration",
            "V-109 seal leakage barrier pressure",
            "M-50 eccentric shaft deflection 0.38mm"
        ]
        for q in queries:
            search_svc.execute_search(q, limit=5, explain=True)

        # Benchmark 50 query runs
        latencies = []
        for run_idx in range(50):
            q = queries[run_idx % len(queries)]
            t_start = time.perf_counter()
            res = search_svc.execute_search(q, limit=5, explain=False)
            elapsed_ms = (time.perf_counter() - t_start) * 1000.0
            latencies.append(elapsed_ms)

        latencies = np.array(latencies)
        p50 = np.percentile(latencies, 50)
        p90 = np.percentile(latencies, 90)
        p95 = np.percentile(latencies, 95)
        p99 = np.percentile(latencies, 99)
        mean_lat = np.mean(latencies)

        print(f"Results for {scale_size} points:")
        print(f"  * Mean: {mean_lat:.2f} ms")
        print(f"  * p50 (Median): {p50:.2f} ms")
        print(f"  * p90: {p90:.2f} ms")
        print(f"  * p95: {p95:.2f} ms")
        print(f"  * p99: {p99:.2f} ms")

        return {"scale": scale_size, "p50": round(float(p50), 2), "p95": round(float(p95), 2), "mean": round(float(mean_lat), 2)}
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


if __name__ == "__main__":
    embedder = EdgeEmbedder.get_instance()
    # Run at 1k points
    r_1k = run_benchmark_for_scale(1000, embedder)
    # Run at 10k points (or 3k for rapid CI benchmark)
    r_10k = run_benchmark_for_scale(3000, embedder)

    benchmark_summary = {
        "benchmarks": [r_1k, r_10k],
        "hardware": "Local Edge Device",
        "vector_dims": 384,
        "hybrid_fusion": "RRF (Dense + BM25)",
        "network_calls": 0
    }
    out_path = Path("eval/benchmark_results.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(benchmark_summary, f, indent=2)
    print(f"\nWrote benchmark results to {out_path}")
