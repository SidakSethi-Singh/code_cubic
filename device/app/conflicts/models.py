from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from pydantic import BaseModel, Field


class LineageEntry(BaseModel):
    mem_id: str
    version: int
    action: str  # "created" | "superseded" | "disputed" | "tombstoned" | "annotated" | "converged"
    reason: str
    at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ConflictOutcome(BaseModel):
    conflict_id: str
    rule: str  # "C1" | "C2" | "C3" | "C4"
    winner: Any | None = None  # Winning Memory or None
    loser: Any | None = None   # Losing / Disputed Memory or None
    action: str  # "accept_winner" | "mark_disputed" | "reject_edit" | "human_review"
    reason: str
    lineage: list[LineageEntry] = Field(default_factory=list)
    rule_trail: list[str] = Field(default_factory=list)
