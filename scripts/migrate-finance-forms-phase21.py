#!/usr/bin/env python3
"""P21: Migrate finance pages from legacy .form-group CSS to form-*-base."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = ROOT / "src" / "pages"

FINANCE_PAGES = [
    "Cuentas",
    "Transacciones",
    "TarjetasCredito",
    "TarjetasDebito",
    "CriptoWallet",
    "CriptoTransacciones",
    "Proyectos",
    "Deudas",
]

CSS_REMOVE_SELECTORS = [
    r"\.form-group\s+input,\s*\n\s*\.form-group\s+select,\s*\n\s*\.form-group\s+textarea",
    r"\.form-group\s+input,\s*\n\s*\.form-group\s+select",
    r"\.form-group\s+input,\s*\n\s*\.form-group\s+textarea",
    r"\.form-group\s+textarea",
    r"\.form-group\s+select",
    r"\.form-group\s+input::placeholder",
    r"\.form-group\s+input:focus,\s*\n\s*\.form-group\s+select:focus,\s*\n\s*\.form-group\s+textarea:focus",
    r"\.form-group\s+input:focus,\s*\n\s*\.form-group\s+select:focus",
    r"\.form-group\s+input\.input-error,\s*\n\s*\.form-group\s+select\.input-error,\s*\n\s*\.form-group\s+textarea\.input-error",
    r"\.form-group\s+input\.input-error,\s*\n\s*\.form-group\s+select\.input-error",
    r"\.form-group\s+input\.input-error:focus,\s*\n\s*\.form-group\s+select\.input-error:focus",
    r"\.form-group\s+select\.disabled-input",
    r"\.form-group\s+select:disabled",
    r"\.form-group\s+select\s+option",
    r"\.form-group\s+label",
    r"\.form-group",
    r"\.form-label",
    r"\.form-select:hover",
    r"\.form-select:focus",
    r"\.form-select\s+option",
    r"\.form-select",
    r"\.form-hint",
]


def remove_css_rule_block(css: str, selector_pattern: str) -> str:
    pattern = re.compile(
        rf"(?:^|\n)({selector_pattern}\s*(?:,\s*[^\{{]+)?)\s*\{{[^{{}}]*\}}",
        re.MULTILINE,
    )
    prev = None
    while prev != css:
        prev = css
        css = pattern.sub("", css)
    return css


def migrate_tsx(content: str) -> str:
    content = content.replace(
        'className="form-group checkbox-group"',
        'className="form-group-base checkbox-group"',
    )
    content = content.replace('className="form-group"', 'className="form-group-base"')
    content = content.replace('className="form-label"', 'className="form-label-base"')

    content = re.sub(
        r"<label (htmlFor=\"[^\"]+\")(?![^>]*className)>",
        r'<label \1 className="form-label-base">',
        content,
    )

    def fix_select_error(match: re.Match[str]) -> str:
        expr = match.group(1).strip()
        return "className={`form-select-base ${" + expr + " ? 'input-error' : ''}`}"

    content = re.sub(
        r"className=\{([^}?]+)\?\s*'input-error form-select(?:-base)?'\s*:\s*'form-select(?:-base)?'\}",
        fix_select_error,
        content,
    )

    def fix_select_error_multiline(match: re.Match[str]) -> str:
        expr = match.group(1).strip()
        return "className={`form-select-base ${" + expr + " ? 'input-error' : ''}`}"

    content = re.sub(
        r"className=\{\s*\n\s*([^}?]+)\?\s*'input-error form-select(?:-base)?'\s*:\s*'form-select(?:-base)?'\s*\n\s*\}",
        fix_select_error_multiline,
        content,
    )

    def fix_input_error(match: re.Match[str]) -> str:
        expr = match.group(1).strip()
        return "className={`form-input-base ${" + expr + " ? 'input-error' : ''}`}"

    content = re.sub(
        r"className=\{([^}?]+)\?\s*'input-error'\s*:\s*''\}",
        fix_input_error,
        content,
    )

    content = re.sub(r'\bclassName="form-select disabled-input"', 'className="form-select-base disabled-input"', content)
    content = re.sub(r'\bclassName="form-select"', 'className="form-select-base"', content)

    content = content.replace("form-select-base-base", "form-select-base")
    content = content.replace("form-input-base-base", "form-input-base")

    def fix_textarea_error(match: re.Match[str]) -> str:
        prefix = match.group(1)
        expr = match.group(2).strip()
        return prefix + "className={`form-textarea-base ${" + expr + " ? 'input-error' : ''}`}"

    content = re.sub(
        r"(<textarea[^>]*?)className=\{([^}?]+)\?\s*'input-error'\s*:\s*''\}",
        fix_textarea_error,
        content,
    )

    return content


def strip_form_css(css: str) -> str:
    for selector in CSS_REMOVE_SELECTORS:
        css = remove_css_rule_block(css, selector)

    css = re.sub(r"\n{3,}", "\n\n", css)
    return css


def count_legacy(css: str) -> int:
    patterns = [
        r"\.form-group\s+(?:input|select|label|textarea)",
        r"\.form-group\s*\{",
        r"\.form-select\s*\{",
        r"\.form-label\s*\{",
    ]
    return sum(len(re.findall(p, css)) for p in patterns)


def main() -> None:
    updated_tsx: list[str] = []
    updated_css: list[str] = []

    for name in FINANCE_PAGES:
        tsx_path = PAGES / f"{name}.tsx"
        css_path = PAGES / f"{name}.css"

        if tsx_path.exists():
            original = tsx_path.read_text(encoding="utf-8")
            migrated = migrate_tsx(original)
            if migrated != original:
                tsx_path.write_text(migrated, encoding="utf-8")
                updated_tsx.append(name)

        if css_path.exists():
            original_css = css_path.read_text(encoding="utf-8")
            before = count_legacy(original_css)
            css = strip_form_css(original_css)
            after = count_legacy(css)
            if css != original_css:
                css_path.write_text(css, encoding="utf-8")
                updated_css.append(f"{name} ({before}→{after})")

    print("TSX updated:", ", ".join(updated_tsx) or "none")
    print("CSS updated:", ", ".join(updated_css) or "none")

    remaining = 0
    for css in PAGES.glob("*.css"):
        remaining += count_legacy(css.read_text(encoding="utf-8"))
    print(f"Remaining .form-group input/select/label rules in pages: {remaining}")


if __name__ == "__main__":
    main()
