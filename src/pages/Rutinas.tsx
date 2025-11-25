import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import './AppPage.css'
import './Rutinas.css'

function Rutinas() {
  const navigate = useNavigate()

  return (
    <div className="app-page-container">
      <div className="app-page-content rutinas-content">
        {/* Toolbar - HIG: Navigation */}
        <div className="rutinas-toolbar">
          <button
            className="rutinas-toolbar-button"
            onClick={() => navigate('/tiempo')}
            aria-label="Volver a Tiempo"
            type="button"
          >
            <ArrowBackIcon className="rutinas-toolbar-icon" />
          </button>
        </div>

        <h1 className="rutinas-page-title">Rutinas</h1>
        <p className="rutinas-page-subtitle">Gestiona tus rutinas diarias</p>

        {/* Contenido pendiente de implementación */}
        <div className="rutinas-empty-state">
          <p>Contenido pendiente de implementación</p>
        </div>
      </div>
    </div>
  )
}

export default Rutinas

