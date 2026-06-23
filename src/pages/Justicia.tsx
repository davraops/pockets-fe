import '../App.css'
import './AppPage.css'
import './Justicia.css'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DescriptionIcon from '@mui/icons-material/Description'
import type { SvgIconProps } from '@mui/material'
import { sectionColor } from '../constants/sectionColors'

interface JusticiaItem {
  id: string
  title: string
  Icon: React.ComponentType<SvgIconProps>
  color: string
  path?: string
}

const justiciaItems: JusticiaItem[] = [
  {
    id: '1',
    title: 'Procesos',
    Icon: DescriptionIcon,
    color: sectionColor.justicia,
    path: '/justicia/procesos',
  },
]

function Justicia() {
  const navigate = useNavigate()

  const handleItemClick = (item: JusticiaItem) => {
    if (item.path) {
      navigate(item.path)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, item: JusticiaItem) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleItemClick(item)
    }
  }

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide crud-page-content justicia-content">
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

        <h1 className="app-page-title">Justicia</h1>

        {/* Lista de Items */}
        {justiciaItems.length === 0 ? (
          <div className="justicia-empty-state">
            <p className="empty-state-text">No hay secciones disponibles aún.</p>
          </div>
        ) : (
          <div className="justicia-list">
            <div className="glass-group">
              {justiciaItems.map(item => {
                const IconComponent = item.Icon
                return (
                  <button
                    key={item.id}
                    className="crud-inset-row crud-row-accent-indigo"
                    onClick={() => handleItemClick(item)}
                    onKeyDown={e => handleKeyDown(e, item)}
                    aria-label={`Ir a ${item.title}`}
                    type="button"
                  >
                    <div className="crud-row-content">
                      <div className="crud-row-header">
                        <div className="crud-row-title-section">
                          <div
                            className="crud-row-icon"
                            style={{ backgroundColor: item.color }}
                            aria-hidden="true"
                          >
                            <IconComponent className="crud-row-icon-svg" />
                          </div>
                          <h3 className="crud-row-title">{item.title}</h3>
                        </div>
                        <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Justicia
