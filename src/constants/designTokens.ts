/**
 * Design token catalog — keep in sync with `src/index.css`.
 * Validated by `scripts/validate-design-tokens.py`.
 * Auto-generated supplement: `tokenCatalog.generated.ts` (P20).
 */

import { GENERATED_TOKEN_GROUPS } from './tokenCatalog.generated'

export type TokenKind = 'color' | 'length' | 'font' | 'spacing' | 'radius' | 'shadow' | 'other'

export interface DesignToken {
  name: string
  kind: TokenKind
  description?: string
  /** Static sample (section colors, layout widths) */
  sample?: string
  /** Render live swatch from var() — respects active theme */
  themed?: boolean
}

export interface DesignTokenGroup {
  id: string
  label: string
  tokens: DesignToken[]
}

export const DESIGN_TOKEN_GROUPS: DesignTokenGroup[] = [
  {
    id: 'layout',
    label: 'Layout',
    tokens: [
      { name: '--layout-max-width-hub', kind: 'length', sample: '800px', description: 'Hubs, StatusBar' },
      { name: '--layout-max-width-wide', kind: 'length', sample: '1200px', description: 'CRUD / tablas' },
  { name: '--layout-grid-gap-md', kind: 'spacing', sample: '1rem', description: 'Gap cuadrícula formularios' },
  { name: '--layout-grid-card-min', kind: 'length', sample: '16.25rem', description: 'Ancho mínimo tarjeta en grid' },
    ],
  },
  {
    id: 'typography',
    label: 'Tipografía',
    tokens: [
      { name: '--font-family', kind: 'font', themed: true },
      { name: '--font-size-xs', kind: 'font', sample: '0.875rem', description: 'Mínimo legible' },
      { name: '--font-size-sm', kind: 'font', sample: '1rem' },
      { name: '--font-size-base', kind: 'font', sample: '1.125rem', description: 'Cuerpo / inputs' },
      { name: '--font-size-md', kind: 'font', sample: '1.375rem' },
      { name: '--font-size-lg', kind: 'font', sample: '1.25rem' },
      { name: '--font-size-xl', kind: 'font', sample: '1.5rem' },
      { name: '--font-size-2xl', kind: 'font', sample: '1.875rem' },
      { name: '--font-size-xxl', kind: 'font', sample: '1.75rem' },
      { name: '--font-size-hero', kind: 'font', sample: '2rem', description: 'Debug icons, títulos compactos' },
      { name: '--font-size-3xl', kind: 'font', sample: '2.5rem' },
      { name: '--font-size-display', kind: 'font', sample: '4rem', description: 'Empty state icons' },
      { name: '--font-weight-normal', kind: 'font', sample: '400' },
      { name: '--font-weight-medium', kind: 'font', sample: '500' },
      { name: '--font-weight-semibold', kind: 'font', sample: '600' },
      { name: '--font-weight-bold', kind: 'font', sample: '700' },
      { name: '--letter-spacing-tight', kind: 'font', sample: '-0.01em' },
    ],
  },
  {
    id: 'spacing',
    label: 'Espaciado',
    tokens: [
      { name: '--spacing-xs', kind: 'spacing', sample: '0.5rem' },
      { name: '--spacing-sm', kind: 'spacing', sample: '0.75rem' },
      { name: '--spacing-md', kind: 'spacing', sample: '1rem' },
      { name: '--spacing-lg', kind: 'spacing', sample: '1.5rem' },
      { name: '--spacing-xl', kind: 'spacing', sample: '2rem' },
    ],
  },
  {
    id: 'radius',
    label: 'Border radius',
    tokens: [
      { name: '--radius-sm', kind: 'radius', sample: '12px' },
      { name: '--radius-md', kind: 'radius', sample: '16px' },
      { name: '--radius-lg', kind: 'radius', sample: '20px' },
      { name: '--radius-xl', kind: 'radius', sample: '24px' },
      { name: '--radius-2xl', kind: 'radius', sample: '32px' },
    ],
  },
  {
    id: 'surface',
    label: 'Superficies (tema)',
    tokens: [
      { name: '--bg-body', kind: 'color', themed: true },
      { name: '--bg-glass', kind: 'color', themed: true },
      { name: '--bg-glass-light', kind: 'color', themed: true },
      { name: '--border-glass', kind: 'color', themed: true },
      { name: '--text-primary', kind: 'color', themed: true },
      { name: '--text-secondary', kind: 'color', themed: true },
      { name: '--text-tertiary', kind: 'color', themed: true },
    ],
  },
  {
    id: 'accent',
    label: 'Acentos (tema)',
    tokens: [
      { name: '--accent-primary', kind: 'color', themed: true },
      { name: '--accent-primary-border', kind: 'color', themed: true },
      { name: '--accent-primary-border-strong', kind: 'color', themed: true },
      { name: '--accent-primary-text', kind: 'color', themed: true },
      { name: '--accent-success', kind: 'color', themed: true },
      { name: '--accent-danger', kind: 'color', themed: true },
      { name: '--accent-warning', kind: 'color', themed: true },
      { name: '--accent-warning-text', kind: 'color', themed: true },
      { name: '--accent-info', kind: 'color', themed: true },
      { name: '--btn-secondary-bg', kind: 'color', themed: true },
      { name: '--spinner-track', kind: 'color', themed: true },
      { name: '--border-contrast-high', kind: 'color', themed: true },
      { name: '--detail-actions-bg', kind: 'color', themed: true },
    ],
  },
  {
    id: 'financial',
    label: 'Montos semánticos (tema)',
    tokens: [
      { name: '--color-income-text', kind: 'color', themed: true },
      { name: '--color-expense-text', kind: 'color', themed: true },
      { name: '--color-savings-text', kind: 'color', themed: true },
      { name: '--color-info-text', kind: 'color', themed: true },
      { name: '--color-indigo-text', kind: 'color', themed: true },
      { name: '--color-income-border', kind: 'color', themed: true },
      { name: '--color-expense-border', kind: 'color', themed: true },
      { name: '--color-savings-border', kind: 'color', themed: true },
    ],
  },
  {
    id: 'row-accent',
    label: 'Acentos de fila CRUD (tema)',
    tokens: [
      { name: '--row-accent-default', kind: 'color', themed: true },
      { name: '--row-accent-blue', kind: 'color', themed: true },
      { name: '--row-accent-green', kind: 'color', themed: true },
      { name: '--row-accent-purple', kind: 'color', themed: true },
      { name: '--row-accent-indigo', kind: 'color', themed: true },
    ],
  },
  {
    id: 'semantic',
    label: 'Estados semánticos (tema)',
    tokens: [
      { name: '--priority-high-bg', kind: 'color', themed: true },
      { name: '--priority-medium-text', kind: 'color', themed: true },
      { name: '--priority-low-text', kind: 'color', themed: true },
      { name: '--badge-success-bg', kind: 'color', themed: true },
      { name: '--badge-info-bg', kind: 'color', themed: true },
      { name: '--badge-warning-bg', kind: 'color', themed: true },
      { name: '--highlight-success-text', kind: 'color', themed: true },
      { name: '--alert-warning-bg', kind: 'color', themed: true },
      { name: '--tab-active-bg', kind: 'color', themed: true },
      { name: '--btn-primary-bg', kind: 'color', themed: true },
      { name: '--btn-success-gradient', kind: 'color', themed: true },
      { name: '--input-focus-ring', kind: 'color', themed: true },
      { name: '--text-emphasis', kind: 'color', themed: true },
      { name: '--chip-info-text', kind: 'color', themed: true },
      { name: '--btn-icon-border', kind: 'color', themed: true },
      { name: '--btn-danger-hover-bg', kind: 'color', themed: true },
      { name: '--status-devalued-text', kind: 'color', themed: true },
      { name: '--status-loss-text', kind: 'color', themed: true },
    ],
  },
  {
    id: 'glass',
    label: 'Glass & overlays (tema)',
    tokens: [
      { name: '--glass-inset-highlight', kind: 'color', themed: true },
      { name: '--glass-inset-highlight-strong', kind: 'color', themed: true },
      { name: '--surface-overlay', kind: 'color', themed: true },
      { name: '--overlay-scrim', kind: 'color', themed: true },
      { name: '--modal-surface', kind: 'color', themed: true },
      { name: '--modal-border-accent', kind: 'color', themed: true },
      { name: '--empty-icon', kind: 'color', themed: true },
    ],
  },
  {
    id: 'danger',
    label: 'Danger semántico (tema)',
    tokens: [
      { name: '--color-danger-solid', kind: 'color', sample: '#ff3b30' },
      { name: '--color-danger-text', kind: 'color', themed: true },
      { name: '--color-danger-bg-soft', kind: 'color', themed: true },
      { name: '--color-danger-border-soft', kind: 'color', themed: true },
    ],
  },
  {
    id: 'section',
    label: 'Secciones iOS',
    tokens: [
      { name: '--section-finanzas', kind: 'color', sample: '#34c759' },
      { name: '--section-utilidades', kind: 'color', sample: '#007aff' },
      { name: '--section-lifestyle', kind: 'color', sample: '#ff9500' },
      { name: '--section-notificaciones', kind: 'color', sample: '#af52de' },
      { name: '--section-justicia', kind: 'color', sample: '#5856d6' },
      { name: '--section-danger', kind: 'color', sample: '#ff3b30' },
      { name: '--section-muted', kind: 'color', sample: '#8e8e93' },
    ],
  },
  {
    id: 'domain-surfaces',
    label: 'Superficies de dominio (P15)',
    tokens: [
      { name: '--surface-subscription-summary-bg', kind: 'color', themed: true },
      { name: '--surface-me-deben-summary-bg', kind: 'color', themed: true },
      { name: '--surface-streak-bg', kind: 'color', themed: true },
      { name: '--surface-secret-warning-bg', kind: 'color', themed: true },
      { name: '--surface-verify-success-bg', kind: 'color', themed: true },
      { name: '--app-icon-hover-shadow', kind: 'shadow', themed: true },
      { name: '--badge-inspiration-shadow', kind: 'shadow', themed: true },
    ],
  },
  {
    id: 'motion',
    label: 'Focus & motion (P16)',
    tokens: [
      { name: '--focus-outline-width', kind: 'length', sample: '2px' },
      { name: '--focus-outline-offset', kind: 'length', sample: '2px' },
      { name: '--focus-outline-color', kind: 'color', themed: true },
      { name: '--focus-outline-color-strong', kind: 'color', themed: true },
      { name: '--focus-danger-outline-color', kind: 'color', themed: true },
      { name: '--motion-lift-md', kind: 'length', sample: '-2px' },
      { name: '--motion-lift-lg', kind: 'length', sample: '-4px' },
      { name: '--motion-dropdown-shift', kind: 'length', sample: '-8px', description: 'Dropdown slide-down keyframe' },
      { name: '--motion-shift-x', kind: 'length', sample: '2px' },
      { name: '--motion-press-scale', kind: 'other', sample: '0.97' },
      { name: '--motion-hover-scale', kind: 'other', sample: '1.05' },
      { name: '--motion-fab-scale', kind: 'other', sample: '1.1', description: 'FAB / icon check hover scale' },
      { name: '--focus-outline-width-contrast', kind: 'length', sample: '3px' },
      { name: '--touch-target-min', kind: 'length', sample: '44px', description: 'Apple HIG mínimo' },
      { name: '--checkbox-accent', kind: 'color', themed: true },
      { name: '--transition-base', kind: 'other', sample: '0.2s' },
    ],
  },
  {
    id: 'chart',
    label: 'Chart.js',
    tokens: [
      { name: '--chart-danger-stroke', kind: 'color', themed: true },
      { name: '--chart-success-stroke', kind: 'color', themed: true },
      { name: '--chart-grid', kind: 'color', themed: true },
      { name: '--chart-tick', kind: 'color', themed: true },
    ],
  },
  ...GENERATED_TOKEN_GROUPS,
]

