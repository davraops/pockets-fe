import './AppPage.css'
import './Trabajo.css'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SyncIcon from '@mui/icons-material/Sync'
import ListSkeleton from '../components/ListSkeleton'
import TrabajoHubDashboard from '../components/trabajo/TrabajoHubDashboard'
import TrabajoHubModules from '../components/trabajo/TrabajoHubModules'
import { useTrabajoHubStats } from '../hooks/useTrabajoHubStats'

function Trabajo() {
  const navigate = useNavigate()
  const { isLoading, loadError, statsWarning, failedSources, data, stats, loadStats } =
    useTrabajoHubStats()

  const todayLabel = useMemo(() => {
    const label = new Date().toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    return label.charAt(0).toUpperCase() + label.slice(1)
  }, [])

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide trabajo-hub-content">
        <header className="trabajo-hub-header">
          <div className="trabajo-hub-toolbar">
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
              className="app-toolbar-button trabajo-hub-sync"
              onClick={() => void loadStats()}
              aria-label="Actualizar resumen de Trabajo"
              disabled={isLoading}
            >
              <SyncIcon className="app-toolbar-icon" aria-hidden="true" />
            </button>
          </div>
          <div className="trabajo-hub-heading">
            <h1 className="trabajo-hub-title">
              <span className="trabajo-hub-title-brand">Trabajo</span>
              <span className="trabajo-hub-title-sep" aria-hidden="true">
                ·
              </span>
              <span className="trabajo-hub-title-context">Resumen</span>
            </h1>
            <p className="trabajo-hub-meta">{todayLabel}</p>
          </div>
        </header>

        {loadError ? (
          <div className="loader-container">
            <div className="loader trabajo-stats-error-panel">
              <p className="trabajo-stats-error" role="alert">
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
          <>
            {statsWarning && (
              <div className="trabajo-stats-warning" role="status" aria-live="polite">
                <p>{statsWarning}</p>
                <button
                  type="button"
                  className="btn-base btn-secondary btn-retry btn-retry--inline"
                  onClick={() => void loadStats()}
                  aria-label="Reintentar cargar estadísticas"
                >
                  <SyncIcon aria-hidden="true" />
                  <span>Reintentar</span>
                </button>
              </div>
            )}

            <div className="trabajo-hub-body">
              <main className="trabajo-hub-main">
                <TrabajoHubDashboard
                  data={data}
                  failedSources={failedSources}
                  isLoading={isLoading}
                />
              </main>

              <aside className="trabajo-hub-aside" aria-label="Módulos de Trabajo">
                <h2 className="trabajo-hub-aside-title">Módulos</h2>
                {isLoading ? (
                  <ListSkeleton variant="hub-row" count={3} aria-label="Cargando módulos" />
                ) : (
                  <TrabajoHubModules
                    stats={stats}
                    failedSources={failedSources}
                    statsLoading={isLoading}
                  />
                )}
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Trabajo
