import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { backToHubLabel } from '../../constants/hubLabels'

interface LifestyleSubHeaderProps {
  title: string
  context?: string
  meta?: string
  backTo?: string
  backLabel?: string
  toolbarActions?: ReactNode
}

function LifestyleSubHeader({
  title,
  context,
  meta,
  backTo = '/tiempo',
  backLabel = backToHubLabel('tiempo'),
  toolbarActions,
}: LifestyleSubHeaderProps) {
  const navigate = useNavigate()

  return (
    <>
      <div className="app-toolbar lifestyle-sub-toolbar">
        <button
          type="button"
          className="app-toolbar-button"
          onClick={() => navigate(backTo)}
          aria-label={backLabel}
        >
          <ArrowBackIcon className="app-toolbar-icon" />
        </button>
        {toolbarActions ? (
          <div className="lifestyle-sub-toolbar-actions">{toolbarActions}</div>
        ) : null}
      </div>
      <header className="lifestyle-sub-header">
        <h1 className="lifestyle-sub-title">
          <span className="lifestyle-sub-title-brand">{title}</span>
          {context ? (
            <>
              <span className="lifestyle-sub-title-sep" aria-hidden="true">
                ·
              </span>
              <span className="lifestyle-sub-title-context">{context}</span>
            </>
          ) : null}
        </h1>
        {meta ? <p className="lifestyle-sub-meta">{meta}</p> : null}
      </header>
    </>
  )
}

export default LifestyleSubHeader
