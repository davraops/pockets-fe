#!/usr/bin/env node
/**
 * Gate debug menus — only touches menu visibility, modals, and named debug handlers.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pagesDir = path.join(__dirname, '../src/pages')

const importLine =
  "import { isDebugToolsEnabled, isDestructiveDebugEnabled } from '../utils/debugTools'"

const files = fs
  .readdirSync(pagesDir)
  .filter(f => f.endsWith('.tsx'))
  .map(f => path.join(pagesDir, f))
  .filter(file => fs.readFileSync(file, 'utf8').includes('isDebugModalOpen'))

function addImport(content) {
  if (content.includes("from '../utils/debugTools'")) return content
  const apiImport = "import { api } from '../services/api'"
  if (content.includes(apiImport)) {
    return content.replace(apiImport, `${apiImport}\n${importLine}`)
  }
  const firstImportEnd = content.indexOf('\n', content.indexOf('import '))
  return content.slice(0, firstImportEnd + 1) + importLine + '\n' + content.slice(firstImportEnd + 1)
}

function addGuard(content, pattern, guardLine) {
  return content.replace(pattern, (full, name) => {
    const fnStart = `const ${name} = async () => {`
    const idx = content.indexOf(full)
    const snippet = content.slice(idx, idx + 120)
    if (snippet.includes('if (!isDebugToolsEnabled())') || snippet.includes('if (!isDestructiveDebugEnabled())')) {
      return full
    }
    return `${fnStart}\n${guardLine}`
  })
}

let updated = 0

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8')
  const original = content

  content = addImport(content)
  content = content.replace(/\{api\.isTestUser\(\) && \(/g, '{isDebugToolsEnabled() && (')
  content = content.replace(
    /\{process\.env\.NODE_ENV === 'development' && \(/g,
    '{isDebugToolsEnabled() && ('
  )
  content = content.replace(
    /\{isDebugModalOpen && \(/g,
    '{isDebugModalOpen && isDebugToolsEnabled() && ('
  )

  content = addGuard(content, /const (handleDebug\w+) = async \(\) => \{\n/g, '    if (!isDebugToolsEnabled()) return\n')
  content = addGuard(
    content,
    /const (handleDeleteAll\w+) = async \(\) => \{\n/g,
    '    if (!isDestructiveDebugEnabled()) return\n'
  )
  content = addGuard(
    content,
    /const (handleHardDeleteAll\w+) = async \(\) => \{\n/g,
    '    if (!isDestructiveDebugEnabled()) return\n'
  )
  content = addGuard(
    content,
    /const (handleDebugDeleteAll) = async \(\) => \{\n/g,
    '    if (!isDestructiveDebugEnabled()) return\n'
  )

  if (content !== original) {
    fs.writeFileSync(file, content)
    updated++
    console.log('Updated:', path.basename(file))
  }
}

console.log(`Done. ${updated} files updated.`)
