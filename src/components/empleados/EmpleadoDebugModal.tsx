import { useState } from 'react'
import { api } from '../../services/api'
import { useNotification } from '../../contexts/NotificationContext'
import { useConfirm } from '../../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../../utils/errorTranslations'
import { isDestructiveDebugEnabled } from '../../utils/debugTools'
import ModalOverlay from '../ModalOverlay'
import { DEMO_EMPLOYEES } from './employeeDemoData'

interface EmpleadoDebugModalProps {
  onClose: () => void
  onReload: () => Promise<void>
  onClearList: () => void
}

function EmpleadoDebugModal({ onClose, onReload, onClearList }: EmpleadoDebugModalProps) {
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateDemo = async () => {
    try {
      setIsLoading(true)
      for (const emp of DEMO_EMPLOYEES) {
        await api.createEmployee({ name: emp.name, data: emp.data })
      }
      showNotification(`${DEMO_EMPLOYEES.length} empleados demo creados exitosamente`, 'success')
      await onReload()
      onClose()
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al crear los empleados demo. Por favor, intenta de nuevo.'
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
          '¿Estás seguro de que quieres eliminar TODOS los registros de empleados? Esta acción es irreversible.',
        variant: 'danger',
      }))
    ) {
      return
    }

    try {
      setIsLoading(true)
      await api.deleteAllEmployees()
      showNotification('Todos los registros de empleados han sido eliminados', 'success')
      onClearList()
      await onReload()
      onClose()
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar los registros. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ModalOverlay onClose={onClose} className="modal-overlay">
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-panel-header">
          <h2 className="modal-panel-title" id="modal-panel-title-debug-empleados">
            🐛 Debug - Empleados
          </h2>
          <button className="modal-panel-close" onClick={onClose} aria-label="Cerrar" type="button">
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
                <h3 className="debug-option-title">Crear Empleados Demo</h3>
                <p className="debug-option-description">
                  Crea 3 empleados de ejemplo con diferentes configuraciones
                </p>
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
                <h3 className="debug-option-title">Eliminar Todos los Registros</h3>
                <p className="debug-option-description">
                  Elimina todos los registros de empleados guardados (irreversible)
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  )
}

export default EmpleadoDebugModal