/** Flat list of all documented token names */
export const ALL_DOCUMENTED_TOKENS = DESIGN_TOKEN_GROUPS.flatMap(g => g.tokens.map(t => t.name))

/** Principio 1 — Jerarquía visual (ui-patterns.css) */
export const VISUAL_HIERARCHY_LEVELS = [
  { level: 'L1', className: 'app-page-title', role: 'Título de pantalla', cues: '3xl · bold · primary' },
  { level: 'L2', className: 'app-page-subtitle', role: 'Intro de pantalla', cues: 'base · normal · secondary' },
  { level: '—', className: 'app-page-header', role: 'Agrupa L1+L2', cues: 'espaciado tight' },
  { level: 'L3', className: 'app-section-title', role: 'Capítulo / bloque principal', cues: 'xl · semibold · primary' },
  { level: '—', className: 'app-section-lead', role: 'Lead bajo capítulo', cues: 'base · normal · secondary' },
  { level: 'L4', className: 'app-subsection-title', role: 'Sección de formulario', cues: 'lg · semibold · divisor' },
  { level: 'L5', className: 'app-group-label', role: 'Agrupador de lista', cues: 'xs · uppercase · tertiary' },
  { level: 'L6', className: 'modal-panel-title', role: 'Título de modal', cues: 'xl · semibold · primary' },
  { level: 'L8', className: 'crud-row-title', role: 'Título de fila', cues: 'lg · medium · primary' },
  { level: 'L9', className: 'form-label-base', role: 'Etiqueta de campo', cues: 'sm · medium · secondary' },
  { level: 'L10', className: 'app-caption', role: 'Meta / hint', cues: 'sm · normal · tertiary' },
  { level: '—', className: 'app-content-sections', role: 'Ritmo entre capítulos', cues: 'gap xl' },
] as const

