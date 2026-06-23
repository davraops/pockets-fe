#!/usr/bin/env python3
"""P14: Remove redundant hub light overrides + tokenize TarjetasCredito/CriptoTransacciones."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
PAGES = SRC / "pages"

HUB_PREFIXES = [
    "empleados",
    "vehiculos",
    "patrimonio",
    "cryptovendors",
    "listas",
    "actividades",
    "contratos",
]

# Entire light-override blocks to remove (base already uses theme-aware --bg-glass / --modal-surface)
REMOVE_LIGHT_PATTERNS = [
    r"\[data-theme='light'\] \.\w+-form \{\s*background: var\(--text-primary\);\s*border-color: var\(--border-glass\);\s*\}\n?",
    r"\[data-theme='light'\] \.\w+-item \{\s*background: var\(--text-primary\);\s*border-color: var\(--border-glass\);\s*\}\n?",
    r"\[data-theme='light'\] \.\w+-empty-state \{\s*background: var\(--text-primary\);\s*border-color: var\(--border-glass\);\s*\}\n?",
    r"\[data-theme='light'\] \.\w+-summary \{\s*background: var\(--text-primary\);\s*border-color: var\(--border-glass\);\s*\}\n?",
    r"\[data-theme='light'\] \.\w+-tabs \{\s*background: var\(--text-primary\);\s*border-color: var\(--border-glass\);\s*\}\n?",
    r"\[data-theme='light'\] \.\w+-filter-select \{\s*background: var\(--text-primary\);\s*border-color: var\(--border-glass\);\s*\}\n?",
    r"\[data-theme='light'\] \.\w+-detail-list-item \{\s*background: var\(--text-primary\);\s*border-color: var\(--border-glass\);\s*\}\n?",
    r"\[data-theme='light'\] \.\w+-list-item \{\s*background: var\(--text-secondary\);\s*border-color: var\(--border-glass\);\s*\}\n?",
    r"\[data-theme='light'\] \.\w+-record-item \{\s*background: var\(--text-secondary\);\s*border-color: var\(--border-glass\);\s*\}\n?",
    r"\[data-theme='light'\] \.\w+-saved-item \{\s*background: var\(--text-secondary\);\s*border-color: var\(--border-glass\);\s*\}\n?",
    r"\[data-theme='light'\] \.\w+-modal \{\s*background: var\(--text-primary\);\s*border-color: var\(--(?:border-glass|btn-icon-border)\);\s*\}\n?",
    r"\[data-theme='light'\] \.\w+-modal-close:hover \{\s*background: var\(--surface-overlay\);\s*color: var\(--text-primary\);\s*\}\n?",
    r"\[data-theme='light'\] \.\w+-item\.checked \{\s*background: rgba\(0, 0, 0, 0\.03\);\s*\}\n?",
    r"\[data-theme='light'\] \.listas-category-price \{\s*background: rgba\(0, 122, 255, 0\.1\);\s*border-color: rgba\(0, 122, 255, 0\.2\);\s*\}\n?",
    r"\[data-theme='light'\] \.listas-item-price \{\s*[^}]+\}\n?",
    r"\[data-theme='dark'\] \.listas-item-price \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.listas-item-category \{\s*background: var\(--surface-overlay\);\s*color: var\(--text-secondary\);\s*\}\n?",
    r"\[data-theme='light'\] \.listas-item-store \{\s*background: var\(--surface-overlay\);\s*color: var\(--text-secondary\);\s*\}\n?",
    r"\[data-theme='light'\] \.listas-refresh-button \{\s*border-color: var\(--btn-icon-border\);\s*color: var\(--text-secondary\);\s*\}\n?",
    r"\[data-theme='light'\] \.listas-refresh-button:hover:not\(:disabled\) \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.listas-saved-delete \{\s*border-color: var\(--btn-icon-border\);\s*color: var\(--text-secondary\);\s*\}\n?",
    r"\[data-theme='light'\] \.debug-option-icon \{\s*opacity: 0\.9;\s*\}\n?",
    # TarjetasCredito
    r"\[data-theme='light'\] \.credit-summary-block \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.credit-summary-block \.summary-item:nth-child\(1\) \.summary-value \{\s*color: #0051d5;\s*\}\n?",
    r"\[data-theme='light'\] \.credit-warning-banner \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.credit-warning-icon \{\s*color: rgba\(255, 107, 0, 0\.95\);\s*\}\n?",
    r"\[data-theme='light'\] \.credit-warning-text strong \{\s*color: rgba\(255, 107, 0, 0\.95\);\s*\}\n?",
    r"\[data-theme='light'\] \.crud-row-meta \{\s*color: #fd7e14;\s*\}\n?",
    r"\[data-theme='light'\] \.crud-row-progress-bar \{\s*background: var\(--btn-secondary-bg-hover\);\s*\}\n?",
    r"\[data-theme='light'\] \.credit-card-warning \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.warning-title \{\s*color: rgba\(220, 20, 60, 1\);\s*\}\n?",
    # CriptoTransacciones forms
    r"\[data-theme='light'\] \.form-group select \{\s*background-image:[^}]+\}\n?",
    r"\[data-theme='light'\] \.form-group select option \{\s*background: #ffffff;\s*color: var\(--text-primary\);\s*\}\n?",
    r"\[data-theme='light'\] \.form-group input,\n\[data-theme='light'\] \.form-group select \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.form-group input:focus,\n\[data-theme='light'\] \.form-group select:focus \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.cripto-transacciones-tab\.active \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.cripto-transacciones-filter-select \{\s*background-image:[^}]+\}\n?",
    r"\[data-theme='light'\] \.debug-option-button \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.debug-option-button:hover:not\(:disabled\) \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.debug-option-button\.create-demo:hover:not\(:disabled\) \{\s*[^}]+\}\n?",
    # ui-patterns
    r"\[data-theme='light'\] \.hub-summary-negative \{\s*color: #dc3545;\s*\}\n?",
]

BASE_REPLACEMENTS: list[tuple[str, str]] = [
    # Hub modal close hover
    (
        r"\.(\w+-modal-close):hover \{\s*background: var\(--bg-glass-light\);",
        r".\1:hover {\n  background: var(--btn-icon-hover-bg);",
    ),
    # Listas chips
    (
        r"\.listas-category-price \{\s*font-size: var\(--font-size-base\);\s*font-weight: 700;\s*color: var\(--accent-primary\);\s*padding: var\(--spacing-xs\) var\(--spacing-sm\);\s*background: var\(--bg-glass-light\);\s*border: 1px solid var\(--border-glass\);",
        ".listas-category-price {\n  font-size: var(--font-size-base);\n  font-weight: 700;\n  color: var(--chip-info-text);\n  padding: var(--spacing-xs) var(--spacing-sm);\n  background: var(--chip-info-bg);\n  border: 1px solid var(--chip-info-border);",
    ),
    (
        r"\.listas-item\.checked \{\s*opacity: 0\.6;\s*background: var\(--input-surface\);",
        ".listas-item.checked {\n  opacity: 0.6;\n  background: var(--surface-checked-bg);",
    ),
    (
        r"\.listas-item-category \{\s*font-size: var\(--font-size-sm\);\s*color: var\(--text-secondary\);\s*background: var\(--input-surface\);",
        ".listas-item-category {\n  font-size: var(--font-size-sm);\n  color: var(--text-secondary);\n  background: var(--surface-muted-bg);",
    ),
    (
        r"\.listas-item-store \{\s*display: flex;\s*align-items: center;\s*gap: var\(--spacing-xs\);\s*font-size: var\(--font-size-sm\);\s*color: var\(--text-secondary\);\s*background: var\(--input-surface\);",
        ".listas-item-store {\n  display: flex;\n  align-items: center;\n  gap: var(--spacing-xs);\n  font-size: var(--font-size-sm);\n  color: var(--text-secondary);\n  background: var(--surface-muted-bg);",
    ),
    # TarjetasCredito
    (
        r"background: linear-gradient\(135deg, rgba\(255, 45, 85, 0\.1\) 0%, rgba\(255, 149, 0, 0\.1\) 100%\);",
        "background: var(--surface-credit-summary-bg);",
    ),
    (
        r"border: 1px solid rgba\(255, 45, 85, 0\.3\);\s*margin-bottom: var\(--spacing-lg\);\s*margin-top: 0;",
        "border: 1px solid var(--surface-credit-summary-border);\n  margin-bottom: var(--spacing-lg);\n  margin-top: 0;",
    ),
    (
        r"0 4px 16px 0 rgba\(255, 45, 85, 0\.15\),\s*\n\s*var\(--shadow-sm\);",
        "var(--surface-credit-summary-shadow),\n    var(--shadow-sm);",
    ),
    (
        r"\.credit-summary-block \.summary-item:nth-child\(1\) \.summary-value \{\s*color: #0a84ff;\s*\}",
        ".credit-summary-block .summary-item:nth-child(1) .summary-value {\n  color: var(--color-info-text);\n}",
    ),
    (
        r"\.credit-warning-icon \{\s*flex-shrink: 0;\s*width: 32px;\s*height: 32px;\s*display: flex;\s*align-items: center;\s*justify-content: center;\s*color: #ff9500;",
        ".credit-warning-icon {\n  flex-shrink: 0;\n  width: 32px;\n  height: 32px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: var(--surface-credit-warning-accent);",
    ),
    (
        r"\.credit-warning-text strong \{\s*font-weight: var\(--font-weight-bold\);\s*color: #ff9500;\s*\}",
        ".credit-warning-text strong {\n  font-weight: var(--font-weight-bold);\n  color: var(--surface-credit-warning-accent-strong);\n}",
    ),
    (
        r"\.crud-row-meta \{\s*font-size: var\(--font-size-sm\);\s*color: #ff9500;",
        ".crud-row-meta {\n  font-size: var(--font-size-sm);\n  color: var(--color-expense-text);",
    ),
    (
        r"\.credit-card-warning \{\s*margin: 0 1\.5rem;\s*padding: 1\.25rem;\s*background: rgba\(255, 45, 85, 0\.1\);[^}]+\}",
        ".credit-card-warning {\n  margin: 0 1.5rem;\n  padding: 1.25rem;\n  "
        "background: var(--surface-credit-danger-prominent-bg);\n  "
        "backdrop-filter: blur(20px) saturate(180%);\n  -webkit-backdrop-filter: blur(20px) saturate(180%);\n  "
        "border-radius: 16px;\n  border: 2px solid var(--surface-credit-danger-prominent-border);\n  "
        "box-shadow:\n    var(--surface-credit-danger-prominent-shadow),\n    "
        "inset 0 1px 0 var(--glass-inset-highlight);\n}",
    ),
    (
        r"\.warning-title \{\s*font-size: var\(--font-size-sm\);\s*font-weight: 600;\s*color: rgba\(255, 45, 85, 0\.95\);",
        ".warning-title {\n  font-size: var(--font-size-sm);\n  font-weight: 600;\n  color: var(--surface-credit-danger-title);",
    ),
    # CriptoTransacciones form inputs
    (
        r"\.form-group input,\n\.form-group select \{\s*width: 100%;\s*padding: 0\.875rem 1rem;\s*background: var\(--btn-secondary-bg\);",
        ".form-group input,\n.form-group select {\n  width: 100%;\n  padding: 0.875rem 1rem;\n  background: var(--input-surface);",
    ),
    (
        r"\.form-group input:focus,\n\.form-group select:focus \{\s*outline: none;\s*border-color: rgba\(10, 132, 255, 0\.6\);\s*background: rgba\(10, 132, 255, 0\.1\);\s*box-shadow: 0 0 0 3px rgba\(10, 132, 255, 0\.2\);\s*\}",
        ".form-group input:focus,\n.form-group select:focus {\n  outline: none;\n  border-color: var(--accent-primary);\n  background: var(--input-surface-focus);\n  box-shadow: 0 0 0 3px var(--input-focus-ring);\n}",
    ),
    (
        r'background-image: url\("data:image/svg\+xml,%3Csvg xmlns=\'http://www\.w3\.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23ffffff\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E"\);',
        "background-image: var(--select-chevron);",
    ),
]


def migrate_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    original = text
    for pattern in REMOVE_LIGHT_PATTERNS:
        text = re.sub(pattern, "", text, flags=re.MULTILINE)
    rel = str(path.relative_to(ROOT))
    if "TarjetasCredito" in rel or "CriptoTransacciones" in rel or "ListasMercado" in rel or "ui-patterns" in rel:
        for pattern, repl in BASE_REPLACEMENTS:
            text = re.sub(pattern, repl, text, flags=re.MULTILINE)
    elif "pages" in rel:
        for pattern, repl in BASE_REPLACEMENTS[:5]:
            text = re.sub(pattern, repl, text, flags=re.MULTILINE)
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> None:
    updated: list[str] = []
    for css in sorted(PAGES.glob("*.css")):
        if migrate_file(css):
            updated.append(str(css.relative_to(ROOT)))
    ui_patterns = SRC / "styles" / "ui-patterns.css"
    if migrate_file(ui_patterns):
        updated.append(str(ui_patterns.relative_to(ROOT)))

    light_count = sum(
        len(re.findall(r"\[data-theme='light'\]", f.read_text(encoding="utf-8")))
        for f in SRC.rglob("*.css")
    )
    print("P14 migrate-hub-light-overrides-phase14")
    print(f"  CSS updated: {len(updated)}")
    for f in updated:
        print(f"    - {f}")
    print(f"  Light overrides total: ~{light_count}")


if __name__ == "__main__":
    main()
