import { useMemo, useState } from 'react'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import LaunchIcon from '@mui/icons-material/Launch'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff'
import RefreshIcon from '@mui/icons-material/Refresh'
import ModalOverlay from '../ModalOverlay'
import ListSkeleton from '../ListSkeleton'
import type { Actuacion, Proceso } from './procesoTypes'
import {
  buildRamaJudicialConsultaUrl,
  daysSince,
  formatProcesoDate,
  formatRelativeDate,
  formatUserRolesLabel,
  getEstadoColor,
} from './procesoDisplayUtils'

interface ProcesoDetailModalProps {
  proceso: Proceso
  actuaciones: Actuacion[]
  isLoadingActuaciones: boolean
  actuacionesError: string | null
  isTrackingBusy: boolean
  onClose: () => void
  onRefreshActuaciones: () => void
  onToggleTracking: () => void
  onCopyNumero: () => void
}

const ANOTACION_PREVIEW_LENGTH = 220

function ProcesoDetailModal({
  proceso,
  actuaciones,
  isLoadingActuaciones,
  actuacionesError,
  isTrackingBusy,
  onClose,
  onRefreshActuaciones,
  onToggleTracking,
  onCopyNumero,
}: ProcesoDetailModalProps) {
  const [expandedActuacionIds, setExpandedActuacionIds] = useState<Set<number>>(() => new Set())

  const diasDesdeUltima = daysSince(proceso.fechaUltimaActuacion)
  const userRolesLabel = formatUserRolesLabel(proceso.userRoles)
  const consultaUrl = buildRamaJudicialConsultaUrl(proceso.numero)

  const sortedActuaciones = useMemo(
    () =>
      [...actuaciones].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      ),
    [actuaciones]
  )

  const toggleAnotacion = (id: number) => {
    setExpandedActuacionIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <ModalOverlay onClose={onClose} className="modal-overlay">
      <div
        className="modal-panel modal-panel-lg procesos-modal procesos-modal--detail"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title-proceso-detalle"
      >
        <div className="procesos-modal__header">
          <div className="procesos-modal__header-copy">
            <p className="procesos-modal__kicker">Justicia · Proceso judicial</p>
            <h2 className="modal-panel-title" id="modal-title-proceso-detalle">
              {proceso.numero}
            </h2>
            <p className="procesos-modal__subtitle">
              {proceso.despacho} · {proceso.departamento}
            </p>
            <div className="procesos-modal__status-row">
              <span
                className="procesos-status-pill"
                style={{
                  color: getEstadoColor(proceso.estado),
                  borderColor: `${getEstadoColor(proceso.estado)}55`,
                  backgroundColor: `${getEstadoColor(proceso.estado)}18`,
                }}
              >
                {proceso.estado}
              </span>
              {proceso.badge ? (
                <span
                  className={`procesos-item-badge procesos-item-badge-${proceso.badge.toLowerCase()}`}
                >
                  {proceso.badge}
                </span>
              ) : null}
              {proceso.isTracked ? (
                <span className="procesos-status-pill procesos-status-pill--tracked">
                  <NotificationsActiveIcon aria-hidden="true" />
                  En seguimiento
                </span>
              ) : null}
            </div>
          </div>
          <button className="modal-panel-close" onClick={onClose} aria-label="Cerrar" type="button">
            ×
          </button>
        </div>

        <div className="modal-panel-content procesos-modal__body">
          <section className="procesos-detail-hero" aria-label="Resumen del proceso">
            <div className="procesos-detail-hero__metric">
              <span className="procesos-detail-hero__label">Última actuación</span>
              <strong className="procesos-detail-hero__value">
                {formatRelativeDate(proceso.fechaUltimaActuacion)}
              </strong>
              <span className="procesos-detail-hero__hint">
                {formatProcesoDate(proceso.fechaUltimaActuacion)}
                {diasDesdeUltima > 0 ? ` · ${diasDesdeUltima} días sin movimiento` : ''}
              </span>
            </div>
            <div className="procesos-detail-hero__metric">
              <span className="procesos-detail-hero__label">Inicio del proceso</span>
              <strong className="procesos-detail-hero__value">
                {formatProcesoDate(proceso.fechaInicio)}
              </strong>
              {userRolesLabel ? (
                <span className="procesos-detail-hero__hint">Tu rol: {userRolesLabel}</span>
              ) : null}
            </div>
          </section>

          <section className="procesos-detail-section">
            <h3 className="procesos-detail-section-title">Información del expediente</h3>
            <div className="procesos-detail-grid">
              <div className="procesos-detail-item">
                <span className="procesos-detail-label">Radicado</span>
                <span className="procesos-detail-value">{proceso.numero}</span>
              </div>
              <div className="procesos-detail-item">
                <span className="procesos-detail-label">Despacho</span>
                <span className="procesos-detail-value">{proceso.despacho}</span>
              </div>
              <div className="procesos-detail-item">
                <span className="procesos-detail-label">Departamento</span>
                <span className="procesos-detail-value">{proceso.departamento}</span>
              </div>
              {userRolesLabel ? (
                <div className="procesos-detail-item">
                  <span className="procesos-detail-label">Tu participación</span>
                  <span className="procesos-detail-value">{userRolesLabel}</span>
                </div>
              ) : null}
            </div>
          </section>

          {proceso.parties?.length ? (
            <section className="procesos-detail-section">
              <h3 className="procesos-detail-section-title">Partes del proceso</h3>
              <div className="procesos-parties-list">
                {proceso.parties.map(party => {
                  const isUserParty = proceso.userRoles?.includes(party.role)
                  return (
                    <div
                      key={`${party.role}-${party.names}`}
                      className={`procesos-party-item${isUserParty ? ' procesos-party-item--self' : ''}`}
                    >
                      <span className="procesos-party-role">{party.role}</span>
                      <span className="procesos-party-names">{party.names}</span>
                    </div>
                  )
                })}
              </div>
            </section>
          ) : proceso.sujetosProcesales ? (
            <section className="procesos-detail-section">
              <h3 className="procesos-detail-section-title">Sujetos procesales</h3>
              <p className="procesos-detail-value">{proceso.sujetosProcesales}</p>
            </section>
          ) : null}

          <section className="procesos-detail-section procesos-detail-section--tracking">
            <h3 className="procesos-detail-section-title">Seguimiento y alertas</h3>
            <p className="procesos-tracking-intro">
              {proceso.isTracked
                ? 'Recibirás notificaciones cuando haya nuevas actuaciones en este proceso.'
                : 'Activa el seguimiento para recibir alertas automáticas de nuevas actuaciones.'}
            </p>
            <button
              type="button"
              className={`procesos-tracking-button ${proceso.isTracked ? 'procesos-tracking-button-active' : ''}`}
              onClick={onToggleTracking}
              disabled={isTrackingBusy}
              aria-busy={isTrackingBusy}
            >
              {proceso.isTracked ? (
                <>
                  <NotificationsActiveIcon className="procesos-tracking-icon" aria-hidden="true" />
                  <span>{isTrackingBusy ? 'Actualizando…' : 'Quitar del seguimiento'}</span>
                </>
              ) : (
                <>
                  <NotificationsOffIcon className="procesos-tracking-icon" aria-hidden="true" />
                  <span>{isTrackingBusy ? 'Agregando…' : 'Agregar al seguimiento'}</span>
                </>
              )}
            </button>
          </section>

          <section className="procesos-detail-section procesos-detail-section--actuaciones">
            <div className="procesos-actuaciones-header">
              <div>
                <h3 className="procesos-detail-section-title">Actuaciones</h3>
                <p className="procesos-actuaciones-meta">
                  {isLoadingActuaciones
                    ? 'Cargando historial…'
                    : actuacionesError
                      ? 'No se pudo cargar el historial'
                      : `${sortedActuaciones.length} actuación${sortedActuaciones.length === 1 ? '' : 'es'} registrada${sortedActuaciones.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <button
                type="button"
                className="btn-base btn-secondary procesos-actuaciones-refresh"
                onClick={onRefreshActuaciones}
                disabled={isLoadingActuaciones}
                aria-label="Actualizar actuaciones del proceso"
              >
                <RefreshIcon aria-hidden="true" />
                <span>{isLoadingActuaciones ? 'Actualizando…' : 'Actualizar'}</span>
              </button>
            </div>

            {isLoadingActuaciones ? (
              <ListSkeleton variant="inset-row" count={3} aria-label="Cargando actuaciones" />
            ) : actuacionesError ? (
              <div className="loader finanzas-stats-error-panel">
                <p className="loader-text loader-text--error" role="alert">
                  {actuacionesError}
                </p>
                <button
                  type="button"
                  className="btn-base btn-secondary btn-retry"
                  onClick={onRefreshActuaciones}
                  aria-label="Reintentar cargar actuaciones"
                >
                  <span>Reintentar</span>
                </button>
              </div>
            ) : sortedActuaciones.length === 0 ? (
              <p className="procesos-detail-value">No hay actuaciones disponibles para este proceso.</p>
            ) : (
              <div className="procesos-actuaciones-list">
                {sortedActuaciones.map((actuacion, index) => {
                  const isLatest = index === 0
                  const anotacion = actuacion.anotacion?.trim() ?? ''
                  const isLongAnotacion = anotacion.length > ANOTACION_PREVIEW_LENGTH
                  const isExpanded = expandedActuacionIds.has(actuacion.id)
                  const visibleAnotacion =
                    isLongAnotacion && !isExpanded
                      ? `${anotacion.slice(0, ANOTACION_PREVIEW_LENGTH).trim()}…`
                      : anotacion

                  return (
                    <article
                      key={actuacion.id}
                      className={`procesos-actuacion-item${isLatest ? ' procesos-actuacion-item--latest' : ''}`}
                    >
                      <div className="procesos-actuacion-header">
                        <div className="procesos-actuacion-header-copy">
                          <span className="procesos-actuacion-numero">#{actuacion.numero}</span>
                          {isLatest ? (
                            <span className="procesos-actuacion-latest-badge">Más reciente</span>
                          ) : null}
                        </div>
                        <span className="procesos-actuacion-fecha">
                          {formatProcesoDate(actuacion.fecha)}
                          <span className="procesos-actuacion-relative">
                            {' '}
                            · {formatRelativeDate(actuacion.fecha)}
                          </span>
                        </span>
                      </div>
                      <h4 className="procesos-actuacion-tipo">{actuacion.tipo}</h4>
                      {anotacion ? (
                        <div className="procesos-actuacion-anotacion-block">
                          <p className="procesos-actuacion-anotacion">{visibleAnotacion}</p>
                          {isLongAnotacion ? (
                            <button
                              type="button"
                              className="procesos-actuacion-toggle"
                              onClick={() => toggleAnotacion(actuacion.id)}
                            >
                              {isExpanded ? 'Ver menos' : 'Ver anotación completa'}
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                      {actuacion.fechaInicial && actuacion.fechaFinal ? (
                        <p className="procesos-actuacion-fechas">
                          Período: {formatProcesoDate(actuacion.fechaInicial)} –{' '}
                          {formatProcesoDate(actuacion.fechaFinal)}
                        </p>
                      ) : null}
                      {actuacion.conDocumentos ? (
                        <span className="procesos-actuacion-documentos">Con documentos adjuntos</span>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        <div className="procesos-modal__footer">
          <button
            type="button"
            className="btn-base btn-secondary procesos-modal__btn"
            onClick={onCopyNumero}
          >
            <ContentCopyIcon aria-hidden="true" />
            <span>Copiar radicado</span>
          </button>
          <a
            href={consultaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-base btn-secondary procesos-modal__btn procesos-modal__btn--link"
          >
            <LaunchIcon aria-hidden="true" />
            <span>Ver en Rama Judicial</span>
          </a>
        </div>
      </div>
    </ModalOverlay>
  )
}

export default ProcesoDetailModal
