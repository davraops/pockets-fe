import { useState } from 'react'
import { api } from '../../services/api'
import { useNotification } from '../../contexts/NotificationContext'
import { useConfirm } from '../../contexts/ConfirmContext'
import { devError, isDebugToolsEnabled, isDestructiveDebugEnabled } from '../../utils/debugTools'
import { getTranslatedErrorMessage } from '../../utils/errorTranslations'
import ModalOverlay from '../ModalOverlay'
import { DEMO_SECRETS } from './secretoDemoData'

interface SecretoDebugModalProps {
  onClose: () => void
  onReload: () => Promise<void>
  onClearList: () => void
}

function SecretoDebugModal({ onClose, onReload, onClearList }: SecretoDebugModalProps) {
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateDemo = async () => {
    if (!isDebugToolsEnabled()) {
      return
    }

    try {
      setIsLoading(true)
      for (const secret of DEMO_SECRETS) {
        await api.createSecret(secret)
      }
      await onReload()
      onClose()
      showNotification('Secretos demo creados exitosamente', 'success')
    } catch (err: unknown) {
      devError('Error al crear secretos demo:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al crear los secretos demo. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAll = async () => {
    if (!isDestructiveDebugEnabled()) {
      return
    }
    if (
      !(await confirm({
        message:
          '¿Estás seguro de que quieres eliminar TODOS los secretos? Esta acción es irreversible.',
        variant: 'danger',
      }))
    ) {
      return
    }

    try {
      setIsLoading(true)
      await api.deleteAllSecrets()
      onClearList()
      onClose()
      showNotification('Todos los secretos han sido eliminados', 'success')
    } catch (err: unknown) {
      devError('Error al eliminar todos los secretos:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar los secretos. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ModalOverlay onClose={onClose} className="modal-overlay">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title-debug-secretos">
            Debug - Secretos
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar modal" type="button">
            ×
          </button>
        </div>
        <div className="modal-panel-content">
          <div className="debug-options">
            <button
              className="debug-option-button create-demo"
              onClick={() => void handleCreateDemo()}
              disabled={isLoading}
              type="button"
            >
              <span className="debug-option-icon">📦</span>
              <div className="debug-option-info">
                <h3 className="debug-option-title">Crear Secretos Demo</h3>
                <p className="debug-option-description">Crea 5 secretos de ejemplo para pruebas</p>
              </div>
            </button>
            <button
              className="debug-option-button delete-all"
              onClick={() => void handleDeleteAll()}
              disabled={isLoading}
              type="button"
            >
              <span className="debug-option-icon">🗑️</span>
              <div className="debug-option-info">
                <h3 className="debug-option-title">Eliminar Todos los Secretos</h3>
                <p className="debug-option-description">
                  ⚠️ PELIGROSO: Elimina todos los secretos (IRREVERSIBLE)
                </p>
              </div>
            </button>
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="modal-button secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

export default SecretoDebugModal
