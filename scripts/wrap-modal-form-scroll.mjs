#!/usr/bin/env node
/**
 * Wraps each top-level modal-form in .modal-panel__scroll, closing before modal-actions/detail-actions.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const files = [
  'src/pages/Cuentas.tsx',
  'src/pages/Deudas.tsx',
  'src/pages/Transacciones.tsx',
  'src/pages/TarjetasCredito.tsx',
  'src/pages/TarjetasDebito.tsx',
  'src/pages/CDTs.tsx',
  'src/pages/CriptoWallet.tsx',
  'src/pages/CriptoTransacciones.tsx',
  'src/pages/Subscripciones.tsx',
  'src/pages/MeDeben.tsx',
  'src/pages/Proyectos.tsx',
  'src/pages/Presupuestos.tsx',
]

function wrapModalForms(source) {
  const formRe = /<form className="modal-form"[\s\S]*?<\/form>/g

  return source.replace(formRe, block => {
    if (block.includes('modal-panel__scroll')) {
      return block
    }

    const openMatch = block.match(/^<form className="modal-form"[^>]*>/)
    if (!openMatch) {
      return block
    }

    const openTag = openMatch[0]
    const inner = block.slice(openTag.length, block.length - '</form>'.length)

    const actionRe =
      /(\s*)<div className="(modal-actions|detail-actions)">[\s\S]*?<\/div>\s*$/
    const actionMatch = inner.match(actionRe)
    if (!actionMatch) {
      return block
    }

    const fields = inner.slice(0, actionMatch.index)
    const actions = inner.slice(actionMatch.index)

    return `${openTag}<div className="modal-panel__scroll">${fields}</div>${actions}</form>`
  })
}

let changedFiles = 0

for (const relativePath of files) {
  const filePath = path.join(root, relativePath)
  const original = fs.readFileSync(filePath, 'utf8')
  const updated = wrapModalForms(original)

  if (updated === original) {
    console.log(`no changes: ${relativePath}`)
    continue
  }

  fs.writeFileSync(filePath, updated)
  changedFiles += 1
  console.log(`updated: ${relativePath}`)
}

console.log(`\nDone. Updated ${changedFiles} file(s).`)
