import { api } from '../services/api'

export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'pockets-theme'

export function isValidTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light'
}

export function getStoredTheme(): Theme {
  const saved = localStorage.getItem(THEME_STORAGE_KEY)
  return isValidTheme(saved) ? saved : 'dark'
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export async function fetchUserTheme(): Promise<Theme | null> {
  if (!api.isAuthenticated()) {
    return null
  }

  try {
    const result = await api.getUserSettings()
    const theme = result?.settings?.theme
    return isValidTheme(theme) ? theme : null
  } catch (error) {
    console.warn('No se pudieron cargar las preferencias de usuario, usando localStorage:', error)
    return null
  }
}

export async function persistUserTheme(theme: Theme): Promise<void> {
  if (!api.isAuthenticated()) {
    return
  }

  try {
    await api.updateUserSettings({ theme })
  } catch (error) {
    console.warn('No se pudo guardar el tema en el servidor, usando solo localStorage:', error)
  }
}

export async function syncUserThemeFromServer(): Promise<Theme | null> {
  const serverTheme = await fetchUserTheme()
  if (serverTheme) {
    applyTheme(serverTheme)
  }
  return serverTheme
}
