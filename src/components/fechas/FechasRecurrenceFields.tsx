import RepeatIcon from '@mui/icons-material/Repeat'
import type { FechasEventFormData, FechasEventFormErrors } from './fechasFormUtils'
import {
  getRecurrenceIntervalLabel,
  RECURRENCE_FREQUENCY_OPTIONS,
  type RecurrenceFrequency,
} from './fechasFormUtils'

interface FechasRecurrenceFieldsProps {
  formData: FechasEventFormData
  formErrors: FechasEventFormErrors
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void
  onPreset: (frequency: RecurrenceFrequency) => void
}

function FechasRecurrenceFields({
  formData,
  formErrors,
  onChange,
  onPreset,
}: FechasRecurrenceFieldsProps) {
  return (
    <section className="fechas-recurrence-panel" aria-labelledby="fechas-recurrence-title">
      <label className="fechas-form-checkbox-label fechas-recurrence-panel__toggle">
        <input
          type="checkbox"
          name="esRecurrente"
          checked={formData.esRecurrente}
          onChange={onChange}
          className="fechas-form-checkbox"
        />
        <RepeatIcon className="fechas-recurrence-panel__toggle-icon" aria-hidden="true" />
        <span>
          <span className="fechas-recurrence-panel__toggle-title" id="fechas-recurrence-title">
            Evento recurrente
          </span>
          <span className="fechas-recurrence-panel__toggle-hint">
            Ideal para cumpleaños, aniversarios y compromisos que se repiten
          </span>
        </span>
      </label>

      {formData.esRecurrente ? (
        <div className="fechas-recurrence-panel__body">
          <div className="fechas-recurrence-presets" role="group" aria-label="Frecuencias rápidas">
            {RECURRENCE_FREQUENCY_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                className={`fechas-recurrence-preset${formData.frecuenciaRecurrencia === option.value ? ' fechas-recurrence-preset--active' : ''}`}
                onClick={() => onPreset(option.value)}
                aria-pressed={formData.frecuenciaRecurrencia === option.value}
              >
                <span className="fechas-recurrence-preset__label">{option.label}</span>
                <span className="fechas-recurrence-preset__hint">{option.hint}</span>
              </button>
            ))}
          </div>

          <div className="fechas-recurrence-panel__row">
            <div className="form-group-base">
              <label htmlFor="frecuenciaRecurrencia" className="form-label-base">
                Frecuencia *
              </label>
              <select
                id="frecuenciaRecurrencia"
                name="frecuenciaRecurrencia"
                value={formData.frecuenciaRecurrencia}
                onChange={onChange}
                className={`form-select-base${formErrors.frecuenciaRecurrencia ? ' input-error' : ''}`}
                aria-invalid={!!formErrors.frecuenciaRecurrencia}
              >
                <option value="">Selecciona frecuencia</option>
                {RECURRENCE_FREQUENCY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formErrors.frecuenciaRecurrencia ? (
                <span className="fechas-form-error" role="alert">
                  {formErrors.frecuenciaRecurrencia}
                </span>
              ) : null}
            </div>

            <div className="form-group-base">
              <label htmlFor="intervaloRecurrencia" className="form-label-base">
                Cada
              </label>
              <div className="fechas-recurrence-interval">
                <input
                  type="number"
                  id="intervaloRecurrencia"
                  name="intervaloRecurrencia"
                  min={1}
                  step={1}
                  value={formData.intervaloRecurrencia}
                  onChange={onChange}
                  className="form-input-base fechas-recurrence-interval__input"
                />
                <span className="fechas-recurrence-interval__unit">
                  {getRecurrenceIntervalLabel(formData.frecuenciaRecurrencia)}
                </span>
              </div>
            </div>
          </div>

          <div className="form-group-base">
            <label htmlFor="fechaFinRecurrencia" className="form-label-base">
              Fin de recurrencia (opcional)
            </label>
            <input
              type="date"
              id="fechaFinRecurrencia"
              name="fechaFinRecurrencia"
              value={formData.fechaFinRecurrencia}
              onChange={onChange}
              className="form-input-base"
            />
            <p className="fechas-recurrence-panel__help">
              Déjalo vacío si el evento se repite indefinidamente (común en cumpleaños).
            </p>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default FechasRecurrenceFields