export const PROGRESSIVE_DISCLOSURE_PATTERNS = [
  {
    id: 'progressive-flow',
    component: 'ProgressiveFlow + ProgressiveFlowNav',
    use: 'Formularios multi-paso con orientación (paso X de Y)',
  },
  {
    id: 'advice-banner',
    component: 'CollapsibleAdviceBanner',
    use: 'Contenido editorial / advertencias colapsables',
  },
  {
    id: 'progressive-reveal',
    className: 'progressive-reveal',
    use: 'Campos condicionales tras checkbox o selección',
  },
  {
    id: 'expandable-card',
    component: 'MetaGoalCard, crud-inset-row',
    use: 'Detalle bajo demanda en listas',
  },
] as const

/** Principio 3 — Patrones canónicos (usar siempre; desviar solo con justificación) */
export const CONSISTENCY_CANONICAL_PATTERNS = [
  { role: 'Acción primaria', classes: 'btn-base btn-accent btn-submit' },
  { role: 'Acción secundaria / cancelar', classes: 'btn-base btn-secondary' },
  { role: 'Pie de modal', classes: 'modal-actions-base + btn-base' },
  { role: 'Toolbar', classes: 'app-toolbar-button + app-toolbar-icon' },
  { role: 'Cerrar modal panel', classes: 'modal-panel-close' },
  { role: 'Icono en fila/tarjeta', classes: 'btn-icon [.btn-icon--danger]' },
  { role: 'Campo de formulario', classes: 'form-input-base + form-label-base' },
] as const

