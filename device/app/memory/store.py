from __future__ import annotations

import os
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# ONLY file in the repo allowed to import qdrant_edge
import qdrant_edge

from device.app.memory.models import (
    BranchRank,
    Hit,
    Memory,
    MemoryStore,
    SearchRequest,
)
from device.app.embed.embedder import EdgeEmbedder


class QdrantEdgeMemoryStore:
    def __init__(self, base_dir: str | Path | None = None, embedder: EdgeEmbedder | None = None):
        self.base_dir = Path(base_dir) if base_dir else Path("data/shards")
        self.base_dir.mkdir(parents=True, exist_ok=True)

        self.device_shard_path = self.base_dir / "device_memory"
        self.fleet_shard_path = self.base_dir / "fleet_mirror"

        self.embedder = embedder or EdgeEmbedder.get_instance()
        self.dense_dim = self.embedder.dense_dim

        self.device_shard = self._init_shard(self.device_shard_path)
        self.fleet_shard = self._init_shard(self.fleet_shard_path)

        self._ensure_payload_indexes(self.device_shard)
        self._ensure_payload_indexes(self.fleet_shard)

    def _get_config(self) -> qdrant_edge.EdgeConfig:
        return qdrant_edge.EdgeConfig(
            vectors={
                "dense": qdrant_edge.EdgeVectorParams(
                    size=self.dense_dim,
                    distance=qdrant_edge.Distance.Cosine,
                )
            },
            sparse_vectors={
                "bm25": qdrant_edge.EdgeSparseVectorParams(
                    modifier=qdrant_edge.Modifier.Idf
                )
            },
        )

    def _init_shard(self, path: Path) -> qdrant_edge.EdgeShard:
        path.mkdir(parents=True, exist_ok=True)
        # Check if directory already has segment data
        has_data = any(path.iterdir())
        if has_data:
            try:
                return qdrant_edge.EdgeShard.load(str(path))
            except Exception:
                return qdrant_edge.EdgeShard.load(str(path), self._get_config())
        else:
            return qdrant_edge.EdgeShard.create(str(path), self._get_config())

    def _ensure_payload_indexes(self, shard: qdrant_edge.EdgeShard) -> None:
        keyword_fields = ["kind", "status", "sync_state", "scope", "asset_id", "asset_type", "site_id"]
        for field in keyword_fields:
            try:
                shard.update(
                    qdrant_edge.UpdateOperation.create_field_index(
                        field, qdrant_edge.PayloadSchemaType.Keyword
                    )
                )
            except Exception:
                pass

        try:
            shard.update(
                qdrant_edge.UpdateOperation.create_field_index(
                    "authority", qdrant_edge.PayloadSchemaType.Integer
                )
            )
        except Exception:
            pass

        try:
            shard.update(
                qdrant_edge.UpdateOperation.create_field_index(
                    "updated_at", qdrant_edge.PayloadSchemaType.Datetime
                )
            )
        except Exception:
            pass

    def _record_to_memory(self, record: Any) -> Memory:
        p = dict(record.payload or {})
        created_at = p.get("created_at")
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        elif not created_at:
            created_at = datetime.now(timezone.utc)

        updated_at = p.get("updated_at")
        if isinstance(updated_at, str):
            updated_at = datetime.fromisoformat(updated_at)
        elif not updated_at:
            updated_at = datetime.now(timezone.utc)

        expires_at = p.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)

        return Memory(
            mem_id=str(record.id),
            version=int(p.get("version", 1)),
            content=str(p.get("content", "")),
            content_hash=str(p.get("content_hash", "")),
            kind=str(p.get("kind", "note")),
            status=str(p.get("status", "active")),
            sync_state=str(p.get("sync_state", "local_only")),
            scope=str(p.get("scope", "device")),
            authority=int(p.get("authority", 0)),
            site_id=str(p.get("site_id", "")),
            asset_id=p.get("asset_id"),
            asset_type=p.get("asset_type"),
            source_device=str(p.get("source_device", "")),
            created_at=created_at,
            updated_at=updated_at,
            expires_at=expires_at,
            payload=p.get("extra_payload", {}),
        )

    def _memory_to_payload(self, mem: Memory) -> dict[str, Any]:
        return {
            "version": mem.version,
            "content": mem.content,
            "content_hash": mem.content_hash,
            "kind": mem.kind,
            "status": mem.status,
            "sync_state": mem.sync_state,
            "scope": mem.scope,
            "authority": mem.authority,
            "site_id": mem.site_id,
            "asset_id": mem.asset_id,
            "asset_type": mem.asset_type,
            "source_device": mem.source_device,
            "created_at": mem.created_at.isoformat(),
            "updated_at": mem.updated_at.isoformat(),
            "expires_at": mem.expires_at.isoformat() if mem.expires_at else None,
            "extra_payload": mem.payload,
        }

    def upsert(
        self,
        mem: Memory,
        *,
        only_if_older_than: int | None = None,
        shard_name: str = "device_memory",
    ) -> None:
        target_shard = self.device_shard if shard_name == "device_memory" else self.fleet_shard

        if only_if_older_than is not None:
            existing = target_shard.retrieve([mem.mem_id], with_payload=True, with_vector=False)
            if existing:
                curr_ver = int(existing[0].payload.get("version", 0))
                if curr_ver >= only_if_older_than:
                    return

        dense_vec = mem.vectors.get("dense")
        bm25_vec = mem.vectors.get("bm25")

        if dense_vec is None or bm25_vec is None:
            dense_list, sparse_list = self.embedder.embed_document([mem.content])
            dense_vec = dense_list[0]
            bm25_vec = sparse_list[0]
            mem.vectors["dense"] = dense_vec
            mem.vectors["bm25"] = bm25_vec

        if isinstance(bm25_vec, dict):
            sparse_obj = qdrant_edge.SparseVector(
                indices=bm25_vec["indices"],
                values=bm25_vec["values"],
            )
        elif hasattr(bm25_vec, "indices") and hasattr(bm25_vec, "values"):
            sparse_obj = qdrant_edge.SparseVector(
                indices=list(bm25_vec.indices),
                values=list(bm25_vec.values),
            )
        else:
            sparse_obj = bm25_vec

        point = qdrant_edge.Point(
            id=mem.mem_id,
            vector={
                "dense": dense_vec,
                "bm25": sparse_obj,
            },
            payload=self._memory_to_payload(mem),
        )

        target_shard.update(qdrant_edge.UpdateOperation.upsert_points([point]))

    @staticmethod
    def _is_valid_point_id(point_id: Any) -> bool:
        try:
            uuid.UUID(str(point_id))
            return True
        except ValueError:
            return False

    def get(self, ids: list[str]) -> list[Memory]:
        if not ids:
            return []
        valid_ids = [i for i in ids if self._is_valid_point_id(i)]
        if not valid_ids:
            return []
        found_map: dict[str, Memory] = {}

        # Check device_memory first (P0)
        try:
            recs_dev = self.device_shard.retrieve(valid_ids, with_payload=True, with_vector=False)
            for r in recs_dev:
                m = self._record_to_memory(r)
                found_map[m.mem_id] = m
        except Exception:
            pass

        missing_ids = [i for i in valid_ids if i not in found_map]
        if missing_ids:
            try:
                recs_fleet = self.fleet_shard.retrieve(missing_ids, with_payload=True, with_vector=False)
                for r in recs_fleet:
                    m = self._record_to_memory(r)
                    found_map[m.mem_id] = m
            except Exception:
                pass

        return [found_map[i] for i in ids if i in found_map]

    def set_status(self, ids: list[str], status: str, **extra: Any) -> None:
        if not ids:
            return
        valid_ids = [i for i in ids if self._is_valid_point_id(i)]
        if not valid_ids:
            return
        update_data = {"status": status, "updated_at": datetime.now(timezone.utc).isoformat(), **extra}
        for shard in [self.device_shard, self.fleet_shard]:
            try:
                existing = shard.retrieve(valid_ids, with_payload=False, with_vector=False)
                existing_ids = [str(r.id) for r in existing]
                if existing_ids:
                    shard.update(qdrant_edge.UpdateOperation.set_payload(existing_ids, update_data))
            except Exception:
                pass

    def scan(
        self,
        flt: dict[str, Any] | None = None,
        limit: int = 100,
        offset: str | None = None,
    ) -> tuple[list[Memory], str | None]:
        scroll_req = qdrant_edge.ScrollRequest(
            offset=offset,
            limit=limit,
            with_payload=True,
            with_vector=False,
        )
        records, next_offset = self.device_shard.scroll(scroll_req)
        memories = [self._record_to_memory(r) for r in records]

        if flt:
            filtered = []
            for m in memories:
                match = True
                for k, v in flt.items():
                    if getattr(m, k, None) != v and m.payload.get(k) != v:
                        match = False
                        break
                if match:
                    filtered.append(m)
            memories = filtered

        return memories, next_offset

    def facets(self, key: str, flt: dict[str, Any] | None = None) -> dict[str, int]:
        try:
            req = qdrant_edge.FacetRequest(key=key, limit=100)
            resp = self.device_shard.facet(req)
            result: dict[str, int] = {}
            for hit in resp.hits:
                result[str(hit.value)] = int(hit.count)
            return result
        except Exception:
            mems, _ = self.scan(limit=1000)
            res: dict[str, int] = {}
            for m in mems:
                val = getattr(m, key, None) or m.payload.get(key)
                if val is not None:
                    res[str(val)] = res.get(str(val), 0) + 1
            return res

    def optimize(self) -> None:
        try:
            self.device_shard.optimize()
        except Exception:
            pass
        try:
            self.fleet_shard.optimize()
        except Exception:
            pass

    def search(self, req: SearchRequest) -> list[Hit]:
        q_dense, q_bm25_data = self.embedder.embed_query(req.query)
        q_sparse = qdrant_edge.SparseVector(
            indices=q_bm25_data.indices,
            values=q_bm25_data.values,
        )

        all_hits: dict[str, Hit] = {}

        # Search both shards: device_memory (P0) and fleet_mirror (P1)
        for shard_name, shard in [("device_memory", self.device_shard), ("fleet_mirror", self.fleet_shard)]:
            try:
                # 1. Branch: Dense
                dense_prefetch = qdrant_edge.Prefetch(
                    limit=max(req.limit * 3, 20),
                    query=qdrant_edge.Query.Nearest(q_dense, using="dense"),
                )
                # 2. Branch: BM25
                bm25_prefetch = qdrant_edge.Prefetch(
                    limit=max(req.limit * 3, 20),
                    query=qdrant_edge.Query.Nearest(q_sparse, using="bm25"),
                )

                # Execute RRF fusion on edge
                fusion_query = qdrant_edge.QueryRequest(
                    limit=max(req.limit * 3, 20),
                    query=qdrant_edge.Fusion.Rrf(k=60),
                    prefetches=[dense_prefetch, bm25_prefetch],
                    with_payload=True,
                )
                fused_results = shard.query(fusion_query)

                # If explain requested, also get single branch ranks
                dense_ranks: dict[str, tuple[int, float]] = {}
                bm25_ranks: dict[str, tuple[int, float]] = {}
                if req.explain:
                    qr_d = qdrant_edge.QueryRequest(
                        limit=30,
                        query=qdrant_edge.Query.Nearest(q_dense, using="dense"),
                        with_payload=False,
                    )
                    res_d = shard.query(qr_d)
                    for rk, pt in enumerate(res_d, start=1):
                        dense_ranks[str(pt.id)] = (rk, float(pt.score))

                    qr_b = qdrant_edge.QueryRequest(
                        limit=30,
                        query=qdrant_edge.Query.Nearest(q_sparse, using="bm25"),
                        with_payload=False,
                    )
                    res_b = shard.query(qr_b)
                    for rk, pt in enumerate(res_b, start=1):
                        bm25_ranks[str(pt.id)] = (rk, float(pt.score))

                for r in fused_results:
                    mid = str(r.id)
                    # Dedupe: device_memory (P0) wins over fleet_mirror (P1)
                    if mid in all_hits and shard_name == "fleet_mirror":
                        continue

                    mem = self._record_to_memory(r)
                    if req.filters:
                        m_match = True
                        for fk, fv in req.filters.items():
                            if getattr(mem, fk, None) != fv and mem.payload.get(fk) != fv:
                                m_match = False
                                break
                        if not m_match:
                            continue

                    branch_ranks: list[BranchRank] = []
                    if req.explain:
                        d_rk, d_sc = dense_ranks.get(mid, (99, 0.0))
                        b_rk, b_sc = bm25_ranks.get(mid, (99, 0.0))
                        branch_ranks = [
                            BranchRank(branch="dense", rank=d_rk, score=d_sc),
                            BranchRank(branch="bm25", rank=b_rk, score=b_sc),
                        ]

                    fused_score = float(r.score)
                    d_sc = dense_ranks.get(mid, (99, 0.0))[1]
                    b_sc = bm25_ranks.get(mid, (99, 0.0))[1]

                    authority_multiplier = 1.0 + (mem.authority * 0.05)
                    status_multiplier = 0.7 if mem.status in ("superseded", "disputed") else 1.0

                    if d_sc < 0.16 or (d_sc < 0.20 and b_sc < 0.45):
                        # Weak match: accidental term collision or low semantic alignment
                        raw_sim = max(d_sc, b_sc * 0.5)
                        normalized_score = max(0.08, min(0.38, raw_sim * 1.2))
                    else:
                        # Solid match: scale with RRF fused score
                        normalized_score = min(0.99, (fused_score / 0.033) * 0.90 * authority_multiplier * status_multiplier)

                    all_hits[mid] = Hit(
                        mem_id=mid,
                        score=round(normalized_score, 3),
                        memory=mem,
                        branch_ranks=branch_ranks,
                        fused_score=round(fused_score, 4),
                        shard=shard_name,
                    )
            except Exception as e:
                # Shard query error fallback
                continue

        # Sort combined hits by final score descending
        sorted_hits = sorted(all_hits.values(), key=lambda h: h.score, reverse=True)
        return sorted_hits[:req.limit]
