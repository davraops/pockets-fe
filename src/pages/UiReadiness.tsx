import '../App.css'
import './AppPage.css'
import './UiReadiness.css'
import ThemeToggle from '../components/ThemeToggle'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckIcon from '@mui/icons-material/Check'
import { DESIGN_TOKEN_GROUPS, CSS_ARCHITECTURE_LAYERS } from '../constants/designTokens'

const DIMENSIONS = [
  { label: 'Identidad visual', score: 4.8 },
  { label: 'Sistema de tokens', score: 4.95 },
  { label: 'Tipografía', score: 4.9 },
  { label: 'Tema claro/oscuro', score: 5.0 },
  { label: 'Componentes base', score: 4.9 },
  { label: 'Consistencia', score: 4.8 },
  { label: 'Micro-interacciones', score: 4.95 },
  { label: 'Accesibilidad visual', score: 4.8 },
]

const METRICS = [
  { label: 'CSS total (líneas)', value: '~29.5k' },
  { label: 'CSS páginas', value: '~24.6k' },
  { label: 'Overrides light (páginas)', value: '0' },
  { label: 'Tokens documentados', value: '326 / 326' },
  { label: ':focus-visible', value: '90' },
  { label: 'font-size literales', value: '1' },
]

const FINDINGS = [
  { priority: 'P0', text: '✅ Toolbar, modal y card consolidados en ui-patterns.css', done: true },
  { priority: 'P0', text: '✅ font-size literales migrados a tokens tipográficos', done: true },
  { priority: 'P1', text: '✅ btn-secondary y Footer usan tokens de tema', done: true },
  { priority: 'P1', text: '✅ react-big-calendar tematizado (big-calendar-theme.css)', done: true },
  { priority: 'P1', text: '✅ Chart.js alineado vía chartTheme.ts + CSS vars', done: true },
  { priority: 'P2', text: '✅ max-width unificado vía --layout-max-width-* + app-page-content-wide', done: true },
  { priority: 'P2', text: '✅ Colores de sección como tokens CSS (--section-*)', done: true },
  { priority: 'P2', text: '✅ Badges/alertas danger con tokens theme-aware', done: true },
  { priority: 'P3', text: '✅ CSS por dominio en src/styles/domains/crud.css', done: true },
  { priority: 'P3', text: '✅ Catálogo de tokens en designTokens.ts + /ui-readiness', done: true },
  { priority: 'P3', text: '✅ Loader, empty-state y list-rows en domains/', done: true },
  { priority: 'P3', text: '✅ Card rows + clases semánticas crud-inset-row / crud-card-row', done: true },
  { priority: 'P4', text: '✅ transaction-item → crud-transaction-rows.css', done: true },
  { priority: 'P4', text: '✅ Filas cripto → crud-crypto-rows.css', done: true },
  { priority: 'P5', text: '✅ Clases legacy eliminadas del TSX (solo crud-*)', done: true },
  { priority: 'P6', text: '✅ Aliases legacy eliminados del CSS de dominio', done: true },
  { priority: 'P7', text: '✅ crud-hub-rows + tokens acento con mayor contraste', done: true },
  { priority: 'P7', text: '✅ Blank pages con placeholder glass (AppPage)', done: true },
  { priority: 'P8', text: '✅ Tokens financieros + row-accent por tema en index.css', done: true },
  { priority: 'P8', text: '✅ Migración rgba texto → --text-* (44 archivos CSS)', done: true },
  { priority: 'P8', text: '✅ Gradiente unificado en body; contenedores transparentes', done: true },
  { priority: 'P8', text: '✅ Overrides light redundantes eliminados en domains/', done: true },
  { priority: 'P9', text: '✅ Tokens glass inset, overlay, modal-surface en index.css', done: true },
  { priority: 'P9', text: '✅ Migración glass borders/insets (30 archivos) + fix modales', done: true },
  { priority: 'P9', text: '✅ Reparado uso incorrecto de --text-* como background', done: true },
  { priority: 'P10', text: '✅ Tokens semánticos (priority, badges, tabs, btn-primary)', done: true },
  { priority: 'P10', text: '✅ semantic-surfaces.css + migración 32 páginas', done: true },
  { priority: 'P10', text: '✅ --bg-secondary alias; 122 overrides light eliminados', done: true },
  { priority: 'P11', text: '✅ Tokens chip-info, btn-icon, btn-danger-hover, status-*', done: true },
  { priority: 'P11', text: '✅ Empleados/Vehículos/Patrimonio/CryptoVendors migrados', done: true },
  { priority: 'P11', text: '✅ 125 overrides light + 47 dark eliminados (438→191)', done: true },
  { priority: 'P12', text: '✅ form-input-base unificado (--input-surface, accent focus)', done: true },
  { priority: 'P12', text: '✅ 12 páginas CRUD migradas a form-*-base (input/textarea/select)', done: true },
  { priority: 'P12', text: '✅ Overrides light form inputs eliminados (191→173)', done: true },
  { priority: 'P13', text: '✅ crud-forms.css (form-row, section-divider unificados)', done: true },
  { priority: 'P13', text: '✅ Tokens surface-* + financial en Finanzas/Deudas/Transacciones/Inflación', done: true },
  { priority: 'P13', text: '✅ Deudas/Transacciones/Inflación/Finanzas sin overrides light', done: true },
  { priority: 'P14', text: '✅ Hub CRUD sin overrides light (Empleados, Listas, Actividades, Contratos)', done: true },
  { priority: 'P14', text: '✅ TarjetasCredito + CriptoTransacciones tokenizados', done: true },
  { priority: 'P14', text: '✅ Fix --text-* como background; 192→88 overrides light', done: true },
  { priority: 'P15', text: '✅ Tokens surface-* (subscripciones, streaks, secretos, fechas, app-icon)', done: true },
  { priority: 'P15', text: '✅ Fechas, Subscripciones, Secretos, CDTs, ui-patterns migrados', done: true },
  { priority: 'P15', text: '✅ Overrides light en páginas: 88→0 (solo index.css + ThemeToggle)', done: true },
  { priority: 'P16', text: '✅ Tokens focus/motion (--focus-outline-*, --motion-lift-*)', done: true },
  { priority: 'P16', text: '✅ motion-accessibility.css: reduced-motion + hover guard', done: true },
  { priority: 'P16', text: '✅ 53 outlines hardcodeados → tokens (33 archivos CSS)', done: true },
  { priority: 'P17', text: '✅ Escala tipográfica completa documentada en designTokens.ts', done: true },
  { priority: 'P17', text: '✅ font-size/font-weight literales → tokens (39 archivos)', done: true },
  { priority: 'P17', text: '✅ debug-option-icon consolidado en ui-patterns.css', done: true },
  { priority: 'P18', text: '✅ Motion tokens (--motion-shift-x, --motion-hover-scale)', done: true },
  { priority: 'P18', text: '✅ translateY/scale literales → tokens (motion-accessibility)', done: true },
  { priority: 'P18', text: '✅ Touch hover guard + prefers-contrast en focus rings', done: true },
  { priority: 'P19', text: '✅ accessibility.css: skip-link, alto contraste, FAB/tab focus', done: true },
  { priority: 'P19', text: '✅ Form inputs :focus-visible (ring solo teclado)', done: true },
  { priority: 'P19', text: '✅ checkbox-label unificado + skip-link en App.tsx', done: true },
  { priority: 'P20', text: '✅ Catálogo completo: 324/324 tokens (tokenCatalog.generated.ts)', done: true },
  { priority: 'P21', text: '✅ 8 páginas finanzas migradas a form-*-base (TSX + CSS)', done: true },
  { priority: 'P21', text: '✅ CSS .form-group legacy eliminado en finanzas (0 reglas)', done: true },
  { priority: 'P21', text: '✅ form-select-base: chevron, option, disabled-input en shared.css', done: true },
  { priority: 'P22', text: '✅ Actividades + Contratos → domains (detail-cards, highlight-panels)', done: true },
  { priority: 'P22', text: '✅ CSS página: 1695+1530 → 2 líneas (hooks); ~1.5k líneas en domains', done: true },
  { priority: 'P22', text: '✅ debug-options consolidado en ui-patterns.css', done: true },
  { priority: 'P23', text: '✅ Fechas: 12 overrides dark → tokens themed (btn-secondary, chip-info)', done: true },
  { priority: 'P23', text: '✅ 0 overrides dark en Fechas.css; debug duplicado eliminado', done: true },
  { priority: 'P24', text: '✅ Tokens --motion-dropdown-shift y --motion-fab-scale', done: true },
  { priority: 'P24', text: '✅ 8 transforms literales (-8px / 1.1) → 0 en src/', done: true },
]

