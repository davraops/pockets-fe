import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import NotificationsIcon from '@mui/icons-material/Notifications'
import ThemeToggle from './ThemeToggle'
import { api } from '../services/api'
import { getRouteTitle } from '../utils/routeTitle'
import './StatusBar.css'

function StatusBar() {
  const [time, setTime] = useState(new Date())
  const [unreadCount, setUnreadCount] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()
  const currentTitle = getRouteTitle(location.pathname)

  useEffect(() => {
    if (currentTitle && currentTitle.trim() !== '') {
      document.title = `Pockets - ${currentTitle}`
    } else if (location.pathname === '/') {
      document.title = 'Pockets'
    } else if (location.pathname === '/login') {
      document.title = 'Pockets - Iniciar Sesión'
    } else {
      document.title = 'Pockets'
    }
  }, [location.pathname, currentTitle])

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const loadUnreadNotifications = async () => {
      try {
        const response = await api.getNotifications()
        if (response.unread_count !== undefined) {
          setUnreadCount(response.unread_count)
        } else if (response.notifications && Array.isArray(response.notifications)) {
          setUnreadCount(response.notifications.filter((n: { is_read: boolean }) => !n.is_read).length)
        } else {
          setUnreadCount(0)
        }
      } catch {
        setUnreadCount(0)
      }
    }

    void loadUnreadNotifications()
    const interval = setInterval(() => void loadUnreadNotifications(), 30000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  const isHome = location.pathname === '/'
  const isLogin = location.pathname === '/login'
  const hasTitle = currentTitle && currentTitle.trim() !== ''

  if (isLogin) {
    return null
  }

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <span className="status-bar-date">{formatDate(time)}</span>
        {!isHome && hasTitle && (
          <>
            <span className="status-bar-separator">•</span>
            <span className="status-bar-title">{currentTitle}</span>
          </>
        )}
      </div>
      <div className="status-bar-right">
        <button
          className={`status-bar-notification-button ${!isHome ? 'status-bar-notification-mobile-hide' : ''}`}
          onClick={() => navigate('/notificaciones')}
          aria-label={`Notificaciones${unreadCount > 0 ? `. ${unreadCount} no leídas` : ''}`}
          type="button"
        >
          <NotificationsIcon className="status-bar-notification-icon" />
          {unreadCount > 0 && (
            <span
              className="status-bar-notification-badge"
              aria-label={`${unreadCount} notificaciones no leídas`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
        <div className="status-bar-theme-wrapper">
          <ThemeToggle />
        </div>
        <span className="status-bar-time">{formatTime(time)}</span>
      </div>
    </div>
  )
}

export default StatusBar
