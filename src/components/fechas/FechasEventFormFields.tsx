import type { RefObject } from 'react'
import FechasRecurrenceFields from './FechasRecurrenceFields'
import type { FechasEventFormData, FechasEventFormErrors, RecurrenceFrequency } from './fechasFormUtils'

interface FechasEventFormFieldsProps {
  formData: FechasEventFormData
  formErrors: FechasEventFormErrors
  tituloRef: RefObject<HTMLInputElement | null>
  fechaRef: RefObject<HTMLInputElement | null>
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void
  onRecurrencePreset: (frequency: RecurrenceFrequency) => void
  tituloErrorId?: string
  fechaErrorId?: string
}

function FechasEventFormFields({
  formData,
  formErrors,
  tituloRef,
  fechaRef,
  onChange,
  onRecurrencePreset,
  tituloErrorId = 'titulo-error',
  fechaErrorId = 'fecha-error',
}: FechasEventFormFieldsProps) {
  return (
    <>
      <div className="fechas-form-notice">
        <span className="fechas-form-notice-icon">🚫</span>
        <span className="fechas-form-notice-text">
          Prohibido agregar eventos laborales aquí. Este espacio es solo para fechas y compromisos
          contigo y los tuyos.
        </span>
      </div>

      <div className="form-group-base">
        <label htmlFor="titulo" className="form-label-base form-label-base--comfortable">
          Título *
        </label>
        <input
          ref={tituloRef}
          type="text"
          id="titulo"
          name="titulo"
          value={formData.titulo}
          onChange={onChange}
          className={`form-input-base ${formErrors.titulo ? 'input-error' : ''}`}
          placeholder="Ej: Cumpleaños de Juan"
          aria-invalid={!!formErrors.titulo}
          {...(formErrors.titulo ? { 'aria-describedby': tituloErrorId } : {})}
        />
        {formErrors.titulo ? (
          <span id={tituloErrorId} className="fechas-form-error" role="alert">
            {formErrors.titulo}
          </span>
        ) : null}
      </div>

      <div className="form-group-base">
        <label htmlFor="descripcion" className="form-label-base form-label-base--comfortable">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          value={formData.descripcion}
          onChange={onChange}
          className="form-textarea-base"
          rows={3}
          placeholder="Descripción del evento (opcional)"
        />
      </div>

      <div className="form-group-base">
        <label htmlFor="fecha" className="form-label-base form-label-base--comfortable">
          Fecha *
        </label>
        <input
          ref={fechaRef}
          type="date"
          id="fecha"
          name="fecha"
          value={formData.fecha}
          onChange={onChange}
          className={`form-input-base ${formErrors.fecha ? 'input-error' : ''}`}
          aria-invalid={!!formErrors.fecha}
          {...(formErrors.fecha ? { 'aria-describedby': fechaErrorId } : {})}
        />
        {formErrors.fecha ? (
          <span id={fechaErrorId} className="fechas-form-error" role="alert">
            {formErrors.fecha}
          </span>
        ) : null}
      </div>

      <div className="form-group-base">
        <label className="fechas-form-checkbox-label">
          <input
            type="checkbox"
            name="esTodoElDia"
            checked={formData.esTodoElDia}
            onChange={onChange}
            className="fechas-form-checkbox"
          />
          <span>Todo el día</span>
        </label>
      </div>

      {!formData.esTodoElDia ? (
        <div className="form-group-base">
          <label htmlFor="hora" className="form-label-base form-label-base--comfortable">
            Hora
          </label>
          <input
            type="time"
            id="hora"
            name="hora"
            value={formData.hora}
            onChange={onChange}
            className="form-input-base"
          />
        </div>
      ) : null}

      <FechasRecurrenceFields
        formData={formData}
        formErrors={formErrors}
        onChange={onChange}
        onPreset={onRecurrencePreset}
      />

      <div className="form-group-base">
        <label htmlFor="ubicacion" className="form-label-base form-label-base--comfortable">
          Ubicación
        </label>
        <input
          type="text"
          id="ubicacion"
          name="ubicacion"
          value={formData.ubicacion}
          onChange={onChange}
          className="form-input-base"
          placeholder="Ej: Restaurante El Jardín"
        />
      </div>
    </>
  )
}

export default FechasEventFormFields
