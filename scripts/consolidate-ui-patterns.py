#!/usr/bin/env python3
"""Consolidate duplicated toolbar, modal, and card CSS into shared ui-patterns."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"

# ─── TSX class replacements (order matters — longest first) ───
TSX_REPLACEMENTS: list[tuple[str, str]] = [
    # Toolbar (exclude already-migrated app-* classes)
    (r'className="(?!app-)[a-z0-9áéíóúñ-]+-toolbar-menu-container"', 'className="app-toolbar-menu-container"'),
    (r'className="(?!app-)[a-z0-9áéíóúñ-]+-toolbar-button"', 'className="app-toolbar-button"'),
    (r'className="(?!app-)[a-z0-9áéíóúñ-]+-toolbar-icon"', 'className="app-toolbar-icon"'),
    (r'className="(?!app-)[a-z0-9áéíóúñ-]+-toolbar"', 'className="app-toolbar"'),
    # Modal panel (token-based) — before generic modal
    (r'className="(?!modal-)[a-z0-9áéíóúñ-]+-modal-large"', 'className="modal-panel modal-panel-lg"'),
    (r'className="(?!modal-)[a-z0-9áéíóúñ-]+-modal-close-button"', 'className="modal-panel-close"'),
    (r'className="(?!modal-)[a-z0-9áéíóúñ-]+-modal-close"', 'className="modal-panel-close"'),
    (r'className="(?!modal-)[a-z0-9áéíóúñ-]+-modal-header"', 'className="modal-panel-header"'),
    (r'className="(?!modal-)[a-z0-9áéíóúñ-]+-modal-title"', 'className="modal-panel-title"'),
    (r'className="(?!modal-)[a-z0-9áéíóúñ-]+-modal-content"', 'className="modal-panel-content"'),
    (r'className="(?!modal-)[a-z0-9áéíóúñ-]+-modal-loading"', 'className="modal-panel-loading"'),
    (r'className="(?!modal-)[a-z0-9áéíóúñ-]+-modal-empty"', 'className="modal-panel-empty"'),
    (r'className="(?!modal-)[a-z0-9áéíóúñ-]+-modal-overlay"', 'className="modal-overlay"'),
    (r'className="(?!modal-)[a-z0-9áéíóúñ-]+-modal"', 'className="modal-panel"'),
    # Glass groups
    (r'className="accounts-group"', 'className="glass-group"'),
    (r'className="procesos-group"', 'className="glass-group"'),
    (r'className="cdts-group"', 'className="glass-group"'),
    (r'className="secretos-group"', 'className="glass-group"'),
    (r'className="notificaciones-group"', 'className="glass-group"'),
    (r'className="budgets-group"', 'className="glass-group"'),
    (r'className="cuadernos-group"', 'className="glass-group"'),
    (r'className="justicia-group"', 'className="glass-group"'),
    (r'className="archivos-group"', 'className="glass-group"'),
    (r'className="midiario-group"', 'className="glass-group"'),
    (r'className="settings-group"', 'className="glass-group"'),
    # Glass list items
    (r'className="[a-z0-9áéíóúñ-]+-list-item"', 'className="glass-list-item"'),
    (r'className="[a-z0-9áéíóúñ-]+-detail-list-item"', 'className="glass-list-item"'),
]

# CSS selectors to strip from page stylesheets (page-specific duplicates)
CSS_SELECTOR_PATTERNS = [
    r"\.[a-z0-9áéíóúñ-]+-toolbar-menu-container$",
    r"\.[a-z0-9áéíóúñ-]+-toolbar-button$",
    r"\.[a-z0-9áéíóúñ-]+-toolbar-icon$",
    r"\.[a-z0-9áéíóúñ-]+-toolbar$",
    r"\.[a-z0-9áéíóúñ-]+-modal-large$",
    r"\.[a-z0-9áéíóúñ-]+-modal-close-button$",
    r"\.[a-z0-9áéíóúñ-]+-modal-close$",
    r"\.[a-z0-9áéíóúñ-]+-modal-header$",
    r"\.[a-z0-9áéíóúñ-]+-modal-title$",
    r"\.[a-z0-9áéíóúñ-]+-modal-content$",
    r"\.[a-z0-9áéíóúñ-]+-modal-loading$",
    r"\.[a-z0-9áéíóúñ-]+-modal-empty$",
    r"\.[a-z0-9áéíóúñ-]+-modal-overlay$",
    r"\.[a-z0-9áéíóúñ-]+-modal$",
    r"\.accounts-group",
    r"\.procesos-group",
    r"\.cdts-group",
    r"\.secretos-group",
    r"\.notificaciones-group",
    r"\.budgets-group",
    r"\.cuadernos-group",
    r"\.justicia-group",
    r"\.archivos-group",
    r"\.midiario-group",
    r"\.settings-group",
    r"\.[a-z0-9áéíóúñ-]+-detail-list-item$",
    r"\.[a-z0-9áéíóúñ-]+-list-item$",
    # Shared modal duplicates in page CSS
    r"\.modal-overlay$",
    r"\.edit-modal-overlay$",
    r"\.modal-content$",
    r"\.modal-header$",
    r"\.modal-title$",
    r"\.modal-close$",
    r"\.modal-form$",
    r"\.modal-actions$",
    r"\.modal-button$",
]

KEEP_SELECTORS = {
    ".app-toolbar",
    ".app-toolbar-button",
    ".app-toolbar-icon",
    ".app-toolbar-menu-container",
    ".modal-panel",
    ".modal-panel-lg",
    ".modal-panel-header",
    ".modal-panel-title",
    ".modal-panel-close",
    ".modal-panel-content",
    ".glass-group",
    ".glass-list-item",
}


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
    selector = selector.strip()
    if selector in KEEP_SELECTORS:
        return False

    for part in re.split(r"\s*,\s*", selector):
        part = part.strip()
        if not part:
            continue
        tokens = part.split()
        target = tokens[-1] if tokens else part
        target = re.sub(r":[\w-]+(?:\([^)]*\))?", "", target)

        for dotted in ("." + cls for cls in target.split(".") if cls):
            if dotted.startswith(".app-") or dotted in KEEP_SELECTORS:
                continue
            for pattern in patterns:
                normalized = pattern.lstrip("^")
                if re.fullmatch(normalized, dotted):
                    return True
    return False


def _strip_rule_blocks(css: str, patterns: list[str]) -> str:
    i = 0
    out: list[str] = []
    while i < len(css):
        if css[i] == "@":
            # Preserve @keyframes / @media — process inside @media separately
            semi = css.find("{", i)
            if semi == -1:
                out.append(css[i:])
                break
            if css[i:].startswith("@keyframes") or css[i:].startswith("@-webkit-keyframes"):
                end = _find_matching_brace(css, semi)
                block = css[i : end + 1]
                if not re.search(r"fadeIn|slideUp|ui-fade-in|ui-slide-up", block):
                    pass  # drop page-local keyframes only if duplicate names
                else:
                    # keep for now; duplicate keyframes harmless if unused
                    out.append(block)
                i = end + 1
                continue

        # skip comments
        if css.startswith("/*", i):
            end_comment = css.find("*/", i + 2)
            if end_comment == -1:
                out.append(css[i:])
                break
            out.append(css[i : end_comment + 2])
            i = end_comment + 2
            continue

        # detect selector block
        brace = css.find("{", i)
        if brace == -1:
            out.append(css[i:])
            break

        selector = css[i:brace].strip()
        rule_end = _find_matching_brace(css, brace)
        block = css[i : rule_end + 1]

        if selector.startswith("@media") or selector.startswith("@supports"):
            inner_start = brace + 1
            inner_end = rule_end
            inner = css[inner_start:inner_end]
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

    result = re.sub(r"\n{3,}", "\n\n", "".join(out))
    return result


def cleanup_orphan_responsive_rules(css: str) -> str:
    """Remove leftover page-prefixed toolbar/modal rules inside media queries."""
    orphan_prefixes = (
        "-toolbar-menu-container",
        "-toolbar-button",
        "-toolbar-icon",
        "-toolbar",
        "-modal-overlay",
        "-modal-header",
        "-modal-title",
        "-modal-content",
        "-modal-close",
        "-modal-large",
        "-modal",
    )
    for suffix in orphan_prefixes:
        css = re.sub(
            rf"\.[a-z0-9áéíóúñ-]+{re.escape(suffix)}\s*\{{[^{{}}]*\}}\s*",
            "",
            css,
            flags=re.MULTILINE,
        )
    return css


SKIP_CSS = {
    SRC / "styles" / "shared.css",
    SRC / "styles" / "ui-patterns.css",
    SRC / "App.css",
    SRC / "components" / "StatusBar.css",
    SRC / "components" / "Footer.css",
    SRC / "components" / "ThemeToggle.css",
    SRC / "components" / "NotificationContainer.css",
}


def migrate_css() -> int:
    changed = 0
    for path in SRC.rglob("*.css"):
        if path in SKIP_CSS:
            continue
        text = path.read_text(encoding="utf-8")
        cleaned = _strip_rule_blocks(text, CSS_SELECTOR_PATTERNS)
        cleaned = cleanup_orphan_responsive_rules(cleaned)
        # Remove orphaned section comments
        cleaned = re.sub(
            r"/\* Modal Styles[^\n]*\*/\s*\n(?=\s*(?:/\*|@|\.|#|\[))",
            "",
            cleaned,
        )
        cleaned = re.sub(
            r"/\* Toolbar[^\n]*\*/\s*\n(?=\s*(?:/\*|@|\.|#|\[))",
            "",
            cleaned,
        )
        if cleaned != text:
            path.write_text(cleaned, encoding="utf-8")
            changed += 1
            print(f"  css: {path.relative_to(ROOT)}")
    return changed


def trim_app_page_css() -> None:
    path = SRC / "pages" / "AppPage.css"
    text = path.read_text(encoding="utf-8")
    # Remove toolbar block now in ui-patterns (lines 73-150 approx)
    start = text.find("/* Shared Styles for Financial Pages")
    end = text.find("/* Page Title - Unified style */")
    if start != -1 and end != -1:
        text = text[:start] + text[end:]
        path.write_text(text, encoding="utf-8")
        print("  css: trimmed AppPage.css toolbar duplicates")


def main() -> None:
    print("Migrating TSX class names...")
    tsx_count = migrate_tsx()
    print(f"Updated {tsx_count} TSX files\n")

    print("Removing duplicate CSS blocks...")
    trim_app_page_css()
    css_count = migrate_css()
    print(f"Updated {css_count} CSS files")


if __name__ == "__main__":
    main()
