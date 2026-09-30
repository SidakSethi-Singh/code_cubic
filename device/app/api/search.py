"""POST /search — hybrid search endpoint."""
from fastapi import APIRouter, Request, HTTPException
import logging

from device.app.memory.models import SearchRequest, SearchResponse

logger = logging.getLogger(__name__)
router = APIRouter(tags=["search"])


@router.post("/search", response_model=SearchResponse)
async def search(request: Request, body: SearchRequest):
    """Run hybrid search (dense + BM25) with extractive answer."""
    searcher = request.app.state.hybrid_searcher
    if not searcher:
        raise HTTPException(status_code=503, detail="HybridSearcher not initialized")

    try:
        # 1. Run hybrid search
        response = searcher.search(body)

        # 2. Compose extractive answer from top hits
        composer = getattr(request.app.state, "answer_composer", None)
        if composer and response.hits:
            store = request.app.state.store
            mem_ids = [h.mem_id for h in response.hits]
            memories = {m.mem_id: m for m in store.get(mem_ids)}
            answer, citations, confidence = composer.compose(
                body.query, response.hits, memories
            )
            response.answer = answer
            response.citations = citations
            response.confidence = confidence

        return response
    except Exception as e:
        logger.error(f"Search error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
