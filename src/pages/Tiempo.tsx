import './AppPage.css'
import './Tiempo.css'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SyncIcon from '@mui/icons-material/Sync'
import ListSkeleton from '../components/ListSkeleton'
import TiempoHubDashboard from '../components/tiempo/TiempoHubDashboard'
import TiempoHubModules from '../components/tiempo/TiempoHubModules'
import { useTiempoHubStats } from '../hooks/useTiempoHubStats'

function Tiempo() {
  const navigate = useNavigate()
  const { isLoading, loadError, data, stats, completingRoutineId, completeRoutine, loadStats } =
    useTiempoHubStats()

  const todayLabel = useMemo(() => {
    const label = new Date().toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    return label.charAt(0).toUpperCase() + label.slice(1)
  }, [])

  const unavailable = Boolean(loadError)

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide tiempo-hub-content">
        <header className="tiempo-hub-header">
          <div className="tiempo-hub-toolbar">
            <button
              className="app-toolbar-button"
              onClick={() => navigate('/')}
              aria-label="Volver al inicio"
              type="button"
            >
              <ArrowBackIcon className="app-toolbar-icon" />
            </button>
            <button
              type="button"
              className="app-toolbar-button tiempo-hub-sync"
              onClick={() => void loadStats()}
              aria-label="Actualizar resumen de Lifestyle"
              disabled={isLoading}
            >
              <SyncIcon className="app-toolbar-icon" aria-hidden="true" />
            </button>
          </div>
          <div className="tiempo-hub-heading">
            <h1 className="tiempo-hub-title">
              <span className="tiempo-hub-title-brand">Lifestyle</span>
              <span className="tiempo-hub-title-sep" aria-hidden="true">
                ·
              </span>
              <span className="tiempo-hub-title-context">Resumen</span>
            </h1>
            <p className="tiempo-hub-meta">{todayLabel}</p>
          </div>
        </header>

        {loadError ? (
          <div className="loader-container">
            <div className="loader tiempo-stats-error-panel">
              <p className="tiempo-stats-error" role="alert">
                {loadError}
              </p>
              <button
                type="button"
                className="btn-base btn-secondary btn-retry"
                onClick={() => void loadStats()}
                aria-label="Reintentar cargar estadísticas"
              >
                <SyncIcon aria-hidden="true" />
                <span>Reintentar</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="tiempo-hub-body">
            <main className="tiempo-hub-main">
              <TiempoHubDashboard
                data={data}
                isLoading={isLoading}
                unavailable={unavailable}
                completingRoutineId={completingRoutineId}
                onCompleteRoutine={routineId => void completeRoutine(routineId)}
              />
            </main>

            <aside className="tiempo-hub-aside" aria-label="Módulos de Lifestyle">
              <h2 className="tiempo-hub-aside-title">Módulos</h2>
              {isLoading ? (
                <ListSkeleton variant="hub-row" count={4} aria-label="Cargando módulos" />
              ) : (
                <TiempoHubModules stats={stats} statsLoading={isLoading} />
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

export default Tiempo
