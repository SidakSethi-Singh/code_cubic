"""POST /memories — ingest new memories."""
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging

router = APIRouter(tags=["ingest"])
logger = logging.getLogger(__name__)


class IngestRequest(BaseModel):
    content: str
    kind: str
    asset_id: Optional[str] = None
    asset_type: Optional[str] = None
    scope: str = "device"
    authority: Optional[int] = None


class BulkIngestRequest(BaseModel):
    items: List[IngestRequest]


@router.post("/memories")
async def ingest_memory(request: Request, body: IngestRequest):
    try:
        pipeline = getattr(request.app.state, "ingest_pipeline", None)
        if not pipeline:
            raise HTTPException(status_code=503, detail="IngestPipeline not initialized")

        created = pipeline.ingest(
            content=body.content,
            kind=body.kind,
            asset_id=body.asset_id,
            asset_type=body.asset_type,
            scope=body.scope,
            authority=body.authority,
        )

        mem_ids = [m["mem_id"] for m in created]
        decisions = []

        try:
            from device.app.policy.engine import decide
            from device.app.policy.logger import log_decision
            from sync import outbox, store as sync_store
            from device.app.ledger.db import DB_PATH

            sync_conn = sync_store.connect(str(DB_PATH.parent / "sync.db"))

            for m_id in mem_ids:
                decision = decide(mem_id=m_id, text=body.content, kind=body.kind)
                log_decision(decision)
                outbox.enqueue_decision(sync_conn, {
                    "mem_id": m_id,
                    "text": body.content,
                    "outcome": decision["outcome"],
                    "reason": decision["reason"],
                })
                decisions.append(decision)
        except Exception as pe:
            logger.warning(f"Policy evaluation or outbox enqueue warning: {pe}")

        return {
            "mem_ids": mem_ids,
            "decision": decisions[0] if decisions else None,
            "decisions": decisions,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ingest error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/memories/bulk")
async def ingest_memories_bulk(request: Request, body: BulkIngestRequest):
    try:
        pipeline = getattr(request.app.state, "ingest_pipeline", None)
        if not pipeline:
            raise HTTPException(status_code=503, detail="IngestPipeline not initialized")

        all_mem_ids = []
        all_decisions = []

        from device.app.policy.engine import decide
        from device.app.policy.logger import log_decision
        from sync import outbox, store as sync_store
        from device.app.ledger.db import DB_PATH

        sync_conn = sync_store.connect(str(DB_PATH.parent / "sync.db"))

        for item in body.items:
            created = pipeline.ingest(
                content=item.content,
                kind=item.kind,
                asset_id=item.asset_id,
                asset_type=item.asset_type,
                scope=item.scope,
                authority=item.authority,
            )
            item_mem_ids = [m["mem_id"] for m in created]
            all_mem_ids.extend(item_mem_ids)

            for m_id in item_mem_ids:
                decision = decide(mem_id=m_id, text=item.content, kind=item.kind)
                log_decision(decision)
                outbox.enqueue_decision(sync_conn, {
                    "mem_id": m_id,
                    "text": item.content,
                    "outcome": decision["outcome"],
                    "reason": decision["reason"],
                })
                all_decisions.append(decision)

        return {"mem_ids": all_mem_ids, "decisions": all_decisions}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bulk ingest error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/memories/{mem_id}")
async def get_memory(request: Request, mem_id: str):
    try:
        store = request.app.state.store
        results = store.get([mem_id])
        if not results:
            raise HTTPException(status_code=404, detail="Memory not found")
        return results[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/memories")
async def list_memories(
    request: Request,
    kind: Optional[str] = None,
    status: Optional[str] = None,
    site_id: Optional[str] = None,
    asset_id: Optional[str] = None,
    limit: int = 50,
    offset: Optional[str] = None,
):
    try:
        store = request.app.state.store
        flt = {}
        if kind:
            flt["kind"] = kind
        if status:
            flt["status"] = status
        if site_id:
            flt["site_id"] = site_id
        if asset_id:
            flt["asset_id"] = asset_id

        memories, next_offset = store.scan(flt=flt, limit=limit, offset=offset)
        return {"memories": memories, "next_offset": next_offset, "count": len(memories)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
