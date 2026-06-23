#!/usr/bin/env python3
"""P18: Migrate hardcoded motion transforms to tokens."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"

REPLACEMENTS: list[tuple[str, str]] = [
    ("translateY(-1px)", "translateY(var(--motion-lift-sm))"),
    ("translateY(-2px)", "translateY(var(--motion-lift-md))"),
    ("translateY(-4px)", "translateY(var(--motion-lift-lg))"),
    ("translateX(2px)", "translateX(var(--motion-shift-x))"),
    ("scale(0.95)", "scale(var(--motion-press-scale))"),
    ("scale(1.05)", "scale(var(--motion-hover-scale))"),
]

SKIP_FILES = set()


def count_literals(text: str) -> int:
    count = 0
    for literal, _ in REPLACEMENTS:
        count += text.count(literal)
    return count


def patch_file(path: Path) -> bool:
    if path.name in SKIP_FILES:
        return False
    original = path.read_text(encoding="utf-8")
    text = original
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def strip_duplicate_hovers_in_domains() -> None:
    """Remove hover transforms centralized in motion-accessibility.css."""
    targets = [
        SRC / "styles/domains/crud-card-rows.css",
        SRC / "styles/domains/crud-crypto-rows.css",
        SRC / "styles/domains/crud.css",
        SRC / "styles/ui-patterns.css",
    ]
    removals = [
        "  transform: translateY(var(--motion-lift-sm));\n",
        "  transform: translateX(var(--motion-shift-x));\n",
    ]
    for path in targets:
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        original = text
        for block in removals:
            text = text.replace(block, "")
        if text != original:
            path.write_text(text, encoding="utf-8")


def main() -> None:
    paths = sorted(SRC.rglob("*.css"))
    before = sum(count_literals(path.read_text(encoding="utf-8")) for path in paths)

    updated: list[str] = []
    for path in paths:
        if patch_file(path):
            updated.append(str(path.relative_to(ROOT)))

    strip_duplicate_hovers_in_domains()

    after = sum(count_literals(path.read_text(encoding="utf-8")) for path in paths)

    print(f"Updated {len(updated)} files:")
    for name in updated:
        print(f"  {name}")

    print(f"\nLiteral motion transforms: {before} → {after}")


if __name__ == "__main__":
    main()
