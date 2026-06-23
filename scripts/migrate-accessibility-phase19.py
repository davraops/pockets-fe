#!/usr/bin/env python3
"""P19: Deduplicate checkbox styles moved to shared.css."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = ROOT / "src" / "pages"

CHECKBOX_BLOCK = re.compile(
    r"/\* Basic Checkbox \*/\s*"
    r"\.checkbox-label input\[type='checkbox'\]\s*\{[^}]*\}\s*"
    r"\.checkbox-label input\[type='checkbox'\]:hover\s*\{[^}]*\}\s*"
    r"\.checkbox-label input\[type='checkbox'\]:focus-visible\s*\{[^}]*\}\s*\n?",
    re.MULTILINE,
)

CHECKBOX_BLOCK_ALT = re.compile(
    r"\.checkbox-label input\[type='checkbox'\]\s*\{[^}]*\}\s*"
    r"\.checkbox-label input\[type='checkbox'\]:hover\s*\{[^}]*\}\s*"
    r"\.checkbox-label input\[type='checkbox'\]:focus-visible\s*\{[^}]*\}\s*\n?",
    re.MULTILINE,
)


def main() -> None:
    updated: list[str] = []
    for path in sorted(PAGES.rglob("*.css")):
        original = path.read_text(encoding="utf-8")
        text = CHECKBOX_BLOCK.sub("", original)
        text = CHECKBOX_BLOCK_ALT.sub("", text)
        if text != original:
            path.write_text(text, encoding="utf-8")
            updated.append(str(path.relative_to(ROOT)))

    print(f"Removed duplicate checkbox blocks from {len(updated)} files:")
    for name in updated:
        print(f"  {name}")


if __name__ == "__main__":
    main()
