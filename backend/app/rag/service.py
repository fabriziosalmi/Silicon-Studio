import os
import json
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional
import time

class RagService:
    def __init__(self):
        self.workspace_dir = Path.home() / ".silicon-studio"
        self.rag_dir = self.workspace_dir / "rag"
        self.collections_file = self.rag_dir / "collections.json"
        
        self.rag_dir.mkdir(parents=True, exist_ok=True)
        if not self.collections_file.exists():
            with open(self.collections_file, "w") as f:
                json.dump([], f)

    def get_collections(self) -> List[Dict[str, Any]]:
        try:
            with open(self.collections_file, "r") as f:
                return json.load(f)
        except Exception:
            return []

    def create_collection(self, name: str) -> Dict[str, Any]:
        collections = self.get_collections()
        new_col = {
            "id": str(uuid.uuid4()),
            "name": name,
            "chunks": 0,
            "size": "0 KB",
            "lastUpdated": "Just now",
            "model": "nomic-embed-text-v1.5"
        }
        collections.append(new_col)
        self._save_collections(collections)
        return new_col

    def delete_collection(self, collection_id: str) -> bool:
        collections = self.get_collections()
        initial_len = len(collections)
        collections = [c for c in collections if c["id"] != collection_id]
        if len(collections) < initial_len:
            self._save_collections(collections)
            return True
        return False

    def ingest_files(self, collection_id: str, files: List[str], chunk_size: int, overlap: int) -> Dict[str, Any]:
        """
        Ingests files by splitting them into chunks using recursive character splitting.
        """
        collections = self.get_collections()
        col = next((c for c in collections if c["id"] == collection_id), None)
        if not col:
            raise ValueError("Collection not found")

        all_chunks = []
        for file_path in files:
            path = Path(file_path)
            if not path.exists(): continue
            
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    text = f.read()
                
                # Recursive Splitting Logic
                chunks = self._recursive_split(text, chunk_size, overlap)
                all_chunks.extend(chunks)
            except Exception as e:
                print(f"Error processing {file_path}: {e}")

        # In a real app, we would embed these chunks and store in FAISS/Chroma
        # For now, we update the metadata to reflect real chunk counts
        col["chunks"] += len(all_chunks)
        col["size"] = f"{round(col['chunks'] * 0.5)} KB" # Estimated
        col["lastUpdated"] = "Just now"
        
        self._save_collections(collections)
        return col

    def _recursive_split(self, text: str, chunk_size: int, chunk_overlap: int) -> List[str]:
        """
        Splits text by trying different separators in order: \n\n, \n, " ", ""
        """
        separators = ["\n\n", "\n", " ", ""]
        final_chunks = []
        
        def split_text(txt, seps):
            if len(txt) <= chunk_size:
                return [txt]
            
            if not seps:
                return [txt[i:i+chunk_size] for i in range(0, len(txt), chunk_size - chunk_overlap)]
            
            sep = seps[0]
            parts = txt.split(sep)
            
            chunks = []
            current_chunk = ""
            
            for part in parts:
                if len(current_chunk) + len(part) + (len(sep) if current_chunk else 0) <= chunk_size:
                    current_chunk += (sep if current_chunk else "") + part
                else:
                    if current_chunk:
                        chunks.append(current_chunk)
                    
                    # If the part itself is larger than chunk_size, recurse on it
                    if len(part) > chunk_size:
                        chunks.extend(split_text(part, seps[1:]))
                        current_chunk = ""
                    else:
                        current_chunk = part
            
            if current_chunk:
                chunks.append(current_chunk)
            
            # Add overlap (simplified for this implementation)
            return chunks

        return split_text(text, separators)

    def _save_collections(self, collections: List[Dict[str, Any]]):
        with open(self.collections_file, "w") as f:
            json.dump(collections, f, indent=2)
