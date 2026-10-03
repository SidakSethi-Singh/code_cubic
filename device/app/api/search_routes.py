import json
import os
from pathlib import Path
from typing import Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from device.app.api.search import SearchResponse, SearchService
from device.app.api.router import SmartQueryRouter
from device.app.embed.embedder import EdgeEmbedder
from device.app.ingest.pipeline import IngestPipeline
from device.app.memory.models import Memory
from device.app.memory.store import QdrantEdgeMemoryStore

router = APIRouter(prefix="/api", tags=["search_and_memory"])

# Configurable environment settings for multi-device support
DEVICE_ID = os.environ.get("DEVICE_ID", "Device A")
SITE_ID = os.environ.get("SITE_ID", "Plant North" if DEVICE_ID == "Device A" else "Plant South")
ASSET_ID = os.environ.get("ASSET_ID", "P-204" if DEVICE_ID == "Device A" else "T-34")
DEVICE_PORT = int(os.environ.get("PORT", "8001" if DEVICE_ID == "Device A" else "8002"))

DATA_DIR = Path(os.environ.get("DEVICE_DATA_DIR", f"data/devices/{DEVICE_ID.lower().replace(' ', '_')}"))
SHARDS_DIR = DATA_DIR / "shards"
SHARDS_DIR.mkdir(parents=True, exist_ok=True)

# Global singletons for edge node runtime
_embedder = EdgeEmbedder.get_instance()
_store = QdrantEdgeMemoryStore(base_dir=SHARDS_DIR, embedder=_embedder)
_search_service = SearchService(store=_store)
_smart_router = SmartQueryRouter(store=_store, device_id=DEVICE_ID)
_pipeline = IngestPipeline(store=_store, embedder=_embedder)


def _seed_initial_memories_if_needed():
    try:
        mems, _ = _store.scan(limit=1)
        if mems:
            return
        seed_file = Path(__file__).resolve().parent.parent.parent.parent / "data" / "seed" / "seed_memories.json"
        if not seed_file.exists():
            return
        with open(seed_file, "r", encoding="utf-8") as f:
            all_records = json.load(f)

        records_to_seed = []
        for r in all_records:
            mid = r.get("mem_id", "")
            if any(k in mid for k in ("1042", "0871", "0119", "1402", "0082")):
                records_to_seed.append(r)
            elif r.get("source_device") == DEVICE_ID or r.get("site_id") == SITE_ID:
                records_to_seed.append(r)
            elif r.get("target_shard") == "fleet_mirror":
                records_to_seed.append(r)

            if len(records_to_seed) >= 30:
                break

        for item in records_to_seed:
            mem = Memory(
                mem_id=item["mem_id"],
                version=item.get("version", 1),
                content=item["content"],
                content_hash=item.get("content_hash") or _pipeline.extractor.compute_content_hash(item["content"]),
                kind=item.get("kind", "note"),
                status=item.get("status", "active"),
                sync_state=item.get("sync_state", "synced"),
                scope=item.get("scope", "site"),
                authority=item.get("authority", 1),
                site_id=item.get("site_id", SITE_ID),
                asset_id=item.get("asset_id", ASSET_ID),
                asset_type=item.get("asset_type"),
                source_device=item.get("source_device", DEVICE_ID),
                payload=item.get("payload", {}),
            )
            target = item.get("target_shard", "device_memory")
            _store.upsert(mem, shard_name=target)
        _store.optimize()
    except Exception as e:
        print(f"Warning: Initial seeding failed: {e}")


_seed_initial_memories_if_needed()


class IngestRequest(BaseModel):
    content: str
    kind: str = "note"
    site_id: str = "Plant North"
    source_device: str = "Device A"
    asset_id: str | None = None
    asset_type: str | None = None
    authority: int = 0
    scope: str = "device"
    target_shard: str = "device_memory"


class IngestResponse(BaseModel):
    mem_ids: list[str]
    elapsed_ms: float
    total_chunks: int
    pii_flagged: bool
    status: str = "ok"


class PolicyPreviewRequest(BaseModel):
    content: str
    kind: str = "note"
    asset_id: str | None = None
    authority: int = 1
    attachment_size_bytes: int = 0


@router.get("/device/info")
def get_device_info():
    mems, _ = _store.scan(limit=1000)
    return {
        "device_id": DEVICE_ID,
        "site_id": SITE_ID,
        "asset_id": ASSET_ID,
        "port": DEVICE_PORT,
        "total_chunks": len(mems),
        "status": "online",
        "embedder": "BAAI/bge-small-en-v1.5 + Qdrant/bm25",
        "engine": "qdrant-edge"
    }


