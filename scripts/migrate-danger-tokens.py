#!/usr/bin/env python3
"""Replace hardcoded danger reds with theme-aware CSS custom properties."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"

REPLACEMENTS: list[tuple[str, str]] = [
    (r"rgba\(255,\s*59,\s*48,\s*0\.05\)", "var(--color-danger-bg-soft)"),
    (r"rgba\(255,\s*59,\s*48,\s*0\.08\)", "var(--color-danger-bg-soft)"),
    (r"rgba\(255,\s*59,\s*48,\s*0\.1\)", "var(--color-danger-bg-soft)"),
    (r"rgba\(255,\s*59,\s*48,\s*0\.12\)", "var(--color-danger-bg-soft-hover)"),
    (r"rgba\(255,\s*59,\s*48,\s*0\.15\)", "var(--color-danger-bg-soft-hover)"),
    (r"rgba\(255,\s*59,\s*48,\s*0\.2\)", "var(--color-danger-bg-medium)"),
    (r"rgba\(255,\s*59,\s*48,\s*0\.25\)", "var(--color-danger-bg-medium)"),
    (r"rgba\(255,\s*59,\s*48,\s*0\.3\)", "var(--color-danger-border-soft)"),
    (r"rgba\(255,\s*59,\s*48,\s*0\.4\)", "var(--color-danger-border-medium)"),
    (r"rgba\(255,\s*59,\s*48,\s*0\.5\)", "var(--color-danger-border-medium)"),
    (r"rgba\(255,\s*59,\s*48,\s*0\.6\)", "var(--color-danger-border-medium)"),
    (r"rgba\(255,\s*59,\s*48,\s*0\.8\)", "var(--color-danger-text-strong)"),
    (r"rgba\(255,\s*59,\s*48,\s*0\.9\)", "var(--color-danger-text)"),
    (r"rgba\(255,\s*59,\s*48,\s*0\.95\)", "var(--color-danger-text-strong)"),
    (r"#FF3B30", "var(--color-danger-solid)"),
    (r"#ff3b30", "var(--color-danger-solid)"),
]

SKIP_FILES = {"index.css"}


def migrate_file(path: Path) -> int:
    if path.name in SKIP_FILES:
        return 0
    text = path.read_text(encoding="utf-8")
    original = text
    for pattern, repl in REPLACEMENTS:
        text = re.sub(pattern, repl, text)
    if text != original:
        path.write_text(text, encoding="utf-8")
        return 1
    return 0


def main() -> None:
    updated = 0
    for css in SRC.rglob("*.css"):
        if migrate_file(css):
            updated += 1
            print(f"  {css.relative_to(ROOT)}")
    print(f"Done: {updated} CSS files updated")


if __name__ == "__main__":
    main()
