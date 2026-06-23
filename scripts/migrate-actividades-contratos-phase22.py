#!/usr/bin/env python3
"""P22: Extract Actividades + Contratos shared CSS to domains; slim page CSS."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES_DIR = ROOT / "src" / "pages"
STYLES = ROOT / "src" / "styles"
DOMAINS = STYLES / "domains"

SHARED_SUFFIX_MAP: dict[str, str] = {
    "page-subtitle": "app-page-subtitle",
    "empty-state": "crud-detail-empty-state",
    "list": "crud-detail-list",
    "list-title": "crud-detail-list-title",
    "items": "crud-detail-cards",
    "item": "crud-detail-card",
    "item-header": "crud-detail-card-header",
    "item-name": "crud-detail-card-title",
    "item-actions": "crud-detail-card-actions",
    "item-action-button": "crud-detail-card-action",
    "item-action-button-danger": "crud-detail-card-action--danger",
    "item-action-button-complete": "crud-detail-card-action--complete",
    "item-action-icon": "crud-detail-card-action-icon",
    "item-content": "crud-detail-card-body",
    "item-main-info": "crud-detail-card-highlight",
    "item-info-grid": "crud-detail-info-grid",
    "item-info-item": "crud-detail-info-item",
    "item-info-icon": "crud-detail-info-icon",
    "item-info-content": "crud-detail-info-content",
    "item-info-label": "crud-detail-info-label",
    "item-info-value": "crud-detail-info-value",
    "item-additional": "crud-detail-additional",
    "item-additional-item": "crud-detail-additional-item",
    "item-additional-icon": "crud-detail-additional-icon",
    "item-additional-content": "crud-detail-additional-content",
    "item-additional-label": "crud-detail-additional-label",
    "item-additional-text": "crud-detail-additional-text",
    "modal": "crud-form-panel-shell",
    "modal-large": "crud-form-panel-shell--large",
    "form": "crud-form-panel",
    "form-section": "crud-form-panel-section",
    "form-section-title": "crud-form-panel-section-title",
    "form-actions": "crud-form-panel-actions",
    "form-button": "crud-form-panel-button",
    "form-button-primary": "crud-form-panel-button--primary",
    "form-button-secondary": "crud-form-panel-button--secondary",
    "form-button-icon": "crud-form-panel-button-icon",
    "modal-list": "crud-modal-pick-list",
    "modal-item": "crud-modal-pick-item",
    "modal-item-info": "crud-modal-pick-item-info",
    "modal-item-name": "crud-modal-pick-item-title",
    "modal-item-meta": "crud-modal-pick-item-meta",
    "modal-item-button": "crud-modal-pick-item-action",
    "modal-form-actions": "crud-modal-pick-actions",
}

ACTividades_ONLY: dict[str, str] = {
    "total-stats": "crud-highlight-panel crud-highlight-panel--stats",
    "total-stats-content": "crud-highlight-panel-content",
    "total-stats-icon": "crud-highlight-panel-icon",
    "total-stats-info": "crud-highlight-panel-info",
    "total-stats-label": "crud-highlight-panel-label",
    "total-stats-value": "crud-highlight-panel-value",
    "total-stats-details": "crud-highlight-panel-breakdown",
    "total-stats-detail": "crud-highlight-panel-breakdown-item",
    "total-stats-detail-label": "crud-highlight-panel-breakdown-label",
    "total-stats-detail-value": "crud-highlight-panel-breakdown-value",
    "priority-alta": "crud-priority-high",
    "priority-media": "crud-priority-medium",
    "priority-baja": "crud-priority-low",
    "tabs-container": "crud-segmented-tabs-container",
    "tabs": "crud-segmented-tabs",
    "tab": "crud-segmented-tab",
    "tab-active": "crud-segmented-tab--active",
    "filter": "crud-inline-filter",
    "filter-select": "crud-inline-filter-select",
    "item-status-badge": "crud-detail-status-badge",
    "item-priority-badge": "crud-detail-priority-badge",
    "item-priority-badge-icon": "crud-detail-priority-badge-icon",
    "item-date-badge": "crud-detail-date-badge",
    "item-date-icon": "crud-detail-date-icon",
    "item-date-content": "crud-detail-date-content",
    "item-date-value": "crud-detail-date-value",
    "item-date-days": "crud-detail-date-days",
    "item-completed-badge": "crud-detail-completed-badge",
    "item-completed-icon": "crud-detail-completed-icon",
    "item-completed-content": "crud-detail-completed-content",
    "item-completed-label": "crud-detail-completed-label",
    "item-completed-value": "crud-detail-completed-value",
}

CONTRATOS_ONLY: dict[str, str] = {
    "total-income": "crud-highlight-panel crud-highlight-panel--income",
    "total-income-content": "crud-highlight-panel-content",
    "total-income-icon": "crud-highlight-panel-icon",
    "total-income-info": "crud-highlight-panel-info",
    "total-income-label": "crud-highlight-panel-label",
    "total-income-value": "crud-highlight-panel-value",
    "total-income-stats": "crud-highlight-panel-breakdown",
    "total-income-stat": "crud-highlight-panel-breakdown-item",
    "total-income-stat-label": "crud-highlight-panel-breakdown-label",
    "total-income-stat-value": "crud-highlight-panel-breakdown-value",
    "item-salary-badge": "crud-detail-salary-badge",
    "item-salary-icon": "crud-detail-salary-icon",
    "item-salary-value": "crud-detail-salary-value",
    "item-badges": "crud-detail-chip-row",
    "item-badge": "crud-detail-chip",
    "item-badge-type": "crud-detail-chip--type",
    "item-badge-exclusivity": "crud-detail-chip--exclusivity",
    "item-badge-icon": "crud-detail-chip-icon",
    "form-salary-group": "crud-form-amount-row",
    "form-salary-input": "crud-form-amount-input",
    "form-currency-select": "crud-form-amount-currency",
    "form-checkbox-label": "crud-form-checkbox-label",
    "form-checkbox": "crud-form-checkbox",
}

DEBUG_CLASSES = {
    "debug-options",
    "debug-option-button",
    "debug-option-info",
    "debug-option-title",
    "debug-option-description",
}

PAGE_HOOKS = {"actividades-content", "contratos-content"}

UI_PATTERNS_CLASSES = {"app-page-subtitle"} | DEBUG_CLASSES

HIGHLIGHT_CLASSES = {
    v.split()[0] if " " in v else v
    for v in list(ACTividades_ONLY.values()) + list(CONTRATOS_ONLY.values())
}
HIGHLIGHT_CLASSES |= {
    "crud-highlight-panel",
    "crud-highlight-panel--stats",
    "crud-highlight-panel--income",
    "crud-priority-high",
    "crud-priority-medium",
    "crud-priority-low",
}

WORKSPACE_CLASSES = {
    "crud-segmented-tabs-container",
    "crud-segmented-tabs",
    "crud-segmented-tab",
    "crud-segmented-tab--active",
    "crud-inline-filter",
    "crud-inline-filter-select",
}

DETAIL_CARD_CLASSES = {
    v
    for v in SHARED_SUFFIX_MAP.values()
    if v not in UI_PATTERNS_CLASSES and not v.startswith("crud-form-panel")
    and not v.startswith("crud-modal-pick")
}
DETAIL_CARD_CLASSES |= {
  "crud-detail-status-badge",
  "crud-detail-priority-badge",
  "crud-detail-priority-badge-icon",
  "crud-detail-date-badge",
  "crud-detail-date-icon",
  "crud-detail-date-content",
  "crud-detail-date-value",
  "crud-detail-date-days",
  "crud-detail-completed-badge",
  "crud-detail-completed-icon",
  "crud-detail-completed-content",
  "crud-detail-completed-label",
  "crud-detail-completed-value",
  "crud-detail-salary-badge",
  "crud-detail-salary-icon",
  "crud-detail-salary-value",
  "crud-detail-chip-row",
  "crud-detail-chip",
  "crud-detail-chip--type",
  "crud-detail-chip--exclusivity",
  "crud-detail-chip-icon",
}

FORM_PANEL_CLASSES = {
    v
    for v in SHARED_SUFFIX_MAP.values()
    if v.startswith("crud-form-panel") or v.startswith("crud-modal-pick")
} | {
    "crud-form-amount-row",
    "crud-form-amount-input",
    "crud-form-amount-currency",
    "crud-form-checkbox-label",
    "crud-form-checkbox",
}


def build_class_map(prefix: str, extra: dict[str, str]) -> dict[str, str]:
    mapping: dict[str, str] = {f"{prefix}-content": f"{prefix}-content"}
    for suffix, target in SHARED_SUFFIX_MAP.items():
        mapping[f"{prefix}-{suffix}"] = target
    for suffix, target in extra.items():
        mapping[f"{prefix}-{suffix}"] = target
    return mapping


ACTIVIDADES_MAP = build_class_map("actividades", ACTividades_ONLY)
CONTRATOS_MAP = build_class_map("contratos", CONTRATOS_ONLY)


def used_classes_in_tsx(text: str) -> set[str]:
    classes: set[str] = set()
    for chunk in re.findall(r'className=\{`([^`]+)`\}', text):
        classes.update(chunk.split())
    for chunk in re.findall(r'className="([^"]+)"', text):
        classes.update(chunk.split())
    for chunk in re.findall(r"className=\{([^}]+)\}", text):
        classes.update(re.findall(r"['`]([a-z][\w-]*)['`]", chunk))
    return classes


def rename_selector(selector: str, class_map: dict[str, str]) -> str:
    def repl(match: re.Match[str]) -> str:
        old = match.group(1)
        if old in class_map:
            return class_map[old].replace(" ", ".")
        return old

    # Replace longest class names first
    result = selector
    for old in sorted(class_map, key=len, reverse=True):
        new = class_map[old]
        dotted = new.replace(" ", ".")
        result = re.sub(rf"\.{re.escape(old)}\b", f".{dotted}", result)
    return result


def classes_in_selector(selector: str) -> set[str]:
    return set(re.findall(r"\.([a-z][\w-]*)", selector))


def parse_css_blocks(css: str) -> list[tuple[str, str, str]]:
    """Return list of (kind, prelude, body) where kind is 'rule' or 'media'."""
    blocks: list[tuple[str, str, str]] = []
    i = 0
    n = len(css)

    while i < n:
        while i < n and css[i] in " \t\n\r":
            i += 1
        if i >= n:
            break

        if css[i] == "/" and css[i : i + 2] == "/*":
            end = css.find("*/", i + 2)
            i = end + 2 if end != -1 else n
            continue

        start = i
        brace = css.find("{", i)
        if brace == -1:
            break
        prelude = css[start:brace].strip()
        depth = 1
        j = brace + 1
        while j < n and depth:
            if css[j] == "{":
                depth += 1
            elif css[j] == "}":
                depth -= 1
            j += 1
        body = css[brace + 1 : j - 1]
        kind = "media" if prelude.startswith("@media") else "rule"
        blocks.append((kind, prelude, body))
        i = j

    return blocks


def serialize_blocks(blocks: list[tuple[str, str, str]], indent: str = "") -> str:
    parts: list[str] = []
    for kind, prelude, body in blocks:
        if kind == "media":
            inner = serialize_blocks(parse_css_blocks(body), indent + "  ")
            parts.append(f"{indent}{prelude} {{\n{inner}{indent}}}")
        else:
            parts.append(f"{indent}{prelude} {{\n{body}\n{indent}}}")
    return "\n\n".join(parts) + ("\n" if parts else "")


def filter_and_rename_blocks(
    blocks: list[tuple[str, str, str]],
    used: set[str],
    class_map: dict[str, str],
) -> list[tuple[str, str, str]]:
    kept: list[tuple[str, str, str]] = []
    for kind, prelude, body in blocks:
        if kind == "media":
            inner = filter_and_rename_blocks(parse_css_blocks(body), used, class_map)
            if inner:
                kept.append((kind, prelude, serialize_blocks(inner, "  ").strip()))
        else:
            selector_classes = classes_in_selector(prelude)
            page_classes = {c for c in selector_classes if c.startswith(("actividades-", "contratos-"))}
            if page_classes and not (page_classes & used):
                continue
            if selector_classes & DEBUG_CLASSES:
                continue
            new_prelude = rename_selector(prelude, class_map)
            kept.append((kind, new_prelude, body))
    return kept


def target_file_for_selector(prelude: str) -> str:
    classes = classes_in_selector(prelude)
    if classes & UI_PATTERNS_CLASSES:
        return "ui-patterns"
    if classes & HIGHLIGHT_CLASSES:
        return "crud-highlight-panels"
    if classes & WORKSPACE_CLASSES:
        return "crud-workspace-controls"
    if classes & FORM_PANEL_CLASSES:
        return "crud-form-panels"
    return "crud-detail-cards"


def bucket_blocks(
    blocks: list[tuple[str, str, str]],
) -> dict[str, list[tuple[str, str, str]]]:
    buckets: dict[str, list[tuple[str, str, str]]] = {
        "crud-detail-cards": [],
        "crud-highlight-panels": [],
        "crud-workspace-controls": [],
        "crud-form-panels": [],
        "ui-patterns": [],
    }
    for kind, prelude, body in blocks:
        if kind == "media":
            inner = parse_css_blocks(body)
            inner_buckets = bucket_blocks(inner)
            merged_inner: list[tuple[str, str, str]] = []
            for key, items in inner_buckets.items():
                merged_inner.extend(items)
            if merged_inner:
                buckets[target_file_for_selector(prelude)].append(
                    (kind, prelude, serialize_blocks(merged_inner, "  ").strip())
                )
            continue
        buckets[target_file_for_selector(prelude)].append((kind, prelude, body))
    return buckets


def merge_buckets(
    a: dict[str, list[tuple[str, str, str]]],
    b: dict[str, list[tuple[str, str, str]]],
) -> dict[str, list[tuple[str, str, str]]]:
    out = {k: list(v) for k, v in a.items()}
    for key, items in b.items():
        out.setdefault(key, []).extend(items)
    return out


def dedupe_blocks(blocks: list[tuple[str, str, str]]) -> list[tuple[str, str, str]]:
    seen: set[str] = set()
    out: list[tuple[str, str, str]] = []
    for kind, prelude, body in blocks:
        key = f"{kind}|{prelude}|{body.strip()}"
        if key in seen:
            continue
        seen.add(key)
        out.append((kind, prelude, body))
    return out


def replace_tsx_classes(text: str, class_map: dict[str, str]) -> str:
    for old, new in sorted(class_map.items(), key=lambda x: len(x[0]), reverse=True):
        text = text.replace(old, new)
    text = text.replace(".actividades-toolbar-menu-container", ".app-toolbar-menu-container")
    text = text.replace(".contratos-toolbar-menu-container", ".app-toolbar-menu-container")
    return text


def write_domain_file(name: str, blocks: list[tuple[str, str, str]], header: str) -> None:
    blocks = dedupe_blocks(blocks)
    if not blocks:
        return
    path = DOMAINS / f"{name}.css"
    content = f"/* {header} */\n\n{serialize_blocks(blocks)}"
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def append_ui_patterns(blocks: list[tuple[str, str, str]]) -> None:
    blocks = dedupe_blocks(blocks)
    if not blocks:
        return
    path = STYLES / "ui-patterns.css"
    text = path.read_text(encoding="utf-8")
    marker = "/* ─── Debug modal option row (shared across CRUD pages) ─── */"
    addition = serialize_blocks(blocks)
    if ".app-page-subtitle" in addition:
        subtitle_block = ""
        rest_blocks: list[tuple[str, str, str]] = []
        for b in blocks:
            if b[1].startswith(".app-page-subtitle"):
                subtitle_block = serialize_blocks([b])
            else:
                rest_blocks.append(b)
        if subtitle_block and ".app-page-subtitle" not in text:
            text = text.replace(
                marker,
                f"/* Page subtitle under app-page-title */\n{subtitle_block}\n{marker}",
            )
        blocks = rest_blocks
        addition = serialize_blocks(blocks)
    debug_chunk = addition.strip()
    if debug_chunk and ".debug-options" not in text:
        text = text.rstrip() + "\n\n/* Debug options (P22) */\n" + debug_chunk + "\n"
        path.write_text(text, encoding="utf-8")


def update_domains_index() -> None:
    path = DOMAINS / "index.css"
    text = path.read_text(encoding="utf-8")
    imports = [
        "./crud-detail-cards.css",
        "./crud-highlight-panels.css",
        "./crud-workspace-controls.css",
        "./crud-form-panels.css",
    ]
    for imp in imports:
        if imp not in text:
            text = text.rstrip() + f"\n@import '{imp}';"
    path.write_text(text.rstrip() + "\n", encoding="utf-8")


def slim_page_css(prefix: str, class_map: dict[str, str], used: set[str]) -> str:
    hook = f"{prefix}-content"
    lines = [f".{hook} {{}}", ""]
    page_only = sorted(
        c
        for c in used
        if c.startswith(f"{prefix}-")
        and class_map.get(c, c) == c
        and c != hook
        and "${" not in c
    )
    if not page_only:
        return "\n".join(lines)
    lines.append(f"/* {prefix} page-specific hooks (if any remain in TSX) */")
    for cls in page_only:
        lines.append(f".{cls} {{}}")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    all_buckets: dict[str, list[tuple[str, str, str]]] = {
        "crud-detail-cards": [],
        "crud-highlight-panels": [],
        "crud-workspace-controls": [],
        "crud-form-panels": [],
        "ui-patterns": [],
    }
    ui_blocks: list[tuple[str, str, str]] = []

    configs = [
        ("Actividades", "actividades", ACTIVIDADES_MAP),
        ("Contratos", "contratos", CONTRATOS_MAP),
    ]

    for page_name, prefix, class_map in configs:
        tsx_path = PAGES_DIR / f"{page_name}.tsx"
        css_path = PAGES_DIR / f"{page_name}.css"
        tsx = tsx_path.read_text(encoding="utf-8")
        used = used_classes_in_tsx(tsx)

        tsx_path.write_text(replace_tsx_classes(tsx, class_map), encoding="utf-8")

        raw_css = css_path.read_text(encoding="utf-8")
        blocks = parse_css_blocks(raw_css)
        renamed = filter_and_rename_blocks(blocks, used, class_map)
        buckets = bucket_blocks(renamed)
        all_buckets = merge_buckets(all_buckets, buckets)
        ui_blocks.extend(buckets.get("ui-patterns", []))

        css_path.write_text(slim_page_css(prefix, class_map, used), encoding="utf-8")
        print(f"{page_name}: TSX migrated, CSS {len(raw_css.splitlines())} → {len(css_path.read_text().splitlines())} lines")

    write_domain_file(
        "crud-detail-cards",
        all_buckets["crud-detail-cards"],
        "Expanded glass detail cards — Actividades, Contratos (P22)",
    )
    write_domain_file(
        "crud-highlight-panels",
        all_buckets["crud-highlight-panels"],
        "Hero summary panels — stats / income (P22)",
    )
    write_domain_file(
        "crud-workspace-controls",
        all_buckets["crud-workspace-controls"],
        "Segmented tabs + inline filters (P22)",
    )
    write_domain_file(
        "crud-form-panels",
        all_buckets["crud-form-panels"],
        "Glass form shells + modal pick lists (P22)",
    )
    append_ui_patterns(ui_blocks)
    update_domains_index()

    act_lines = len((PAGES_DIR / "Actividades.css").read_text().splitlines())
    con_lines = len((PAGES_DIR / "Contratos.css").read_text().splitlines())
    print(f"Page CSS residual: Actividades {act_lines} lines, Contratos {con_lines} lines")
    for name in ["crud-detail-cards", "crud-highlight-panels", "crud-workspace-controls", "crud-form-panels"]:
        p = DOMAINS / f"{name}.css"
        if p.exists():
            print(f"  domains/{name}.css: {len(p.read_text().splitlines())} lines")


if __name__ == "__main__":
    main()
