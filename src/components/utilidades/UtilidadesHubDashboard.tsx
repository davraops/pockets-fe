import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import BookIcon from '@mui/icons-material/Book'
import BuildIcon from '@mui/icons-material/Build'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DescriptionIcon from '@mui/icons-material/Description'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import LockIcon from '@mui/icons-material/Lock'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import ListSkeleton from '../ListSkeleton'
import { sectionColor } from '../../constants/sectionColors'
import {
  formatActivityDate,
  formatUtilidadesPrice,
  type UtilidadesHubStats,
} from '../../hooks/useUtilidadesHubStats'

interface UtilidadesHubDashboardProps {
  stats: UtilidadesHubStats
  failedSources: Set<string>
  isLoading: boolean
}

function activityIcon(type: UtilidadesHubStats['recentActivity'][number]['type']) {
  switch (type) {
    case 'note':
      return BookIcon
    case 'secret':
      return LockIcon
    case 'file':
      return DescriptionIcon
    default:
      return BookIcon
  }
}

function activityColor(type: UtilidadesHubStats['recentActivity'][number]['type']) {
  switch (type) {
    case 'note':
      return sectionColor.blue
    case 'secret':
      return sectionColor.danger
    case 'file':
      return sectionColor.utilidades
    default:
      return sectionColor.utilidades
  }
}

