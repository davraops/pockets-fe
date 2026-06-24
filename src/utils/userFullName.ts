import { api } from '../services/api'

export const FULL_NAME_STORAGE_KEY = 'pockets-full-name'

export function isValidFullName(value: string): boolean {
  return value.trim().length > 0
}

export function getCachedFullName(): string | null {
  const cached = localStorage.getItem(FULL_NAME_STORAGE_KEY)
  return cached?.trim() ? cached.trim() : null
}

export function setCachedFullName(name: string | null) {
  if (name?.trim()) {
    localStorage.setItem(FULL_NAME_STORAGE_KEY, name.trim())
  } else {
    localStorage.removeItem(FULL_NAME_STORAGE_KEY)
  }
  window.dispatchEvent(
    new CustomEvent('pockets:user-details-updated', {
      detail: { fullName: name?.trim() || null },
    })
  )
}

function extractFullName(data: {
  user_details?: { nombre_completo?: string }
  user?: { user_details?: { nombre_completo?: string } }
}): string | null {
  const name =
    data.user_details?.nombre_completo ?? data.user?.user_details?.nombre_completo ?? null
  return typeof name === 'string' && name.trim() ? name.trim() : null
}

export async function fetchUserFullName(): Promise<string | null> {
  if (!api.isAuthenticated()) {
    return getCachedFullName()
  }

  try {
    const result = await api.getUserDetails()
    const name = extractFullName(result)
    if (name) {
      setCachedFullName(name)
      return name
    }

    return getCachedFullName()
  } catch (error) {
    console.warn('No se pudo cargar el nombre completo:', error)
    return getCachedFullName()
  }
}

export async function saveUserFullName(name: string): Promise<string> {
  const trimmed = name.trim()
  if (!isValidFullName(trimmed)) {
    throw new Error('El nombre completo no puede estar vacío')
  }

  const result = await api.updateUserDetails({ nombre_completo: trimmed })
  const saved = extractFullName(result) ?? trimmed
  setCachedFullName(saved)
  return saved
}
