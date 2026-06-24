import { describe, expect, it } from 'vitest'
import {
  CUADERNO_DOCUMENT_FORMAT,
  CUADERNO_DOCUMENT_VERSION,
  createEmptyDocument,
  documentHasContent,
  parseCuadernoContent,
  serializeDocument,
} from './cuadernoDocument'

describe('parseCuadernoContent', () => {
  it('returns an empty document for blank content', () => {
    const doc = parseCuadernoContent('   ')
    expect(doc.format).toBe(CUADERNO_DOCUMENT_FORMAT)
    expect(doc.version).toBe(CUADERNO_DOCUMENT_VERSION)
    expect(doc.blocks).toHaveLength(1)
    expect(doc.blocks[0]?.type).toBe('paragraph')
  })

  it('parses cuaderno-blocks JSON', () => {
    const source = serializeDocument({
      ...createEmptyDocument(),
      icon: '📒',
      blocks: [
        {
          id: 'block-1',
          type: 'heading_1',
          text: 'Título',
          richText: [{ text: 'Título' }],
        },
      ],
    })

    const doc = parseCuadernoContent(source)
    expect(doc.icon).toBe('📒')
    expect(doc.blocks[0]?.type).toBe('heading_1')
    expect(doc.blocks[0]?.text).toBe('Título')
  })

  it('falls back to plain text markdown-ish lines', () => {
    const doc = parseCuadernoContent('# Encabezado\n- viñeta')
    expect(doc.blocks[0]?.type).toBe('heading_1')
    expect(doc.blocks[1]?.type).toBe('bulleted_list_item')
  })
})

describe('documentHasContent', () => {
  it('detects icon-only pages as non-empty', () => {
    const doc = createEmptyDocument()
    doc.icon = '📌'
    expect(documentHasContent(doc)).toBe(true)
  })
})
