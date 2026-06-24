import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import BuildIcon from '@mui/icons-material/Build'
import SpaIcon from '@mui/icons-material/Spa'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import GavelIcon from '@mui/icons-material/Gavel'
import WorkIcon from '@mui/icons-material/Work'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ThemeToggle from '../components/ThemeToggle'
import HomeDashboard from '../components/home/HomeDashboard'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { api } from '../services/api'
import { useHomeDashboard } from '../hooks/useHomeDashboard'
import './Home.css'
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

function formatTodayLine(): string {
  return new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function Home() {
  const navigate = useNavigate()
  const { confirm } = useConfirm()
  const { data: dashboardData, isRefreshing: isDashboardRefreshing, reload: reloadDashboard } =
    useHomeDashboard()
  const [displayName, setDisplayName] = useState(() => getDisplayNameFallback() ?? '')
  const [unreadCount, setUnreadCount] = useState(0)
  const [badgeStatus, setBadgeStatus] = useState<BadgeStatus>('loading')
  const [isBadgeRefreshing, setIsBadgeRefreshing] = useState(false)
  const todayLine = useMemo(() => formatTodayLine(), [])

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
    const interval = setInterval(() => {
      void loadUnreadNotifications(true)
      reloadDashboard()
    }, 30000)
    return () => clearInterval(interval)
  }, [reloadDashboard])

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
    <div className="hub-shell hub-shell-home">
      <div className="hub-card hub-card-home">
        <div className="hub-card-top-toolbar hub-home-toolbar">
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
          <button
            type="button"
            className="hub-toolbar-icon-button hub-home-logout-button"
            onClick={() => void handleLogout()}
            aria-label="Salir. Cerrar sesión"
          >
            <LogoutIcon className="hub-toolbar-icon" aria-hidden={true} />
          </button>
        </div>

        <header className="hub-card-header">
          <h1 className="hub-home-header-title">
            <span className="hub-home-header-title-brand">Pockets</span>
            <span className="hub-home-header-title-sep" aria-hidden="true">
              ·
            </span>
            <span className="hub-home-header-title-context">Inicio</span>
          </h1>
          <p className="hub-home-header-meta">
            {displayName ? (
              <>
                Hola, {displayName}
                <span aria-hidden="true"> · </span>
              </>
            ) : null}
            <span className="hub-home-header-date">{todayLine}</span>
          </p>
        </header>

        <div className="hub-home-body">
          <main className="hub-home-main">
            <HomeDashboard data={dashboardData} isRefreshing={isDashboardRefreshing} />
          </main>

          <aside className="hub-home-aside" aria-label="Aplicaciones de Pockets">
            <h2 className="hub-home-aside-title">Aplicaciones</h2>
            <nav className="hub-home-apps" aria-label="Navegación por secciones">
              <div className="glass-group">
                {launcherApps.map(app => {
                  const IconComponent = app.Icon
                  return (
                    <button
                      key={app.id}
                      type="button"
                      className="hub-home-app-row"
                      style={{ '--app-color': app.color } as React.CSSProperties}
                      onClick={() => navigate(app.path)}
                      aria-label={app.name}
                    >
                      <div className="hub-home-app-icon" aria-hidden="true">
                        <IconComponent />
                      </div>
                      <span className="hub-home-app-name">{app.name}</span>
                      <ChevronRightIcon className="hub-home-app-chevron" aria-hidden="true" />
                    </button>
                  )
                })}
              </div>
            </nav>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default Home
