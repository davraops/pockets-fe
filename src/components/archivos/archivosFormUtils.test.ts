import { describe, expect, it } from 'vitest'
import { validateSelectedUploadFile } from './archivosFormUtils'
import { MAX_FILE_SIZE_BYTES, PRESIGNED_UPLOAD_THRESHOLD_BYTES } from './archivosTypes'

function makeFile(name: string, size: number, type = 'application/pdf'): File {
  const buffer = new ArrayBuffer(size)
  return new File([buffer], name, { type })
}

describe('validateSelectedUploadFile', () => {
  it('accepts files up to the presigned threshold with allowed mime type', () => {
    const file = makeFile('doc.pdf', PRESIGNED_UPLOAD_THRESHOLD_BYTES)
    expect(validateSelectedUploadFile(file)).toBeNull()
  })

  it('accepts large files up to 50 MB for presigned upload', () => {
    const file = makeFile('big.pdf', PRESIGNED_UPLOAD_THRESHOLD_BYTES + 1)
    expect(validateSelectedUploadFile(file)).toBeNull()
  })

  it('rejects files over 50 MB', () => {
    const file = makeFile('huge.pdf', MAX_FILE_SIZE_BYTES + 1)
    expect(validateSelectedUploadFile(file)).toMatch(/50 MB/)
  })

  it('rejects disallowed mime types', () => {
    const file = makeFile('script.sh', 100, 'application/x-sh')
    expect(validateSelectedUploadFile(file)).toMatch(/no permitido/)
  })
})
