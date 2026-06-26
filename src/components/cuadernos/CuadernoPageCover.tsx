import { useEffect, useRef, useState } from 'react'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import {
  CUADERNO_PAGE_COVER_CATEGORIES,
  getPageCoverBackground,
} from './cuadernoPageCovers'
import './cuadernoEditor.css'

interface CuadernoPageCoverProps {
  cover?: string
  isEditing: boolean
  onCoverChange?: (cover: string | undefined) => void
}

function CuadernoPageCover({ cover, isEditing, onCoverChange }: CuadernoPageCoverProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const background = getPageCoverBackground(cover)

  useEffect(() => {
    if (!pickerOpen) {
      return
    }
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [pickerOpen])

  const selectCover = (nextCover: string | undefined) => {
    onCoverChange?.(nextCover)
    setPickerOpen(false)
  }

  const pickerPanel = pickerOpen ? (
    <div className="cuaderno-picker-panel cuaderno-cover-picker__panel" role="dialog" aria-label="Elegir portada">
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
                  onClick={() => selectCover(option.id)}
                  aria-label={`Portada ${option.label}`}
                  title={option.label}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      {cover ? (
        <button type="button" className="cuaderno-cover-picker__remove" onClick={() => selectCover(undefined)}>
          Quitar portada
        </button>
      ) : null}
    </div>
  ) : null

  if (!isEditing && !background) {
    return null
  }

  if (!isEditing && background) {
    return (
      <div className="cuaderno-page-cover-wrap cuaderno-page-cover-wrap--readonly">
        <div className="cuaderno-page-cover cuaderno-page-cover--readonly" style={{ background }} aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="cuaderno-page-cover-wrap cuaderno-cover-picker" ref={rootRef}>
      {background ? (
        <div className="cuaderno-page-cover cuaderno-page-cover--editable" style={{ background }}>
          <div className="cuaderno-page-cover__actions">
            <button type="button" className="cuaderno-page-cover__action" onClick={() => setPickerOpen(open => !open)}>
              Cambiar portada
            </button>
            <button type="button" className="cuaderno-page-cover__action" onClick={() => selectCover(undefined)}>
              Quitar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="cuaderno-page-cover-add"
          onClick={() => setPickerOpen(true)}
          aria-expanded={pickerOpen}
        >
          <ImageOutlinedIcon fontSize="small" aria-hidden />
          Añadir portada
        </button>
      )}
      {pickerPanel}
    </div>
  )
}

export default CuadernoPageCover
