#!/usr/bin/env python3
"""P17: Migrate typography literals to tokens and dedupe debug-option-icon."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
PAGES = SRC / "pages"

SKIP_FILES = {"index.css"}

FONT_SIZE_REPLACEMENTS: list[tuple[str, str]] = [
    ("font-size: 2rem", "font-size: var(--font-size-hero)"),
    ("font-size: 1.5rem", "font-size: var(--font-size-xl)"),
    ("font-size: 1.25rem", "font-size: var(--font-size-lg)"),
    ("font-size: 1.125rem", "font-size: var(--font-size-base)"),
    ("font-size: 28px", "font-size: var(--font-size-xxl)"),
    ("font-size: 24px", "font-size: var(--font-size-xl)"),
    ("font-size: 0.9em", "font-size: var(--font-size-xs)"),
]

ICON_DIM_REPLACEMENTS: list[tuple[str, str]] = [
    ("width: 1.5rem", "width: var(--font-size-xl)"),
    ("height: 1.5rem", "height: var(--font-size-xl)"),
    ("width: 1.25rem", "width: var(--font-size-lg)"),
    ("height: 1.25rem", "height: var(--font-size-lg)"),
    ("width: 1.125rem", "width: var(--font-size-base)"),
    ("height: 1.125rem", "height: var(--font-size-base)"),
]

FONT_WEIGHT_REPLACEMENTS: list[tuple[str, str]] = [
    ("font-weight: 700", "font-weight: var(--font-weight-bold)"),
    ("font-weight: 600", "font-weight: var(--font-weight-semibold)"),
    ("font-weight: 500", "font-weight: var(--font-weight-medium)"),
    ("font-weight: 400", "font-weight: var(--font-weight-normal)"),
]

DEBUG_OPTION_ICON_BLOCK = re.compile(
    r"\.debug-option-icon\s*\{[^}]*\}\s*\n?",
    re.MULTILINE,
)

LITERAL_FONT_SIZE = re.compile(r"font-size:\s*(?!var\()[^;]+;")


def count_literal_font_sizes(paths: list[Path]) -> int:
    total = 0
    for path in paths:
        if path.name in SKIP_FILES:
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            if "font-size:" in line and "var(--font-size" not in line:
                total += 1
    return total


def patch_file(path: Path) -> bool:
    if path.name in SKIP_FILES:
        return False

    original = path.read_text(encoding="utf-8")
    text = original

    if path.parent == PAGES:
        text = DEBUG_OPTION_ICON_BLOCK.sub("", text)

    for old, new in FONT_SIZE_REPLACEMENTS:
        text = text.replace(old, new)
    for old, new in ICON_DIM_REPLACEMENTS:
        text = text.replace(old, new)

    # Font-weight migration only in page CSS (large CRUD files)
    if path.parent == PAGES:
        for old, new in FONT_WEIGHT_REPLACEMENTS:
            text = text.replace(old, new)

    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> None:
    paths = sorted(SRC.rglob("*.css"))
    before_sizes = count_literal_font_sizes(paths)

    updated: list[str] = []
    for path in paths:
        if patch_file(path):
            updated.append(str(path.relative_to(ROOT)))

    after_sizes = count_literal_font_sizes(paths)
    debug_blocks = sum(
        1 for path in PAGES.rglob("*.css") if ".debug-option-icon" in path.read_text(encoding="utf-8")
    )

    print(f"Updated {len(updated)} files:")
    for name in updated:
        print(f"  {name}")

    print(f"\nLiteral font-size lines: {before_sizes} → {after_sizes}")
    print(f"Page-level .debug-option-icon blocks remaining: {debug_blocks}")


if __name__ == "__main__":
    main()
