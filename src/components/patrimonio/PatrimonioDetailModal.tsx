import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ModalOverlay from '../ModalOverlay'
import type { PatrimonyItem } from './patrimonioTypes'
import {
  formatPatrimonyCurrency,
  formatPatrimonyDate,
  formatPatrimonyDetailSubtitle,
  getPatrimonyDetailFields,
} from './patrimonioDisplayUtils'

interface PatrimonioDetailModalProps {
  item: PatrimonyItem
  isBusy: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

function PatrimonioDetailModal({
  item,
  isBusy,
  onClose,
  onEdit,
  onDelete,
}: PatrimonioDetailModalProps) {
  const sections = getPatrimonyDetailFields(item)

  return (
    <ModalOverlay onClose={onClose} className="modal-overlay">
      <div
        className="modal-panel patrimonio-modal patrimonio-modal--detail"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title-patrimonio-detalle"
      >
        <div className="patrimonio-modal__header">
          <div className="patrimonio-modal__header-copy">
            <p className="patrimonio-modal__kicker">Bienes · Detalle</p>
            <h2 className="modal-panel-title" id="modal-title-patrimonio-detalle">
              {item.name}
            </h2>
            <p className="patrimonio-modal__subtitle">{formatPatrimonyDetailSubtitle(item)}</p>
          </div>
          <button className="modal-panel-close" onClick={onClose} aria-label="Cerrar" type="button">
            ×
          </button>
        </div>

        <div className="modal-panel-content patrimonio-modal__body">
          {sections.map(section => (
            <section key={section.title} className="patrimonio-modal__section">
              <h3 className="patrimonio-modal__section-title">{section.title}</h3>
              <dl className="patrimonio-modal__info-list">
                {section.fields.map(field => (
                  <div key={field.label} className="patrimonio-modal__info-item">
                    <dt className="patrimonio-modal__info-label">{field.label}</dt>
                    <dd className="patrimonio-modal__info-value">{field.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        <div className="modal-actions-base patrimonio-modal__footer patrimonio-modal__footer--detail">
          <button
            type="button"
            className="btn-base btn-accent patrimonio-modal__btn patrimonio-modal__btn--primary"
            onClick={onEdit}
            disabled={isBusy}
          >
            <EditIcon aria-hidden="true" />
            Editar
          </button>
          <button
            type="button"
            className="btn-base btn-secondary patrimonio-modal__btn patrimonio-modal__btn--danger"
            onClick={onDelete}
            disabled={isBusy}
          >
            <DeleteIcon aria-hidden="true" />
            Eliminar
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

export default PatrimonioDetailModal
