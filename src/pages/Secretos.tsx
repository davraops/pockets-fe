import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import AddIcon from '@mui/icons-material/Add'
import LockIcon from '@mui/icons-material/Lock'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SearchIcon from '@mui/icons-material/Search'
import { api } from '../services/api'
import CrudSummaryStrip from '../components/crud/CrudSummaryStrip'
import CrudListPanel from '../components/crud/CrudListPanel'
import SecretoFormModal from '../components/secretos/SecretoFormModal'
import SecretoDetailModal from '../components/secretos/SecretoDetailModal'
import SecretoDecryptModal from '../components/secretos/SecretoDecryptModal'
import SecretoListRow from '../components/secretos/SecretoListRow'
import SecretoDebugModal from '../components/secretos/SecretoDebugModal'
import {
  EMPTY_SECRETO_FORM,
  EMPTY_SECRETO_FORM_ERRORS,
  formDataToCreatePayload,
  formDataToUpdatePayload,
  secretToFormData,
  validateSecretoForm,
  type SecretoFormData,
  type SecretoFormErrors,
} from '../components/secretos/secretoFormUtils'
import {
  calculateSecretoHighlights,
  filterSecretsByQuery,
  secretoSummaryItems,
  sortSecretsByRecent,
} from '../components/secretos/secretoDisplayUtils'
import type { Secret } from '../components/secretos/secretosTypes'
import { mapSecretsFromAPI } from '../components/secretos/secretosTypes'
import { devError, isDebugToolsEnabled } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import UtilidadesSubHeader from '../components/utilidades/UtilidadesSubHeader'
import './AppPage.css'
import './Secretos.css'

