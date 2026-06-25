#!/usr/bin/env node
/**
 * Remove page-level duplicates of shared CRUD/debug/detail styles.
 * Canonical sources: ui-patterns.css, crud.css, crud-row-slots.css,
 * crud-row-overrides.css, crud-list-rows.css, crud-card-rows.css
 *
 * Run: npm run audit:dedupe-css
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const PAGES_DIR = 'src/pages'

/** @param {string} css @param {string} selectorPattern */
function stripRuleBlocks(css, selectorPattern) {
  let result = css
  let index = 0
  const re = new RegExp(`\\.${selectorPattern}\\s*\\{`)

  while (index < result.length) {
    const slice = result.slice(index)
    const match = slice.match(re)
    if (!match || match.index === undefined) break

    const start = index + match.index
    const braceStart = result.indexOf('{', start)
    if (braceStart === -1) break

    let depth = 0
    let end = braceStart
    for (let i = braceStart; i < result.length; i++) {
      if (result[i] === '{') depth++
      if (result[i] === '}') depth--
      if (depth === 0) {
        end = i + 1
        break
      }
    }

    result = result.slice(0, start) + result.slice(end)
    index = start
  }

  return result
}

/** Unscoped CRUD row structure slots (comma lists and single selectors). */
/** @param {string} css */
function stripUnscopedCrudRowBlocks(css) {
  const slot =
    '\\.crud-row-(?:value|meta(?:-indicator)?|separator|progress(?:-bar|-fill|-text)?|tag|subtitle|title(?:-section|-row)?|bottom|secondary|content|header|chevron|preview|icon(?:-svg)?)(?:--[\\w-]+)?'
  const re = new RegExp(
    `(?:^|\\n)([\\t ]*(?:${slot})(?:(?:\\s*,\\s*|\\s*,\\s*\\n[\\t ]*)(?:${slot}))*\\s*)\\{`,
    'g'
  )

  let result = css
  for (;;) {
    const match = re.exec(result)
    if (!match) break

    const start = match.index + (match[0][0] === '\n' ? 1 : 0)
    const braceStart = result.indexOf('{', start)
    if (braceStart === -1) break

    let depth = 0
    let end = braceStart
    for (let i = braceStart; i < result.length; i++) {
      if (result[i] === '{') depth++
      if (result[i] === '}') depth--
      if (depth === 0) {
        end = i + 1
        break
      }
    }

    result = result.slice(0, start) + result.slice(end)
    re.lastIndex = start
  }

  return result
}

/** @param {string} css */
function normalizeCss(css) {
  return css.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}

/** @param {string} css @param {(css: string) => string} transform */
function processPages(transform, label) {
  let changed = 0
  for (const file of readdirSync(PAGES_DIR).filter(name => name.endsWith('.css'))) {
    const path = join(PAGES_DIR, file)
    const original = readFileSync(path, 'utf8')
    const cleaned = normalizeCss(transform(original))
    if (cleaned !== original) {
      writeFileSync(path, cleaned)
      changed++
      console.log(`${label}: ${file}`)
    }
  }
  console.log(`${label} → ${changed} files\n`)
  return changed
}

processPages(css => {
  let result = css
  for (const selector of [
    'debug-options',
    'debug-option-button[^{]*',
    'debug-option-info',
    'debug-option-title',
    'debug-option-description',
    'debug-button[^{]*',
  ]) {
    result = stripRuleBlocks(result, selector)
  }
  return result
}, 'debug suite')

processPages(css => {
  let result = css
  for (const selector of [
    'proyectos-summary-block[^{]*',
    'listas-summary[^{]*',
    'listas-summary-item',
    'listas-summary-label',
    'listas-summary-value',
    'listas-summary-pending',
    'listas-summary-checked',
    'listas-summary-price',
    'listas-summary-separator',
  ]) {
    result = stripRuleBlocks(result, selector)
  }
  return result
}, 'dead summary blocks')

processPages(css => stripUnscopedCrudRowBlocks(css), 'unscoped crud-row slots')

processPages(css => stripRuleBlocks(css, 'detail-modal::before'), 'detail-modal accent bar')

processPages(css => {
  let result = css
  for (const selector of [
    'detail-action-button[^{]*',
    'detail-action-button\\.danger[^{]*',
    'detail-card[^{]*',
  ]) {
    result = stripRuleBlocks(result, selector)
  }
  return result
}, 'detail panel duplicates')

processPages(css => {
  let result = css
  for (const selector of [
    'add-transaction-button[^{]*',
    'add-account-button[^{]*',
    'add-card-button[^{]*',
    'crud-inset-row--read[^{]*',
    'crud-inset-row--unread[^{]*',
  ]) {
    result = stripRuleBlocks(result, selector)
  }
  return result
}, 'dead add-button and inset-read dupes')

processPages(css => {
  const patterns = [
    /\s*\.detail-row\s*\{[^}]*\}\s*/g,
    /\s*\.detail-label\s*\{[^}]*\}\s*/g,
    /\s*\.detail-value\s*\{[^}]*\}\s*/g,
    /\s*\.detail-actions\s*\{[^}]*\}\s*/g,
    /\s*\.detail-button\s*\{[^}]*\}\s*/g,
    /\s*\.detail-label,\s*\n\s*\.detail-value\s*\{[^}]*\}\s*/g,
    /\s*\.detail-content\s*\{\s*\n[^}]*padding:\s*var\(--spacing-lg\)\s*var\(--spacing-md\)[^}]*\}\s*/g,
    /\s*\.detail-section\s*\{\s*\n[^}]*padding-bottom:\s*var\(--spacing-md\)[^}]*\}\s*/g,
    /\s*\.detail-name\s*\{\s*\n[^}]*font-size:\s*var\(--font-size-lg\)[^}]*\}\s*/g,
    /\s*\.crud-row-tags\s*\{[^}]*\}\s*/g,
    /\s*\.crud-row-hint\s*\{[^}]*\}\s*/g,
  ]
  let result = css
  for (const pattern of patterns) {
    result = result.replace(pattern, '\n')
  }
  return result
}, 'detail mobile duplicates')
