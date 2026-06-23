import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { api } from '../services/api'
import {
  type Theme,
  getStoredTheme,
  applyTheme,
  syncUserThemeFromServer,
  persistUserTheme,
} from '../utils/userTheme'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  isDarkMode: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export { ThemeContext }

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getStoredTheme()
    applyTheme(stored)
    return stored
  })

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    applyTheme(next)
  }, [])

  useEffect(() => {
    const syncFromServer = () => {
      void syncUserThemeFromServer().then(serverTheme => {
        if (serverTheme) {
          setTheme(serverTheme)
        }
      })
    }

    if (api.isAuthenticated()) {
      syncFromServer()
    }

    window.addEventListener('pockets:auth-login', syncFromServer)
    return () => window.removeEventListener('pockets:auth-login', syncFromServer)
  }, [setTheme])

  const toggleTheme = () => {
    setThemeState(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      void persistUserTheme(next)
      return next
    })
  }

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    isDarkMode: theme === 'dark',
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
