import { Link } from 'react-router-dom'
import '../App.css'
import './AppPage.css'
import './UiReadiness.css'
import './UxReadiness.css'

const GLOBAL_SCORE = 5.0

const METRICS = [
  { label: 'Páginas con toasts', value: '~31', status: 'ok' as const },
  { label: 'Páginas con alert()', value: '0', status: 'ok' as const },
  { label: '"Frontend says:" en UI', value: '0', status: 'ok' as const },
  { label: 'Menús debug', value: '0 expuestos', status: 'ok' as const },
  { label: 'window.confirm', value: '0', status: 'ok' as const },
  { label: 'Modales con aria-modal', value: '28+', status: 'ok' as const },
  { label: 'Skeletons', value: '30', status: 'ok' as const },
]

const SECTIONS = [
  { name: 'Login', route: '/login', score: 5, status: 'done' as const, doc: 'login.md' },
  { name: 'Home', route: '/', score: 4.8, status: 'done' as const, doc: 'home.md' },
  { name: 'Finanzas', route: '/finanzas', score: 5, status: 'done' as const, doc: 'finanzas.md' },
  { name: 'Utilidades', route: '/registros', score: 5, status: 'done' as const, doc: 'registros.md' },
  { name: 'Lifestyle', route: '/tiempo', score: 5, status: 'done' as const, doc: 'tiempo.md' },
  { name: 'Notificaciones', route: '/notificaciones', score: 5, status: 'done' as const, doc: 'notificaciones.md' },
  { name: 'Justicia', route: '/justicia', score: 4.8, status: 'done' as const, doc: 'justicia.md' },
  { name: 'Trabajo', route: '/trabajo', score: 5, status: 'done' as const, doc: 'trabajo.md' },
]

const LOGIN_DIMENSIONS = [
  { label: 'Loading', score: 5 },
  { label: 'Errores', score: 5 },
  { label: 'Formularios', score: 5 },
  { label: 'Navegación', score: 5 },
  { label: 'Accesibilidad', score: 5 },
  { label: 'Tema / responsive', score: 5 },
  { label: 'Copy', score: 5 },
]

const FINDINGS = [
  {
    priority: 'P0',
    text: '✅ alert() y "Frontend says:" eliminados (Subscripciones, Tarjetas, Proyectos, Cripto, Deudas, Me Deben)',
  },
  {
    priority: 'P0',
    text: '✅ Menús debug gateados con isDebugToolsEnabled() / isDestructiveDebugEnabled() en 24 páginas',
  },
  {
    priority: 'P0',
    text: '✅ Hub Finanzas: errores visibles + reintentar (Promise.allSettled)',
  },
  { priority: 'P1', text: '✅ Empty states con CTA en Cuentas, Archivos, Me Deben, Proyectos' },
  { priority: 'P1', text: '✅ Modales: ModalOverlay con role="dialog", focus trap, Escape (28 páginas)' },
  { priority: 'P1', text: '✅ StatusBar: títulos en routeTitle.ts (CDTs, Inflación, Cripto)' },
  {
    priority: 'P1',
    text: '✅ ConfirmDialog in-app vía useConfirm() — 28 páginas (reemplaza window.confirm)',
  },
  {
    priority: 'P1',
    text: '✅ Nombres unificados: Utilidades/Lifestyle en back buttons (hubLabels.ts)',
  },
  { priority: 'P2', text: '✅ Login auditado por sección — ver ux-readiness/login.md' },
  { priority: 'P2', text: '✅ Skeletons en Cuentas, Transacciones y hub Finanzas' },
  { priority: 'P2', text: '✅ Home auditado por sección — ver ux-readiness/home.md' },
  { priority: 'P2', text: '✅ Finanzas auditado — hub error nav, empty CTAs, retry en core' },
  { priority: 'P3', text: '✅ Finanzas P3: skeletons en 17 pantallas, devError/log, empty CTAs' },
  { priority: 'P4', text: '✅ Finanzas P4: error + back + Reintentar en todos los CRUD' },
  { priority: 'P4', text: '✅ Transacciones móvil: clases CSS, grid resumen, filas legibles' },
  { priority: 'P5', text: '✅ Transacciones modal: validación Login-level (aria-*, foco, noValidate)' },
  { priority: 'P3', text: '✅ Utilidades P3: skeletons, error Reintentar, empty CTAs, devError (7 páginas)' },
  { priority: 'P5', text: '✅ Utilidades P5: formularios Login-level en Cuadernos, Secretos, Empleados, Vehículos, Patrimonio' },
  { priority: 'P3', text: '✅ Lifestyle P3–P5: skeletons, error Reintentar, empty CTAs, formularios, devError (3 páginas)' },
  { priority: 'P3', text: '✅ Notificaciones P3: ListSkeleton, error Reintentar, lista estable en acciones, devError' },
  { priority: 'P3', text: '✅ Justicia P3: Procesos skeleton/error/empty, fetchUserDisplayName, hubLabels justicia' },
  { priority: 'P3', text: '✅ Trabajo P3: skeletons, error Reintentar, empty CTAs, devError (Contratos + Actividades)' },
  { priority: 'P5', text: '✅ Trabajo P5: formularios Login-level en Contratos y Actividades' },
]

