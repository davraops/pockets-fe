#!/usr/bin/env python3
"""Repair P8 misapplication: text tokens used as background colors."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"

GLOBAL_FIXES: list[tuple[str, str]] = [
  (
    r"background: var\(--text-primary\);\s*\n\s*color: var\(--text-primary\)",
    "background: var(--modal-surface);\n  color: var(--text-primary)",
  ),
  (
    r"\.app-icon-badge-unavailable \{\s*\n\s*background: var\(--text-tertiary\)",
    ".app-icon-badge-unavailable {\n  background: var(--section-muted)",
  ),
  (r"box-shadow: 0 2px 8px var\(--text-disabled\)", "box-shadow: var(--shadow-sm)"),
  (r"box-shadow: 0 2px 8px var\(--text-tertiary\)", "box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12)"),
]

BLOCK_PROPS = {
  "background: var(--text-primary)": "background: var(--bg-glass)",
  "background: var(--text-secondary)": "background: var(--bg-glass-light)",
  "background: var(--text-tertiary)": "background: var(--surface-overlay)",
  "background: var(--text-disabled)": "background: var(--surface-overlay)",
}


def fix_light_block(match: re.Match[str]) -> str:
  block = match.group(0)
  for old, new in BLOCK_PROPS.items():
    block = block.replace(old, new)
  return block


def migrate_file(path: Path) -> bool:
  text = path.read_text(encoding="utf-8")
  original = text
  for pattern, repl in GLOBAL_FIXES:
    text = re.sub(pattern, repl, text)
  text = re.sub(r"\[data-theme='light'\][^{]+\{[^}]+\}", fix_light_block, text)
  # Remaining non-light misuse
  text = text.replace("background: var(--text-disabled)", "background: var(--surface-overlay)")
  text = text.replace("background: var(--text-tertiary)", "background: var(--surface-overlay)")
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
  print(f"Done: {updated} CSS files repaired")


if __name__ == "__main__":
  main()
