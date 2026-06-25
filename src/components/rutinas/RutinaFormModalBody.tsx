import type { RefObject } from 'react'
import type { Routine, RoutineFormData } from './routineTypes'

export const DAYS_OF_WEEK_OPTIONS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
] as const

interface RutinaFormModalBodyProps {
  formData: RoutineFormData
  formErrors: Record<string, string>
  isLoading: boolean
  isEditing: boolean
  titleRef: RefObject<HTMLInputElement | null>
  dayOfMonthRef: RefObject<HTMLInputElement | null>
  daysOfWeekRef: RefObject<HTMLDivElement | null>
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  onDayToggle: (day: number) => void
  onSubmit: (event: React.FormEvent) => void
  onCancel: () => void
}

function RutinaFormModalBody({
  formData,
  formErrors,
  isLoading,
  isEditing,
  titleRef,
  dayOfMonthRef,
  daysOfWeekRef,
  onChange,
  onDayToggle,
  onSubmit,
  onCancel,
}: RutinaFormModalBodyProps) {
  return (
    <form onSubmit={onSubmit} className="rutinas-modal-form" noValidate>
      {isEditing ? (
        <div className="rutinas-warning-message" role="note">
          <div className="rutinas-warning-icon" aria-hidden="true">
            !
          </div>
          <div className="rutinas-warning-content">
            <p className="rutinas-warning-title">Cambios y rachas</p>
            <p className="rutinas-warning-text">
              Modificar la frecuencia o los días puede afectar tus rachas. Ajusta solo si realmente
              cambió tu compromiso.
            </p>
          </div>
        </div>
      ) : null}

      <div className="rutinas-form-group">
        <label htmlFor="title" className="form-label-base">
          Título *
        </label>
        <input
          ref={titleRef}
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={onChange}
          className={`form-input-base ${formErrors.title ? 'input-error' : ''}`}
          placeholder="Ej: Ejercicio matutino"
          autoFocus={!isEditing}
          aria-invalid={!!formErrors.title}
          {...(formErrors.title ? { 'aria-describedby': 'title-error' } : {})}
        />
        {formErrors.title ? (
          <span id="title-error" className="rutinas-form-error" role="alert">
            {formErrors.title}
          </span>
        ) : null}
      </div>

      <div className="rutinas-form-group">
        <label htmlFor="description" className="form-label-base">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={onChange}
          className="form-textarea-base"
          rows={3}
          placeholder="¿Qué implica cumplir esta rutina?"
        />
      </div>

      <div className="rutinas-form-row">
        <div className="rutinas-form-group rutinas-form-group--grow">
          <label htmlFor="frequency" className="form-label-base">
            Frecuencia *
          </label>
          <select
            id="frequency"
            name="frequency"
            value={formData.frequency}
            onChange={onChange}
            className="form-select-base"
          >
            <option value="daily">Diaria</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
          </select>
        </div>

        <div className="rutinas-form-group rutinas-form-group--color">
          <label htmlFor="color" className="form-label-base">
            Color
          </label>
          <input
            type="color"
            id="color"
            name="color"
            value={formData.color}
            onChange={onChange}
            className="rutinas-form-color-input"
            aria-label="Color de la rutina"
          />
        </div>
      </div>

      {formData.frequency === 'weekly' ? (
        <div className="rutinas-form-group">
          <label className="form-label-base">Días de la semana *</label>
          <div id="days-of-week-group" ref={daysOfWeekRef} className="rutinas-days-selector">
            {DAYS_OF_WEEK_OPTIONS.map(day => (
              <button
                key={day.value}
                type="button"
                className={`rutinas-day-button ${formData.days_of_week.includes(day.value) ? 'selected' : ''}`}
                onClick={() => onDayToggle(day.value)}
                aria-pressed={formData.days_of_week.includes(day.value)}
              >
                {day.label}
              </button>
            ))}
          </div>
          {formErrors.days_of_week ? (
            <span id="days-of-week-error" className="rutinas-form-error" role="alert">
              {formErrors.days_of_week}
            </span>
          ) : null}
        </div>
      ) : null}

      {formData.frequency === 'monthly' ? (
        <div className="rutinas-form-group">
          <label htmlFor="day_of_month" className="form-label-base">
            Día del mes *
          </label>
          <input
            ref={dayOfMonthRef}
            type="number"
            id="day_of_month"
            name="day_of_month"
            value={formData.day_of_month ?? ''}
            onChange={onChange}
            min="1"
            max="31"
            className={`form-input-base ${formErrors.day_of_month ? 'input-error' : ''}`}
            placeholder="1-31"
            aria-invalid={!!formErrors.day_of_month}
            {...(formErrors.day_of_month ? { 'aria-describedby': 'day-of-month-error' } : {})}
          />
          {formErrors.day_of_month ? (
            <span id="day-of-month-error" className="rutinas-form-error" role="alert">
              {formErrors.day_of_month}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="rutinas-form-row">
        <div className="rutinas-form-group rutinas-form-group--grow">
          <label htmlFor="scheduled_time" className="form-label-base">
            Hora programada
          </label>
          <input
            type="time"
            id="scheduled_time"
            name="scheduled_time"
            value={formData.scheduled_time}
            onChange={onChange}
            className="form-input-base"
          />
        </div>

        <div className="rutinas-form-group rutinas-form-group--grow">
          <label htmlFor="duration" className="form-label-base">
            Duración (min)
          </label>
          <input
            type="number"
            id="duration"
            name="duration"
            value={formData.duration ?? ''}
            onChange={onChange}
            min="0"
            className="form-input-base"
            placeholder="30"
          />
        </div>
      </div>

      <p className="rutinas-form-help-text">
        La hora y duración son opcionales; te ayudan a organizar el día en Mi Día.
      </p>

      <div className="rutinas-modal-form-actions">
        <button
          type="button"
          className="btn-base btn-secondary lifestyle-modal__btn"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn-base btn-accent lifestyle-modal__btn lifestyle-modal__btn--primary"
          disabled={isLoading}
        >
          {isLoading ? (isEditing ? 'Guardando…' : 'Creando…') : isEditing ? 'Guardar cambios' : 'Crear rutina'}
        </button>
      </div>
    </form>
  )
}

export default RutinaFormModalBody
