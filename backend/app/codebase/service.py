"""Codebase index service — indexes a local repo and provides hybrid search."""

import hashlib
import json
import logging
import os
import re
import shutil
import threading
import time
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List, Dict, Any, Optional

import numpy as np

from .chunker import walk_and_chunk, Chunk

logger = logging.getLogger(__name__)

INDEX_ROOT = Path.home() / ".silicon-studio" / "codebase_index"


@dataclass
class SearchResult:
    file_path: str
    start_line: int
    end_line: int
    symbol: str
    kind: str
    content: str
    score: float
    method: str

    def to_dict(self) -> dict:
        return asdict(self)


class CodebaseIndexService:
    """Indexes a directory's source files and provides hybrid BM25+vector search."""

    def __init__(self):
        INDEX_ROOT.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        self._chunks: Optional[List[dict]] = None
        self._embeddings: Optional[np.ndarray] = None
        self._meta: Optional[dict] = None
        self._index_dir: Optional[Path] = None

    @staticmethod
    def _dir_hash(directory: str) -> str:
        return hashlib.sha256(os.path.realpath(directory).encode()).hexdigest()[:16]

    def _get_index_dir(self, directory: str) -> Path:
        return INDEX_ROOT / self._dir_hash(directory)

    def _load_index(self, directory: str) -> bool:
        """Load an existing index from disk into memory. Returns True if found."""
        with self._lock:
            idx_dir = self._get_index_dir(directory)
            meta_file = idx_dir / "meta.json"
            chunks_file = idx_dir / "chunks.json"

            if not meta_file.exists() or not chunks_file.exists():
                return False

            try:
                with open(meta_file) as f:
                    self._meta = json.load(f)
                with open(chunks_file) as f:
                    self._chunks = json.load(f)

                emb_file = idx_dir / "embeddings.npy"
                if emb_file.exists():
                    self._embeddings = np.load(str(emb_file))
                else:
                    self._embeddings = None

                self._index_dir = idx_dir
                return True
            except Exception as e:
                logger.warning("Failed to load codebase index: %s", e)
                return False

    def _ensure_loaded(self, directory: Optional[str] = None) -> bool:
        """Ensure index is in memory. Tries to load from disk if not."""
        with self._lock:
            if self._chunks is not None:
                return True
            if directory:
                return self._load_index(directory)
            latest_dir = self._latest_indexed_directory()
            if latest_dir:
                return self._load_index(latest_dir)
            return False

    def _latest_indexed_directory(self) -> Optional[str]:
        """Return the most recently indexed root_dir from on-disk metadata."""
        if not INDEX_ROOT.exists():
            return None

        candidates: List[tuple[float, str]] = []
        for sub in INDEX_ROOT.iterdir():
            meta_file = sub / "meta.json"
            if not meta_file.exists():
                continue
            try:
                with open(meta_file) as f:
                    meta = json.load(f)
                root_dir = meta.get("root_dir")
                indexed_at = float(meta.get("indexed_at", 0.0))
                if root_dir:
                    candidates.append((indexed_at, root_dir))
            except Exception:
                continue

        if not candidates:
            return None

        candidates.sort(key=lambda x: (x[0], x[1]), reverse=True)
        return candidates[0][1]

    def index_directory(self, root_dir: str) -> dict:
        """Walk, chunk, embed, and persist the codebase index."""
        with self._lock:
            root = os.path.realpath(root_dir)
            if not os.path.isdir(root):
                raise ValueError(f"Not a directory: {root}")

            chunks = walk_and_chunk(root)
            if not chunks:
                raise ValueError("No source files found to index")

            idx_dir = self._get_index_dir(root)
            idx_dir.mkdir(parents=True, exist_ok=True)

            # Save chunks
            chunk_dicts = [c.to_dict() for c in chunks]
            with open(idx_dir / "chunks.json", "w") as f:
                json.dump(chunk_dicts, f)

            # Compute and save embeddings
            texts = [c.content for c in chunks]
            embeddings = None
            try:
                from app.rag.embeddings import embedder
                if embedder.available:
                    embeddings = embedder.embed(texts)
                    np.save(str(idx_dir / "embeddings.npy"), embeddings)
                    logger.info("Computed %d embeddings", len(texts))
            except Exception as e:
                logger.warning("Embedding failed (search will use keyword-only): %s", e)

            # Count unique files
            unique_files = len(set(c.file_path for c in chunks))

            # Save metadata
            meta = {
                "root_dir": root,
                "file_count": unique_files,
                "chunk_count": len(chunks),
                "indexed_at": time.time(),
            }
            with open(idx_dir / "meta.json", "w") as f:
                json.dump(meta, f)

            # Update in-memory state
            self._chunks = chunk_dicts
            self._embeddings = embeddings
            self._meta = meta
            self._index_dir = idx_dir

            return {
                "status": "indexed",
                "directory": root,
                "file_count": unique_files,
                "chunk_count": len(chunks),
            }

    def search(self, query: str, top_k: int = 10) -> List[SearchResult]:
        """Hybrid BM25 + vector search over the indexed codebase."""
        with self._lock:
            if not self._ensure_loaded():
                return []

            chunks = self._chunks
            if not chunks:
                return []

            texts = [c["content"] for c in chunks]

            bm25_results = self._bm25_search(texts, query, n=20)
            vector_results = self._vector_search(texts, query, n=20)

            if bm25_results and vector_results:
                fused = self._reciprocal_rank_fusion(bm25_results, vector_results)
            elif vector_results:
                fused = vector_results
            else:
                fused = bm25_results

            results: List[SearchResult] = []
            for item in fused[:top_k]:
                idx = item["index"]
                c = chunks[idx]
                results.append(SearchResult(
                    file_path=c["file_path"],
                    start_line=c["start_line"],
                    end_line=c["end_line"],
                    symbol=c["symbol"],
                    kind=c["kind"],
                    content=c["content"],
                    score=item["score"],
                    method=item["method"],
                ))

            return results

    def get_status(self) -> dict:
        """Return current index status."""
        with self._lock:
            if self._ensure_loaded():
                return {
                    "indexed": True,
                    "directory": self._meta.get("root_dir", ""),
                    "file_count": self._meta.get("file_count", 0),
                    "chunk_count": self._meta.get("chunk_count", 0),
                    "indexed_at": self._meta.get("indexed_at"),
                    "has_embeddings": self._embeddings is not None,
                }
            return {"indexed": False}

    def delete_index(self) -> bool:
        """Delete the current index from disk and memory."""
        with self._lock:
            if self._index_dir and self._index_dir.exists():
                shutil.rmtree(self._index_dir)
            self._chunks = None
            self._embeddings = None
            self._meta = None
            self._index_dir = None
            return True

    # ── BM25 search ──────────────────────────────────────────

    def _bm25_search(
        self, texts: List[str], query: str, n: int = 20
    ) -> List[Dict[str, Any]]:
        try:
            from rank_bm25 import BM25Okapi
        except ImportError:
            return self._keyword_search(texts, query, n)

        tokenized = [re.findall(r"\w+", t.lower()) for t in texts]
        query_tokens = re.findall(r"\w+", query.lower())
        if not query_tokens:
            return []

        bm25 = BM25Okapi(tokenized)
        scores = bm25.get_scores(query_tokens)

        scored = []
        for i, score in enumerate(scores):
            if score > 0:
                scored.append({"index": i, "score": float(score), "method": "bm25"})

        scored.sort(key=lambda x: x["score"], reverse=True)
        if scored:
            return scored[:n]
        return self._keyword_search(texts, query, n)

    def _keyword_search(
        self, texts: List[str], query: str, n: int = 20
    ) -> List[Dict[str, Any]]:
        query_terms = set(re.findall(r"\w+", query.lower()))
        scored = []
        for i, text in enumerate(texts):
            text_lower = text.lower()
            hits = sum(1 for t in query_terms if t in text_lower)
            exact = 2 if query.lower() in text_lower else 0
            score = hits + exact
            if score > 0:
                scored.append({"index": i, "score": score, "method": "keyword"})
        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:n]

    # ── Vector search ────────────────────────────────────────

    def _vector_search(
        self, texts: List[str], query: str, n: int = 20
    ) -> List[Dict[str, Any]]:
        if self._embeddings is None:
            return []

        try:
            from app.rag.embeddings import embedder
            if not embedder.available:
                return []
            query_emb = embedder.embed([query])
            scores = embedder.similarity(query_emb, self._embeddings)
        except Exception as e:
            logger.warning("Vector search failed: %s", e)
            return []

        scored = []
        for i, score in enumerate(scores):
            if score > 0.1:
                scored.append({"index": i, "score": float(score), "method": "vector"})
        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:n]

    # ── RRF fusion ───────────────────────────────────────────

    def _reciprocal_rank_fusion(
        self, *result_lists: List[Dict[str, Any]], k: int = 60
    ) -> List[Dict[str, Any]]:
        rrf_scores: Dict[int, float] = {}
        item_map: Dict[int, Dict[str, Any]] = {}

        for results in result_lists:
            for rank, item in enumerate(results):
                idx = item["index"]
                rrf_scores[idx] = rrf_scores.get(idx, 0.0) + 1.0 / (k + rank + 1)
                if idx not in item_map:
                    item_map[idx] = item

        fused = []
        for idx, score in sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True):
            entry = item_map[idx].copy()
            entry["score"] = round(score, 6)
            entry["method"] = "hybrid"
            fused.append(entry)
        return fused


# Module-level singleton
codebase_service = CodebaseIndexService()
