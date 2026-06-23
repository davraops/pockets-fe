#!/usr/bin/env node
/**
 * Replace window.confirm() with useConfirm() across pages.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pagesDir = path.join(__dirname, '../src/pages')

function extractBalancedParens(content, openIndex) {
  if (content[openIndex] !== '(') return null

  let depth = 0
  let inString = null
  let escape = false
  let templateDepth = 0

  for (let i = openIndex; i < content.length; i++) {
    const ch = content[i]

    if (inString) {
      if (escape) {
        escape = false
        continue
      }
      if (ch === '\\') {
        escape = true
        continue
      }
      if (inString === '`' && ch === '$' && content[i + 1] === '{') {
        templateDepth++
        i++
        continue
      }
      if (inString === '`' && ch === '}' && templateDepth > 0) {
        templateDepth--
        continue
      }
      if (ch === inString) {
        inString = null
      }
      continue
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch
      continue
    }

    if (ch === '(') depth++
    if (ch === ')') {
      depth--
      if (depth === 0) {
        return {
          start: openIndex,
          end: i,
          inner: content.slice(openIndex + 1, i).trim(),
        }
      }
    }
  }

  return null
}

function isDangerMessage(messageExpr) {
  return /eliminar|irreversible|borrar|restaurar|reset|todas las|todos los/i.test(messageExpr)
}

function buildConfirmCall(messageExpr) {
  const variant = isDangerMessage(messageExpr) ? 'danger' : 'default'
  return `(await confirm({ message: ${messageExpr}, variant: '${variant}' }))`
}

function replaceWindowConfirm(content) {
  let result = ''
  let cursor = 0
  const marker = 'window.confirm'

  while (true) {
    const index = content.indexOf(marker, cursor)
    if (index === -1) {
      result += content.slice(cursor)
      break
    }

    result += content.slice(cursor, index)

    const openParen = index + marker.length
    if (content[openParen] !== '(') {
      result += marker
      cursor = index + marker.length
      continue
    }

    const parsed = extractBalancedParens(content, openParen)
    if (!parsed) {
      result += marker
      cursor = index + marker.length
      continue
    }

    const negated = index > 0 && content[index - 1] === '!'
    const confirmCall = buildConfirmCall(parsed.inner)

    if (negated) {
      result += confirmCall
      cursor = parsed.end + 1
    } else {
      result += confirmCall
      cursor = parsed.end + 1
    }
  }

  return result
}

function ensureImportsAndHook(content) {
  if (!content.includes('await confirm(')) {
    return content
  }

  if (!content.includes("from '../contexts/ConfirmContext'")) {
    if (content.includes("from '../contexts/NotificationContext'")) {
      content = content.replace(
        /import \{ useNotification \} from '\.\.\/contexts\/NotificationContext'\n/,
        "import { useNotification } from '../contexts/NotificationContext'\nimport { useConfirm } from '../contexts/ConfirmContext'\n"
      )
    } else {
      content = content.replace(
        /(import \{[^\n]+\} from 'react'\n)/,
        "$1import { useConfirm } from '../contexts/ConfirmContext'\n"
      )
    }
  }

  if (!content.includes('useConfirm()')) {
    const notificationHook =
      /const \{[^}]+\} = useNotification\(\)\n/.exec(content) ||
      /const \{ showNotification \} = useNotification\(\)\n/.exec(content)

    if (notificationHook) {
      content = content.replace(
        notificationHook[0],
        `${notificationHook[0]}  const { confirm } = useConfirm()\n`
      )
    } else {
      content = content.replace(
        /(export default function \w+\(\) \{\n|function \w+\(\) \{\n)/,
        '$1  const { confirm } = useConfirm()\n'
      )
    }
  }

  return content
}

function extractBalancedBraces(content, openIndex) {
  if (content[openIndex] !== '{') return null

  let depth = 0
  let inString = null
  let escape = false

  for (let i = openIndex; i < content.length; i++) {
    const ch = content[i]

    if (inString) {
      if (escape) {
        escape = false
        continue
      }
      if (ch === '\\') {
        escape = true
        continue
      }
      if (ch === inString) inString = null
      continue
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch
      continue
    }

    if (ch === '{') depth++
    if (ch === '}') {
      depth--
      if (depth === 0) return content.slice(openIndex, i + 1)
    }
  }

  return null
}

function ensureAsyncHandlers(content) {
  const patterns = [
    /const (\w+) = (\([^)]*\)|\(\)) => \{/g,
    /const (\w+) = async \([^)]*\) => \{/g,
  ]

  let output = content
  let match

  const arrowRegex = /const (\w+) = (async )?(\([^)]*\)|\(\)) => \{/g
  while ((match = arrowRegex.exec(content)) !== null) {
    if (match[2]) continue

    const bodyStart = match.index + match[0].length - 1
    const body = extractBalancedBraces(content, bodyStart)
    if (!body || !body.includes('await confirm(')) continue

    const replacement = `const ${match[1]} = async ${match[3]} => {`
    output = output.replace(match[0], replacement)
    arrowRegex.lastIndex = match.index + replacement.length
  }

  return output
}

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  if (!content.includes('window.confirm')) return false

  const original = content
  content = replaceWindowConfirm(content)
  content = ensureAsyncHandlers(content)
  content = ensureImportsAndHook(content)

  if (content !== original) {
    fs.writeFileSync(filePath, content)
    return true
  }
  return false
}

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'))
let changed = 0

for (const file of files) {
  if (file === 'UxReadiness.tsx') continue
  const filePath = path.join(pagesDir, file)
  if (migrateFile(filePath)) {
    changed++
    console.log('Migrated:', file)
  }
}

console.log(`Done. ${changed} files updated.`)
