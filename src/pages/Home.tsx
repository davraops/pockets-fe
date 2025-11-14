import '../App.css'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
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
  { id: '1', name: 'Finanzas', hasIcon: true, Icon: TrendingUpIcon, color: '#34C759', path: '/finanzas' },
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

  return (
    <div className="app-container">
      <div className="glass-menu">
        <div className="apps-grid">
          {apps.map((app) => {
            const IconComponent = app.Icon
            return (
              <div 
                key={app.id} 
                className="app-icon" 
                style={{ '--app-color': app.color } as React.CSSProperties}
                onClick={() => handleAppClick(app)}
              >
                <div className="app-icon-wrapper">
                  <div className="app-icon-bg" style={{ backgroundColor: app.color }}>
                    {app.hasIcon && IconComponent && (
                      <IconComponent className="app-material-icon" />
                    )}
                  </div>
                </div>
                {app.name && <span className="app-name">{app.name}</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Home
