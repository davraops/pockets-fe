import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import BuildIcon from '@mui/icons-material/Build'
import SpaIcon from '@mui/icons-material/Spa'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import GavelIcon from '@mui/icons-material/Gavel'
import WorkIcon from '@mui/icons-material/Work'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import ThemeToggle from '../components/ThemeToggle'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../services/api'
import {
  fetchUserDisplayName,
  getCachedDisplayName,
  getDisplayNameFallback,
} from '../utils/userDisplayName'
import { useConfirm } from '../contexts/ConfirmContext'
import { sectionColor } from '../constants/sectionColors'

interface LauncherApp {
  id: string
  name: string
  Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  color: string
  path: string
}

const launcherApps: LauncherApp[] = [
  {
    id: 'finanzas',
    name: 'Finanzas',
    Icon: AccountBalanceIcon,
    color: sectionColor.finanzas,
    path: '/finanzas',
  },
  {
    id: 'utilidades',
    name: 'Utilidades',
    Icon: BuildIcon,
    color: sectionColor.utilidades,
    path: '/registros',
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    Icon: SpaIcon,
    color: sectionColor.lifestyle,
    path: '/tiempo',
  },
  {
    id: 'justicia',
    name: 'Justicia',
    Icon: GavelIcon,
    color: sectionColor.justicia,
    path: '/justicia',
  },
  {
    id: 'trabajo',
    name: 'Trabajo',
    Icon: WorkIcon,
    color: sectionColor.trabajo,
    path: '/trabajo',
  },
  {
    id: 'ajustes',
    name: 'Ajustes',
    Icon: SettingsIcon,
    color: sectionColor.muted,
    path: '/ajustes',
  },
]

type BadgeStatus = 'loading' | 'ready' | 'error'

function getNotificationsAriaLabel(
  unreadCount: number,
  badgeStatus: BadgeStatus,
  isBadgeRefreshing: boolean
): string {
  if (badgeStatus === 'error') {
    return 'Notificaciones. Conteo de no leídas no disponible'
  }
  if (badgeStatus === 'loading' || isBadgeRefreshing) {
    return 'Notificaciones. Actualizando conteo de no leídas'
  }
  if (unreadCount > 0) {
    return `Notificaciones. ${unreadCount} notificaciones no leídas`
  }
  return 'Notificaciones'
}

function Home() {
  const navigate = useNavigate()
  const { confirm } = useConfirm()
  const [displayName, setDisplayName] = useState(() => getDisplayNameFallback() ?? '')
  const [unreadCount, setUnreadCount] = useState(0)
  const [badgeStatus, setBadgeStatus] = useState<BadgeStatus>('loading')
  const [isBadgeRefreshing, setIsBadgeRefreshing] = useState(false)

  useEffect(() => {
    document.title = 'Pockets'
  }, [])

  useEffect(() => {
    const syncDisplayName = () => {
      void fetchUserDisplayName().then(name => {
        setDisplayName(name ?? '')
      })
    }

    const handleDisplayNameUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ displayName: string | null }>).detail
      if (detail?.displayName) {
        setDisplayName(detail.displayName)
      } else {
        setDisplayName(getCachedDisplayName() ?? api.getCurrentUsername() ?? '')
      }
    }

    syncDisplayName()
    window.addEventListener('pockets:auth-login', syncDisplayName)
    window.addEventListener('pockets:user-details-updated', handleDisplayNameUpdate)

    return () => {
      window.removeEventListener('pockets:auth-login', syncDisplayName)
      window.removeEventListener('pockets:user-details-updated', handleDisplayNameUpdate)
    }
  }, [])

  useEffect(() => {
    const loadUnreadNotifications = async (refresh = false) => {
      if (refresh) {
        setIsBadgeRefreshing(true)
      } else {
        setBadgeStatus('loading')
      }

      try {
        const response = await api.getNotifications()
        if (response.unread_count !== undefined) {
          setUnreadCount(response.unread_count)
        } else if (response.notifications && Array.isArray(response.notifications)) {
          setUnreadCount(response.notifications.filter((n: { is_read: boolean }) => !n.is_read).length)
        } else {
          setUnreadCount(0)
        }
        setBadgeStatus('ready')
      } catch {
        setUnreadCount(0)
        setBadgeStatus('error')
      } finally {
        if (refresh) {
          setIsBadgeRefreshing(false)
        }
      }
    }

    void loadUnreadNotifications()
    const interval = setInterval(() => void loadUnreadNotifications(true), 30000)
    return () => clearInterval(interval)
  }, [])

  const handleAppClick = (app: LauncherApp) => {
    navigate(app.path)
  }

  const handleLogout = async () => {
    if (
      !(await confirm({
        message: '¿Cerrar sesión en Pockets?',
        confirmLabel: 'Salir',
        cancelLabel: 'Cancelar',
      }))
    ) {
      return
    }
    api.logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="hub-shell">
      <div className="hub-card">
        <div className="hub-card-top-toolbar">
          <ThemeToggle />
          <button
            type="button"
            className="hub-toolbar-icon-button"
            onClick={() => navigate('/notificaciones')}
            aria-label={getNotificationsAriaLabel(unreadCount, badgeStatus, isBadgeRefreshing)}
          >
            <span className="hub-toolbar-icon-wrapper">
              <NotificationsActiveIcon className="hub-toolbar-icon" aria-hidden={true} />
              {(badgeStatus === 'loading' || isBadgeRefreshing) && (
                <span className="app-icon-badge app-icon-badge-loading" aria-hidden="true" />
              )}
              {badgeStatus === 'ready' && unreadCount > 0 && !isBadgeRefreshing && (
                <span className="app-icon-badge" aria-hidden="true">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              {badgeStatus === 'error' && !isBadgeRefreshing && (
                <span className="app-icon-badge app-icon-badge-unavailable" aria-hidden="true" />
              )}
            </span>
          </button>
        </div>

        <header className="hub-card-header">
          <h1 className="auth-card-title">
            <span className="auth-card-title-brand">Pockets</span>
            <span className="auth-card-title-sep" aria-hidden="true">
              —
            </span>
            Aplicaciones
          </h1>
          {displayName && <p className="hub-greeting">Hola, {displayName}</p>}
        </header>

        <div className="hub-card-scroll">
          <nav className="hub-launcher-grid" aria-label="Aplicaciones de Pockets">
            {launcherApps.map(app => {
              const IconComponent = app.Icon
              return (
                <button
                  key={app.id}
                  className="app-icon"
                  style={{ '--app-color': app.color } as React.CSSProperties}
                  onClick={() => handleAppClick(app)}
                  aria-label={app.name}
                  type="button"
                >
                  <div className="app-icon-wrapper">
                    <div className="app-icon-bg">
                      <IconComponent className="app-material-icon" aria-hidden={true} />
                    </div>
                  </div>
                  <span className="app-name">{app.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <footer className="hub-card-footer">
          <button
            type="button"
            className="btn-base btn-secondary btn-block hub-logout-button"
            onClick={() => void handleLogout()}
            aria-label="Salir. Cerrar sesión"
          >
            <LogoutIcon aria-hidden={true} />
            Salir
          </button>
        </footer>
      </div>
    </div>
  )
}

export default Home
