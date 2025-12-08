import '../App.css'
import './AppPage.css'
import './Justicia.css'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DescriptionIcon from '@mui/icons-material/Description'
import type { SvgIconProps } from '@mui/material'

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
    color: '#5856D6',
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
      <div className="app-page-content justicia-content">
        {/* Toolbar */}
        <div className="justicia-toolbar">
          <button
            className="justicia-toolbar-button"
            onClick={() => navigate('/')}
            aria-label="Volver"
            type="button"
          >
            <ArrowBackIcon className="justicia-toolbar-icon" />
          </button>
        </div>

        <h1 className="justicia-page-title">Justicia</h1>
        <p className="justicia-page-subtitle">Gestiona tus asuntos legales y jurídicos</p>

        {/* Lista de Items */}
        {justiciaItems.length === 0 ? (
          <div className="justicia-empty-state">
            <p className="empty-state-text">No hay secciones disponibles aún.</p>
          </div>
        ) : (
          <div className="justicia-list">
            <div className="justicia-group">
              {justiciaItems.map(item => {
                const IconComponent = item.Icon
                return (
                  <button
                    key={item.id}
                    className="justicia-row"
                    onClick={() => handleItemClick(item)}
                    onKeyDown={e => handleKeyDown(e, item)}
                    aria-label={`Ir a ${item.title}`}
                    type="button"
                  >
                    <div className="justicia-row-content">
                      <div className="justicia-row-header">
                        <div className="justicia-row-title-section">
                          <div
                            className="justicia-row-icon"
                            style={{ backgroundColor: item.color }}
                            aria-hidden="true"
                          >
                            <IconComponent className="justicia-row-icon-svg" />
                          </div>
                          <h3 className="justicia-row-title">{item.title}</h3>
                        </div>
                        <ChevronRightIcon className="justicia-row-chevron" aria-hidden="true" />
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
