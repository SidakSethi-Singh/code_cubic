"""device/app/embed/dense.py — Dense vector embeddings via FastEmbed.
Fallback to deterministic hash-based embedding if offline or fastembed unavailable.
"""

import os
import logging
import hashlib
from typing import List, Optional

logger = logging.getLogger(__name__)

USE_FASTEMBED_ENV = os.environ.get("USE_FASTEMBED", "auto").lower()

try:
    from fastembed import TextEmbedding
    HAS_FASTEMBED = True
except ImportError:
    HAS_FASTEMBED = False


class DenseEmbedder:
    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5", cache_dir: Optional[str] = None):
        self.model_name = model_name
        self.dimension = 384
        self.model = None

        if HAS_FASTEMBED and USE_FASTEMBED_ENV in ("true", "1", "yes"):
            try:
                logger.info(f"Initializing FastEmbed with model: {model_name}")
                self.model = TextEmbedding(model_name=model_name, cache_dir=cache_dir)
            except Exception as e:
                logger.warning(f"FastEmbed init failed: {e}. Falling back to deterministic dense embeddings.")
                self.model = None
        else:
            logger.info("Using deterministic hash-based dense embedder (offline-first).")

    def embed(self, texts: List[str]) -> List[List[float]]:
        if self.model is not None:
            try:
                embeddings = list(self.model.embed(texts))
                return [emb.tolist() for emb in embeddings]
            except Exception as e:
                logger.warning(f"FastEmbed runtime error: {e}. Using deterministic fallback.")
                return [self._hash_embed(text) for text in texts]
        else:
            return [self._hash_embed(text) for text in texts]

    def embed_one(self, text: str) -> List[float]:
        return self.embed([text])[0]

    def _hash_embed(self, text: str) -> List[float]:
        """Generate a deterministic 384-dim semantic representation from token hashing."""
        vector = [0.0] * self.dimension
        words = [w.lower().strip(".,!?\"'()[]{}") for w in text.split() if w.strip()]
        if not words:
            vector[0] = 1.0
            return vector

        # Term frequency + position hash for dense semantic representation
        for idx, word in enumerate(words):
            word_hash = hashlib.sha256(word.encode("utf-8")).digest()
            bucket1 = int.from_bytes(word_hash[:4], "big") % self.dimension
            bucket2 = int.from_bytes(word_hash[4:8], "big") % self.dimension
            weight = 1.0 / (1.0 + 0.1 * idx)
            vector[bucket1] += weight
            vector[bucket2] += weight * 0.5

        # Normalize to unit length
        norm = sum(x * x for x in vector) ** 0.5
        if norm > 0:
            vector = [x / norm for x in vector]
        else:
            vector[0] = 1.0
        return vector
