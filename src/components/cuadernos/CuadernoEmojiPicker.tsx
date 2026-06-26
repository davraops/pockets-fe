import { useEffect, useRef, useState } from 'react'
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined'
import { CUADERNO_EMOJI_CATEGORIES, normalizePageIcon } from './cuadernoPageMeta'
import './cuadernoEditor.css'

interface CuadernoEmojiPickerProps {
  icon?: string
  overCover?: boolean
  onChange: (icon: string | undefined) => void
  disabled?: boolean
}

function CuadernoEmojiPicker({ icon, overCover = false, onChange, disabled = false }: CuadernoEmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  const selectIcon = (nextIcon: string | undefined) => {
    onChange(nextIcon)
    setCustomValue('')
    setOpen(false)
  }

  const handleCustomSubmit = () => {
    const normalized = normalizePageIcon(customValue)
    if (normalized) {
      selectIcon(normalized)
    }
  }

  return (
    <div className="cuaderno-emoji-picker" ref={rootRef}>
      <button
        type="button"
        className={`cuaderno-page-icon ${icon ? 'cuaderno-page-icon--set' : ''}${overCover ? ' cuaderno-page-icon--over-cover' : ''}`}
        onClick={() => !disabled && setOpen(current => !current)}
        aria-label={icon ? `Icono de página: ${icon}. Pulsa para cambiar.` : 'Añadir icono de página'}
        aria-expanded={open}
        disabled={disabled}
      >
        {icon ? (
          <span className="cuaderno-page-icon__glyph" aria-hidden="true">
            {icon}
          </span>
        ) : (
          <EmojiEmotionsOutlinedIcon className="cuaderno-page-icon__placeholder" aria-hidden="true" />
        )}
        {!icon ? <span className="cuaderno-page-icon__hint">Añadir icono</span> : null}
      </button>

      {open && (
        <div className="cuaderno-picker-panel cuaderno-emoji-picker__panel" role="dialog" aria-label="Elegir icono">
          <div className="cuaderno-emoji-picker__scroll">
            {CUADERNO_EMOJI_CATEGORIES.map(category => (
              <section key={category.id} className="cuaderno-emoji-picker__section">
                <h3 className="app-group-label cuaderno-emoji-picker__section-title">{category.label}</h3>
                <div className="cuaderno-emoji-picker__grid" role="listbox" aria-label={category.label}>
                  {category.emojis.map(option => (
                    <button
                      key={`${category.id}-${option}`}
                      type="button"
                      className={`cuaderno-emoji-picker__option ${icon === option ? 'active' : ''}`}
                      onClick={() => selectIcon(option)}
                      aria-label={`Usar ${option}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <div className="cuaderno-emoji-picker__custom">
            <input
              type="text"
              value={customValue}
              onChange={event => setCustomValue(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleCustomSubmit()
                }
              }}
              placeholder="Pega o escribe un emoji"
              aria-label="Emoji personalizado"
              maxLength={8}
            />
            <button type="button" className="cuaderno-emoji-picker__apply" onClick={handleCustomSubmit}>
              Usar
            </button>
          </div>
          {icon ? (
            <button type="button" className="cuaderno-emoji-picker__remove" onClick={() => selectIcon(undefined)}>
              Quitar icono
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default CuadernoEmojiPicker
