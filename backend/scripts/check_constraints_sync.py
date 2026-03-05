#!/usr/bin/env python3
"""Validate that backend/constraints.txt stays in sync with backend/pyproject.toml."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PYPROJECT = ROOT / "pyproject.toml"
CONSTRAINTS = ROOT / "constraints.txt"


def _parse_pyproject_deps(pyproject_path: Path) -> set[str]:
    lines = pyproject_path.read_text(encoding="utf-8").splitlines()
    deps: set[str] = set()

    in_project = False
    in_optional = False
    in_list = False

    for raw_line in lines:
        line = raw_line.strip()

        if line.startswith("[") and line.endswith("]"):
            in_project = line == "[project]"
            in_optional = line == "[project.optional-dependencies]"
            in_list = False
            continue

        if in_project and line.startswith("dependencies") and "[" in line:
            in_list = True
            continue

        if in_optional and re.match(r"^[a-zA-Z0-9_-]+\s*=\s*\[$", line):
            in_list = True
            continue

        if in_list:
            if line.startswith("]"):
                in_list = False
                continue

            m = re.match(r'^"([^"]+)"\s*,?$', line)
            if not m:
                continue

            dep_expr = m.group(1)
            dep_name = re.split(r"[<>=!~;\[\s]", dep_expr, maxsplit=1)[0].strip().lower()
            if dep_name:
                deps.add(dep_name)

    return deps


def _parse_constraints(constraints_path: Path) -> set[str]:
    names: set[str] = set()
    for line in constraints_path.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if not s or s.startswith("#"):
            continue

        if "==" not in s:
            raise ValueError(f"Constraint must be pinned with '==': {s}")

        name = s.split("==", 1)[0].strip().lower()
        if not re.match(r"^[a-z0-9][a-z0-9._-]*$", name):
            raise ValueError(f"Invalid package name in constraints: {s}")

        names.add(name)

    return names


def main() -> int:
    if not PYPROJECT.exists():
        print(f"ERROR: Missing {PYPROJECT}")
        return 1
    if not CONSTRAINTS.exists():
        print(f"ERROR: Missing {CONSTRAINTS}")
        return 1

    try:
        pyproject_deps = _parse_pyproject_deps(PYPROJECT)
        constraints_deps = _parse_constraints(CONSTRAINTS)
    except ValueError as err:
        print(f"ERROR: {err}")
        return 1

    missing = sorted(pyproject_deps - constraints_deps)
    extra = sorted(constraints_deps - pyproject_deps)

    if missing or extra:
        print("Dependency sync check failed.")
        if missing:
            print("- Missing in constraints.txt:")
            for name in missing:
                print(f"  - {name}")
        if extra:
            print("- Present in constraints.txt but not declared in pyproject.toml:")
            for name in extra:
                print(f"  - {name}")
        return 1

    print("Dependency sync check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
