import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
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
  return (
    <ModalOverlay onClose={onClose} className="modal-overlay">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title-desencriptar-secreto">
            Desencriptar Secreto
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar modal" type="button">
            ×
          </button>
        </div>

        <div className="detail-content">
          <div className="detail-row">
            <span className="detail-label">Secreto</span>
            <span className="detail-value">{secret.titulo}</span>
          </div>

          {!decryptedValue ? (
            <div className="form-group">
              <label htmlFor="decrypt-password" className="form-label">
                Contraseña de Usuario
              </label>
              <input
                type="password"
                id="decrypt-password"
                value={decryptPassword}
                onChange={e => onPasswordChange(e.target.value)}
                className="form-input"
                placeholder="Ingresa tu contraseña para desencriptar"
                autoComplete="current-password"
              />
              <p className="form-hint">
                Se requiere tu contraseña de usuario para desencriptar el valor del secreto.
              </p>
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="decrypted-value" className="form-label">
                Valor Desencriptado
              </label>
              <div className="secretos-decrypted-container">
                <input
                  type={showDecryptedValue ? 'text' : 'password'}
                  id="decrypted-value"
                  value={decryptedValue}
                  readOnly
                  className="form-input secretos-decrypted-input"
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

        <div className="modal-actions">
          <button type="button" className="modal-button secondary" onClick={onClose}>
            Cerrar
          </button>
          {!decryptedValue ? (
            <button
              type="button"
              className="modal-button primary"
              onClick={onDecrypt}
              disabled={isDecrypting || !decryptPassword.trim()}
            >
              {isDecrypting ? 'Desencriptando...' : 'Desencriptar'}
            </button>
          ) : (
            <button type="button" className="modal-button primary" onClick={onDecryptAnother}>
              Desencriptar Otro
            </button>
          )}
        </div>
      </div>
    </ModalOverlay>
  )
}

export default SecretoDecryptModal
