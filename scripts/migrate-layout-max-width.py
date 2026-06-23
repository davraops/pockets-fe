#!/usr/bin/env python3
"""Add app-page-content-wide to TSX and strip duplicated max-width from page CSS."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
PAGES = SRC / "pages"

# Hub pages stay at --layout-max-width-hub (default app-page-content)
HUB_CONTENT_CLASSES = {"finanzas-content", "ajustes-content"}

WIDE_CLASS = "app-page-content-wide"

CONTENT_BLOCK_RE = re.compile(
    r"(\.[a-z0-9áéíóúñ_-]+-content\s*\{[^}]*?)"
    r"\s*max-width:\s*(?:800|1200)px;\s*"
    r"(?:margin:\s*0\s+auto;\s*)?",
    re.DOTALL | re.IGNORECASE,
)


def find_wide_content_classes() -> set[str]:
    wide: set[str] = set()
    for css in PAGES.glob("*.css"):
        text = css.read_text(encoding="utf-8")
        for match in re.finditer(r"\.([a-z0-9áéíóúñ_-]+-content)\s*\{[^}]*max-width:\s*1200px", text, re.I):
            cls = match.group(1)
            if cls not in HUB_CONTENT_CLASSES:
                wide.add(cls)
    return wide


def strip_content_max_width(css_path: Path) -> bool:
    text = css_path.read_text(encoding="utf-8")
    new_text, n = CONTENT_BLOCK_RE.subn(r"\1", text)
    if n:
        css_path.write_text(new_text, encoding="utf-8")
    return n > 0


def add_wide_class_to_tsx(tsx_path: Path, content_classes: set[str]) -> bool:
    text = tsx_path.read_text(encoding="utf-8")
    if WIDE_CLASS in text:
        return False
    changed = False
    for cls in content_classes:
        pattern = rf'className="app-page-content {cls}"'
        replacement = f'className="app-page-content {WIDE_CLASS} {cls}"'
        if pattern in text:
            text = text.replace(pattern, replacement)
            changed = True
        # multiline / wrapped className
        pattern2 = rf'className=\{{`app-page-content {cls}`\}}'
        replacement2 = f'className={{`app-page-content {WIDE_CLASS} {cls}`}}'
        if pattern2 in text:
            text = text.replace(pattern2, replacement2)
            changed = True
    if changed:
        tsx_path.write_text(text, encoding="utf-8")
    return changed


def main() -> None:
    wide_classes = find_wide_content_classes()
    print(f"Wide content classes: {len(wide_classes)}")

    css_stripped = 0
    for css in sorted(PAGES.glob("*.css")):
        if strip_content_max_width(css):
            css_stripped += 1
            print(f"  stripped max-width: {css.name}")

  # AppPage.css financial block
    app_page = PAGES / "AppPage.css"
    if app_page.exists():
        t = app_page.read_text(encoding="utf-8")
        t2 = re.sub(r"max-width:\s*1200px;\s*", "", t)
        if t2 != t:
            app_page.write_text(t2, encoding="utf-8")
            css_stripped += 1

    tsx_updated = 0
    for tsx in sorted(PAGES.glob("*.tsx")):
        page_classes = {c for c in wide_classes if c.replace("-content", "") in tsx.stem.lower().replace("ñ", "n") or c in tsx.read_text(encoding="utf-8")}
        # match by presence in file
        file_text = tsx.read_text(encoding="utf-8")
        matched = {c for c in wide_classes if c in file_text}
        if matched and add_wide_class_to_tsx(tsx, matched):
            tsx_updated += 1
            print(f"  added wide class: {tsx.name}")

    # CDTs uses app-page-content without module suffix on inner div sometimes
    cdts = PAGES / "CDTs.tsx"
    if cdts.exists():
        t = cdts.read_text(encoding="utf-8")
        if WIDE_CLASS not in t and 'className="app-page-content"' in t:
            t = t.replace('className="app-page-content"', f'className="app-page-content {WIDE_CLASS}"', 1)
            cdts.write_text(t, encoding="utf-8")
            tsx_updated += 1
            print("  added wide class: CDTs.tsx (bare app-page-content)")

    print(f"Done: {css_stripped} CSS files, {tsx_updated} TSX files")


if __name__ == "__main__":
    main()
