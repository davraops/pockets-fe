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
  let result = css
  for (const selector of [
    'cards-grid',
    'card-item',
    'card-item::before',
    'card-item:hover',
    'card-item-header',
    'card-icon',
    'card-icon\\s+svg',
    'card-info',
    'card-name',
    'card-bank',
    'card-item-body',
    'card-left-info',
    'card-number',
    'card-expiration',
    'card-subscriptions-badge',
    'card-subscriptions-badge:hover',
    'subscriptions-badge-icon',
    'subscriptions-badge-text',
    'card-type-badge',
    'card-type-text',
    'card-type-text\\.virtual',
    'card-type-text\\.fisica',
    'subscriptions-grid',
    'subscription-item',
    'subscription-item::before',
    'subscription-item:hover',
    'subscription-item-header',
    'subscription-icon',
    'subscription-icon\\s+svg',
    'subscription-info',
    'subscription-name',
    'subscription-card',
    'subscription-item-body',
    'subscription-price',
    'subscription-cut-date',
    'subscription-family-badge',
    'debtors-grid',
    'debtor-card',
    'debtor-card::before',
    'debtor-card:hover',
    'debtor-card\\.debtor-paid-off',
    'debtor-card\\.debtor-paid-off:hover',
    'debtor-card-content',
    'debtor-card-left',
    'debtor-card-right',
    'debtor-icon',
    'debtor-icon\\s+svg',
    'debtor-info',
    'debtor-name',
    'debtor-concept',
    'debtor-main-amount',
    'debtor-main-label',
    'debtor-main-value',
    'debtor-secondary-info',
    'debtor-secondary-item',
    'debtor-secondary-label',
    'debtor-secondary-value',
    'debtor-progress-container',
    'debtor-progress-bar',
    'debtor-progress-fill',
    'debtor-progress-text',
    'benefits-all-button',
    'benefits-all-button:hover',
    'benefits-all-button:active',
    'projects-grid',
    'project-item',
    'project-item::before',
    'project-item:hover',
    'project-item-header',
    'project-icon',
    'project-icon\\s+svg',
    'project-info',
    'project-name',
    'project-status',
    'project-item-body',
    'project-progress',
    'project-progress-bar',
    'project-progress-fill',
    'project-progress-text',
    'project-amounts',
    'project-amount-row',
    'project-amount-label',
    'project-amount-value',
    'project-dates',
    'project-date',
    'project-date-label',
    'accounts-grid',
    'debt-detail-progress',
    'debt-detail-progress-bar',
    'debt-detail-progress-fill',
    'debt-detail-progress-text',
    'debtor-detail-progress',
    'debtor-detail-progress-bar',
    'debtor-detail-progress-fill',
    'debtor-detail-progress-text',
    'project-detail-progress',
    'project-detail-progress-bar',
    'project-detail-progress-fill',
    'project-detail-progress-text',
    'budget-detail-progress',
    'budget-detail-progress-bar',
    'budget-detail-progress-fill',
    'budget-detail-progress-text',
    'detail-progress-row',
    'detail-progress-container',
    'detail-progress-bar',
    'detail-progress-fill',
    'detail-progress-percentage',
    'tarjetas-header',
  ]) {
    result = stripRuleBlocks(result, selector)
  }
  return result
}, 'legacy card grids')

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
