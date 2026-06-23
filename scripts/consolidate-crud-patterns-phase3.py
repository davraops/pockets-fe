#!/usr/bin/env python3
"""Strip card-row CSS and add crud-* semantic classes to TSX."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = ROOT / "src" / "pages"

CARD_ROW_CLASSES = [
    "debt-row",
    "card-row",
    "proyecto-row",
    "subscripcion-row",
    "tarjeta-debito-row",
    "deudor-row",
]

INSET_ROW_CLASSES = [
    "account-row",
    "transaction-row",
    "archivos-row",
    "cuadernos-row",
    "midiario-row",
    "procesos-item",
    "notificaciones-item",
    "trabajo-row",
    "cdts-row",
    "budget-row",
    "secretos-row",
    "justicia-row",
]

CARD_PSEUDOS = [
    "",
    ":hover:not(:disabled)",
    ":active:not(:disabled)",
    ":focus-visible",
    ":disabled",
]

CARD_SHARED_CLASSES = [
    "debts-list",
    "cards-list",
    "me-deben-list",
    "proyecto-row-subtitle",
    "subscripcion-row-subtitle",
    "tarjeta-debito-row-subtitle",
    "proyecto-row-secondary",
    "subscripcion-row-secondary",
    "tarjeta-debito-row-secondary",
    "debt-row-secondary",
    "card-row-secondary",
    "deudor-row-secondary",
]

RULE_RE = r"(?:\[data-theme='light'\]\s*)?\.{cls}{pseudo}\s*(?:::before)?\s*\{{[^}}]*\}}\s*"

CONTENT_ROW_CLASSES = [
    "row-content",
    "row-main",
    "row-title",
    "row-chevron",
]


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
    pseudo_list = pseudos if pseudos is not None else [""]
    for cls in classes:
        for pseudo in pseudo_list:
            pattern = RULE_RE.format(cls=re.escape(cls), pseudo=re.escape(pseudo))
            text = re.sub(pattern, "", text, flags=re.DOTALL)
        text = _remove_rule_from(text, f".{cls}::before")
    if text != original:
        css_path.write_text(text, encoding="utf-8")
        return True
    return False


def add_semantic_classes_to_tsx(tsx_path: Path) -> bool:
    text = tsx_path.read_text(encoding="utf-8")
    original = text

    for cls in INSET_ROW_CLASSES:
        text = re.sub(
            rf'className="(?!(?:crud-inset-row|crud-card-row)\s){cls}"',
            f'className="crud-inset-row {cls}"',
            text,
        )
        text = re.sub(
            rf'className=\{{`(?!(?:crud-inset-row|crud-card-row)\s){cls}',
            f'className={{`crud-inset-row {cls}',
            text,
        )

    for cls in CARD_ROW_CLASSES:
        text = re.sub(
            rf'className="(?!(?:crud-inset-row|crud-card-row)\s){cls}"',
            f'className="crud-card-row {cls}"',
            text,
        )
        text = re.sub(
            rf'className=\{{`{cls} ',
            f'className={{`crud-card-row {cls} ',
            text,
        )

    for suffix in CONTENT_ROW_CLASSES:
        for prefix in ("account", "transaction", "debt", "proyecto", "subscripcion", "card", "tarjeta-debito", "deudor", "budget"):
            cls = f"{prefix}-{suffix}"
            crud = f"crud-{suffix}"
            text = re.sub(
                rf'className="(?!(?:crud-){suffix}\s){cls}"',
                f'className="{crud} {cls}"',
                text,
            )

    if text != original:
        tsx_path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> None:
    card_n = shared_n = tsx_n = 0

    for css in sorted(PAGES.glob("*.css")):
        if strip_class_rules(css, CARD_ROW_CLASSES, CARD_PSEUDOS):
            card_n += 1
            print(f"  card row: {css.name}")
        if strip_class_rules(css, CARD_SHARED_CLASSES):
            shared_n += 1
            print(f"  card shared: {css.name}")

    # Keep page-specific paid-off / amount styles; strip light-theme duplicates for card rows
    for name in ("Proyectos.css", "Subscripciones.css", "TarjetasDebito.css", "MeDeben.css"):
        path = PAGES / name
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        original = text
        text = re.sub(
            r"\[data-theme='light'\]\s*\.(?:proyecto|subscripcion|tarjeta-debito|deudor)-row\s*\{[^}]*\}\s*",
            "",
            text,
        )
        text = re.sub(
            r"\[data-theme='light'\]\s*\.(?:proyecto|subscripcion|tarjeta-debito|deudor)-row:hover:not\(:disabled\)\s*\{[^}]*\}\s*",
            "",
            text,
        )
        if text != original:
            path.write_text(text, encoding="utf-8")
            print(f"  light card stripped: {name}")

    for tsx in sorted(PAGES.glob("*.tsx")):
        if add_semantic_classes_to_tsx(tsx):
            tsx_n += 1
            print(f"  tsx: {tsx.name}")

    print(f"Done: {card_n} card CSS, {shared_n} shared CSS, {tsx_n} TSX")


if __name__ == "__main__":
    main()
