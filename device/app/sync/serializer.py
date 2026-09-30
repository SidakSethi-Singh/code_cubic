from __future__ import annotations

from typing import Any
from device.app.memory.models import Memory


class SecurityLeakError(Exception):
    """Raised when an outbound serializer encounters a sensitive or local_only memory item."""
    pass


class OutboundSerializer:
    ALLOWED_PAYLOAD_KEYS = {
        "title",
        "claims",
        "doc_ref",
        "provenance",
        "torque_nm",
        "tags",
        "chunk_index",
        "total_chunks",
    }

    @classmethod
    def serialize_for_fleet(cls, mem: Memory) -> dict[str, Any]:
        # INVARIANT I1: Refuse local_only and sensitive items outright
        if mem.sync_state == "local_only":
            raise SecurityLeakError(
                f"Security Invariant I1 Violation: Attempted to serialize local_only memory #{mem.mem_id} for fleet egress."
            )

        if mem.payload.get("has_pii") is True or bool(mem.payload.get("pii_flags")):
            raise SecurityLeakError(
                f"Security Invariant I1 Violation: Attempted to serialize PII-flagged memory #{mem.mem_id} for fleet egress."
            )

        # Sanitize extra payload (whitelist only)
        sanitized_payload: dict[str, Any] = {}
        for k, v in mem.payload.items():
            if k in cls.ALLOWED_PAYLOAD_KEYS:
                sanitized_payload[k] = v

        # Format for Qdrant payload
        point_payload = {
            "version": mem.version,
            "content": mem.content,
            "content_hash": mem.content_hash,
            "kind": mem.kind,
            "status": mem.status,
            "sync_state": "synced",
            "scope": mem.scope,
            "authority": mem.authority,
            "site_id": mem.site_id,
            "asset_id": mem.asset_id,
            "asset_type": mem.asset_type,
            "source_device": mem.source_device,
            "created_at": mem.created_at.isoformat(),
            "updated_at": mem.updated_at.isoformat(),
            "extra_payload": sanitized_payload,
        }

        # Vector extraction
        dense_vec = mem.vectors.get("dense")
        bm25_vec = mem.vectors.get("bm25")
        if not dense_vec:
            try:
                from device.app.embed.embedder import EdgeEmbedder
                d_list, s_list = EdgeEmbedder.get_instance().embed_document([mem.content])
                dense_vec = d_list[0]
                bm25_vec = s_list[0]
            except Exception:
                dense_vec = [0.0] * 384

        sparse_dict: dict[str, Any] = {"indices": [], "values": []}
        if isinstance(bm25_vec, dict):
            sparse_dict = bm25_vec
        elif hasattr(bm25_vec, "indices") and hasattr(bm25_vec, "values"):
            sparse_dict = {
                "indices": list(bm25_vec.indices),
                "values": list(bm25_vec.values),
            }

        return {
            "id": mem.mem_id,
            "payload": point_payload,
            "vectors": {
                "dense": dense_vec,
                "bm25": sparse_dict,
            },
        }
