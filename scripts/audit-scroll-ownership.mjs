#!/usr/bin/env node
/**
 * Static regression check for nested page-level scroll traps.
 * Run: npm run audit:scroll-ownership
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SCAN_DIRS = ['src/pages', 'src/styles']

const RULES = [
  {
    id: 'home-main-scroll',
    file: 'Home.css',
    forbidden: /\.hub-home-main[\s\S]*?overflow-y:\s*auto/,
    hint: 'Use a single scroll owner on .hub-home-body',
  },
  {
    id: 'home-apps-scroll',
    file: 'Home.css',
    forbidden: /\.hub-home-apps[\s\S]*?overflow-y:\s*auto/,
    hint: 'Use a single scroll owner on .hub-home-body',
  },
  {
    id: 'home-apps-max-height',
    file: 'Home.css',
    forbidden: /\.hub-home-apps[\s\S]*?max-height:\s*min\(50dvh/,
    hint: 'Remove capped launcher height on mobile',
  },
  {
    id: 'hub-aside-scroll',
    file: 'hub-dashboard.css',
    forbidden: /-hub-aside[\s\S]*?overflow-y:\s*auto/,
    hint: 'Section hub aside should scroll with the page',
  },
  {
    id: 'utilidades-aside-scroll',
    file: 'utilidades-submodule.css',
    forbidden: /\.utilidades-tool-aside[\s\S]*?overflow-y:\s*auto/,
    hint: 'Tool aside should scroll with the page',
  },
  {
    id: 'app-page-container-scroll',
    file: 'AppPage.css',
    forbidden: /\.app-page-container[\s\S]*?overflow-y:\s*auto/,
    hint: 'Let document/body own page scroll (avoid double scroller)',
  },
  {
    id: 'calculadora-history-scroll',
    file: 'Calculadora.css',
    forbidden: /\.calculadora-history-list[\s\S]*?overflow-y:\s*auto/,
    hint: 'History list should grow with page scroll',
  },
  {
    id: 'generador-history-scroll',
    file: 'GeneradorContrasenas.css',
    forbidden: /\.generador-history-list[\s\S]*?overflow-y:\s*auto/,
    hint: 'History list should grow with page scroll',
  },
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

const files = SCAN_DIRS.flatMap((rel) => walk(join(ROOT, rel)))
const violations = []

for (const rule of RULES) {
  const matchedFiles = files.filter((f) => f.endsWith(rule.file))
  for (const file of matchedFiles) {
    const content = readFileSync(file, 'utf8')
    if (rule.forbidden.test(content)) {
      violations.push({
        rule: rule.id,
        file: file.replace(`${ROOT}/`, ''),
        hint: rule.hint,
      })
    }
  }
}

if (violations.length === 0) {
  console.log('audit:scroll-ownership — OK (no known page-level scroll traps in CSS)')
  process.exit(0)
}

console.error('audit:scroll-ownership — FAIL\n')
for (const v of violations) {
  console.error(`  [${v.rule}] ${v.file}`)
  console.error(`    → ${v.hint}\n`)
}
process.exit(1)
