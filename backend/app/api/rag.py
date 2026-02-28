from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.rag.service import RagService

router = APIRouter()
service = RagService()

class CollectionCreate(BaseModel):
    name: str

class IngestRequest(BaseModel):
    collection_id: str
    files: List[str]
    chunk_size: int = 512
    overlap: int = 50

@router.get("/collections")
async def get_collections():
    return service.get_collections()

@router.post("/collections")
async def create_collection(req: CollectionCreate):
    return service.create_collection(req.name)

@router.delete("/collections/{collection_id}")
async def delete_collection(collection_id: str):
    if service.delete_collection(collection_id):
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Collection not found")

@router.post("/ingest")
async def ingest_files(req: IngestRequest):
    try:
        return service.ingest_files(req.collection_id, req.files, req.chunk_size, req.overlap)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
