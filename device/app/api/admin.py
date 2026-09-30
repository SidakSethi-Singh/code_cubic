"""Admin endpoints — reset, seed, optimize."""
from fastapi import APIRouter, Request, HTTPException
import logging

router = APIRouter(tags=["admin"])
logger = logging.getLogger(__name__)


@router.post("/admin/reset")
def reset_system(request: Request):
    try:
        store = request.app.state.store
        if hasattr(store, "clear"):
            store.clear()

        from device.app.ledger.db import init_db
        init_db()

        return {"status": "reset complete", "memories_count": store.count()}
    except Exception as e:
        logger.error(f"Reset error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/seed")
def seed_system(request: Request):
    try:
        from device.app.memory.loader import seed_store

        store = request.app.state.store
        dense_embedder = request.app.state.dense_embedder
        sparse_embedder = request.app.state.sparse_embedder

        stats = seed_store(store, dense_embedder, sparse_embedder)
        return {"status": "seed complete", "stats": stats, "memories_count": store.count()}
    except Exception as e:
        logger.error(f"Seed error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/optimize")
def optimize_store(request: Request):
    try:
        store = request.app.state.store
        if hasattr(store, "optimize"):
            store.optimize()
        return {"status": "optimize triggered"}
    except Exception as e:
        logger.error(f"Optimize error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
