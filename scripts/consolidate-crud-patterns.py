#!/usr/bin/env python3
"""Consolidate CRUD dropdown menus, page content layout, and detail panels into domains/crud.css."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
PAGES = SRC / "pages"

TSX_MENU_REPLACEMENTS: list[tuple[str, str]] = [
    (r'className="(?!crud-|glass-)[a-z0-9áéíóúñ_-]+-menu-item"', 'className="crud-dropdown-menu-item"'),
    (r'className="(?!crud-|glass-)[a-z0-9áéíóúñ_-]+-menu-icon"', 'className="crud-dropdown-menu-icon"'),
    (r'className="(?!crud-|glass-)[a-z0-9áéíóúñ_-]+-menu"', 'className="crud-dropdown-menu"'),
]

HUB_CONTENT_CLASSES = {"finanzas-content"}

CRUD_LAYOUT_RE = re.compile(
    r"(\.[a-z0-9áéíóúñ_-]+-content\s*\{)\s*"
    r"flex-direction:\s*column;\s*"
    r"gap:\s*(?:0\.75rem|var\(--spacing-xl\));\s*"
    r"align-items:\s*stretch;\s*"
    r"width:\s*100%;\s*"
    r"(\})",
    re.IGNORECASE,
)

MENU_BLOCK_RE = re.compile(
    r"/\*\s*[^*]*[Mm]enu[^*]*\*/\s*"
    r"\.[a-z0-9áéíóúñ_-]+-menu\s*\{[^}]*\}\s*"
    r"(?:@keyframes\s+slideDown\s*\{[^}]*\}\s*[^}]*\}\s*)?"
    r"(?:\.[a-z0-9áéíóúñ_-]+-menu-item\s*\{[^}]*\}\s*)+"
    r"(?:\.[a-z0-9áéíóúñ_-]+-menu-item:[^{]+\{[^}]*\}\s*)*"
    r"\.[a-z0-9áéíóúñ_-]+-menu-icon\s*\{[^}]*\}\s*"
    r"(?:\[data-theme='light'\]\s*\.[a-z0-9áéíóúñ_-]+-menu[^{]*\{[^}]*\}\s*)*",
    re.DOTALL,
)

DETAIL_BLOCK_START = "/* Detail Content"
DETAIL_BLOCK_END = ".detail-button svg {"

DETAIL_FILES = [
    "Cuentas.css",
    "Deudas.css",
    "Transacciones.css",
    "TarjetasCredito.css",
    "TarjetasDebito.css",
    "Subscripciones.css",
    "Presupuestos.css",
    "Proyectos.css",
    "MeDeben.css",
    "CriptoWallet.css",
    "CriptoTransacciones.css",
]

LEGACY_MENU_RULE_RE = re.compile(
    r"(?:\[data-theme='light'\]\s*)?"
    r"\.(?!glass-menu|crud-dropdown|app-toolbar-menu)[a-z0-9áéíóúñ_-]+-menu"
    r"(?:-item|-icon)?[^{]*\{[^{}]*\}\s*",
    re.IGNORECASE,
)

SLIDE_DOWN_RE = re.compile(
    r"@keyframes\s+slideDown\s*\{[^{}]*\{[^{}]*\}[^}]*\}\s*",
    re.DOTALL,
)


def migrate_tsx_menus() -> int:
    count = 0
    for tsx in PAGES.rglob("*.tsx"):
        text = tsx.read_text(encoding="utf-8")
        original = text
        for pattern, repl in TSX_MENU_REPLACEMENTS:
            text = re.sub(pattern, repl, text)
        if "app-page-content-wide" in text and "crud-page-content" not in text:
            text = text.replace(
                "app-page-content-wide ",
                "app-page-content-wide crud-page-content ",
            )
        if "finanzas-content" in text and "hub-page-content" not in text:
            text = text.replace(
                "app-page-content finanzas-content",
                "app-page-content hub-page-content finanzas-content",
            )
        if text != original:
            tsx.write_text(text, encoding="utf-8")
            count += 1
            print(f"  tsx: {tsx.name}")
    return count


def strip_crud_layout(css_path: Path) -> bool:
    text = css_path.read_text(encoding="utf-8")
    new_text, n = CRUD_LAYOUT_RE.subn(r"\1\2", text)
    if n:
        css_path.write_text(new_text, encoding="utf-8")
    return n > 0


def strip_menu_block(css_path: Path) -> bool:
    text = css_path.read_text(encoding="utf-8")
    new_text = MENU_BLOCK_RE.sub("", text)
    if new_text != text:
        css_path.write_text(new_text, encoding="utf-8")
        return True
    return False


def strip_detail_block(css_path: Path) -> bool:
    text = css_path.read_text(encoding="utf-8")
    start = text.find(DETAIL_BLOCK_START)
    if start == -1:
        start = text.find(".detail-content {")
        if start == -1:
            return False
    end_marker = DETAIL_BLOCK_END
    end = text.find(end_marker, start)
    if end == -1:
        return False
    end = text.find("}", end) + 1
    new_text = text[:start] + text[end:]
    css_path.write_text(new_text, encoding="utf-8")
    return True


def strip_legacy_menu_css(css_path: Path) -> bool:
    text = css_path.read_text(encoding="utf-8")
    original = text
    text = SLIDE_DOWN_RE.sub("", text)
    prev = None
    while prev != text:
        prev = text
        text = LEGACY_MENU_RULE_RE.sub("", text)
    text = re.sub(r"/\* Menu[^*]*\*/\s*\}\s*", "", text)
    text = re.sub(r"/\* Menu[^*]*\*/\s*", "", text)
    if text != original:
        css_path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> None:
    tsx_count = migrate_tsx_menus()
    layout_count = 0
    menu_count = 0
    detail_count = 0

    for css in sorted(PAGES.glob("*.css")):
        if strip_crud_layout(css):
            layout_count += 1
            print(f"  layout stripped: {css.name}")
        if strip_menu_block(css) or strip_legacy_menu_css(css):
            menu_count += 1
            print(f"  menu stripped: {css.name}")

    for name in DETAIL_FILES:
        path = PAGES / name
        if path.exists() and strip_detail_block(path):
            detail_count += 1
            print(f"  detail stripped: {name}")

    print(
        f"Done: {tsx_count} TSX, {layout_count} layout CSS, "
        f"{menu_count} menu CSS, {detail_count} detail CSS"
    )


if __name__ == "__main__":
    main()
