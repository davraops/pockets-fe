#!/usr/bin/env python3
"""P12: Unify page-level *-form-input → form-input-base design system classes."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
PAGES = SRC / "pages"

# Prefixes with simple margin-bottom form groups (→ form-group-base--compact)
COMPACT_GROUP_PREFIXES = {
    "actividades",
    "contratos",
    "empleados",
    "vehiculos",
    "patrimonio",
    "cryptovendors",
    "diseñador",
    "listas",
}

# Prefixes whose labels use flex + icon (→ form-label-base--inline)
INLINE_LABEL_PREFIXES = {
    "actividades",
    "contratos",
    "empleados",
    "vehiculos",
    "patrimonio",
    "cryptovendors",
    "diseñador",
    "listas",
}

ALL_PREFIXES = COMPACT_GROUP_PREFIXES | {
    "archivos",
    "midiario",
    "fechas",
    "rutinas",
}

LABEL_ICON_ALIASES = {
    "contratos-form-label-icon": "form-label-icon",
    "empleados-label-icon": "form-label-icon",
    "vehiculos-label-icon": "form-label-icon",
    "actividades-label-icon": "form-label-icon",
    "patrimonio-label-icon": "form-label-icon",
    "cryptovendors-label-icon": "form-label-icon",
    "diseñador-label-icon": "form-label-icon",
    "listas-label-icon": "form-label-icon",
}


def migrate_tsx(content: str, prefix: str) -> str:
    p = prefix.replace("ñ", "ñ")  # diseñador
  # form-input / textarea / select
    content = content.replace(f"{prefix}-form-input", "form-input-base")
    content = content.replace(f"{prefix}-form-textarea", "form-textarea-base")
    content = content.replace(f"{prefix}-form-select", "form-select-base")

    # Dual-class leftovers (e.g. contratos had input + textarea on same element)
    content = re.sub(
        r"form-input-base\s+form-textarea-base",
        "form-textarea-base",
        content,
    )

    # Legacy .error → design-system input-error
    content = re.sub(
        r"form-input-base\s+\$\{([^}]+)\s*\?\s*'error'\s*:\s*''\}",
        r"form-input-base ${\1 ? 'input-error' : ''}",
        content,
    )
    content = re.sub(
        r"form-textarea-base\s+\$\{([^}]+)\s*\?\s*'error'\s*:\s*''\}",
        r"form-textarea-base ${\1 ? 'input-error' : ''}",
        content,
    )

    if prefix in COMPACT_GROUP_PREFIXES:
        content = content.replace(f"{prefix}-form-group", "form-group-base form-group-base--compact")
    elif prefix in {"fechas", "midiario", "archivos"}:
        content = content.replace(f"{prefix}-form-group", "form-group-base")

    if prefix in INLINE_LABEL_PREFIXES:
        content = content.replace(
            f"{prefix}-form-label",
            "form-label-base form-label-base--inline",
        )
    elif prefix == "fechas":
        content = content.replace(
            f"{prefix}-form-label",
            "form-label-base form-label-base--comfortable",
        )
    elif prefix == "rutinas":
        content = content.replace(f"{prefix}-form-label", "form-label-base")

    for old_icon, new_icon in LABEL_ICON_ALIASES.items():
        if old_icon.startswith(prefix):
            content = content.replace(old_icon, new_icon)

    return content


def remove_css_rule_block(css: str, selector_pattern: str) -> str:
    """Remove a CSS rule block whose selector matches selector_pattern."""
    pattern = re.compile(
        rf"(?:^|\n)({selector_pattern}\s*(?:,\s*[^\{{]+)?)\s*\{{[^{{}}]*\}}",
        re.MULTILINE,
    )
    prev = None
    while prev != css:
        prev = css
        css = pattern.sub("", css)
    return css


def remove_form_input_css(css: str, prefix: str) -> str:
    p = re.escape(prefix)
    # Combined input+textarea+select blocks
    css = remove_css_rule_block(css, rf"\.{p}-form-input")
    css = remove_css_rule_block(css, rf"\.{p}-form-input:focus")
    css = remove_css_rule_block(css, rf"\.{p}-form-textarea")
    css = remove_css_rule_block(css, rf"\.{p}-form-textarea:focus")
    css = remove_css_rule_block(css, rf"\.{p}-form-select")
    css = remove_css_rule_block(css, rf"\.{p}-form-select:focus")
    css = remove_css_rule_block(css, rf"\.{p}-save-form \.{p}-form-input")
    css = remove_css_rule_block(css, rf"\.{p}-form-input\.error")
    css = remove_css_rule_block(css, rf"\.{p}-form-textarea\.error")

    if prefix in COMPACT_GROUP_PREFIXES:
        css = remove_css_rule_block(css, rf"\.{p}-form-group")
        css = remove_css_rule_block(css, rf"\.{p}-form-group:last-of-type")
    elif prefix in {"fechas", "midiario", "archivos"}:
        css = remove_css_rule_block(css, rf"\.{p}-form-group")

    if prefix in INLINE_LABEL_PREFIXES:
        css = remove_css_rule_block(css, rf"\.{p}-form-label")
        css = remove_css_rule_block(css, rf"\.{p}-label-icon")
        css = remove_css_rule_block(css, rf"\.{p}-form-label-icon")

    if prefix == "fechas":
        css = remove_css_rule_block(css, rf"\.{p}-form-label")
        css = remove_css_rule_block(
            css,
            r"\[data-theme='light'\] \.fechas-form-input",
        )
        css = remove_css_rule_block(
            css,
            r"\[data-theme='light'\] \.fechas-form-textarea",
        )

    if prefix == "rutinas":
        css = remove_css_rule_block(css, rf"\.{p}-form-label")
        css = remove_css_rule_block(css, rf"\.{p}-form-input\.error")
        css = remove_css_rule_block(css, rf"\.{p}-form-textarea\.error")

    if prefix == "midiario":
        css = remove_css_rule_block(css, rf"\.{p}-form-label")
        css = remove_css_rule_block(css, rf"\.{p}-form-input\.error")
        css = remove_css_rule_block(css, rf"\.{p}-form-textarea\.error")

    # Textarea-only sizing (now in form-textarea-base)
    css = remove_css_rule_block(css, rf"\.{p}-form-textarea\s*\{{[^}}]*resize")

    return css


def count_light_overrides(text: str) -> int:
    return len(re.findall(r"\[data-theme='light'\]", text))


def main() -> None:
    tsx_changed: list[str] = []
    css_changed: list[str] = []

    for prefix in sorted(ALL_PREFIXES):
        tsx_path = PAGES / f"{prefix[0].upper()}{prefix[1:]}.tsx"
        # Handle special filenames
        name_map = {
            "diseñador": "DiseñadorPresupuestos.tsx",
            "listas": "ListasMercado.tsx",
            "cryptovendors": "CryptoVendors.tsx",
            "midiario": "MiDiario.tsx",
            "fechas": "Fechas.tsx",
            "rutinas": "Rutinas.tsx",
            "actividades": "Actividades.tsx",
            "contratos": "Contratos.tsx",
            "empleados": "Empleados.tsx",
            "vehiculos": "Vehiculos.tsx",
            "patrimonio": "Patrimonio.tsx",
            "archivos": "Archivos.tsx",
        }
        tsx_path = PAGES / name_map.get(prefix, f"{prefix}.tsx")
        css_path = PAGES / tsx_path.name.replace(".tsx", ".css")

        if tsx_path.exists():
            original = tsx_path.read_text(encoding="utf-8")
            migrated = migrate_tsx(original, prefix)
            if migrated != original:
                tsx_path.write_text(migrated, encoding="utf-8")
                tsx_changed.append(str(tsx_path.relative_to(ROOT)))

        if css_path.exists():
            original = css_path.read_text(encoding="utf-8")
            migrated = remove_form_input_css(original, prefix)
            if migrated != original:
                css_path.write_text(migrated, encoding="utf-8")
                css_changed.append(str(css_path.relative_to(ROOT)))

    light_before = 0
    light_after = 0
    for css_file in (SRC / "pages").rglob("*.css"):
        text = css_file.read_text(encoding="utf-8")
        light_after += count_light_overrides(text)
    # rough estimate — we only removed fechas light overrides in this pass

    print("P12 migrate-crud-forms-phase12")
    print(f"  TSX updated: {len(tsx_changed)}")
    for f in tsx_changed:
        print(f"    - {f}")
    print(f"  CSS updated: {len(css_changed)}")
    for f in css_changed:
        print(f"    - {f}")
    print(f"  Light overrides (pages CSS): ~{light_after}")


if __name__ == "__main__":
    main()
