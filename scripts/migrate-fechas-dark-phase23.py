#!/usr/bin/env python3
"""P23: Remove Fechas [data-theme='dark'] overrides replaced by themed tokens."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FECHAS_CSS = ROOT / "src" / "pages" / "Fechas.css"
PAGES = ROOT / "src" / "pages"

DARK_OVERRIDE = re.compile(
    r"\n\[data-theme='dark'\][^{]+\{[^{}]*\}",
    re.MULTILINE,
)


def remove_dark_blocks(css: str) -> str:
    prev = None
    while prev != css:
        prev = css
        css = DARK_OVERRIDE.sub("", css)
    return re.sub(r"\n{3,}", "\n\n", css)


def count_dark_overrides(css: str) -> int:
    return len(re.findall(r"\[data-theme='dark'\]", css))


def main() -> None:
    if not FECHAS_CSS.exists():
        print("Fechas.css not found", file=sys.stderr)
        sys.exit(1)

    original = FECHAS_CSS.read_text(encoding="utf-8")
    before = count_dark_overrides(original)
    cleaned = remove_dark_blocks(original)

    if before == 0:
        print("Fechas.css: 0 dark overrides (already clean)")
    elif cleaned != original:
        FECHAS_CSS.write_text(cleaned, encoding="utf-8")
        after = count_dark_overrides(cleaned)
        print(f"Fechas.css: removed {before - after} dark override blocks ({before}→{after})")
    else:
        print(f"Fechas.css: {before} dark overrides remain (manual fix needed)", file=sys.stderr)
        sys.exit(1)

    pages_remaining = sum(
        count_dark_overrides(f.read_text(encoding="utf-8"))
        for f in PAGES.glob("*.css")
    )
    print(f"Remaining [data-theme='dark'] in pages/*.css: {pages_remaining}")


if __name__ == "__main__":
    main()
