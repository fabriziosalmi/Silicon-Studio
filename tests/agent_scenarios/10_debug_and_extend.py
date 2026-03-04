# Test 10: Debug + Extend (Hard — Multi-Turn)
# Prompt: "run this file, fix all errors, then add a `search` method that finds
#          entries by partial title match (case-insensitive) and a `to_json` method"
# Expected: Agent runs the file, reads errors, patches bugs, implements new features,
#           runs again to verify. Should require 2-3 tool iterations minimum.

import re
from datetime import datetime

class MiniDB:
    """A tiny in-memory document store."""

    def __init__(self):
        self._docs: dict[int, dict] = {}
        self._next_id = 1
        self._created_at = datetime.now()

    def insert(self, title: str, tags: list[str] = None, body: str = "") -> dict:
        """Insert a document. Returns the doc with an 'id' field."""
        doc = {
            "id": self._next_id,
            "title": title,
            "tags": tags or [],
            "body": body,
            "created": datetime.now().isoformat(),
        }
        self._docs[self._next_id] = doc
        self._next_id += 1
        return doc

    def get(self, doc_id: int) -> dict:
        """Get doc by id. Raises KeyError if missing."""
        return self._docs[doc_id]

    def update(self, doc_id: int, **fields) -> dict:
        """Update fields of an existing doc."""
        doc = self._docs[doc_id]
        for k, v in fields.items():
            doc[k] = v  # BUG: allows overwriting 'id' and 'created'
        return doc

    def delete(self, doc_id: int) -> bool:
        """Delete a doc. Return True if existed."""
        if doc_id in self._docs:
            del self._docs[doc_id]
            return True
        return False

    def list_all(self, tag: str = None) -> list[dict]:
        """List docs, optionally filtered by tag."""
        docs = list(self._docs.values())
        if tag:
            docs = [d for d in docs if tag in d["tags"]]
        return sorted(docs, key=lambda d: d["created"], reverse=True)

    def count(self) -> int:
        return len(self._docs)

    def find_by_tags(self, tags: list[str], match_all: bool = False) -> list[dict]:
        """Find docs that have any (or all) of the given tags."""
        results = []
        for doc in self._docs.values():
            if match_all:
                if all(t in doc["tags"] for t in tags):
                    results.append(doc)
            else:
                if any(t in doc["tags"] for t in tags):
                    results.append(doc)
        return results

    def export_stats(self) -> dict:
        """Return stats about the DB."""
        all_tags = {}
        for doc in self._docs.values():
            for t in doc["tags"]:
                all_tags[t] = all_tags.get(t, 0) + 1
        return {
            "total_docs": self.count(),
            "uptime_seconds": (datetime.now() - self._created_at).total_seconds,  # BUG: missing ()
            "tag_counts": all_tags,
        }


# --- test suite ---
if __name__ == "__main__":
    db = MiniDB()

    # Basic CRUD
    d1 = db.insert("Hello World", tags=["intro", "test"], body="First doc")
    d2 = db.insert("Python Tips", tags=["python", "tips"])
    d3 = db.insert("Advanced Python", tags=["python", "advanced"])

    assert db.count() == 3
    assert db.get(1)["title"] == "Hello World"

    # Update — should not allow overwriting protected fields
    db.update(1, body="Updated body")
    assert db.get(1)["body"] == "Updated body"
    db.update(1, id=999)  # This should be blocked!
    assert db.get(1)["id"] == 1, "Update should not allow changing 'id'"

    # Delete
    assert db.delete(2) is True
    assert db.delete(2) is False
    assert db.count() == 2

    # Tag search
    py_docs = db.find_by_tags(["python"])
    assert len(py_docs) == 1  # d2 was deleted, only d3 remains

    # Export stats
    stats = db.export_stats()
    assert stats["total_docs"] == 2
    assert isinstance(stats["uptime_seconds"], float)

    # List all sorted by created desc
    all_docs = db.list_all()
    assert all_docs[0]["id"] == 3  # newest first

    print("All tests passed!")
