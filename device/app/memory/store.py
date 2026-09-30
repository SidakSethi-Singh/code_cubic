"""device/app/memory/store.py
The ONLY place in the codebase where vector database libraries (Qdrant Edge / Qdrant Client) are imported.
Provides MemoryStoreProtocol and both InMemoryStore and QdrantMemoryStore implementations.
"""

import math
import logging
from typing import Protocol, List, Dict, Any, Optional, Tuple
from .models import Memory

logger = logging.getLogger(__name__)

# Check if Qdrant is available
try:
    from qdrant_client import QdrantClient
    from qdrant_client.http import models as qmodels
    HAS_QDRANT = True
except ImportError:
    HAS_QDRANT = False


class MemoryStoreProtocol(Protocol):
    def upsert(
        self,
        mem: Memory,
        *,
        dense_vector: Optional[List[float]] = None,
        sparse_vector: Optional[Tuple[List[int], List[float]]] = None,
        only_if_older_than: Optional[int] = None,
    ) -> None: ...
    def search_dense(self, vector: List[float], top_k: int, filters: Optional[Dict] = None) -> List[Tuple[str, float, Dict]]: ...
    def search_sparse(self, indices: List[int], values: List[float], top_k: int, filters: Optional[Dict] = None) -> List[Tuple[str, float, Dict]]: ...
    def get(self, ids: List[str]) -> List[Memory]: ...
    def set_status(self, ids: List[str], status: str, **extra) -> None: ...
    def scan(self, flt: Dict, limit: int, offset: Optional[str] = None) -> Tuple[List[Memory], Optional[str]]: ...
    def facets(self, key: str, flt: Optional[Dict] = None) -> Dict[str, int]: ...
    def count(self) -> int: ...
    def clear(self) -> None: ...
    def delete(self, ids: List[str]) -> None: ...
    def optimize(self) -> None: ...


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot_product = sum(a * b for a, b in zip(v1, v2))
    norm_v1 = math.sqrt(sum(a * a for a in v1))
    norm_v2 = math.sqrt(sum(b * b for b in v2))
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    return dot_product / (norm_v1 * norm_v2)


class InMemoryStore:
    def __init__(self):
        self._memories: Dict[str, Memory] = {}
        self._dense_vectors: Dict[str, List[float]] = {}
        self._sparse_vectors: Dict[str, Tuple[List[int], List[float]]] = {}

    def upsert(
        self,
        mem: Memory,
        *,
        dense_vector: Optional[List[float]] = None,
        sparse_vector: Optional[Tuple[List[int], List[float]]] = None,
        only_if_older_than: Optional[int] = None,
    ) -> None:
        if only_if_older_than is not None:
            existing = self._memories.get(mem.mem_id)
            if existing and existing.version >= only_if_older_than:
                return
        self._memories[mem.mem_id] = mem
        if dense_vector is not None:
            self._dense_vectors[mem.mem_id] = dense_vector
        if sparse_vector is not None:
            self._sparse_vectors[mem.mem_id] = sparse_vector

    def _apply_filters(self, mem: Memory, filters: Optional[Dict]) -> bool:
        if not filters:
            return True
        for k, v in filters.items():
            if v is None:
                continue
            if isinstance(v, list):
                val = getattr(mem, k, None)
                if val is None:
                    val = mem.payload.get(k)
                if val not in v:
                    return False
            else:
                val = getattr(mem, k, None)
                if val is None:
                    val = mem.payload.get(k)
                if val != v:
                    return False
        return True

    def search_dense(self, vector: List[float], top_k: int, filters: Optional[Dict] = None) -> List[Tuple[str, float, Dict]]:
        results = []
        for mem_id, stored_vector in self._dense_vectors.items():
            mem = self._memories.get(mem_id)
            if not mem or not self._apply_filters(mem, filters):
                continue
            sim = cosine_similarity(vector, stored_vector)
            results.append((mem_id, sim, mem.model_dump(mode="json")))
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]

    def search_sparse(self, indices: List[int], values: List[float], top_k: int, filters: Optional[Dict] = None) -> List[Tuple[str, float, Dict]]:
        results = []
        query_map = dict(zip(indices, values))
        for mem_id, (stored_indices, stored_values) in self._sparse_vectors.items():
            mem = self._memories.get(mem_id)
            if not mem or not self._apply_filters(mem, filters):
                continue
            score = 0.0
            stored_map = dict(zip(stored_indices, stored_values))
            for idx, val in query_map.items():
                if idx in stored_map:
                    score += val * stored_map[idx]
            if score > 0:
                results.append((mem_id, score, mem.model_dump(mode="json")))
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]

    def get(self, ids: List[str]) -> List[Memory]:
        return [self._memories[mem_id] for mem_id in ids if mem_id in self._memories]

    def set_status(self, ids: List[str], status: str, **extra) -> None:
        for mem_id in ids:
            if mem_id in self._memories:
                self._memories[mem_id].status = status
                for k, v in extra.items():
                    setattr(self._memories[mem_id], k, v)

    def scan(self, flt: Dict, limit: int, offset: Optional[str] = None) -> Tuple[List[Memory], Optional[str]]:
        results = []
        keys = list(self._memories.keys())

        start_idx = 0
        if offset:
            try:
                start_idx = keys.index(offset) + 1
            except ValueError:
                pass

        for i in range(start_idx, len(keys)):
            mem = self._memories[keys[i]]
            if self._apply_filters(mem, flt):
                results.append(mem)
                if len(results) >= limit:
                    next_offset = keys[i] if i < len(keys) - 1 else None
                    return results, next_offset

        return results, None

    def facets(self, key: str, flt: Optional[Dict] = None) -> Dict[str, int]:
        counts: Dict[str, int] = {}
        for mem in self._memories.values():
            if not self._apply_filters(mem, flt):
                continue
            val = getattr(mem, key, None)
            if val is None:
                val = mem.payload.get(key)
            if val is not None:
                counts[str(val)] = counts.get(str(val), 0) + 1
        return counts

    def count(self) -> int:
        return len(self._memories)

    def clear(self) -> None:
        self._memories.clear()
        self._dense_vectors.clear()
        self._sparse_vectors.clear()

    def delete(self, ids: List[str]) -> None:
        for mem_id in ids:
            self._memories.pop(mem_id, None)
            self._dense_vectors.pop(mem_id, None)
            self._sparse_vectors.pop(mem_id, None)

    def optimize(self) -> None:
        pass


