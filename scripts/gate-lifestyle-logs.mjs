#!/usr/bin/env node
/**
 * Reemplaza console.error/log/warn por devError/devLog/devWarn en páginas de Lifestyle.
 */
import fs from 'node:fs'
import path from 'node:path'

const PAGES_DIR = path.join(process.cwd(), 'src/pages')

const LIFESTYLE_PAGES = ['Fechas.tsx', 'Rutinas.tsx', 'MiDiario.tsx']

const REPLACEMENTS = [
  [/console\.error/g, 'devError'],
  [/console\.log/g, 'devLog'],
  [/console\.warn/g, 'devWarn'],
]

function ensureDebugImport(content, needed) {
  const importMatch = content.match(
    /import\s*\{([^}]+)\}\s*from\s*['"]\.\.\/utils\/debugTools['"]/
  )

  if (importMatch) {
    const existing = importMatch[1].split(',').map(s => s.trim()).filter(Boolean)
    const merged = [...new Set([...existing, ...needed])].sort()
    const newImport = `import { ${merged.join(', ')} } from '../utils/debugTools'`
    return content.replace(importMatch[0], newImport)
  }

  const neededList = [...needed].sort().join(', ')
  const importLine = `import { ${neededList} } from '../utils/debugTools'\n`
  const lines = content.split('\n')
  let insertAt = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) insertAt = i + 1
  }
  lines.splice(insertAt, 0, importLine.trim())
  return lines.join('\n')
}

for (const file of LIFESTYLE_PAGES) {
  const filePath = path.join(PAGES_DIR, file)
  if (!fs.existsSync(filePath)) {
    console.log(`skip (missing): ${file}`)
    continue
  }

  let content = fs.readFileSync(filePath, 'utf8')
  const original = content

  const needed = new Set()
  if (/\bconsole\.error\b/.test(content)) needed.add('devError')
  if (/\bconsole\.log\b/.test(content)) needed.add('devLog')
  if (/\bconsole\.warn\b/.test(content)) needed.add('devWarn')

  if (needed.size === 0) {
    console.log(`skip (clean): ${file}`)
    continue
  }

  for (const [pattern, replacement] of REPLACEMENTS) {
    content = content.replace(pattern, replacement)
  }

  content = ensureDebugImport(content, [...needed])

  if (content !== original) {
    fs.writeFileSync(filePath, content)
    console.log(`updated: ${file}`)
  }
}
