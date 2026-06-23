#!/usr/bin/env python3
"""P20: Generate tokenCatalog.generated.ts for undocumented index.css tokens."""

from __future__ import annotations

import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX_CSS = ROOT / "src" / "index.css"
TOKENS_TS = ROOT / "src" / "constants" / "designTokens.ts"
OUTPUT = ROOT / "src" / "constants" / "tokenCatalog.generated.ts"

VAR_RE = re.compile(r"--([a-z0-9-]+)\s*:", re.IGNORECASE)
DOCUMENTED_RE = re.compile(r"name:\s*'(--[a-z0-9-]+)'", re.IGNORECASE)

GROUP_RULES: list[tuple[str, str, re.Pattern[str]]] = [
    ("layout-chrome", "Layout chrome", re.compile(r"^--layout-(?!max-width)")),
    ("typography-ext", "Tipografía (ext.)", re.compile(r"^--(font-size-(3xl|display)|letter-spacing-normal)")),
    ("shadows", "Sombras", re.compile(r"^--shadow-")),
    ("transitions", "Transiciones", re.compile(r"^--transition-")),
    ("backdrop", "Backdrop blur", re.compile(r"^--backdrop-")),
    ("backgrounds", "Fondos (tema)", re.compile(r"^--bg-")),
    ("borders", "Bordes (tema)", re.compile(r"^--border-")),
    ("text-ext", "Texto (tema)", re.compile(r"^--text-")),
    ("accents-ext", "Acentos (ext.)", re.compile(r"^--accent-")),
    ("danger-ext", "Danger (ext.)", re.compile(r"^--color-danger-")),
    ("financial-ext", "Financiero (ext.)", re.compile(r"^--color-(income|expense|savings|info|indigo|unavailable|password|summary)")),
    ("row-accent-ext", "Row accent (ext.)", re.compile(r"^--row-accent-")),
    ("buttons", "Botones (tema)", re.compile(r"^--btn-")),
    ("badges-ext", "Badges (ext.)", re.compile(r"^--badge-")),
    ("priority-ext", "Prioridad (ext.)", re.compile(r"^--priority-")),
    ("highlights", "Highlights (tema)", re.compile(r"^--highlight-")),
    ("alerts", "Alertas (tema)", re.compile(r"^--alert-")),
    ("tabs", "Tabs (tema)", re.compile(r"^--tab-")),
    ("chips", "Chips (tema)", re.compile(r"^--chip-")),
    ("inputs", "Inputs (tema)", re.compile(r"^--input-")),
    ("glass-ext", "Glass (ext.)", re.compile(r"^--glass-")),
    ("overlays", "Overlays & modales", re.compile(r"^--(surface-overlay|overlay-|modal-)")),
    ("surfaces", "Superficies semánticas", re.compile(r"^--surface-")),
    ("app-icon", "App launcher", re.compile(r"^--app-icon-")),
    ("cta", "CTA info", re.compile(r"^--cta-")),
    ("charts-ext", "Chart.js (ext.)", re.compile(r"^--chart-")),
    ("sections-ext", "Secciones iOS (ext.)", re.compile(r"^--section-")),
    ("checkbox-ext", "Checkbox", re.compile(r"^--checkbox-")),
    ("motion-ext", "Motion (ext.)", re.compile(r"^--(motion-|focus-outline-offset)")),
    ("misc", "Utilidades", re.compile(r"^--")),
]

STRUCTURAL_ONLY = {
    "--transition-fast",
    "--transition-base",
    "--transition-slow",
    "--focus-outline-width",
    "--focus-outline-offset",
    "--focus-outline-offset-inset",
    "--focus-outline-offset-lg",
    "--focus-outline-width-contrast",
    "--touch-target-min",
    "--motion-lift-sm",
    "--motion-lift-md",
    "--motion-lift-lg",
    "--motion-press-scale",
    "--motion-hover-scale",
    "--motion-shift-x",
    "--layout-max-width-hub",
    "--layout-max-width-wide",
    "--font-family",
    "--font-size-xs",
    "--font-size-sm",
    "--font-size-base",
    "--font-size-md",
    "--font-size-lg",
    "--font-size-xl",
    "--font-size-2xl",
    "--font-size-xxl",
    "--font-size-hero",
    "--font-size-3xl",
    "--font-size-display",
    "--font-weight-normal",
    "--font-weight-medium",
    "--font-weight-semibold",
    "--font-weight-bold",
    "--letter-spacing-tight",
    "--spacing-xs",
    "--spacing-sm",
    "--spacing-md",
    "--spacing-lg",
    "--spacing-xl",
    "--radius-sm",
    "--radius-md",
    "--radius-lg",
    "--radius-xl",
    "--radius-2xl",
}


