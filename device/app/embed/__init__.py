"""device/app/embed — embedding providers for EdgeMind."""
from .dense import DenseEmbedder
from .sparse import SparseEmbedder
from typing import Optional

_dense: Optional[DenseEmbedder] = None
_sparse: Optional[SparseEmbedder] = None

def get_dense(model_name: str = "BAAI/bge-small-en-v1.5", cache_dir: Optional[str] = None) -> DenseEmbedder:
    global _dense
    if _dense is None:
        _dense = DenseEmbedder(model_name=model_name, cache_dir=cache_dir)
    return _dense

def get_sparse() -> SparseEmbedder:
    global _sparse
    if _sparse is None:
        _sparse = SparseEmbedder()
    return _sparse
