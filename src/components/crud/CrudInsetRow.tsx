import type { ReactNode } from 'react'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

interface CrudInsetRowProps {
  accentClass: string
  ariaLabel: string
  onClick: () => void
  title: string
  value?: ReactNode
  meta?: string
  preview?: string | null
  metaAfterPreview?: boolean
}

function CrudInsetRow({
  accentClass,
  ariaLabel,
  onClick,
  title,
  value,
  meta,
  preview,
  metaAfterPreview = false,
}: CrudInsetRowProps) {
  return (
    <button
      type="button"
      className={`crud-inset-row ${accentClass}`}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <div className="crud-row-content">
        <div className="crud-row-header">
          <span className="crud-row-title">{title}</span>
          {value != null && value !== '' && <span className="crud-row-value">{value}</span>}
          <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
        </div>
        {meta && !metaAfterPreview && <p className="crud-row-meta">{meta}</p>}
        {preview && <p className="crud-row-preview">{preview}</p>}
        {meta && metaAfterPreview && <p className="crud-row-meta">{meta}</p>}
      </div>
    </button>
  )
}

export default CrudInsetRow
