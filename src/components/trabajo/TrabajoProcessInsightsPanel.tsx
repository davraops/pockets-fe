import { useNavigate } from 'react-router-dom'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import ScheduleIcon from '@mui/icons-material/Schedule'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import WarningIcon from '@mui/icons-material/Warning'
import type { TrabajoProcessInsights } from './procesoHubUtils'

interface TrabajoProcessInsightsPanelProps {
  insights: TrabajoProcessInsights
  unavailable?: boolean
}

function TrabajoProcessInsightsPanel({ insights, unavailable = false }: TrabajoProcessInsightsPanelProps) {
  const navigate = useNavigate()
  const { stats } = insights

  if (unavailable) {
    return (
      <section className="trabajo-process-insights" aria-label="Insights de procesos">
        <p className="trabajo-feed-empty trabajo-feed-error">No se pudieron cargar los procesos</p>
      </section>
    )
  }

  const hasOpenProcesses = stats.procesosAbiertos > 0

  return (
    <section className="trabajo-process-insights" aria-label="Insights de procesos de contratación">
      <div className="trabajo-process-kpis" role="list" aria-label="Indicadores de procesos">
        <div className="trabajo-process-kpi" role="listitem">
          <span className="trabajo-process-kpi-label">Abiertos</span>
          <span className="trabajo-process-kpi-value">{stats.procesosAbiertos}</span>
        </div>
        <div className="trabajo-process-kpi" role="listitem">
          <span className="trabajo-process-kpi-label">Entrevistas</span>
          <span
            className={`trabajo-process-kpi-value${stats.entrevistasProximas > 0 ? ' trabajo-process-kpi-value--warning' : ''}`}
          >
            {stats.entrevistasProximas}
          </span>
        </div>
        <div className="trabajo-process-kpi" role="listitem">
          <span className="trabajo-process-kpi-label">Avance medio</span>
          <span className="trabajo-process-kpi-value">
            {stats.avancePromedioPasos > 0 ? `${stats.avancePromedioPasos}%` : '—'}
          </span>
        </div>
        <div className="trabajo-process-kpi" role="listitem">
          <span className="trabajo-process-kpi-label">Sin seguimiento</span>
          <span
            className={`trabajo-process-kpi-value${stats.procesosEstancados > 0 ? ' trabajo-process-kpi-value--danger' : ''}`}
          >
            {stats.procesosEstancados}
          </span>
        </div>
      </div>

      {insights.summaryLines.length > 0 && (
        <p className="trabajo-process-summary" role="status">
          {insights.summaryLines.join(' · ')}
        </p>
      )}

      <div className="trabajo-dashboard-panels trabajo-process-panels">
        <section className="trabajo-feed-panel" aria-labelledby="trabajo-interviews-heading">
          <div className="trabajo-feed-panel-header">
            <h2 id="trabajo-interviews-heading" className="trabajo-feed-panel-title">
              Próximas entrevistas
            </h2>
            <button
              type="button"
              className="trabajo-feed-panel-link"
              onClick={() => navigate('/trabajo/procesos')}
            >
              Agenda
              <ChevronRightIcon aria-hidden="true" />
            </button>
          </div>
          <div className="trabajo-feed-list glass-group">
            {!hasOpenProcesses && (
              <p className="trabajo-feed-empty">Sin procesos abiertos</p>
            )}
            {hasOpenProcesses && insights.upcomingInterviews.length === 0 && (
              <p className="trabajo-feed-empty">Sin entrevistas en las próximas 3 semanas</p>
            )}
            {insights.upcomingInterviews.map(interview => (
              <button
                key={interview.id}
                type="button"
                className={`trabajo-feed-row${interview.daysUntil <= 2 ? ' trabajo-feed-row-warning' : ' trabajo-feed-row-positive'}`}
                onClick={() => navigate('/trabajo/procesos')}
                aria-label={`${interview.processName}, ${interview.whenLabel}`}
              >
                <span className="trabajo-feed-row-icon trabajo-feed-row-icon--calendar" aria-hidden="true">
                  <CalendarTodayIcon />
                </span>
                <span className="trabajo-feed-row-body">
                  <span className="trabajo-feed-row-title">{interview.processName}</span>
                  <span className="trabajo-feed-row-sub">
                    {interview.whenLabel}
                    {interview.time ? ` · ${interview.time}` : ''} · {interview.company}
                  </span>
                </span>
                <ChevronRightIcon className="trabajo-feed-chevron" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        <section className="trabajo-feed-panel" aria-labelledby="trabajo-pipeline-heading">
          <div className="trabajo-feed-panel-header">
            <h2 id="trabajo-pipeline-heading" className="trabajo-feed-panel-title">
              Pipeline activo
            </h2>
            <button
              type="button"
              className="trabajo-feed-panel-link"
              onClick={() => navigate('/trabajo/procesos')}
            >
              Ver todo
              <ChevronRightIcon aria-hidden="true" />
            </button>
          </div>
          <div className="trabajo-feed-list glass-group">
            {!hasOpenProcesses && (
              <p className="trabajo-feed-empty">Sin procesos abiertos</p>
            )}
            {hasOpenProcesses &&
              insights.activePipeline.length === 0 &&
              insights.stalledProcesses.length === 0 && (
                <p className="trabajo-feed-empty">Sin pipeline activo registrado</p>
              )}
            {insights.activePipeline.map(item => (
              <button
                key={item.id}
                type="button"
                className={`trabajo-feed-row trabajo-process-row${item.tone ? ` trabajo-feed-row-${item.tone}` : ''}`}
                onClick={() => navigate('/trabajo/procesos')}
                aria-label={`${item.name}, ${item.detail}`}
              >
                <span className="trabajo-feed-row-icon" aria-hidden="true">
                  <TrendingUpIcon />
                </span>
                <span className="trabajo-feed-row-body">
                  <span className="trabajo-feed-row-title">{item.name}</span>
                  <span className="trabajo-feed-row-sub">
                    {item.company} · {item.detail}
                  </span>
                  {item.progressPercent > 0 && (
                    <span className="trabajo-process-progress" aria-hidden="true">
                      <span
                        className="trabajo-process-progress-bar"
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </span>
                  )}
                </span>
                <ChevronRightIcon className="trabajo-feed-chevron" aria-hidden="true" />
              </button>
            ))}
            {insights.stalledProcesses.length > 0 && (
              <>
                <p className="trabajo-process-subsection-label">
                  <WarningIcon aria-hidden="true" />
                  Requieren seguimiento
                </p>
                {insights.stalledProcesses.map(item => (
                  <button
                    key={`stalled-${item.id}`}
                    type="button"
                    className="trabajo-feed-row trabajo-feed-row-danger trabajo-process-row"
                    onClick={() => navigate('/trabajo/procesos')}
                    aria-label={`${item.name}, sin seguimiento reciente`}
                  >
                    <span className="trabajo-feed-row-icon" aria-hidden="true">
                      <ScheduleIcon />
                    </span>
                    <span className="trabajo-feed-row-body">
                      <span className="trabajo-feed-row-title">{item.name}</span>
                      <span className="trabajo-feed-row-sub">
                        {item.company} ·{' '}
                        {item.lastTouchDaysAgo !== null
                          ? `Sin contacto hace ${item.lastTouchDaysAgo} días`
                          : `Abierto hace ${item.daysOpen} días sin interacciones`}
                      </span>
                    </span>
                    <ChevronRightIcon className="trabajo-feed-chevron" aria-hidden="true" />
                  </button>
                ))}
              </>
            )}
          </div>
        </section>
      </div>

      {hasOpenProcesses && (stats.conAgencia > 0 || stats.diasPromedioAbiertos > 0) && (
        <div className="trabajo-process-footnotes" role="note">
          {stats.diasPromedioAbiertos > 0 && (
            <span>
              <PersonSearchIcon aria-hidden="true" />
              Promedio abierto: {stats.diasPromedioAbiertos} días
            </span>
          )}
          {stats.conAgencia > 0 && (
            <span>
              {stats.conAgencia} vía agencia · {stats.contactoDirecto} directo
              {stats.conSalarioNegociado > 0
                ? ` · ${stats.conSalarioNegociado} con oferta negociada`
                : ''}
            </span>
          )}
        </div>
      )}
    </section>
  )
}

export default TrabajoProcessInsightsPanel
