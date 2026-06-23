#!/usr/bin/env python3
"""Replace literal font-size values with design tokens."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"

# Longest / most specific first
FONT_SIZE_REPLACEMENTS: list[tuple[str, str]] = [
    (r"font-size:\s*4rem\s*!important", "font-size: var(--font-size-display) !important"),
    (r"font-size:\s*4rem\b", "font-size: var(--font-size-display)"),
    (r"font-size:\s*3\.5rem\b", "font-size: var(--font-size-display-sm)"),
    (r"font-size:\s*2\.75rem\s*!important", "font-size: var(--font-size-3xl-lg) !important"),
    (r"font-size:\s*2\.75rem\b", "font-size: var(--font-size-3xl-lg)"),
    (r"font-size:\s*2\.5rem\s*!important", "font-size: var(--font-size-3xl) !important"),
    (r"font-size:\s*2\.5rem\b", "font-size: var(--font-size-3xl)"),
    (r"font-size:\s*2\.25rem\b", "font-size: var(--font-size-3xl-sm)"),
    (r"font-size:\s*2rem\s*!important", "font-size: var(--font-size-hero) !important"),
    (r"font-size:\s*2rem\b", "font-size: var(--font-size-hero)"),
    (r"font-size:\s*1\.875rem\b", "font-size: var(--font-size-2xl)"),
    (r"font-size:\s*1\.75rem\s*!important", "font-size: var(--font-size-xxl) !important"),
    (r"font-size:\s*1\.75rem\b", "font-size: var(--font-size-xxl)"),
    (r"font-size:\s*1\.5rem\s*!important", "font-size: var(--font-size-xl) !important"),
    (r"font-size:\s*1\.5rem\b", "font-size: var(--font-size-xl)"),
    (r"font-size:\s*1\.375rem\b", "font-size: var(--font-size-md)"),
    (r"font-size:\s*1\.25rem\s*!important", "font-size: var(--font-size-lg) !important"),
    (r"font-size:\s*1\.25rem\b", "font-size: var(--font-size-lg)"),
    (r"font-size:\s*1\.125rem\s*!important", "font-size: var(--font-size-base) !important"),
    (r"font-size:\s*1\.125rem\b", "font-size: var(--font-size-base)"),
    (r"font-size:\s*1rem\b", "font-size: var(--font-size-sm)"),
    (r"font-size:\s*0\.95rem\b", "font-size: var(--font-size-sm)"),
    (r"font-size:\s*0\.9rem\b", "font-size: var(--font-size-xs)"),
    (r"font-size:\s*0\.875rem\b", "font-size: var(--font-size-xs)"),
    (r"font-size:\s*0\.75rem\b", "font-size: var(--font-size-xs)"),
    (r"font-size:\s*3rem\s*!important", "font-size: var(--font-size-display-xs) !important"),
    (r"font-size:\s*3rem\b", "font-size: var(--font-size-display-xs)"),
    (r"font-size:\s*1\.625rem\b", "font-size: var(--font-size-xl)"),
    (r"font-size:\s*28px\b", "font-size: var(--font-size-xxl)"),
    (r"font-size:\s*24px\b", "font-size: var(--font-size-xl)"),
    (r"font-size:\s*10px\b", "font-size: var(--font-size-xs)"),
    (r"font-size:\s*11px\b", "font-size: var(--font-size-xs)"),
]

TSX_REPLACEMENTS: list[tuple[str, str]] = [
    (r'className="[a-z0-9áéíóúñ-]+-page-title"', 'className="app-page-title"'),
    (r'className="[a-z0-9áéíóúñ-]+-empty-icon"', 'className="empty-state-icon"'),
    (r'className="empty-icon"', 'className="empty-state-icon"'),
    (r"fontSize:\s*'0\.875rem'", "fontSize: 'var(--font-size-xs)'"),
    (r"fontSize:\s*'1rem'", "fontSize: 'var(--font-size-sm)'"),
]

PAGE_TITLE_SELECTOR_PATTERNS = [
    r"\.[a-z0-9áéíóúñ-]+-page-title$",
]

EMPTY_ICON_SELECTOR_PATTERNS = [
    r"\.[a-z0-9áéíóúñ-]+-empty-icon$",
    r"^\.empty-icon$",
    r"\.empty-state-icon$",
]

SKIP_CSS = {
    SRC / "index.css",
    SRC / "styles" / "ui-patterns.css",
}


def migrate_font_sizes_in_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    original = text
    for pattern, replacement in FONT_SIZE_REPLACEMENTS:
        text = re.sub(pattern, replacement, text)
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def migrate_tsx() -> int:
    changed = 0
    for path in SRC.rglob("*.tsx"):
        text = path.read_text(encoding="utf-8")
        original = text
        for pattern, replacement in TSX_REPLACEMENTS:
            text = re.sub(pattern, replacement, text)
        if text != original:
            path.write_text(text, encoding="utf-8")
            changed += 1
            print(f"  tsx: {path.relative_to(ROOT)}")
    return changed


def _find_matching_brace(css: str, open_idx: int) -> int:
    depth = 0
    i = open_idx
    in_string = False
    string_char = ""
    while i < len(css):
        ch = css[i]
        if in_string:
            if ch == string_char and css[i - 1] != "\\":
                in_string = False
        elif ch in "\"'":
            in_string = True
            string_char = ch
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return len(css) - 1


def _selector_matches(selector: str, patterns: list[str]) -> bool:
    for part in re.split(r"\s*,\s*", selector.strip()):
        if not part.strip():
            continue
        tokens = part.split()
        target = tokens[-1] if tokens else part
        target = re.sub(r":[\w-]+(?:\([^)]*\))?", "", target)
        for cls in target.split("."):
            if not cls:
                continue
            dotted = "." + cls
            for pattern in patterns:
                if re.fullmatch(pattern.lstrip("^"), dotted):
                    return True
    return False


def _strip_rule_blocks(css: str, patterns: list[str]) -> str:
    i = 0
    out: list[str] = []
    while i < len(css):
        if css.startswith("/*", i):
            end_comment = css.find("*/", i + 2)
            if end_comment == -1:
                out.append(css[i:])
                break
            out.append(css[i : end_comment + 2])
            i = end_comment + 2
            continue

        brace = css.find("{", i)
        if brace == -1:
            out.append(css[i:])
            break

        selector = css[i:brace].strip()
        rule_end = _find_matching_brace(css, brace)
        block = css[i : rule_end + 1]

        if selector.startswith("@media") or selector.startswith("@supports"):
            inner = css[brace + 1 : rule_end]
            cleaned_inner = _strip_rule_blocks(inner, patterns)
            if cleaned_inner.strip():
                out.append(f"{selector}{{{cleaned_inner}}}")
            i = rule_end + 1
            continue

        if _selector_matches(selector, patterns):
            i = rule_end + 1
            continue

        out.append(block)
        i = rule_end + 1

    return re.sub(r"\n{3,}", "\n\n", "".join(out))


def strip_duplicate_typography_css() -> int:
    patterns = PAGE_TITLE_SELECTOR_PATTERNS + EMPTY_ICON_SELECTOR_PATTERNS
    changed = 0
    for path in SRC.rglob("*.css"):
        if path in SKIP_CSS:
            continue
        text = path.read_text(encoding="utf-8")
        cleaned = _strip_rule_blocks(text, patterns)
        if cleaned != text:
            path.write_text(cleaned, encoding="utf-8")
            changed += 1
            print(f"  css strip: {path.relative_to(ROOT)}")
    return changed


def migrate_css_literals() -> int:
    changed = 0
    for path in SRC.rglob("*.css"):
        if path in SKIP_CSS:
            continue
        if migrate_font_sizes_in_file(path):
            changed += 1
            print(f"  css tokens: {path.relative_to(ROOT)}")
    return changed


def main() -> None:
    print("Migrating TSX page titles and empty icons...")
    tsx = migrate_tsx()
    print(f"Updated {tsx} TSX files\n")

    print("Replacing literal font-size with tokens...")
    css = migrate_css_literals()
    print(f"Updated {css} CSS files\n")

    print("Removing duplicate page-title / empty-icon blocks...")
    stripped = strip_duplicate_typography_css()
    print(f"Stripped {stripped} CSS files")


if __name__ == "__main__":
    main()
