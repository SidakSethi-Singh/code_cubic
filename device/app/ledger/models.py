"""device/app/ledger/models.py — plain dataclasses, no ORM, no deps."""
from dataclasses import dataclass, field
from typing import Optional
import time, uuid

@dataclass
class Decision:
    mem_id: str
    outcome: str
    score: float
    factors: dict
    reason: str
    created_at: float = field(default_factory=time.time)

@dataclass
class OutboxItem:
    mem_id: str
    op_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "pending"
    bytes: int = 0
    created_at: float = field(default_factory=time.time)
    synced_at: Optional[float] = None

@dataclass
class Conflict:
    mem_id_a: str
    mem_id_b: str
    conflict_type: str
    resolution: Optional[str] = None
    status: str = "open"
    lineage: Optional[dict] = None
    created_at: float = field(default_factory=time.time)