#!/usr/bin/env python3
"""P10: Migrate semantic gradients/badges to tokens and strip redundant theme blocks."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"

BASE_REPLACEMENTS: list[tuple[str, str]] = [
  (
    r"background: linear-gradient\(135deg, var\(--color-danger-bg-medium\) 0%, var\(--color-danger-bg-soft-hover\) 100%\);\s*"
    r"border: 2px solid var\(--color-danger-border-medium\);\s*"
    r"color: var\(--color-danger-solid\);",
    "background: var(--priority-high-bg);\n  border: 2px solid var(--priority-high-border);\n  color: var(--priority-high-text);",
  ),
  (
    r"background: linear-gradient\(135deg, rgba\(255, 149, 0, 0\.2\) 0%, rgba\(255, 149, 0, 0\.15\) 100%\);\s*"
    r"border: 2px solid rgba\(255, 149, 0, 0\.5\);\s*"
    r"color: #FF9500;",
    "background: var(--priority-medium-bg);\n  border: 2px solid var(--priority-medium-border);\n  color: var(--priority-medium-text);",
  ),
  (
    r"background: linear-gradient\(135deg, rgba\(52, 199, 89, 0\.2\) 0%, rgba\(48, 209, 88, 0\.15\) 100%\);\s*"
    r"border: 2px solid rgba\(52, 199, 89, 0\.5\);\s*"
    r"color: #34C759;",
    "background: var(--priority-low-bg);\n  border: 2px solid var(--priority-low-border);\n  color: var(--priority-low-text);",
  ),
  (
    r"background: linear-gradient\(135deg, rgba\(52, 199, 89, 0\.15\) 0%, rgba\(48, 209, 88, 0\.1\) 100%\);\s*"
    r"border: 1px solid rgba\(52, 199, 89, 0\.4\);",
    "background: var(--badge-success-bg);\n  border: 1px solid var(--badge-success-border);",
  ),
  (
    r"background: var\(--accent-primary\);\s*color: white;\s*font-weight: 600;\s*"
    r"box-shadow: 0 2px 4px rgba\(0, 122, 255, 0\.2\);",
    "background: var(--tab-active-bg);\n  color: var(--tab-active-text);\n  font-weight: 600;\n  box-shadow: var(--tab-active-shadow);",
  ),
  (
    r"background: #007AFF;\s*color: white;",
    "background: var(--tab-active-bg);\n  color: var(--tab-active-text);",
  ),
  (
    r"background: linear-gradient\(135deg, var\(--color-danger-bg-soft-hover\) 0%, rgba\(255, 149, 0, 0\.15\) 100%\);",
    "background: var(--alert-warning-bg);",
  ),
  (
    r"background: linear-gradient\(135deg, rgba\(52, 199, 89, 0\.4\) 0%, rgba\(0, 199, 190, 0\.4\) 100%\);",
    "background: var(--btn-success-gradient);",
  ),
  (
    r"background: linear-gradient\(135deg, rgba\(52, 199, 89, 0\.5\) 0%, rgba\(0, 199, 190, 0\.5\) 100%\);",
    "background: var(--btn-success-gradient-hover);",
  ),
  (r"border-color: rgba\(0, 0, 0, 0\.1\);", "border-color: var(--border-glass);"),
  (r"border-bottom-color: rgba\(0, 0, 0, 0\.1\);", "border-bottom-color: var(--border-glass);"),
  (r"border-top-color: rgba\(0, 0, 0, 0\.1\);", "border-top-color: var(--border-glass);"),
  (r"box-shadow: 0 0 0 3px rgba\(0, 122, 255, 0\.1\);", "box-shadow: 0 0 0 3px var(--input-focus-ring);"),
  (r"box-shadow: 0 0 0 3px rgba\(0, 122, 255, 0\.15\);", "box-shadow: 0 0 0 3px var(--input-focus-ring);"),
  (r"color: rgba\(0, 0, 0, 0\.8\);", "color: var(--text-emphasis);"),
  (r"color: #28A745;", "color: var(--color-income-text);"),
  (r"color: #28a745;", "color: var(--color-income-text);"),
  (r"color: #34C759;", "color: var(--highlight-success-text);"),
  (r"background: rgba\(0, 122, 255, 0\.12\);", "background: var(--badge-info-bg);"),
  (r"background: rgba\(0, 122, 255, 0\.15\);", "background: var(--badge-info-bg);"),
  (r"border-color: rgba\(0, 122, 255, 0\.35\);", "border-color: var(--badge-info-border);"),
  (r"border-color: rgba\(0, 122, 255, 0\.4\);", "border-color: var(--badge-info-border);"),
  (r"background: rgba\(255, 149, 0, 0\.12\);", "background: var(--badge-warning-bg);"),
  (r"background: rgba\(255, 149, 0, 0\.15\);", "background: var(--badge-warning-bg);"),
  (r"border-color: rgba\(255, 149, 0, 0\.35\);", "border-color: var(--badge-warning-border);"),
  (r"border-color: rgba\(255, 149, 0, 0\.4\);", "border-color: var(--badge-warning-border);"),
  (
    r"background: var\(--accent-primary\);\s*color: white;",
    "background: var(--btn-primary-bg);\n  color: var(--btn-primary-text);",
  ),
  (r"background: #0051D5;", "background: var(--btn-primary-hover-bg);"),
  (r"background: rgba\(255, 255, 255, 1\);", "background: var(--input-surface-focus);"),
  (r"background: var\(--bg-secondary\);", "background: var(--input-surface);"),
]

REDUNDANT_ONLY = frozenset({
  "color: var(--text-primary)",
  "color: var(--text-secondary)",
  "color: var(--text-emphasis)",
  "background: var(--bg-glass)",
  "background: var(--bg-glass-light)",
  "background: var(--bg-glass-hover)",
  "border-color: var(--border-glass)",
  "border-bottom-color: var(--border-glass)",
  "border-top-color: var(--border-glass)",
})

PRIORITY_LIGHT_PATTERNS = re.compile(
  r"\n\[data-theme='light'\][^{}]*priority[^{]+\{[^}]+\}\s*"
  r"|\n\[data-theme='light'\][^{}]*completed-badge[^{]+\{[^}]+\}\s*"
  r"|\n\[data-theme='light'\][^{}]*tab-active[^{]+\{[^}]+\}\s*"
  r"|\n\[data-theme='light'\][^{}]*total-income[^{]+\{[^}]+\}\s*"
  r"|\n\[data-theme='light'\][^{}]*salary-badge[^{]+\{[^}]+\}\s*"
  r"|\n\[data-theme='light'\][^{}]*badge-type[^{]+\{[^}]+\}\s*"
  r"|\n\[data-theme='light'\][^{}]*badge-exclusivity[^{]+\{[^}]+\}\s*"
  r"|\n\[data-theme='light'\][^{}]*inflacion-warning[^{]+\{[^}]+\}\s*"
  r"|\n\[data-theme='light'\][^{}]*form-button-primary[^{]+\{[^}]+\}\s*"
  r"|\n\[data-theme='light'\][^{}]*form-input:focus[^{]+\{[^}]+\}\s*"
  r"|\n\[data-theme='light'\][^{}]*filter-select:focus[^{]+\{[^}]+\}\s*"
  r"|\n\[data-theme='light'\][^{}]*form-button-secondary[^{]+\{[^}]+\}\s*",
  re.IGNORECASE,
)

DARK_REDUNDANT = re.compile(
  r"\n\[data-theme='dark'\][^{]+\{\s*"
  r"color: var\(--highlight-success-text\);\s*"
  r"background: var\(--highlight-success-bg\);\s*"
  r"border-color: var\(--highlight-success-border\);\s*"
  r"\}\s*"
)


def normalize_declarations(body: str) -> list[str]:
  props: list[str] = []
  for part in body.split(";"):
    part = re.sub(r"\s+", " ", part.strip())
    if part and ":" in part:
      props.append(part)
  return props


def is_redundant_block(body: str) -> bool:
  props = normalize_declarations(body)
  return bool(props) and all(p in REDUNDANT_ONLY for p in props)


def strip_redundant_theme_blocks(text: str, theme: str) -> str:
  pattern = re.compile(rf"\[data-theme='{theme}'\][^{{]+{{([^}}]+)}}", re.MULTILINE)

  def replacer(match: re.Match[str]) -> str:
    if is_redundant_block(match.group(1)):
      return ""
    return match.group(0)

  return pattern.sub(replacer, text)


def migrate_file(path: Path) -> bool:
  if path.name == "index.css":
    return False
  text = path.read_text(encoding="utf-8")
  original = text
  for pattern, repl in BASE_REPLACEMENTS:
    text = re.sub(pattern, repl, text, flags=re.MULTILINE | re.IGNORECASE)
  text = strip_redundant_theme_blocks(text, "light")
  text = strip_redundant_theme_blocks(text, "dark")
  text = PRIORITY_LIGHT_PATTERNS.sub("\n", text)
  text = DARK_REDUNDANT.sub("\n", text)
  # Collapse excessive blank lines
  text = re.sub(r"\n{3,}", "\n\n", text)
  if text != original:
    path.write_text(text, encoding="utf-8")
    return True
  return False


def main() -> None:
  updated = 0
  for css in sorted(SRC.rglob("*.css")):
    if migrate_file(css):
      updated += 1
      print(f"  {css.relative_to(ROOT)}")
  print(f"Done: {updated} CSS files updated")


if __name__ == "__main__":
  main()
