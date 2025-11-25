import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import './AppPage.css'
import './Fechas.css'

function Fechas() {
  const navigate = useNavigate()

  return (
    <div className="app-page-container">
      <div className="app-page-content fechas-content">
        {/* Toolbar - HIG: Navigation */}
        <div className="fechas-toolbar">
          <button
            className="fechas-toolbar-button"
            onClick={() => navigate('/tiempo')}
            aria-label="Volver a Tiempo"
            type="button"
          >
            <ArrowBackIcon className="fechas-toolbar-icon" />
          </button>
        </div>

        <h1 className="fechas-page-title">Fechas</h1>
        <p className="fechas-page-subtitle">Gestiona tus fechas importantes</p>

        {/* Contenido pendiente de implementación */}
        <div className="fechas-empty-state">
          <p>Contenido pendiente de implementación</p>
        </div>
      </div>
    </div>
  )
}

export default Fechas
