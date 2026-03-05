"""API endpoints for the codebase vector indexer."""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from app.security import safe_user_file

logger = logging.getLogger(__name__)
router = APIRouter()


class IndexRequest(BaseModel):
    directory: str = Field(min_length=1, max_length=4096)


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    top_k: int = Field(default=10, ge=1, le=50)


@router.post("/index")
async def index_directory(req: IndexRequest):
    """Index a local directory for semantic code search."""
    from app.codebase.service import codebase_service
    try:
        safe_dir = str(safe_user_file(req.directory))
        result = await run_in_threadpool(codebase_service.index_directory, safe_dir)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Indexing failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Indexing failed")


@router.post("/search")
async def search_codebase(req: SearchRequest):
    """Search the indexed codebase with hybrid BM25 + vector search."""
    from app.codebase.service import codebase_service
    results = codebase_service.search(req.query, top_k=req.top_k)
    return {"results": [r.to_dict() for r in results]}


@router.get("/status")
async def get_status():
    """Get current codebase index status."""
    from app.codebase.service import codebase_service
    return codebase_service.get_status()


@router.delete("/index")
async def delete_index():
    """Delete the codebase index."""
    from app.codebase.service import codebase_service
    codebase_service.delete_index()
    return {"status": "deleted"}
