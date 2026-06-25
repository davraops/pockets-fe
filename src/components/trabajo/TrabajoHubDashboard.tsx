import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import AssignmentIcon from '@mui/icons-material/Assignment'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import PriorityHighIcon from '@mui/icons-material/PriorityHigh'
import WorkIcon from '@mui/icons-material/Work'
import ListSkeleton from '../ListSkeleton'
import { sectionColor } from '../../constants/sectionColors'
import TrabajoProcessInsightsPanel from './TrabajoProcessInsightsPanel'
import {
  formatTrabajoHeroStats,
  formatTrabajoHeroSubline,
  formatTrabajoHeroValue,
  type TrabajoHubData,
} from './trabajoHubUtils'

interface TrabajoHubDashboardProps {
  data: TrabajoHubData
  failedSources: Set<string>
  isLoading: boolean
}

function TrabajoHubDashboard({ data, failedSources, isLoading }: TrabajoHubDashboardProps) {
  const navigate = useNavigate()
  const queueUnavailable = failedSources.has('activities') && failedSources.has('processes')

  const heroSubline = useMemo(() => formatTrabajoHeroSubline(data.stats), [data.stats])
  const heroStats = useMemo(() => formatTrabajoHeroStats(data.stats), [data.stats])

  if (isLoading) {
    return (
      <div className="trabajo-dashboard" aria-label="Resumen de Trabajo" aria-busy="true">
        <ListSkeleton variant="summary-card" count={1} className="trabajo-hero-skeleton" />
        <ListSkeleton variant="hub-row" count={4} className="trabajo-process-skeleton" />
        <div className="trabajo-dashboard-panels">
          <ListSkeleton variant="hub-row" count={4} />
          <ListSkeleton variant="hub-row" count={3} />
        </div>
      </div>
    )
  }

  return (
    <div className="trabajo-dashboard" aria-label="Resumen de Trabajo">
      <button
        type="button"
        className="trabajo-hero"
        onClick={() => navigate('/trabajo/actividades')}
        aria-label={
          queueUnavailable
            ? 'Cola activa. Datos no disponibles'
            : data.stats.actividadesActivas === 0 && data.stats.procesosAbiertos === 0
              ? 'Cola activa. Sin pendientes'
              : `${data.stats.actividadesActivas} actividades activas`
        }
      >
        <div
          className="trabajo-hero-icon"
          style={{ '--section-color': sectionColor.trabajo } as React.CSSProperties}
          aria-hidden="true"
        >
          <WorkIcon />
        </div>
        <div className="trabajo-hero-body">
          <span className="trabajo-hero-label">Cola activa</span>
          <span
            className={`trabajo-hero-value${queueUnavailable ? ' trabajo-dash-unavailable' : ''}`}
          >
            {queueUnavailable ? 'No disponible' : formatTrabajoHeroValue(data.stats)}
          </span>
          {!queueUnavailable && <p className="trabajo-hero-sub">{heroSubline}</p>}
          {!queueUnavailable && heroStats.length > 0 && (
            <div className="trabajo-hero-stats">
              {heroStats.map((item, index) => (
                <span key={item.id} className="trabajo-hero-stat-group">
                  {index > 0 && (
                    <span className="trabajo-hero-stat-sep" aria-hidden="true">
                      /
                    </span>
                  )}
                  <span className={`trabajo-hero-stat trabajo-hero-stat-${item.tone ?? 'neutral'}`}>
                    {item.value} {item.label.toLowerCase()}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
        <ChevronRightIcon className="trabajo-feed-chevron" aria-hidden="true" />
      </button>

      <div className="trabajo-quick-actions" role="group" aria-label="Acciones rápidas">
        <button
          type="button"
          className="btn-base btn-accent trabajo-quick-action"
          onClick={() => navigate('/trabajo/actividades')}
        >
          <AddIcon aria-hidden="true" />
          Actividad
        </button>
        <button
          type="button"
          className="btn-base btn-secondary trabajo-quick-action"
          onClick={() => navigate('/trabajo/contratos')}
        >
          <AssignmentIcon aria-hidden="true" />
          Contratos
        </button>
        <button
          type="button"
          className="btn-base btn-secondary trabajo-quick-action"
          onClick={() => navigate('/trabajo/procesos')}
        >
          <PersonSearchIcon aria-hidden="true" />
          Procesos
        </button>
      </div>

      <TrabajoProcessInsightsPanel
        insights={data.processInsights}
        unavailable={failedSources.has('processes')}
      />

      <div className="trabajo-dashboard-panels trabajo-activity-panels">
        <section className="trabajo-feed-panel" aria-labelledby="trabajo-recent-heading">
          <div className="trabajo-feed-panel-header">
            <h2 id="trabajo-recent-heading" className="trabajo-feed-panel-title">
              Actividades en curso
            </h2>
            <button
              type="button"
              className="trabajo-feed-panel-link"
              onClick={() => navigate('/trabajo/actividades')}
            >
              Ver todo
              <ChevronRightIcon aria-hidden="true" />
            </button>
          </div>
          <div className="trabajo-feed-list glass-group">
            {failedSources.has('activities') && (
              <p className="trabajo-feed-empty trabajo-feed-error">
                No se pudieron cargar las actividades
              </p>
            )}
            {!failedSources.has('activities') &&
              data.recentItems.filter(item => item.kind === 'activity').length === 0 && (
                <p className="trabajo-feed-empty">Sin actividades en curso</p>
              )}
            {data.recentItems
              .filter(item => item.kind === 'activity')
              .map(item => (
              <button
                key={item.id}
                type="button"
                className={`trabajo-feed-row${item.tone ? ` trabajo-feed-row-${item.tone}` : ''}`}
                onClick={() => navigate(item.path)}
                aria-label={`${item.title}. ${item.detail}`}
              >
                <span
                  className="trabajo-feed-row-icon"
                  style={{ '--section-color': sectionColor.trabajo } as React.CSSProperties}
                  aria-hidden="true"
                >
                  {item.kind === 'process' ? <PersonSearchIcon /> : <WorkIcon />}
                </span>
                <span className="trabajo-feed-row-body">
                  <span className="trabajo-feed-row-title">{item.title}</span>
                  <span className="trabajo-feed-row-sub">{item.detail}</span>
                </span>
                <ChevronRightIcon className="trabajo-feed-chevron" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        <section className="trabajo-feed-panel" aria-labelledby="trabajo-attention-heading">
          <div className="trabajo-feed-panel-header">
            <h2 id="trabajo-attention-heading" className="trabajo-feed-panel-title">
              Actividades · atención
            </h2>
            <button
              type="button"
              className="trabajo-feed-panel-link"
              onClick={() => navigate('/trabajo/actividades')}
            >
              Ver todo
              <ChevronRightIcon aria-hidden="true" />
            </button>
          </div>
          <div className="trabajo-feed-list glass-group">
            {data.attentionItems.filter(item => !item.id.startsWith('interview') && !item.id.startsWith('steps')).length === 0 && (
              <p className="trabajo-feed-empty trabajo-feed-success">Sin alertas de actividades</p>
            )}
            {data.attentionItems
              .filter(item => !item.id.startsWith('interview') && !item.id.startsWith('steps'))
              .map(item => (
              <button
                key={item.id}
                type="button"
                className={`trabajo-feed-row trabajo-feed-row-${item.tone}`}
                onClick={() => navigate(item.path)}
                aria-label={`${item.label}: ${item.detail}`}
              >
                <span
                  className="trabajo-feed-row-icon"
                  style={{ '--section-color': sectionColor.trabajo } as React.CSSProperties}
                  aria-hidden="true"
                >
                  {item.tone === 'danger' || item.id.startsWith('blocked') ? (
                    <PriorityHighIcon />
                  ) : (
                    <WorkIcon />
                  )}
                </span>
                <span className="trabajo-feed-row-body">
                  <span className="trabajo-feed-row-title">{item.label}</span>
                  <span className="trabajo-feed-row-sub">{item.detail}</span>
                </span>
                <ChevronRightIcon className="trabajo-feed-chevron" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default TrabajoHubDashboard
