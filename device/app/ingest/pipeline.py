from __future__ import annotations

import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from device.app.embed.embedder import EdgeEmbedder
from device.app.ingest.extractors import PatternExtractor
from device.app.memory.models import Memory, MemoryStore


class IngestPipeline:
    def __init__(
        self,
        store: MemoryStore,
        embedder: EdgeEmbedder | None = None,
        extractor: PatternExtractor | None = None,
    ):
        self.store = store
        self.embedder = embedder or EdgeEmbedder.get_instance()
        self.extractor = extractor or PatternExtractor()

    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
        text = text.strip()
        if len(text) <= chunk_size:
            return [text]
        words = text.split()
        chunks = []
        cur_words: list[str] = []
        cur_len = 0
        for w in words:
            cur_words.append(w)
            cur_len += len(w) + 1
            if cur_len >= chunk_size:
                chunks.append(" ".join(cur_words))
                # Overlap
                keep_words = cur_words[-int(overlap / 6):] if len(cur_words) > 10 else cur_words[-2:]
                cur_words = list(keep_words)
                cur_len = sum(len(x) + 1 for x in cur_words)
        if cur_words:
            chunks.append(" ".join(cur_words))
        return chunks

    def ingest_note(
        self,
        content: str,
        kind: str = "note",
        site_id: str = "Plant North",
        source_device: str = "Device A",
        asset_id: str | None = None,
        asset_type: str | None = None,
        authority: int = 0,
        scope: str = "device",
        target_shard: str = "device_memory",
        custom_mem_id: str | None = None,
        created_at: datetime | None = None,
    ) -> tuple[list[Memory], float]:
        t0 = time.perf_counter()

        chunks = self.chunk_text(content)
        base_id = custom_mem_id or str(uuid.uuid4())
        created_dt = created_at or datetime.now(timezone.utc)

        # Batch embed documents
        dense_vecs, sparse_vecs = self.embedder.embed_document(chunks)

        ingested_memories: list[Memory] = []
        for i, chunk in enumerate(chunks):
            chunk_id = (
                base_id
                if len(chunks) == 1
                else str(uuid.uuid5(uuid.UUID(base_id), f"chunk_{i}"))
            )
            content_hash = self.extractor.compute_content_hash(chunk)
            claims = self.extractor.extract_claims(chunk)
            pii_flags, redacted_text, has_pii = self.extractor.detect_pii(chunk)

            payload_data: dict[str, Any] = {
                "claims": claims,
                "pii_flags": pii_flags,
                "has_pii": has_pii,
                "redacted_text": redacted_text,
                "chunk_index": i,
                "total_chunks": len(chunks),
                "original_base_id": base_id,
            }

            mem = Memory(
                mem_id=chunk_id,
                version=1,
                content=chunk,
                content_hash=content_hash,
                kind=kind,
                status="active",
                sync_state="local_only" if has_pii else "pending",
                scope=scope,
                authority=authority,
                site_id=site_id,
                asset_id=asset_id,
                asset_type=asset_type,
                source_device=source_device,
                created_at=created_dt,
                updated_at=created_dt,
                payload=payload_data,
                vectors={
                    "dense": dense_vecs[i],
                    "bm25": sparse_vecs[i],
                },
            )

            # Upsert into MemoryStore
            if hasattr(self.store, "upsert"):
                try:
                    self.store.upsert(mem, shard_name=target_shard)  # type: ignore[call-arg]
                except TypeError:
                    self.store.upsert(mem)

            ingested_memories.append(mem)

        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        return ingested_memories, elapsed_ms
