import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import BusinessIcon from '@mui/icons-material/Business'
import ChatIcon from '@mui/icons-material/Chat'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import EditIcon from '@mui/icons-material/Edit'
import EventIcon from '@mui/icons-material/Event'
import WarningIcon from '@mui/icons-material/Warning'
import ModalOverlay from '../ModalOverlay'
import type { ProcesoContratacion } from './procesoContratacionTypes'
import {
  formatProcesoCurrency,
  formatProcesoDate,
  formatProcesoDateTime,
  getClosureReasonLabel,
  getClosureReasonTone,
  getHiringProgress,
  getProcesoEstadoColor,
  isProcesoOpen,
  isProcesoStagnant,
} from './procesoContratacionDisplayUtils'

interface ProcesoContratacionDetailModalProps {
  proceso: ProcesoContratacion
  onClose: () => void
  onEdit: () => void
  onCloseProcess?: () => void
}

function ProcesoContratacionDetailModal({
  proceso,
  onClose,
  onEdit,
  onCloseProcess,
}: ProcesoContratacionDetailModalProps) {
  const data = proceso.rawData.data || {}
  const progress = getHiringProgress(proceso)
  const stagnant = isProcesoStagnant(proceso)
  const open = isProcesoOpen(proceso)
  const closure = data.closure

  return (
    <ModalOverlay onClose={onClose} className="modal-overlay">
      <div
        className="modal-panel modal-panel-lg proceso-contratacion-detail-modal"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title-proceso-detalle"
      >
        <div className="modal-panel-header">
          <div className="proceso-contratacion-detail-modal__header-copy">
            <p className="proceso-contratacion-detail-modal__kicker">Trabajo · Proceso</p>
            <h2 className="modal-panel-title" id="modal-title-proceso-detalle">
              {proceso.titulo}
            </h2>
            <p className="proceso-contratacion-detail-modal__subtitle">
              {proceso.empresa} · {proceso.posicion}
            </p>
          </div>
          <button className="modal-panel-close" onClick={onClose} aria-label="Cerrar" type="button">
            ×
          </button>
        </div>

        <div className="modal-panel-content proceso-contratacion-detail-modal__body">
          <div className="proceso-contratacion-detail-hero">
            <div className="proceso-contratacion-detail-hero__metric">
              <span className="proceso-contratacion-detail-hero__label">Estado</span>
              <strong className="proceso-contratacion-detail-hero__value" style={{ color: getProcesoEstadoColor(proceso.estado) }}>
                {proceso.estado}
              </strong>
            </div>
            <div className="proceso-contratacion-detail-hero__metric">
              <span className="proceso-contratacion-detail-hero__label">Pipeline</span>
              <strong className="proceso-contratacion-detail-hero__value">{progress > 0 ? `${progress}%` : '—'}</strong>
            </div>
            <div className="proceso-contratacion-detail-hero__metric">
              <span className="proceso-contratacion-detail-hero__label">Apertura</span>
              <strong className="proceso-contratacion-detail-hero__value">{formatProcesoDate(proceso.fechaApertura)}</strong>
            </div>
          </div>

          {stagnant && open ? (
            <p className="proceso-contratacion-detail-alert" role="status">
              <WarningIcon aria-hidden="true" />
              Sin seguimiento reciente — considera cerrar o registrar una interacción.
            </p>
          ) : null}

          {closure ? (
            <section className="proceso-contratacion-detail-section">
              <h3 className="proceso-contratacion-detail-section__title">Cierre</h3>
              <dl className="proceso-contratacion-detail-list">
                <div className="proceso-contratacion-detail-list__item">
                  <dt>Motivo</dt>
                  <dd>
                    <span className={`proceso-contratacion-closure-badge proceso-contratacion-closure-badge--${getClosureReasonTone(closure.reason)}`}>
                      {getClosureReasonLabel(closure.reason)}
                    </span>
                  </dd>
                </div>
                <div className="proceso-contratacion-detail-list__item">
                  <dt>Fecha</dt>
                  <dd>{formatProcesoDate(closure.closedAt)}</dd>
                </div>
                {closure.notes ? (
                  <div className="proceso-contratacion-detail-list__item">
                    <dt>Notas</dt>
                    <dd>{closure.notes}</dd>
                  </div>
                ) : null}
                {closure.skillsGap && closure.skillsGap.length > 0 ? (
                  <div className="proceso-contratacion-detail-list__item">
                    <dt>Pendientes</dt>
                    <dd>{closure.skillsGap.join(', ')}</dd>
                  </div>
                ) : null}
                {closure.skillsReinforced && closure.skillsReinforced.length > 0 ? (
                  <div className="proceso-contratacion-detail-list__item">
                    <dt>Reforzadas</dt>
                    <dd>{closure.skillsReinforced.join(', ')}</dd>
                  </div>
                ) : null}
              </dl>
            </section>
          ) : null}

          {data.roleDescription ? (
            <section className="proceso-contratacion-detail-section">
              <h3 className="proceso-contratacion-detail-section__title">Rol</h3>
              <p className="proceso-contratacion-detail-text">{data.roleDescription}</p>
            </section>
          ) : null}

          {(data.contact || data.contactVia || data.hasAgency || data.payToLeadingZen) && (
            <section className="proceso-contratacion-detail-section">
              <h3 className="proceso-contratacion-detail-section__title">Contacto</h3>
              <dl className="proceso-contratacion-detail-list">
                {data.contact || data.contactVia ? (
                  <div className="proceso-contratacion-detail-list__item">
                    <dt>Canal</dt>
                    <dd>
                      {data.contact || '—'}
                      {data.contactVia ? ` · ${data.contactVia}` : ''}
                    </dd>
                  </div>
                ) : null}
                {data.hasAgency ? (
                  <div className="proceso-contratacion-detail-list__item">
                    <dt>Agencia</dt>
                    <dd>{data.agencyName || 'Sin nombre'}</dd>
                  </div>
                ) : null}
                {data.payToLeadingZen ? (
                  <div className="proceso-contratacion-detail-list__item">
                    <dt>Pago</dt>
                    <dd>Pago directo a Leading Zen SAS</dd>
                  </div>
                ) : null}
              </dl>
            </section>
          )}

          {(data.salaryRange || data.negotiatedSalary) && (
            <section className="proceso-contratacion-detail-section">
              <h3 className="proceso-contratacion-detail-section__title">Compensación</h3>
              <dl className="proceso-contratacion-detail-list">
                {data.salaryRange ? (
                  <div className="proceso-contratacion-detail-list__item">
                    <dt>Rango</dt>
                    <dd>
                      <AttachMoneyIcon fontSize="small" aria-hidden="true" />
                      {data.salaryRange.min && data.salaryRange.max
                        ? `${formatProcesoCurrency(data.salaryRange.min, data.salaryRange.currency || 'USD')} – ${formatProcesoCurrency(data.salaryRange.max, data.salaryRange.currency || 'USD')}`
                        : data.salaryRange.min
                          ? `Desde ${formatProcesoCurrency(data.salaryRange.min, data.salaryRange.currency || 'USD')}`
                          : data.salaryRange.max
                            ? `Hasta ${formatProcesoCurrency(data.salaryRange.max, data.salaryRange.currency || 'USD')}`
                            : '—'}
                    </dd>
                  </div>
                ) : null}
                {data.negotiatedSalary?.amount ? (
                  <div className="proceso-contratacion-detail-list__item">
                    <dt>Negociado</dt>
                    <dd>
                      {formatProcesoCurrency(
                        data.negotiatedSalary.amount,
                        data.negotiatedSalary.currency || 'USD'
                      )}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>
          )}

          {data.benefits && data.benefits.length > 0 ? (
            <section className="proceso-contratacion-detail-section">
              <h3 className="proceso-contratacion-detail-section__title">Beneficios</h3>
              <div className="proceso-contratacion-detail-tags">
                {data.benefits.map(benefit => (
                  <span key={benefit} className="proceso-contratacion-detail-tag">
                    {benefit}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {data.hiringSteps && data.hiringSteps.length > 0 ? (
            <section className="proceso-contratacion-detail-section">
              <h3 className="proceso-contratacion-detail-section__title">Pasos</h3>
              <ul className="proceso-contratacion-detail-steps">
                {data.hiringSteps.map(step => (
                  <li
                    key={step.step}
                    className={`proceso-contratacion-detail-step${step.completed ? ' proceso-contratacion-detail-step--done' : ''}`}
                  >
                    <CheckCircleIcon aria-hidden="true" />
                    {step.step}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.interviewDates && data.interviewDates.length > 0 ? (
            <section className="proceso-contratacion-detail-section">
              <h3 className="proceso-contratacion-detail-section__title">Entrevistas</h3>
              <ul className="proceso-contratacion-detail-steps">
                {data.interviewDates.map(interview => (
                  <li key={`${interview.date}-${interview.time}`} className="proceso-contratacion-detail-step">
                    <EventIcon aria-hidden="true" />
                    {formatProcesoDateTime(interview.date, interview.time || '00:00')}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.interactions && data.interactions.length > 0 ? (
            <section className="proceso-contratacion-detail-section">
              <h3 className="proceso-contratacion-detail-section__title">Interacciones</h3>
              <ul className="proceso-contratacion-detail-interactions">
                {data.interactions.map(interaction => (
                  <li key={`${interaction.date}-${interaction.description}`}>
                    <ChatIcon aria-hidden="true" />
                    <div>
                      <strong>{formatProcesoDate(interaction.date)}</strong>
                      <p>{interaction.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="modal-actions-base proceso-contratacion-detail-modal__footer">
          {open && onCloseProcess ? (
            <button type="button" className="btn-base btn-secondary proceso-contratacion-detail-modal__btn" onClick={onCloseProcess}>
              Cerrar proceso
            </button>
          ) : null}
          <button type="button" className="btn-base btn-accent proceso-contratacion-detail-modal__btn" onClick={onEdit}>
            <EditIcon aria-hidden="true" />
            Editar
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

export default ProcesoContratacionDetailModal
