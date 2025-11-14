import '../App.css'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { useNavigate } from 'react-router-dom'

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
  { id: '2', name: '', hasIcon: false, color: '#007AFF', path: '/blank-2' },
  { id: '3', name: '', hasIcon: false, color: '#FF3B30', path: '/blank-3' },
  { id: '4', name: '', hasIcon: false, color: '#FF9500', path: '/blank-4' },
  { id: '5', name: '', hasIcon: false, color: '#5856D6', path: '/blank-5' },
  { id: '6', name: '', hasIcon: false, color: '#FFD60A', path: '/blank-6' },
  { id: '7', name: '', hasIcon: false, color: '#FF9500', path: '/blank-7' },
  { id: '8', name: '', hasIcon: false, color: '#8E8E93', path: '/blank-8' },
  { id: '9', name: '', hasIcon: false, color: '#1C1C1E', path: '/blank-9' },
  { id: '10', name: '', hasIcon: false, color: '#FF3B30', path: '/blank-10' },
  { id: '11', name: '', hasIcon: false, color: '#007AFF', path: '/blank-11' },
  { id: '12', name: '', hasIcon: false, color: '#5856D6', path: '/blank-12' },
]

function Home() {
  const navigate = useNavigate()

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
                onClick={() => navigate(app.path)}
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
