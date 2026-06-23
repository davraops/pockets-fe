#!/usr/bin/env node
/**
 * Replace <div className="modal-overlay" ...> with <ModalOverlay> across pages.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pagesDir = path.join(__dirname, '../src/pages')

const importLine = "import ModalOverlay from '../components/ModalOverlay'"

function migrateModalOverlays(content) {
  if (!content.includes('modal-overlay')) {
    return content
  }

  let output = ''
  let cursor = 0
  const regex = /<div\s+className="([^"]*modal-overlay[^"]*)"\s+onClick=\{([^}]+)\}>/g
  let match

  while ((match = regex.exec(content)) !== null) {
    const [fullOpen, className, onClose] = match
    const openStart = match.index
    const openEnd = openStart + fullOpen.length

    output += content.slice(cursor, openStart)

    let depth = 1
    let pos = openEnd
    let closeEnd = -1

    while (pos < content.length && depth > 0) {
      const nextOpen = content.indexOf('<div', pos)
      const nextClose = content.indexOf('</div>', pos)

      if (nextClose === -1) break

      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth += 1
        pos = nextOpen + 4
      } else {
        depth -= 1
        if (depth === 0) {
          closeEnd = nextClose + 6
        }
        pos = nextClose + 6
      }
    }

    if (closeEnd === -1) {
      output += fullOpen
      cursor = openEnd
      regex.lastIndex = openEnd
      continue
    }

    const inner = content.slice(openEnd, closeEnd - 6)
    output += `<ModalOverlay onClose={${onClose}} className="${className}">${inner}</ModalOverlay>`
    cursor = closeEnd
    regex.lastIndex = closeEnd
  }

  output += content.slice(cursor)
  return output
}

function addCloseLabels(content) {
  return content.replace(
    /<button([^>]*className="[^"]*modal-close[^"]*"[^>]*)>\s*×\s*<\/button>/g,
    (full, attrs) => {
      if (attrs.includes('aria-label')) return full
      return `<button${attrs} aria-label="Cerrar modal">×</button>`
    }
  ).replace(
    /<button([^>]*className="[^"]*modal-panel-close[^"]*"[^>]*)>\s*×\s*<\/button>/g,
    (full, attrs) => {
      if (attrs.includes('aria-label')) return full
      return `<button${attrs} aria-label="Cerrar modal">×</button>`
    }
  )
}

function addTitleIds(content) {
  return content.replace(
    /<h2 className="modal-title">([^<]+)<\/h2>/g,
    (_full, title) => {
      const id = `modal-title-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
      return `<h2 className="modal-title" id="${id}">${title}</h2>`
    }
  ).replace(
    /<h2 className="modal-panel-title">([^<]+)<\/h2>/g,
    (_full, title) => {
      const id = `modal-panel-title-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
      return `<h2 className="modal-panel-title" id="${id}">${title}</h2>`
    }
  )
}

let updated = 0

for (const file of fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'))) {
  const filePath = path.join(pagesDir, file)
  let content = fs.readFileSync(filePath, 'utf8')
  const original = content

  if (!content.includes('modal-overlay')) continue

  if (!content.includes("from '../components/ModalOverlay'")) {
    const lastImport = content.lastIndexOf('\nimport ')
    const lineEnd = content.indexOf('\n', lastImport)
    content = content.slice(0, lineEnd + 1) + importLine + '\n' + content.slice(lineEnd + 1)
  }

  content = migrateModalOverlays(content)
  content = addCloseLabels(content)
  content = addTitleIds(content)

  if (content !== original) {
    fs.writeFileSync(filePath, content)
    updated++
    console.log('Updated:', file)
  }
}

console.log(`Done. ${updated} modal files updated.`)
