#!/usr/bin/env node
/**
 * Lightweight regression check for aggressive mobile text clipping.
 * Run: node scripts/audit-mobile-css.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SCAN_DIRS = ['src/pages', 'src/styles/domains']

const patterns = [
  { name: 'white-space: nowrap', regex: /white-space:\s*nowrap/g },
  { name: 'overflow: hidden', regex: /overflow:\s*hidden/g },
]

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      walk(path, files)
    } else if (entry.endsWith('.css')) {
      files.push(path)
    }
  }
  return files
}

let totalMatches = 0

for (const rel of SCAN_DIRS) {
  const dir = join(ROOT, rel)
  for (const file of walk(dir)) {
    const content = readFileSync(file, 'utf8')
    const relFile = file.replace(`${ROOT}/`, '')
    for (const { name, regex } of patterns) {
      const matches = content.match(regex)
      if (matches?.length) {
        console.log(`${relFile}: ${matches.length} × ${name}`)
        totalMatches += matches.length
      }
    }
  }
}

console.log(`\nTotal pattern hits: ${totalMatches}`)
console.log('Review hits inside @media (max-width) blocks and card titles.')
