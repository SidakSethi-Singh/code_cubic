from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from device.app.api.search_routes import router as search_router
from device.app.api.sync_routes import router as sync_router

app = FastAPI(
    title="EdgeMind - Edge Node",
    description="Offline-first on-device vector memory and search node",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search_router)
app.include_router(sync_router)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "air_gapped": True,
        "engine": "qdrant-edge",
        "embedder": "BAAI/bge-small-en-v1.5 + Qdrant/bm25"
    }
