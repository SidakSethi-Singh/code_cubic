from typing import Optional
from .store import InMemoryStore, QdrantMemoryStore, MemoryStoreProtocol, HAS_QDRANT

COLLECTION_NAME = "device_memories"
DENSE_VECTOR_SIZE = 384

# Payload index fields
PAYLOAD_INDEX_FIELDS = [
    "kind",
    "status",
    "sync_state",
    "asset_id",
    "site_id",
    "authority",
    "updated_at",
]


def init_store(data_dir: Optional[str] = None) -> MemoryStoreProtocol:
    """Factory to create a MemoryStoreProtocol implementation.
    Uses Qdrant if available; otherwise falls back to InMemoryStore.
    """
    if HAS_QDRANT:
        return QdrantMemoryStore(collection_name=COLLECTION_NAME, path=data_dir)
    return InMemoryStore()
