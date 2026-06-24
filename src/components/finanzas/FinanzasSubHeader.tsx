import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

interface FinanzasSubHeaderProps {
  title: string
  context?: string
  meta?: string
  backTo?: string
  backLabel?: string
  toolbarActions?: ReactNode
}

function FinanzasSubHeader({
  title,
  context,
  meta,
  backTo = '/finanzas',
  backLabel = 'Volver a Finanzas',
  toolbarActions,
}: FinanzasSubHeaderProps) {
  const navigate = useNavigate()

  return (
    <>
      <div className="app-toolbar finanzas-sub-toolbar">
        <button
          type="button"
          className="app-toolbar-button"
          onClick={() => navigate(backTo)}
          aria-label={backLabel}
        >
          <ArrowBackIcon className="app-toolbar-icon" />
        </button>
        {toolbarActions ? (
          <div className="finanzas-sub-toolbar-actions">{toolbarActions}</div>
        ) : null}
      </div>
      <header className="finanzas-sub-header">
        <h1 className="finanzas-sub-title">
          <span className="finanzas-sub-title-brand">{title}</span>
          {context ? (
            <>
              <span className="finanzas-sub-title-sep" aria-hidden="true">
                ·
              </span>
              <span className="finanzas-sub-title-context">{context}</span>
            </>
          ) : null}
        </h1>
        {meta ? <p className="finanzas-sub-meta">{meta}</p> : null}
      </header>
    </>
  )
}

export default FinanzasSubHeader
