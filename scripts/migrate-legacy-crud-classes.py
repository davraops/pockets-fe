#!/usr/bin/env python3
"""P5: Remove legacy *-row class names from TSX and page CSS; use crud-* only."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = ROOT / "src" / "pages"

# Order matters — longer / more specific patterns first
TSX_REPLACEMENTS: list[tuple[str, str]] = [
    # Row containers + accents
    ('className="crud-inset-row account-row"', 'className="crud-inset-row crud-row-accent-blue"'),
    ('className="crud-inset-row archivos-row"', 'className="crud-inset-row crud-row-accent-files"'),
    ('className="crud-inset-row cuadernos-row"', 'className="crud-inset-row crud-row-accent-files"'),
    ('className="crud-inset-row cdts-row"', 'className="crud-inset-row crud-row-accent-green"'),
    ('className="crud-inset-row budget-row"', 'className="crud-inset-row crud-row-accent-green"'),
    ('className="crud-inset-row midiario-row"', 'className="crud-inset-row crud-row-accent-purple"'),
    ('className="crud-inset-row secretos-row"', 'className="crud-inset-row crud-row-accent-danger"'),
    ('className="crud-inset-row justicia-row"', 'className="crud-inset-row crud-row-accent-indigo"'),
    ('className="crud-inset-row procesos-item"', 'className="crud-inset-row crud-row-accent-indigo"'),
    ('className="crud-card-row proyecto-row"', 'className="crud-card-row crud-card-row--project"'),
    ('className="crud-card-row subscripcion-row"', 'className="crud-card-row crud-card-row--subscription"'),
    ('className="crud-card-row tarjeta-debito-row"', 'className="crud-card-row crud-card-row--debit-card"'),
    ('className="crud-card-row card-row"', 'className="crud-card-row crud-card-row--credit"'),
    ('crud-card-row debt-row ', 'crud-card-row crud-card-row--debt '),
    ('crud-card-row deudor-row ', 'crud-card-row crud-card-row--debtor '),
    ('debt-paid-off', 'crud-card-row--paid-off'),
    ('deudor-paid-off', 'crud-card-row--paid-off'),
    ('crud-transaction-row transaction-item ', 'crud-transaction-row '),
    ('crud-crypto-row cripto-wallet-row"', 'crud-crypto-row"'),
    ('crud-crypto-row cripto-transacciones-row"', 'crud-crypto-row"'),
    ('crud-transaction-list transactions-list"', 'crud-transaction-list"'),
    (
        "crud-inset-row notificaciones-item ${notification.is_read ? 'read' : 'unread'}`",
        "crud-inset-row crud-row-accent-purple ${notification.is_read ? 'crud-inset-row--read' : 'crud-inset-row--unread'}`",
    ),
    ('className={`crud-inset-row procesos-item-badge', 'className={`procesos-item-badge'),
    # Duplicate structure (crud + legacy)
    ('crud-row-content account-row-content', 'crud-row-content'),
    ('crud-row-content debt-row-content', 'crud-row-content'),
    ('crud-row-content proyecto-row-content', 'crud-row-content'),
    ('crud-row-content subscripcion-row-content', 'crud-row-content'),
    ('crud-row-content tarjeta-debito-row-content', 'crud-row-content'),
    ('crud-row-content deudor-row-content', 'crud-row-content'),
    ('crud-row-content card-row-content', 'crud-row-content'),
    ('crud-row-content budget-row-content', 'crud-row-content'),
    ('crud-row-main account-row-main', 'crud-row-main'),
    ('crud-row-main debt-row-main', 'crud-row-main'),
    ('crud-row-main proyecto-row-main', 'crud-row-main'),
    ('crud-row-main subscripcion-row-main', 'crud-row-main'),
    ('crud-row-main tarjeta-debito-row-main', 'crud-row-main'),
    ('crud-row-main deudor-row-main', 'crud-row-main'),
    ('crud-row-main card-row-main', 'crud-row-main'),
    ('crud-row-main budget-row-main', 'crud-row-main'),
    ('crud-row-title account-row-title', 'crud-row-title'),
    ('crud-row-title debt-row-title', 'crud-row-title'),
    ('crud-row-title proyecto-row-title', 'crud-row-title'),
    ('crud-row-title subscripcion-row-title', 'crud-row-title'),
    ('crud-row-title tarjeta-debito-row-title', 'crud-row-title'),
    ('crud-row-title deudor-row-title', 'crud-row-title'),
    ('crud-row-title card-row-title', 'crud-row-title'),
    ('crud-row-title budget-row-title', 'crud-row-title'),
    ('crud-row-chevron account-row-chevron', 'crud-row-chevron'),
    ('crud-row-chevron debt-row-chevron', 'crud-row-chevron'),
    ('crud-row-chevron proyecto-row-chevron', 'crud-row-chevron'),
    ('crud-row-chevron subscripcion-row-chevron', 'crud-row-chevron'),
    ('crud-row-chevron tarjeta-debito-row-chevron', 'crud-row-chevron'),
    ('crud-row-chevron deudor-row-chevron', 'crud-row-chevron'),
    ('crud-row-chevron card-row-chevron', 'crud-row-chevron'),
    ('crud-row-chevron budget-row-chevron', 'crud-row-chevron'),
    ('crud-transaction-content transaction-content', 'crud-transaction-content'),
    # Inset inner structure → crud
    ('archivos-row-content', 'crud-row-content'),
    ('archivos-row-header', 'crud-row-header'),
    ('archivos-row-title', 'crud-row-title'),
    ('archivos-row-chevron', 'crud-row-chevron'),
    ('archivos-row-preview', 'crud-row-preview'),
    ('archivos-row-meta', 'crud-row-meta'),
    ('archivos-row-file-name', 'crud-row-meta'),
    ('archivos-row-file-size', 'crud-row-meta'),
    ('archivos-row-date', 'crud-row-meta'),
    ('archivos-row-separator', 'crud-row-separator'),
    ('cuadernos-row-content', 'crud-row-content'),
    ('cuadernos-row-header', 'crud-row-header'),
    ('cuadernos-row-title', 'crud-row-title'),
    ('cuadernos-row-chevron', 'crud-row-chevron'),
    ('cuadernos-row-preview', 'crud-row-preview'),
    ('cuadernos-row-date', 'crud-row-meta'),
    ('midiario-row-content', 'crud-row-content'),
    ('midiario-row-header', 'crud-row-header'),
    ('midiario-row-title', 'crud-row-title'),
    ('midiario-row-chevron', 'crud-row-chevron'),
    ('midiario-row-preview', 'crud-row-preview'),
    ('midiario-row-date', 'crud-row-meta'),
    ('cdts-row-content', 'crud-row-content'),
    ('cdts-row-header', 'crud-row-header'),
    ('cdts-row-title', 'crud-row-title'),
    ('cdts-row-chevron', 'crud-row-chevron'),
    ('cdts-row-subtitle', 'crud-row-meta'),
    ('cdts-row-info', 'crud-row-meta'),
    ('cdts-row-date', 'crud-row-meta'),
    ('cdts-row-gain', 'crud-row-highlight'),
    ('secretos-row-content', 'crud-row-content'),
    ('secretos-row-header', 'crud-row-header'),
    ('secretos-row-title', 'crud-row-title'),
    ('secretos-row-chevron', 'crud-row-chevron'),
    ('secretos-row-date', 'crud-row-meta'),
    ('justicia-row-content', 'crud-row-content'),
    ('justicia-row-header', 'crud-row-header'),
    ('justicia-row-title', 'crud-row-title'),
    ('justicia-row-chevron', 'crud-row-chevron'),
    ('notificaciones-item-content', 'crud-row-content'),
    ('notificaciones-item-header', 'crud-row-header'),
    ('notificaciones-item-title', 'crud-row-title'),
    ('notificaciones-item-message', 'crud-row-preview'),
    ('procesos-item-content', 'crud-row-content'),
    ('procesos-item-header', 'crud-row-header'),
    ('procesos-item-title', 'crud-row-title'),
    # Crypto
    ('cripto-wallet-row-content', 'crud-row-content'),
    ('cripto-wallet-row-header', 'crud-row-header'),
    ('cripto-wallet-row-title', 'crud-row-title'),
    ('cripto-wallet-row-chevron', 'crud-row-chevron'),
    ('cripto-wallet-row-subtitle', 'crud-row-meta'),
    ('cripto-wallet-row-address', 'crud-row-hint'),
    ('cripto-transacciones-row-content', 'crud-row-content'),
    ('cripto-transacciones-row-header', 'crud-row-header'),
    ('cripto-transacciones-row-title', 'crud-row-title'),
    ('cripto-transacciones-row-chevron', 'crud-row-chevron'),
    ('cripto-transacciones-row-subtitle', 'crud-row-meta'),
    ('cripto-transacciones-row-amount', 'crud-row-value'),
    # Transaction inner
    ('transaction-content', 'crud-transaction-content'),
    ('transaction-header', 'crud-transaction-header'),
    ('transaction-description', 'crud-transaction-title'),
    ('transaction-amount', 'crud-transaction-amount'),
    ('transaction-details', 'crud-transaction-details'),
    ('transaction-category', 'crud-row-meta'),
    ('transaction-separator', 'crud-row-separator'),
    ('transaction-date', 'crud-row-meta'),
    ('transaction-account', 'crud-row-meta'),
    ('transaction-budget', 'crud-row-highlight'),
    ('transaction-chevron', 'crud-row-chevron'),
    # Card / inset field slots
    ('account-row-balance', 'crud-row-value'),
    ('account-row-secondary', 'crud-row-secondary'),
    ('account-row-bank', 'crud-row-meta'),
    ('account-row-cards', 'crud-row-tags'),
    ('account-row-equivalent', 'crud-row-hint'),
    ('debt-row-amount', 'crud-row-value'),
    ('debt-row-secondary', 'crud-row-secondary'),
    ('debt-row-reference', 'crud-row-meta'),
    ('debt-row-rate', 'crud-row-meta'),
    ('debt-row-progress-container', 'crud-row-progress'),
    ('debt-row-progress-bar', 'crud-row-progress-bar'),
    ('debt-row-progress-fill', 'crud-row-progress-fill'),
    ('debt-row-progress-text', 'crud-row-progress-text'),
    ('card-row-available', 'crud-row-value'),
    ('card-row-secondary', 'crud-row-secondary'),
    ('card-row-bank', 'crud-row-meta'),
    ('card-row-separator', 'crud-row-separator'),
    ('card-row-usage', 'crud-row-meta'),
    ('card-row-benefits', 'crud-row-meta'),
    ('card-row-progress-container', 'crud-row-progress'),
    ('card-row-progress-bar', 'crud-row-progress-bar'),
    ('card-row-progress-fill', 'crud-row-progress-fill'),
    ('proyecto-row-subtitle', 'crud-row-subtitle'),
    ('proyecto-row-secondary', 'crud-row-secondary'),
    ('proyecto-row-progress', 'crud-row-progress'),
    ('proyecto-row-progress-bar', 'crud-row-progress-bar'),
    ('proyecto-row-progress-fill', 'crud-row-progress-fill'),
    ('proyecto-row-progress-text', 'crud-row-progress-text'),
    ('proyecto-row-amount', 'crud-row-value'),
    ('proyecto-row-restante', 'crud-row-meta'),
    ('proyecto-row-duration', 'crud-row-meta'),
    ('subscripcion-row-subtitle', 'crud-row-subtitle'),
    ('subscripcion-row-secondary', 'crud-row-secondary'),
    ('subscripcion-row-price', 'crud-row-value'),
    ('subscripcion-row-date', 'crud-row-meta'),
    ('subscripcion-row-family', 'crud-row-tag'),
    ('tarjeta-debito-row-subtitle', 'crud-row-subtitle'),
    ('tarjeta-debito-row-secondary', 'crud-row-secondary'),
    ('tarjeta-debito-row-number', 'crud-row-meta'),
    ('tarjeta-debito-row-type', 'crud-row-meta'),
    ('tarjeta-debito-row-subscriptions', 'crud-row-meta'),
    ('tarjeta-debito-row-expiration', 'crud-row-meta'),
    ('deudor-row-subtitle', 'crud-row-subtitle'),
    ('deudor-row-secondary', 'crud-row-secondary'),
    ('deudor-row-total', 'crud-row-value'),
    ('deudor-row-bottom', 'crud-row-bottom'),
    ('deudor-row-pending', 'crud-row-meta'),
    ('deudor-row-progress', 'crud-row-progress'),
    ('deudor-row-progress-bar', 'crud-row-progress-bar'),
    ('deudor-row-progress-fill', 'crud-row-progress-fill'),
    ('deudor-row-progress-text', 'crud-row-progress-text'),
    ('budget-row-percentage', 'crud-row-value'),
    ('budget-row-secondary', 'crud-row-secondary'),
    ('budget-row-periodicity', 'crud-row-meta'),
    ('budget-row-amount', 'crud-row-meta'),
    ('budget-row-progress', 'crud-row-progress'),
    ('procesos-item-chevron', 'crud-row-chevron'),
    ('procesos-item-description', 'crud-row-preview'),
    ('procesos-item-meta', 'crud-row-meta'),
    ('procesos-item-separator', 'crud-row-separator'),
    ('procesos-item-estado', 'crud-row-meta'),
    ('procesos-item-date', 'crud-row-meta'),
    ('procesos-item-departamento', 'crud-row-meta'),
    ('procesos-item-tipo', 'crud-row-meta'),
    ('archivos-row-icon-emoji', 'crud-row-icon'),
    ('archivos-row-title-section', 'crud-row-title-section'),
    ('justicia-row-icon', 'crud-row-icon'),
    ('justicia-row-icon-svg', 'crud-row-icon-svg'),
    ('justicia-row-title-section', 'crud-row-title-section'),
    ('notificaciones-item-time', 'crud-row-meta'),
    ('notificaciones-item-type', 'crud-row-meta'),
]

CSS_CLASS_REPLACEMENTS = [
    (old, new)
    for old, new in TSX_REPLACEMENTS
    if not old.startswith("className") and "${" not in old
]

CSS_CLASS_REPLACEMENTS += [
    (".account-row-balance", ".crud-row-value"),
    (".debt-row-amount", ".crud-row-value"),
    (".card-row-available", ".crud-row-value"),
    (".proyecto-row-subtitle", ".crud-row-subtitle"),
    (".archivos-row-preview", ".crud-row-preview"),
    (".midiario-row-preview", ".crud-row-preview"),
    (".notificaciones-item.unread", ".crud-inset-row--unread"),
    (".notificaciones-item.read", ".crud-inset-row--read"),
    (".debt-paid-off", ".crud-card-row--paid-off"),
    (".deudor-paid-off", ".crud-card-row--paid-off"),
]


def apply_replacements(text: str, replacements: list[tuple[str, str]]) -> str:
    for old, new in replacements:
        text = text.replace(old, new)
    return text


def migrate_tsx(path: Path) -> bool:
    original = path.read_text(encoding="utf-8")
    updated = apply_replacements(original, TSX_REPLACEMENTS)
    if updated != original:
        path.write_text(updated, encoding="utf-8")
        return True
    return False


def migrate_css(path: Path) -> bool:
    original = path.read_text(encoding="utf-8")
    updated = apply_replacements(original, CSS_CLASS_REPLACEMENTS)
    if updated != original:
        path.write_text(updated, encoding="utf-8")
        return True
    return False


def main() -> None:
    tsx_n = css_n = 0
    for tsx in sorted(PAGES.glob("*.tsx")):
        if migrate_tsx(tsx):
            tsx_n += 1
            print(f"  tsx: {tsx.name}")
    for css in sorted(PAGES.glob("*.css")):
        if migrate_css(css):
            css_n += 1
            print(f"  css: {css.name}")
    print(f"Done: {tsx_n} TSX, {css_n} CSS")


if __name__ == "__main__":
    main()
