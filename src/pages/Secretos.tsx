import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import LockIcon from '@mui/icons-material/Lock'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import './Secretos.css'

// Interfaz que coincide con la respuesta de la API (campos en inglés)
interface SecretAPI {
  id: string
  title: string
  created_at: string
  updated_at: string
}

// Interfaz para uso interno del componente
interface Secret {
  id: string
  titulo: string
  fechaCreacion: string
  fechaActualizacion: string
}

function Secretos() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isDecryptModalOpen, setIsDecryptModalOpen] = useState(false)
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null)
  const [secrets, setSecrets] = useState<Secret[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [decryptPassword, setDecryptPassword] = useState('')
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [showDecryptedValue, setShowDecryptedValue] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    titulo: '',
    valor: '',
  })
  const [formErrors, setFormErrors] = useState({
    titulo: '',
    valor: '',
  })

  // Mapear Secreto de API a formato interno
  const mapSecretFromAPI = (apiSecret: SecretAPI): Secret => {
    return {
      id: apiSecret.id,
      titulo: apiSecret.title,
      fechaCreacion: apiSecret.created_at,
      fechaActualizacion: apiSecret.updated_at,
    }
  }

  // Cargar secretos desde la API
  useEffect(() => {
    const loadSecrets = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await api.getSecrets()
        if (response.secrets && Array.isArray(response.secrets)) {
          const mappedSecrets = response.secrets.map(mapSecretFromAPI)
          setSecrets(mappedSecrets)
        } else {
          setSecrets([])
        }
      } catch (err: any) {
        console.error('Error al cargar secretos:', err)
        setError('Error al cargar los secretos. Por favor, intenta de nuevo.')
        setSecrets([])
      } finally {
        setIsLoading(false)
      }
    }

    loadSecrets()
  }, [])

  // Cerrar menú al hacer clic fuera - HIG: Clear Feedback
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isMenuOpen && !target.closest('.secretos-toolbar-menu-container')) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const handleOpenModal = () => {
    setIsModalOpen(true)
    setIsEditMode(false)
    setFormData({
      titulo: '',
      valor: '',
    })
    setFormErrors({
      titulo: '',
      valor: '',
    })
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setIsEditMode(false)
    setFormData({
      titulo: '',
      valor: '',
    })
    setFormErrors({
      titulo: '',
      valor: '',
    })
  }

  const handleOpenDetailModal = (secret: Secret) => {
    setSelectedSecret(secret)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
    setFormData({
      titulo: secret.titulo,
      valor: '',
    })
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedSecret(null)
    setIsEditMode(false)
    setIsDecryptModalOpen(false)
    setDecryptPassword('')
    setDecryptedValue(null)
    setShowDecryptedValue(false)
    setFormData({
      titulo: '',
      valor: '',
    })
    setFormErrors({
      titulo: '',
      valor: '',
    })
  }

  const handleEditClick = () => {
    setIsEditMode(true)
  }

  const handleDeleteClick = async () => {
    if (selectedSecret && window.confirm('¿Estás seguro de que quieres eliminar este secreto?')) {
      try {
        setIsLoading(true)
        await api.deleteSecret(selectedSecret.id)
        const response = await api.getSecrets()
        if (response.secrets && Array.isArray(response.secrets)) {
          const mappedSecrets = response.secrets.map(mapSecretFromAPI)
          setSecrets(mappedSecrets)
        }
        handleCloseDetailModal()
        showNotification('Secreto eliminado exitosamente', 'success')
      } catch (err: any) {
        console.error('Error al eliminar secreto:', err)
        const errorMessage = getTranslatedErrorMessage(
          err,
          'Error al eliminar el secreto. Por favor, intenta de nuevo.'
        )
        showNotification(errorMessage, 'error')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleDecryptClick = () => {
    setIsDecryptModalOpen(true)
    setIsEditMode(false)
    setDecryptPassword('')
    setDecryptedValue(null)
    setShowDecryptedValue(false)
  }

  const handleDecrypt = async () => {
    if (!selectedSecret || !decryptPassword.trim()) {
      showNotification('Por favor ingresa tu contraseña', 'warning')
      return
    }

    try {
      setIsDecrypting(true)
      const response = await api.getSecretValue(selectedSecret.id, decryptPassword.trim())
      if (response.secret && response.secret.value) {
        setDecryptedValue(response.secret.value)
        setShowDecryptedValue(true)
        showNotification('Secreto desencriptado exitosamente', 'success')
      } else {
        showNotification('No se pudo obtener el valor del secreto', 'error')
      }
    } catch (err: any) {
      console.error('Error al desencriptar secreto:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al desencriptar el secreto. Verifica tu contraseña.'
      )
      showNotification(errorMessage, 'error')
      setDecryptedValue(null)
      setShowDecryptedValue(false)
    } finally {
      setIsDecrypting(false)
    }
  }

  const handleCopyDecryptedValue = async () => {
    if (decryptedValue) {
      try {
        await navigator.clipboard.writeText(decryptedValue)
        showNotification('Valor copiado al portapapeles', 'success')
      } catch (err) {
        console.error('Error al copiar:', err)
        showNotification('Error al copiar el valor', 'error')
      }
    }
  }

  const handleCloseDecryptModal = () => {
    setIsDecryptModalOpen(false)
    setDecryptPassword('')
    setDecryptedValue(null)
    setShowDecryptedValue(false)
  }

  const validateForm = (): boolean => {
    const errors = {
      titulo: '',
      valor: '',
    }
    let isValid = true

    if (!formData.titulo.trim()) {
      errors.titulo = 'El título es requerido'
      isValid = false
    }

    if (!isEditMode && !formData.valor.trim()) {
      errors.valor = 'El valor es requerido'
      isValid = false
    }

    // En modo edición, el valor es opcional (solo se actualiza si se proporciona)
    if (isEditMode && formData.valor.trim() === '') {
      // Si no hay valor, al menos debe haber título
      if (!formData.titulo.trim()) {
        errors.titulo = 'El título es requerido'
        isValid = false
      }
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const isValid = validateForm()
    if (!isValid) {
      return
    }

    try {
      setIsLoading(true)
      if (isEditMode && selectedSecret) {
        // Editar secreto existente
        const updateData: any = {
          title: formData.titulo.trim(),
        }
        // Solo agregar value si se proporciona
        if (formData.valor.trim()) {
          updateData.value = formData.valor.trim()
        }
        await api.updateSecret(selectedSecret.id, updateData)

        const response = await api.getSecrets()
        if (response.secrets && Array.isArray(response.secrets)) {
          const mappedSecrets = response.secrets.map(mapSecretFromAPI)
          setSecrets(mappedSecrets)
        }
        handleCloseDetailModal()
        showNotification('Secreto actualizado exitosamente', 'success')
      } else {
        // Agregar nuevo secreto
        await api.createSecret({
          title: formData.titulo.trim(),
          value: formData.valor.trim(),
        })

        const response = await api.getSecrets()
        if (response.secrets && Array.isArray(response.secrets)) {
          const mappedSecrets = response.secrets.map(mapSecretFromAPI)
          setSecrets(mappedSecrets)
        }
        handleCloseModal()
        showNotification('Secreto creado exitosamente', 'success')
      }
    } catch (err: any) {
      console.error('Error al guardar secreto:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al guardar el secreto. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleDebugCreateSecrets = async () => {
    try {
      setIsLoading(true)
      const demoSecrets = [
        {
          title: 'API Key de GitHub',
          value: 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        },
        {
          title: 'Token de AWS',
          value: 'AKIAIOSFODNN7EXAMPLE',
        },
        {
          title: 'Contraseña de Base de Datos',
          value: 'MySecurePassword123!@#',
        },
        {
          title: 'API Key de OpenAI',
          value: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        },
        {
          title: 'Token de Stripe',
          value: 'sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        },
      ]

      for (const secret of demoSecrets) {
        await api.createSecret(secret)
      }

      const response = await api.getSecrets()
      if (response.secrets && Array.isArray(response.secrets)) {
        const mappedSecrets = response.secrets.map(mapSecretFromAPI)
        setSecrets(mappedSecrets)
      }
      setIsDebugModalOpen(false)
      showNotification('Secretos demo creados exitosamente', 'success')
    } catch (err: any) {
      console.error('Error al crear secretos demo:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al crear los secretos demo. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAllSecrets = async () => {
    if (
      window.confirm(
        '¿Estás seguro de que quieres eliminar TODOS los secretos? Esta acción es irreversible.'
      )
    ) {
      try {
        setIsLoading(true)
        await api.deleteAllSecrets()
        setSecrets([])
        setIsDebugModalOpen(false)
        showNotification('Todos los secretos han sido eliminados', 'success')
      } catch (err: any) {
        console.error('Error al eliminar todos los secretos:', err)
        const errorMessage = getTranslatedErrorMessage(
          err,
          'Error al eliminar los secretos. Por favor, intenta de nuevo.'
        )
        showNotification(errorMessage, 'error')
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <>
      <div className="app-page-container">
        <div className="app-page-content secretos-content">
          {/* Toolbar */}
          <div className="secretos-toolbar">
            <button
              className="secretos-toolbar-button"
              onClick={() => navigate('/registros')}
              aria-label="Volver a Registros"
              type="button"
            >
              <ArrowBackIcon className="secretos-toolbar-icon" />
            </button>
            <div className="secretos-toolbar-menu-container" ref={menuRef}>
              <button
                className="secretos-toolbar-button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Opciones"
                aria-expanded={isMenuOpen}
                type="button"
              >
                <MoreVertIcon className="secretos-toolbar-icon" />
              </button>
              {isMenuOpen && (
                <div className="secretos-menu">
                  <button
                    className="secretos-menu-item"
                    onClick={() => {
                      setIsMenuOpen(false)
                      handleOpenModal()
                    }}
                    type="button"
                  >
                    <AddIcon className="secretos-menu-icon" />
                    <span>Agregar Secreto</span>
                  </button>
                  {api.isTestUser() && (
                    <button
                      className="secretos-menu-item"
                      onClick={() => {
                        setIsMenuOpen(false)
                        setIsDebugModalOpen(true)
                      }}
                      type="button"
                    >
                      <span>🐛 Debug</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <h1 className="secretos-page-title">Secretos</h1>
          <p className="secretos-page-subtitle">
            Almacena información confidencial de forma segura
          </p>

          {/* Lista de Secretos */}
          <div className="secretos-list">
            {isLoading ? (
              <div className="secretos-loading">
                <p className="secretos-loading-text">Cargando secretos...</p>
              </div>
            ) : secrets.length === 0 ? (
              <div className="secretos-empty">
                <LockIcon className="secretos-empty-icon" />
                <p className="secretos-empty-text">No hay secretos registrados</p>
                <button className="secretos-empty-button" onClick={handleOpenModal} type="button">
                  <AddIcon />
                  <span>Agregar</span>
                </button>
              </div>
            ) : (
              <div className="secretos-group">
                {secrets.map(secret => (
                  <button
                    key={secret.id}
                    className="secretos-row"
                    onClick={() => handleOpenDetailModal(secret)}
                    type="button"
                  >
                    <div className="secretos-row-content">
                      <div className="secretos-row-header">
                        <h3 className="secretos-row-title">{secret.titulo}</h3>
                        <ChevronRightIcon className="secretos-row-chevron" aria-hidden="true" />
                      </div>
                      <p className="secretos-row-date">
                        {secret.fechaCreacion === secret.fechaActualizacion
                          ? `Creado: ${formatDate(secret.fechaCreacion)}`
                          : `Actualizado: ${formatDate(secret.fechaActualizacion)}`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botón flotante para agregar */}
          {secrets.length > 0 && (
            <button
              className="secretos-fab"
              onClick={handleOpenModal}
              aria-label="Agregar Secreto"
              type="button"
            >
              <AddIcon />
            </button>
          )}
        </div>
      </div>

      {/* Modal para crear/editar Secreto */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nuevo Secreto</h2>
              <button
                className="modal-close"
                onClick={handleCloseModal}
                aria-label="Cerrar modal"
                type="button"
              >
                ×
              </button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="titulo" className="form-label">
                  Título
                </label>
                <input
                  type="text"
                  id="titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  className={`form-input ${formErrors.titulo ? 'input-error' : ''}`}
                  placeholder="Ej: API Key de GitHub"
                  required
                />
                {formErrors.titulo && (
                  <span className="error-message" role="alert">
                    {formErrors.titulo}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="valor" className="form-label">
                  Valor
                </label>
                <input
                  type="password"
                  id="valor"
                  name="valor"
                  value={formData.valor}
                  onChange={handleChange}
                  className={`form-input ${formErrors.valor ? 'input-error' : ''}`}
                  placeholder="Ingresa el valor del secreto"
                  required
                />
                {formErrors.valor && (
                  <span className="error-message" role="alert">
                    {formErrors.valor}
                  </span>
                )}
                <p className="form-hint">
                  ⚠️ El valor se hasheará automáticamente y no podrá recuperarse después de
                  guardarlo.
                </p>
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-button secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="modal-button primary" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalle */}
      {isDetailModalOpen && selectedSecret && !isEditMode && !isDecryptModalOpen && (
        <div className="modal-overlay" onClick={handleCloseDetailModal}>
          <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedSecret.titulo}</h2>
              <button
                className="modal-close"
                onClick={handleCloseDetailModal}
                aria-label="Cerrar modal"
                type="button"
              >
                ×
              </button>
            </div>

            <div className="detail-content">
              <div className="detail-section">
                <div className="detail-info">
                  <h3 className="detail-name">{selectedSecret.titulo}</h3>
                </div>
              </div>

              <div className="detail-row">
                <span className="detail-label">Título</span>
                <span className="detail-value">{selectedSecret.titulo}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Fecha de Creación</span>
                <span className="detail-value">{formatDate(selectedSecret.fechaCreacion)}</span>
              </div>

              {selectedSecret.fechaCreacion !== selectedSecret.fechaActualizacion && (
                <div className="detail-row">
                  <span className="detail-label">Última Actualización</span>
                  <span className="detail-value">
                    {formatDate(selectedSecret.fechaActualizacion)}
                  </span>
                </div>
              )}
            </div>

            <div className="detail-actions">
              <button
                type="button"
                className="detail-action-button"
                onClick={handleDecryptClick}
                aria-label="Desencriptar Secreto"
              >
                <LockOpenIcon />
                <span>Desencriptar</span>
              </button>
              <button
                type="button"
                className="detail-action-button"
                onClick={handleEditClick}
                aria-label="Editar Secreto"
              >
                <EditIcon />
                <span>Editar</span>
              </button>
              <button
                type="button"
                className="detail-action-button danger"
                onClick={handleDeleteClick}
                aria-label="Eliminar Secreto"
              >
                <DeleteIcon />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Desencriptación */}
      {isDetailModalOpen && selectedSecret && isDecryptModalOpen && (
        <div className="modal-overlay" onClick={handleCloseDetailModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Desencriptar Secreto</h2>
              <button
                className="modal-close"
                onClick={handleCloseDetailModal}
                aria-label="Cerrar modal"
                type="button"
              >
                ×
              </button>
            </div>

            <div className="detail-content">
              <div className="detail-row">
                <span className="detail-label">Secreto</span>
                <span className="detail-value">{selectedSecret.titulo}</span>
              </div>

              {!decryptedValue ? (
                <>
                  <div className="form-group">
                    <label htmlFor="decrypt-password" className="form-label">
                      Contraseña de Usuario
                    </label>
                    <input
                      type="password"
                      id="decrypt-password"
                      value={decryptPassword}
                      onChange={e => setDecryptPassword(e.target.value)}
                      className="form-input"
                      placeholder="Ingresa tu contraseña para desencriptar"
                      autoComplete="current-password"
                    />
                    <p className="form-hint">
                      Se requiere tu contraseña de usuario para desencriptar el valor del secreto.
                    </p>
                  </div>
                </>
              ) : (
                <>
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
                          onClick={() => setShowDecryptedValue(!showDecryptedValue)}
                          aria-label={showDecryptedValue ? 'Ocultar valor' : 'Mostrar valor'}
                        >
                          {showDecryptedValue ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </button>
                        <button
                          type="button"
                          className="secretos-decrypted-action-button"
                          onClick={handleCopyDecryptedValue}
                          aria-label="Copiar valor"
                        >
                          <ContentCopyIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-button secondary"
                onClick={handleCloseDetailModal}
              >
                Cerrar
              </button>
              {!decryptedValue ? (
                <button
                  type="button"
                  className="modal-button primary"
                  onClick={handleDecrypt}
                  disabled={isDecrypting || !decryptPassword.trim()}
                >
                  {isDecrypting ? 'Desencriptando...' : 'Desencriptar'}
                </button>
              ) : (
                <button
                  type="button"
                  className="modal-button primary"
                  onClick={() => {
                    setDecryptedValue(null)
                    setDecryptPassword('')
                    setShowDecryptedValue(false)
                  }}
                >
                  Desencriptar Otro
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {isDetailModalOpen && selectedSecret && isEditMode && !isDecryptModalOpen && (
        <div className="modal-overlay edit-modal-overlay" onClick={handleCloseDetailModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Editar Secreto</h2>
              <button
                className="modal-close"
                onClick={handleCloseDetailModal}
                aria-label="Cerrar modal"
                type="button"
              >
                ×
              </button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="edit-titulo" className="form-label">
                  Título
                </label>
                <input
                  type="text"
                  id="edit-titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  className={`form-input ${formErrors.titulo ? 'input-error' : ''}`}
                  placeholder="Ej: API Key de GitHub"
                  required
                />
                {formErrors.titulo && (
                  <span className="error-message" role="alert">
                    {formErrors.titulo}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="edit-valor" className="form-label">
                  Nuevo Valor (Opcional)
                </label>
                <input
                  type="password"
                  id="edit-valor"
                  name="valor"
                  value={formData.valor}
                  onChange={handleChange}
                  className={`form-input ${formErrors.valor ? 'input-error' : ''}`}
                  placeholder="Deja vacío para mantener el valor actual"
                />
                {formErrors.valor && (
                  <span className="error-message" role="alert">
                    {formErrors.valor}
                  </span>
                )}
                <p className="form-hint">
                  ⚠️ Si proporcionas un nuevo valor, se hasheará y reemplazará el anterior. Deja
                  vacío para mantener el valor actual.
                </p>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-button secondary"
                  onClick={handleCloseDetailModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="modal-button primary" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Debug */}
      {isDebugModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDebugModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Debug - Secretos</h2>
              <button
                className="modal-close"
                onClick={() => setIsDebugModalOpen(false)}
                aria-label="Cerrar modal"
                type="button"
              >
                ×
              </button>
            </div>
            <div className="debug-modal-content">
              <div className="debug-options">
                <button
                  className="debug-option-button create-demo"
                  onClick={handleDebugCreateSecrets}
                  disabled={isLoading}
                  type="button"
                >
                  <span className="debug-option-icon">📦</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Crear Secretos Demo</h3>
                    <p className="debug-option-description">
                      Crea 5 secretos de ejemplo para pruebas
                    </p>
                  </div>
                </button>
                <button
                  className="debug-option-button delete-all"
                  onClick={handleDeleteAllSecrets}
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
              <button
                type="button"
                className="modal-button secondary"
                onClick={() => setIsDebugModalOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Secretos
