#!/usr/bin/env python3
"""Strip loader, empty-state, and list-row CSS now in domains/crud*.css."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = ROOT / "src" / "pages"

LOADER_FILES = {
    "Cuentas.css",
    "Proyectos.css",
    "TarjetasCredito.css",
    "CriptoWallet.css",
    "Finanzas.css",
    "CriptoTransacciones.css",
    "TarjetasDebito.css",
    "Subscripciones.css",
}

EMPTY_FILES = {
    "Transacciones.css",
    "Proyectos.css",
    "TarjetasDebito.css",
    "TarjetasCredito.css",
    "Cuentas.css",
    "Subscripciones.css",
    "Deudas.css",
}

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

ROW_SHARED_CLASSES = [
    "account-row-content",
    "transaction-row-content",
    "archivos-row-content",
    "cuadernos-row-content",
    "midiario-row-content",
    "debt-row-content",
    "proyecto-row-content",
    "subscripcion-row-content",
    "budget-row-content",
    "cdts-row-content",
    "justicia-row-content",
    "secretos-row-content",
    "trabajo-row-content",
    "deudor-row-content",
    "card-row-content",
    "tarjeta-debito-row-content",
    "cripto-transacciones-row-content",
    "cripto-wallet-row-content",
    "account-row-main",
    "transaction-row-main",
    "debt-row-main",
    "proyecto-row-main",
    "subscripcion-row-main",
    "budget-row-main",
    "archivos-row-header",
    "cuadernos-row-header",
    "midiario-row-header",
    "cdts-row-header",
    "justicia-row-header",
    "secretos-row-header",
    "trabajo-row-header",
    "deudor-row-main",
    "card-row-main",
    "tarjeta-debito-row-main",
    "account-row-title",
    "transaction-row-title",
    "debt-row-title",
    "proyecto-row-title",
    "subscripcion-row-title",
    "budget-row-title",
    "archivos-row-title",
    "cuadernos-row-title",
    "midiario-row-title",
    "cdts-row-title",
    "justicia-row-title",
    "secretos-row-title",
    "trabajo-row-title",
    "deudor-row-name",
    "card-row-title",
    "tarjeta-debito-row-title",
    "account-row-chevron",
    "transaction-row-chevron",
    "archivos-row-chevron",
    "cuadernos-row-chevron",
    "midiario-row-chevron",
    "cdts-row-chevron",
    "justicia-row-chevron",
    "secretos-row-chevron",
    "trabajo-row-chevron",
    "debt-row-chevron",
    "proyecto-row-chevron",
    "subscripcion-row-chevron",
    "budget-row-chevron",
    "deudor-row-chevron",
    "card-row-chevron",
    "tarjeta-debito-row-chevron",
]

INSET_PSEUDOS = [
    "",
    ":last-child",
    ":hover:not(:disabled)",
    ":active:not(:disabled)",
    ":focus-visible",
    ":disabled",
]

RULE_RE_TEMPLATE = r"(?:\[data-theme='light'\]\s*)?\.{cls}{pseudo}\s*\{{[^}}]*\}}\s*"


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


def strip_loader(css_path: Path) -> bool:
    text = css_path.read_text(encoding="utf-8")
    original = text
    text = re.sub(r"/\*\s*Loader[^*]*\*/\s*", "", text)
    for selector in (
        ".loader-container",
        ".loader",
        ".loader-spinner",
        "@keyframes spin",
        ".loader-text",
    ):
        text = _remove_rule_from(text, selector)
    if text != original:
        css_path.write_text(text, encoding="utf-8")
        return True
    return False


def strip_empty(css_path: Path) -> bool:
    text = css_path.read_text(encoding="utf-8")
    original = text
    text = re.sub(
        r"(?:/\*\s*Empty State[^*]*\*/\s*)?"
        r"\.empty-state\s*\{[^}]*\}\s*"
        r"\.empty-text\s*\{[^}]*\}\s*"
        r"(?:\[data-theme='light'\]\s*\.empty-text\s*\{[^}]*\}\s*)?"
        r"\.empty-subtext\s*\{[^}]*\}\s*"
        r"(?:\[data-theme='light'\]\s*\.empty-subtext\s*\{[^}]*\}\s*)?",
        "",
        text,
        flags=re.DOTALL,
    )
    if text != original:
        css_path.write_text(text, encoding="utf-8")
        return True
    return False


def strip_class_rules(css_path: Path, classes: list[str], pseudos: list[str] | None = None) -> bool:
    text = css_path.read_text(encoding="utf-8")
    original = text
    pseudo_list = pseudos if pseudos is not None else [""]
    for cls in classes:
        for pseudo in pseudo_list:
            pattern = RULE_RE_TEMPLATE.format(cls=re.escape(cls), pseudo=re.escape(pseudo))
            text = re.sub(pattern, "", text, flags=re.DOTALL)
            pattern_light = (
                r"\[data-theme='light'\]\s*\." + re.escape(cls) + re.escape(pseudo) + r"\s*\{[^}]*\}\s*"
            )
            text = re.sub(pattern_light, "", text)
    if text != original:
        css_path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> None:
    loader_n = empty_n = inset_n = shared_n = 0

    for name in LOADER_FILES:
        path = PAGES / name
        if path.exists() and strip_loader(path):
            loader_n += 1
            print(f"  loader: {name}")

    for name in EMPTY_FILES:
        path = PAGES / name
        if path.exists() and strip_empty(path):
            empty_n += 1
            print(f"  empty: {name}")

    for css in sorted(PAGES.glob("*.css")):
        if strip_class_rules(css, INSET_ROW_CLASSES, INSET_PSEUDOS):
            inset_n += 1
            print(f"  inset rows: {css.name}")

    for css in sorted(PAGES.glob("*.css")):
        if strip_class_rules(css, ROW_SHARED_CLASSES):
            shared_n += 1
            print(f"  row shared: {css.name}")

    print(f"Done: {loader_n} loaders, {empty_n} empty, {inset_n} inset, {shared_n} shared")


if __name__ == "__main__":
    main()
