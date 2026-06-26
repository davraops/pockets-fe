import {
  createContext,
  useCallback,
  useContext,
  useId,
  useState,
  type ReactNode,
} from 'react'
import ModalOverlay from '../components/ModalOverlay'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

const DEFAULT_TITLES: Record<NonNullable<ConfirmOptions['variant']>, string> = {
  danger: 'Confirmar eliminación',
  default: 'Confirmar acción',
}

const DEFAULT_CONFIRM_LABELS: Record<NonNullable<ConfirmOptions['variant']>, string> = {
  danger: 'Eliminar',
  default: 'Confirmar',
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const titleId = useId()

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setPending({ ...options, resolve })
    })
  }, [])

  const close = (result: boolean) => {
    pending?.resolve(result)
    setPending(null)
  }

  const variant = pending?.variant ?? 'default'
  const title = pending?.title ?? DEFAULT_TITLES[variant]
  const confirmLabel = pending?.confirmLabel ?? DEFAULT_CONFIRM_LABELS[variant]
  const cancelLabel = pending?.cancelLabel ?? 'Cancelar'

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {pending && (
        <ModalOverlay onClose={() => close(false)} className="modal-overlay" titleId={titleId}>
          <div className="modal-content confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" id={titleId}>
                {title}
              </h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => close(false)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <div className="confirm-dialog-body">
              <p className="confirm-dialog-message">{pending.message}</p>
            </div>
            <div className="modal-actions-base">
              <button type="button" className="btn-base btn-secondary" onClick={() => close(false)}>
                {cancelLabel}
              </button>
              <button
                type="button"
                className={`btn-base ${variant === 'danger' ? 'btn-danger-solid' : 'btn-accent btn-submit'}`}
                onClick={() => close(true)}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmContextType {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }
  return context
}
