"""Shared security utilities for path validation and input sanitization."""

import re
from pathlib import Path

# Base data directory for all user-facing storage
DATA_DIR = Path.home() / ".silicon-studio"

# Valid UUID or simple slug pattern for IDs (notes, conversations, etc.)
_SAFE_ID_RE = re.compile(r'^[a-zA-Z0-9_-]+$')


def safe_id(value: str) -> str:
    """Validate and return a safe ID string.

    Rejects path separators, dots, and other special characters
    to prevent directory traversal via note_id, conversation_id, etc.

    Raises ValueError if the ID contains unsafe characters.
    """
    if not value or not _SAFE_ID_RE.match(value):
        raise ValueError(f"Invalid ID: must be alphanumeric, hyphens, or underscores")
    return value


def safe_path_within(user_path: str, base_dir: Path) -> Path:
    """Resolve a user-supplied path and verify it's within base_dir.

    Returns the resolved Path if safe.
    Raises ValueError if the path escapes the base directory.
    """
    resolved = Path(user_path).resolve()
    base_resolved = base_dir.resolve()
    if not resolved.is_relative_to(base_resolved):
        raise ValueError(
            f"Path '{user_path}' is outside the allowed directory"
        )
    return resolved


def safe_user_file(user_path: str) -> Path:
    """Validate a user-supplied file path for read operations.

    Allows paths under the user's home directory only.
    Blocks access to system paths and parent directory escapes.
    Also blocks access to sensitive configuration directories.

    Returns the resolved Path if safe.
    Raises ValueError if the path is not under home or is sensitive.
    """
    resolved = Path(user_path).resolve()
    home = Path.home().resolve()

    if not resolved.is_relative_to(home):
        raise ValueError(
            f"Access denied: path must be under your home directory"
        )

    # Block access to sensitive directories
    sensitive_dirs = {".ssh", ".gnupg", ".aws", ".kube", ".docker"}
    for part in resolved.relative_to(home).parts:
        if part in sensitive_dirs:
            raise ValueError(f"Access denied: sensitive directory '{part}' is restricted")

    return resolved
