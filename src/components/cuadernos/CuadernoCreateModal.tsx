import { useEffect, useRef, useState, type RefObject } from 'react'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ModalOverlay from '../ModalOverlay'
import CuadernoEmojiPicker from './CuadernoEmojiPicker'
import { CUADERNO_PAGE_COVER_CATEGORIES, getPageCoverBackground } from './cuadernoPageCovers'
import './cuadernoEditor.css'

interface CuadernoCreateModalProps {
  title: string
  titleError: string
  icon?: string
  cover?: string
  parentTitle?: string
  isSaving: boolean
  tituloRef: RefObject<HTMLInputElement | null>
  onTitleChange: (value: string) => void
  onIconChange: (icon: string | undefined) => void
  onCoverChange: (cover: string | undefined) => void
  onSubmit: (event: React.FormEvent) => void
  onClose: () => void
}

function CuadernoCreateModal({
  title,
  titleError,
  icon,
  cover,
  parentTitle,
  isSaving,
  tituloRef,
  onTitleChange,
  onIconChange,
  onCoverChange,
  onSubmit,
  onClose,
}: CuadernoCreateModalProps) {
  const [coverPickerOpen, setCoverPickerOpen] = useState(false)
  const coverPickerRef = useRef<HTMLDivElement>(null)
  const coverBackground = getPageCoverBackground(cover)
  const isSubpage = Boolean(parentTitle)
  const modalTitle = isSubpage ? 'Nueva subpágina' : 'Nuevo cuaderno'

  useEffect(() => {
    if (!coverPickerOpen) {
      return
    }
    const handlePointerDown = (event: MouseEvent) => {
      if (coverPickerRef.current && !coverPickerRef.current.contains(event.target as Node)) {
        setCoverPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [coverPickerOpen])

  return (
    <ModalOverlay onClose={onClose} className="modal-overlay">
      <div className="modal-panel cuaderno-create-modal" onClick={event => event.stopPropagation()}>
        <div className="cuaderno-create-modal__header">
          <div className="cuaderno-create-modal__header-copy">
            <p className="cuaderno-create-modal__eyebrow">Cuadernos</p>
            <h2 className="modal-panel-title" id="modal-title-nuevo-cuaderno">
              {modalTitle}
            </h2>
            {isSubpage ? (
              <p className="cuaderno-create-modal__parent">Dentro de: {parentTitle}</p>
            ) : null}
          </div>
          <button
            className="modal-panel-close"
            onClick={onClose}
            aria-label="Cerrar"
            type="button"
          >
            ×
          </button>
        </div>

        <form className="cuaderno-create-modal__form" onSubmit={onSubmit} noValidate>
          <div className="modal-panel__scroll">
          <div className="form-group-base cuaderno-create-modal__title-group">
            <label htmlFor="titulo" className="cuaderno-create-modal__label">
              Título
            </label>
            <input
              ref={tituloRef}
              type="text"
              id="titulo"
              name="titulo"
              value={title}
              onChange={event => onTitleChange(event.target.value)}
              className={[
                'form-input-base',
                'form-input-base--comfortable',
                'cuaderno-create-modal__input',
                titleError ? 'input-error' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              placeholder="Ej: Ideas del proyecto"
              autoFocus
              aria-invalid={!!titleError}
              {...(titleError ? { 'aria-describedby': 'titulo-error' } : {})}
            />
            {titleError ? (
              <span id="titulo-error" className="error-message" role="alert">
                {titleError}
              </span>
            ) : null}
          </div>

          <div className="cuaderno-create-modal__appearance">
            <p className="cuaderno-create-modal__appearance-label">Apariencia</p>

            <div
              className={[
                'cuaderno-create-modal__hero',
                coverBackground ? 'cuaderno-create-modal__hero--has-cover' : '',
                coverPickerOpen ? 'cuaderno-create-modal__hero--picker-open' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              ref={coverPickerRef}
            >
              <button
                type="button"
                className="cuaderno-create-modal__hero-cover"
                style={coverBackground ? { background: coverBackground } : undefined}
                onClick={() => setCoverPickerOpen(open => !open)}
                aria-expanded={coverPickerOpen}
                aria-label={cover ? 'Cambiar portada' : 'Elegir portada'}
                disabled={isSaving}
              >
                {!coverBackground ? (
                  <span className="cuaderno-create-modal__hero-cover-hint">Portada</span>
                ) : null}
              </button>

              {cover ? (
                <button
                  type="button"
                  className="cuaderno-create-modal__cover-clear"
                  onClick={event => {
                    event.stopPropagation()
                    onCoverChange(undefined)
                    setCoverPickerOpen(false)
                  }}
                  disabled={isSaving}
                >
                  Quitar
                </button>
              ) : null}

              <div className="cuaderno-create-modal__hero-icon">
                <CuadernoEmojiPicker
                  icon={icon}
                  overCover={Boolean(coverBackground)}
                  onChange={onIconChange}
                  disabled={isSaving}
                />
              </div>

              {coverPickerOpen ? (
                <div
                  className="cuaderno-picker-panel cuaderno-create-modal__cover-panel"
                  role="dialog"
                  aria-label="Elegir portada"
                >
                  <div className="cuaderno-cover-picker__scroll">
                    {CUADERNO_PAGE_COVER_CATEGORIES.map(category => (
                      <section key={category.id} className="cuaderno-cover-picker__section">
                        <h3 className="app-group-label cuaderno-cover-picker__section-title">{category.label}</h3>
                        <div className="cuaderno-cover-picker__grid" role="listbox" aria-label={category.label}>
                          {category.covers.map(option => (
                            <button
                              key={option.id}
                              type="button"
                              className={`cuaderno-cover-picker__option ${cover === option.id ? 'active' : ''}`}
                              style={{ background: option.background }}
                              onClick={() => {
                                onCoverChange(option.id)
                                setCoverPickerOpen(false)
                              }}
                              aria-label={`Portada ${option.label}`}
                              title={option.label}
                            />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <p className="cuaderno-create-modal__hint">
              Icono y portada son opcionales — si no eliges, se asignan al azar.
            </p>
          </div>
          </div>

          <div className="cuaderno-create-modal__actions">
            <button
              type="button"
              className="cuaderno-create-modal__button cuaderno-create-modal__button--secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="cuaderno-create-modal__button cuaderno-create-modal__button--primary"
              disabled={isSaving}
            >
              {isSaving ? (
                'Creando…'
              ) : (
                <>
                  Crear y abrir
                  <OpenInNewIcon fontSize="small" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  )
}

export default CuadernoCreateModal
