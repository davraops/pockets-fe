import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import EditIcon from '@mui/icons-material/Edit'
import WarningIcon from '@mui/icons-material/Warning'
import type { ProcesoContratacion } from './procesoContratacionTypes'
import {
  buildProcesoSummaryMeta,
  getClosureReasonLabel,
  getClosureReasonTone,
  getHiringProgress,
  getProcesoEstadoColor,
  isProcesoOpen,
  isProcesoStagnant,
} from './procesoContratacionDisplayUtils'

interface ProcesoContratacionListRowProps {
  proceso: ProcesoContratacion
  onOpen: () => void
  onEdit: () => void
}

function ProcesoContratacionListRow({ proceso, onOpen, onEdit }: ProcesoContratacionListRowProps) {
  const open = isProcesoOpen(proceso)
  const stagnant = isProcesoStagnant(proceso)
  const progress = getHiringProgress(proceso)
  const closure = proceso.rawData.data?.closure

  return (
    <button
      type="button"
      className="crud-inset-row crud-row-accent-indigo proceso-contratacion-list-row"
      onClick={onOpen}
    >
      <div className="crud-row-content">
        <div className="crud-row-header">
          <div className="crud-row-title-section">
            <div
              className="crud-row-meta-indicator"
              style={{ backgroundColor: getProcesoEstadoColor(proceso.estado) }}
            />
            <div className="procesos-item-info">
              <div className="crud-row-title-row">
                <h3 className="crud-row-title">{proceso.titulo}</h3>
                {stagnant ? (
                  <span className="proceso-contratacion-list-row__badge proceso-contratacion-list-row__badge--stale">
                    <WarningIcon aria-hidden="true" />
                    Estancado
                  </span>
                ) : null}
                {!open && closure ? (
                  <span
                    className={`proceso-contratacion-closure-badge proceso-contratacion-closure-badge--${getClosureReasonTone(closure.reason)}`}
                  >
                    {getClosureReasonLabel(closure.reason)}
                  </span>
                ) : null}
              </div>
              <span className="crud-row-meta">{buildProcesoSummaryMeta(proceso)}</span>
            </div>
          </div>
          <div className="proceso-contratacion-list-row__actions">
            <button
              type="button"
              className="proceso-contratacion-list-row__action"
              aria-label="Editar proceso"
              onClick={event => {
                event.stopPropagation()
                onEdit()
              }}
            >
              <EditIcon fontSize="small" />
            </button>
            <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
          </div>
        </div>
        {progress > 0 ? (
          <span className="proceso-contratacion-list-row__progress" aria-hidden="true">
            <span className="proceso-contratacion-list-row__progress-bar" style={{ width: `${progress}%` }} />
          </span>
        ) : null}
      </div>
    </button>
  )
}

export default ProcesoContratacionListRow
