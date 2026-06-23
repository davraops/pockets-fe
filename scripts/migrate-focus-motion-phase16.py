#!/usr/bin/env python3
"""P16: Unify focus outlines and motion tokens across CSS."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"

REPLACEMENTS: list[tuple[str, str]] = [
    (
        "outline: 2px solid var(--accent-primary-border);\n  outline-offset: 2px;",
        "outline: var(--focus-outline-width) solid var(--focus-outline-color);\n  outline-offset: var(--focus-outline-offset);",
    ),
    (
        "outline: 2px solid var(--accent-primary-border-strong);\n  outline-offset: 2px;",
        "outline: var(--focus-outline-width) solid var(--focus-outline-color-strong);\n  outline-offset: var(--focus-outline-offset);",
    ),
    (
        "outline: 2px solid var(--color-danger-border-medium);\n  outline-offset: 2px;",
        "outline: var(--focus-outline-width) solid var(--focus-danger-outline-color);\n  outline-offset: var(--focus-outline-offset);",
    ),
    (
        "outline: 2px solid var(--accent-primary-border);",
        "outline: var(--focus-outline-width) solid var(--focus-outline-color);",
    ),
    (
        "outline: 2px solid var(--accent-primary-border-strong);",
        "outline: var(--focus-outline-width) solid var(--focus-outline-color-strong);",
    ),
    (
        "outline: 2px solid var(--color-danger-border-medium);",
        "outline: var(--focus-outline-width) solid var(--focus-danger-outline-color);",
    ),
    (
        "outline: 2px solid rgba(0, 122, 255, 0.5);",
        "outline: var(--focus-outline-width) solid var(--focus-outline-color);",
    ),
    (
        "outline: 2px solid rgba(0, 199, 190, 0.5);",
        "outline: var(--focus-outline-width) solid var(--focus-outline-color);",
    ),
    (
        "outline: 2px solid rgba(175, 82, 222, 0.5);",
        "outline: var(--focus-outline-width) solid var(--focus-outline-color);",
    ),
    (
        "outline: 2px solid var(--app-icon-focus-outline);\n  outline-offset: 4px;",
        "outline: var(--focus-outline-width) solid var(--app-icon-focus-outline);\n  outline-offset: var(--focus-outline-offset-lg);",
    ),
    ("outline-offset: -2px;", "outline-offset: var(--focus-outline-offset-inset);"),
    ("outline-offset: 2px;", "outline-offset: var(--focus-outline-offset);"),
]

FOCUS_TO_VISIBLE = [
    (".notification-close:focus {", ".notification-close:focus-visible {"),
]


def count_pattern(text: str, pattern: str) -> int:
    return text.count(pattern)


def patch_file(path: Path) -> bool:
    # Skip token definitions in index.css
    if path.name == "index.css":
        return False

    original = path.read_text(encoding="utf-8")
    text = original
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    for old, new in FOCUS_TO_VISIBLE:
        text = text.replace(old, new)
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> None:
    paths = sorted(SRC.rglob("*.css"))
    before = sum(
        count_pattern(path.read_text(encoding="utf-8"), "outline: 2px solid") for path in paths
    )

    updated: list[str] = []
    for path in paths:
        if patch_file(path):
            updated.append(str(path.relative_to(ROOT)))

    after = sum(
        count_pattern(path.read_text(encoding="utf-8"), "outline: 2px solid") for path in paths
    )

    print(f"Updated {len(updated)} files:")
    for name in updated:
        print(f"  {name}")

    print(f"\nHardcoded 'outline: 2px solid': {before} → {after}")


if __name__ == "__main__":
    main()
