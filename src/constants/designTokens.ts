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

export const CSS_ARCHITECTURE_LAYERS = [
  { layer: 1, file: 'src/index.css', role: 'Tokens globales + tema (data-theme)' },
  { layer: 2, file: 'src/styles/shared.css', role: 'Botones, formularios, motion + accessibility' },
  { layer: 3, file: 'src/styles/ui-patterns.css', role: 'Toolbar, modales, glass-group' },
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
