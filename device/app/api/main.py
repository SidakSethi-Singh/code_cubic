"""device/app/api/main.py — EdgeMind Device API server.
Run: uvicorn device.app.api.main:app --port 8001
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize components
    logger.info("Initializing EdgeMind Device API...")
    
    try:
        from device.app.memory.schema import init_store
        app.state.store = init_store()
    except ImportError:
        logger.warning("Could not import init_store, using mock store.")
        class MockStore:
            def count(self): return 0
        app.state.store = MockStore()

    try:
        from device.app.embed import get_dense, get_sparse
        app.state.dense_embedder = get_dense()
        app.state.sparse_embedder = get_sparse()
    except ImportError:
        logger.warning("Could not import embedders.")
        app.state.dense_embedder = None
        app.state.sparse_embedder = None

    try:
        from device.app.ingest.pipeline import IngestPipeline
        from device.app.config import DEVICE_ID, SITE_ID
        app.state.ingest_pipeline = IngestPipeline(
            app.state.store, app.state.dense_embedder, app.state.sparse_embedder,
            site_id=SITE_ID, device_id=DEVICE_ID
        )
    except (ImportError, TypeError) as e:
        logger.warning(f"Could not init IngestPipeline: {e}")
        app.state.ingest_pipeline = None

    try:
        from device.app.memory.search import HybridSearcher
        app.state.hybrid_searcher = HybridSearcher(app.state.store, app.state.dense_embedder, app.state.sparse_embedder)
    except ImportError:
        app.state.hybrid_searcher = None

    try:
        from device.app.memory.answer import AnswerComposer
        app.state.answer_composer = AnswerComposer()
    except ImportError:
        app.state.answer_composer = None

    try:
        from device.app.ledger.db import init_db
        app.state.ledger_db = init_db()
    except ImportError:
        app.state.ledger_db = None

    from device.app.config import DEVICE_ID
    app.state.device_id = DEVICE_ID
    
    logger.info("Initialization complete.")
    yield
    logger.info("Shutting down EdgeMind Device API...")

app = FastAPI(title="EdgeMind Device", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

from device.app.api.search import router as search_router
from device.app.api.ingest import router as ingest_router
from device.app.api.health import router as health_router
from device.app.api.sync import router as sync_router
from device.app.api.inspect import router as inspect_router
from device.app.api.admin import router as admin_router

app.include_router(search_router)
app.include_router(ingest_router)
app.include_router(health_router)
app.include_router(sync_router)
app.include_router(inspect_router)
app.include_router(admin_router)
