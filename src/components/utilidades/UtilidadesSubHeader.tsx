import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { backToHubLabel } from '../../constants/hubLabels'

interface UtilidadesSubHeaderProps {
  title: string
  context?: string
  meta?: string
  backTo?: string
  backLabel?: string
  toolbarActions?: ReactNode
}

function UtilidadesSubHeader({
  title,
  context,
  meta,
  backTo = '/registros',
  backLabel = backToHubLabel('registros'),
  toolbarActions,
}: UtilidadesSubHeaderProps) {
  const navigate = useNavigate()

  return (
    <>
      <div className="app-toolbar utilidades-sub-toolbar">
        <button
          type="button"
          className="app-toolbar-button"
          onClick={() => navigate(backTo)}
          aria-label={backLabel}
        >
          <ArrowBackIcon className="app-toolbar-icon" />
        </button>
        {toolbarActions ? (
          <div className="utilidades-sub-toolbar-actions">{toolbarActions}</div>
        ) : null}
      </div>
      <header className="utilidades-sub-header">
        <h1 className="utilidades-sub-title">
          <span className="utilidades-sub-title-brand">{title}</span>
          {context ? (
            <>
              <span className="utilidades-sub-title-sep" aria-hidden="true">
                ·
              </span>
              <span className="utilidades-sub-title-context">{context}</span>
            </>
          ) : null}
        </h1>
        {meta ? <p className="utilidades-sub-meta">{meta}</p> : null}
      </header>
    </>
  )
}

export default UtilidadesSubHeader
