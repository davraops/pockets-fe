import { useCallback, useEffect, useState } from 'react'
import DownloadIcon from '@mui/icons-material/Download'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ModalOverlay from '../ModalOverlay'
import { api } from '../../services/api'
import type { FileAPI } from './archivosTypes'
import { formatFileSize } from './archivosDisplayUtils'
import {
  getArchivoPreviewKind,
  getPreviewUnavailableMessage,
  type ArchivoPreviewKind,
} from './archivosPreviewUtils'
import { getTranslatedErrorMessage } from '../../utils/errorTranslations'

interface ArchivoViewerModalProps {
  file: FileAPI
  onClose: () => void
  onDownload: () => void
}

function ArchivoViewerModal({ file, onClose, onDownload }: ArchivoViewerModalProps) {
  const previewKind = getArchivoPreviewKind(file.mime_type)
  const unavailableMessage = getPreviewUnavailableMessage(file)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadPreviewUrl = useCallback(async () => {
    setLoadState('loading')
    setErrorMessage(null)
    setPreviewUrl(null)

    try {
      const response = await api.getFileDownloadUrl(file.id)
      const url = response.download_url as string | undefined
      if (!url) {
        setLoadState('error')
        setErrorMessage('No se pudo obtener la URL de previsualización.')
        return
      }

      setPreviewUrl(url)
      setLoadState('ready')
    } catch (err: unknown) {
      setLoadState('error')
      setErrorMessage(
        getTranslatedErrorMessage(
          err,
          'Error al cargar la vista previa. Por favor, intenta de nuevo.'
        )
      )
    }
  }, [file.id])

  useEffect(() => {
    if (unavailableMessage) {
      setLoadState('idle')
      setPreviewUrl(null)
      setErrorMessage(null)
      return
    }

    void loadPreviewUrl()
  }, [unavailableMessage, loadPreviewUrl])

  const handleOpenInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <ModalOverlay onClose={onClose} className="modal-overlay">
      <div
        className="modal-panel metas-modal modal-panel--fullscreen"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title-archivo-vista"
      >
        <div className="archivos-modal__header">
          <div className="archivos-modal__header-copy">
            <p className="archivos-modal__kicker">Documentos · Vista previa</p>
            <h2 className="modal-panel-title" id="modal-title-archivo-vista">
              {file.title}
            </h2>
            <p className="archivos-modal__subtitle">
              {file.file_name} · {formatFileSize(file.file_size)}
            </p>
          </div>
          <button className="modal-panel-close" onClick={onClose} aria-label="Cerrar" type="button">
            ×
          </button>
        </div>

        <div className="modal-panel-content archivos-viewer-modal__body">
          {unavailableMessage ? (
            <p className="archivos-modal__callout">{unavailableMessage}</p>
          ) : loadState === 'loading' ? (
            <div className="archivos-viewer-modal__loading" aria-live="polite">
              <span className="archivos-viewer-modal__spinner" aria-hidden="true" />
              <p>Cargando vista previa…</p>
            </div>
          ) : loadState === 'error' ? (
            <div className="archivos-viewer-modal__fallback">
              <p className="archivos-modal__callout">{errorMessage}</p>
              <button
                type="button"
                className="btn-base btn-secondary archivos-viewer-modal__action"
                onClick={() => void loadPreviewUrl()}
              >
                Reintentar
              </button>
            </div>
          ) : previewUrl && previewKind ? (
            <ArchivoPreviewContent kind={previewKind} url={previewUrl} title={file.title} />
          ) : null}
        </div>

        <div className="modal-actions-base archivos-modal__footer archivos-viewer-modal__footer">
          {previewUrl ? (
            <button
              type="button"
              className="btn-base btn-secondary archivos-viewer-modal__action"
              onClick={handleOpenInNewTab}
            >
              <OpenInNewIcon aria-hidden="true" />
              Abrir en pestaña
            </button>
          ) : null}
          <button
            type="button"
            className="btn-base btn-accent archivos-viewer-modal__action"
            onClick={onDownload}
          >
            <DownloadIcon aria-hidden="true" />
            Descargar
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

function ArchivoPreviewContent({
  kind,
  url,
  title,
}: {
  kind: ArchivoPreviewKind
  url: string
  title: string
}) {
  if (kind === 'image') {
    return (
      <div className="archivos-viewer-modal__frame archivos-viewer-modal__frame--image">
        <img
          className="archivos-viewer-modal__image"
          src={url}
          alt={`Vista previa de ${title}`}
        />
      </div>
    )
  }

  return (
    <iframe
      className="archivos-viewer-modal__frame archivos-viewer-modal__frame--document"
      src={url}
      title={`Vista previa de ${title}`}
    />
  )
}

export default ArchivoViewerModal
