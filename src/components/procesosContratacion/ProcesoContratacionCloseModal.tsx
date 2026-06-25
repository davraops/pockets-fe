import { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import ModalOverlay from '../ModalOverlay'
import {
  CLOSURE_REASON_OPTIONS,
  type ProcesoClosureReason,
  type ProcesoContratacion,
} from './procesoContratacionTypes'
import { isProcesoStagnant } from './procesoContratacionDisplayUtils'

interface ProcesoContratacionCloseModalProps {
  proceso: ProcesoContratacion
  isSaving: boolean
  onClose: () => void
  onConfirm: (payload: {
    reason: ProcesoClosureReason
    notes: string
    skillsGap: string[]
  }) => void
}

function ProcesoContratacionCloseModal({
  proceso,
  isSaving,
  onClose,
  onConfirm,
}: ProcesoContratacionCloseModalProps) {
  const stagnant = isProcesoStagnant(proceso)
  const [reason, setReason] = useState<ProcesoClosureReason>(stagnant ? 'estancado' : 'otro')
  const [notes, setNotes] = useState('')
  const [newSkill, setNewSkill] = useState('')
  const [skillsGap, setSkillsGap] = useState<string[]>([])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (reason === 'skills' && skillsGap.length === 0) {
      return
    }
    onConfirm({ reason, notes, skillsGap })
  }

  const handleAddSkill = () => {
    const skill = newSkill.trim()
    if (!skill || skillsGap.some(item => item.toLowerCase() === skill.toLowerCase())) {
      return
    }
    setSkillsGap(current => [...current, skill])
    setNewSkill('')
  }

  return (
    <ModalOverlay onClose={onClose} className="modal-overlay">
      <div
        className="modal-panel proceso-contratacion-close-modal"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title-cerrar-proceso"
      >
        <div className="modal-panel-header">
          <div className="proceso-contratacion-close-modal__header-copy">
            <p className="proceso-contratacion-close-modal__kicker">Trabajo · Cierre</p>
            <h2 className="modal-panel-title" id="modal-title-cerrar-proceso">
              Cerrar proceso
            </h2>
            <p className="proceso-contratacion-close-modal__subtitle">
              {proceso.titulo} · {proceso.empresa}
            </p>
          </div>
          <button className="modal-panel-close" onClick={onClose} aria-label="Cerrar" type="button">
            ×
          </button>
        </div>

        <form className="modal-panel-content proceso-contratacion-close-modal__body" onSubmit={handleSubmit}>
          {stagnant ? (
            <p className="proceso-contratacion-close-modal__hint" role="status">
              Este proceso lleva más de una semana sin seguimiento reciente.
            </p>
          ) : null}

          <fieldset className="proceso-contratacion-close-modal__reasons">
            <legend className="proceso-contratacion-close-modal__legend">Motivo de cierre</legend>
            <div className="proceso-contratacion-close-modal__reason-grid">
              {CLOSURE_REASON_OPTIONS.map(option => (
                <label
                  key={option.id}
                  className={`proceso-contratacion-close-modal__reason${reason === option.id ? ' proceso-contratacion-close-modal__reason--active' : ''}`}
                >
                  <input
                    type="radio"
                    name="closure-reason"
                    value={option.id}
                    checked={reason === option.id}
                    onChange={() => setReason(option.id)}
                  />
                  <span className="proceso-contratacion-close-modal__reason-label">{option.label}</span>
                  <span className="proceso-contratacion-close-modal__reason-desc">{option.description}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {reason === 'skills' ? (
            <div className="form-group-base form-group-base--compact">
              <label htmlFor="closure-skill" className="form-label-base">
                Skills a reforzar *
              </label>
              <div className="proceso-contratacion-close-modal__skill-input">
                <input
                  id="closure-skill"
                  type="text"
                  value={newSkill}
                  onChange={event => setNewSkill(event.target.value)}
                  className="form-input-base"
                  placeholder="Ej: Kubernetes, System design"
                  onKeyDown={event => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleAddSkill()
                    }
                  }}
                />
                <button type="button" className="btn-base btn-secondary" onClick={handleAddSkill}>
                  <AddIcon aria-hidden="true" />
                  Agregar
                </button>
              </div>
              {skillsGap.length > 0 ? (
                <div className="proceso-contratacion-close-modal__skill-tags">
                  {skillsGap.map(skill => (
                    <span key={skill} className="proceso-contratacion-close-modal__skill-tag">
                      {skill}
                      <button
                        type="button"
                        aria-label={`Quitar ${skill}`}
                        onClick={() => setSkillsGap(current => current.filter(item => item !== skill))}
                      >
                        <CloseIcon fontSize="inherit" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="proceso-contratacion-close-modal__hint">
                  Anota al menos una skill para retomarla después.
                </p>
              )}
            </div>
          ) : null}

          <div className="form-group-base form-group-base--compact">
            <label htmlFor="closure-notes" className="form-label-base">
              Notas (opcional)
            </label>
            <textarea
              id="closure-notes"
              value={notes}
              onChange={event => setNotes(event.target.value)}
              className="form-textarea-base"
              rows={3}
              placeholder="Contexto adicional del cierre"
            />
          </div>

          <div className="modal-actions-base proceso-contratacion-close-modal__footer">
            <button type="button" className="btn-base btn-secondary" onClick={onClose} disabled={isSaving}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-base btn-accent"
              disabled={isSaving || (reason === 'skills' && skillsGap.length === 0)}
            >
              {isSaving ? 'Cerrando…' : 'Confirmar cierre'}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  )
}

export default ProcesoContratacionCloseModal
