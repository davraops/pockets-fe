import { useState } from 'react'
import LockIcon from '@mui/icons-material/Lock'
import ModalOverlay from '../ModalOverlay'
import { maskPasswordPreview } from '../../utils/generadorContrasenasUtils'

interface GeneradorGuardarSecretoModalProps {
  password: string
  isSaving: boolean
  onClose: () => void
  onSave: (title: string) => void
}

function GeneradorGuardarSecretoModal({
  password,
  isSaving,
  onClose,
  onSave,
}: GeneradorGuardarSecretoModalProps) {
  const [titulo, setTitulo] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = titulo.trim()
    if (!trimmed) {
      setError('El título es requerido')
      return
    }
    onSave(trimmed)
  }

  return (
    <ModalOverlay onClose={onClose} className="modal-overlay">
      <div
        className="modal-panel generador-save-modal"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title-guardar-secreto"
      >
        <div className="generador-save-modal__header">
          <div className="generador-save-modal__header-copy">
            <p className="generador-save-modal__kicker">Vault · Guardar</p>
            <h2 className="modal-panel-title" id="modal-title-guardar-secreto">
              Guardar en Secretos
            </h2>
          </div>
          <button className="modal-panel-close" onClick={onClose} aria-label="Cerrar" type="button">
            ×
          </button>
        </div>

        <form className="generador-save-modal__form" onSubmit={handleSubmit} noValidate>
          <div className="modal-panel-content generador-save-modal__body">
            <div className="generador-save-modal__preview" aria-label="Vista previa de la contraseña">
              <LockIcon className="generador-save-modal__preview-icon" aria-hidden />
              <code className="generador-save-modal__preview-value">
                {maskPasswordPreview(password)}
              </code>
              <span className="generador-save-modal__preview-meta">{password.length} caracteres</span>
            </div>

            <div className="form-group-base">
              <label htmlFor="generador-secreto-titulo" className="form-label-base">
                Título del secreto
              </label>
              <input
                type="text"
                id="generador-secreto-titulo"
                name="titulo"
                value={titulo}
                onChange={event => {
                  setTitulo(event.target.value)
                  if (error) {
                    setError('')
                  }
                }}
                className={`form-input-base form-input-base--comfortable${error ? ' input-error' : ''}`}
                placeholder="Ej: Netflix, Wi-Fi casa, API Key"
                autoFocus
                aria-invalid={!!error}
                {...(error ? { 'aria-describedby': 'generador-secreto-titulo-error' } : {})}
              />
              {error ? (
                <span id="generador-secreto-titulo-error" className="error-message" role="alert">
                  {error}
                </span>
              ) : null}
              <p className="generador-save-modal__callout">
                Se cifrará en tu vault. Para verla después, desencripta con tu contraseña de Pockets.
              </p>
            </div>
          </div>

          <div className="modal-actions-base generador-save-modal__footer">
            <button
              type="button"
              className="btn-base btn-secondary generador-save-modal__btn"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-base generador-save-modal__btn generador-save-modal__btn--submit"
              disabled={isSaving}
            >
              {isSaving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  )
}

export default GeneradorGuardarSecretoModal
