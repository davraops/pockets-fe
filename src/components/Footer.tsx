import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NotificationsIcon from '@mui/icons-material/Notifications'
import ThemeToggle from './ThemeToggle'
import { api } from '../services/api'
import './Footer.css'

function Footer() {
  const [time, setTime] = useState(new Date())
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()

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

  return (
    <footer className="app-footer">
      {/* Mobile: StatusBar content integrated */}
      <div className="footer-status-mobile">
        <button
          type="button"
          className="footer-status-notification-button"
          onClick={() => navigate('/notificaciones')}
          aria-label={`Notificaciones${unreadCount > 0 ? `. ${unreadCount} no leídas` : ''}`}
        >
          <NotificationsIcon className="footer-status-notification-icon" />
          {unreadCount > 0 ? (
            <span
              className="footer-status-notification-badge"
              aria-label={`${unreadCount} notificaciones no leídas`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </button>
        <div className="footer-status-center">
          <span className="footer-status-date">{formatDate(time)}</span>
          <span className="footer-status-separator">•</span>
          <span className="footer-status-time">{formatTime(time)}</span>
        </div>
        <div className="footer-status-theme">
          <ThemeToggle />
        </div>
      </div>

      {/* Footer text */}
      <p className="footer-text">
        pockets by <strong>Rafael Avella</strong> 2025
      </p>
    </footer>
  )
}

export default Footer
