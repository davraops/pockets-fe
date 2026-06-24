export interface FloatingMenuPosition {
  top: number
  left: number
}

export function computeFloatingMenuPosition(
  anchor: DOMRect,
  menuWidth: number,
  menuHeight: number,
  margin = 12
): FloatingMenuPosition {
  const gap = 8
  let top = anchor.bottom + gap
  let left = anchor.left

  if (top + menuHeight > window.innerHeight - margin) {
    top = Math.max(margin, anchor.top - menuHeight - gap)
  }

  if (left + menuWidth > window.innerWidth - margin) {
    left = Math.max(margin, window.innerWidth - menuWidth - margin)
  }

  if (left < margin) {
    left = margin
  }

  return { top, left }
}
