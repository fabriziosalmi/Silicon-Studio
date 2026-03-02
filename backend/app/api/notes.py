from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.notes.service import NotesService

router = APIRouter()
service = NotesService()


class NoteCreate(BaseModel):
    title: str = Field(default="Untitled", max_length=500)
    content: str = Field(default="", max_length=500_000)


class NoteUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=500)
    content: Optional[str] = Field(default=None, max_length=500_000)
    pinned: Optional[bool] = None


@router.get("/")
def list_notes():
    return service.list_notes()


@router.get("/{note_id}")
def get_note(note_id: str):
    note = service.get_note(note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.post("/")
def create_note(req: NoteCreate):
    return service.create_note(title=req.title, content=req.content)


@router.patch("/{note_id}")
def update_note(note_id: str, req: NoteUpdate):
    updates = req.model_dump(exclude_none=True)
    note = service.update_note(note_id, updates)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.delete("/{note_id}")
def delete_note(note_id: str):
    if service.delete_note(note_id):
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Note not found")
