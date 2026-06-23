import '../App.css'
import './AppPage.css'
import './Trabajo.css'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import AssignmentIcon from '@mui/icons-material/Assignment'
import WorkIcon from '@mui/icons-material/Work'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import type { SvgIconProps } from '@mui/material'
import { sectionColor } from '../constants/sectionColors'

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
    color: sectionColor.blue,
    path: '/trabajo/contratos',
  },
  {
    id: '2',
    title: 'Actividades',
    subtitle: 'Gestiona tus actividades de trabajo',
    Icon: WorkIcon,
    color: sectionColor.lifestyle,
    path: '/trabajo/actividades',
  },
  {
    id: '3',
    title: 'Procesos',
    subtitle: 'Procesos de contratación abiertos',
    Icon: PersonSearchIcon,
    color: '#34C759',
    path: '/trabajo/procesos',
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
      <div className="app-page-content app-page-content-wide crud-page-content trabajo-content">
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
        </div>

        <h1 className="app-page-title">Trabajo</h1>

        {/* Lista de Secciones */}
        {trabajoItems.length === 0 ? (
          <div className="trabajo-empty-state">
            <p className="empty-state-text">No hay secciones disponibles aún.</p>
          </div>
        ) : (
          <div className="crud-hub-list">
            <div className="crud-hub-section">
              <div className="crud-hub-section-header">Trabajo</div>
              <div className="glass-group">
                {trabajoItems.map(item => {
                  const IconComponent = item.Icon
                  return (
                    <button
                      key={item.id}
                      className="crud-hub-row"
                      onClick={() => handleItemClick(item)}
                      onKeyDown={e => handleKeyDown(e, item)}
                      aria-label={`Ir a ${item.title}`}
                      type="button"
                    >
                      <div
                        className="crud-hub-row-icon"
                        style={{ backgroundColor: item.color }}
                        aria-hidden="true"
                      >
                        <IconComponent />
                      </div>
                      <div className="crud-row-content">
                        <span className="crud-row-title">{item.title}</span>
                        <span className="crud-row-subtitle">{item.subtitle}</span>
                      </div>
                      <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
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
