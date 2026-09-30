from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


class PolicyFactors(BaseModel):
    has_pii: bool = False
    size_bytes: int = 0
    size_over_budget: bool = False
    duplicate_factor: float = 0.0  # -1.0 to 1.0
    authority_factor: float = 0.0  # 0.0 to 1.0
    novelty_factor: float = 0.0    # 0.0 to 1.0
    vagueness_factor: float = 0.0  # -1.0 to 0.0
    raw_score: float = 0.0


class Decision(BaseModel):
    action: str  # "local_only" | "share" | "hold"
    score: float
    factors: PolicyFactors
    reason: str
    override: dict[str, Any] | None = None