const LOGIN_RESOLVED = [
  'Wordmark Pockets en <h1> accesible para lectores de pantalla',
  'Autofocus en campo usuario al cargar',
  'Foco al banner de error tras fallo API',
  'Toggle contraseña 44px (HIG)',
  'Foco al primer campo inválido en validación cliente',
  'Redirect automático a /login tras 401 (AuthSessionRedirect)',
  'Copy invite-only en login',
]

const LOGIN_OPEN: { priority: string; text: string }[] = []

const LOGIN_TEST_PLAN = [
  'Submit vacío → errores inline en ambos campos',
  'Credenciales incorrectas → banner + foco en alerta',
  'Deep link protegido → login → vuelve a la ruta original',
  'Token válido en /login → redirect sin formulario',
  'Logout → confirm → re-login → llega a /',
]

const HOME_DIMENSIONS = [
  { label: 'Navegación', score: 5 },
  { label: 'Accesibilidad', score: 5 },
  { label: 'Errores (badge)', score: 4 },
  { label: 'Confirmación logout', score: 5 },
  { label: 'Tema / responsive', score: 5 },
  { label: 'Copy / marca', score: 5 },
]

const HOME_RESOLVED = [
  'Badge de notificaciones: error visible en aria-label + indicador gris',
  'Logout con useConfirm() antes de cerrar sesión',
  '<nav> semántico en lugar de role="grid"',
  'Wordmark Pockets en <h1> accesible',
  'IDs semánticos (notificaciones, finanzas, …)',
  'Teclado Enter/Space en cada launcher',
  'Saludo con nombre de usuario (getCurrentUsername)',
  'Indicador visual al refrescar badge de notificaciones',
]

const HOME_OPEN: { priority: string; text: string }[] = []

const HOME_TEST_PLAN = [
  'Cada icono navega a su ruta',
  'Badge con no leídas → número rojo',
  'Fallo API notificaciones → punto gris + aria-label',
  'Salir → cancelar / confirmar',
  'Tab + Enter abre sección',
]

const FINANZAS_DIMENSIONS = [
  { label: 'Navegación', score: 5 },
  { label: 'Error state', score: 5 },
  { label: 'Empty + CTA', score: 5 },
  { label: 'Loading', score: 5 },
  { label: 'Responsive', score: 5 },
  { label: 'Formularios', score: 5 },
  { label: 'Accesibilidad', score: 5 },
  { label: 'Modales / confirm', score: 5 },
]

const FINANZAS_RESOLVED = [
  'Hub: degradación parcial con Promise.allSettled',
  'Hub loadError: toolbar + Volver al inicio + Reintentar',
  'ListSkeleton en 17 pantallas de Finanzas (hub + todos los CRUD + Archivos)',
  'Empty CTA en todos los módulos con lista vacía',
  'Error + Reintentar + back en todos los módulos CRUD de Finanzas',
  'Modal Transacciones: noValidate, aria-invalid/describedby, foco al primer error',
  'Transacciones móvil: layout de filas + resumen en grid 2×2',
  'devError/devLog/devWarn en 15 páginas (script gate-finanzas-logs.mjs)',
  'useConfirm + ModalOverlay en módulos CRUD',
]

