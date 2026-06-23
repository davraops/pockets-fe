import { api } from '../services/api'

export const DISPLAY_NAME_STORAGE_KEY = 'pockets-display-name'

export function isValidDisplayName(value: string): boolean {
  return value.trim().length > 0
}

export function getCachedDisplayName(): string | null {
  const cached = localStorage.getItem(DISPLAY_NAME_STORAGE_KEY)
  return cached?.trim() ? cached.trim() : null
}

export function setCachedDisplayName(name: string | null) {
  if (name?.trim()) {
    localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, name.trim())
  } else {
    localStorage.removeItem(DISPLAY_NAME_STORAGE_KEY)
  }
  window.dispatchEvent(
    new CustomEvent('pockets:user-details-updated', {
      detail: { displayName: name?.trim() || null },
    })
  )
}

export function clearCachedDisplayName() {
  localStorage.removeItem(DISPLAY_NAME_STORAGE_KEY)
}

export function getDisplayNameFallback(): string | null {
  return getCachedDisplayName() ?? api.getCurrentUsername()
}

function extractDisplayName(data: {
  user_details?: { nombre_usuario?: string }
  user?: { user_details?: { nombre_usuario?: string } }
}): string | null {
  const name =
    data.user_details?.nombre_usuario ?? data.user?.user_details?.nombre_usuario ?? null
  return typeof name === 'string' && name.trim() ? name.trim() : null
}

export function cacheDisplayNameFromAuthResponse(data: {
  user_details?: { nombre_usuario?: string }
  user?: { user_details?: { nombre_usuario?: string } }
}) {
  const name = extractDisplayName(data)
  if (name) {
    setCachedDisplayName(name)
  }
}

export async function fetchUserDisplayName(): Promise<string | null> {
  if (!api.isAuthenticated()) {
    return getDisplayNameFallback()
  }

  try {
    const result = await api.getUserDetails()
    const name = extractDisplayName(result)
    if (name) {
      setCachedDisplayName(name)
      return name
    }

    // Sin nombre en servidor: evitar caché obsoleta y usar username
    clearCachedDisplayName()
    return api.getCurrentUsername()
  } catch (error) {
    console.warn('No se pudieron cargar los datos del usuario:', error)
    return getDisplayNameFallback()
  }
}

export async function saveUserDisplayName(name: string): Promise<string> {
  const trimmed = name.trim()
  if (!isValidDisplayName(trimmed)) {
    throw new Error('El nombre no puede estar vacío')
  }

  const result = await api.updateUserDetails({ nombre_usuario: trimmed })
  const saved = extractDisplayName(result) ?? trimmed
  setCachedDisplayName(saved)
  return saved
}