/** Colores semánticos para gráficos / inline styles — sincronizar con `src/index.css` */
export const SEMANTIC_UI_COLORS = {
  danger: '#ff3b30',
  success: '#34c759',
  warning: '#ff9500',
  info: '#007aff',
  neutral: '#8e8e93',
  teal: '#00c7be',
} as const

/** Principio 4 — Niveles de contraste (texto, acción, superficie) */
export const CONTRAST_LEVELS = [
  { tier: 'text-high', role: 'Contenido principal', classes: 'text-primary', token: '--text-primary' },
  { tier: 'text-mid', role: 'Soporte / labels', classes: 'text-secondary', token: '--text-secondary' },
  { tier: 'text-low', role: 'Meta / hints', classes: 'app-caption', token: '--text-tertiary' },
  { tier: 'action-critical', role: 'Eliminar irreversible', classes: 'btn-base btn-danger-solid', token: '--color-danger-solid' },
  { tier: 'action-high', role: 'Confirmar / guardar', classes: 'btn-base btn-accent btn-submit', token: '--accent-primary-solid' },
  { tier: 'action-mid', role: 'Peligro en contexto', classes: 'btn-base btn-danger | btn-soft-danger', token: '--accent-danger' },
  { tier: 'action-low', role: 'Cancelar / mantener', classes: 'btn-base btn-secondary', token: '--btn-secondary-bg' },
  { tier: 'icon-danger', role: 'Eliminar en fila', classes: 'btn-icon btn-icon--danger', token: '--color-danger-solid' },
  { tier: 'surface-critical', role: 'Alertas de borrado', classes: 'semantic-alert-danger | app-callout-danger', token: '--color-danger-bg-soft' },
  { tier: 'surface-warning', role: 'Advertencias', classes: 'semantic-alert-warning | form-alert-banner', token: '--alert-warning-border' },
] as const

/** Principio 5 — Patrones de accesibilidad WCAG */
export const ACCESSIBILITY_PATTERNS = [
  { wcag: '2.4.1', pattern: 'skip-link → #main-content', file: 'App.tsx + accessibility.css' },
  { wcag: '1.1.1', pattern: 'alt en imágenes; aria-label en botones icono', classes: 'sr-only' },
  { wcag: '2.4.7', pattern: 'Anillo :focus-visible en controles interactivos', file: 'accessibility.css' },
  { wcag: '2.1.1', pattern: 'Focus trap + Escape en modales', component: 'ModalOverlay + useModalAccessibility' },
  { wcag: '2.5.5', pattern: 'Touch target ≥ 44px', token: '--touch-target-min' },
  { wcag: '1.4.3', pattern: 'Contraste texto/fondo + prefers-contrast: more', file: 'accessibility.css' },
  { wcag: '4.1.3', pattern: 'Toasts con aria-live="polite"', component: 'NotificationContainer' },
  { wcag: '1.3.1', pattern: 'Labels asociados a campos', classes: 'form-label-base + htmlFor' },
  { wcag: '2.3.3', pattern: 'Animaciones respetan prefers-reduced-motion', file: 'motion-accessibility.css' },
] as const

