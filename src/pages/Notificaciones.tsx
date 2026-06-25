import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import CrudSummaryStrip from '../components/crud/CrudSummaryStrip'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import NotificationsIcon from '@mui/icons-material/Notifications'
import { api } from '../services/api'
import { devError, isDebugToolsEnabled } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import ModalOverlay from '../components/ModalOverlay'
import ListSkeleton from '../components/ListSkeleton'
import './Notificaciones.css'

interface NotificationAPI {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  priority: string
  metadata?: any
  created_at: string
  read_at?: string | null
}

function Notificaciones() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const [notifications, setNotifications] = useState<NotificationAPI[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [totalCount, setTotalCount] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  const stripStats = useMemo(() => {
    if (isLoading && notifications.length === 0) {
      return null
    }
    return {
      total: totalCount,
      unread: unreadCount,
      read: Math.max(0, totalCount - unreadCount),
    }
  }, [isLoading, notifications.length, totalCount, unreadCount])

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const filters: Record<string, string> = {}
      if (filter === 'unread') {
        filters.is_read = 'false'
      } else if (filter === 'read') {
        filters.is_read = 'true'
      }

      const response = await api.getNotifications(filters)

      if (response.notifications && Array.isArray(response.notifications)) {
        setNotifications(response.notifications)
        if (filter === 'all') {
          setTotalCount(response.notifications.length)
        }
      } else {
        setNotifications([])
        if (filter === 'all') {
          setTotalCount(0)
        }
      }

      if (response.unread_count !== undefined) {
        setUnreadCount(response.unread_count)
      } else if (response.notifications && Array.isArray(response.notifications)) {
        setUnreadCount(response.notifications.filter((n: NotificationAPI) => !n.is_read).length)
      } else {
        setUnreadCount(0)
      }
    } catch (err: unknown) {
      devError('Error al cargar notificaciones:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al cargar las notificaciones. Por favor, intenta de nuevo.'
      )
      setError(errorMessage)
      setNotifications([])
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }, [filter, showNotification])

  useEffect(() => {
    void loadNotifications()
  }, [loadNotifications])
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isMenuOpen && !target.closest('.app-toolbar-menu-container')) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const handleMarkAsRead = async (notificationId: string, isRead: boolean) => {
    try {
      await api.markNotificationRead(notificationId, isRead)
      showNotification(
        isRead ? 'Notificación marcada como leída' : 'Notificación marcada como no leída',
        'success'
      )
      await loadNotifications()
    } catch (err: unknown) {
      devError('Error al marcar notificación:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al actualizar la notificación. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead(true)
      showNotification('Todas las notificaciones han sido marcadas como leídas', 'success')
      await loadNotifications()
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al actualizar las notificaciones. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleDelete = async (notificationId: string) => {
    if (!(await confirm({ message: '¿Estás seguro de que deseas eliminar esta notificación?', variant: 'danger' }))) {
      return
    }

    try {
      await api.deleteNotification(notificationId)
      showNotification('Notificación eliminada exitosamente', 'success')
      await loadNotifications()
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar la notificación. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleDeleteAll = async () => {
    if (!(await confirm({ message: '¿Estás seguro de que deseas eliminar todas las notificaciones?', variant: 'danger' }))) {
      return
    }

    try {
      await api.deleteAllNotifications()
      showNotification('Todas las notificaciones han sido eliminadas', 'success')
      await loadNotifications()
      setIsDebugModalOpen(false)
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar las notificaciones. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleDebugCreateNotifications = async () => {
    if (!isDebugToolsEnabled()) return
    try {
      const demoNotifications = [
        {
          type: 'routine',
          title: '¡Racha en riesgo!',
          message: 'Tu racha de 5 días está en riesgo. Completa tu rutina hoy para mantenerla.',
          priority: 'high' as const,
          metadata: { routine_id: 'demo-1', streak_count: 5 },
        },
        {
          type: 'routine',
          title: '¡Felicidades! 🎉',
          message: 'Has alcanzado una racha de 7 días. ¡Sigue así!',
          priority: 'normal' as const,
          metadata: { routine_id: 'demo-2', streak_count: 7 },
        },
        {
          type: 'routine',
          title: 'Recordatorio de rutina',
          message: 'No olvides completar tu rutina de ejercicio matutino.',
          priority: 'normal' as const,
          metadata: { routine_id: 'demo-3', scheduled_time: '07:00' },
        },
        {
          type: 'budget',
          title: 'Alerta de presupuesto',
          message: 'Has usado el 80% de tu presupuesto de "Comida" este mes.',
          priority: 'high' as const,
          metadata: { budget_id: 'demo-1', percentage: 80 },
        },
        {
          type: 'budget',
          title: 'Presupuesto excedido',
          message: 'Has excedido tu presupuesto de "Entretenimiento" este mes.',
          priority: 'urgent' as const,
          metadata: { budget_id: 'demo-2', exceeded_amount: 50000 },
        },
        {
          type: 'transaction',
          title: 'Deuda próxima a vencer',
          message: 'Tu deuda "Préstamo personal" vence en 3 días.',
          priority: 'high' as const,
          metadata: { debt_id: 'demo-1', days_until_due: 3 },
        },
        {
          type: 'transaction',
          title: 'Pago de suscripción próximo',
          message: 'El pago de "Netflix" se realizará en 2 días.',
          priority: 'normal' as const,
          metadata: { subscription_id: 'demo-1', days_until_payment: 2 },
        },
        {
          type: 'transaction',
          title: 'Fecha de corte próxima',
          message: 'La fecha de corte de tu tarjeta de crédito es mañana.',
          priority: 'high' as const,
          metadata: { card_id: 'demo-1', cut_date: '2024-02-16' },
        },
        {
          type: 'general',
          title: 'Recordatorio de evento',
          message: 'Tienes un evento "Reunión de trabajo" en 1 hora.',
          priority: 'normal' as const,
          metadata: { event_id: 'demo-1', event_time: '14:00' },
        },
        {
          type: 'general',
          title: 'Alerta de precio',
          message: 'Bitcoin ha alcanzado $50,000 USD.',
          priority: 'low' as const,
          metadata: { crypto_id: 'BTC', price: 50000 },
        },
      ]

      let successCount = 0
      let errorCount = 0

      for (const notification of demoNotifications) {
        try {
          await api.createNotification(notification)
          successCount++
        } catch (err) {
          errorCount++
        }
      }

      if (successCount > 0) {
        showNotification(
          `${successCount} notificación${successCount > 1 ? 'es' : ''} creada${successCount > 1 ? 's' : ''} exitosamente`,
          'success'
        )
      }
      if (errorCount > 0) {
        showNotification(
          `No se pudieron crear ${errorCount} notificación${errorCount > 1 ? 'es' : ''}. El endpoint puede no estar disponible.`,
          'warning'
        )
      }

      await loadNotifications()
      setIsDebugModalOpen(false)
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al crear las notificaciones demo. El endpoint puede no estar disponible.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#FF3B30'
      case 'high':
        return '#FF9500'
      case 'normal':
        return '#007AFF'
      case 'low':
        return '#8E8E93'
      default:
        return '#8E8E93'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) {
      return 'Hace un momento'
    } else if (diffMins < 60) {
      return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`
    } else if (diffHours < 24) {
      return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
    } else if (diffDays < 7) {
      return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      })
    }
  }

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide crud-page-content notificaciones-content">
        {/* Toolbar */}
        <div className="app-toolbar">
          <button
            className="app-toolbar-button"
            onClick={() => navigate('/')}
            aria-label="Volver al inicio"
            type="button"
          >
            <ArrowBackIcon className="app-toolbar-icon" />
          </button>

          <div className="app-toolbar-menu-container" ref={menuRef}>
            {isDebugToolsEnabled() && (
              <>
                <button
                  className="app-toolbar-button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Opciones de depuración"
                  aria-expanded={isMenuOpen}
                  type="button"
                >
                  <MoreVertIcon className="app-toolbar-icon" />
                </button>
                {isMenuOpen && (
                  <div className="crud-dropdown-menu">
                    <button
                      className="crud-dropdown-menu-item"
                      onClick={() => {
                        setIsDebugModalOpen(true)
                        setIsMenuOpen(false)
                      }}
                      type="button"
                    >
                      <span>🐛 Debug</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <h1 className="app-page-title">Notificaciones</h1>

        <CrudSummaryStrip
          ariaLabel="Resumen de notificaciones"
          items={[
            {
              label: 'Total',
              value: stripStats === null ? '…' : stripStats.total,
              tone: 'info',
            },
            {
              label: 'No leídas',
              value: stripStats === null ? '…' : stripStats.unread,
              tone: 'expense',
            },
            {
              label: 'Leídas',
              value: stripStats === null ? '…' : stripStats.read,
              tone: 'available',
            },
          ]}
        />

        {/* Filtros */}
        <div className="notificaciones-filters">
          <button
            className={`notificaciones-filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
            type="button"
          >
            Todas
          </button>
          <button
            className={`notificaciones-filter-button ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
            type="button"
          >
            No leídas ({unreadCount})
          </button>
          <button
            className={`notificaciones-filter-button ${filter === 'read' ? 'active' : ''}`}
            onClick={() => setFilter('read')}
            type="button"
          >
            Leídas
          </button>
        </div>

        <div className="notificaciones-bulk-actions">
          <button
            type="button"
            className="btn-base btn-accent btn-block btn-submit crud-primary-cta"
            onClick={() => void handleMarkAllAsRead()}
            disabled={unreadCount === 0 || isLoading}
            aria-label="Marcar todas las notificaciones como leídas"
          >
            <CheckCircleIcon aria-hidden="true" />
            Marcar todas como leídas
          </button>
          {totalCount > 0 && (
            <button
              type="button"
              className="btn-base btn-block btn-submit notificaciones-bulk-danger-button"
              onClick={() => void handleDeleteAll()}
              disabled={isLoading}
              aria-label="Eliminar todas las notificaciones"
            >
              <DeleteIcon aria-hidden="true" />
              Eliminar todas
            </button>
          )}
        </div>

        {/* Lista de Notificaciones */}
        {isLoading && notifications.length === 0 ? (
          <div className="glass-group">
            <ListSkeleton variant="inset-row" count={5} aria-label="Cargando notificaciones" />
          </div>
        ) : error ? (
          <div className="loader-container">
            <div className="loader finanzas-stats-error-panel">
              <p className="loader-text loader-text--error" role="alert">
                {error}
              </p>
              <button
                type="button"
                className="btn-base btn-secondary finanzas-stats-retry-button"
                onClick={() => void loadNotifications()}
                aria-label="Reintentar cargar notificaciones"
              >
                <span>Reintentar</span>
              </button>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notificaciones-empty-state">
            <NotificationsIcon className="empty-state-icon" />
            <p className="empty-state-text">
              {filter === 'unread'
                ? 'No hay notificaciones no leídas'
                : filter === 'read'
                  ? 'No hay notificaciones leídas'
                  : 'No hay notificaciones'}
            </p>
            {filter === 'all' && (
              <p className="empty-state-subtext">
                Las alertas de rutinas, presupuestos y más aparecerán aquí.
              </p>
            )}
          </div>
        ) : (
          <div className="notificaciones-list">
            <div className="glass-group">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`crud-inset-row crud-row-accent-purple ${notification.is_read ? 'crud-inset-row--read' : 'crud-inset-row--unread'}`}
                >
                  <div className="crud-row-content">
                    <div className="crud-row-header">
                      <div className="crud-row-title-section">
                        <div
                          className="notificaciones-item-priority-indicator"
                          style={{ backgroundColor: getPriorityColor(notification.priority) }}
                        />
                        <h3 className="crud-row-title">{notification.title}</h3>
                      </div>
                      <div className="notificaciones-item-actions">
                        <button
                          className="notificaciones-item-action-button"
                          onClick={() => handleMarkAsRead(notification.id, !notification.is_read)}
                          aria-label={notification.is_read ? 'Marcar como no leída' : 'Marcar como leída'}
                          type="button"
                          disabled={isLoading && notifications.length === 0}
                        >
                          {notification.is_read ? (
                            <CheckCircleIcon className="notificaciones-item-action-icon" />
                          ) : (
                            <RadioButtonUncheckedIcon className="notificaciones-item-action-icon" />
                          )}
                        </button>
                        <button
                          className="notificaciones-item-action-button notificaciones-item-delete-button"
                          onClick={() => handleDelete(notification.id)}
                          aria-label="Eliminar"
                          type="button"
                          disabled={isLoading && notifications.length === 0}
                        >
                          <DeleteIcon className="notificaciones-item-action-icon" />
                        </button>
                      </div>
                    </div>
                    <p className="crud-row-preview">{notification.message}</p>
                    <div className="notificaciones-item-meta">
                      <span className="crud-row-meta">{formatDate(notification.created_at)}</span>
                      {notification.type && (
                        <span className="crud-row-meta crud-row-meta--badge">{notification.type}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal de Debug */}
        {isDebugModalOpen && isDebugToolsEnabled() && (
          <ModalOverlay onClose={() => setIsDebugModalOpen(false)} className="modal-overlay">
            <div className="modal-panel" onClick={e => e.stopPropagation()}>
              <div className="modal-panel-header">
                <h2 className="modal-panel-title" id="modal-panel-title-debug-notificaciones">Debug - Notificaciones</h2>
                <button
                  className="modal-panel-close"
                  onClick={() => setIsDebugModalOpen(false)}
                  aria-label="Cerrar modal"
                  type="button"
                >
                  ×
                </button>
              </div>

              <div className="notificaciones-detail-content">
                <div className="debug-options">
                  <button
                    className="debug-option-button create-demo"
                    onClick={handleDebugCreateNotifications}
                    disabled={isLoading}
                    type="button"
                  >
                    <span className="debug-option-icon">📦</span>
                    <div className="debug-option-info">
                      <h3 className="debug-option-title">Crear Notificaciones Demo</h3>
                      <p className="debug-option-description">
                        Crea 10 notificaciones de ejemplo con diferentes tipos y prioridades
                      </p>
                    </div>
                  </button>
                  <button
                    className="debug-option-button delete-all"
                    onClick={handleDeleteAll}
                    disabled={isLoading}
                    type="button"
                  >
                    <span className="debug-option-icon">🗑️</span>
                    <div className="debug-option-info">
                      <h3 className="debug-option-title">Eliminar Todas las Notificaciones</h3>
                      <p className="debug-option-description">
                        ⚠️ PELIGROSO: Elimina todas las notificaciones (IRREVERSIBLE)
                      </p>
                    </div>
                  </button>
                </div>

                <div className="notificaciones-modal-form-actions">
                  <button
                    type="button"
                    className="notificaciones-form-button notificaciones-form-button-secondary"
                    onClick={() => setIsDebugModalOpen(false)}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </ModalOverlay>
        )}
      </div>
    </div>
  )
}

export default Notificaciones

