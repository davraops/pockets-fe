import { useNotification } from '../contexts/NotificationContext'
import './NotificationContainer.css'

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotification()

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="notification-container" aria-live="polite" aria-atomic="true">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
          role="alert"
        >
          <div className="notification-content">
            <span className="notification-message">{notification.message}</span>
            <button
              className="notification-close"
              onClick={() => removeNotification(notification.id)}
              aria-label="Cerrar notificación"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
