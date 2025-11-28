import '../App.css'
import './AppPage.css'
import './Tiempo.css'
import { useNavigate } from 'react-router-dom'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import RepeatIcon from '@mui/icons-material/Repeat'
import TodayIcon from '@mui/icons-material/Today'
import BookIcon from '@mui/icons-material/Book'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

function Tiempo() {
  const navigate = useNavigate()

  return (
    <div className="app-page-container">
      <div className="app-page-content tiempo-content">
        {/* Toolbar - HIG: Navigation */}
        <div className="tiempo-toolbar">
          <button
            className="tiempo-toolbar-button"
            onClick={() => navigate('/')}
            aria-label="Volver al inicio"
            type="button"
          >
            <ArrowBackIcon className="tiempo-toolbar-icon" />
          </button>
        </div>

        <h1 className="tiempo-page-title">Lifestyle</h1>
        <p className="tiempo-page-subtitle">Gestiona tus fechas y rutinas</p>

        {/* Lista de Secciones */}
        <div className="settings-list">
          {/* Sección: Fechas */}
          <div className="settings-section">
            <div className="settings-section-header">Fechas</div>
            <div className="settings-group">
              <button
                className="settings-row"
                onClick={() => navigate('/tiempo/fechas')}
                aria-label="Ir a Fechas"
                type="button"
              >
                <div
                  className="settings-row-icon"
                  style={{ backgroundColor: '#007AFF' }}
                  aria-hidden="true"
                >
                  <CalendarTodayIcon />
                </div>
                <div className="settings-row-content">
                  <span className="settings-row-title">Fechas</span>
                  <span className="settings-row-subtitle">Gestiona tus fechas importantes</span>
                </div>
                <ChevronRightIcon className="settings-row-chevron" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Sección: Rutinas */}
          <div className="settings-section">
            <div className="settings-section-header">Rutinas</div>
            <div className="settings-group">
              <button
                className="settings-row"
                onClick={() => navigate('/tiempo/mi-dia')}
                aria-label="Ir a Mi Día"
                type="button"
              >
                <div
                  className="settings-row-icon"
                  style={{ backgroundColor: '#FF9500' }}
                  aria-hidden="true"
                >
                  <TodayIcon />
                </div>
                <div className="settings-row-content">
                  <span className="settings-row-title">Mi Día</span>
                  <span className="settings-row-subtitle">Rutinas del día y la semana</span>
                </div>
                <ChevronRightIcon className="settings-row-chevron" aria-hidden="true" />
              </button>
              <button
                className="settings-row"
                onClick={() => navigate('/tiempo/rutinas')}
                aria-label="Ir a Rutinas"
                type="button"
              >
                <div
                  className="settings-row-icon"
                  style={{ backgroundColor: '#34C759' }}
                  aria-hidden="true"
                >
                  <RepeatIcon />
                </div>
                <div className="settings-row-content">
                  <span className="settings-row-title">Rutinas</span>
                  <span className="settings-row-subtitle">Gestiona tus rutinas diarias</span>
                </div>
                <ChevronRightIcon className="settings-row-chevron" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Sección: Mi Diario */}
          <div className="settings-section">
            <div className="settings-section-header">Mi Diario</div>
            <div className="settings-group">
              <button
                className="settings-row"
                onClick={() => navigate('/tiempo/mi-diario')}
                aria-label="Ir a Mi Diario"
                type="button"
              >
                <div
                  className="settings-row-icon"
                  style={{ backgroundColor: '#AF52DE' }}
                  aria-hidden="true"
                >
                  <BookIcon />
                </div>
                <div className="settings-row-content">
                  <span className="settings-row-title">Mi Diario</span>
                  <span className="settings-row-subtitle">Reflexiona sobre tus días</span>
                </div>
                <ChevronRightIcon className="settings-row-chevron" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Tiempo