const FINANZAS_OPEN: { priority: string; text: string }[] = []

const FINANZAS_TEST_PLAN = [
  'Hub fallo total → Reintentar + volver al inicio',
  'Hub fallo parcial → banner + filas No disponible',
  'Transacciones vacías → CTA abre modal',
  'Error en Presupuestos/Deudas → back + Reintentar',
  'Delete → useConfirm antes de borrar',
]

const UTILIDADES_DIMENSIONS = [
  { label: 'Navegación', score: 5 },
  { label: 'Error state', score: 5 },
  { label: 'Empty + CTA', score: 5 },
  { label: 'Loading', score: 5 },
  { label: 'Formularios', score: 5 },
  { label: 'Accesibilidad', score: 5 },
  { label: 'Modales / confirm', score: 5 },
]

const UTILIDADES_RESOLVED = [
  'Hub estático sin API — carga instantánea',
  'ListSkeleton en Cuadernos, Secretos, Empleados, Vehículos, Patrimonio, Archivos',
  'Empty CTA con empty-state-cta en todos los CRUD con lista vacía',
  'Error + Reintentar + role="alert" en todos los módulos CRUD',
  'devError en 7 páginas (script gate-utilidades-logs.mjs)',
  'Calculadora/Generador: console.error gateado en copy',
  'Back "Volver a Utilidades" vía hubLabels.ts',
  'Formularios: noValidate, aria-invalid/describedby, foco al primer error',
]

const UTILIDADES_OPEN: { priority: string; text: string }[] = []

const UTILIDADES_TEST_PLAN = [
  'Cuadernos vacío → CTA abre modal',
  'Secretos error API → Reintentar',
  'Empleados vacío → CTA abre formulario',
  'Vehículos/Patrimonio error → Reintentar',
  'Archivos sin regresión (skeleton + upload CTA)',
  'Delete → useConfirm antes de borrar',
  'Submit vacío en Cuadernos → foco en título + error inline',
  'Empleados sin nombre/ID → errores inline, no toast',
]

const LIFESTYLE_DIMENSIONS = [
  { label: 'Navegación', score: 5 },
  { label: 'Error state', score: 5 },
  { label: 'Empty + CTA', score: 5 },
  { label: 'Loading', score: 5 },
  { label: 'Formularios', score: 5 },
  { label: 'Accesibilidad', score: 5 },
  { label: 'Modales / confirm', score: 5 },
]

const LIFESTYLE_RESOLVED = [
  'Hub estático sin API — carga instantánea',
  'ListSkeleton en Fechas, Rutinas, Mi Día, Mi Diario',
  'Empty CTA en todos los módulos con lista vacía',
  'Error + Reintentar + role="alert" en todos los CRUD',
  'devError/devLog en Fechas, Rutinas, Mi Diario (gate-lifestyle-logs.mjs)',
  'Mi Día vacío → CTA navega a Rutinas',
  'Formularios: noValidate, aria-invalid/describedby, foco al primer error',
  'Back "Volver a Lifestyle" vía hubLabels.ts',
]

const LIFESTYLE_OPEN: { priority: string; text: string }[] = []

const LIFESTYLE_TEST_PLAN = [
  'Fechas vacías → CTA abre modal crear evento',
  'Fechas error API → Reintentar',
  'Vista calendario con error → panel Reintentar',
  'Rutinas vacías → CTA abre formulario',
  'Mi Día sin rutinas → CTA a /tiempo/rutinas',
  'Mi Diario vacío → CTA nueva entrada',
  'Submit vacío en Fechas → foco en título',
]

const NOTIFICACIONES_DIMENSIONS = [
  { label: 'Loading', score: 5 },
  { label: 'Empty + filtros', score: 5 },
  { label: 'Error state', score: 5 },
  { label: 'Navegación', score: 5 },
  { label: 'Accesibilidad', score: 5 },
  { label: 'Feedback', score: 5 },
  { label: 'Modales / confirm', score: 5 },
]

