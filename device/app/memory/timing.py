"""device/app/memory/timing.py — Latency measurement for search pipeline."""
import time
from contextlib import contextmanager
from dataclasses import dataclass

@dataclass
class TimingReport:
    embed_dense_ms: float = 0.0
    embed_sparse_ms: float = 0.0
    search_dense_ms: float = 0.0
    search_sparse_ms: float = 0.0
    fusion_ms: float = 0.0
    rerank_ms: float = 0.0
    answer_ms: float = 0.0
    total_ms: float = 0.0
    
    def to_dict(self) -> dict:
        return {k: round(v, 2) for k, v in self.__dict__.items()}

@contextmanager
def timed(report: TimingReport, field_name: str):
    start = time.perf_counter()
    yield
    elapsed_ms = (time.perf_counter() - start) * 1000
    setattr(report, field_name, elapsed_ms)
