#!/usr/bin/env python3
"""P8: Replace hardcoded text rgba with theme tokens and drop redundant light overrides."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"

TEXT_REPLACEMENTS: list[tuple[str, str]] = [
  # white text (dark-mode defaults) -> semantic tokens
  (r"rgba\(255,\s*255,\s*255,\s*0\.95\)", "var(--text-primary)"),
  (r"rgba\(255,\s*255,\s*255,\s*0\.9\)", "var(--text-primary)"),
  (r"rgba\(255,\s*255,\s*255,\s*0\.85\)", "var(--text-primary)"),
  (r"rgba\(255,\s*255,\s*255,\s*0\.8\)", "var(--text-secondary)"),
  (r"rgba\(255,\s*255,\s*255,\s*0\.7\)", "var(--text-secondary)"),
  (r"rgba\(255,\s*255,\s*255,\s*0\.6\)", "var(--text-secondary)"),
  (r"rgba\(255,\s*255,\s*255,\s*0\.5\)", "var(--text-tertiary)"),
  (r"rgba\(255,\s*255,\s*255,\s*0\.4\)", "var(--text-tertiary)"),
  (r"rgba\(255,\s*255,\s*255,\s*0\.3\)", "var(--text-disabled)"),
  # black text (light overrides) -> same tokens
  (r"rgba\(0,\s*0,\s*0,\s*0\.95\)", "var(--text-primary)"),
  (r"rgba\(0,\s*0,\s*0,\s*0\.9\)", "var(--text-primary)"),
  (r"rgba\(0,\s*0,\s*0,\s*0\.85\)", "var(--text-primary)"),
  (r"rgba\(0,\s*0,\s*0,\s*0\.75\)", "var(--text-secondary)"),
  (r"rgba\(0,\s*0,\s*0,\s*0\.7\)", "var(--text-secondary)"),
  (r"rgba\(0,\s*0,\s*0,\s*0\.65\)", "var(--text-secondary)"),
  (r"rgba\(0,\s*0,\s*0,\s*0\.6\)", "var(--text-secondary)"),
  (r"rgba\(0,\s*0,\s*0,\s*0\.55\)", "var(--text-secondary)"),
  (r"rgba\(0,\s*0,\s*0,\s*0\.5\)", "var(--text-tertiary)"),
  (r"rgba\(0,\s*0,\s*0,\s*0\.4\)", "var(--text-tertiary)"),
  (r"rgba\(0,\s*0,\s*0,\s*0\.3\)", "var(--text-disabled)"),
]

# Remove light blocks that only duplicate token-based colors
REDUNDANT_LIGHT_BLOCK = re.compile(
  r"\n\[data-theme='light'\][^{]+\{\s*"
  r"(?:color:\s*var\(--text-(?:primary|secondary|tertiary|disabled)\)\s*!important;\s*"
  r"|color:\s*var\(--text-(?:primary|secondary|tertiary|disabled)\);\s*"
  r"|color:\s*var\(--color-(?:income|expense|savings)-text\);\s*"
  r"|color:\s*var\(--accent-warning-text\);\s*"
  r"|padding:\s*var\(--spacing-xl\);\s*"
  r"|background:\s*var\(--bg-glass\);\s*"
  r"border-color:\s*var\(--border-glass\);\s*"
  r")+\}\s*",
  re.MULTILINE,
)

# Remove duplicate card-row light blocks (re-state same token vars)
REDUNDANT_CARD_ROW_LIGHT = re.compile(
  r"\n\[data-theme='light'\] \.crud-card-row--(?:project|subscription|debit-card|debtor)(?:,\s*\n\[data-theme='light'\] \.crud-card-row--(?:project|subscription|debit-card|debtor))*\s*\{[^}]+\}\s*"
  r"(?:\n\[data-theme='light'\] \.crud-card-row--(?:project|subscription|debit-card|debtor):hover:not\(:disabled\)(?:,\s*\n\[data-theme='light'\] \.crud-card-row--(?:project|subscription|debit-card|debtor):hover:not\(:disabled\))*\s*\{[^}]+\}\s*)?",
  re.MULTILINE,
)

SKIP_FILES = {"index.css"}


def migrate_file(path: Path) -> bool:
  if path.name in SKIP_FILES:
    return False
  text = path.read_text(encoding="utf-8")
  original = text
  for pattern, repl in TEXT_REPLACEMENTS:
    text = re.sub(pattern, repl, text)
  text = REDUNDANT_LIGHT_BLOCK.sub("\n", text)
  text = REDUNDANT_CARD_ROW_LIGHT.sub("\n", text)
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
