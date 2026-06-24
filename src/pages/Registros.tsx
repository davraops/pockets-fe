import './AppPage.css'
import './Registros.css'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SyncIcon from '@mui/icons-material/Sync'
import ListSkeleton from '../components/ListSkeleton'
import UtilidadesHubDashboard from '../components/utilidades/UtilidadesHubDashboard'
import UtilidadesHubModules from '../components/utilidades/UtilidadesHubModules'
import { useUtilidadesHubStats } from '../hooks/useUtilidadesHubStats'

function Registros() {
  const navigate = useNavigate()
  const { isLoading, loadError, statsWarning, failedSources, stats, loadStats } =
    useUtilidadesHubStats()

  const todayLabel = useMemo(() => {
    const label = new Date().toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    return label.charAt(0).toUpperCase() + label.slice(1)
  }, [])

  const statSubtitle = (source: string, value: string) =>
    failedSources.has(source) ? 'No disponible' : value

  const statSubtitleClass = (source: string) =>
    failedSources.has(source)
      ? 'utilidades-module-sub utilidades-module-sub-unavailable'
      : 'utilidades-module-sub'

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide utilidades-hub-content">
        <header className="utilidades-hub-header">
          <div className="utilidades-hub-toolbar">
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
              className="app-toolbar-button utilidades-hub-sync"
              onClick={() => void loadStats()}
              aria-label="Actualizar resumen de utilidades"
              disabled={isLoading}
            >
              <SyncIcon className="app-toolbar-icon" aria-hidden="true" />
            </button>
          </div>
          <div className="utilidades-hub-heading">
            <h1 className="utilidades-hub-title">
              <span className="utilidades-hub-title-brand">Utilidades</span>
              <span className="utilidades-hub-title-sep" aria-hidden="true">
                ·
              </span>
              <span className="utilidades-hub-title-context">Resumen</span>
            </h1>
            <p className="utilidades-hub-meta">{todayLabel}</p>
          </div>
        </header>

        {loadError ? (
          <div className="loader-container">
            <div className="loader utilidades-stats-error-panel">
              <p className="utilidades-stats-error" role="alert">
                {loadError}
              </p>
              <button
                type="button"
                className="btn-base btn-secondary finanzas-stats-retry-button"
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
              <div className="utilidades-stats-warning" role="status" aria-live="polite">
                <p>{statsWarning}</p>
                <button
                  type="button"
                  className="btn-base btn-secondary finanzas-stats-retry-button utilidades-stats-retry-button-inline"
                  onClick={() => void loadStats()}
                  aria-label="Reintentar cargar estadísticas"
                >
                  <SyncIcon aria-hidden="true" />
                  <span>Reintentar</span>
                </button>
              </div>
            )}

            <div className="utilidades-hub-body">
              <main className="utilidades-hub-main">
                <UtilidadesHubDashboard
                  stats={stats}
                  failedSources={failedSources}
                  isLoading={isLoading}
                />
              </main>

              <aside className="utilidades-hub-aside" aria-label="Módulos de utilidades">
                <h2 className="utilidades-hub-aside-title">Módulos</h2>
                {isLoading ? (
                  <ListSkeleton variant="hub-row" count={8} aria-label="Cargando módulos" />
                ) : (
                  <UtilidadesHubModules
                    stats={stats}
                    failedSources={failedSources}
                    statSubtitle={statSubtitle}
                    statSubtitleClass={statSubtitleClass}
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

export default Registros
