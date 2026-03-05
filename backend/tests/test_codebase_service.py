import json
from concurrent.futures import ThreadPoolExecutor

from app.codebase.service import CodebaseIndexService


def test_ensure_loaded_picks_latest_index(monkeypatch, tmp_path):
    monkeypatch.setattr("app.codebase.service.INDEX_ROOT", tmp_path)

    old_root = str(tmp_path / "workspace-old")
    new_root = str(tmp_path / "workspace-new")

    old_dir = tmp_path / CodebaseIndexService._dir_hash(old_root)
    new_dir = tmp_path / CodebaseIndexService._dir_hash(new_root)
    old_dir.mkdir(parents=True)
    new_dir.mkdir(parents=True)

    old_meta = {
        "root_dir": old_root,
        "file_count": 1,
        "chunk_count": 1,
        "indexed_at": 1000.0,
    }
    new_meta = {
        "root_dir": new_root,
        "file_count": 1,
        "chunk_count": 1,
        "indexed_at": 2000.0,
    }

    chunk_payload = [
        {
            "file_path": "a.py",
            "start_line": 1,
            "end_line": 1,
            "symbol": "",
            "kind": "block",
            "content": "print('x')\n",
        }
    ]

    with open(old_dir / "meta.json", "w") as f:
        json.dump(old_meta, f)
    with open(old_dir / "chunks.json", "w") as f:
        json.dump(chunk_payload, f)

    with open(new_dir / "meta.json", "w") as f:
        json.dump(new_meta, f)
    with open(new_dir / "chunks.json", "w") as f:
        json.dump(chunk_payload, f)

    svc = CodebaseIndexService()
    loaded = svc._ensure_loaded()

    assert loaded is True
    status = svc.get_status()
    assert status["indexed"] is True
    assert status["directory"] == new_root
    assert status["indexed_at"] == 2000.0


def test_concurrent_status_search_delete_do_not_raise():
    svc = CodebaseIndexService()
    svc._chunks = [
        {
            "file_path": "a.py",
            "start_line": 1,
            "end_line": 1,
            "symbol": "",
            "kind": "block",
            "content": "def alpha():\n    return 1\n",
        }
    ]
    svc._embeddings = None
    svc._meta = {
        "root_dir": "/tmp/workspace",
        "file_count": 1,
        "chunk_count": 1,
        "indexed_at": 123.0,
    }
    svc._index_dir = None

    def _status():
        return svc.get_status()

    def _search():
        return svc.search("alpha", top_k=1)

    def _delete():
        return svc.delete_index()

    with ThreadPoolExecutor(max_workers=3) as ex:
        futures = [
            ex.submit(_status),
            ex.submit(_search),
            ex.submit(_delete),
            ex.submit(_status),
            ex.submit(_search),
        ]

        for future in futures:
            future.result()
