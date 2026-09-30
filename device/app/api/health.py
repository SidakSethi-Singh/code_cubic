"""GET /health — health check."""
from fastapi import APIRouter, Request

router = APIRouter(tags=["health"])

@router.get("/health")
def health(request: Request):
    store = request.app.state.store
    
    try:
        from sync import link
        online = link.is_online()
    except Exception:
        online = False
        
    memories_count = store.count() if hasattr(store, 'count') else 0
        
    return {
        "ok": True, 
        "device_id": getattr(request.app.state, 'device_id', 'unknown'), 
        "memories": memories_count, 
        "online": online
    }