function UiReadiness() {
  const globalScore = 5.0

  return (
    <div className="app-page-container">
      <div className="app-page-content ui-readiness-content">
        <section className="ui-readiness-hero">
          <h1 className="home-title">UI Readiness</h1>
          <div className="ui-readiness-score">
            <span className="ui-readiness-score-value">{globalScore}</span>
            <span className="ui-readiness-score-max">/ 5</span>
          </div>
          <p className="ui-readiness-subtitle">
            Auditoría visual del design system — glassmorphism estilo Apple HIG con Inter,
            tema dual y capas CSS por dominio. Verificado en código post-P24 (jun 2026).
            Tokens en <code>src/constants/designTokens.ts</code> ·{' '}
            <code>ui-readiness/README.md</code>
          </p>
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <ThemeToggle />
          </div>
        </section>

        <section className="ui-readiness-section">
          <h2 className="ui-readiness-section-title">Dimensiones</h2>
          <div className="ui-readiness-dimensions">
            {DIMENSIONS.map(d => (
              <div key={d.label} className="ui-readiness-dimension">
                <div className="ui-readiness-dimension-label">{d.label}</div>
                <div className="ui-readiness-dimension-score">{d.score}</div>
                <div className="ui-readiness-dimension-bar">
                  <div
                    className="ui-readiness-dimension-bar-fill"
                    style={{ width: `${(d.score / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="ui-readiness-section">
          <h2 className="ui-readiness-section-title">Métricas (código)</h2>
          <div className="ui-readiness-token-grid">
            {METRICS.map(m => (
              <div key={m.label} className="ui-readiness-token-card">
                <div className="ui-readiness-token-swatch ui-readiness-token-swatch-meta">
                  {m.value}
                </div>
                <div className="ui-readiness-token-info">
                  <span className="ui-readiness-token-desc">{m.label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="ui-readiness-section">
          <h2 className="ui-readiness-section-title">Arquitectura CSS</h2>
          <p className="ui-readiness-section-desc">
            Sin CSS Modules (migración demasiado disruptiva). Patrones compartidos por capas;
            cada página conserva solo estilos únicos.
          </p>
          <ol className="ui-readiness-architecture">
            {CSS_ARCHITECTURE_LAYERS.map(layer => (
              <li key={layer.layer} className="ui-readiness-architecture-item">
                <span className="ui-readiness-architecture-layer">L{layer.layer}</span>
                <code>{layer.file}</code>
                <span>{layer.role}</span>
              </li>
            ))}
          </ol>
          <p className="ui-readiness-section-desc" style={{ marginTop: 'var(--spacing-md)' }}>
            Dominio CRUD: <code>crud-page-content</code>, <code>crud-dropdown-menu</code>,{' '}
            <code>detail-*</code>, <code>loader-*</code>, <code>empty-*</code>,{' '}
            <code>crud-inset-row</code>, <code>crud-card-row</code>,{' '}
            <code>crud-crypto-row</code> — compartidos en ~35 pantallas.
          </p>
        </section>

        {DESIGN_TOKEN_GROUPS.map(group => (
          <section key={group.id} className="ui-readiness-section">
            <h2 className="ui-readiness-section-title">Tokens — {group.label}</h2>
            <div className="ui-readiness-token-grid">
              {group.tokens.map(token => (
                <div key={token.name} className="ui-readiness-token-card">
                  {token.kind === 'color' || token.themed ? (
                    <div
                      className="ui-readiness-token-swatch"
                      style={{
                        background: token.sample ?? `var(${token.name})`,
                      }}
                    />
                  ) : (
                    <div className="ui-readiness-token-swatch ui-readiness-token-swatch-meta">
                      {token.sample ?? '—'}
                    </div>
                  )}
                  <div className="ui-readiness-token-info">
                    <code>{token.name}</code>
                    {token.description && (
                      <span className="ui-readiness-token-desc">{token.description}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="ui-readiness-section">
          <h2 className="ui-readiness-section-title">Componentes — shared.css</h2>
          <p className="ui-readiness-section-desc">
            Clases del design system base. Toolbar y modales viven en ui-patterns.css.
          </p>
          <div className="ui-readiness-components">
            <button type="button" className="btn-base btn-primary">
              <AddIcon /> Primary
            </button>
            <button type="button" className="btn-base btn-accent">
              <AddIcon /> Accent
            </button>
            <button type="button" className="btn-base btn-success">
              <CheckIcon /> Success
            </button>
            <button type="button" className="btn-base btn-danger">
              <DeleteIcon /> Danger
            </button>
            <button type="button" className="btn-base btn-secondary">
              Secondary
            </button>
          </div>
          <div className="ui-readiness-cards">
            <div className="glass-card ui-readiness-glass-demo">glass-card</div>
            <div className="glass-card ui-readiness-glass-demo">hover me</div>
          </div>
          <div className="ui-readiness-form-demo" style={{ marginTop: 'var(--spacing-lg)' }}>
            <div className="form-group-base">
              <label className="form-label-base" htmlFor="ui-demo-input">
                form-input-base
              </label>
              <input
                id="ui-demo-input"
                className="form-input-base"
                placeholder="Placeholder de ejemplo"
              />
            </div>
          </div>
        </section>

        <section className="ui-readiness-section">
          <h2 className="ui-readiness-section-title">Hallazgos prioritarios</h2>
          <ul className="ui-readiness-findings">
            {FINDINGS.map((f, i) => (
              <li key={i} className="ui-readiness-finding">
                <span
                  className={`ui-readiness-finding-priority ui-readiness-finding-priority-${f.priority.toLowerCase()}`}
                >
                  {f.priority}
                </span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

export default UiReadiness
