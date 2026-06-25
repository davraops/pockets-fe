import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import type { PatrimonyFormData, PatrimonyFormErrors } from '../patrimonio/patrimonioFormUtils'
import type { PatrimonySyncField } from '../../utils/transactionPatrimonyUtils'
import {
  PATRIMONY_CONDITION_OPTIONS,
  formatPatrimonyPreviewAmount,
  patrimonyFormToPreviewItem,
} from '../../utils/transactionPatrimonyUtils'
import TransaccionPatrimonioPreview from './TransaccionPatrimonioPreview'

interface TransaccionPatrimonioFieldsProps {
  formData: PatrimonyFormData
  formErrors: PatrimonyFormErrors
  categorySuggestions: string[]
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void
  onFieldTouch: (field: PatrimonySyncField) => void
}

function TransaccionPatrimonioFields({
  formData,
  formErrors,
  categorySuggestions,
  onChange,
  onFieldTouch,
}: TransaccionPatrimonioFieldsProps) {
  const previewItem = patrimonyFormToPreviewItem(formData)
  const purchaseSummary = formatPatrimonyPreviewAmount(formData.purchaseValue, formData.currency)
  const listId = 'patrimonio-category-suggestions'

  const handleFieldChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    onFieldTouch(event.target.name as PatrimonySyncField)
    onChange(event)
  }

  return (
    <section className="transaccion-patrimonio-panel" aria-labelledby="transaccion-patrimonio-title">
      <div className="transaccion-patrimonio-panel__header">
        <Inventory2OutlinedIcon className="transaccion-patrimonio-panel__icon" aria-hidden="true" />
        <div>
          <h3 className="transaccion-patrimonio-panel__title" id="transaccion-patrimonio-title">
            Registrar en Patrimonio
          </h3>
          <p className="transaccion-patrimonio-panel__hint">
            Los datos de la transacción se sincronizan mientras editas. Lo que cambies aquí se
            conserva.
          </p>
        </div>
      </div>

      <TransaccionPatrimonioPreview item={previewItem} />

      {(purchaseSummary || formData.purchaseDate) && (
        <div className="transaccion-patrimonio-panel__summary" aria-label="Resumen de la compra">
          {purchaseSummary ? (
            <span className="transaccion-patrimonio-panel__summary-chip transaccion-patrimonio-panel__summary-chip--value">
              {purchaseSummary}
            </span>
          ) : null}
          {formData.purchaseDate ? (
            <span className="transaccion-patrimonio-panel__summary-chip">
              {new Date(`${formData.purchaseDate}T12:00:00`).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          ) : null}
          {formData.currency ? (
            <span className="transaccion-patrimonio-panel__summary-chip">{formData.currency}</span>
          ) : null}
        </div>
      )}

      <div className="transaccion-patrimonio-panel__fields">
        <div className="form-group-base">
          <label htmlFor="patrimonio-name" className="form-label-base">
            Nombre del bien *
          </label>
          <input
            type="text"
            id="patrimonio-name"
            name="name"
            value={formData.name}
            onChange={handleFieldChange}
            className={`form-input-base ${formErrors.name ? 'input-error' : ''}`}
            placeholder="Ej: MacBook Pro, Reloj Submariner"
            aria-invalid={!!formErrors.name}
          />
          {formErrors.name ? (
            <span className="error-message" role="alert">
              {formErrors.name}
            </span>
          ) : null}
        </div>

        <div className="transaccion-patrimonio-panel__row">
          <div className="form-group-base">
            <label htmlFor="patrimonio-category" className="form-label-base">
              Categoría
            </label>
            <input
              type="text"
              id="patrimonio-category"
              name="category"
              list={listId}
              value={formData.category}
              onChange={handleFieldChange}
              className="form-input-base"
              placeholder="Ej: Electrónica, Relojes"
            />
            <datalist id={listId}>
              {categorySuggestions.map(category => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </div>

          <div className="form-group-base">
            <label htmlFor="patrimonio-condition" className="form-label-base">
              Condición
            </label>
            <select
              id="patrimonio-condition"
              name="condition"
              value={formData.condition}
              onChange={handleFieldChange}
              className="form-select-base"
            >
              <option value="">Sin especificar</option>
              {PATRIMONY_CONDITION_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="transaccion-patrimonio-panel__row">
          <div className="form-group-base">
            <label htmlFor="patrimonio-brand" className="form-label-base">
              Marca
            </label>
            <input
              type="text"
              id="patrimonio-brand"
              name="brand"
              value={formData.brand}
              onChange={handleFieldChange}
              className="form-input-base"
              placeholder="Ej: Apple, Rolex"
            />
          </div>

          <div className="form-group-base">
            <label htmlFor="patrimonio-model" className="form-label-base">
              Modelo
            </label>
            <input
              type="text"
              id="patrimonio-model"
              name="model"
              value={formData.model}
              onChange={handleFieldChange}
              className="form-input-base"
              placeholder='Ej: MacBook Pro 16"'
            />
          </div>
        </div>

        <div className="form-group-base">
          <label htmlFor="patrimonio-location" className="form-label-base">
            Ubicación
          </label>
          <input
            type="text"
            id="patrimonio-location"
            name="location"
            value={formData.location}
            onChange={handleFieldChange}
            className="form-input-base"
            placeholder="Ej: Oficina, Caja fuerte"
          />
        </div>
      </div>
    </section>
  )
}

export default TransaccionPatrimonioFields
