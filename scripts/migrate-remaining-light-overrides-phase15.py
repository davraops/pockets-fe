#!/usr/bin/env python3
"""P15: Tokenize remaining pages + remove redundant light overrides."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"

REMOVE_PATTERNS = [
    # P14-style hub leftovers
    r"\[data-theme='light'\] \.\w+-menu \{\s*background: var\(--text-primary\);\s*border-color: var\(--border-glass\);\s*\}\n?",
    r"\[data-theme='light'\] \.cryptovendors-crypto-checkbox \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.cryptovendors-crypto-checkbox:hover \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.cryptovendors-crypto-checkbox:has\(input\[type=\"checkbox\"\]:checked\) \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.cryptovendors-item-price \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.cryptovendors-item-category \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.patrimonio-item-category \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.diseñador-item-category \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.diseñador-draft-delete \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.diseñador-refresh-button \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.diseñador-refresh-button:hover:not\(:disabled\) \{\s*[^}]+\}\n?",
    # Detail danger buttons
    r"\[data-theme='light'\] \.detail-action-button\.danger \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.detail-action-button\.danger:hover:not\(:disabled\) \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.archivos-detail-action-button-danger \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.archivos-detail-action-button-danger:hover:not\(:disabled\) \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.secretos-decrypted-action-button:hover \{\s*[^}]+\}\n?",
    # Modal / ui-patterns
    r"\[data-theme='light'\] \.modal-close \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.modal-close:hover \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.modal-button\.delete-confirm \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.app-icon:hover:not\(:disabled\) \.app-icon-bg \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.app-icon-bg::before \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.app-icon:focus-visible \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.app-material-icon \{\s*[^}]+\}\n?",
    # Summary blocks
    r"\[data-theme='light'\] \.subscripciones-summary-block \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.subscripciones-summary-block \.summary-item:nth-child\(\d+\) \.summary-value \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.me-deben-summary-block \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.me-deben-summary-block \.summary-item:nth-child\(\d+\) \.summary-value \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.proyectos-summary-block \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.proyectos-summary-block \.summary-item:nth-child\(\d+\) \.summary-value \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.tarjetas-debito-summary-block \{\s*[^}]+\}\n?",
    # Fechas
    r"\[data-theme='dark'\] \.fechas-inspiration-badge \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.fechas-inspiration-badge \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.fechas-inspiration-main \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.fechas-inspiration-message::before \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.fechas-item-all-day \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.fechas-form-notice \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.fechas-form-notice-text \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.fechas-upcoming-item-badge \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.fechas-upcoming-item-all-day \{\s*[^}]+\}\n?",
    # Secretos / CDTs / Rutinas
    r"\[data-theme='light'\] \.secretos-warning \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.secretos-verify-result\.success \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.secretos-verify-result\.error \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.cdts-progress-bar \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.cdts-progress-fill \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.crud-row-highlight \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.cdts-error-icon \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.rutinas-warning-message \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.rutinas-item-frequency \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.rutinas-day-button\.selected \{\s*[^}]+\}\n?",
    # MiDiario / MiDia
    r"\[data-theme='light'\] \.midiario-streak-container \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.midiario-streak-divider \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.midia-routine-item\.completed \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.midia-routine-frequency \{\s*[^}]+\}\n?",
    # Forms / selects / checkboxes
    r"\[data-theme='light'\] \.form-select \{\s*background-image:[^}]+\}\n?",
    r"\[data-theme='light'\] \.form-select option \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.checkbox-label input\[type='checkbox'\] \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.checkbox-label input\[type='checkbox'\]:hover \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.cripto-transacciones-tab\.active \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.cripto-wallet-tab\.active \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.cripto-wallet-error-icon \{\s*[^}]+\}\n?",
    # Misc
    r"\[data-theme='light'\] \.crud-row-meta \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.budget-over \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.password-setting-value \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.calculadora-display \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.detail-content-text \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.procesos-item-badge-negado \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.procesos-item-badge-rechazado \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.procesos-tracking-button-active \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.app-footer \{\s*[^}]+\}\n?",
    r"\[data-theme='light'\] \.notification \{\s*[^}]+\}\n?",
    r"\[data-theme='dark'\] \.notification \{\s*[^}]+\}\n?",
]

GLOBAL_REPLACEMENTS: list[tuple[str, str]] = [
    (
        r"background: linear-gradient\(135deg, rgba\(175, 82, 222, 0\.1\) 0%, rgba\(88, 86, 214, 0\.1\) 100%\);",
        "background: var(--surface-subscription-summary-bg);",
    ),
    (
        r"border: 1px solid rgba\(175, 82, 222, 0\.3\);\s*margin-bottom: var\(--spacing-lg\);\s*margin-top: 0;\s*width: fit-content;",
        "border: 1px solid var(--surface-subscription-summary-border);\n  margin-bottom: var(--spacing-lg);\n  margin-top: 0;\n  width: fit-content;",
    ),
    (
        r"0 4px 16px 0 rgba\(175, 82, 222, 0\.15\),\s*\n\s*var\(--shadow-sm\);",
        "var(--surface-subscription-summary-shadow),\n    var(--shadow-sm);",
    ),
    (
        r"\.subscripciones-summary-block \.summary-item:nth-child\(1\) \.summary-value \{\s*color: #0a84ff;\s*\}",
        ".subscripciones-summary-block .summary-item:nth-child(1) .summary-value {\n  color: var(--color-info-text);\n}",
    ),
    (
        r"\.subscripciones-summary-block \.summary-item:nth-child\(2\) \.summary-value \{\s*color: #af52de;\s*\}",
        ".subscripciones-summary-block .summary-item:nth-child(2) .summary-value {\n  color: var(--color-summary-purple);\n}",
    ),
    (
        r"\.subscripciones-summary-block \.summary-item:nth-child\(3\) \.summary-value \{\s*color: #ff9500;\s*\}",
        ".subscripciones-summary-block .summary-item:nth-child(3) .summary-value {\n  color: var(--color-expense-text);\n}",
    ),
    (
        r"\.subscripciones-summary-block \.summary-item:nth-child\(4\) \.summary-value \{\s*color: #00c7be;\s*\}",
        ".subscripciones-summary-block .summary-item:nth-child(4) .summary-value {\n  color: var(--color-savings-text);\n}",
    ),
    (
        r"background: linear-gradient\(135deg, rgba\(52, 199, 89, 0\.1\) 0%, rgba\(0, 199, 190, 0\.1\) 100%\);",
        "background: var(--surface-me-deben-summary-bg);",
    ),
    (
        r"border: 1px solid rgba\(52, 199, 89, 0\.3\);\s*margin-bottom: var\(--spacing-lg\);",
        "border: 1px solid var(--surface-me-deben-summary-border);\n  margin-bottom: var(--spacing-lg);",
    ),
    (
        r"0 4px 16px 0 rgba\(52, 199, 89, 0\.15\),\s*\n\s*var\(--shadow-sm\);",
        "var(--surface-me-deben-summary-shadow),\n    var(--shadow-sm);",
    ),
    (
        r"\.me-deben-summary-block \.summary-item:nth-child\(1\) \.summary-value \{\s*color: #0a84ff;\s*\}",
        ".me-deben-summary-block .summary-item:nth-child(1) .summary-value {\n  color: var(--color-info-text);\n}",
    ),
    (
        r"\.me-deben-summary-block \.summary-item:nth-child\(4\) \.summary-value \{\s*color: #ff9500;\s*\}",
        ".me-deben-summary-block .summary-item:nth-child(4) .summary-value {\n  color: var(--color-expense-text);\n}",
    ),
    (
        r"background: linear-gradient\(135deg, rgba\(255, 149, 0, 0\.1\) 0%, rgba\(255, 45, 85, 0\.1\) 100%\);",
        "background: var(--surface-proyectos-summary-bg);",
    ),
    (
        r"border: 1px solid rgba\(255, 149, 0, 0\.3\);\s*margin-bottom: var\(--spacing-lg\);",
        "border: 1px solid var(--surface-proyectos-summary-border);\n  margin-bottom: var(--spacing-lg);",
    ),
    (
        r"0 4px 16px 0 rgba\(255, 149, 0, 0\.15\),\s*\n\s*var\(--shadow-sm\);",
        "var(--surface-proyectos-summary-shadow),\n    var(--shadow-sm);",
    ),
    (
        r"\.proyectos-summary-block \.summary-item:nth-child\(2\) \.summary-value \{\s*color: #0a84ff;\s*\}",
        ".proyectos-summary-block .summary-item:nth-child(2) .summary-value {\n  color: var(--color-info-text);\n}",
    ),
    (
        r"\.proyectos-summary-block \.summary-item:nth-child\(5\) \.summary-value \{\s*color: #ff9500;\s*\}",
        ".proyectos-summary-block .summary-item:nth-child(5) .summary-value {\n  color: var(--color-expense-text);\n}",
    ),
    (
        r"background: linear-gradient\(135deg, rgba\(0, 199, 190, 0\.1\) 0%, rgba\(10, 132, 255, 0\.1\) 100%\);",
        "background: var(--surface-debit-summary-bg);",
    ),
    (
        r"border: 1px solid rgba\(0, 199, 190, 0\.3\);",
        "border: 1px solid var(--surface-debit-summary-border);",
    ),
    (
        r"0 4px 16px 0 rgba\(0, 199, 190, 0\.15\),\s*\n\s*var\(--shadow-sm\);",
        "var(--surface-debit-summary-shadow),\n    var(--shadow-sm);",
    ),
    (
        r"\.detail-action-button\.danger \{\s*background: var\(--color-danger-bg-medium\);\s*border-color: var\(--color-danger-border-soft\);\s*color: var\(--color-danger-text\);\s*\}",
        ".detail-action-button.danger {\n  background: var(--btn-detail-danger-bg);\n  border-color: var(--btn-detail-danger-border);\n  color: var(--btn-detail-danger-color);\n}",
    ),
    (
        r"\.detail-action-button\.danger:hover:not\(:disabled\) \{\s*background: var\(--color-danger-border-soft\);\s*border-color: var\(--color-danger-border-medium\);\s*\}",
        ".detail-action-button.danger:hover:not(:disabled) {\n  background: var(--btn-detail-danger-hover-bg);\n  border-color: var(--btn-detail-danger-hover-border);\n}",
    ),
    (
        r"\.archivos-detail-action-button-danger \{\s*background: var\(--color-danger-bg-medium\);",
        ".archivos-detail-action-button-danger {\n  background: var(--btn-detail-danger-bg);",
    ),
    (
        r"\.modal-close \{\s*width: 44px;[^}]+background: var\(--color-danger-bg-medium\);\s*color: var\(--color-danger-text\);",
        ".modal-close {\n  width: 44px;\n  height: 44px;\n  min-width: 44px;\n  min-height: 44px;\n  border-radius: var(--radius-sm);\n  border: none;\n  background: var(--color-danger-bg-soft);\n  color: var(--color-danger-text-strong);",
    ),
    (
        r"\.modal-close:hover:not\(:disabled\) \{\s*background: var\(--color-danger-border-soft\);",
        ".modal-close:hover:not(:disabled) {\n  background: var(--color-danger-bg-soft-hover);",
    ),
    (
        r"\.fechas-inspiration-badge \{\s*[^}]+box-shadow: var\(--shadow-sm\);",
        ".fechas-inspiration-badge {\n  font-size: var(--font-size-sm);\n  font-weight: var(--font-weight-semibold);\n  color: var(--text-on-accent);\n  background: var(--accent-primary);\n  padding: var(--spacing-sm) var(--spacing-md);\n  border-radius: var(--radius-md);\n  margin: 0 0 var(--spacing-xs) 0;\n  letter-spacing: var(--letter-spacing-tight);\n  font-family: var(--font-family);\n  text-transform: uppercase;\n  box-shadow: var(--badge-inspiration-shadow);",
    ),
    (
        r"text-shadow: 0 1px 2px rgba\(0, 0, 0, 0\.1\);",
        "text-shadow: var(--text-inspiration-shadow);",
    ),
    (
        r"\.fechas-inspiration-message::before \{\s*content: '';\s*position: absolute;\s*inset: 0;\s*background: linear-gradient\(135deg, rgba\(0, 122, 255, 0\.08\)[^}]+\}",
        ".fechas-inspiration-message::before {\n  content: '';\n  position: absolute;\n  inset: 0;\n  background: var(--surface-fechas-inspiration-shine);",
    ),
    (
        r"\.fechas-form-notice-text strong \{\s*color: rgba\(220, 38, 38, 0\.9\);",
        ".fechas-form-notice-text strong {\n  color: var(--surface-fechas-notice-strong);",
    ),
    (
        r"\.secretos-warning \{\s*[^}]+background: rgba\(255, 193, 7, 0\.1\);\s*border: 1px solid rgba\(255, 193, 7, 0\.3\);",
        ".secretos-warning {\n  display: flex;\n  align-items: flex-start;\n  gap: var(--spacing-md);\n  padding: var(--spacing-md);\n  background: var(--surface-secret-warning-bg);\n  border: 1px solid var(--surface-secret-warning-border);",
    ),
    (
        r"\.secretos-verify-result\.success \{\s*background: rgba\(52, 199, 89, 0\.1\);\s*border-color: rgba\(52, 199, 89, 0\.3\);\s*color: rgba\(52, 199, 89, 0\.9\);",
        ".secretos-verify-result.success {\n  background: var(--surface-verify-success-bg);\n  border-color: var(--surface-verify-success-border);\n  color: var(--surface-verify-success-text);",
    ),
    (
        r"\.cdts-progress-bar \{\s*[^}]+background: var\(--bg-glass-lighter\);",
        ".cdts-progress-bar {\n  flex: 1;\n  height: 4px;\n  background: var(--btn-secondary-bg-hover);",
    ),
    (
        r"\.cdts-progress-fill \{\s*[^}]+background: linear-gradient\(90deg, rgba\(52, 199, 89, 0\.8\), rgba\(48, 209, 88, 0\.9\)\);",
        ".cdts-progress-fill {\n  height: 100%;\n  background: var(--progress-fill-success);",
    ),
    (
        r"\.crud-row-highlight \{\s*color: rgba\(0, 122, 255, 0\.9\);",
        ".crud-row-highlight {\n  color: var(--crud-highlight-info);",
    ),
    (
        r"\.cdts-error-icon \{\s*[^}]+color: #ff6b35;",
        ".cdts-error-icon {\n  font-size: var(--font-size-hero);\n  color: var(--color-unavailable);",
    ),
    (
        r"\.midiario-streak-container \{\s*[^}]+background: linear-gradient\(135deg, rgba\(255, 87, 51, 0\.12\)[^}]+\}",
        ".midiario-streak-container {\n  display: flex;\n  align-items: center;\n  gap: var(--spacing-lg);\n  padding: var(--spacing-lg);\n  background: var(--surface-streak-bg);\n  border: 1px solid var(--surface-streak-border);\n  border-radius: var(--radius-lg);\n  margin-bottom: var(--spacing-xl);\n}",
    ),
    (
        r"\.midiario-streak-divider \{\s*width: 1px;\s*height: 40px;\s*background: var\(--bg-glass-lighter\);",
        ".midiario-streak-divider {\n  width: 1px;\n  height: 40px;\n  background: var(--btn-secondary-bg-hover);",
    ),
    (
        r"\.midia-routine-item\.completed \{\s*opacity: 0\.6;\s*background: var\(--input-surface\);",
        ".midia-routine-item.completed {\n  opacity: 0.6;\n  background: var(--surface-checked-bg);",
    ),
    (
        r"\.patrimonio-item-category \{\s*[^}]+color: #0A84FF;\s*background: rgba\(10, 132, 255, 0\.15\);",
        ".patrimonio-item-category {\n  font-size: var(--font-size-sm);\n  font-weight: 600;\n  color: var(--chip-info-text);\n  background: var(--chip-info-bg);",
    ),
    (
        r"\.cryptovendors-item-category \{\s*[^}]+background: var\(--input-surface\);",
        ".cryptovendors-item-category {\n  font-size: var(--font-size-sm);\n  color: var(--text-secondary);\n  background: var(--surface-muted-bg);",
    ),
    (
        r"\.diseñador-item-category \{\s*[^}]+background: var\(--input-surface\);",
        ".diseñador-item-category {\n  font-size: var(--font-size-sm);\n  color: var(--text-secondary);\n  background: var(--surface-muted-bg);",
    ),
    (
        r"\.crud-row-meta \{\s*font-size: var\(--font-size-sm\);\s*color: #ff9500;",
        ".crud-row-meta {\n  font-size: var(--font-size-sm);\n  color: var(--color-expense-text);",
    ),
    (
        r"\.crud-row-meta \{\s*font-size: var\(--font-size-sm\);\s*color: rgba\(0, 122, 255, 0\.9\);",
        ".crud-row-meta {\n  font-size: var(--font-size-sm);\n  color: var(--crud-highlight-info);",
    ),
    (
        r"\.budget-over \{\s*color: var\(--color-danger-solid\);",
        ".budget-over {\n  color: var(--color-danger-solid);",
    ),
    (
        r"\.password-setting-value \{\s*[^}]+color: rgba\(10, 132, 255, 0\.9\);",
        ".password-setting-value {\n  font-weight: var(--font-weight-semibold);\n  color: var(--color-password-accent);",
    ),
    (
        r"\.cripto-wallet-error-icon \{\s*[^}]+color: #ff6b35;",
        ".cripto-wallet-error-icon {\n  font-size: var(--font-size-hero);\n  color: var(--color-unavailable);",
    ),
    (
        r'background-image: url\("data:image/svg\+xml,%3Csvg xmlns=\'http://www\.w3\.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23ffffff\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E"\);',
        "background-image: var(--select-chevron);",
    ),
    (
        r"\.form-select option \{\s*background: #2c2c2e;",
        ".form-select option {\n  background: var(--surface-option-bg);",
    ),
    (
        r"accent-color: #af52de;",
        "accent-color: var(--checkbox-accent-purple);",
    ),
    (
        r"border-color: #af52de;",
        "border-color: var(--checkbox-accent-purple);",
    ),
    (
        r"accent-color: #00c7be;",
        "accent-color: var(--checkbox-accent-teal);",
    ),
    (
        r"border-color: #00c7be;",
        "border-color: var(--checkbox-accent-teal);",
    ),
    (
        r"\.app-footer \{\s*[^}]+background: var\(--bg-glass-light\);",
        ".app-footer {\n  width: 100%;\n  padding: 1.5rem 2rem;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: var(--spacing-md);\n  background: var(--bg-glass-lighter);",
    ),
    (
        r"border-top: 1px solid var\(--border-glass-light\);",
        "border-top: 1px solid var(--border-glass);",
    ),
]


def migrate_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    original = text
    for pattern in REMOVE_PATTERNS:
        text = re.sub(pattern, "", text, flags=re.MULTILINE | re.DOTALL)
    for pattern, repl in GLOBAL_REPLACEMENTS:
        text = re.sub(pattern, repl, text, flags=re.MULTILINE | re.DOTALL)
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def patch_ui_patterns() -> None:
    path = SRC / "styles" / "ui-patterns.css"
    text = path.read_text(encoding="utf-8")
    text = text.replace(
        "  .app-icon:hover:not(:disabled) .app-icon-bg {\n    box-shadow: var(--shadow-md);",
        "  .app-icon:hover:not(:disabled) .app-icon-bg {\n    box-shadow: var(--app-icon-hover-shadow);",
    )
    text = text.replace(
        ".app-icon:focus-visible {\n  outline: 2px solid var(--accent-primary-border);",
        ".app-icon:focus-visible {\n  outline: 2px solid var(--app-icon-focus-outline);",
    )
    text = re.sub(
        r"\.app-icon-bg::before \{\s*content: '';\s*position: absolute;\s*inset: 0;\s*background: linear-gradient\(\s*135deg,\s*rgba\(255, 255, 255, 0\.15\)[^}]+\}",
        ".app-icon-bg::before {\n  content: '';\n  position: absolute;\n  inset: 0;\n  background: var(--app-icon-shine-gradient);",
        text,
        flags=re.MULTILINE | re.DOTALL,
    )
    text = text.replace(
        ".app-material-icon {\n  font-size: var(--font-size-3xl) !important;",
        ".app-material-icon {\n  filter: var(--app-icon-material-filter);\n  font-size: var(--font-size-3xl) !important;",
    )
    path.write_text(text, encoding="utf-8")


def patch_notification() -> None:
    path = SRC / "components" / "NotificationContainer.css"
    text = path.read_text(encoding="utf-8")
    if ".notification {" in text and "surface-notification-bg" not in text:
        text = text.replace(
            ".notification {\n  pointer-events: auto;",
            ".notification {\n  background: var(--surface-notification-bg);\n  color: var(--text-primary);\n  pointer-events: auto;",
        )
        path.write_text(text, encoding="utf-8")


def main() -> None:
    updated: list[str] = []
    for css in sorted(SRC.rglob("*.css")):
        if "index.css" in str(css):
            continue
        if migrate_file(css):
            updated.append(str(css.relative_to(ROOT)))
    patch_ui_patterns()
    patch_notification()
    if (SRC / "styles" / "ui-patterns.css").relative_to(ROOT) not in [Path(u) for u in updated]:
        updated.append("src/styles/ui-patterns.css")
    if (SRC / "components" / "NotificationContainer.css").relative_to(ROOT) not in [Path(u) for u in updated]:
        updated.append("src/components/NotificationContainer.css")

    light_count = sum(
        len(re.findall(r"\[data-theme='light'\]", f.read_text(encoding="utf-8")))
        for f in SRC.rglob("*.css")
    )
    print("P15 migrate-remaining-light-overrides-phase15")
    print(f"  CSS updated: {len(updated)}")
    for f in updated:
        print(f"    - {f}")
    print(f"  Light overrides total: ~{light_count}")


if __name__ == "__main__":
    main()
