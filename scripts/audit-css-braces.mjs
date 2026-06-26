#!/usr/bin/env node
/**
 * Fail if any CSS file under src/ has unbalanced braces.
 * Run: node scripts/audit-css-braces.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(new URL('..', import.meta.url).pathname, 'src')

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) walk(path, files)
    else if (entry.endsWith('.css')) files.push(path)
  }
  return files
}

const violations = []

for (const file of walk(ROOT)) {
  const content = readFileSync(file, 'utf8')
  let depth = 0
  for (const ch of content) {
    if (ch === '{') depth++
    if (ch === '}') depth--
    if (depth < 0) {
      violations.push({ file, reason: 'extra closing brace' })
      break
    }
  }
  if (depth > 0) violations.push({ file, reason: `missing ${depth} closing brace(s)` })
}

if (violations.length === 0) {
  console.log('audit:css-braces — OK')
  process.exit(0)
}

console.error('audit:css-braces — FAIL\n')
for (const v of violations) {
  console.error(`  ${v.file.replace(`${ROOT}/`, 'src/')}: ${v.reason}`)
}
process.exit(1)
