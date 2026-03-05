from app.codebase.chunker import chunk_python_file
from app.codebase.chunker import walk_and_chunk


def test_chunk_python_file_ignores_nested_functions():
    source = """
class MyClass:
    def method(self):
        def inner_in_method():
            return 1
        return inner_in_method()

def top_level():
    def inner_in_function():
        return 2
    return inner_in_function()
""".lstrip()

    chunks = chunk_python_file("sample.py", source)
    symbols = {chunk.symbol for chunk in chunks}

    assert "MyClass" in symbols
    assert "MyClass.method" in symbols
    assert "top_level" in symbols
    assert "inner_in_method" not in symbols
    assert "inner_in_function" not in symbols


def test_chunk_python_file_syntax_error_falls_back_to_blocks():
    source = "def broken(:\n    pass\n"

    chunks = chunk_python_file("broken.py", source)

    assert len(chunks) == 1
    assert chunks[0].kind == "block"
    assert chunks[0].start_line == 1


def test_walk_and_chunk_skips_file_on_stat_error(monkeypatch, tmp_path):
    bad_file = tmp_path / "bad.py"
    good_file = tmp_path / "good.py"
    bad_file.write_text("print('bad')\n", encoding="utf-8")
    good_file.write_text("def ok():\n    return 1\n", encoding="utf-8")

    from pathlib import Path

    original_stat = Path.stat

    def _patched_stat(self, *args, **kwargs):
        if self.name == "bad.py":
            raise OSError("simulated stat failure")
        return original_stat(self, *args, **kwargs)

    monkeypatch.setattr(Path, "stat", _patched_stat)

    chunks = walk_and_chunk(str(tmp_path))
    paths = {c.file_path for c in chunks}

    assert any(path.endswith("good.py") for path in paths)
    assert not any(path.endswith("bad.py") for path in paths)
