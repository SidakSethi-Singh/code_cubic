"""device/app/ingest/pipeline.py — Full ingest: chunk → extract → PII → embed → upsert."""

from typing import Any
from device.app.memory.models import Memory, make_content_hash, create_memory
from device.app.ingest.chunker import Chunker
from device.app.ingest.extractor import extract_all
from device.app.ingest.pii import pii_flags

AUTHORITY_MAP = {
    "bulletin": 3,
    "manual": 2,
    "incident": 1,
    "fix": 1,
    "note": 0,
    "sensor": 0,
}


class IngestPipeline:
    def __init__(self, store: Any, dense_embedder: Any, sparse_embedder: Any,
                 site_id: str = "plant_north", device_id: str = "device_a"):
        self.store = store
        self.dense_embedder = dense_embedder
        self.sparse_embedder = sparse_embedder
        self.site_id = site_id
        self.device_id = device_id
        self.chunker = Chunker()

    def ingest(self, content: str, kind: str, asset_id: str | None = None,
               asset_type: str | None = None, scope: str = "device",
               authority: int | None = None, **extra) -> list[dict]:
        """Ingest raw content: chunk → extract → embed → upsert. Returns list of created memory dicts."""
        if authority is None:
            authority = AUTHORITY_MAP.get(kind, 0)

        chunks = self.chunker.chunk(content, kind)
        result_memories = []

        for i, chunk_text in enumerate(chunks):
            extracted = extract_all(chunk_text)
            p_flags = pii_flags(chunk_text)

            payload = {
                "chunk_index": i,
                "total_chunks": len(chunks),
                "entities": extracted["entities"],
                "claims": extracted["claims"],
                "tags": extracted["tags"],
                "pii_flags": p_flags,
            }

            mem = create_memory(
                content=chunk_text,
                kind=kind,
                site_id=self.site_id,
                source_device=self.device_id,
                asset_id=asset_id,
                asset_type=asset_type,
                scope=scope,
                authority=authority,
                payload=payload,
            )

            dense_vec = self.dense_embedder.embed_one(chunk_text)
            sp_idx, sp_val = self.sparse_embedder.embed_one(chunk_text)

            self.store.upsert(mem, dense_vector=dense_vec, sparse_vector=(sp_idx, sp_val))
            result_memories.append({"mem_id": mem.mem_id, "kind": kind, "content_hash": mem.content_hash})

        return result_memories

    def ingest_memory(self, memory_dict: dict) -> dict:
        """Ingest a pre-formed memory dict (e.g. from seed data). Embeds and upserts."""
        content = memory_dict.get("content", "")

        dense_vec = self.dense_embedder.embed_one(content)
        sp_idx, sp_val = self.sparse_embedder.embed_one(content)

        mem = Memory(**memory_dict)
        self.store.upsert(mem, dense_vector=dense_vec, sparse_vector=(sp_idx, sp_val))

        return {"mem_id": mem.mem_id, "kind": mem.kind}
