/** CSS custom property references for iOS-style section accents (see index.css). */
export const sectionColor = {
  finanzas: 'var(--section-finanzas)',
  utilidades: 'var(--section-utilidades)',
  blue: 'var(--section-blue)',
  lifestyle: 'var(--section-lifestyle)',
  notificaciones: 'var(--section-notificaciones)',
  purple: 'var(--section-purple)',
  justicia: 'var(--section-justicia)',
  indigo: 'var(--section-indigo)',
  trabajo: 'var(--section-trabajo)',
  danger: 'var(--section-danger)',
  muted: 'var(--section-muted)',
  pink: 'var(--section-pink)',
  teal: 'var(--section-teal)',
  cyan: 'var(--section-cyan)',
  bitcoin: 'var(--section-bitcoin)',
  yellow: 'var(--section-yellow)',
  success: 'var(--section-success)',
} as const

export type SectionColorKey = keyof typeof sectionColor
