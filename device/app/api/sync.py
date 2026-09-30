"""device/app/api/sync.py — Sync endpoints: link toggle, sync run, sync status."""
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
import logging

from device.app.ledger.db import DB_PATH
from device.app.config import DEVICE_ID

router = APIRouter(tags=["sync"])
logger = logging.getLogger(__name__)


class LinkRequest(BaseModel):
    online: bool


@router.get("/link")
def get_link_status():
    try:
        from sync import link
        return {"online": link.is_online()}
    except Exception as e:
        return {"online": False, "error": str(e)}


@router.post("/link")
def set_link_status(body: LinkRequest):
    try:
        from sync import link
        link.set_online(body.online)
        return {"online": body.online}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync/run")
def run_sync(request: Request):
    try:
        from sync import store as sync_store, push, pull

        device_id = getattr(request.app.state, "device_id", DEVICE_ID)
        sync_db_path = str(DB_PATH.parent / "sync.db")
        conn = sync_store.connect(sync_db_path)

        push_report = push.push_pending(conn, device_id)
        pulled_items = pull.pull_new(conn, device_id)
        local_saved = push.local_bytes_kept(conn)

        # Ingest any pulled items into local memory store if available
        store = getattr(request.app.state, "store", None)
        dense_embedder = getattr(request.app.state, "dense_embedder", None)
        sparse_embedder = getattr(request.app.state, "sparse_embedder", None)

        if store and pulled_items:
            from device.app.memory.models import create_memory
            for item in pulled_items:
                mem = create_memory(
                    content=item["text"],
                    kind="fix",
                    site_id=getattr(request.app.state, "site_id", "plant_north"),
                    source_device=item.get("source", "fleet_origin"),
                    authority=1,
                    scope="fleet",
                )
                dense_v = dense_embedder.embed_one(mem.content) if dense_embedder else None
                sparse_v = sparse_embedder.embed_one(mem.content) if sparse_embedder else None
                store.upsert(mem, dense_vector=dense_v, sparse_vector=sparse_v)

        return {
            "status": "success",
            "push_report": push_report,
            "pulled_count": len(pulled_items),
            "pulled_items": pulled_items,
            "bytes_kept_local": local_saved,
        }
    except Exception as e:
        logger.error(f"Sync run error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sync/status")
def get_sync_status(request: Request):
    try:
        from sync import store as sync_store, link, push

        sync_db_path = str(DB_PATH.parent / "sync.db")
        conn = sync_store.connect(sync_db_path)

        pending_rows = conn.execute("SELECT COUNT(*) c, COALESCE(SUM(LENGTH(text)),0) b FROM sync_outbox WHERE status='pending'").fetchone()
        synced_rows = conn.execute("SELECT COUNT(*) c, COALESCE(SUM(LENGTH(text)),0) b FROM sync_outbox WHERE status='synced'").fetchone()
        learned_count = conn.execute("SELECT COUNT(*) c FROM sync_learned").fetchone()["c"]

        return {
            "online": link.is_online(),
            "outbox_pending": pending_rows["c"],
            "bytes_pending": pending_rows["b"],
            "outbox_synced": synced_rows["c"],
            "bytes_synced": synced_rows["b"],
            "bytes_kept_local": push.local_bytes_kept(conn),
            "learned_fleet_memories": learned_count,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