const NOTIFICACIONES_RESOLVED = [
  'ListSkeleton en carga inicial',
  'Empty contextual por filtro (Todas / No leídas / Leídas)',
  'Error + Reintentar + role="alert"',
  'Marcar leída/eliminar sin ocultar la lista',
  'devError en carga y acciones',
  'useConfirm en eliminar individual y masivo',
  'Back "Volver al inicio"',
  'Badge Home sincronizado (documentado en home.md)',
]

const NOTIFICACIONES_OPEN: { priority: string; text: string }[] = []

const NOTIFICACIONES_TEST_PLAN = [
  'Filtro No leídas vacío → copy específico',
  'Error API → Reintentar',
  'Marcar como leída → lista no desaparece',
  'Eliminar → useConfirm antes de borrar',
  'Menú marcar todas → toast + refresh',
]

const JUSTICIA_DIMENSIONS = [
  { label: 'Loading', score: 5 },
  { label: 'Empty + CTA', score: 5 },
  { label: 'Error state', score: 5 },
  { label: 'Navegación', score: 5 },
  { label: 'Accesibilidad', score: 5 },
  { label: 'Perfil / copy', score: 4 },
  { label: 'Modales / feedback', score: 5 },
]

const JUSTICIA_RESOLVED = [
  'Hub estático con navegación por teclado',
  'ListSkeleton en Procesos + actuaciones en modal',
  'Error Reintentar + CTA Ir a Ajustes si falta nombre',
  'Empty con CTA Actualizar + copy explicativo',
  'Nombre desde fetchUserDisplayName (sin hardcode)',
  'Back "Volver a Justicia" vía hubLabels.ts',
  'Seguimiento de procesos con toasts',
]

const JUSTICIA_OPEN: { priority: string; text: string }[] = [
  { priority: 'P4', text: 'Procesos: N+1 llamadas de actuaciones al cargar badges (performance)' },
]

const JUSTICIA_TEST_PLAN = [
  'Sin nombre en perfil → error + Ir a Ajustes',
  'API falla → Reintentar',
  'Lista vacía → Actualizar',
  'Detalle → skeleton de actuaciones',
  'Agregar seguimiento → toast',
]

const TRABAJO_DIMENSIONS = [
  { label: 'Loading', score: 5 },
  { label: 'Empty + CTA', score: 5 },
  { label: 'Error state', score: 5 },
  { label: 'Formularios', score: 5 },
  { label: 'Navegación', score: 5 },
  { label: 'Accesibilidad', score: 5 },
  { label: 'Modales / confirm', score: 5 },
]

const TRABAJO_RESOLVED = [
  'Hub estático sin API — carga instantánea',
  'ListSkeleton en Contratos y Actividades',
  'Empty CTA con empty-state-cta en listas vacías',
  'Empty contextual por tab/filtro en Actividades',
  'Error + Reintentar + role="alert" en ambos CRUD',
  'devError en 2 páginas (script gate-trabajo-logs.mjs)',
  'Back "Volver a Trabajo" vía hubLabels.ts',
  'Formularios: noValidate, aria-invalid/describedby, foco al primer error',
]

const TRABAJO_OPEN: { priority: string; text: string }[] = []

const TRABAJO_TEST_PLAN = [
  'Contratos vacío → CTA abre modal',
  'Contratos error API → Reintentar',
  'Actividades vacío → CTA en tab Activas',
  'Actividades filtro cliente sin resultados → copy sin CTA',
  'Submit vacío → foco en primer campo + error inline',
  'Delete → useConfirm antes de borrar',
]

