"""AST-aware code chunking for the codebase indexer.

Splits source files into meaningful chunks:
- Python: uses ast.parse() to extract classes, methods, and functions
- Everything else: sliding-window line-based chunking
"""

import ast
import logging
import os
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List

logger = logging.getLogger(__name__)

# Directories to always skip
SKIP_DIRS = {
    "node_modules", ".git", ".venv", "venv", "__pycache__", ".mypy_cache",
    ".pytest_cache", "dist", "build", ".next", ".nuxt", "coverage",
    ".tox", ".eggs", "*.egg-info", ".cache", ".turbo",
}

# Extensions we know how to chunk
TEXT_EXTENSIONS = {
    ".py", ".js", ".ts", ".tsx", ".jsx", ".mjs", ".cjs",
    ".html", ".css", ".scss", ".less",
    ".json", ".yaml", ".yml", ".toml",
    ".md", ".mdx", ".rst", ".txt",
    ".sh", ".bash", ".zsh",
    ".sql", ".graphql",
    ".rs", ".go", ".java", ".kt", ".swift", ".c", ".cpp", ".h", ".hpp",
    ".rb", ".php", ".lua", ".r", ".R",
    ".dockerfile", ".tf", ".hcl",
}

# Max file size to chunk (500 KB)
MAX_FILE_BYTES = 500 * 1024


@dataclass
class Chunk:
    file_path: str
    start_line: int
    end_line: int
    symbol: str
    kind: str  # "function", "class", "method", "module", "block"
    content: str

    def to_dict(self) -> dict:
        return asdict(self)


def _should_skip_dir(name: str) -> bool:
    return name in SKIP_DIRS or name.startswith(".")


def _is_binary(path: Path) -> bool:
    try:
        with open(path, "rb") as f:
            chunk = f.read(8192)
            return b"\x00" in chunk
    except OSError:
        return True


def chunk_python_file(file_path: str, source: str) -> List[Chunk]:
    """Parse Python source with AST and extract classes/functions as chunks."""
    lines = source.splitlines(keepends=True)
    chunks: List[Chunk] = []

    try:
        tree = ast.parse(source, filename=file_path)
    except SyntaxError:
        # Fall back to generic chunking if file has syntax errors
        return chunk_generic_file(file_path, source)

    parent_map: dict[ast.AST, ast.AST] = {}
    for parent in ast.walk(tree):
        for child in ast.iter_child_nodes(parent):
            parent_map[child] = parent

    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            start = node.lineno
            end = node.end_lineno or start
            body = "".join(lines[start - 1 : end])
            chunks.append(Chunk(
                file_path=file_path,
                start_line=start,
                end_line=end,
                symbol=node.name,
                kind="class",
                content=body,
            ))
            # Also extract methods individually
            for item in node.body:
                if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    m_start = item.lineno
                    m_end = item.end_lineno or m_start
                    m_body = "".join(lines[m_start - 1 : m_end])
                    chunks.append(Chunk(
                        file_path=file_path,
                        start_line=m_start,
                        end_line=m_end,
                        symbol=f"{node.name}.{item.name}",
                        kind="method",
                        content=m_body,
                    ))

        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            parent = parent_map.get(node)
            if isinstance(parent, ast.ClassDef):
                continue
            if not isinstance(parent, ast.Module):
                continue

            start = node.lineno
            end = node.end_lineno or start
            body = "".join(lines[start - 1 : end])
            chunks.append(Chunk(
                file_path=file_path,
                start_line=start,
                end_line=end,
                symbol=node.name,
                kind="function",
                content=body,
            ))

    # If we got nothing useful (e.g. just assignments/imports), chunk the whole file
    if not chunks:
        return chunk_generic_file(file_path, source)

    return chunks


def chunk_generic_file(
    file_path: str,
    source: str,
    max_lines: int = 60,
    overlap: int = 10,
) -> List[Chunk]:
    """Sliding-window line-based chunking for non-Python files."""
    lines = source.splitlines(keepends=True)
    if not lines:
        return []

    chunks: List[Chunk] = []
    i = 0
    while i < len(lines):
        end = min(i + max_lines, len(lines))
        content = "".join(lines[i:end])
        chunks.append(Chunk(
            file_path=file_path,
            start_line=i + 1,
            end_line=end,
            symbol="",
            kind="block",
            content=content,
        ))
        if end >= len(lines):
            break
        i += max_lines - overlap

    return chunks


def chunk_file(path: Path) -> List[Chunk]:
    """Chunk a single file, dispatching by extension."""
    try:
        source = path.read_text(encoding="utf-8", errors="replace")
    except OSError as e:
        logger.debug("Cannot read %s: %s", path, e)
        return []

    if not source.strip():
        return []

    file_path = str(path)
    if path.suffix == ".py":
        return chunk_python_file(file_path, source)
    return chunk_generic_file(file_path, source)


def walk_and_chunk(root_dir: str) -> List[Chunk]:
    """Walk a directory tree and chunk all recognized source files."""
    root = Path(root_dir).resolve()
    all_chunks: List[Chunk] = []
    file_count = 0

    for dirpath, dirnames, filenames in os.walk(root):
        # Prune skipped directories in-place
        dirnames[:] = [d for d in dirnames if not _should_skip_dir(d)]

        for fname in filenames:
            fpath = Path(dirpath) / fname
            try:
                if fpath.suffix.lower() not in TEXT_EXTENSIONS:
                    continue
                if fpath.stat().st_size > MAX_FILE_BYTES:
                    continue
                if _is_binary(fpath):
                    continue

                # Use relative path from root for readability
                rel_path = str(fpath.relative_to(root))
                chunks = chunk_file(fpath)
                # Rewrite file_path to relative
                for c in chunks:
                    c.file_path = rel_path
                all_chunks.extend(chunks)
                file_count += 1
            except Exception as e:
                logger.warning("Skipping file %s: %s", fpath, e)
                continue

    logger.info("Chunked %d files into %d chunks from %s", file_count, len(all_chunks), root)
    return all_chunks
