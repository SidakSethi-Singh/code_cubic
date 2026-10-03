from __future__ import annotations

import os
import logging
from pathlib import Path
from typing import NamedTuple

logger = logging.getLogger(__name__)

try:
    from fastembed import TextEmbedding, SparseTextEmbedding
    HAS_FASTEMBED = True
except ImportError:
    TextEmbedding = None
    SparseTextEmbedding = None
    HAS_FASTEMBED = False

from device.app.embed.dense import DenseEmbedder
from device.app.embed.sparse import SparseEmbedder


class SparseVectorData(NamedTuple):
    indices: list[int]
    values: list[float]


class EdgeEmbedder:
    _instance: EdgeEmbedder | None = None

    def __init__(self, cache_dir: str | Path | None = None):
        self.cache_dir = Path(cache_dir) if cache_dir else Path.home() / ".cache" / "edgemind_models"
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        os.environ["FASTEMBED_CACHE_PATH"] = str(self.cache_dir)

        self.dense_model_name = "BAAI/bge-small-en-v1.5"
        self.sparse_model_name = "Qdrant/bm25"
        self.dense_dim = 384

        self._fallback_dense = DenseEmbedder(model_name=self.dense_model_name)
        self._fallback_sparse = SparseEmbedder()

        self._dense_model = self._load_dense()
        self._sparse_model = self._load_sparse()

    def _load_dense(self):
        if not HAS_FASTEMBED:
            return None
        try:
            return TextEmbedding(
                model_name=self.dense_model_name,
                cache_dir=str(self.cache_dir),
                local_files_only=True
            )
        except Exception:
            try:
                return TextEmbedding(
                    model_name=self.dense_model_name,
                    cache_dir=str(self.cache_dir),
                    local_files_only=False
                )
            except Exception as e:
                logger.warning(f"FastEmbed dense load failed: {e}. Falling back to deterministic hashing.")
                return None

    def _load_sparse(self):
        if not HAS_FASTEMBED:
            return None
        try:
            return SparseTextEmbedding(
                model_name=self.sparse_model_name,
                cache_dir=str(self.cache_dir),
                local_files_only=True
            )
        except Exception:
            try:
                return SparseTextEmbedding(
                    model_name=self.sparse_model_name,
                    cache_dir=str(self.cache_dir),
                    local_files_only=False
                )
            except Exception as e:
                logger.warning(f"FastEmbed sparse load failed: {e}. Falling back to deterministic hashing.")
                return None

    @classmethod
    def get_instance(cls, cache_dir: str | Path | None = None) -> EdgeEmbedder:
        if cls._instance is None:
            cls._instance = cls(cache_dir=cache_dir)
        return cls._instance

    def embed_document(self, texts: list[str]) -> tuple[list[list[float]], list[SparseVectorData]]:
        if not texts:
            return [], []

        if self._dense_model is not None and self._sparse_model is not None:
            try:
                dense_gen = self._dense_model.embed(texts)
                dense_vectors = [v.tolist() for v in dense_gen]

                sparse_gen = self._sparse_model.embed(texts)
                sparse_vectors = [
                    SparseVectorData(indices=s.indices.tolist(), values=s.values.tolist())
                    for s in sparse_gen
                ]
                return dense_vectors, sparse_vectors
            except Exception as e:
                logger.warning(f"FastEmbed runtime error: {e}. Using deterministic fallback.")

        # Deterministic fallback
        dense_vectors = self._fallback_dense.embed(texts)
        sparse_pairs = self._fallback_sparse.embed(texts)
        sparse_vectors = [
            SparseVectorData(indices=idx_list, values=val_list)
            for idx_list, val_list in sparse_pairs
        ]
        return dense_vectors, sparse_vectors

    def embed_query(self, query: str) -> tuple[list[float], SparseVectorData]:
        if self._dense_model is not None and self._sparse_model is not None:
            try:
                dense_gen = self._dense_model.query_embed(query)
                dense_vector = list(dense_gen)[0].tolist()

                sparse_gen = self._sparse_model.query_embed(query)
                sparse_raw = list(sparse_gen)[0]
                sparse_vector = SparseVectorData(
                    indices=sparse_raw.indices.tolist(),
                    values=sparse_raw.values.tolist()
                )
                return dense_vector, sparse_vector
            except Exception as e:
                logger.warning(f"FastEmbed query embed failed: {e}. Using deterministic fallback.")

        # Deterministic fallback
        dense_vector = self._fallback_dense.embed_one(query)
        idx_list, val_list = self._fallback_sparse.embed_one(query)
        return dense_vector, SparseVectorData(indices=idx_list, values=val_list)

