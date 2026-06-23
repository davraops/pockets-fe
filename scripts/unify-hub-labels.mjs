#!/usr/bin/env node
/**
 * Unify back-button aria-labels to Utilidades / Lifestyle hub names.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pagesDir = path.join(__dirname, '../src/pages')

const importLine =
  "import { backToHubLabel } from '../constants/hubLabels'\n"

function ensureImport(content) {
  if (content.includes("from '../constants/hubLabels'")) return content
  const reactImport = content.match(/import \{[^\n]+\} from 'react'\n/)
  if (reactImport) {
    return content.replace(reactImport[0], reactImport[0] + importLine)
  }
  return importLine + content
}

function updateHubBackLabels(content) {
  if (content.includes("navigate('/registros')")) {
    content = content.replace(
      /aria-label="Volver( a Registros)?"/g,
      "aria-label={backToHubLabel('registros')}"
    )
  }
  if (content.includes("navigate('/tiempo')")) {
    content = content.replace(
      /aria-label="Volver( a Tiempo)?"/g,
      "aria-label={backToHubLabel('tiempo')}"
    )
  }
  return content
}

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'))
let changed = 0

for (const file of files) {
  const filePath = path.join(pagesDir, file)
  let content = fs.readFileSync(filePath, 'utf8')
  const original = content

  if (!content.includes("navigate('/registros')") && !content.includes("navigate('/tiempo')")) {
    continue
  }

  content = updateHubBackLabels(content)
  if (content.includes('backToHubLabel(')) {
    content = ensureImport(content)
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content)
    changed++
    console.log('Updated:', file)
  }
}

console.log(`Done. ${changed} files updated.`)
