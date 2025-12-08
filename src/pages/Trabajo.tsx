import '../App.css'
import './AppPage.css'
import './Trabajo.css'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import AssignmentIcon from '@mui/icons-material/Assignment'
import WorkIcon from '@mui/icons-material/Work'
import type { SvgIconProps } from '@mui/material'

interface TrabajoItem {
  id: string
  title: string
  subtitle: string
  Icon: React.ComponentType<SvgIconProps>
  color: string
  path?: string
}

const trabajoItems: TrabajoItem[] = [
  {
    id: '1',
    title: 'Contratos',
    subtitle: 'Gestiona tus contratos laborales',
    Icon: AssignmentIcon,
    color: '#007AFF',
    path: '/trabajo/contratos',
  },
  {
    id: '2',
    title: 'Actividades',
    subtitle: 'Gestiona tus actividades de trabajo',
    Icon: WorkIcon,
    color: '#FF9500',
    path: '/trabajo/actividades',
  },
]

function Trabajo() {
  const navigate = useNavigate()

  const handleItemClick = (item: TrabajoItem) => {
    if (item.path) {
      navigate(item.path)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, item: TrabajoItem) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleItemClick(item)
    }
  }

  return (
    <div className="app-page-container">
      <div className="app-page-content trabajo-content">
        {/* Toolbar */}
        <div className="trabajo-toolbar">
          <button
            className="trabajo-toolbar-button"
            onClick={() => navigate('/')}
            aria-label="Volver"
            type="button"
          >
            <ArrowBackIcon className="trabajo-toolbar-icon" />
          </button>
        </div>

        <h1 className="trabajo-page-title">Trabajo</h1>
        <p className="trabajo-page-subtitle">Gestiona tus contratos y actividades laborales</p>

        {/* Lista de Secciones */}
        {trabajoItems.length === 0 ? (
          <div className="trabajo-empty-state">
            <p className="empty-state-text">No hay secciones disponibles aún.</p>
          </div>
        ) : (
          <div className="settings-list">
            <div className="settings-section">
              <div className="settings-section-header">Trabajo</div>
              <div className="settings-group">
                {trabajoItems.map(item => {
                  const IconComponent = item.Icon
                  return (
                    <button
                      key={item.id}
                      className="settings-row"
                      onClick={() => handleItemClick(item)}
                      onKeyDown={e => handleKeyDown(e, item)}
                      aria-label={`Ir a ${item.title}`}
                      type="button"
                    >
                      <div
                        className="settings-row-icon"
                        style={{ backgroundColor: item.color }}
                        aria-hidden="true"
                      >
                        <IconComponent />
                      </div>
                      <div className="settings-row-content">
                        <span className="settings-row-title">{item.title}</span>
                        <span className="settings-row-subtitle">{item.subtitle}</span>
                      </div>
                      <ChevronRightIcon className="settings-row-chevron" aria-hidden="true" />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Trabajo