def extract_vars_in_block(text: str) -> set[str]:
    return {f"--{m}" for m in VAR_RE.findall(text)}


def parse_css_blocks(css: str) -> tuple[set[str], set[str], set[str]]:
    root_match = re.search(r":root\s*\{", css)
    dark_match = re.search(r":root,\s*\n\[data-theme='dark'\]\s*\{", css)
    light_match = re.search(r"\[data-theme='light'\]\s*\{", css)

    structural_end = dark_match.start() if dark_match else len(css)
    structural = extract_vars_in_block(css[root_match.end() : structural_end])

    dark_end = light_match.start() if light_match else len(css)
    dark = extract_vars_in_block(css[dark_match.end() : dark_end])

    light_block_end = css.find("\n}", light_match.end()) if light_match else len(css)
    light = extract_vars_in_block(css[light_match.end() : light_block_end])

    return structural, dark, light


def infer_kind(name: str) -> str:
    if "shadow" in name:
        return "shadow"
    if name.startswith("--font-") or name.startswith("--letter-spacing"):
        return "font"
    if (
        name.startswith("--spacing-")
        or name.startswith("--radius-")
        or name.startswith("--layout-")
        or name.startswith("--focus-outline")
        or name.startswith("--motion-")
        or name.startswith("--touch-")
    ):
        return "length"
    if name.startswith("--transition-") or name.startswith("--backdrop-"):
        return "other"
    if name.startswith("--motion-") or name.endswith("-scale"):
        return "other"
    return "color"


def is_themed(name: str, structural: set[str], dark: set[str], light: set[str]) -> bool:
    if name in STRUCTURAL_ONLY:
        return False
    if name.startswith("--section-"):
        return False
    if name in dark and name in light:
        return True
    if name in dark or name in light:
        return True
    return False


def assign_group(name: str) -> tuple[str, str]:
    for gid, label, pattern in GROUP_RULES:
        if pattern.search(name):
            return gid, label
    return "misc", "Utilidades"


def ts_token(name: str, kind: str, themed: bool) -> str:
    parts = [f"name: '{name}'", f"kind: '{kind}'"]
    if themed:
        parts.append("themed: true")
    return "      { " + ", ".join(parts) + " }"


def main() -> None:
    css = INDEX_CSS.read_text(encoding="utf-8")
    documented = set(DOCUMENTED_RE.findall(TOKENS_TS.read_text(encoding="utf-8")))
    all_vars = extract_vars_in_block(css)
    missing = sorted(all_vars - documented)

    structural, dark, light = parse_css_blocks(css)

    grouped: dict[tuple[str, str], list[str]] = defaultdict(list)
    for name in missing:
        gid, label = assign_group(name)
        grouped[(gid, label)].append(name)

    lines = [
        "/**",
        " * AUTO-GENERATED by scripts/sync-token-catalog-phase20.py",
        " * Undocumented tokens from src/index.css — do not edit by hand.",
        " */",
        "",
        "import type { DesignTokenGroup } from './designTokens'",
        "",
        "export const GENERATED_TOKEN_GROUPS: DesignTokenGroup[] = [",
    ]

    for (gid, label), names in sorted(grouped.items(), key=lambda x: x[0][0]):
        lines.append("  {")
        lines.append(f"    id: '{gid}',")
        lines.append(f"    label: '{label}',")
        lines.append("    tokens: [")
        for name in sorted(names):
            kind = infer_kind(name)
            themed = is_themed(name, structural, dark, light)
            lines.append(ts_token(name, kind, themed) + ",")
        lines.append("    ],")
        lines.append("  },")

    lines.append("]")
    lines.append("")

    OUTPUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Generated {OUTPUT.relative_to(ROOT)}")
    print(f"  Groups: {len(grouped)}")
    print(f"  Tokens: {len(missing)}")


if __name__ == "__main__":
    main()
