#!/usr/bin/env python3
"""P4: Move transaction-item and crypto row CSS to domains; add crud-* semantic classes."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = ROOT / "src" / "pages"

TRANSACTION_CLASSES = [
    "transactions-list",
    "transactions-group",
    "transaction-item",
    "transaction-content",
    "transaction-header",
    "transaction-description",
    "transaction-amount",
    "transaction-details",
    "transaction-category",
    "transaction-separator",
    "transaction-date",
    "transaction-account",
    "transaction-budget",
    "transaction-chevron",
    "transaction-row-amount",
    "transaction-row-secondary",
    "transaction-row-category",
    "transaction-row-separator",
    "transaction-row-date",
    "transaction-row-account",
]

CRYPTO_ROW_CLASSES = [
    "cripto-transacciones-list",
    "cripto-wallet-row",
    "cripto-transacciones-row",
    "cripto-wallet-row-header",
    "cripto-transacciones-row-header",
    "cripto-wallet-row-title",
    "cripto-transacciones-row-title",
    "cripto-wallet-row-subtitle",
    "cripto-transacciones-row-subtitle",
    "cripto-wallet-row-address",
    "cripto-transacciones-row-address",
    "cripto-wallet-row-amount",
    "cripto-transacciones-row-amount",
    "cripto-wallet-row-chevron",
    "cripto-transacciones-row-chevron",
]

TRANSACTION_TYPE_RULES = [
    ".transaction-row.income",
    ".transaction-row.expense",
    ".transaction-row.savings",
    ".transaction-row.income:hover:not(:disabled)",
    ".transaction-row.expense:hover:not(:disabled)",
    ".transaction-row.savings:hover:not(:disabled)",
]

PSEUDOS = ["", ":hover:not(:disabled)", ":active:not(:disabled)", ":focus-visible", ":disabled"]

RULE_RE = r"(?:\[data-theme='light'\]\s*)?\.{cls}{pseudo}\s*(?:::before)?\s*\{{[^}}]*\}}\s*"


def _remove_rule_from(text: str, needle: str) -> str:
    idx = text.find(needle)
    if idx == -1:
        return text
    brace = text.find("{", idx)
    if brace == -1:
        return text
    depth = 0
    for i in range(brace, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                return text[:idx] + text[i + 1 :]
    return text


def strip_class_rules(css_path: Path, classes: list[str], pseudos: list[str] | None = None) -> bool:
    text = css_path.read_text(encoding="utf-8")
    original = text
    pseudo_list = pseudos if pseudos is not None else PSEUDOS
    for cls in classes:
        for pseudo in pseudo_list:
            pattern = RULE_RE.format(cls=re.escape(cls), pseudo=re.escape(pseudo))
            text = re.sub(pattern, "", text, flags=re.DOTALL)
        for suffix in (".income", ".expense", ".savings"):
            text = _remove_rule_from(text, f".{cls}{suffix}")
            text = _remove_rule_from(text, f"[data-theme='light'] .{cls}{suffix}")
    if text != original:
        css_path.write_text(text, encoding="utf-8")
        return True
    return False


def strip_type_rules(css_path: Path) -> bool:
    text = css_path.read_text(encoding="utf-8")
    original = text
    for selector in TRANSACTION_TYPE_RULES:
        text = _remove_rule_from(text, selector)
    if text != original:
        css_path.write_text(text, encoding="utf-8")
        return True
    return False


def add_semantic_classes(tsx_path: Path) -> bool:
    text = tsx_path.read_text(encoding="utf-8")
    original = text

    text = re.sub(
        r'className="transactions-list"',
        'className="crud-transaction-list transactions-list"',
        text,
    )
    text = re.sub(
        r'className="cripto-transacciones-list"',
        'className="crud-crypto-list cripto-transacciones-list"',
        text,
    )
    text = re.sub(
        r'className="(?!(?:crud-transaction-row)\s)transaction-item"',
        'className="crud-transaction-row transaction-item"',
        text,
    )
    text = re.sub(
        r'className=\{`(?!(?:crud-transaction-row)\s)transaction-item ',
        'className={`crud-transaction-row transaction-item ',
        text,
    )
    text = re.sub(
        r'className="transaction-content"',
        'className="crud-transaction-content transaction-content"',
        text,
    )
    text = re.sub(
        r'className="(?!(?:crud-crypto-row)\s)cripto-wallet-row"',
        'className="crud-crypto-row cripto-wallet-row"',
        text,
    )
    text = re.sub(
        r'className="(?!(?:crud-crypto-row)\s)cripto-transacciones-row"',
        'className="crud-crypto-row cripto-transacciones-row"',
        text,
    )

    if text != original:
        tsx_path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> None:
    tx_css = strip_class_rules(PAGES / "Transacciones.css", TRANSACTION_CLASSES)
    tx_type = strip_type_rules(PAGES / "Transacciones.css")
    wallet_css = strip_class_rules(PAGES / "CriptoWallet.css", CRYPTO_ROW_CLASSES)
    cripto_css = strip_class_rules(PAGES / "CriptoTransacciones.css", CRYPTO_ROW_CLASSES)

    tsx_n = 0
    for name in ("Transacciones.tsx", "CriptoWallet.tsx", "CriptoTransacciones.tsx"):
        path = PAGES / name
        if path.exists() and add_semantic_classes(path):
            tsx_n += 1
            print(f"  tsx: {name}")

    print(
        f"Done: transacciones_css={tx_css}, transacciones_type={tx_type}, "
        f"wallet_css={wallet_css}, cripto_css={cripto_css}, tsx={tsx_n}"
    )


if __name__ == "__main__":
    main()
