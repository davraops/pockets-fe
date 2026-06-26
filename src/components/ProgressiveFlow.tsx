import type { ReactNode } from 'react'

export interface ProgressiveFlowStep {
  id: string
  title: string
  description?: string
}

interface ProgressiveFlowProps {
  steps: readonly ProgressiveFlowStep[]
  currentStep: number
  children: ReactNode
  className?: string
  'aria-label'?: string
}

interface ProgressiveFlowNavProps {
  currentStep: number
  totalSteps: number
  onBack: () => void
  onNext: () => void
  canAdvance?: boolean
  isSaving?: boolean
  submitLabel?: string
  nextLabel?: string
  backLabel?: string
  cancelLabel?: string
  onCancel?: () => void
  navClassName?: string
  cancelClassName?: string
  backClassName?: string
  primaryClassName?: string
}

export function ProgressiveFlow({
  steps,
  currentStep,
  children,
  className,
  'aria-label': ariaLabel,
}: ProgressiveFlowProps) {
  const total = steps.length
  const safeStep = Math.min(Math.max(currentStep, 0), total - 1)
  const current = steps[safeStep]
  const progressPercent = total > 0 ? ((safeStep + 1) / total) * 100 : 0

  return (
    <div
      className={`progressive-flow${className ? ` ${className}` : ''}`}
      aria-label={ariaLabel}
    >
      <div className="progressive-flow__header">
        <p className="progressive-flow__counter" aria-live="polite">
          Paso {safeStep + 1} de {total}
        </p>
        <div
          className="progressive-flow__progress"
          role="progressbar"
          aria-valuenow={safeStep + 1}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={`Progreso del formulario: paso ${safeStep + 1} de ${total}`}
        >
          <div
            className="progressive-flow__progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <h3 className="progressive-flow__step-title">{current.title}</h3>
        {current.description ? (
          <p className="progressive-flow__step-desc">{current.description}</p>
        ) : null}
        <ol className="progressive-flow__step-list" aria-label="Pasos del flujo">
          {steps.map((step, index) => {
            const isCurrent = index === safeStep
            const isDone = index < safeStep
            return (
              <li
                key={step.id}
                className={`progressive-flow__step-marker${
                  isCurrent ? ' progressive-flow__step-marker--current' : ''
                }${isDone ? ' progressive-flow__step-marker--done' : ''}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span className="progressive-flow__step-marker-index" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="progressive-flow__step-marker-label">{step.title}</span>
              </li>
            )
          })}
        </ol>
      </div>
      <div className="progressive-flow__panel">{children}</div>
    </div>
  )
}

export function ProgressiveFlowNav({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  canAdvance = true,
  isSaving = false,
  submitLabel = 'Guardar',
  nextLabel = 'Siguiente',
  backLabel = 'Anterior',
  cancelLabel = 'Cancelar',
  onCancel,
  navClassName = 'modal-actions-base',
  cancelClassName = 'btn-base btn-secondary',
  backClassName = 'btn-base btn-secondary',
  primaryClassName = 'btn-base btn-accent btn-submit',
}: ProgressiveFlowNavProps) {
  const isFirst = currentStep <= 0
  const isLast = currentStep >= totalSteps - 1

  return (
    <div className={`progressive-flow__nav${navClassName ? ` ${navClassName}` : ''}`}>
      {onCancel ? (
        <button type="button" className={cancelClassName} onClick={onCancel} disabled={isSaving}>
          {cancelLabel}
        </button>
      ) : (
        <span className="progressive-flow__nav-spacer" aria-hidden="true" />
      )}

      <div className="progressive-flow__nav-primary">
        {!isFirst ? (
          <button type="button" className={backClassName} onClick={onBack} disabled={isSaving}>
            {backLabel}
          </button>
        ) : null}

        {isLast ? (
          <button type="submit" disabled={isSaving || !canAdvance} className={primaryClassName}>
            {isSaving ? 'Guardando...' : submitLabel}
          </button>
        ) : (
          <button
            type="button"
            className={primaryClassName}
            onClick={onNext}
            disabled={!canAdvance || isSaving}
          >
            {nextLabel}
          </button>
        )}
      </div>
    </div>
  )
}
