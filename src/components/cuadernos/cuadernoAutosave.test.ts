import { describe, expect, it } from 'vitest'
import { isCuadernoPayloadDirty } from './cuadernoAutosave'

describe('isCuadernoPayloadDirty', () => {
  it('returns false when title and content match last saved snapshot', () => {
    const snapshot = { title: 'Nota', content: '{"format":"cuaderno-blocks"}' }
    expect(isCuadernoPayloadDirty(snapshot, snapshot)).toBe(false)
  })

  it('returns true when content changed', () => {
    const lastSaved = { title: 'Nota', content: '{"v":1}' }
    const current = { title: 'Nota', content: '{"v":2}' }
    expect(isCuadernoPayloadDirty(current, lastSaved)).toBe(true)
  })
})
