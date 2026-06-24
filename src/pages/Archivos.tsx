import { useState, useEffect, useRef } from 'react'
import DescriptionIcon from '@mui/icons-material/Description'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import { api } from '../services/api'
import CrudSummaryStrip from '../components/crud/CrudSummaryStrip'
import CrudListPanel from '../components/crud/CrudListPanel'
import ArchivoUploadModal from '../components/archivos/ArchivoUploadModal'
import ArchivoDetailModal from '../components/archivos/ArchivoDetailModal'
import ArchivoEditModal from '../components/archivos/ArchivoEditModal'
import ArchivoListRow from '../components/archivos/ArchivoListRow'
import {
  EMPTY_ARCHIVO_METADATA_FORM,
  fileToMetadataForm,
  getUploadErrorMessage,
  validateSelectedUploadFile,
  type ArchivoMetadataFormData,
} from '../components/archivos/archivosFormUtils'
import {
  archivoSummaryItems,
  calculateArchivoHighlights,
} from '../components/archivos/archivosDisplayUtils'
import type { FileAPI } from '../components/archivos/archivosTypes'
import { sortFilesByDate } from '../components/archivos/archivosTypes'
import { devError, devLog } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import UtilidadesSubHeader from '../components/utilidades/UtilidadesSubHeader'
import './AppPage.css'
import './Archivos.css'

