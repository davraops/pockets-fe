#!/usr/bin/env python3
"""P7: Migrate settings-row hub classes to crud-hub-* / crud-row-*."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"

REPLACEMENTS: list[tuple[str, str]] = [
    ('settings-list', 'crud-hub-list'),
    ('settings-section-header', 'crud-hub-section-header'),
    ('settings-section', 'crud-hub-section'),
    ('settings-row-subtitle-unavailable', 'crud-row-subtitle--unavailable'),
    ('settings-row-icon', 'crud-hub-row-icon'),
    ('settings-row-content', 'crud-row-content'),
    ('settings-row-title', 'crud-row-title'),
    ('settings-row-subtitle', 'crud-row-subtitle'),
    ('settings-row-chevron', 'crud-row-chevron'),
    ('settings-row', 'crud-hub-row'),
    ("variant='settings-row'", "variant='hub-row'"),
    ('skeleton-settings-row', 'skeleton-hub-row'),
    ('skeleton-list-settings-row', 'skeleton-list-hub-row'),
]


def migrate_file(path: Path) -> bool:
    text = path.read_text(encoding='utf-8')
    updated = text
    for old, new in REPLACEMENTS:
        updated = updated.replace(old, new)
    if updated != text:
        path.write_text(updated, encoding='utf-8')
        return True
    return False


def strip_settings_css(css_path: Path) -> bool:
    text = css_path.read_text(encoding='utf-8')
    start = text.find('/* Settings List - iOS Style')
    if start == -1:
        start = text.find('.settings-list {')
    if start == -1:
        return False
    end = text.find('/* Finanzas Summary', start)
    if end == -1:
        end = text.find('/* Responsive */', start)
    if end == -1:
        return False
    updated = text[:start] + text[end:]
    if updated != text:
        css_path.write_text(updated, encoding='utf-8')
        return True
    return False


def strip_trabajo_settings(css_path: Path) -> bool:
    text = css_path.read_text(encoding='utf-8')
    start = text.find('.settings-list {')
    if start == -1:
        return False
    end = text.find('/* Responsive */', start)
    if end == -1:
        return False
    updated = text[:start] + text[end:]
    if updated != text:
        css_path.write_text(updated, encoding='utf-8')
        return True
    return False


def main() -> None:
    n = 0
    for tsx in SRC.rglob('*.tsx'):
        if migrate_file(tsx):
            print(f'  tsx: {tsx.relative_to(ROOT)}')
            n += 1
    for name in ('ui-patterns.css',):
        path = SRC / 'styles' / name
        if path.exists() and migrate_file(path):
            print(f'  css: {name}')
            n += 1
    fin = SRC / 'pages' / 'Finanzas.css'
    if strip_settings_css(fin):
        print('  stripped Finanzas.css settings block')
    trab = SRC / 'pages' / 'Trabajo.css'
    if strip_trabajo_settings(trab):
        print('  stripped Trabajo.css settings block')
    # Fix Finanzas unavailable class after migration
    fin_text = fin.read_text(encoding='utf-8')
    fin_fixed = fin_text.replace(
        '.crud-row-subtitle--unavailable,\n.summary-value-unavailable',
        '.crud-row-subtitle--unavailable,\n.summary-value-unavailable',
    )
    fin_fixed = fin_fixed.replace(
        '.settings-row-subtitle-unavailable',
        '.crud-row-subtitle--unavailable',
    )
    if fin_fixed != fin_text:
        fin.write_text(fin_fixed, encoding='utf-8')
    # Remove responsive settings leftovers in Finanzas.css
    fin_text = fin.read_text(encoding='utf-8')
    for block in (
        '  .settings-list {\n    gap: var(--spacing-lg);\n  }\n\n',
        '  .settings-section-header {\n    padding: var(--spacing-sm) var(--spacing-md);\n    font-size: var(--font-size-sm);\n  }\n\n',
        '  .settings-row {\n    padding: var(--spacing-md) var(--spacing-lg);\n    min-height: 56px;\n  }\n\n',
        '  .settings-row-icon {\n    width: 32px;\n    height: 32px;\n    min-width: 32px;\n',
    ):
        fin_text = fin_text.replace(block, '')
    fin.write_text(fin_text, encoding='utf-8')
    print(f'Done: {n} files migrated')


if __name__ == '__main__':
    main()
