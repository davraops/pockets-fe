#!/usr/bin/env python3
"""P11: Chips, icon buttons, save CTAs — remove dark/light override pairs."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"

BASE_REPLACEMENTS: list[tuple[str, str]] = [
  # Summary/total chips → highlight-success
  (
    r"color: var\(--accent-success\);\s*padding: var\(--spacing-sm\) var\(--spacing-md\);\s*"
    r"background: var\(--bg-glass\);\s*border: 1px solid var\(--border-glass\);",
    "color: var(--highlight-success-text);\n  padding: var(--spacing-sm) var(--spacing-md);\n  "
    "background: var(--highlight-success-bg);\n  border: 1px solid var(--highlight-success-border);",
  ),
  (
    r"color: var\(--accent-success\);\s*background: var\(--bg-glass\);\s*"
    r"padding: var\(--spacing-xs\) var\(--spacing-sm\);\s*"
    r"border-radius: var\(--radius-sm\);\s*border: 1px solid var\(--border-glass\);",
    "color: var(--highlight-success-text);\n  background: var(--highlight-success-bg);\n  "
    "padding: var(--spacing-xs) var(--spacing-sm);\n  border-radius: var(--radius-sm);\n  "
    "border: 1px solid var(--highlight-success-border);",
  ),
  # Info chip (year, meta values)
  (
    r"color: var\(--accent-primary\);\s*background: var\(--bg-glass\);\s*"
    r"padding: var\(--spacing-xs\) var\(--spacing-sm\);\s*"
    r"border-radius: var\(--radius-sm\);\s*border: 1px solid var\(--border-glass\);",
    "color: var(--chip-info-text);\n  background: var(--chip-info-bg);\n  "
    "padding: var(--spacing-xs) var(--spacing-sm);\n  border-radius: var(--radius-sm);\n  "
    "border: 1px solid var(--chip-info-border);",
  ),
  # Icon action buttons
  (
    r"border: 1px solid var\(--border-glass\);\s*border-radius: var\(--radius-sm\);\s*"
    r"cursor: pointer;\s*transition: all var\(--transition-base\);\s*color: var\(--text-secondary\);",
    "border: 1px solid var(--btn-icon-border);\n  border-radius: var(--radius-sm);\n  "
    "cursor: pointer;\n  transition: all var(--transition-base);\n  color: var(--btn-icon-color);",
  ),
  (
    r"background: var\(--bg-glass-hover\);\s*color: var\(--text-primary\);\s*"
    r"border-color: var\(--border-glass-hover\);",
    "background: var(--btn-icon-hover-bg);\n  color: var(--btn-icon-hover-color);\n  "
    "border-color: var(--btn-icon-hover-border);",
  ),
  (
    r"background: var\(--color-danger-bg-soft\);\s*border-color: var\(--color-danger-solid\);\s*"
    r"color: var\(--color-danger-solid\);",
    "background: var(--btn-danger-hover-bg);\n  border-color: var(--btn-danger-hover-border);\n  "
    "color: var(--btn-danger-hover-text);",
  ),
  (
    r"background: var\(--accent-danger\);\s*border-color: var\(--accent-danger\);\s*color: white;",
    "background: var(--btn-danger-hover-bg);\n  border-color: var(--btn-danger-hover-border);\n  "
    "color: var(--btn-danger-hover-text);",
  ),
  # Save / primary CTA hover
  (
    r"background: var\(--accent-primary-hover\);\s*transform: translateY\(-1px\);\s*"
    r"box-shadow: var\(--shadow-md\);",
    "background: var(--btn-primary-hover-bg);\n  transform: translateY(-1px);\n  "
    "box-shadow: var(--btn-primary-shadow-hover);",
  ),
  # Inflacion status
  (r"color: rgba\(255, 149, 0, 0\.9\);", "color: var(--status-devalued-text);"),
  (
    r"background: rgba\(255, 149, 0, 0\.1\);\s*backdrop-filter: blur\(20px\);\s*"
    r"-webkit-backdrop-filter: blur\(20px\);\s*border-radius: var\(--radius-md\);\s*"
    r"border: 1px solid rgba\(255, 149, 0, 0\.3\);",
    "background: var(--surface-prediction-bg);\n  backdrop-filter: blur(20px);\n  "
    "-webkit-backdrop-filter: blur(20px);\n  border-radius: var(--radius-md);\n  "
    "border: 1px solid var(--surface-prediction-border);",
  ),
  (r"border-color: rgba\(0, 0, 0, 0\.15\);", "border-color: var(--btn-icon-border);"),
  (r"border-color: rgba\(0, 0, 0, 0\.2\);", "border-color: var(--btn-secondary-border);"),
  (r"border-color: rgba\(0, 0, 0, 0\.15\);\s*color: var\(--text-secondary\);", ""),
]

THEME_BLOCK = re.compile(
  r"\n\[data-theme='(?:light|dark)'\][^{}]*(?:total|salary|item-year|save-button|"
  r"item-action-button|record-action-button|list-delete|detail-list-item-delete|"
  r"form-button-primary|form-button-secondary|result-value\.devalued|result-value\.loss)"
  r"[^{]*\{[^}]+\}\s*",
  re.IGNORECASE,
)

ITEM_HOVER_LIGHT = re.compile(
  r"\n\[data-theme='light'\][^{}]*(?:item|record-item):hover[^{]*\{[^}]+\}\s*",
  re.IGNORECASE,
)

REDUNDANT_RESULT = re.compile(
  r"\n\[data-theme='light'\] \.inflacion-result \{\s*"
  r"background: var\(--color-danger-bg-soft\);\s*"
  r"border-color: var\(--color-danger-bg-medium\);\s*\}\s*",
)

DARK_HIGHLIGHT_REDUNDANT = re.compile(
  r"\n\[data-theme='dark'\][^{}]*(?:total|salary|item-salary)[^{]*\{\s*"
  r"color: #30D158;\s*"
  r"background: rgba\(48, 209, 88, 0\.15\);\s*"
  r"border-color: rgba\(48, 209, 88, 0\.3\);\s*\}\s*",
  re.IGNORECASE,
)

SAVE_HOVER_REDUNDANT = re.compile(
  r"\n\[data-theme='(?:light|dark)'\][^{}]*save-button:hover:not\(:disabled\)[^{]*\{[^}]+\}\s*",
  re.IGNORECASE,
)

DELETE_HOVER_LIGHT = re.compile(
  r"\n\[data-theme='light'\][^{}]*delete[^{]*:hover[^{]*\{[^}]+\}\s*",
  re.IGNORECASE,
)

DUPLICATE_YEAR_BLOCK = re.compile(
  r"(\.vehiculos-item-year \{[^}]+\}\s*"
  r"\[data-theme='light'\] \.vehiculos-item-year \{[^}]+\}\s*"
  r"\[data-theme='dark'\] \.vehiculos-item-year \{[^}]+\}\s*)"
  r"\1",
  re.DOTALL,
)


def migrate_file(path: Path) -> bool:
  if path.name == "index.css":
    return False
  text = path.read_text(encoding="utf-8")
  original = text
  for pattern, repl in BASE_REPLACEMENTS:
    if repl:
      text = re.sub(pattern, repl, text, flags=re.MULTILINE | re.IGNORECASE)
  text = THEME_BLOCK.sub("\n", text)
  text = ITEM_HOVER_LIGHT.sub("\n", text)
  text = REDUNDANT_RESULT.sub("\n", text)
  text = DARK_HIGHLIGHT_REDUNDANT.sub("\n", text)
  text = SAVE_HOVER_REDUNDANT.sub("\n", text)
  text = DELETE_HOVER_LIGHT.sub("\n", text)
  if "Vehiculos.css" in str(path):
    # Remove duplicated vehiculos-item-year block (keep first)
    parts = text.split(".vehiculos-item-year {")
    if len(parts) > 2:
      first = parts[0]
      rest = ".vehiculos-item-year {".join(parts[1:])
      # keep until second occurrence
      idx = rest.find(".vehiculos-item-year {")
      if idx != -1:
        text = first + ".vehiculos-item-year {" + rest[:idx] + rest[idx + len(".vehiculos-item-year {") :]
        # simpler: regex remove second block
  text = re.sub(r"\n{3,}", "\n\n", text)
  if text != original:
    path.write_text(text, encoding="utf-8")
    return True
  return False


def dedupe_vehiculos_year(path: Path) -> bool:
  if path.name != "Vehiculos.css":
    return False
  text = path.read_text(encoding="utf-8")
  marker = ".vehiculos-item-year {"
  first = text.find(marker)
  second = text.find(marker, first + 1)
  if second == -1:
    return False
  # find end of second block's dark override
  end_search = text.find(".vehiculos-item-details {", second)
  if end_search == -1:
    return False
  new_text = text[:second] + text[end_search:]
  path.write_text(new_text, encoding="utf-8")
  return True


def main() -> None:
  updated = 0
  for css in sorted(SRC.rglob("*.css")):
    changed = migrate_file(css)
    if dedupe_vehiculos_year(css):
      changed = True
    if changed:
      updated += 1
      print(f"  {css.relative_to(ROOT)}")
  print(f"Done: {updated} CSS files updated")


if __name__ == "__main__":
  main()