/** Principio 6 — Proximidad visual (elementos relacionados juntos) */
export const PROXIMITY_PATTERNS = [
  { spacing: 'tight', token: '--spacing-xs', classes: 'app-control-group', use: 'Iconos / toggles en la misma fila' },
  { spacing: 'group', token: '--spacing-sm', classes: 'app-action-bar__cluster', use: 'Cancelar + Guardar; Anterior + Siguiente' },
  { spacing: 'section', token: '--spacing-xl', classes: 'app-content-sections', use: 'Capítulos de página no relacionados' },
  { spacing: 'zone', token: 'border-top', classes: 'modal-actions-base', use: 'Pie de modal separado del cuerpo' },
  { pattern: 'exit-separated', classes: 'app-action-bar__exit | progressive-flow__nav', use: 'Salir/cancelar lejos de avanzar' },
  { pattern: 'destructive-separated', classes: 'detail-button.delete | app-action-bar__destructive', use: 'Eliminar aparte de editar' },
  { pattern: 'field-siblings', classes: 'form-group-base, crud-form-row', use: 'Label + input; columnas hermanas' },
  { pattern: 'page-blocks', classes: 'app-content-section', use: 'Bloque cohesivo con gap sm interno' },
] as const

/** Principio 7 — Alineación y cuadrícula */
export const ALIGNMENT_PATTERNS = [
  { axis: 'page', classes: 'app-page-content-wide + crud-page-content', token: '--layout-max-width-wide' },
  { axis: 'column', classes: 'app-stack | app-content-sections', use: 'Contenido apilado, stretch horizontal' },
  { axis: 'form-2col', classes: 'app-grid-2 | crud-form-row', token: '--layout-grid-gap-md' },
  { axis: 'cards', classes: 'app-grid-cards', token: '--layout-grid-card-min' },
  { axis: 'auto-fill', classes: 'app-grid-auto', token: '--layout-grid-auto-min' },
  { axis: 'toolbar', classes: 'app-toolbar | app-row-between', use: 'Título/acciones en extremos' },
  { axis: 'detail', classes: 'detail-row + detail-label + detail-value', use: 'Label izq · valor der' },
  { axis: 'list', classes: 'glass-group', use: 'Filas alineadas en contenedor iOS' },
] as const

export const CSS_ARCHITECTURE_LAYERS = [
  { layer: 1, file: 'src/index.css', role: 'Tokens globales + tema (data-theme)' },
  { layer: 2, file: 'src/styles/shared.css', role: 'Botones, formularios, motion' },
  { layer: 2, file: 'src/styles/accessibility.css', role: 'Skip-link, sr-only, focus-visible, prefers-contrast' },
  { layer: 3, file: 'src/styles/ui-patterns.css', role: 'Jerarquía visual, toolbar, modales, glass-group' },
  { layer: 4, file: 'src/styles/domains/crud.css', role: 'Dropdown, detail panel, loader, empty state' },
  { layer: 5, file: 'src/styles/domains/crud-list-rows.css', role: 'Filas inset + jerarquía row-content/title' },
  { layer: 6, file: 'src/styles/domains/crud-row-slots.css', role: 'Slots, acentos y modificadores crud-row-*' },
  { layer: 7, file: 'src/styles/domains/crud-hub-rows.css', role: 'Filas hub (navegación estilo Settings)' },
  { layer: 8, file: 'src/styles/domains/crud-card-rows.css', role: 'Filas card (debt, proyecto, tarjetas)' },
  { layer: 9, file: 'src/styles/domains/crud-crypto-rows.css', role: 'Filas cripto wallet / transacciones' },
  { layer: 10, file: 'src/styles/domains/semantic-surfaces.css', role: 'Badges, tabs, alertas semánticas' },
  { layer: 11, file: 'src/styles/domains/crud-forms.css', role: 'Form-row y section-divider unificados' },
  { layer: 12, file: 'src/pages/*.css', role: 'Estilos únicos por pantalla' },
] as const
