import { describe, expect, it } from 'vitest'
import { normalizeRichText, plainToRichText, richTextToPlain } from './cuadernoRichText'

describe('normalizeRichText', () => {
  it('merges adjacent segments with identical marks', () => {
    const normalized = normalizeRichText([
      { text: 'Hola ', marks: ['bold'] },
      { text: 'mundo', marks: ['bold'] },
    ])

    expect(normalized).toEqual([{ text: 'Hola mundo', marks: ['bold'] }])
  })

  it('drops invalid internal links', () => {
    const normalized = normalizeRichText([
      {
        text: 'link',
        link: { type: 'cuaderno', noteId: 'note-1', title: 'Destino' },
      },
      {
        text: 'bad',
        link: { type: 'external', noteId: 'x' } as never,
      },
    ])

    expect(normalized[0]?.link).toEqual({
      type: 'cuaderno',
      noteId: 'note-1',
      title: 'Destino',
    })
    expect(normalized[1]?.link).toBeUndefined()
  })
})

describe('plainToRichText', () => {
  it('round-trips plain text through richTextToPlain', () => {
    const segments = plainToRichText('Contenido de prueba')
    expect(richTextToPlain(segments)).toBe('Contenido de prueba')
  })
})