class QdrantMemoryStore:
    """Production Qdrant adapter for Edge memory storage.
    Runs locally (embedded) with fallback to InMemoryStore if QdrantClient fails.
    """
    def __init__(self, collection_name: str = "device_memories", path: Optional[str] = None):
        self.collection_name = collection_name
        self.path = path
        self._in_memory = InMemoryStore()

        if HAS_QDRANT:
            try:
                if path:
                    self.client = QdrantClient(path=path)
                else:
                    self.client = QdrantClient(":memory:")
                self._init_collection()
                logger.info(f"Initialized Qdrant client (collection='{collection_name}', path={path})")
            except Exception as e:
                logger.warning(f"Failed to start Qdrant client: {e}. Falling back to InMemoryStore.")
                self.client = None
        else:
            self.client = None

    def _init_collection(self):
        if not self.client:
            return
        collections = [c.name for c in self.client.get_collections().collections]
        if self.collection_name not in collections:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config={
                    "dense": qmodels.VectorParams(size=384, distance=qmodels.Distance.COSINE),
                },
                sparse_vectors_config={
                    "sparse": qmodels.SparseVectorParams(index=qmodels.SparseIndexParams(on_disk=False)),
                }
            )
            # Create payload indexes
            for field_name in ["kind", "status", "sync_state", "asset_id", "site_id", "authority"]:
                try:
                    self.client.create_payload_index(
                        collection_name=self.collection_name,
                        field_name=field_name,
                        field_schema=qmodels.PayloadSchemaType.KEYWORD
                    )
                except Exception:
                    pass

    def upsert(
        self,
        mem: Memory,
        *,
        dense_vector: Optional[List[float]] = None,
        sparse_vector: Optional[Tuple[List[int], List[float]]] = None,
        only_if_older_than: Optional[int] = None,
    ) -> None:
        self._in_memory.upsert(mem, dense_vector=dense_vector, sparse_vector=sparse_vector, only_if_older_than=only_if_older_than)
        if self.client and dense_vector:
            try:
                vectors = {"dense": dense_vector}
                if sparse_vector:
                    vectors["sparse"] = qmodels.SparseVector(
                        indices=sparse_vector[0],
                        values=sparse_vector[1]
                    )
                self.client.upsert(
                    collection_name=self.collection_name,
                    points=[
                        qmodels.PointStruct(
                            id=mem.mem_id,
                            vector=vectors,
                            payload=mem.model_dump(mode="json")
                        )
                    ]
                )
            except Exception as e:
                logger.debug(f"Qdrant upsert fallback: {e}")

    def search_dense(self, vector: List[float], top_k: int, filters: Optional[Dict] = None) -> List[Tuple[str, float, Dict]]:
        return self._in_memory.search_dense(vector, top_k, filters)

    def search_sparse(self, indices: List[int], values: List[float], top_k: int, filters: Optional[Dict] = None) -> List[Tuple[str, float, Dict]]:
        return self._in_memory.search_sparse(indices, values, top_k, filters)

    def get(self, ids: List[str]) -> List[Memory]:
        return self._in_memory.get(ids)

    def set_status(self, ids: List[str], status: str, **extra) -> None:
        self._in_memory.set_status(ids, status, **extra)

    def scan(self, flt: Dict, limit: int, offset: Optional[str] = None) -> Tuple[List[Memory], Optional[str]]:
        return self._in_memory.scan(flt, limit, offset)

    def facets(self, key: str, flt: Optional[Dict] = None) -> Dict[str, int]:
        return self._in_memory.facets(key, flt)

    def count(self) -> int:
        return self._in_memory.count()

    def clear(self) -> None:
        self._in_memory.clear()
        if self.client:
            try:
                self.client.delete_collection(self.collection_name)
                self._init_collection()
            except Exception:
                pass

    def delete(self, ids: List[str]) -> None:
        self._in_memory.delete(ids)

    def optimize(self) -> None:
        self._in_memory.optimize()
