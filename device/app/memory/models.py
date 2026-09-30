from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Protocol, runtime_checkable
from pydantic import BaseModel, Field


class Memory(BaseModel):
    mem_id: str
    version: int = 1
    content: str
    content_hash: str
    kind: str  # note | manual | bulletin | incident | sensor | fix
    status: str = "active"  # active | superseded | disputed | tombstoned
    sync_state: str = "local_only"  # local_only | pending | held | synced | conflict
    scope: str = "device"  # device | site | fleet
    authority: int = 0  # 0=user note ... 3=official bulletin
    site_id: str
    asset_id: str | None = None
    asset_type: str | None = None
    source_device: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
    vectors: dict[str, Any] = Field(default_factory=dict)


class BranchRank(BaseModel):
    branch: str  # "dense" | "bm25"
    rank: int
    score: float


class Hit(BaseModel):
    mem_id: str
    score: float
    memory: Memory
    branch_ranks: list[BranchRank] = Field(default_factory=list)
    fused_score: float = 0.0
    shard: str = "device_memory"


class SearchRequest(BaseModel):
    query: str
    limit: int = 5
    explain: bool = False
    filters: dict[str, Any] | None = None
    min_confidence: float = 0.0


@runtime_checkable
class MemoryStore(Protocol):
    def upsert(self, mem: Memory, *, only_if_older_than: int | None = None) -> None: ...
    def search(self, req: SearchRequest) -> list[Hit]: ...
    def get(self, ids: list[str]) -> list[Memory]: ...
    def set_status(self, ids: list[str], status: str, **extra: Any) -> None: ...
    def scan(self, flt: dict[str, Any], limit: int, offset: str | None = None) -> tuple[list[Memory], str | None]: ...
    def facets(self, key: str, flt: dict[str, Any] | None = None) -> dict[str, int]: ...
    def optimize(self) -> None: ...