function UtilidadesHubDashboard({ stats, failedSources, isLoading }: UtilidadesHubDashboardProps) {
  const navigate = useNavigate()

  const recordsUnavailable = useMemo(
    () =>
      ['notes', 'secrets', 'files', 'employees', 'vehicles', 'patrimony'].every(key =>
        failedSources.has(key)
      ),
    [failedSources]
  )

  const heroSubline = useMemo(() => {
    const parts: string[] = []
    if (!failedSources.has('notes') && stats.totalNotas > 0) {
      parts.push(`${stats.totalNotas} cuaderno${stats.totalNotas !== 1 ? 's' : ''}`)
    }
    if (!failedSources.has('files') && stats.totalArchivos > 0) {
      parts.push(`${stats.totalArchivos} archivo${stats.totalArchivos !== 1 ? 's' : ''}`)
    }
    if (!failedSources.has('patrimony') && stats.valorPatrimonioCOP > 0) {
      parts.push(`${formatUtilidadesPrice(stats.valorPatrimonioCOP)} en bienes`)
    }
    return parts.length > 0 ? parts.join(' · ') : 'Organiza cuadernos, archivos y registros'
  }, [stats, failedSources])

  if (isLoading) {
    return (
      <div className="utilidades-dashboard" aria-label="Resumen de utilidades" aria-busy="true">
        <ListSkeleton variant="summary-card" count={1} className="utilidades-hero-skeleton" />
        <div className="utilidades-dashboard-panels">
          <ListSkeleton variant="hub-row" count={4} />
          <ListSkeleton variant="hub-row" count={3} />
        </div>
      </div>
    )
  }

  return (
    <div className="utilidades-dashboard" aria-label="Resumen de utilidades">
      <button
        type="button"
        className="utilidades-hero"
        onClick={() => navigate('/registros/cuadernos')}
        aria-label={
          recordsUnavailable
            ? 'Tu archivo digital. Datos no disponibles'
            : `${stats.totalRegistros} registros en tu archivo digital`
        }
      >
        <div
          className="utilidades-hero-icon"
          style={{ '--section-color': sectionColor.utilidades } as React.CSSProperties}
          aria-hidden="true"
        >
          <BuildIcon />
        </div>
        <div className="utilidades-hero-body">
          <span className="utilidades-hero-label">Tu archivo digital</span>
          <span
            className={`utilidades-hero-value${recordsUnavailable ? ' utilidades-dash-unavailable' : ''}`}
          >
            {recordsUnavailable ? 'No disponible' : stats.totalRegistros}
          </span>
          {!recordsUnavailable && <p className="utilidades-hero-sub">{heroSubline}</p>}
        </div>
        <ChevronRightIcon className="utilidades-feed-chevron" aria-hidden="true" />
      </button>

      <div className="utilidades-quick-actions" role="group" aria-label="Acciones rápidas">
        <button
          type="button"
          className="btn-base btn-accent utilidades-quick-action"
          onClick={() => navigate('/registros/cuadernos')}
        >
          <AddIcon aria-hidden="true" />
          Cuaderno
        </button>
        <button
          type="button"
          className="btn-base btn-secondary utilidades-quick-action"
          onClick={() => navigate('/registros/archivos')}
        >
          <CloudUploadIcon aria-hidden="true" />
          Archivo
        </button>
        <button
          type="button"
          className="btn-base btn-secondary utilidades-quick-action"
          onClick={() => navigate('/registros/generador-contrasenas')}
        >
          <VpnKeyIcon aria-hidden="true" />
          Contraseña
        </button>
        <button
          type="button"
          className="btn-base btn-secondary utilidades-quick-action"
          onClick={() => navigate('/registros/vehiculos')}
        >
          <DirectionsCarIcon aria-hidden="true" />
          Vehículo
        </button>
      </div>

      <div className="utilidades-dashboard-panels">
        <section className="utilidades-feed-panel" aria-labelledby="utilidades-activity-heading">
          <div className="utilidades-feed-panel-header">
            <h2 id="utilidades-activity-heading" className="utilidades-feed-panel-title">
              Actividad reciente
            </h2>
            <button
              type="button"
              className="utilidades-feed-panel-link"
              onClick={() => navigate('/registros/cuadernos')}
            >
              Cuadernos
              <ChevronRightIcon aria-hidden="true" />
            </button>
          </div>
          <div className="utilidades-feed-list glass-group">
            {stats.recentActivity.length === 0 ? (
              <p className="utilidades-feed-empty">Sin actividad reciente</p>
            ) : (
              stats.recentActivity.map(item => {
                const Icon = activityIcon(item.type)
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="utilidades-feed-row"
                    onClick={() => navigate(item.path)}
                    aria-label={`${item.label}, ${formatActivityDate(item.date)}`}
                  >
                    <span className="utilidades-feed-row-time">{formatActivityDate(item.date)}</span>
                    <span
                      className="utilidades-feed-row-icon"
                      style={{ '--section-color': activityColor(item.type) } as React.CSSProperties}
                      aria-hidden="true"
                    >
                      <Icon />
                    </span>
                    <span className="utilidades-feed-row-body">
                      <span className="utilidades-feed-row-title">{item.label}</span>
                    </span>
                    <ChevronRightIcon className="utilidades-feed-chevron" aria-hidden="true" />
                  </button>
                )
              })
            )}
          </div>
        </section>

        <section className="utilidades-feed-panel" aria-labelledby="utilidades-attention-heading">
          <div className="utilidades-feed-panel-header">
            <h2 id="utilidades-attention-heading" className="utilidades-feed-panel-title">
              Atención
            </h2>
            <button
              type="button"
              className="utilidades-feed-panel-link"
              onClick={() => navigate('/registros/vehiculos')}
            >
              Vehículos
              <ChevronRightIcon aria-hidden="true" />
            </button>
          </div>
          <div className="utilidades-feed-list glass-group">
            {failedSources.has('vehicles') && (
              <p className="utilidades-feed-empty utilidades-feed-error">
                No se pudieron cargar los vehículos
              </p>
            )}
            {!failedSources.has('vehicles') && stats.attentionItems.length === 0 && (
              <p className="utilidades-feed-empty utilidades-feed-success">
                Sin vencimientos próximos
              </p>
            )}
            {!failedSources.has('vehicles') &&
              stats.attentionItems.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className={`utilidades-feed-row utilidades-feed-row-${item.tone}`}
                  onClick={() => navigate(item.path)}
                  aria-label={`${item.label}: ${item.detail}`}
                >
                  <span className="utilidades-feed-row-time">
                    {item.daysUntil <= 0 ? '!' : `${item.daysUntil}d`}
                  </span>
                  <span
                    className="utilidades-feed-row-icon"
                    style={{ '--section-color': sectionColor.indigo } as React.CSSProperties}
                    aria-hidden="true"
                  >
                    <DirectionsCarIcon />
                  </span>
                  <span className="utilidades-feed-row-body">
                    <span className="utilidades-feed-row-title">{item.label}</span>
                    <span className="utilidades-feed-row-sub">{item.detail}</span>
                  </span>
                  <ChevronRightIcon className="utilidades-feed-chevron" aria-hidden="true" />
                </button>
              ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default UtilidadesHubDashboard
