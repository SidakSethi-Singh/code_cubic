import hashlib
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel, Field

class Memory(BaseModel):
    mem_id: str
    version: int = 1
    content: str
    content_hash: str
    kind: str
    status: str = "active"
    sync_state: str = "pending"
    scope: str = "device"
    authority: int = 0
    site_id: str
    asset_id: str | None = None
    asset_type: str | None = None
    source_device: str
    created_at: datetime
    updated_at: datetime
    expires_at: datetime | None = None
    payload: dict = Field(default_factory=dict)

class SearchRequest(BaseModel):
    query: str
    top_k: int = 10
    kind_filter: list[str] | None = None
    status_filter: list[str] | None = None
    site_id: str | None = None
    asset_id: str | None = None
    min_authority: int | None = None
    explain: bool = False

class Hit(BaseModel):
    mem_id: str
    score: float
    content_snippet: str
    kind: str
    status: str
    authority: int
    asset_id: str | None = None
    site_id: str | None = None
    dense_rank: int | None = None
    bm25_rank: int | None = None

class SearchResponse(BaseModel):
    hits: list[Hit]
    answer: str
    citations: list[dict]
    confidence: float
    latency_ms: float
    explain: dict | None = None

def make_content_hash(content: str) -> str:
    """Generate SHA256 hash of the content."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()

def create_memory(content: str, kind: str, site_id: str, source_device: str, **kwargs) -> Memory:
    """Factory function to create a new Memory."""
    now = datetime.now(timezone.utc)
    return Memory(
        mem_id=str(uuid.uuid4()),
        content=content,
        content_hash=make_content_hash(content),
        kind=kind,
        site_id=site_id,
        source_device=source_device,
        created_at=now,
        updated_at=now,
        **kwargs
    )
