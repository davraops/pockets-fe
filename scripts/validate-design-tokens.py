#!/usr/bin/env python3
"""Ensure designTokens.ts documents every custom property declared in index.css."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX_CSS = ROOT / "src" / "index.css"
TOKENS_TS = ROOT / "src" / "constants" / "designTokens.ts"
GENERATED_TS = ROOT / "src" / "constants" / "tokenCatalog.generated.ts"

VAR_RE = re.compile(r"--([a-z0-9-]+)\s*:", re.IGNORECASE)
DOCUMENTED_RE = re.compile(r"name:\s*'(--[a-z0-9-]+)'", re.IGNORECASE)


def extract_css_vars(path: Path) -> set[str]:
    text = path.read_text(encoding="utf-8")
    return {f"--{m}" for m in VAR_RE.findall(text)}


def extract_documented() -> set[str]:
    documented: set[str] = set()
    for path in (TOKENS_TS, GENERATED_TS):
        if path.exists():
            documented |= set(DOCUMENTED_RE.findall(path.read_text(encoding="utf-8")))
    return documented


def main() -> int:
    css_vars = extract_css_vars(INDEX_CSS)
    documented = extract_documented()

    extra_in_catalog = sorted(documented - css_vars)
    if extra_in_catalog:
        print("Tokens in catalog but NOT in index.css:")
        for name in extra_in_catalog:
            print(f"  {name}")
        print(f"\nCSS vars: {len(css_vars)}, documented: {len(documented)}")
        return 1

    undocumented = sorted(css_vars - documented)
    if undocumented:
        print(f"FAIL: {len(undocumented)} index.css tokens not in catalog:")
        for name in undocumented[:30]:
            print(f"  {name}")
        if len(undocumented) > 30:
            print(f"  ... +{len(undocumented) - 30} more")
        print(f"\nRun: python3 scripts/sync-token-catalog-phase20.py")
        return 1

    print(f"OK: {len(documented)} tokens documented (100% of {len(css_vars)} in index.css)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
