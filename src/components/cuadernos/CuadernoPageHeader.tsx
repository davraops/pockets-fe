import type { RefObject } from 'react'
import CuadernoEmojiPicker from './CuadernoEmojiPicker'
import CuadernoNoteTimestamps from './CuadernoNoteTimestamps'
import './cuadernoEditor.css'

interface CuadernoPageHeaderProps {
  icon?: string
  comment?: string
  title: string
  isEditing: boolean
  hasCover?: boolean
  fechaCreacion?: string
  fechaActualizacion?: string
  titleInputRef?: RefObject<HTMLInputElement | null>
  onIconChange?: (icon: string | undefined) => void
  onCommentChange?: (comment: string) => void
  onTitleChange?: (title: string) => void
}

function PageIcon({
  icon,
  isEditing,
  hasCover,
  onIconChange,
}: {
  icon?: string
  isEditing: boolean
  hasCover: boolean
  onIconChange?: (icon: string | undefined) => void
}) {
  if (isEditing) {
    return (
      <div className={`cuaderno-page-icon-stage${icon ? ' cuaderno-page-icon-stage--set' : ''}`}>
        <CuadernoEmojiPicker
          icon={icon}
          overCover={hasCover}
          onChange={nextIcon => onIconChange?.(nextIcon)}
        />
      </div>
    )
  }

  if (!icon) {
    return null
  }

  return (
    <div className="cuaderno-page-icon-stage cuaderno-page-icon-stage--set">
      <span className="cuaderno-page-icon cuaderno-page-icon--set cuaderno-page-icon--readonly" aria-hidden="true">
        <span className="cuaderno-page-icon__glyph">{icon}</span>
      </span>
    </div>
  )
}

function CuadernoPageHeader({
  icon,
  comment,
  title,
  isEditing,
  hasCover = false,
  fechaCreacion,
  fechaActualizacion,
  titleInputRef,
  onIconChange,
  onCommentChange,
  onTitleChange,
}: CuadernoPageHeaderProps) {
  const displayTitle = title.trim() || 'Sin título'
  const displayComment = comment?.trim() ?? ''

  const headerClassName = [
    'cuaderno-page-header',
    isEditing ? 'cuaderno-page-header--edit' : 'cuaderno-page-header--read',
    hasCover ? 'cuaderno-page-header--over-cover' : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (isEditing) {
    return (
      <header className={headerClassName}>
        <div className="cuaderno-page-title-row">
          <PageIcon icon={icon} isEditing hasCover={hasCover} onIconChange={onIconChange} />
          <input
            ref={titleInputRef}
            className="cuaderno-workspace__title"
            value={title}
            onChange={event => onTitleChange?.(event.target.value)}
            placeholder="Sin título"
            aria-label="Título del cuaderno"
          />
        </div>
        <textarea
          className="cuaderno-page-comment cuaderno-page-comment--edit"
          value={comment ?? ''}
          onChange={event => onCommentChange?.(event.target.value)}
          placeholder="Añade un comentario…"
          aria-label="Comentario del cuaderno"
          rows={1}
          onInput={event => {
            const target = event.currentTarget
            target.style.height = 'auto'
            target.style.height = `${target.scrollHeight}px`
          }}
        />
        {fechaCreacion && fechaActualizacion ? (
          <CuadernoNoteTimestamps
            fechaCreacion={fechaCreacion}
            fechaActualizacion={fechaActualizacion}
          />
        ) : null}
      </header>
    )
  }

  return (
    <header className={headerClassName}>
      <div className="cuaderno-page-title-row">
        <PageIcon icon={icon} isEditing={false} hasCover={hasCover} />
        <h1 className="cuaderno-read-title">{displayTitle}</h1>
      </div>
      {displayComment ? <p className="cuaderno-page-comment cuaderno-page-comment--read">{displayComment}</p> : null}
      {fechaCreacion && fechaActualizacion ? (
        <CuadernoNoteTimestamps fechaCreacion={fechaCreacion} fechaActualizacion={fechaActualizacion} />
      ) : null}
    </header>
  )
}

export default CuadernoPageHeader
