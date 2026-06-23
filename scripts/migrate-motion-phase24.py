#!/usr/bin/env python3
"""P24: Migrate dropdown -8px and FAB scale(1.1) literals to motion tokens."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"

REPLACEMENTS: list[tuple[str, str]] = [
    ("translateY(-8px)", "translateY(var(--motion-dropdown-shift))"),
    ("scale(1.1)", "scale(var(--motion-fab-scale))"),
]

LITERALS = [old for old, _ in REPLACEMENTS]


def count_literals(text: str) -> int:
    return sum(text.count(literal) for literal in LITERALS)


def patch_file(path: Path) -> bool:
    original = path.read_text(encoding="utf-8")
    text = original
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> None:
    paths = sorted(SRC.rglob("*.css"))
    before = sum(count_literals(path.read_text(encoding="utf-8")) for path in paths)

    updated: list[str] = []
    for path in paths:
        if patch_file(path):
            updated.append(str(path.relative_to(ROOT)))

    after = sum(count_literals(path.read_text(encoding="utf-8")) for path in paths)

    print(f"Updated {len(updated)} files:")
    for name in updated:
        print(f"  {name}")
    print(f"Literals remaining: {before}→{after}")


if __name__ == "__main__":
    main()