function Secretos() {
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isDecryptModalOpen, setIsDecryptModalOpen] = useState(false)
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null)
  const [secrets, setSecrets] = useState<Secret[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [decryptPassword, setDecryptPassword] = useState('')
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [showDecryptedValue, setShowDecryptedValue] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const tituloRef = useRef<HTMLInputElement>(null)
  const valorRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<SecretoFormData>(EMPTY_SECRETO_FORM)
  const [formErrors, setFormErrors] = useState<SecretoFormErrors>(EMPTY_SECRETO_FORM_ERRORS)
  const [searchQuery, setSearchQuery] = useState('')
  const [openedViaQuickDecrypt, setOpenedViaQuickDecrypt] = useState(false)

  const loadSecrets = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.getSecrets()
      if (response.secrets && Array.isArray(response.secrets)) {
        setSecrets(mapSecretsFromAPI(response.secrets))
      } else {
        setSecrets([])
      }
    } catch (err: unknown) {
      devError('Error al cargar secretos:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al cargar los secretos. Por favor, intenta de nuevo.'
      )
      setError(errorMessage)
      setSecrets([])
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }, [showNotification])

  useEffect(() => {
    void loadSecrets()
  }, [loadSecrets])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  const resetForm = () => {
    setFormData(EMPTY_SECRETO_FORM)
    setFormErrors(EMPTY_SECRETO_FORM_ERRORS)
  }

  const resetDecryptState = () => {
    setIsDecryptModalOpen(false)
    setDecryptPassword('')
    setDecryptedValue(null)
    setShowDecryptedValue(false)
  }

  const handleCloseDecryptModal = () => {
    resetDecryptState()
    if (openedViaQuickDecrypt) {
      setIsDetailModalOpen(false)
      setSelectedSecret(null)
      setOpenedViaQuickDecrypt(false)
    }
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
    setIsEditMode(false)
    resetForm()
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setIsEditMode(false)
    resetForm()
  }

  const handleOpenDetailModal = (secret: Secret) => {
    setSelectedSecret(secret)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
    setOpenedViaQuickDecrypt(false)
    resetDecryptState()
    setFormData(secretToFormData(secret))
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedSecret(null)
    setIsEditMode(false)
    setOpenedViaQuickDecrypt(false)
    resetDecryptState()
    resetForm()
  }

  const handleEditClick = () => {
    resetDecryptState()
    setOpenedViaQuickDecrypt(false)
    setIsEditMode(true)
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setFormErrors(EMPTY_SECRETO_FORM_ERRORS)
    if (selectedSecret) {
      setFormData(secretToFormData(selectedSecret))
    }
  }

  const handleDeleteClick = async () => {
    if (
      !selectedSecret ||
      !(await confirm({
        message: '¿Estás seguro de que quieres eliminar este secreto?',
        variant: 'danger',
      }))
    ) {
      return
    }

    try {
      setIsSaving(true)
      await api.deleteSecret(selectedSecret.id)
      await loadSecrets()
      handleCloseDetailModal()
      showNotification('Secreto eliminado exitosamente', 'success')
    } catch (err: unknown) {
      devError('Error al eliminar secreto:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar el secreto. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDecryptClick = () => {
    setOpenedViaQuickDecrypt(false)
    setIsDecryptModalOpen(true)
    setIsEditMode(false)
    setDecryptPassword('')
    setDecryptedValue(null)
    setShowDecryptedValue(false)
  }

  const handleQuickDecrypt = (secret: Secret) => {
    setSelectedSecret(secret)
    setIsDetailModalOpen(true)
    setOpenedViaQuickDecrypt(true)
    setIsEditMode(false)
    setIsDecryptModalOpen(true)
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
    } catch (err: unknown) {
      devError('Error al desencriptar secreto:', err)
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
    if (!decryptedValue) {
      return
    }

    try {
      await navigator.clipboard.writeText(decryptedValue)
      showNotification('Valor copiado al portapapeles', 'success')
    } catch (err) {
      devError('Error al copiar:', err)
      showNotification('Error al copiar el valor', 'error')
    }
  }

  const handleDecryptAnother = () => {
    setDecryptedValue(null)
    setDecryptPassword('')
    setShowDecryptedValue(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name as keyof SecretoFormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const mode = isEditMode ? 'edit' : 'create'
    const { isValid, errors } = validateSecretoForm(formData, mode)
    setFormErrors(errors)
    if (!isValid) {
      queueMicrotask(() => {
        if (errors.titulo) {
          tituloRef.current?.focus()
        } else if (errors.valor) {
          valorRef.current?.focus()
        }
      })
      return
    }

    try {
      setIsSaving(true)
      if (isEditMode && selectedSecret) {
        await api.updateSecret(selectedSecret.id, formDataToUpdatePayload(formData))
        await loadSecrets()
        handleCloseDetailModal()
        showNotification('Secreto actualizado exitosamente', 'success')
      } else {
        await api.createSecret(formDataToCreatePayload(formData))
        await loadSecrets()
        handleCloseModal()
        showNotification('Secreto creado exitosamente', 'success')
      }
    } catch (err: unknown) {
      devError('Error al guardar secreto:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al guardar el secreto. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const highlights = calculateSecretoHighlights(secrets)
  const sortedSecrets = useMemo(() => sortSecretsByRecent(secrets), [secrets])
  const filteredSecrets = useMemo(
    () => filterSecretsByQuery(sortedSecrets, searchQuery),
    [sortedSecrets, searchQuery]
  )
  const hasSearch = searchQuery.trim().length > 0

  return (
    <>
      <div className="app-page-container">
        <div className="app-page-content app-page-content-wide crud-page-content secretos-content utilidades-sub-content">
          <UtilidadesSubHeader
            title="Secretos"
            context="Vault"
            meta={
              !isLoading && !error
                ? hasSearch
                  ? `${filteredSecrets.length} de ${secrets.length} guardado${secrets.length !== 1 ? 's' : ''}`
                  : `${secrets.length} guardado${secrets.length !== 1 ? 's' : ''}`
                : undefined
            }
            toolbarActions={
              isDebugToolsEnabled() ? (
                <div className="utilidades-sub-menu-container" ref={menuRef}>
                  <button
                    type="button"
                    className="app-toolbar-button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Opciones de depuración"
                    aria-expanded={isMenuOpen}
                  >
                    <MoreVertIcon className="app-toolbar-icon" />
                  </button>
                  {isMenuOpen && (
                    <div className="utilidades-sub-menu">
                      <button
                        type="button"
                        className="utilidades-sub-menu-item"
                        onClick={() => {
                          setIsDebugModalOpen(true)
                          setIsMenuOpen(false)
                        }}
                      >
                        🐛 Debug
                      </button>
                    </div>
                  )}
                </div>
              ) : null
            }
          />

          {!isLoading && !error && secrets.length > 0 ? (
            <CrudSummaryStrip
              ariaLabel="Resumen de secretos"
              stripClassName="crud-summary-strip--danger"
              items={secretoSummaryItems(highlights)}
            />
          ) : null}

          <div
            className={`secretos-toolbar${!isLoading && !error && secrets.length === 0 ? ' secretos-toolbar--solo-cta' : ''}`}
          >
            {!isLoading && !error && (secrets.length > 0 || hasSearch) ? (
              <label className="secretos-search">
                <SearchIcon className="secretos-search-icon" aria-hidden="true" />
                <input
                  type="search"
                  className="secretos-search-input"
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder="Buscar por título…"
                  aria-label="Buscar secretos por título"
                />
              </label>
            ) : null}
            <button
              type="button"
              className="btn-base btn-accent btn-submit crud-primary-cta secretos-toolbar-cta"
              onClick={handleOpenModal}
              aria-label="Agregar secreto"
            >
              <AddIcon aria-hidden={true} />
              Agregar secreto
            </button>
          </div>

          <CrudListPanel
            items={filteredSecrets}
            isLoading={isLoading}
            error={error}
            onRetry={() => void loadSecrets()}
            retryAriaLabel="Reintentar cargar secretos"
            loadingAriaLabel="Cargando secretos"
            emptyIcon={<LockIcon className="empty-state-icon" />}
            emptyTitle={hasSearch ? 'Sin coincidencias' : 'No hay secretos registrados'}
            emptySubtext={
              hasSearch
                ? 'Prueba con otro título o limpia la búsqueda'
                : 'Usa Agregar secreto para guardar el primero'
            }
            getItemKey={secret => secret.id}
            renderItem={secret => (
              <SecretoListRow
                secret={secret}
                onClick={() => handleOpenDetailModal(secret)}
                onDecrypt={() => handleQuickDecrypt(secret)}
              />
            )}
          />
        </div>
      </div>

      {isModalOpen && (
        <SecretoFormModal
          title="Nuevo Secreto"
          modalTitleId="modal-title-nuevo-secreto"
          mode="create"
          formData={formData}
          formErrors={formErrors}
          isSaving={isSaving}
          tituloRef={tituloRef}
          valorRef={valorRef}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={handleCloseModal}
        />
      )}

      {isDetailModalOpen && selectedSecret && !isEditMode && !isDecryptModalOpen && (
        <SecretoDetailModal
          secret={selectedSecret}
          isSaving={isSaving}
          onClose={handleCloseDetailModal}
          onDecrypt={handleDecryptClick}
          onEdit={handleEditClick}
          onDelete={() => void handleDeleteClick()}
        />
      )}

      {isDetailModalOpen && selectedSecret && isDecryptModalOpen && (
        <SecretoDecryptModal
          secret={selectedSecret}
          decryptPassword={decryptPassword}
          decryptedValue={decryptedValue}
          showDecryptedValue={showDecryptedValue}
          isDecrypting={isDecrypting}
          onPasswordChange={setDecryptPassword}
          onDecrypt={() => void handleDecrypt()}
          onToggleShow={() => setShowDecryptedValue(prev => !prev)}
          onCopy={() => void handleCopyDecryptedValue()}
          onDecryptAnother={handleDecryptAnother}
          onClose={handleCloseDecryptModal}
        />
      )}

      {isDetailModalOpen && selectedSecret && isEditMode && !isDecryptModalOpen && (
        <SecretoFormModal
          title="Editar Secreto"
          modalTitleId="modal-title-editar-secreto"
          mode="edit"
          fieldIdPrefix="edit-"
          formData={formData}
          formErrors={formErrors}
          isSaving={isSaving}
          tituloRef={tituloRef}
          valorRef={valorRef}
          overlayClassName="edit-modal-overlay"
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={handleCancelEdit}
        />
      )}

      {isDebugModalOpen && isDebugToolsEnabled() && (
        <SecretoDebugModal
          onClose={() => setIsDebugModalOpen(false)}
          onReload={loadSecrets}
          onClearList={() => setSecrets([])}
        />
      )}
    </>
  )
}

export default Secretos
