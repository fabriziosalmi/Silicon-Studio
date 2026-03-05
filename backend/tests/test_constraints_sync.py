import importlib.util
from pathlib import Path


def _load_checker_module():
    script_path = Path(__file__).resolve().parents[1] / "scripts" / "check_constraints_sync.py"
    spec = importlib.util.spec_from_file_location("check_constraints_sync", script_path)
    module = importlib.util.module_from_spec(spec)
    assert spec is not None and spec.loader is not None
    spec.loader.exec_module(module)
    return module


def test_constraints_sync_passes_when_sets_match(tmp_path, monkeypatch):
    module = _load_checker_module()

    pyproject = tmp_path / "pyproject.toml"
    constraints = tmp_path / "constraints.txt"

    pyproject.write_text(
        """
[project]
dependencies = [
    "fastapi>=0.110.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
]
""".strip()
        + "\n",
        encoding="utf-8",
    )
    constraints.write_text(
        """
fastapi==0.110.0
pytest==8.0.0
""".strip()
        + "\n",
        encoding="utf-8",
    )

    monkeypatch.setattr(module, "PYPROJECT", pyproject)
    monkeypatch.setattr(module, "CONSTRAINTS", constraints)

    assert module.main() == 0


def test_constraints_sync_fails_when_missing_dep(tmp_path, monkeypatch):
    module = _load_checker_module()

    pyproject = tmp_path / "pyproject.toml"
    constraints = tmp_path / "constraints.txt"

    pyproject.write_text(
        """
[project]
dependencies = [
    "fastapi>=0.110.0",
    "numpy>=1.26.0",
]
""".strip()
        + "\n",
        encoding="utf-8",
    )
    constraints.write_text("fastapi==0.110.0\n", encoding="utf-8")

    monkeypatch.setattr(module, "PYPROJECT", pyproject)
    monkeypatch.setattr(module, "CONSTRAINTS", constraints)

    assert module.main() == 1


def test_constraints_sync_fails_on_unpinned_constraint(tmp_path, monkeypatch):
    module = _load_checker_module()

    pyproject = tmp_path / "pyproject.toml"
    constraints = tmp_path / "constraints.txt"

    pyproject.write_text(
        """
[project]
dependencies = [
    "fastapi>=0.110.0",
]
""".strip()
        + "\n",
        encoding="utf-8",
    )
    constraints.write_text("fastapi>=0.110.0\n", encoding="utf-8")

    monkeypatch.setattr(module, "PYPROJECT", pyproject)
    monkeypatch.setattr(module, "CONSTRAINTS", constraints)

    assert module.main() == 1
