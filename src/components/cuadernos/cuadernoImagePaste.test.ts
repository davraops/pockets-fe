import { describe, expect, it } from 'vitest'
import { getClipboardImageFile, isDataImageSrc } from './cuadernoImagePaste'

describe('cuadernoImagePaste', () => {
  it('detects image files in clipboard items', () => {
    const file = new File(['x'], 'photo.png', { type: 'image/png' })
    const event = {
      clipboardData: {
        items: [
          {
            kind: 'file',
            type: 'image/png',
            getAsFile: () => file,
          },
        ],
      },
    } as unknown as ClipboardEvent

    expect(getClipboardImageFile(event)).toBe(file)
  })

  it('validates data image sources', () => {
    expect(isDataImageSrc('data:image/png;base64,abc')).toBe(true)
    expect(isDataImageSrc('https://example.com/a.png')).toBe(false)
    expect(isDataImageSrc(undefined)).toBe(false)
  })
})
