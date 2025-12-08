import '../App.css'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import BuildIcon from '@mui/icons-material/Build'
import SpaIcon from '@mui/icons-material/Spa'
import GavelIcon from '@mui/icons-material/Gavel'
import WorkIcon from '@mui/icons-material/Work'
import LogoutIcon from '@mui/icons-material/Logout'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

interface App {
  id: string
  name: string
  hasIcon: boolean
  Icon?: React.ComponentType<any>
  color: string
  path: string
}

const apps: App[] = [
  {
    id: '1',
    name: 'Finanzas',
    hasIcon: true,
    Icon: AccountBalanceIcon,
    color: '#34C759',
    path: '/finanzas',
  },
  {
    id: '2',
    name: 'Utilidades',
    hasIcon: true,
    Icon: BuildIcon,
    color: '#007AFF',
    path: '/registros',
  },
  {
    id: '3',
    name: 'Lifestyle',
    hasIcon: true,
    Icon: SpaIcon,
    color: '#FF9500',
    path: '/tiempo',
  },
  {
    id: '5',
    name: 'Justicia',
    hasIcon: true,
    Icon: GavelIcon,
    color: '#5856D6',
    path: '/justicia',
  },
  {
    id: '6',
    name: 'Trabajo',
    hasIcon: true,
    Icon: WorkIcon,
    color: '#FF9500',
    path: '/trabajo',
  },
  { id: 'logout', name: 'Salir', hasIcon: true, Icon: LogoutIcon, color: '#FF3B30', path: '' },
]

function Home() {
  const navigate = useNavigate()

  const handleAppClick = (app: App) => {
    if (app.id === 'logout') {
      api.logout()
      navigate('/login', { replace: true })
    } else {
      navigate(app.path)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, app: App) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleAppClick(app)
    }
  }

  return (
    <div className="app-container">
      <div className="glass-menu">
        <h1 className="home-title" aria-label="Aplicaciones disponibles">
          Aplicaciones
        </h1>
        <div className="apps-grid" role="grid" aria-label="Grid de aplicaciones">
          {apps.map(app => {
            const IconComponent = app.Icon
            const isLogout = app.id === 'logout'
            return (
              <button
                key={app.id}
                className={`app-icon ${isLogout ? 'app-icon-logout' : ''}`}
                style={{ '--app-color': app.color } as React.CSSProperties}
                onClick={() => handleAppClick(app)}
                onKeyDown={e => handleKeyDown(e, app)}
                aria-label={`${app.name}${isLogout ? '. Cerrar sesión' : ''}`}
                aria-describedby={app.name ? `app-name-${app.id}` : undefined}
                type="button"
              >
                <div className="app-icon-wrapper">
                  <div className="app-icon-bg" style={{ backgroundColor: app.color }}>
                    {app.hasIcon && IconComponent && (
                      <IconComponent className="app-material-icon" aria-hidden="true" />
                    )}
                  </div>
                </div>
                {app.name && (
                  <span className="app-name" id={`app-name-${app.id}`}>
                    {app.name}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Home
