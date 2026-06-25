import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import ModalOverlay from '../ModalOverlay'
import type { Secret } from './secretosTypes'

interface SecretoDecryptModalProps {
  secret: Secret
  decryptPassword: string
  decryptedValue: string | null
  showDecryptedValue: boolean
  isDecrypting: boolean
  onPasswordChange: (value: string) => void
  onDecrypt: () => void
  onToggleShow: () => void
  onCopy: () => void
  onDecryptAnother: () => void
  onClose: () => void
}

function SecretoDecryptModal({
  secret,
  decryptPassword,
  decryptedValue,
  showDecryptedValue,
  isDecrypting,
  onPasswordChange,
  onDecrypt,
  onToggleShow,
  onCopy,
  onDecryptAnother,
  onClose,
}: SecretoDecryptModalProps) {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!decryptedValue && decryptPassword.trim() && !isDecrypting) {
      onDecrypt()
    }
  }

  return (
    <ModalOverlay onClose={onClose} className="modal-overlay">
      <div
        className="modal-panel secretos-modal"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title-desencriptar-secreto"
      >
        <div className="secretos-modal__header">
          <div className="secretos-modal__header-copy">
            <p className="secretos-modal__kicker">Vault · Cifrado</p>
            <h2 className="modal-panel-title" id="modal-title-desencriptar-secreto">
              Desencriptar secreto
            </h2>
            <p className="secretos-modal__subtitle">{secret.titulo}</p>
          </div>
          <button className="modal-panel-close" onClick={onClose} aria-label="Cerrar" type="button">
            ×
          </button>
        </div>

        <form className="secretos-modal__form" onSubmit={handleSubmit} noValidate>
          <div className="modal-panel-content secretos-modal__body">
            {!decryptedValue ? (
              <div className="form-group-base">
                <label htmlFor="decrypt-password" className="form-label-base">
                  Contraseña de usuario
                </label>
                <input
                  type="password"
                  id="decrypt-password"
                  value={decryptPassword}
                  onChange={event => onPasswordChange(event.target.value)}
                  className="form-input-base form-input-base--comfortable"
                  placeholder="Tu contraseña de Pockets"
                  autoComplete="current-password"
                  autoFocus
                />
                <p className="secretos-modal__hint">
                  Necesitamos verificar tu identidad antes de revelar el valor guardado.
                </p>
              </div>
            ) : (
              <div className="form-group-base">
                <label htmlFor="decrypted-value" className="form-label-base">
                  Valor desencriptado
                </label>
                <div className="secretos-decrypted-container">
                  <input
                    type={showDecryptedValue ? 'text' : 'password'}
                    id="decrypted-value"
                    value={decryptedValue}
                    readOnly
                    className="form-input-base form-input-base--comfortable secretos-decrypted-input"
                  />
                  <div className="secretos-decrypted-actions">
                    <button
                      type="button"
                      className="secretos-decrypted-action-button"
                      onClick={onToggleShow}
                      aria-label={showDecryptedValue ? 'Ocultar valor' : 'Mostrar valor'}
                    >
                      {showDecryptedValue ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </button>
                    <button
                      type="button"
                      className="secretos-decrypted-action-button"
                      onClick={onCopy}
                      aria-label="Copiar valor"
                    >
                      <ContentCopyIcon />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions-base secretos-modal__footer">
            <button type="button" className="btn-base btn-secondary secretos-modal__btn" onClick={onClose}>
              Cerrar
            </button>
            {!decryptedValue ? (
              <button
                type="submit"
                className="btn-base btn-danger secretos-modal__btn"
                disabled={isDecrypting || !decryptPassword.trim()}
              >
                <LockOpenIcon aria-hidden="true" />
                {isDecrypting ? 'Desencriptando…' : 'Desencriptar'}
              </button>
            ) : (
              <button
                type="button"
                className="btn-base btn-danger secretos-modal__btn"
                onClick={onDecryptAnother}
              >
                Desencriptar otro
              </button>
            )}
          </div>
        </form>
      </div>
    </ModalOverlay>
  )
}

export default SecretoDecryptModal
