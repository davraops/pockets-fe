import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DescriptionIcon from '@mui/icons-material/Description'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import './Archivos.css'

interface FileAPI {
  id: string
  title: string
  description?: string | null
  file_name: string
  file_size: number
  mime_type: string
  created_at: string
  updated_at: string
}

function Archivos() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [files, setFiles] = useState<FileAPI[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileAPI | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  })
  const [selectedFileForUpload, setSelectedFileForUpload] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    loadFiles()
  }, [])

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isMenuOpen && !target.closest('.archivos-toolbar-menu-container')) {
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

  const loadFiles = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.getFiles()
      console.log('🔵 GET /files - Respuesta:', response)

      if (response.files && Array.isArray(response.files)) {
        // Ordenar por fecha descendente (más recientes primero)
        const sortedFiles = [...response.files].sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
        setFiles(sortedFiles)
      } else {
        setFiles([])
      }
    } catch (err: any) {
      console.error('Error al cargar archivos:', err)
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

  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true)
    setFormData({
      title: '',
      description: '',
    })
    setSelectedFileForUpload(null)
    setUploadProgress(0)
  }

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false)
    setFormData({
      title: '',
      description: '',
    })
    setSelectedFileForUpload(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamaño (25MB máximo)
      const maxSize = 25 * 1024 * 1024 // 25MB en bytes
      if (file.size > maxSize) {
        showNotification('El archivo es demasiado grande. El tamaño máximo es 25MB.', 'error')
        return
      }

      // Validar tipo de archivo
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'image/jpeg',
        'image/png',
        'image/gif',
      ]

      if (!allowedTypes.includes(file.type)) {
        showNotification('Tipo de archivo no permitido. Solo se permiten PDFs, documentos, imágenes y archivos de texto.', 'error')
        return
      }

      setSelectedFileForUpload(file)
      // Si no hay título, usar el nombre del archivo sin extensión
      if (!formData.title) {
        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
        setFormData(prev => ({
          ...prev,
          title: fileNameWithoutExt,
        }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFileForUpload) {
      showNotification('Por favor selecciona un archivo', 'error')
      return
    }

    if (!formData.title.trim()) {
      showNotification('Por favor ingresa un título', 'error')
      return
    }

    try {
      setIsLoading(true)
      setUploadProgress(0)

      console.log('🟢 POST /files - Subiendo archivo:', {
        fileName: selectedFileForUpload.name,
        fileSize: selectedFileForUpload.size,
        title: formData.title,
        description: formData.description,
      })

      const response = await api.uploadFile(
        selectedFileForUpload,
        formData.title.trim(),
        formData.description.trim() || undefined
      )

      console.log('✅ POST /files - Respuesta:', response)
      showNotification('Archivo subido exitosamente', 'success')
      handleCloseUploadModal()
      await loadFiles()
    } catch (err: any) {
      console.error('Error al subir archivo:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al subir el archivo. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
      setUploadProgress(0)
    }
  }

  const handleDownload = async (file: FileAPI) => {
    try {
      setIsLoading(true)
      console.log(`🔵 GET /files/${file.id} - Obteniendo URL de descarga`)
      const response = await api.getFileDownloadUrl(file.id)
      console.log('✅ GET /files/' + file.id + ' - Respuesta:', response)

      if (response.download_url) {
        // Abrir en nueva pestaña para descargar
        window.open(response.download_url, '_blank')
        showNotification('Descarga iniciada', 'success')
      }
    } catch (err: any) {
      console.error('Error al descargar archivo:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al descargar el archivo. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (file: FileAPI) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar "${file.title}"?`)) {
      return
    }

    try {
      setIsLoading(true)
      await api.deleteFile(file.id)
      showNotification('Archivo eliminado exitosamente', 'success')
      await loadFiles()
      if (selectedFile?.id === file.id) {
        setIsDetailModalOpen(false)
        setSelectedFile(null)
      }
    } catch (err: any) {
      console.error('Error al eliminar archivo:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar el archivo. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDetailModal = (file: FileAPI) => {
    setSelectedFile(file)
    setIsDetailModalOpen(true)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedFile(null)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️'
    if (mimeType.includes('image')) return '🖼️'
    if (mimeType.includes('text') || mimeType.includes('csv')) return '📃'
    return '📎'
  }

  return (
    <>
      <div className="app-page-container">
        <div className="app-page-content archivos-content">
          {/* Toolbar */}
          <div className="archivos-toolbar">
            <button
              className="archivos-toolbar-button"
              onClick={() => navigate('/registros')}
              aria-label="Volver"
              type="button"
            >
              <ArrowBackIcon className="archivos-toolbar-icon" />
            </button>

            <div className="archivos-toolbar-menu-container" ref={menuRef}>
              <button
                className="archivos-toolbar-button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Opciones"
                aria-expanded={isMenuOpen}
                type="button"
              >
                <MoreVertIcon className="archivos-toolbar-icon" />
              </button>
              {isMenuOpen && (
                <div className="archivos-menu">
                  <button
                    className="archivos-menu-item"
                    onClick={() => {
                      handleOpenUploadModal()
                      setIsMenuOpen(false)
                    }}
                    type="button"
                  >
                    <AddIcon className="archivos-menu-icon" />
                    <span>Subir Archivo</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <h1 className="archivos-page-title">Archivos</h1>
          <p className="archivos-page-subtitle">Gestiona tus documentos y archivos</p>

          {/* Lista de Archivos */}
          {isLoading && files.length === 0 ? (
            <div className="archivos-empty-state">
              <p>Cargando archivos...</p>
            </div>
          ) : error ? (
            <div className="archivos-empty-state">
              <p>{error}</p>
            </div>
          ) : files.length === 0 ? (
            <div className="archivos-empty-state">
              <DescriptionIcon className="empty-state-icon" />
              <p className="empty-state-text">No hay archivos subidos aún.</p>
            </div>
          ) : (
            <div className="archivos-list">
              <div className="archivos-group">
                {files.map(file => (
                  <button
                    key={file.id}
                    className="archivos-row"
                    onClick={() => handleOpenDetailModal(file)}
                    type="button"
                  >
                    <div className="archivos-row-content">
                      <div className="archivos-row-header">
                        <div className="archivos-row-title-section">
                          <span className="archivos-row-icon-emoji">{getFileIcon(file.mime_type)}</span>
                          <h3 className="archivos-row-title">{file.title}</h3>
                        </div>
                        <ChevronRightIcon className="archivos-row-chevron" />
                      </div>
                      {file.description && (
                        <p className="archivos-row-preview">{file.description}</p>
                      )}
                      <div className="archivos-row-meta">
                        <span className="archivos-row-file-name">{file.file_name}</span>
                        <span className="archivos-row-separator">•</span>
                        <span className="archivos-row-file-size">{formatFileSize(file.file_size)}</span>
                        <span className="archivos-row-separator">•</span>
                        <span className="archivos-row-date">{formatDate(file.created_at)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Subida */}
      {isUploadModalOpen && (
        <div className="archivos-modal-overlay" onClick={handleCloseUploadModal}>
          <div className="archivos-modal" onClick={e => e.stopPropagation()}>
            <div className="archivos-modal-header">
              <h2 className="archivos-modal-title">Subir Archivo</h2>
              <button
                className="archivos-modal-close-button"
                onClick={handleCloseUploadModal}
                aria-label="Cerrar"
                type="button"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="archivos-modal-form">
              <div className="archivos-form-group">
                <label htmlFor="file" className="archivos-form-label">
                  Archivo *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="file"
                  name="file"
                  onChange={handleFileSelect}
                  className="archivos-form-file-input"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,image/*"
                  required
                />
                {selectedFileForUpload && (
                  <div className="archivos-file-selected">
                    <span className="archivos-file-selected-icon">{getFileIcon(selectedFileForUpload.type)}</span>
                    <div className="archivos-file-selected-info">
                      <span className="archivos-file-selected-name">{selectedFileForUpload.name}</span>
                      <span className="archivos-file-selected-size">{formatFileSize(selectedFileForUpload.size)}</span>
                    </div>
                  </div>
                )}
                <p className="archivos-form-hint">
                  Tamaño máximo: 25MB. Formatos permitidos: PDF, Word, Excel, PowerPoint, texto, CSV, imágenes
                </p>
              </div>

              <div className="archivos-form-group">
                <label htmlFor="title" className="archivos-form-label">
                  Título *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="archivos-form-input"
                  required
                  placeholder="Ej: Contrato de arrendamiento"
                />
              </div>

              <div className="archivos-form-group">
                <label htmlFor="description" className="archivos-form-label">
                  Descripción (opcional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="archivos-form-textarea"
                  rows={3}
                  placeholder="Descripción adicional del archivo..."
                />
              </div>

              <div className="archivos-form-actions">
                <button
                  type="button"
                  className="archivos-form-button archivos-form-button-secondary"
                  onClick={handleCloseUploadModal}
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="archivos-form-button archivos-form-button-primary"
                  disabled={isLoading || !selectedFileForUpload}
                >
                  {isLoading ? 'Subiendo...' : 'Subir Archivo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalle */}
      {isDetailModalOpen && selectedFile && (
        <div className="archivos-modal-overlay" onClick={handleCloseDetailModal}>
          <div className="archivos-modal" onClick={e => e.stopPropagation()}>
            <div className="archivos-modal-header">
              <h2 className="archivos-modal-title">{selectedFile.title}</h2>
              <div className="archivos-modal-actions">
                <button
                  className="archivos-modal-action-button"
                  onClick={() => handleDownload(selectedFile)}
                  aria-label="Descargar"
                  type="button"
                  disabled={isLoading}
                >
                  <DownloadIcon />
                </button>
                <button
                  className="archivos-modal-action-button archivos-modal-delete-button"
                  onClick={() => handleDelete(selectedFile)}
                  aria-label="Eliminar"
                  type="button"
                  disabled={isLoading}
                >
                  <DeleteIcon />
                </button>
                <button
                  className="archivos-modal-close-button"
                  onClick={handleCloseDetailModal}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="archivos-detail-content">
              <div className="archivos-detail-section">
                <div className="archivos-detail-info-item">
                  <span className="archivos-detail-label">Archivo:</span>
                  <span className="archivos-detail-value">{selectedFile.file_name}</span>
                </div>
                <div className="archivos-detail-info-item">
                  <span className="archivos-detail-label">Tamaño:</span>
                  <span className="archivos-detail-value">{formatFileSize(selectedFile.file_size)}</span>
                </div>
                <div className="archivos-detail-info-item">
                  <span className="archivos-detail-label">Tipo:</span>
                  <span className="archivos-detail-value">{selectedFile.mime_type}</span>
                </div>
                {selectedFile.description && (
                  <div className="archivos-detail-section">
                    <h3 className="archivos-detail-label">Descripción</h3>
                    <p className="archivos-detail-value">{selectedFile.description}</p>
                  </div>
                )}
                <div className="archivos-detail-info-item">
                  <span className="archivos-detail-label">Subido:</span>
                  <span className="archivos-detail-value">{formatDate(selectedFile.created_at)}</span>
                </div>
              </div>

              <div className="archivos-detail-actions">
                <button
                  className="archivos-detail-action-button"
                  onClick={() => handleDownload(selectedFile)}
                  disabled={isLoading}
                  type="button"
                >
                  <DownloadIcon className="archivos-detail-action-icon" />
                  <span>Descargar</span>
                </button>
                <button
                  className="archivos-detail-action-button archivos-detail-action-button-danger"
                  onClick={() => handleDelete(selectedFile)}
                  disabled={isLoading}
                  type="button"
                >
                  <DeleteIcon className="archivos-detail-action-icon" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Archivos

