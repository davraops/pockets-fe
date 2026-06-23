#!/usr/bin/env python3
"""P9: Replace hardcoded glass borders, insets and overlays with theme tokens."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"

REPLACEMENTS: list[tuple[str, str]] = [
  # Full shadow stacks that mirror token shadows
  (
    r"box-shadow:\s*\n\s*0 4px 16px 0 rgba\(0,\s*0,\s*0,\s*0\.2\),\s*\n\s*inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.1\);",
    "box-shadow: var(--shadow-sm);",
  ),
  (
    r"box-shadow:\s*\n\s*0 6px 20px 0 rgba\(0,\s*0,\s*0,\s*0\.3\),\s*\n\s*inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.15\);",
    "box-shadow: var(--shadow-md);",
  ),
  (
    r"box-shadow:\s*\n\s*0 6px 20px 0 var\(--text-disabled\),\s*\n\s*inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.15\);",
    "box-shadow: var(--shadow-md);",
  ),
  # Inset highlights
  (r"inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.15\)", "inset 0 1px 0 var(--glass-inset-highlight-strong)"),
  (r"inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.1\)", "inset 0 1px 0 var(--glass-inset-highlight)"),
  (r"inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.08\)", "inset 0 1px 0 var(--glass-inset-highlight-subtle)"),
  (r"inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.8\)", "inset 0 1px 0 var(--glass-inset-highlight)"),
  (r"inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.9\)", "inset 0 1px 0 var(--glass-inset-highlight-strong)"),
  (r"inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.3\)", "inset 0 1px 0 var(--glass-inset-highlight-subtle)"),
  # Borders
  (r"border:\s*1px solid rgba\(255,\s*255,\s*255,\s*0\.15\)", "border: 1px solid var(--border-glass-hover)"),
  (r"border:\s*1px solid rgba\(255,\s*255,\s*255,\s*0\.1\)", "border: 1px solid var(--border-glass)"),
  (r"border-color:\s*rgba\(255,\s*255,\s*255,\s*0\.15\)", "border-color: var(--border-glass-hover)"),
  (r"border-color:\s*rgba\(255,\s*255,\s*255,\s*0\.1\)", "border-color: var(--border-glass)"),
  (r"border-top:\s*1px solid rgba\(255,\s*255,\s*255,\s*0\.1\)", "border-top: 1px solid var(--border-glass)"),
  (r"border-bottom-color:\s*rgba\(0,\s*0,\s*0,\s*0\.1\)", "border-bottom-color: var(--border-glass)"),
  (r"border-top-color:\s*rgba\(0,\s*0,\s*0,\s*0\.1\)", "border-top-color: var(--border-glass)"),
  # Surfaces
  (r"background:\s*rgba\(255,\s*255,\s*255,\s*0\.05\)", "background: var(--surface-overlay)"),
  (r"background:\s*rgba\(255,\s*255,\s*255,\s*0\.1\)", "background: var(--btn-secondary-bg)"),
  (r"background:\s*rgba\(255,\s*255,\s*255,\s*0\.15\)", "background: var(--btn-secondary-bg-hover)"),
  (r"background:\s*rgba\(0,\s*0,\s*0,\s*0\.02\)", "background: var(--detail-actions-bg)"),
  (r"background:\s*rgba\(0,\s*0,\s*0,\s*0\.05\)", "background: var(--surface-overlay)"),
  (r"background:\s*rgba\(0,\s*0,\s*0,\s*0\.06\)", "background: var(--btn-secondary-bg)"),
  (r"background:\s*rgba\(0,\s*0,\s*0,\s*0\.1\)", "background: var(--btn-secondary-bg-hover)"),
]

REDUNDANT_LIGHT = re.compile(
  r"\n\[data-theme='light'\][^{]+\{\s*"
  r"(?:"
  r"background:\s*var\(--(?:bg-glass|bg-glass-hover|btn-secondary-bg|detail-actions-bg|surface-overlay|modal-surface)\);\s*"
  r"|border(?:-top|-bottom|-left|-right)?-color:\s*var\(--border-glass(?:-hover)?\);\s*"
  r"|border-color:\s*var\(--border-glass(?:-hover)?\);\s*"
  r"|box-shadow:\s*var\(--shadow-(?:sm|md|lg)\);\s*"
  r")+\}\s*",
  re.MULTILINE,
)

SKIP = {"index.css"}


def migrate_file(path: Path) -> bool:
  if path.name in SKIP:
    return False
  text = path.read_text(encoding="utf-8")
  original = text
  for pattern, repl in REPLACEMENTS:
    text = re.sub(pattern, repl, text, flags=re.MULTILINE)
  text = REDUNDANT_LIGHT.sub("\n", text)
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
