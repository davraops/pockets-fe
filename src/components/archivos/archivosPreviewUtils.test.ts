import { describe, expect, it } from 'vitest'
import {
  canPreviewArchivo,
  getArchivoPreviewKind,
  getPreviewUnavailableMessage,
  PREVIEW_MAX_BYTES,
} from './archivosPreviewUtils'

describe('archivosPreviewUtils', () => {
  it('detects preview kinds for supported mime types', () => {
    expect(getArchivoPreviewKind('application/pdf')).toBe('pdf')
    expect(getArchivoPreviewKind('image/png')).toBe('image')
    expect(getArchivoPreviewKind('text/plain')).toBe('text')
    expect(getArchivoPreviewKind('application/msword')).toBeNull()
  })

  it('allows preview within size limit', () => {
    expect(
      canPreviewArchivo({
        mime_type: 'application/pdf',
        file_size: PREVIEW_MAX_BYTES,
      })
    ).toBe(true)
  })

  it('blocks oversized or unsupported files', () => {
    expect(
      canPreviewArchivo({
        mime_type: 'application/pdf',
        file_size: PREVIEW_MAX_BYTES + 1,
      })
    ).toBe(false)

    expect(getPreviewUnavailableMessage({
      mime_type: 'application/vnd.ms-excel',
      file_size: 1000,
    })).toMatch(/no se puede previsualizar/)
  })
})
