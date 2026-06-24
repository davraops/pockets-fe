import './AppPage.css'
import './Finanzas.css'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SyncIcon from '@mui/icons-material/Sync'
import ListSkeleton from '../components/ListSkeleton'
import FinanzasHubDashboard from '../components/finanzas/FinanzasHubDashboard'
import FinanzasHubModules from '../components/finanzas/FinanzasHubModules'
import { getCurrentMonthLabel, useFinanzasHubStats } from '../hooks/useFinanzasHubStats'

function Finanzas() {
  const navigate = useNavigate()
  const { isLoading, loadError, statsWarning, failedSources, stats, loadStats } =
    useFinanzasHubStats()
  const monthLabel = useMemo(() => getCurrentMonthLabel(), [])

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`

  const statSubtitle = (source: string, value: string) =>
    failedSources.has(source) ? 'No disponible' : value

  const statSubtitleClass = (source: string) =>
    failedSources.has(source)
      ? 'finanzas-module-sub finanzas-module-sub-unavailable'
      : 'finanzas-module-sub'

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide finanzas-hub-content">
        <header className="finanzas-hub-header">
          <div className="finanzas-hub-toolbar">
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
              className="app-toolbar-button finanzas-hub-sync"
              onClick={() => void loadStats()}
              aria-label="Actualizar resumen financiero"
              disabled={isLoading}
            >
              <SyncIcon className="app-toolbar-icon" aria-hidden="true" />
            </button>
          </div>
          <div className="finanzas-hub-heading">
            <h1 className="finanzas-hub-title">
              <span className="finanzas-hub-title-brand">Finanzas</span>
              <span className="finanzas-hub-title-sep" aria-hidden="true">
                ·
              </span>
              <span className="finanzas-hub-title-context">Resumen</span>
            </h1>
            <p className="finanzas-hub-meta">{monthLabel}</p>
          </div>
        </header>

        {loadError ? (
          <div className="loader-container">
            <div className="loader finanzas-stats-error-panel">
              <p className="finanzas-stats-error" role="alert">
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
              <div className="finanzas-stats-warning" role="status" aria-live="polite">
                <p>{statsWarning}</p>
                <button
                  type="button"
                  className="btn-base btn-secondary finanzas-stats-retry-button finanzas-stats-retry-button-inline"
                  onClick={() => void loadStats()}
                  aria-label="Reintentar cargar estadísticas"
                >
                  <SyncIcon aria-hidden="true" />
                  <span>Reintentar</span>
                </button>
              </div>
            )}

            <div className="finanzas-hub-body">
              <main className="finanzas-hub-main">
                <FinanzasHubDashboard
                  stats={stats}
                  failedSources={failedSources}
                  isLoading={isLoading}
                />
              </main>

              <aside className="finanzas-hub-aside" aria-label="Módulos financieros">
                <h2 className="finanzas-hub-aside-title">Módulos</h2>
                {isLoading ? (
                  <ListSkeleton variant="hub-row" count={8} aria-label="Cargando módulos" />
                ) : (
                  <FinanzasHubModules
                    stats={stats}
                    formatPrice={formatPrice}
                    formatPercentage={formatPercentage}
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

export default Finanzas
