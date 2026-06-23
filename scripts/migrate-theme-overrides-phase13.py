#!/usr/bin/env python3
"""P13: crud-form layout unification + token-driven financial/warning surfaces."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
PAGES = SRC / "pages"

FORM_LAYOUT_PREFIXES = [
    "actividades",
    "contratos",
    "empleados",
    "vehiculos",
    "patrimonio",
    "cryptovendors",
    "listas",
]

TSX_NAME_MAP = {
    "listas": "ListasMercado.tsx",
    "cryptovendors": "CryptoVendors.tsx",
    "empleados": "Empleados.tsx",
    "vehiculos": "Vehiculos.tsx",
    "patrimonio": "Patrimonio.tsx",
    "actividades": "Actividades.tsx",
    "contratos": "Contratos.tsx",
}

# (file_relative, replacements, light_override_patterns_to_remove)
CSS_MIGRATIONS: list[tuple[str, list[tuple[str, str]], list[str]]] = [
    (
        "src/pages/Transacciones.css",
        [
            (r"\.summary-value\.income \{\s*color: var\(--highlight-success-text\);\s*\}",
             ".summary-value.income {\n  color: var(--color-income-text);\n}"),
            (r"\.summary-value\.expense \{\s*color: #ff9500;\s*\}",
             ".summary-value.expense {\n  color: var(--color-expense-text);\n}"),
            (r"\.summary-value\.savings \{\s*color: #00c7be;\s*\}",
             ".summary-value.savings {\n  color: var(--color-savings-text);\n}"),
            (r"\.summary-value\.positive \{\s*color: var\(--highlight-success-text\);\s*\}",
             ".summary-value.positive {\n  color: var(--color-income-text);\n}"),
            (r"\.warning-title \{\s*font-size:[^}]+\}",
             ".warning-title {\n  font-size: var(--font-size-sm);\n  font-weight: 600;\n  "
             "color: var(--surface-warning-title);\n  margin: 0;\n  font-family: var(--font-family);\n  "
             "letter-spacing: -0.01em;\n}"),
            (
                r"\.credit-card-warning \{[^}]+\}",
                ".credit-card-warning {\n  margin-bottom: 1.5rem;\n  padding: 1.25rem;\n  "
                "background: var(--surface-warning-prominent-bg);\n  backdrop-filter: blur(20px) saturate(180%);\n  "
                "-webkit-backdrop-filter: blur(20px) saturate(180%);\n  border-radius: 16px;\n  "
                "border: 1px solid var(--surface-warning-prominent-border);\n  box-shadow:\n    "
                "var(--surface-warning-prominent-shadow),\n    inset 0 1px 0 var(--glass-inset-highlight);\n}",
            ),
            (
                r"\.debug-button \{[^}]+\}",
                ".debug-button {\n  background: var(--color-danger-bg-soft);\n  color: var(--color-danger-solid);\n}",
            ),
            (
                r"\.debug-button:hover:not\(:disabled\) \{\s*background: var\(--color-danger-bg-soft-hover\);\s*\}",
                ".debug-button:hover:not(:disabled) {\n  background: var(--color-danger-bg-medium);\n}",
            ),
            (
                r"border-top-color: #007aff;",
                "border-top-color: var(--spinner-accent);",
            ),
            (
                r"accent-color: #007aff;",
                "accent-color: var(--checkbox-accent);",
            ),
            (
                r"border-color: #007aff;",
                "border-color: var(--checkbox-accent);",
            ),
        ],
        [
            r"\[data-theme='light'\] \.summary-value\.income \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.summary-value\.expense \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.summary-value\.savings \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.summary-value\.positive \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.summary-value\.negative \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.debug-button \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.debug-button:hover:not\(:disabled\) \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.credit-card-warning \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.warning-icon \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.warning-title \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.loading-spinner \{[^}]+\}\n?",
        ],
    ),
    (
        "src/pages/Finanzas.css",
        [
            (
                r"background: linear-gradient\(135deg, rgba\(0, 122, 255, 0\.3\) 0%, rgba\(88, 86, 214, 0\.3\) 100%\);",
                "background: var(--cta-info-gradient-bg);",
            ),
            (
                r"border: 2px solid rgba\(0, 122, 255, 0\.5\);",
                "border: 2px solid var(--cta-info-border);",
            ),
            (
                r"\.finanzas-add-transaction-button:hover:not\(:disabled\) \{\s*background: linear-gradient\(135deg, rgba\(0, 122, 255, 0\.4\)[^}]+\}",
                ".finanzas-add-transaction-button:hover:not(:disabled) {\n  "
                "background: var(--cta-info-gradient-bg-hover);\n  "
                "border-color: var(--cta-info-border-hover);\n  "
                "box-shadow:\n    0 6px 20px rgba(0, 122, 255, 0.35),\n    var(--shadow-lg);\n  "
                "transform: translateY(-2px);\n}",
            ),
            (
                r"color: var\(--text-primary\) !important;",
                "color: var(--cta-info-text) !important;",
            ),
            (
                r"\.summary-positive \{\s*color: var\(--highlight-success-text\);\s*\}",
                ".summary-positive {\n  color: var(--color-income-text);\n}",
            ),
            (
                r"\.summary-negative \{\s*color: var\(--color-danger-solid\);\s*\}",
                ".summary-negative {\n  color: var(--color-danger-solid);\n}",
            ),
            (
                r"color: #ff6b35;",
                "color: var(--color-unavailable);",
            ),
        ],
        [
            r"\[data-theme='light'\] \.finanzas-add-transaction-button \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.finanzas-add-transaction-button:hover:not\(:disabled\) \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.finanzas-add-transaction-icon,\n\[data-theme='light'\] \.finanzas-add-transaction-text \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.summary-positive \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.summary-negative \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.stat-value \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.crud-row-subtitle--unavailable,\n\[data-theme='light'\] \.summary-value-unavailable \{[^}]+\}\n?",
        ],
    ),
    (
        "src/pages/Deudas.css",
        [
            (
                r"background: linear-gradient\(135deg, rgba\(0, 122, 255, 0\.12\) 0%, rgba\(88, 86, 214, 0\.08\) 100%\);",
                "background: var(--surface-info-banner-bg);",
            ),
            (
                r"border: 1px solid rgba\(0, 122, 255, 0\.25\);",
                "border: 1px solid var(--surface-info-banner-border);",
            ),
            (
                r"0 2px 8px rgba\(0, 122, 255, 0\.15\),\s*\n\s*var\(--shadow-sm\);",
                "var(--surface-info-banner-shadow),\n    var(--shadow-sm);",
            ),
            (r"color: #007aff;", "color: var(--surface-info-icon-color);"),
            (r"background: var\(--badge-info-bg\);", "background: var(--surface-info-icon-bg);"),
            (
                r"\.debts-summary-block \.summary-item:nth-child\(2\) \.summary-value \{\s*color: #0a84ff;\s*\}",
                ".debts-summary-block .summary-item:nth-child(2) .summary-value {\n  color: var(--color-info-text);\n}",
            ),
            (
                r"\.debts-summary-block \.summary-item:nth-child\(3\) \.summary-value \{\s*color: #ff9500;\s*\}",
                ".debts-summary-block .summary-item:nth-child(3) .summary-value {\n  color: var(--color-expense-text);\n}",
            ),
            (r"color: #fd7e14;", "color: var(--color-expense-text);"),
            (
                r"background-color: rgba\(255, 193, 7, 0\.1\);",
                "background-color: var(--surface-note-warning-bg);",
            ),
            (
                r"border: 1px solid rgba\(255, 193, 7, 0\.3\);",
                "border: 1px solid var(--surface-note-warning-border);",
            ),
            (
                r"color: rgba\(255, 193, 7, 0\.95\);",
                "color: var(--surface-note-warning-strong);",
            ),
        ],
        [
            r"\[data-theme='light'\] \.debts-advice-banner \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.debts-advice-icon \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.debts-advice-text strong \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.debts-summary-block \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.debts-summary-block \.summary-item:nth-child\(1\) \.summary-value \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.debts-summary-block \.summary-item:nth-child\(2\) \.summary-value \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.debts-summary-block \.summary-item:nth-child\(3\) \.summary-value \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.crud-row-meta \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.crud-row-progress-bar \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.checkbox-label input\[type='checkbox'\] \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.checkbox-label input\[type='checkbox'\]:hover \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.debt-modal-note \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.debt-modal-note strong \{[^}]+\}\n?",
        ],
    ),
    (
        "src/pages/Inflacion.css",
        [
            (
                r"\.inflacion-input \{[^}]+\}",
                ".inflacion-input {\n  width: 100%;\n  padding: var(--spacing-sm) var(--spacing-md);\n  "
                "background: var(--input-surface);\n  border: 1px solid var(--border-glass);\n  "
                "border-radius: var(--radius-md);\n  color: var(--text-primary);\n  "
                "font-size: var(--font-size-base);\n  font-family: var(--font-family);\n  "
                "transition: all var(--transition-base);\n  box-sizing: border-box;\n}",
            ),
            (
                r"\.inflacion-input:focus \{[^}]+\}",
                ".inflacion-input:focus {\n  outline: none;\n  border-color: var(--accent-primary);\n  "
                "background: var(--input-surface-focus);\n  box-shadow: 0 0 0 3px var(--input-focus-ring);\n}",
            ),
            (
                r"\.inflacion-prediction-value \{[^}]+\}",
                ".inflacion-prediction-value {\n  font-size: var(--font-size-2xl);\n  "
                "font-weight: var(--font-weight-bold);\n  color: var(--status-devalued-text);\n  "
                "font-family: var(--font-family);\n}",
            ),
            (
                r"\.inflacion-tip-card \{[^}]+\}",
                ".inflacion-tip-card {\n  background: var(--surface-tip-info-bg);\n  "
                "border: 1px solid var(--surface-tip-info-border);\n}",
            ),
            (
                r"\.inflacion-power-stat \{[^}]+\}",
                ".inflacion-power-stat {\n  background: var(--surface-stat-muted-bg);\n}",
            ),
            (
                r"\.inflacion-economics-step \{[^}]+\}",
                ".inflacion-economics-step {\n  background: var(--surface-tip-info-bg);\n  "
                "border-left: 3px solid var(--surface-tip-info-border);\n}",
            ),
            (
                r"\.inflacion-economics-step-number \{[^}]+\}",
                ".inflacion-economics-step-number {\n  background: var(--surface-tip-info-border);\n  "
                "color: var(--text-primary);\n}",
            ),
        ],
        [
            r"\[data-theme='light'\] \.inflacion-input \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.inflacion-input:focus \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.inflacion-prediction-card \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.inflacion-prediction-value \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.inflacion-tip-card \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.inflacion-purchasing-power \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.inflacion-power-stat \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.inflacion-economics-warning \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.inflacion-economics-text strong \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.inflacion-economics-step \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.inflacion-economics-step-number \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.inflacion-economics-conclusion \{[^}]+\}\n?",
            r"\[data-theme='light'\] \.inflacion-conclusion-text strong \{[^}]+\}\n?",
        ],
    ),
]


def remove_css_block(css: str, selector_pattern: str) -> str:
    pattern = re.compile(
        rf"(?:^|\n)({selector_pattern}\s*(?:,\s*[^\{{]+)?)\s*\{{[^{{}}]*\}}",
        re.MULTILINE,
    )
    prev = None
    while prev != css:
        prev = css
        css = pattern.sub("", css)
    return css


def migrate_form_layout_tsx(content: str, prefix: str) -> str:
    content = content.replace(f"{prefix}-form-row", "crud-form-row")
    content = content.replace(f"{prefix}-form-section-divider", "crud-form-section-divider")
    return content


def migrate_form_layout_css(css: str, prefix: str) -> str:
    p = re.escape(prefix)
    css = remove_css_block(css, rf"\.{p}-form-row")
    css = remove_css_block(css, rf"@media \(max-width: 768px\)\s*\{{\s*\.{p}-form-row")
    # handle broken }@media pattern from prior migrations
    css = re.sub(
        rf"\.{p}-form-row \{{[^{{}}]*\}}\s*@media \(max-width: 768px\)\s*\{{[^{{}}]*\}}",
        "",
        css,
        flags=re.MULTILINE,
    )
    css = remove_css_block(css, rf"\.{p}-form-section-divider")
    return css


def apply_css_migrations() -> list[str]:
    changed: list[str] = []
    for rel_path, replacements, removals in CSS_MIGRATIONS:
        path = ROOT / rel_path
        text = path.read_text(encoding="utf-8")
        original = text
        for pattern, repl in replacements:
            text = re.sub(pattern, repl, text, flags=re.MULTILINE | re.DOTALL)
        for removal in removals:
            text = re.sub(removal, "", text, flags=re.MULTILINE | re.DOTALL)
        if text != original:
            path.write_text(text, encoding="utf-8")
            changed.append(str(path.relative_to(ROOT)))
    return changed


def main() -> None:
    tsx_changed: list[str] = []
    layout_css_changed: list[str] = []

    for prefix in FORM_LAYOUT_PREFIXES:
        tsx_name = TSX_NAME_MAP.get(prefix, f"{prefix.capitalize()}.tsx")
        tsx_path = PAGES / tsx_name
        css_path = PAGES / tsx_name.replace(".tsx", ".css")

        if tsx_path.exists():
            original = tsx_path.read_text(encoding="utf-8")
            migrated = migrate_form_layout_tsx(original, prefix)
            if migrated != original:
                tsx_path.write_text(migrated, encoding="utf-8")
                tsx_changed.append(str(tsx_path.relative_to(ROOT)))

        if css_path.exists():
            original = css_path.read_text(encoding="utf-8")
            migrated = migrate_form_layout_css(original, prefix)
            if migrated != original:
                css_path.write_text(migrated, encoding="utf-8")
                layout_css_changed.append(str(css_path.relative_to(ROOT)))

    token_css_changed = apply_css_migrations()

    light_count = sum(
        len(re.findall(r"\[data-theme='light'\]", f.read_text(encoding="utf-8")))
        for f in SRC.rglob("*.css")
    )

    print("P13 migrate-theme-overrides-phase13")
    print(f"  TSX layout: {len(tsx_changed)}")
    for f in tsx_changed:
        print(f"    - {f}")
    print(f"  CSS layout: {len(layout_css_changed)}")
    for f in layout_css_changed:
        print(f"    - {f}")
    print(f"  CSS tokens: {len(token_css_changed)}")
    for f in token_css_changed:
        print(f"    - {f}")
    print(f"  Light overrides total: ~{light_count}")


if __name__ == "__main__":
    main()