function Archivos() {
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const [files, setFiles] = useState<FileAPI[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileAPI | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadFormData, setUploadFormData] = useState<ArchivoMetadataFormData>(
    EMPTY_ARCHIVO_METADATA_FORM
  )
  const [editFormData, setEditFormData] = useState<ArchivoMetadataFormData>(
    EMPTY_ARCHIVO_METADATA_FORM
  )
  const [selectedFileForUpload, setSelectedFileForUpload] = useState<File | null>(null)

  useEffect(() => {
    void loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.getFiles()
      devLog('🔵 GET /files - Respuesta:', response)

      if (response.files && Array.isArray(response.files)) {
        setFiles(sortFilesByDate(response.files))
      } else {
        setFiles([])
      }
    } catch (err: unknown) {
      devError('Error al cargar archivos:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al cargar los archivos. Por favor, intenta de nuevo.'
      )
      setError(errorMessage)
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const resetUploadForm = () => {
    setUploadFormData(EMPTY_ARCHIVO_METADATA_FORM)
    setSelectedFileForUpload(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true)
    resetUploadForm()
  }

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false)
    resetUploadForm()
  }

  const handleUploadFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setUploadFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleEditFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setEditFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }

    const validationError = validateSelectedUploadFile(file)
    if (validationError) {
      showNotification(validationError, 'error')
      return
    }

    setSelectedFileForUpload(file)
    if (!uploadFormData.title) {
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
      setUploadFormData(prev => ({
        ...prev,
        title: fileNameWithoutExt,
      }))
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFileForUpload) {
      showNotification('Por favor selecciona un archivo', 'error')
      return
    }

    if (!uploadFormData.title.trim()) {
      showNotification('Por favor ingresa un título', 'error')
      return
    }

    try {
      setIsUploading(true)

      devLog('🟢 POST /files - Subiendo archivo:', {
        fileName: selectedFileForUpload.name,
        fileSize: selectedFileForUpload.size,
        fileType: selectedFileForUpload.type,
        title: uploadFormData.title,
        description: uploadFormData.description,
      })

      const response = await api.uploadFile(
        selectedFileForUpload,
        uploadFormData.title.trim(),
        uploadFormData.description.trim() || undefined
      )

      devLog('✅ POST /files - Respuesta:', response)
      showNotification('Archivo subido exitosamente', 'success')
      handleCloseUploadModal()
      await loadFiles()
    } catch (err: unknown) {
      devError('Error al subir archivo:', err)
      showNotification(getUploadErrorMessage(err), 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async (file: FileAPI) => {
    try {
      setIsProcessing(true)
      devLog(`🔵 GET /files/${file.id} - Obteniendo URL de descarga`)
      const response = await api.getFileDownloadUrl(file.id)
      devLog(`✅ GET /files/${file.id} - Respuesta:`, response)

      if (response.download_url) {
        window.open(response.download_url, '_blank')
        showNotification('Descarga iniciada', 'success')
      }
    } catch (err: unknown) {
      devError('Error al descargar archivo:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al descargar el archivo. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async (file: FileAPI) => {
    if (
      !(await confirm({
        message: `¿Estás seguro de que deseas eliminar "${file.title}"?`,
        variant: 'danger',
      }))
    ) {
      return
    }

    try {
      setIsProcessing(true)
      await api.deleteFile(file.id)
      showNotification('Archivo eliminado exitosamente', 'success')
      await loadFiles()
      if (selectedFile?.id === file.id) {
        setIsDetailModalOpen(false)
        setSelectedFile(null)
      }
    } catch (err: unknown) {
      devError('Error al eliminar archivo:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar el archivo. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleOpenDetailModal = (file: FileAPI) => {
    setSelectedFile(file)
    setIsEditMode(false)
    setIsDetailModalOpen(true)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setIsEditMode(false)
    setSelectedFile(null)
  }

  const handleEditClick = () => {
    if (!selectedFile) {
      return
    }
    setEditFormData(fileToMetadataForm(selectedFile))
    setIsEditMode(true)
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      return
    }

    const title = editFormData.title.trim()
    if (!title) {
      showNotification('Por favor ingresa un título', 'error')
      return
    }

    const description = editFormData.description.trim()

    try {
      setIsSaving(true)
      const response = await api.updateFile(selectedFile.id, {
        title,
        description: description || null,
      })

      const updatedFile: FileAPI = response.file ?? {
        ...selectedFile,
        title,
        description: description || null,
        updated_at: new Date().toISOString(),
      }

      setFiles(prev => prev.map(file => (file.id === updatedFile.id ? updatedFile : file)))
      setSelectedFile(updatedFile)
      setIsEditMode(false)
      showNotification('Archivo actualizado exitosamente', 'success')
    } catch (err: unknown) {
      devError('Error al actualizar archivo:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al actualizar el archivo. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const isFileBusy = isUploading || isProcessing || isSaving
  const highlights = calculateArchivoHighlights(files)

  return (
    <>
      <div className="app-page-container">
        <div className="app-page-content app-page-content-wide crud-page-content archivos-content utilidades-sub-content">
          <UtilidadesSubHeader
            title="Archivos"
            context="Documentos"
            meta={
              !isLoading && !error
                ? `${files.length} archivo${files.length !== 1 ? 's' : ''}`
                : undefined
            }
          />

          <CrudSummaryStrip
            ariaLabel="Resumen de archivos"
            items={archivoSummaryItems(highlights)}
          />

          <button
            type="button"
            className="btn-base btn-accent btn-block btn-submit crud-primary-cta"
            onClick={handleOpenUploadModal}
            aria-label="Subir archivo"
          >
            <CloudUploadIcon aria-hidden={true} />
            Subir archivo
          </button>

          <CrudListPanel
            items={files}
            isLoading={isLoading}
            error={error}
            onRetry={() => void loadFiles()}
            retryAriaLabel="Reintentar cargar archivos"
            loadingAriaLabel="Cargando archivos"
            emptyIcon={<DescriptionIcon className="empty-state-icon" />}
            emptyTitle="No hay archivos subidos aún"
            emptySubtext="Usa el botón de arriba para subir el primero"
            getItemKey={file => file.id}
            listOuterClassName="archivos-list"
            renderItem={file => (
              <ArchivoListRow file={file} onClick={() => handleOpenDetailModal(file)} />
            )}
          />
        </div>
      </div>

      {isUploadModalOpen && (
        <ArchivoUploadModal
          formData={uploadFormData}
          selectedFile={selectedFileForUpload}
          isUploading={isUploading}
          fileInputRef={fileInputRef}
          onFileSelect={handleFileSelect}
          onChange={handleUploadFormChange}
          onSubmit={handleUploadSubmit}
          onClose={handleCloseUploadModal}
        />
      )}

      {isDetailModalOpen && selectedFile && !isEditMode && (
        <ArchivoDetailModal
          file={selectedFile}
          isBusy={isFileBusy}
          onClose={handleCloseDetailModal}
          onEdit={handleEditClick}
          onDownload={() => void handleDownload(selectedFile)}
          onDelete={() => void handleDelete(selectedFile)}
        />
      )}

      {isDetailModalOpen && selectedFile && isEditMode && (
        <ArchivoEditModal
          file={selectedFile}
          formData={editFormData}
          isSaving={isSaving}
          onChange={handleEditFormChange}
          onSubmit={handleUpdateSubmit}
          onCancel={() => setIsEditMode(false)}
          onClose={handleCloseDetailModal}
        />
      )}
    </>
  )
}

export default Archivos
