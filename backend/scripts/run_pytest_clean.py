#!/usr/bin/env python3
"""Run backend pytest suite and fail if warnings are emitted."""

from __future__ import annotations

import subprocess
import re
import sys
from pathlib import Path


def main() -> int:
    backend_root = Path(__file__).resolve().parents[1]
    cmd = [
        sys.executable,
        "-m",
        "pytest",
        "tests/",
        "-v",
        "--ignore=tests/test_shield.py",
    ]

    proc = subprocess.run(
        cmd,
        cwd=backend_root,
        capture_output=True,
        text=True,
    )

    if proc.stdout:
        print(proc.stdout, end="")
    if proc.stderr:
        print(proc.stderr, end="", file=sys.stderr)

    if proc.returncode != 0:
        return proc.returncode

    combined = f"{proc.stdout}\n{proc.stderr}"
    lowered = combined.lower()
    warning_pattern = re.compile(
        r"\b(?:Deprecation|PendingDeprecation|Resource|Runtime|User|Future|Syntax|Import)Warning\b"
    )
    if "warnings summary" in lowered or warning_pattern.search(combined):
        print("\nFailing because pytest emitted warnings. Fix or explicitly filter them.")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
