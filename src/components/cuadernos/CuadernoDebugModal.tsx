import { useState } from 'react'
import { api } from '../../services/api'
import { useNotification } from '../../contexts/NotificationContext'
import { useConfirm } from '../../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../../utils/errorTranslations'
import { isDebugToolsEnabled, isDestructiveDebugEnabled } from '../../utils/debugTools'
import ModalOverlay from '../ModalOverlay'
import { DEMO_CUADERNO_NOTES } from './cuadernoDemoData'

interface CuadernoDebugModalProps {
  onClose: () => void
  onReload: () => Promise<void>
  onClearList: () => void
}

function CuadernoDebugModal({ onClose, onReload, onClearList }: CuadernoDebugModalProps) {
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateDemo = async () => {
    if (!isDebugToolsEnabled()) {
      return
    }

    try {
      setIsLoading(true)
      for (const note of DEMO_CUADERNO_NOTES) {
        await api.createNote(note)
      }
      await onReload()
      onClose()
      showNotification('Notas demo creadas exitosamente', 'success')
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al crear las notas demo. Por favor, intenta de nuevo.'
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
        message: '¿Estás seguro de que quieres eliminar TODAS las notas? Esta acción es irreversible.',
        variant: 'danger',
      }))
    ) {
      return
    }

    try {
      setIsLoading(true)
      await api.deleteAllNotes()
      onClearList()
      onClose()
      showNotification('Todas las notas han sido eliminadas', 'success')
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar las notas. Por favor, intenta de nuevo.'
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
          <h2 className="modal-title" id="modal-title-debug-cuadernos">
            Debug - Cuadernos
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
                <h3 className="debug-option-title">Crear Notas Demo</h3>
                <p className="debug-option-description">Crea 5 notas de ejemplo para pruebas</p>
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
                <h3 className="debug-option-title">Eliminar Todas las Notas</h3>
                <p className="debug-option-description">
                  ⚠️ PELIGROSO: Elimina todas las notas (IRREVERSIBLE)
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

export default CuadernoDebugModal
