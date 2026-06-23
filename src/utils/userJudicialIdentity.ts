import { api } from '../services/api'

export const JUDICIAL_DOCUMENT_STORAGE_KEY = 'pockets-judicial-document'

export function normalizeJudicialDocument(value: string): string {
  return value.replace(/\D/g, '')
}

export function isValidJudicialDocument(value: string): boolean {
  const digits = normalizeJudicialDocument(value)
  return digits.length >= 5 && digits.length <= 12
}

export function formatJudicialDocumentInput(value: string): string {
  return normalizeJudicialDocument(value)
}

export function getCachedJudicialDocument(): string | null {
  const cached = localStorage.getItem(JUDICIAL_DOCUMENT_STORAGE_KEY)
  const normalized = cached ? normalizeJudicialDocument(cached) : ''
  return normalized || null
}

export function setCachedJudicialDocument(document: string | null) {
  const normalized = document ? normalizeJudicialDocument(document) : ''
  if (normalized) {
    localStorage.setItem(JUDICIAL_DOCUMENT_STORAGE_KEY, normalized)
  } else {
    localStorage.removeItem(JUDICIAL_DOCUMENT_STORAGE_KEY)
  }
  window.dispatchEvent(
    new CustomEvent('pockets:user-details-updated', {
      detail: { judicialDocument: normalized || null },
    })
  )
}

function extractJudicialDocument(data: {
  user_details?: { documento_identidad?: string }
  user?: { user_details?: { documento_identidad?: string } }
}): string | null {
  const raw =
    data.user_details?.documento_identidad ?? data.user?.user_details?.documento_identidad ?? null
  if (typeof raw !== 'string') {
    return null
  }
  const normalized = normalizeJudicialDocument(raw)
  return normalized || null
}

export async function fetchUserJudicialDocument(): Promise<string | null> {
  if (!api.isAuthenticated()) {
    return getCachedJudicialDocument()
  }

  try {
    const result = await api.getUserDetails()
    const document = extractJudicialDocument(result)
    if (document) {
      setCachedJudicialDocument(document)
      return document
    }

    return getCachedJudicialDocument()
  } catch (error) {
    console.warn('No se pudo cargar el documento de identidad:', error)
    return getCachedJudicialDocument()
  }
}

export async function saveUserJudicialDocument(document: string): Promise<string | null> {
  const normalized = normalizeJudicialDocument(document)

  if (normalized && !isValidJudicialDocument(normalized)) {
    throw new Error('El documento debe tener entre 5 y 12 dígitos')
  }

  const result = await api.updateUserDetails({
    documento_identidad: normalized || undefined,
  })
  const saved = extractJudicialDocument(result) ?? (normalized || null)
  setCachedJudicialDocument(saved)
  return saved
}
