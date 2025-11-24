import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  message: string
  type: NotificationType
  duration?: number
}

interface NotificationContextType {
  notifications: Notification[]
  showNotification: (message: string, type?: NotificationType, duration?: number) => void
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
  removeNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const showNotification = useCallback(
    (message: string, type: NotificationType = 'info', duration: number = 5000) => {
      const id = Math.random().toString(36).substring(2, 9)
      const notification: Notification = { id, message, type, duration }

      setNotifications(prev => [...prev, notification])

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id)
        }, duration)
      }
    },
    [removeNotification]
  )

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      showNotification(message, 'success', duration)
    },
    [showNotification]
  )

  const showError = useCallback(
    (message: string, duration?: number) => {
      showNotification(message, 'error', duration || 7000) // Errores duran más
    },
    [showNotification]
  )

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      showNotification(message, 'warning', duration)
    },
    [showNotification]
  )

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      showNotification(message, 'info', duration)
    },
    [showNotification]
  )

  const value: NotificationContextType = {
    notifications,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}