@router.get("/topology")
def get_mesh_topology():
    return {
        "self": {
            "device_id": DEVICE_ID,
            "site_id": SITE_ID,
            "port": DEVICE_PORT,
            "status": "online",
            "tier": 1,
            "policy": "air_gapped_0_egress",
        },
        "peer": {
            "device_id": _smart_router.peer_name,
            "url": _smart_router.peer_url,
            "transport": "Local Subnet WiFi P2P",
            "status": "active",
            "tier": 2,
            "internet_egress": "0B",
        },
        "hub": {
            "url": _smart_router.hub_url,
            "transport": "Central Fleet Sync",
            "status": "configured",
            "tier": 3,
        }
    }


@router.get("/search", response_model=SearchResponse)
def search_memory(
    q: str = Query(..., description="Natural language search query"),
    limit: int = Query(5, ge=1, le=50),
    explain: bool = Query(True, description="Return branch ranks and explain details"),
    kind: str | None = Query(None, description="Optional kind filter"),
    asset_id: str | None = Query(None, description="Optional asset ID filter"),
    allow_peer: bool = Query(True, description="Allow routing query to peer over local subnet WiFi"),
) -> SearchResponse:
    filters: dict[str, Any] = {}
    if kind and kind != "All Kinds":
        filters["kind"] = kind.lower()
    if asset_id and asset_id != "All Assets":
        filters["asset_id"] = asset_id

    return _smart_router.route_and_search(
        query=q,
        limit=limit,
        explain=explain,
        filters=filters if filters else None,
        allow_peer_escalation=allow_peer,
    )


@router.post("/ingest", response_model=IngestResponse)
def ingest_record(req: IngestRequest) -> IngestResponse:
    mems, elapsed_ms = _pipeline.ingest_note(
        content=req.content,
        kind=req.kind,
        site_id=req.site_id or SITE_ID,
        source_device=req.source_device or DEVICE_ID,
        asset_id=req.asset_id or ASSET_ID,
        asset_type=req.asset_type,
        authority=req.authority,
        scope=req.scope,
        target_shard=req.target_shard,
    )
    pii_flagged = any(m.payload.get("has_pii", False) for m in mems)
    return IngestResponse(
        mem_ids=[m.mem_id for m in mems],
        elapsed_ms=round(elapsed_ms, 2),
        total_chunks=len(mems),
        pii_flagged=pii_flagged,
    )


@router.post("/policy/preview")
def preview_policy(req: PolicyPreviewRequest):
    pii_flags, redacted, has_pii = _pipeline.extractor.detect_pii(req.content)
    hash_val = _pipeline.extractor.compute_content_hash(req.content)
    temp_mem = Memory(
        mem_id="preview-temp-id",
        version=1,
        content=req.content,
        content_hash=hash_val,
        kind=req.kind,
        authority=req.authority,
        site_id=SITE_ID,
        asset_id=req.asset_id or ASSET_ID,
        source_device=DEVICE_ID,
        payload={"has_pii": has_pii, "pii_flags": pii_flags, "attachment_size_bytes": req.attachment_size_bytes},
    )
    from device.app.policy.engine import PolicyEngine
    pe = PolicyEngine()
    decision = pe.evaluate(temp_mem)
    return {
        "decision": decision.model_dump(),
        "has_pii": has_pii,
        "pii_flags": pii_flags,
        "redacted_content": redacted,
        "content_hash": hash_val,
    }


@router.get("/memories")
def list_memories(
    limit: int = Query(50, ge=1, le=500),
    offset: str | None = Query(None),
    kind: str | None = Query(None),
    asset_id: str | None = Query(None),
    search: str | None = Query(None),
):
    flt = {}
    if kind and kind != "All Kinds":
        flt["kind"] = kind.lower()
    if asset_id and asset_id != "All Assets":
        flt["asset_id"] = asset_id

    mems, next_offset = _store.scan(flt=flt if flt else None, limit=limit, offset=offset)
    if search:
        s = search.lower()
        mems = [m for m in mems if s in m.content.lower() or s in (m.payload.get("title") or "").lower()]

    return {
        "memories": [m.model_dump() for m in mems],
        "next_offset": next_offset,
        "total": len(mems),
    }


@router.get("/memories/{mem_id}")
def get_memory_detail(mem_id: str):
    mems = _store.get([mem_id])
    if not mems:
        raise HTTPException(status_code=404, detail="Memory not found")
    mem = mems[0]
    pii_flags, redacted, has_pii = _pipeline.extractor.detect_pii(mem.content)
    return {
        "memory": mem.model_dump(),
        "has_pii": has_pii,
        "pii_flags": pii_flags,
        "redacted_content": redacted,
    }
