import { useId, useRef, useEffect, type ReactNode } from 'react'
import { useModalAccessibility } from '../hooks/useModalAccessibility'

interface ModalOverlayProps {
  onClose: () => void
  children: ReactNode
  className?: string
  titleId?: string
  'aria-label'?: string
}

function ModalOverlay({
  onClose,
  children,
  className = 'modal-overlay',
  titleId,
  'aria-label': ariaLabel,
}: ModalOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const fallbackTitleId = useId()

  useModalAccessibility(true, onClose, overlayRef)

  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay || titleId || ariaLabel) return

    const titled = overlay.querySelector<HTMLElement>(
      '.modal-title[id], .modal-panel-title[id], h2[id].modal-title, h2[id].modal-panel-title'
    )
    if (titled?.id) {
      overlay.setAttribute('aria-labelledby', titled.id)
    } else {
      overlay.setAttribute('aria-labelledby', fallbackTitleId)
    }
  }, [titleId, ariaLabel, fallbackTitleId, children])

  const labelledBy = titleId ?? (ariaLabel ? undefined : fallbackTitleId)

  return (
    <div
      ref={overlayRef}
      className={className}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-label={ariaLabel}
      onClick={onClose}
    >
      {children}
    </div>
  )
}

export default ModalOverlay
