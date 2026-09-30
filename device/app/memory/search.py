"""device/app/memory/search.py — Hybrid search: dense + BM25 + RRF fusion."""

import time
from device.app.memory.models import SearchRequest, SearchResponse, Hit
from device.app.memory.store import InMemoryStore
from device.app.embed.dense import DenseEmbedder
from device.app.embed.sparse import SparseEmbedder
from device.app.memory.timing import TimingReport, timed

class HybridSearcher:
    def __init__(self, store: InMemoryStore, dense_embedder: DenseEmbedder, sparse_embedder: SparseEmbedder):
        self.store = store
        self.dense_embedder = dense_embedder
        self.sparse_embedder = sparse_embedder

    def search(self, request: SearchRequest) -> SearchResponse:
        start_time = time.perf_counter()
        report = TimingReport()
        
        # 1. Embed the query
        with timed(report, "embed_dense_ms"):
            dense_vec = self.dense_embedder.embed_one(request.query)
        with timed(report, "embed_sparse_ms"):
            sparse_indices, sparse_values = self.sparse_embedder.embed_one(request.query)

        search_k = request.top_k * 2

        # 2. Run dense search
        with timed(report, "search_dense_ms"):
            dense_results = self.store.search_dense(dense_vec, search_k)
            
        # 3. Run sparse search
        with timed(report, "search_sparse_ms"):
            sparse_results = self.store.search_sparse(sparse_indices, sparse_values, search_k)

        # 4. Fuse results using RRF
        with timed(report, "fusion_ms"):
            rrf_scores = {}
            dense_ranks = {}
            sparse_ranks = {}
            k_rrf = 60
            
            for rank, (mem_id, score, payload) in enumerate(dense_results):
                dense_ranks[mem_id] = rank + 1
                rrf_scores[mem_id] = rrf_scores.get(mem_id, 0.0) + 1.0 / (k_rrf + rank + 1)
                
            for rank, (mem_id, score, payload) in enumerate(sparse_results):
                sparse_ranks[mem_id] = rank + 1
                rrf_scores[mem_id] = rrf_scores.get(mem_id, 0.0) + 1.0 / (k_rrf + rank + 1)

        # 5 & 6. Apply filters and status-aware re-ranking
        with timed(report, "rerank_ms"):
            fused_results = []
            mem_ids = list(rrf_scores.keys())
            memories = {mem.mem_id: mem for mem in self.store.get(mem_ids)}
            
            for mem_id, rrf_score in rrf_scores.items():
                mem = memories.get(mem_id)
                if not mem: continue
                
                # Apply filters
                if request.kind_filter and mem.kind not in request.kind_filter: continue
                if request.status_filter and mem.status not in request.status_filter: continue
                if request.site_id and mem.site_id != request.site_id: continue
                if request.asset_id and mem.asset_id != request.asset_id: continue
                if request.min_authority is not None and mem.authority < request.min_authority: continue
                
                # Apply status-aware re-ranking
                score = rrf_score
                if mem.status == "active":
                    score *= 1.0
                elif mem.status == "disputed":
                    score *= 0.7
                elif mem.status == "superseded":
                    score *= 0.3
                
                # Boost by authority
                score *= (1 + 0.1 * mem.authority)
                
                fused_results.append((mem_id, score, mem))
            
            fused_results.sort(key=lambda x: x[1], reverse=True)
            top_results = fused_results[:request.top_k]
            
        hits = []
        fused_ranks = {}
        for rank, (mem_id, score, mem) in enumerate(top_results):
            fused_ranks[mem_id] = rank + 1
            hit = Hit(
                mem_id=mem_id,
                score=score,
                content_snippet=mem.content[:200] + ("..." if len(mem.content) > 200 else ""),
                kind=mem.kind,
                status=mem.status,
                authority=mem.authority,
                asset_id=mem.asset_id,
                site_id=mem.site_id,
                dense_rank=dense_ranks.get(mem_id),
                bm25_rank=sparse_ranks.get(mem_id)
            )
            hits.append(hit)

        report.total_ms = (time.perf_counter() - start_time) * 1000
        
        explain_data = None
        if request.explain:
            explain_data = {
                "dense_ranks": dense_ranks,
                "bm25_ranks": sparse_ranks,
                "fused_ranks": fused_ranks,
                "timing": report.to_dict()
            }

        return SearchResponse(
            hits=hits,
            answer="",
            citations=[],
            confidence=0.0,
            latency_ms=report.total_ms,
            explain=explain_data
        )
