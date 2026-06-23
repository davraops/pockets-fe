import type { ReactNode } from 'react'
import ConstructionIcon from '@mui/icons-material/Construction'
import './AppPage.css'

interface AppPageProps {
  title?: string
  icon?: ReactNode
  color?: string
}

function AppPage({ title, icon, color }: AppPageProps) {
  const pageTitle = title?.trim() || 'Página en construcción'

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-blank">
        <div className="app-page-blank-card glass-card">
          <div
            className="app-page-blank-icon"
            style={color ? { backgroundColor: color } : undefined}
            aria-hidden="true"
          >
            {icon ?? <ConstructionIcon />}
          </div>
          <h1 className="app-page-blank-title">{pageTitle}</h1>
          <p className="app-page-blank-text">
            Esta sección está reservada para una futura funcionalidad de Pockets.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AppPage