function UxReadiness() {
  return (
    <div className="app-page-container">
      <div className="app-page-content ui-readiness-content">
        <section className="ui-readiness-hero">
          <h1 className="home-title">UX Readiness</h1>
          <div className="ui-readiness-score">
            <span className="ui-readiness-score-value">{GLOBAL_SCORE}</span>
            <span className="ui-readiness-score-max">/ 5</span>
          </div>
          <p className="ui-readiness-subtitle">
            Auditoría de experiencia de usuario — feedback, navegación, accesibilidad, copy y
            consistencia. Complementa{' '}
            <Link to="/ui-readiness" className="ux-readiness-link">
              UI Readiness
            </Link>{' '}
            (design system visual).
          </p>
          <p className="ux-readiness-repo-note">
            Documentación detallada en <code>ux-readiness/</code> del repositorio.
          </p>
        </section>

        <section className="ui-readiness-section">
          <h2 className="ui-readiness-section-title">Métricas transversales</h2>
          <div className="ux-readiness-metrics">
            {METRICS.map(m => (
              <div key={m.label} className={`ux-readiness-metric ux-readiness-metric-${m.status}`}>
                <div className="ux-readiness-metric-value">{m.value}</div>
                <div className="ux-readiness-metric-label">{m.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="ui-readiness-section">
          <h2 className="ui-readiness-section-title">Secciones auditadas</h2>
          <p className="ui-readiness-section-desc">
            Score UX por área de la app. Se audita sección por sección.
          </p>
          <div className="ux-readiness-sections-table">
            <div className="ux-readiness-sections-header">
              <span>Sección</span>
              <span>Ruta</span>
              <span>Score</span>
              <span>Estado</span>
            </div>
            {SECTIONS.map(s => (
              <div key={s.name} className="ux-readiness-sections-row">
                <span className="ux-readiness-section-name">{s.name}</span>
                <Link to={s.route} className="ux-readiness-link">
                  {s.route}
                </Link>
                <span className="ux-readiness-section-score">{s.score}</span>
                <span
                  className={`ux-readiness-badge ux-readiness-badge-${s.status}`}
                >
                  {s.status === 'done' ? 'Auditado' : 'Pendiente'}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Finanzas — 5 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                Hub + 16 sub-módulos. Auditoría: <code>ux-readiness/finanzas.md</code> (2026-06-22).{' '}
                <Link to="/finanzas" className="ux-readiness-link">
                  Ver pantalla →
                </Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">5</span>
          </div>

          <div className="ui-readiness-dimensions" style={{ marginTop: 'var(--spacing-lg)' }}>
            {FINANZAS_DIMENSIONS.map(d => (
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

          <h3 className="ux-readiness-subsection-title">Fortalezas verificadas</h3>
          <ul className="ux-readiness-bullet-list">
            {FINANZAS_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Hallazgos abiertos</h3>
          {FINANZAS_OPEN.length === 0 ? (
            <p className="ui-readiness-section-desc">Sin hallazgos abiertos — sección referencia UX.</p>
          ) : (
            <ul className="ui-readiness-findings">
              {FINANZAS_OPEN.map((f, i) => (
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
          )}

          <h3 className="ux-readiness-subsection-title">Plan de pruebas</h3>
          <ul className="ux-readiness-bullet-list">
            {FINANZAS_TEST_PLAN.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Utilidades — 5 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                Hub + 8 sub-módulos. Auditoría: <code>ux-readiness/registros.md</code> (2026-06-22).{' '}
                <Link to="/registros" className="ux-readiness-link">
                  Ver pantalla →
                </Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">5</span>
          </div>

          <div className="ui-readiness-dimensions" style={{ marginTop: 'var(--spacing-lg)' }}>
            {UTILIDADES_DIMENSIONS.map(d => (
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

          <h3 className="ux-readiness-subsection-title">Fortalezas verificadas</h3>
          <ul className="ux-readiness-bullet-list">
            {UTILIDADES_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Hallazgos abiertos</h3>
          {UTILIDADES_OPEN.length === 0 ? (
            <p className="ui-readiness-section-desc">Sin hallazgos abiertos — sección referencia UX.</p>
          ) : (
            <ul className="ui-readiness-findings">
              {UTILIDADES_OPEN.map((f, i) => (
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
          )}

          <h3 className="ux-readiness-subsection-title">Plan de pruebas</h3>
          <ul className="ux-readiness-bullet-list">
            {UTILIDADES_TEST_PLAN.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Lifestyle — 5 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                Hub + 4 sub-módulos. Auditoría: <code>ux-readiness/tiempo.md</code> (2026-06-22).{' '}
                <Link to="/tiempo" className="ux-readiness-link">
                  Ver pantalla →
                </Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">5</span>
          </div>

          <div className="ui-readiness-dimensions" style={{ marginTop: 'var(--spacing-lg)' }}>
            {LIFESTYLE_DIMENSIONS.map(d => (
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

          <h3 className="ux-readiness-subsection-title">Fortalezas verificadas</h3>
          <ul className="ux-readiness-bullet-list">
            {LIFESTYLE_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Hallazgos abiertos</h3>
          {LIFESTYLE_OPEN.length === 0 ? (
            <p className="ui-readiness-section-desc">Sin hallazgos abiertos — sección referencia UX.</p>
          ) : (
            <ul className="ui-readiness-findings">
              {LIFESTYLE_OPEN.map((f, i) => (
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
          )}

          <h3 className="ux-readiness-subsection-title">Plan de pruebas</h3>
          <ul className="ux-readiness-bullet-list">
            {LIFESTYLE_TEST_PLAN.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Notificaciones — 5 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                Bandeja con filtros. Auditoría: <code>ux-readiness/notificaciones.md</code> (2026-06-22).{' '}
                <Link to="/notificaciones" className="ux-readiness-link">
                  Ver pantalla →
                </Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">5</span>
          </div>

          <div className="ui-readiness-dimensions" style={{ marginTop: 'var(--spacing-lg)' }}>
            {NOTIFICACIONES_DIMENSIONS.map(d => (
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

          <h3 className="ux-readiness-subsection-title">Fortalezas verificadas</h3>
          <ul className="ux-readiness-bullet-list">
            {NOTIFICACIONES_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Hallazgos abiertos</h3>
          {NOTIFICACIONES_OPEN.length === 0 ? (
            <p className="ui-readiness-section-desc">Sin hallazgos abiertos.</p>
          ) : (
            <ul className="ui-readiness-findings">
              {NOTIFICACIONES_OPEN.map((f, i) => (
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
          )}

          <h3 className="ux-readiness-subsection-title">Plan de pruebas</h3>
          <ul className="ux-readiness-bullet-list">
            {NOTIFICACIONES_TEST_PLAN.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Justicia — 4.8 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                Hub + Procesos judiciales. Auditoría: <code>ux-readiness/justicia.md</code> (2026-06-22).{' '}
                <Link to="/justicia" className="ux-readiness-link">
                  Ver pantalla →
                </Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">4.8</span>
          </div>

          <div className="ui-readiness-dimensions" style={{ marginTop: 'var(--spacing-lg)' }}>
            {JUSTICIA_DIMENSIONS.map(d => (
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

          <h3 className="ux-readiness-subsection-title">Fortalezas verificadas</h3>
          <ul className="ux-readiness-bullet-list">
            {JUSTICIA_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Hallazgos abiertos</h3>
          <ul className="ui-readiness-findings">
            {JUSTICIA_OPEN.map((f, i) => (
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

          <h3 className="ux-readiness-subsection-title">Plan de pruebas</h3>
          <ul className="ux-readiness-bullet-list">
            {JUSTICIA_TEST_PLAN.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Trabajo — 5 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                Hub + Contratos + Actividades. Auditoría: <code>ux-readiness/trabajo.md</code> (2026-06-22).{' '}
                <Link to="/trabajo" className="ux-readiness-link">
                  Ver pantalla →
                </Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">5</span>
          </div>

          <div className="ui-readiness-dimensions" style={{ marginTop: 'var(--spacing-lg)' }}>
            {TRABAJO_DIMENSIONS.map(d => (
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

          <h3 className="ux-readiness-subsection-title">Fortalezas verificadas</h3>
          <ul className="ux-readiness-bullet-list">
            {TRABAJO_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Hallazgos abiertos</h3>
          {TRABAJO_OPEN.length === 0 ? (
            <p className="ui-readiness-section-desc">Sin hallazgos abiertos — P3–P5 completados.</p>
          ) : (
            <ul className="ui-readiness-findings">
              {TRABAJO_OPEN.map((f, i) => (
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
          )}

          <h3 className="ux-readiness-subsection-title">Plan de pruebas</h3>
          <ul className="ux-readiness-bullet-list">
            {TRABAJO_TEST_PLAN.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Home — 4.8 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                Hub raíz / launcher. Auditoría: <code>ux-readiness/home.md</code> (2026-06-22).{' '}
                <Link to="/" className="ux-readiness-link">
                  Ver pantalla →
                </Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">4.8</span>
          </div>

          <div className="ui-readiness-dimensions" style={{ marginTop: 'var(--spacing-lg)' }}>
            {HOME_DIMENSIONS.map(d => (
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

          <h3 className="ux-readiness-subsection-title">Fortalezas verificadas</h3>
          <ul className="ux-readiness-bullet-list">
            {HOME_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Hallazgos abiertos (P3)</h3>
          {HOME_OPEN.length === 0 ? (
            <p className="ui-readiness-section-desc">Sin hallazgos abiertos — P3 completados.</p>
          ) : (
            <ul className="ui-readiness-findings">
              {HOME_OPEN.map((f, i) => (
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
          )}

          <h3 className="ux-readiness-subsection-title">Plan de pruebas</h3>
          <ul className="ux-readiness-bullet-list">
            {HOME_TEST_PLAN.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Login — 5 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                Referencia de formularios para el resto de la app. Auditoría:{' '}
                <code>ux-readiness/login.md</code> (2026-06-22).{' '}
                <Link to="/login" className="ux-readiness-link">
                  Ver pantalla →
                </Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">5</span>
          </div>

          <div className="ui-readiness-dimensions" style={{ marginTop: 'var(--spacing-lg)' }}>
            {LOGIN_DIMENSIONS.map(d => (
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

          <h3 className="ux-readiness-subsection-title">Fortalezas verificadas</h3>
          <ul className="ux-readiness-bullet-list">
            <li>Validación custom con aria-invalid, aria-describedby, role=&quot;alert&quot;</li>
            <li>Submit bloqueado con aria-busy + spinner durante login</li>
            <li>Redirect a ruta original tras login (ProtectedRoute state.from)</li>
            <li>prefers-reduced-motion y prefers-contrast en CSS</li>
            {LOGIN_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Hallazgos abiertos (P3)</h3>
          {LOGIN_OPEN.length === 0 ? (
            <p className="ui-readiness-section-desc">Sin hallazgos abiertos — P3 completados.</p>
          ) : (
            <ul className="ui-readiness-findings">
              {LOGIN_OPEN.map((f, i) => (
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
          )}

          <h3 className="ux-readiness-subsection-title">Plan de pruebas</h3>
          <ul className="ux-readiness-bullet-list">
            {LOGIN_TEST_PLAN.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section">
          <h2 className="ui-readiness-section-title">Prioridades globales</h2>
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

        <section className="ui-readiness-section">
          <h2 className="ui-readiness-section-title">Patrones de referencia</h2>
          <p className="ui-readiness-section-desc">
            Archivos a copiar al refactorizar formularios y feedback en otras pantallas.
          </p>
          <div className="ux-readiness-refs">
            <div className="ux-readiness-ref">
              <strong>Formulario + a11y</strong>
              <code>src/pages/Login.tsx</code>
            </div>
            <div className="ux-readiness-ref">
              <strong>Toasts</strong>
              <code>src/contexts/NotificationContext.tsx</code>
            </div>
            <div className="ux-readiness-ref">
              <strong>Empty + CTA</strong>
              <code>src/pages/CDTs.tsx</code>
            </div>
            <div className="ux-readiness-ref">
              <strong>Confirmación</strong>
              <code>src/contexts/ConfirmContext.tsx</code>
            </div>
            <div className="ux-readiness-ref">
              <strong>Skeletons</strong>
              <code>src/components/ListSkeleton.tsx</code>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default UxReadiness
