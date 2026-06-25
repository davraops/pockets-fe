import { Link } from 'react-router-dom'
import '../App.css'
import './AppPage.css'
import './UiReadiness.css'
import './UxReadiness.css'
import './SpaceAudit.css'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

const GLOBAL_SCORE = 2.7

const DIMENSIONS = [
  { label: 'Uso vertical del espacio', score: 2.5 },
  { label: 'Jerarquía visual', score: 2.8 },
  { label: 'Botones y acciones', score: 2.5 },
  { label: 'Densidad / escaneo', score: 2.6 },
  { label: 'Consistencia de layout', score: 2.8 },
  { label: 'Legibilidad tipográfica', score: 3.0 },
]

const METRICS = [
  { label: 'Familias de fila', value: '3', status: 'warn' as const },
  { label: 'CSS con summary-*', value: '10+', status: 'bad' as const },
  { label: 'CRUD: crear en ⋮', value: '~0', status: 'ok' as const },
  { label: 'Variantes de botón', value: '6+', status: 'warn' as const },
  { label: 'Hub max → CRUD wide', value: '800→1200', status: 'warn' as const },
  { label: 'Páginas con app-page-title', value: '~40', status: 'ok' as const },
]

const ROW_PATTERNS = [
  {
    class: 'crud-hub-row',
    where: 'Hubs (Finanzas, Ajustes, Trabajo…)',
    height: '56px',
    css: 'domains/crud-hub-rows.css',
  },
  {
    class: 'crud-inset-row',
    where: 'Listas CRUD (Cuentas, Transacciones, Deudas…)',
    height: '72–88px',
    css: 'domains/crud-list-rows.css',
  },
]

const LOGIN_DIMENSIONS = [
  { label: 'Uso vertical del espacio', score: 5 },
  { label: 'Jerarquía visual', score: 5 },
  { label: 'Botones y acciones', score: 5 },
  { label: 'Densidad / escaneo', score: 5 },
  { label: 'Consistencia de layout', score: 5 },
  { label: 'Legibilidad tipográfica', score: 5 },
]

const LOGIN_LAYOUT_METRICS = [
  { label: 'Chrome perdido', value: '0px', status: 'ok' as const },
  { label: 'Patrón auth-*', value: 'Sí', status: 'ok' as const },
  { label: 'form-alert-banner', value: 'Sí', status: 'ok' as const },
  { label: 'Pre-form bloques', value: '1', status: 'ok' as const },
  { label: 'CTA visible', value: 'Sí', status: 'ok' as const },
  { label: 'Login.css', value: '0', status: 'ok' as const },
]

const LOGIN_STRENGTHS = [
  'auth-shell + auth-card en ui-patterns.css — shell reutilizable',
  'Título unificado: Pockets — Iniciar sesión (un h1, sin icono decorativo)',
  'form-alert-banner + btn-spinner en shared.css',
  'Nota de soporte antes del CTA; ThemeToggle en footer de card',
  'scrollIntoView en móvil + scroll-padding-bottom en auth-card',
]

const LOGIN_RESOLVED = [
  'P5: título unificado; icono candado eliminado',
  'P5: auth-shell / auth-card / auth-form en ui-patterns.css',
  'P5: form-alert-banner y btn-spinner compartidos',
  'P5: nota de soporte reubicada antes del submit',
  'P5: ThemeToggle en auth-card-footer',
  'P5: Login.css eliminado — 100% design system',
  'P2–P4: form comfortable + header compacto (ronda anterior)',
]

const LOGIN_OPEN: { priority: string; text: string }[] = []

const HOME_DIMENSIONS = [
  { label: 'Uso vertical del espacio', score: 5 },
  { label: 'Jerarquía visual', score: 5 },
  { label: 'Botones y acciones', score: 5 },
  { label: 'Densidad / escaneo', score: 5 },
  { label: 'Consistencia de layout', score: 5 },
  { label: 'Legibilidad tipográfica', score: 5 },
]

const HOME_LAYOUT_METRICS = [
  { label: 'Chrome perdido', value: '0px', status: 'ok' as const },
  { label: 'Shell inmersivo', value: 'Sí', status: 'ok' as const },
  { label: 'Patrón hub-*', value: 'Sí', status: 'ok' as const },
  { label: 'Logout separado', value: 'Sí', status: 'ok' as const },
  { label: 'Tema en card', value: 'Sí', status: 'ok' as const },
  { label: 'Grid apps', value: '7', status: 'ok' as const },
]

const HOME_STRENGTHS = [
  'Shell inmersivo: sin StatusBar ni Footer en / (como Login)',
  'hub-card con animación entrada y prefers-contrast (paridad Login)',
  'Footer fijo en card: tema + Salir siempre visibles en mobile',
  'Grid flex centrado; colores vía --app-color en CSS',
]

const HOME_RESOLVED = [
  'P2: launcher movido de App.css a ui-patterns (hub-*)',
  'P2: título dos líneas + brand uppercase → auth-card-title',
  'P2: ~300 líneas app-icon duplicadas eliminadas de Finanzas.css',
  'P3: logout mezclado con apps → footer dedicado',
  'P3: hub-greeting sin margin negativo',
  'P3: padding chrome vía tokens de layout',
  'P4: shell inmersivo — StatusBar/Footer ocultos en /; ThemeToggle en card',
  'P4: footer compacto mobile (tema + Salir en fila); scroll solo en hub-card-scroll',
  'P5: animación entrada, prefers-contrast, --app-color, grid flex centrado',
]

const HOME_OPEN: { priority: string; text: string }[] = []

const HOME_TEST_PLAN = [
  'Desktop: 7 apps centradas (4+3); footer tema + Salir',
  '480px: footer en fila; tema y Salir visibles sin scroll extra',
  'Sin StatusBar/Footer en / — viewport completo',
  'Badge notificaciones no tapa label',
  'Salir → confirm → /login',
  'Tab: grid → tema → Salir, focus visible',
]

const FINANZAS_DIMENSIONS = [
  { label: 'Uso vertical del espacio', score: 3.8 },
  { label: 'Jerarquía visual', score: 4.0 },
  { label: 'Botones y acciones', score: 3.8 },
  { label: 'Densidad / escaneo', score: 4.2 },
  { label: 'Consistencia de layout', score: 4.2 },
  { label: 'Legibilidad tipográfica', score: 3.8 },
]

const FINANZAS_LAYOUT_METRICS = [
  { label: 'Chrome fijo', value: 'tokens', status: 'ok' as const },
  { label: 'Filas hub raíz', value: '10', status: 'ok' as const },
  { label: 'Sub-hubs', value: '3', status: 'ok' as const },
  { label: 'crud-summary-strip', value: 'Sí', status: 'ok' as const },
  { label: 'Ancho hub', value: '1200', status: 'ok' as const },
  { label: 'Finanzas.css', value: '~50', status: 'ok' as const },
]

const FINANZAS_STRENGTHS = [
  'Hub raíz compacto: 10 filas + 3 sub-hubs (crédito, cripto, ahorro)',
  'CTA primario visible; resumen antes del CTA',
  'crud-summary-strip en Transacciones, Deudas, Presupuestos',
  'Chrome vertical vía --layout-chrome-offset-*',
]

const FINANZAS_RESOLVED = [
  'P2: finanzas-add-transaction-button → btn-accent btn-submit (52px)',
  'P2: summary-* movido a hub-summary-* en ui-patterns.css',
  'P2: headers de sección sentence case (sin ALL CAPS)',
  'P3: iconos vía --section-color (sin backgroundColor inline)',
  'P3: orden jerárquico: resumen → CTA → lista de módulos',
  'P1: sub-hubs /finanzas/credito, /cripto, /ahorro — 16→10 filas',
  'P1: chrome layout tokens (--layout-chrome-offset-*)',
  'P2: crud-summary-strip compartido en CRUD top-3',
  'P3: hub Finanzas usa app-page-content-wide (1200px)',
]

const FINANZAS_OPEN: { priority: string; text: string }[] = []

const FINANZAS_TEST_PLAN = [
  'Hub raíz: 10 filas visibles sin scroll excesivo en desktop',
  'Sub-hubs: crédito (4), cripto (3), ahorro (2) con back a Finanzas',
  'CTA abre modal en Transacciones',
  'crud-summary-strip en Transacciones/Deudas/Presupuestos',
  'Mobile: padding-bottom vía --layout-footer-height-mobile',
  'Ancho consistente hub → CRUD hijo (1200px)',
]

const TRANSACCIONES_DIMENSIONS = [
  { label: 'Uso vertical del espacio', score: 4.0 },
  { label: 'Jerarquía visual', score: 4.2 },
  { label: 'Botones y acciones', score: 4.2 },
  { label: 'Densidad / escaneo', score: 4.0 },
  { label: 'Consistencia de layout', score: 4.4 },
  { label: 'Legibilidad tipográfica', score: 4.0 },
]

const TRANSACCIONES_LAYOUT_METRICS = [
  { label: 'CTA visible', value: 'Sí', status: 'ok' as const },
  { label: 'crud-summary-strip', value: '4 cols', status: 'ok' as const },
  { label: 'Modal secciones', value: '2', status: 'ok' as const },
  { label: '⋮ menú', value: 'Debug', status: 'ok' as const },
  { label: 'Filas', value: 'inset', status: 'ok' as const },
  { label: 'Ancho', value: '1200', status: 'ok' as const },
]

const TRANSACCIONES_STRENGTHS = [
  'CTA Agregar transacción visible (btn-submit) — no oculto en ⋮',
  'Resumen full-width con crud-summary-strip alineado a izquierda',
  'Modal agrupado: Información general + Cuenta y vínculos',
  'Filas crud-inset-row en glass-group — mismo patrón que Cuentas/Deudas',
  'Acento y monto por tipo (ingreso/egreso/ahorro) vía crud-row-accent-*',
]

const TRANSACCIONES_RESOLVED = [
  'P0: Agregar solo en ⋮ → CTA visible + ⋮ solo debug',
  'P0: summary centrado duplicado → crud-summary-strip compartido',
  'P2: modal sin agrupación → crud-form-section-title × 2',
  'P3: empty-state-cta duplicado → CTA único arriba del listado',
  'P3: CSS summary muerto eliminado de Transacciones.css',
  'P3: crud-transaction-row card → crud-inset-row en glass-group',
]

const TRANSACCIONES_OPEN: { priority: string; text: string }[] = []

const TRANSACCIONES_TEST_PLAN = [
  'CTA visible con y sin transacciones en lista',
  'Resumen 4 métricas legible en mobile (wrap 2 col)',
  'Modal: secciones visibles al togglear deuda/tarjeta/deudor',
  '⋮ solo aparece con debug tools habilitado',
  'Tap fila → detalle; back → Finanzas',
]

const CUENTAS_DIMENSIONS = [
  { label: 'Uso vertical del espacio', score: 4.0 },
  { label: 'Jerarquía visual', score: 4.2 },
  { label: 'Botones y acciones', score: 4.2 },
  { label: 'Densidad / escaneo', score: 4.0 },
  { label: 'Consistencia de layout', score: 4.2 },
  { label: 'Legibilidad tipográfica', score: 4.0 },
]

const CUENTAS_LAYOUT_METRICS = [
  { label: 'CTA visible', value: 'Sí', status: 'ok' as const },
  { label: 'crud-summary-strip', value: '3 cols', status: 'ok' as const },
  { label: 'Filas', value: 'inset', status: 'ok' as const },
  { label: '⋮ menú', value: 'Debug', status: 'ok' as const },
  { label: 'Ancho', value: '1200', status: 'ok' as const },
  { label: 'Resumen', value: 'strip', status: 'ok' as const },
]

const CUENTAS_STRENGTHS = [
  'CTA Agregar cuenta visible (btn-submit) — no oculto en ⋮',
  'Resumen full-width con crud-summary-strip (USD, EUR, Total)',
  'Filas crud-inset-row en glass-group — patrón CRUD estándar',
  '⋮ solo debug; click-outside con menuRef',
]

const CUENTAS_RESOLVED = [
  'P0: Agregar solo en ⋮ → CTA visible + ⋮ solo debug',
  'P0: exchange-rates-block centrado → crud-summary-strip',
  'P2: labels USD/EUR en ALL CAPS → sentence case en strip',
  'P3: empty-state-cta duplicado → CTA único arriba del listado',
  'P3: CSS exchange-rates muerto eliminado de Cuentas.css',
]

const CUENTAS_OPEN: { priority: string; text: string }[] = []

const CUENTAS_TEST_PLAN = [
  'CTA visible con y sin cuentas en lista',
  'Resumen 3 métricas legible en mobile (wrap)',
  '⋮ solo aparece con debug tools habilitado',
  'Tap fila → detalle modal; back → Finanzas',
  'Total COP actualiza al agregar/editar cuentas',
]

const DEUDAS_DIMENSIONS = [
  { label: 'Uso vertical del espacio', score: 3.8 },
  { label: 'Jerarquía visual', score: 4.0 },
  { label: 'Botones y acciones', score: 4.2 },
  { label: 'Densidad / escaneo', score: 3.8 },
  { label: 'Consistencia de layout', score: 4.0 },
  { label: 'Legibilidad tipográfica', score: 4.0 },
]

const DEUDAS_LAYOUT_METRICS = [
  { label: 'CTA visible', value: 'Sí', status: 'ok' as const },
  { label: 'crud-summary-strip', value: '3 cols', status: 'ok' as const },
  { label: 'Filas', value: 'card', status: 'ok' as const },
  { label: 'Ordenar', value: 'toolbar', status: 'ok' as const },
  { label: '⋮ menú', value: 'Debug', status: 'ok' as const },
  { label: 'Ancho', value: '1200', status: 'ok' as const },
]

const DEUDAS_STRENGTHS = [
  'CTA Agregar deuda visible (btn-submit) — no oculto en ⋮',
  'Resumen crud-summary-strip--danger siempre visible (incluso vacío)',
  'Orden por tasa en botón toolbar (↑/↓) — acción secundaria descubrible',
  'Filas crud-card-row con barra de progreso — patrón correcto para deuda',
]

const DEUDAS_RESOLVED = [
  'P0: Agregar solo en ⋮ → CTA visible + ⋮ solo debug',
  'P0: resumen condicional → strip siempre visible',
  'P1: ordenar en ⋮ → botón visible en toolbar',
  'P3: empty-state-cta duplicado → CTA único arriba del listado',
  'P3: CSS debts-summary-block y add-debt-button eliminados',
]

const DEUDAS_OPEN: { priority: string; text: string }[] = [
  {
    priority: 'P2',
    text: 'debts-advice-banner ocupa ~120px vertical — considerar colapsable o link a guía',
  },
]

const DEUDAS_TEST_PLAN = [
  'CTA visible con y sin deudas en lista',
  'Resumen 3 métricas en $0 cuando lista vacía',
  'Toggle orden tasa en toolbar reordena filas',
  '⋮ solo aparece con debug tools habilitado',
  'Tap fila → detalle; barra progreso visible',
]

const PRESUPUESTOS_DIMENSIONS = [
  { label: 'Uso vertical del espacio', score: 4.0 },
  { label: 'Jerarquía visual', score: 4.2 },
  { label: 'Botones y acciones', score: 4.2 },
  { label: 'Densidad / escaneo', score: 4.0 },
  { label: 'Consistencia de layout', score: 4.2 },
  { label: 'Legibilidad tipográfica', score: 4.0 },
]

const PRESUPUESTOS_LAYOUT_METRICS = [
  { label: 'CTA visible', value: 'Sí', status: 'ok' as const },
  { label: 'crud-summary-strip', value: '3 cols', status: 'ok' as const },
  { label: 'Filas', value: 'inset', status: 'ok' as const },
  { label: 'Archivados', value: 'toolbar', status: 'ok' as const },
  { label: '⋮ menú', value: 'Debug', status: 'ok' as const },
  { label: 'Ancho', value: '1200', status: 'ok' as const },
]

const PRESUPUESTOS_STRENGTHS = [
  'CTA Agregar presupuesto visible (btn-submit) — no oculto en ⋮',
  'Resumen crud-summary-strip--success (presupuestado / gastado / disponible)',
  'Archivados en botón toolbar (ArchiveIcon) — secundaria descubrible',
  'Filas crud-inset-row--tall con barra de progreso en glass-group',
]

const PRESUPUESTOS_RESOLVED = [
  'P0: Agregar solo en ⋮ → CTA visible + ⋮ solo debug',
  'P1: archivados en ⋮ → botón visible en toolbar',
  'P3: empty-state-cta duplicado → CTA único arriba del listado',
  'P3: click-outside menú roto → menuRef',
  'P3: CSS add-budget-button, budgets-summary-block eliminados',
]

const PRESUPUESTOS_OPEN: { priority: string; text: string }[] = []

const PRESUPUESTOS_TEST_PLAN = [
  'CTA visible con y sin presupuestos en lista',
  'Resumen 3 métricas en $0 cuando lista vacía',
  'Botón archivados abre modal de eliminados',
  '⋮ solo aparece con debug tools habilitado',
  'Tap fila → detalle; barra progreso y % visible',
]

const ME_DEBEN_DIMENSIONS = [
  { label: 'Uso vertical del espacio', score: 3.8 },
  { label: 'Jerarquía visual', score: 4.0 },
  { label: 'Botones y acciones', score: 4.2 },
  { label: 'Densidad / escaneo', score: 3.8 },
  { label: 'Consistencia de layout', score: 4.0 },
  { label: 'Legibilidad tipográfica', score: 4.0 },
]

const ME_DEBEN_LAYOUT_METRICS = [
  { label: 'CTA visible', value: 'Sí', status: 'ok' as const },
  { label: 'crud-summary-strip', value: '5 cols', status: 'ok' as const },
  { label: 'Filas', value: 'card', status: 'ok' as const },
  { label: '⋮ menú', value: 'Debug', status: 'ok' as const },
  { label: 'Ancho', value: '1200', status: 'ok' as const },
  { label: 'Resumen', value: 'strip', status: 'ok' as const },
]

const ME_DEBEN_STRENGTHS = [
  'CTA Agregar deudor visible (btn-submit) — no oculto en ⋮',
  'Resumen crud-summary-strip--success con 5 métricas (siempre visible)',
  'Filas crud-card-row--debtor con progreso de cobro',
  'Colores semánticos en strip (pendiente/pagado/completos)',
]

const ME_DEBEN_RESOLVED = [
  'P0: Agregar solo en ⋮ → CTA visible + ⋮ solo debug',
  'P0: me-deben-summary-block centrado → crud-summary-strip full-width',
  'P2: labels ALL CAPS → sentence case en strip',
  'P3: resumen solo con datos → strip siempre visible',
  'P3: empty-state-cta duplicado → CTA único arriba del listado',
  'P3: CSS me-deben-summary-block eliminado de MeDeben.css',
]

const ME_DEBEN_OPEN: { priority: string; text: string }[] = [
  {
    priority: 'P3',
    text: 'Strip de 5 columnas — en móvil hace wrap; considerar 3 métricas principales + detalle',
  },
]

const ME_DEBEN_TEST_PLAN = [
  'CTA visible con y sin deudores en lista',
  'Resumen 5 métricas en cero cuando lista vacía',
  '⋮ solo aparece con debug tools habilitado',
  'Tap fila → detalle; barra progreso de cobro',
  'Deudor pagado → fila crud-card-row--paid-off',
]

const TARJETAS_CREDITO_DIMENSIONS = [
  { label: 'Uso vertical del espacio', score: 3.8 },
  { label: 'Jerarquía visual', score: 4.0 },
  { label: 'Botones y acciones', score: 4.2 },
  { label: 'Densidad / escaneo', score: 3.8 },
  { label: 'Consistencia de layout', score: 4.0 },
  { label: 'Legibilidad tipográfica', score: 4.0 },
]

const TARJETAS_CREDITO_LAYOUT_METRICS = [
  { label: 'CTA visible', value: 'Sí', status: 'ok' as const },
  { label: 'crud-summary-strip', value: '2 cols', status: 'ok' as const },
  { label: 'Filas', value: 'card', status: 'ok' as const },
  { label: 'Beneficios', value: 'toolbar', status: 'ok' as const },
  { label: '⋮ menú', value: 'Debug', status: 'ok' as const },
  { label: 'Ancho', value: '1200', status: 'ok' as const },
]

const TARJETAS_CREDITO_STRENGTHS = [
  'CTA Agregar tarjeta visible (btn-submit) — no oculto en ⋮',
  'Resumen crud-summary-strip (cupo total + disponible) siempre visible',
  'Beneficios en botón toolbar (LocalOffer) cuando hay tarjetas con perks',
  'Filas crud-card-row--credit con barra de uso de cupo',
]

const TARJETAS_CREDITO_RESOLVED = [
  'P0: Agregar solo en ⋮ → CTA visible + ⋮ solo debug',
  'P0: credit-summary-block centrado → crud-summary-strip full-width',
  'P1: beneficios en ⋮ → botón visible en toolbar',
  'P2: labels ALL CAPS → sentence case en strip',
  'P3: resumen condicional → strip siempre visible',
  'P3: empty-state-cta duplicado → CTA único arriba del listado',
  'P3: CSS credit-summary-block eliminado de TarjetasCredito.css',
]

const TARJETAS_CREDITO_OPEN: { priority: string; text: string }[] = [
  {
    priority: 'P2',
    text: 'credit-warning-banner siempre visible — ~100px vertical; considerar colapsable',
  },
]

const TARJETAS_CREDITO_TEST_PLAN = [
  'CTA visible con y sin tarjetas en lista',
  'Resumen cupo/disponible en $0 cuando lista vacía',
  'Botón beneficios solo si hay tarjetas con perks',
  '⋮ solo aparece con debug tools habilitado',
  'Tap fila → detalle; barra uso de cupo visible',
]

const TARJETAS_DEBITO_DIMENSIONS = [
  { label: 'Uso vertical del espacio', score: 4.0 },
  { label: 'Jerarquía visual', score: 4.2 },
  { label: 'Botones y acciones', score: 4.2 },
  { label: 'Densidad / escaneo', score: 4.0 },
  { label: 'Consistencia de layout', score: 4.2 },
  { label: 'Legibilidad tipográfica', score: 4.0 },
]

const TARJETAS_DEBITO_LAYOUT_METRICS = [
  { label: 'CTA visible', value: 'Sí', status: 'ok' as const },
  { label: 'crud-summary-strip', value: '4 cols', status: 'ok' as const },
  { label: 'Filas', value: 'card', status: 'ok' as const },
  { label: '⋮ menú', value: 'Debug', status: 'ok' as const },
  { label: 'Ancho', value: '1200', status: 'ok' as const },
  { label: 'Resumen', value: 'strip', status: 'ok' as const },
]

const TARJETAS_DEBITO_STRENGTHS = [
  'CTA Agregar tarjeta visible (btn-submit) — no oculto en ⋮',
  'Resumen crud-summary-strip (total, físicas, virtuales, subscripciones)',
  'Filas crud-card-row--debit-card con meta chips (tipo, vencimiento)',
  'Sin banner educativo fijo — más espacio útil que TC',
]

const TARJETAS_DEBITO_RESOLVED = [
  'P0: Agregar solo en ⋮ → CTA visible + ⋮ solo debug',
  'P0: tarjetas-debito-summary-block centrado → crud-summary-strip',
  'P2: labels ALL CAPS → sentence case en strip',
  'P3: resumen condicional → strip siempre visible',
  'P3: empty-state-cta duplicado → CTA único arriba del listado',
  'P3: tarjetas-debito-list → crud-card-list compartido',
]

const TARJETAS_DEBITO_OPEN: { priority: string; text: string }[] = []

const TARJETAS_DEBITO_TEST_PLAN = [
  'CTA visible con y sin tarjetas en lista',
  'Resumen 4 métricas en cero cuando lista vacía',
  '⋮ solo aparece con debug tools habilitado',
  'Tap fila → detalle modal',
  'Chips física/virtual y contador subscripciones en fila',
]

const SUBSCRIPCIONES_DIMENSIONS = [
  { label: 'Uso vertical del espacio', score: 4.0 },
  { label: 'Jerarquía visual', score: 4.2 },
  { label: 'Botones y acciones', score: 4.2 },
  { label: 'Densidad / escaneo', score: 4.0 },
  { label: 'Consistencia de layout', score: 4.2 },
  { label: 'Legibilidad tipográfica', score: 4.0 },
]

const SUBSCRIPCIONES_LAYOUT_METRICS = [
  { label: 'CTA visible', value: 'Sí', status: 'ok' as const },
  { label: 'crud-summary-strip', value: '4 cols', status: 'ok' as const },
  { label: 'Filas', value: 'card', status: 'ok' as const },
  { label: '⋮ menú', value: 'Debug', status: 'ok' as const },
  { label: 'Ancho', value: '1200', status: 'ok' as const },
  { label: 'Resumen', value: 'strip', status: 'ok' as const },
]

const SUBSCRIPCIONES_STRENGTHS = [
  'CTA Agregar subscripción visible (btn-submit) — no oculto en ⋮',
  'Resumen crud-summary-strip (total, mensual, familiares, individuales)',
  'Filas crud-card-row--subscription con precio y fecha de corte',
  'Sub-hub crédito completo auditado — mismo patrón strip + CTA',
]

const SUBSCRIPCIONES_RESOLVED = [
  'P0: Agregar solo en ⋮ → CTA visible + ⋮ solo debug',
  'P0: subscripciones-summary-block centrado → crud-summary-strip',
  'P2: labels ALL CAPS → sentence case en strip',
  'P3: resumen condicional → strip siempre visible',
  'P3: empty-state-cta duplicado → CTA único arriba del listado',
  'P3: subscripciones-list → crud-card-list compartido',
]

const SUBSCRIPCIONES_OPEN: { priority: string; text: string }[] = []

const SUBSCRIPCIONES_TEST_PLAN = [
  'CTA visible con y sin subscripciones en lista',
  'Resumen total mensual en $0 cuando lista vacía',
  '⋮ solo aparece con debug tools habilitado',
  'Tap fila → detalle modal',
  'Tag familiar visible en filas esFamiliar',
]

const CDTS_DIMENSIONS = [
  { label: 'Uso vertical del espacio', score: 4.0 },
  { label: 'Jerarquía visual', score: 4.0 },
  { label: 'Botones y acciones', score: 4.2 },
  { label: 'Densidad / escaneo', score: 3.9 },
  { label: 'Consistencia de layout', score: 4.0 },
  { label: 'Legibilidad tipográfica', score: 4.0 },
]

const CDTS_LAYOUT_METRICS = [
  { label: 'CTA visible', value: 'Sí', status: 'ok' as const },
  { label: 'crud-summary-strip', value: '4 cols', status: 'ok' as const },
  { label: 'Filas', value: 'inset+tall', status: 'ok' as const },
  { label: '⋮ menú', value: 'Debug', status: 'ok' as const },
  { label: 'FAB', value: 'Eliminado', status: 'ok' as const },
  { label: 'Resumen', value: 'strip', status: 'ok' as const },
]

const CDTS_STRENGTHS = [
  'CTA Agregar CDT visible (btn-submit) — sin FAB duplicado',
  'Resumen crud-summary-strip--success (total, invertido, tasa, ganancia real)',
  'Filas crud-inset-row--tall con barra de progreso por CDT',
  'Sub-hub ahorro iniciado con patrón unificado',
]

const CDTS_RESOLVED = [
  'P0: Agregar en ⋮ + FAB → CTA visible + ⋮ solo debug',
  'P0: sin resumen → crud-summary-strip--success',
  'P2: subtitle redundante eliminado',
  'P3: empty-state-cta duplicado → CTA único arriba',
  'P3: cdts-fab y cdts-empty-button CSS muerto eliminado',
]

const CDTS_OPEN: { priority: string; text: string }[] = []

const CDTS_TEST_PLAN = [
  'CTA visible con y sin CDTs en lista',
  'Resumen en $0 / 0 CDTs cuando lista vacía',
  '⋮ solo aparece con debug tools habilitado',
  'Barra de progreso visible en filas con duración',
  'Tap fila → detalle modal',
]

const INFLACION_DIMENSIONS = [
  { label: 'Uso vertical del espacio', score: 3.5 },
  { label: 'Jerarquía visual', score: 4.0 },
  { label: 'Botones y acciones', score: 4.0 },
  { label: 'Densidad / escaneo', score: 3.5 },
  { label: 'Consistencia de layout', score: 3.8 },
  { label: 'Legibilidad tipográfica', score: 3.8 },
]

const INFLACION_LAYOUT_METRICS = [
  { label: 'CTA crear', value: 'N/A', status: 'ok' as const },
  { label: 'crud-summary-strip', value: 'Calc+pred', status: 'ok' as const },
  { label: 'Orden', value: 'Tools first', status: 'ok' as const },
  { label: 'Editorial', value: 'Post-chart', status: 'warn' as const },
  { label: 'Tips grid', value: '8 cards', status: 'warn' as const },
  { label: 'Ancho', value: '1200', status: 'ok' as const },
]

const INFLACION_STRENGTHS = [
  'Calculadora y predictor arriba del fold (antes de editorial)',
  'Resultado devaluación en crud-summary-strip--danger',
  'Proyección inflación en strip 4 columnas',
  'Back toolbar mínimo — coherente con pantalla herramienta',
]

const INFLACION_RESOLVED = [
  'P1: calculadora bajo warning/tips → herramientas primero',
  'P2: inflacion-result custom → crud-summary-strip--danger',
  'P2: prediction cards → crud-summary-strip compartido',
]

const INFLACION_OPEN: { priority: string; text: string }[] = [
  { priority: 'P2', text: 'inflacion-warning ocupa mucho vertical en móvil' },
  { priority: 'P2', text: 'Grid 8 tips — considerar acordeón o “ver más”' },
]

const INFLACION_TEST_PLAN = [
  'Calculadora visible sin scroll en desktop',
  'Strip de devaluación actualiza al cambiar monto/años',
  'Predictor strip muestra 4 horizontes temporales',
  'Gráfico histórico renderiza tras herramientas',
  'Warning y tips accesibles con scroll posterior',
]

const CRIPTO_WALLET_DIMENSIONS = [
  { label: 'Uso vertical del espacio', score: 4.0 },
  { label: 'Jerarquía visual', score: 4.0 },
  { label: 'Botones y acciones', score: 4.2 },
  { label: 'Densidad / escaneo', score: 3.9 },
  { label: 'Consistencia de layout', score: 4.0 },
  { label: 'Legibilidad tipográfica', score: 4.0 },
]

const CRIPTO_WALLET_LAYOUT_METRICS = [
  { label: 'CTA visible', value: 'Sí', status: 'ok' as const },
  { label: 'crud-summary-strip', value: '4 cols', status: 'ok' as const },
  { label: 'Filas', value: 'crypto', status: 'ok' as const },
  { label: '⋮ menú', value: 'Debug', status: 'ok' as const },
  { label: 'Ancho', value: '1200', status: 'ok' as const },
  { label: 'Resumen', value: 'strip', status: 'ok' as const },
]

const CRIPTO_WALLET_STRENGTHS = [
  'CTA Agregar wallet visible (btn-submit)',
  'Resumen crud-summary-strip (total, criptos, BTC, ETH)',
  'Filas crud-crypto-row con dirección en meta',
  'Toolbar app-toolbar estándar Finanzas',
]

const CRIPTO_WALLET_RESOLVED = [
  'P0: Agregar en ⋮ → CTA visible + ⋮ solo debug',
  'P0: sin resumen → crud-summary-strip',
  'P1: cripto-wallet-toolbar custom → app-toolbar',
  'P3: empty CTA duplicado → CTA único arriba',
]

const CRIPTO_WALLET_OPEN: { priority: string; text: string }[] = []

const CRIPTO_WALLET_TEST_PLAN = [
  'CTA visible con lista vacía',
  'Strip en 0 wallets / 0 criptos',
  'Tap fila → detalle modal',
  '⋮ solo con debug tools',
]

const CRIPTO_TRANSACCIONES_DIMENSIONS = [
  { label: 'Uso vertical del espacio', score: 3.9 },
  { label: 'Jerarquía visual', score: 4.0 },
  { label: 'Botones y acciones', score: 4.2 },
  { label: 'Densidad / escaneo', score: 3.8 },
  { label: 'Consistencia de layout', score: 3.9 },
  { label: 'Legibilidad tipográfica', score: 3.9 },
]

const CRIPTO_TRANSACCIONES_LAYOUT_METRICS = [
  { label: 'CTA visible', value: 'Sí', status: 'ok' as const },
  { label: 'Sync tasas', value: 'Toolbar', status: 'ok' as const },
  { label: 'crud-summary-strip', value: '4 cols', status: 'ok' as const },
  { label: 'Highlights', value: 'Eliminados', status: 'ok' as const },
  { label: 'Filas', value: 'crypto', status: 'ok' as const },
  { label: 'Filtro', value: 'Select', status: 'warn' as const },
]

const CRIPTO_TRANSACCIONES_STRENGTHS = [
  'CTA Agregar transacción visible',
  'Sync tasas en toolbar (no oculto en ⋮)',
  'Strip con valor USDT, posiciones y estado tasas',
  'Highlight cards por cripto reemplazados por strip',
]

const CRIPTO_TRANSACCIONES_RESOLVED = [
  'P0: Agregar + sync en ⋮ → CTA + botón sync toolbar',
  'P0: highlight cards → crud-summary-strip',
  'P3: empty CTA duplicado eliminado',
]

const CRIPTO_TRANSACCIONES_OPEN: { priority: string; text: string }[] = [
  { priority: 'P3', text: 'Filtro select — considerar chips en toolbar' },
]

const CRIPTO_TRANSACCIONES_TEST_PLAN = [
  'CTA visible sin transacciones',
  'Botón sync deshabilitado si tasas actualizadas hoy',
  'Strip Valor USDT en $0 sin posiciones',
  'Filtro por BTC/ETH/QRL reduce lista',
]

const CRYPTO_VENDORS_DIMENSIONS = [
  { label: 'Uso vertical del espacio', score: 3.2 },
  { label: 'Jerarquía visual', score: 3.8 },
  { label: 'Botones y acciones', score: 4.0 },
  { label: 'Densidad / escaneo', score: 3.2 },
  { label: 'Consistencia de layout', score: 3.8 },
  { label: 'Legibilidad tipográfica', score: 3.8 },
]

const CRYPTO_VENDORS_LAYOUT_METRICS = [
  { label: 'CTA crear', value: 'Form', status: 'ok' as const },
  { label: 'crud-summary-strip', value: '4 cols', status: 'ok' as const },
  { label: 'Formulario', value: 'Inline', status: 'warn' as const },
  { label: 'Lista', value: 'Custom', status: 'warn' as const },
  { label: '⋮ menú', value: 'Debug', status: 'ok' as const },
  { label: 'Guardar lista', value: 'Toolbar', status: 'ok' as const },
]

const CRYPTO_VENDORS_STRENGTHS = [
  'CTA Agregar en submit del formulario (campos extensos)',
  'Strip con vendedores, descuentos, criptos y nombre lista',
  'Icono carpeta para registros guardados en toolbar',
]

const CRYPTO_VENDORS_RESOLVED = [
  'P2: sin resumen → crud-summary-strip',
  'P2: subtitle largo eliminado',
]

const CRYPTO_VENDORS_OPEN: { priority: string; text: string }[] = [
  { priority: 'P2', text: 'Formulario largo — considerar modal o pasos' },
  { priority: 'P2', text: 'cryptovendors-item denso — crud-card-row compacto' },
]

const CRYPTO_VENDORS_TEST_PLAN = [
  'Strip actualiza al agregar vendedor',
  'Lista muestra nombre lista en strip (Borrador / guardado)',
  'Formulario editar precarga datos en misma vista',
  'Guardar lista abre modal nombre',
]

const PROYECTOS_RESOLVED = [
  'P0: Agregar en ⋮ → crud-primary-cta',
  'P0: proyectos-summary-block → crud-summary-strip--success',
  'P1: proyectos-toolbar → app-toolbar',
  'P3: crud-card-list + crud-card-row--project',
]

const LISTAS_MERCADO_RESOLVED = [
  'P0: listas-fab → crud-primary-cta',
  'P0: listas-summary condicional → crud-summary-strip',
  'P2: subtitle eliminado',
  'P3: empty CTA duplicado eliminado',
]

const DISENADOR_RESOLVED = [
  'P2: sin resumen → crud-summary-strip',
  'P2: subtitle eliminado',
  'P3: empty CTA → guía al formulario',
]

const DISENADOR_OPEN: { priority: string; text: string }[] = [
  { priority: 'P2', text: 'Formulario + lista + borradores — mucho scroll' },
]

const REGISTROS_RESOLVED = [
  'P2: registros-page-subtitle eliminado en hub',
  'Hub crud-hub-list alineado con Finanzas',
]

const REGISTROS_CRUD_RESOLVED = [
  'P0: Agregar/Subir en ⋮ → crud-primary-cta (Cuadernos, Secretos, Archivos, Empleados, Vehículos, Patrimonio)',
  'P0: FAB secretos/cuadernos eliminados',
  'P0: crud-summary-strip en todas las CRUD del hub',
  'P2: filas custom → crud-inset-row (Empleados, Vehículos, Patrimonio)',
  'P2: subtitles eliminados',
  'P3: empty CTA duplicado eliminado',
]

const REGISTROS_TOOLS_RESOLVED = [
  'P2: generador-contrasenas-page-subtitle eliminado',
  'Calculadora: herramienta sin CTA CRUD (OK)',
]

const TRABAJO_RESOLVED = [
  'P2: trabajo-page-subtitle eliminado en hub',
  'P0: Contratos — strip + CTA + crud-inset-row',
  'P0: Actividades — strip + CTA + crud-inset-row',
  'P0: highlight panels → crud-summary-strip',
  'P3: empty CTA duplicado eliminado',
]

const TIEMPO_RESOLVED = [
  'P2: tiempo-page-subtitle eliminado en hub',
  'P0: Fechas, Rutinas, Mi Diario — strip + CTA visible',
  'P0: Mi Día — strip + CTA a Rutinas + filas inset',
  'P2: filas custom → crud-inset-row (Fechas, Rutinas)',
  'P2: midiario-streak-container → crud-summary-strip',
  'P3: empty CTA duplicado eliminado',
]

const AJUSTES_RESOLVED = [
  'P2: ajustes-page-subtitle eliminado',
  'P2: app-page-content-wide + crud-page-content',
  'P2: crud-summary-strip (nombre, tema, cuenta)',
  'P3: ajustes-primary-button → btn-base btn-accent',
  'P3: ajustes-danger-button → btn-base + soft danger (referencia)',
  'P3: form-input-base / form-label-base en perfil',
  'P3: import Finanzas.css eliminado',
]

const JUSTICIA_RESOLVED = [
  'P2: justicia-page-subtitle eliminado en hub',
  'P0: Procesos — Actualizar en ⋮ → crud-primary-cta visible',
  'P0: Procesos — crud-summary-strip (total, seguimiento, trámite)',
  'P2: procesos-page-subtitle eliminado',
  'P3: empty CTA duplicado eliminado',
  'P3: retry con btn-base btn-secondary',
]

const NOTIFICACIONES_RESOLVED = [
  'P0: Marcar todas / Eliminar todas en ⋮ → CTAs visibles',
  'P2: notificaciones-page-subtitle → crud-summary-strip',
  'P2: crud-summary-strip (total, no leídas, leídas)',
  'P3: ⋮ solo debug gateado',
  'P3: retry con btn-base btn-secondary',
]

const LOGIN_TEST_PLAN = [
  'Desktop: card centrada 440px, sin scroll de página',
  'iPhone SE: card cabe; scroll interno solo con error general',
  'Teclado virtual: campo activo visible',
  'Banner error + errores campo: card no desborda viewport',
  'Tab: orden lógico hasta submit; toggle no rompe alineación',
]

const SECTIONS = [
  { name: 'Login', route: '/login', score: 5, status: 'done' as const, doc: 'login.md' },
  { name: 'Home', route: '/', score: 5, status: 'done' as const, doc: 'home.md' },
  { name: 'Finanzas hub', route: '/finanzas', score: 4.0, status: 'done' as const, doc: 'finanzas.md' },
  { name: 'Transacciones', route: '/finanzas/transacciones', score: 4.2, status: 'done' as const, doc: 'transacciones.md' },
  { name: 'Cuentas', route: '/finanzas/cuentas', score: 4.0, status: 'done' as const, doc: 'cuentas.md' },
  { name: 'Deudas', route: '/finanzas/deudas', score: 3.9, status: 'done' as const, doc: 'deudas.md' },
  { name: 'Presupuestos', route: '/finanzas/presupuestos', score: 4.0, status: 'done' as const, doc: 'presupuestos.md' },
  { name: 'Me Deben', route: '/finanzas/me-deben', score: 3.9, status: 'done' as const, doc: 'me-deben.md' },
  { name: 'Tarjetas de crédito', route: '/finanzas/tarjetas-credito', score: 3.9, status: 'done' as const, doc: 'tarjetas-credito.md' },
  { name: 'Tarjetas de débito', route: '/finanzas/tarjetas-debito', score: 4.0, status: 'done' as const, doc: 'tarjetas-debito.md' },
  { name: 'Subscripciones', route: '/finanzas/subscripciones', score: 4.0, status: 'done' as const, doc: 'subscripciones.md' },
  { name: 'CDTs', route: '/finanzas/cdts', score: 4.0, status: 'done' as const, doc: 'cdts.md' },
  { name: 'Inflación', route: '/finanzas/inflacion', score: 3.8, status: 'done' as const, doc: 'inflacion.md' },
  { name: 'Cripto Wallet', route: '/finanzas/cripto-wallet', score: 4.0, status: 'done' as const, doc: 'cripto-wallet.md' },
  { name: 'Mi Cripto', route: '/finanzas/cripto-transacciones', score: 3.9, status: 'done' as const, doc: 'cripto-transacciones.md' },
  { name: 'Vendedores cripto', route: '/finanzas/crypto-vendors', score: 3.7, status: 'done' as const, doc: 'crypto-vendors.md' },
  { name: 'Proyectos', route: '/finanzas/proyectos', score: 4.0, status: 'done' as const, doc: 'proyectos.md' },
  { name: 'Listas de mercado', route: '/finanzas/listas-mercado', score: 4.0, status: 'done' as const, doc: 'listas-mercado.md' },
  { name: 'Diseñador presupuestos', route: '/finanzas/diseñador-presupuestos', score: 3.8, status: 'done' as const, doc: 'disenador-presupuestos.md' },
  { name: 'Utilidades hub', route: '/registros', score: 3.8, status: 'done' as const, doc: 'registros.md' },
  { name: 'Cuadernos', route: '/registros/cuadernos', score: 4.0, status: 'done' as const, doc: 'cuadernos.md' },
  { name: 'Secretos', route: '/registros/secretos', score: 4.0, status: 'done' as const, doc: 'secretos.md' },
  { name: 'Archivos', route: '/registros/archivos', score: 4.0, status: 'done' as const, doc: 'archivos.md' },
  { name: 'Empleados', route: '/registros/empleados', score: 4.0, status: 'done' as const, doc: 'empleados.md' },
  { name: 'Vehículos', route: '/registros/vehiculos', score: 4.0, status: 'done' as const, doc: 'vehiculos.md' },
  { name: 'Patrimonio', route: '/registros/patrimonio', score: 4.0, status: 'done' as const, doc: 'patrimonio.md' },
  { name: 'Calculadora', route: '/registros/calculadora', score: 4.0, status: 'done' as const, doc: 'calculadora.md' },
  { name: 'Generador contraseñas', route: '/registros/generador-contrasenas', score: 3.6, status: 'done' as const, doc: 'generador-contrasenas.md' },
  { name: 'Trabajo hub', route: '/trabajo', score: 3.8, status: 'done' as const, doc: 'trabajo.md' },
  { name: 'Contratos', route: '/trabajo/contratos', score: 4.0, status: 'done' as const, doc: 'contratos.md' },
  { name: 'Actividades', route: '/trabajo/actividades', score: 3.9, status: 'done' as const, doc: 'actividades.md' },
  { name: 'Lifestyle hub', route: '/tiempo', score: 3.8, status: 'done' as const, doc: 'tiempo.md' },
  { name: 'Fechas', route: '/tiempo/fechas', score: 3.9, status: 'done' as const, doc: 'fechas.md' },
  { name: 'Rutinas', route: '/tiempo/rutinas', score: 4.0, status: 'done' as const, doc: 'rutinas.md' },
  { name: 'Mi Día', route: '/tiempo/mi-dia', score: 3.8, status: 'done' as const, doc: 'mi-dia.md' },
  { name: 'Mi Diario', route: '/tiempo/mi-diario', score: 4.0, status: 'done' as const, doc: 'mi-diario.md' },
  { name: 'Ajustes', route: '/ajustes', score: 4.0, status: 'done' as const, doc: 'ajustes.md' },
  { name: 'Justicia hub', route: '/justicia', score: 3.8, status: 'done' as const, doc: 'justicia.md' },
  { name: 'Procesos', route: '/justicia/procesos', score: 3.9, status: 'done' as const, doc: 'procesos.md' },
  { name: 'Notificaciones', route: '/notificaciones', score: 4.0, status: 'done' as const, doc: 'notificaciones.md' },
]

const FINDINGS = [
  {
    priority: 'P0',
    text: 'Acción primaria (Agregar) oculta en menú ⋮ — Finanzas, Registros y Trabajo completos',
    done: true,
  },
  {
    priority: 'P0',
    text: 'Bloques summary-* duplicados en 10+ CSS con alineación y tipografía distinta',
    done: false,
  },
  {
    priority: 'P1',
    text: 'Chrome vertical: StatusBar + padding-top + Footer + margin-bottom duplicado (~130px+ perdidos)',
    done: true,
  },
  {
    priority: 'P1',
    text: 'Tres familias de fila (settings / inset / transaction) — misma tarea, distinta densidad',
    done: false,
  },
  {
    priority: 'P1',
    text: 'Hub Finanzas: CTA full-width 64px + 15 filas → scroll excesivo antes de Cripto/CDTs',
    done: true,
  },
  {
    priority: 'P2',
    text: 'Labels de resumen en ALL CAPS + letter-spacing 0.1em — peor lectura en móvil',
    done: false,
  },
  {
    priority: 'P2',
    text: 'crud-hub-row vive en Finanzas.css pero lo usan Ajustes, Trabajo, Tiempo, Registros',
    done: false,
  },
  {
    priority: 'P2',
    text: 'Modal Transacciones: muchos toggles sin agrupación — alta carga cognitiva',
    done: true,
  },
  {
    priority: 'P3',
    text: 'Salto 800px (hub) → 1200px (CRUD) en desktop — sensación de layout “pegado”',
    done: false,
  },
  {
    priority: 'P3',
    text: '6+ variantes de botón (btn-base, finanzas-add-*, empty-state-cta, ajustes-*) sin escala clara',
    done: false,
  },
]

const RELATED_AUDITS = [
  { name: 'UI Readiness', route: '/ui-readiness', score: 4.1, note: 'Estética y tokens sólidos' },
  { name: 'UX Readiness', route: '/ux-readiness', score: 3.9, note: 'Feedback y a11y en progreso' },
  { name: 'Product Readiness', route: '/product-readiness', score: 4.0, note: 'Finanzas production-ready' },
]

function SpaceAudit() {
  return (
    <div className="app-page-container">
      <div className="app-page-content space-audit-content ui-readiness-content">
        <section className="ui-readiness-hero">
          <h1 className="home-title">Space Audit</h1>
          <div className="ui-readiness-score">
            <span className="ui-readiness-score-value">{GLOBAL_SCORE}</span>
            <span className="ui-readiness-score-max">/ 5</span>
          </div>
          <p className="ui-readiness-subtitle">
            Auditoría de uso del espacio, jerarquía de botones y presentación de información.
            La app puede verse bien ({' '}
            <Link to="/ui-readiness" className="ux-readiness-link">
              UI 4.1
            </Link>
            ) y aun así costar leerla y usarla.
          </p>
          <p className="ux-readiness-repo-note">
            Documentación: <code>space-audit/README.md</code>
          </p>
        </section>

        <section className="ui-readiness-section">
          <h2 className="ui-readiness-section-title">vs otras auditorías</h2>
          <div className="space-audit-compare">
            {RELATED_AUDITS.map(a => (
              <div key={a.name} className="space-audit-compare-card">
                <div
                  className={`space-audit-compare-score ${
                    a.score >= 4 ? 'space-audit-compare-score--ok' : 'space-audit-compare-score--mid'
                  }`}
                >
                  {a.score}
                </div>
                <h3>
                  <Link to={a.route} className="ux-readiness-link">
                    {a.name}
                  </Link>
                </h3>
                <p>{a.note}</p>
              </div>
            ))}
            <div className="space-audit-compare-card">
              <div className="space-audit-compare-score space-audit-compare-score--low">
                {GLOBAL_SCORE}
              </div>
              <h3>Space Audit</h3>
              <p>Layout, densidad, acciones visibles, lectura de datos</p>
            </div>
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
          <h2 className="ui-readiness-section-title">Métricas de layout</h2>
          <div className="ux-readiness-metrics">
            {METRICS.map(m => (
              <div
                key={m.label}
                className={`ux-readiness-metric ux-readiness-metric-${m.status}`}
              >
                <div className="ux-readiness-metric-value">{m.value}</div>
                <div className="ux-readiness-metric-label">{m.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="ui-readiness-section">
          <h2 className="ui-readiness-section-title">Patrones de fila (inconsistencia)</h2>
          <p className="ui-readiness-section-desc">
            Tres implementaciones para “lista clicable con título + metadata”. Misma intención,
            distinto padding, altura y contenedor.
          </p>
          <div className="space-audit-pattern-table">
            <div className="space-audit-pattern-header">
              <span>Clase</span>
              <span>Uso</span>
              <span>Altura</span>
              <span>CSS</span>
            </div>
            {ROW_PATTERNS.map(p => (
              <div key={p.class} className="space-audit-pattern-row">
                <code>{p.class}</code>
                <span>{p.where}</span>
                <span>{p.height}</span>
                <code>{p.css}</code>
              </div>
            ))}
          </div>
        </section>

        <section className="ui-readiness-section">
          <h2 className="ui-readiness-section-title">Demo — acciones en toolbar</h2>
          <p className="ui-readiness-section-desc">
            Hoy la mayoría de CRUD solo muestran back + ⋮. Finanzas hub sí tiene CTA prominente.
          </p>
          <p className="space-audit-demo-label">Patrón actual (difícil de descubrir)</p>
          <div className="space-audit-demo-toolbar space-audit-demo-bad">
            <button type="button" className="app-toolbar-button" aria-label="Volver">
              <ArrowBackIcon />
            </button>
            <button type="button" className="app-toolbar-button" aria-label="Opciones">
              <MoreVertIcon />
            </button>
          </div>
          <p className="space-audit-demo-label space-audit-demo-good">Patrón objetivo</p>
          <div className="space-audit-demo-toolbar">
            <button type="button" className="app-toolbar-button" aria-label="Volver">
              <ArrowBackIcon />
            </button>
            <button type="button" className="btn-base btn-primary">
              <AddIcon /> Agregar
            </button>
          </div>
        </section>

        <section className="ui-readiness-section">
          <h2 className="ui-readiness-section-title">Secciones auditadas</h2>
          <p className="ui-readiness-section-desc">
            Score de espacio/legibilidad por área. Se audita sección por sección.
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
                  className={`ux-readiness-badge ux-readiness-badge-${s.status === 'done' ? 'done' : 'pending'}`}
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
              <h2 className="ui-readiness-section-title">Login — 5 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                Referencia de layout y densidad. Auditoría:{' '}
                <code>space-audit/login.md</code> (2026-06-22). UX:{' '}
                <Link to="/ux-readiness" className="ux-readiness-link">
                  4.9/5
                </Link>
                .{' '}
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

          <h3 className="ux-readiness-subsection-title">Métricas de layout</h3>
          <div className="ux-readiness-metrics">
            {LOGIN_LAYOUT_METRICS.map(m => (
              <div
                key={m.label}
                className={`ux-readiness-metric ux-readiness-metric-${m.status}`}
              >
                <div className="ux-readiness-metric-value">{m.value}</div>
                <div className="ux-readiness-metric-label">{m.label}</div>
              </div>
            ))}
          </div>

          <h3 className="ux-readiness-subsection-title">Fortalezas verificadas</h3>
          <ul className="ux-readiness-bullet-list">
            {LOGIN_STRENGTHS.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Resueltos (2026-06-22)</h3>
          <ul className="ux-readiness-bullet-list">
            {LOGIN_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Hallazgos abiertos</h3>
          {LOGIN_OPEN.length === 0 ? (
            <p className="ui-readiness-section-desc">Sin hallazgos abiertos — Login referencia de layout.</p>
          ) : (
            <ul className="ui-readiness-findings">
              {LOGIN_OPEN.map((f, i) => (
                <li key={i} className="ui-readiness-finding space-audit-finding-open">
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

          <h3 className="ux-readiness-subsection-title">Patrones a exportar</h3>
          <ul className="ux-readiness-bullet-list">
            <li>Card centrada con max-width acotado para tareas de un objetivo</li>
            <li>CTA full-width con misma altura que inputs (52px “comfortable”)</li>
            <li>Viewport sin chrome en flujos críticos</li>
            <li>Notas secundarias en tertiary — nunca compiten con el CTA</li>
          </ul>

          <h3 className="ux-readiness-subsection-title">Plan de pruebas (layout)</h3>
          <ul className="ux-readiness-bullet-list">
            {LOGIN_TEST_PLAN.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Home — 5 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                Hub raíz / launcher. Auditoría: <code>space-audit/home.md</code> (2026-06-22). UX:{' '}
                <Link to="/ux-readiness" className="ux-readiness-link">
                  4.8/5
                </Link>
                .{' '}
                <Link to="/" className="ux-readiness-link">
                  Ver pantalla →
                </Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">5</span>
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

          <h3 className="ux-readiness-subsection-title">Métricas de layout</h3>
          <div className="ux-readiness-metrics">
            {HOME_LAYOUT_METRICS.map(m => (
              <div
                key={m.label}
                className={`ux-readiness-metric ux-readiness-metric-${m.status}`}
              >
                <div className="ux-readiness-metric-value">{m.value}</div>
                <div className="ux-readiness-metric-label">{m.label}</div>
              </div>
            ))}
          </div>

          <h3 className="ux-readiness-subsection-title">Fortalezas verificadas</h3>
          <ul className="ux-readiness-bullet-list">
            {HOME_STRENGTHS.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Resueltos (2026-06-22)</h3>
          <ul className="ux-readiness-bullet-list">
            {HOME_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Hallazgos abiertos</h3>
          {HOME_OPEN.length === 0 ? (
            <p className="ui-readiness-section-desc">Sin hallazgos abiertos.</p>
          ) : (
            <ul className="ui-readiness-findings">
              {HOME_OPEN.map((f, i) => (
                <li key={i} className="ui-readiness-finding space-audit-finding-open">
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

          <h3 className="ux-readiness-subsection-title">Plan de pruebas (layout)</h3>
          <ul className="ux-readiness-bullet-list">
            {HOME_TEST_PLAN.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Finanzas hub — 4.0 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                Hub de sección con resumen + CTA + lista iOS. Auditoría:{' '}
                <code>space-audit/finanzas.md</code> (2026-06-22). Product:{' '}
                <Link to="/product-readiness" className="ux-readiness-link">
                  4.0/5
                </Link>
                .{' '}
                <Link to="/finanzas" className="ux-readiness-link">
                  Ver pantalla →
                </Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">4.0</span>
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

          <h3 className="ux-readiness-subsection-title">Métricas de layout</h3>
          <div className="ux-readiness-metrics">
            {FINANZAS_LAYOUT_METRICS.map(m => (
              <div
                key={m.label}
                className={`ux-readiness-metric ux-readiness-metric-${m.status}`}
              >
                <div className="ux-readiness-metric-value">{m.value}</div>
                <div className="ux-readiness-metric-label">{m.label}</div>
              </div>
            ))}
          </div>

          <h3 className="ux-readiness-subsection-title">Fortalezas verificadas</h3>
          <ul className="ux-readiness-bullet-list">
            {FINANZAS_STRENGTHS.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Resueltos (2026-06-22)</h3>
          <ul className="ux-readiness-bullet-list">
            {FINANZAS_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Hallazgos abiertos</h3>
          {FINANZAS_OPEN.length === 0 ? (
            <p className="ui-readiness-section-desc">Sin hallazgos abiertos.</p>
          ) : (
            <ul className="ui-readiness-findings">
              {FINANZAS_OPEN.map((f, i) => (
                <li key={i} className="ui-readiness-finding space-audit-finding-open">
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

          <h3 className="ux-readiness-subsection-title">Plan de pruebas (layout)</h3>
          <ul className="ux-readiness-bullet-list">
            {FINANZAS_TEST_PLAN.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Transacciones — 4.2 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                CRUD principal de Finanzas. Auditoría: <code>space-audit/transacciones.md</code>{' '}
                (2026-06-22).{' '}
                <Link to="/finanzas/transacciones" className="ux-readiness-link">
                  Ver pantalla →
                </Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">4.2</span>
          </div>

          <div className="ui-readiness-dimensions" style={{ marginTop: 'var(--spacing-lg)' }}>
            {TRANSACCIONES_DIMENSIONS.map(d => (
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

          <h3 className="ux-readiness-subsection-title">Métricas de layout</h3>
          <div className="ux-readiness-metrics">
            {TRANSACCIONES_LAYOUT_METRICS.map(m => (
              <div
                key={m.label}
                className={`ux-readiness-metric ux-readiness-metric-${m.status}`}
              >
                <div className="ux-readiness-metric-value">{m.value}</div>
                <div className="ux-readiness-metric-label">{m.label}</div>
              </div>
            ))}
          </div>

          <h3 className="ux-readiness-subsection-title">Fortalezas verificadas</h3>
          <ul className="ux-readiness-bullet-list">
            {TRANSACCIONES_STRENGTHS.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Resueltos (2026-06-22)</h3>
          <ul className="ux-readiness-bullet-list">
            {TRANSACCIONES_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Hallazgos abiertos</h3>
          <ul className="ux-readiness-findings">
            {TRANSACCIONES_OPEN.map((f, i) => (
              <li key={i} className="ui-readiness-finding space-audit-finding-open">
                <span
                  className={`ui-readiness-finding-priority ui-readiness-finding-priority-${f.priority.toLowerCase()}`}
                >
                  {f.priority}
                </span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Plan de pruebas (layout)</h3>
          <ul className="ux-readiness-bullet-list">
            {TRANSACCIONES_TEST_PLAN.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Cuentas — 4.0 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                CRUD de cuentas bancarias. Auditoría: <code>space-audit/cuentas.md</code>{' '}
                (2026-06-22).{' '}
                <Link to="/finanzas/cuentas" className="ux-readiness-link">
                  Ver pantalla →
                </Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">4.0</span>
          </div>

          <div className="ui-readiness-dimensions" style={{ marginTop: 'var(--spacing-lg)' }}>
            {CUENTAS_DIMENSIONS.map(d => (
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

          <h3 className="ux-readiness-subsection-title">Métricas de layout</h3>
          <div className="ux-readiness-metrics">
            {CUENTAS_LAYOUT_METRICS.map(m => (
              <div
                key={m.label}
                className={`ux-readiness-metric ux-readiness-metric-${m.status}`}
              >
                <div className="ux-readiness-metric-value">{m.value}</div>
                <div className="ux-readiness-metric-label">{m.label}</div>
              </div>
            ))}
          </div>

          <h3 className="ux-readiness-subsection-title">Fortalezas verificadas</h3>
          <ul className="ux-readiness-bullet-list">
            {CUENTAS_STRENGTHS.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Resueltos (2026-06-22)</h3>
          <ul className="ux-readiness-bullet-list">
            {CUENTAS_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Hallazgos abiertos</h3>
          <ul className="ux-readiness-findings">
            {CUENTAS_OPEN.map((f, i) => (
              <li key={i} className="ui-readiness-finding space-audit-finding-open">
                <span
                  className={`ui-readiness-finding-priority ui-readiness-finding-priority-${f.priority.toLowerCase()}`}
                >
                  {f.priority}
                </span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Plan de pruebas (layout)</h3>
          <ul className="ux-readiness-bullet-list">
            {CUENTAS_TEST_PLAN.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Deudas — 3.9 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                CRUD de deudas y créditos. Auditoría: <code>space-audit/deudas.md</code>{' '}
                (2026-06-22).{' '}
                <Link to="/finanzas/deudas" className="ux-readiness-link">
                  Ver pantalla →
                </Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">3.9</span>
          </div>

          <div className="ui-readiness-dimensions" style={{ marginTop: 'var(--spacing-lg)' }}>
            {DEUDAS_DIMENSIONS.map(d => (
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

          <h3 className="ux-readiness-subsection-title">Métricas de layout</h3>
          <div className="ux-readiness-metrics">
            {DEUDAS_LAYOUT_METRICS.map(m => (
              <div
                key={m.label}
                className={`ux-readiness-metric ux-readiness-metric-${m.status}`}
              >
                <div className="ux-readiness-metric-value">{m.value}</div>
                <div className="ux-readiness-metric-label">{m.label}</div>
              </div>
            ))}
          </div>

          <h3 className="ux-readiness-subsection-title">Fortalezas verificadas</h3>
          <ul className="ux-readiness-bullet-list">
            {DEUDAS_STRENGTHS.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Resueltos (2026-06-22)</h3>
          <ul className="ux-readiness-bullet-list">
            {DEUDAS_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Hallazgos abiertos</h3>
          <ul className="ux-readiness-findings">
            {DEUDAS_OPEN.map((f, i) => (
              <li key={i} className="ui-readiness-finding space-audit-finding-open">
                <span
                  className={`ui-readiness-finding-priority ui-readiness-finding-priority-${f.priority.toLowerCase()}`}
                >
                  {f.priority}
                </span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Plan de pruebas (layout)</h3>
          <ul className="ux-readiness-bullet-list">
            {DEUDAS_TEST_PLAN.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Presupuestos — 4.0 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                CRUD de presupuestos. Auditoría: <code>space-audit/presupuestos.md</code>{' '}
                (2026-06-22).{' '}
                <Link to="/finanzas/presupuestos" className="ux-readiness-link">
                  Ver pantalla →
                </Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">4.0</span>
          </div>

          <div className="ui-readiness-dimensions" style={{ marginTop: 'var(--spacing-lg)' }}>
            {PRESUPUESTOS_DIMENSIONS.map(d => (
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

          <h3 className="ux-readiness-subsection-title">Métricas de layout</h3>
          <div className="ux-readiness-metrics">
            {PRESUPUESTOS_LAYOUT_METRICS.map(m => (
              <div
                key={m.label}
                className={`ux-readiness-metric ux-readiness-metric-${m.status}`}
              >
                <div className="ux-readiness-metric-value">{m.value}</div>
                <div className="ux-readiness-metric-label">{m.label}</div>
              </div>
            ))}
          </div>

          <h3 className="ux-readiness-subsection-title">Fortalezas verificadas</h3>
          <ul className="ux-readiness-bullet-list">
            {PRESUPUESTOS_STRENGTHS.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Resueltos (2026-06-22)</h3>
          <ul className="ux-readiness-bullet-list">
            {PRESUPUESTOS_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Hallazgos abiertos</h3>
          <ul className="ux-readiness-findings">
            {PRESUPUESTOS_OPEN.map((f, i) => (
              <li key={i} className="ui-readiness-finding space-audit-finding-open">
                <span
                  className={`ui-readiness-finding-priority ui-readiness-finding-priority-${f.priority.toLowerCase()}`}
                >
                  {f.priority}
                </span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Plan de pruebas (layout)</h3>
          <ul className="ux-readiness-bullet-list">
            {PRESUPUESTOS_TEST_PLAN.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Me Deben — 3.9 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                CRUD de personas que deben. Auditoría: <code>space-audit/me-deben.md</code>{' '}
                (2026-06-22).{' '}
                <Link to="/finanzas/me-deben" className="ux-readiness-link">
                  Ver pantalla →
                </Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">3.9</span>
          </div>

          <div className="ui-readiness-dimensions" style={{ marginTop: 'var(--spacing-lg)' }}>
            {ME_DEBEN_DIMENSIONS.map(d => (
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

          <h3 className="ux-readiness-subsection-title">Métricas de layout</h3>
          <div className="ux-readiness-metrics">
            {ME_DEBEN_LAYOUT_METRICS.map(m => (
              <div
                key={m.label}
                className={`ux-readiness-metric ux-readiness-metric-${m.status}`}
              >
                <div className="ux-readiness-metric-value">{m.value}</div>
                <div className="ux-readiness-metric-label">{m.label}</div>
              </div>
            ))}
          </div>

          <h3 className="ux-readiness-subsection-title">Fortalezas verificadas</h3>
          <ul className="ux-readiness-bullet-list">
            {ME_DEBEN_STRENGTHS.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Resueltos (2026-06-22)</h3>
          <ul className="ux-readiness-bullet-list">
            {ME_DEBEN_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Hallazgos abiertos</h3>
          <ul className="ux-readiness-findings">
            {ME_DEBEN_OPEN.map((f, i) => (
              <li key={i} className="ui-readiness-finding space-audit-finding-open">
                <span
                  className={`ui-readiness-finding-priority ui-readiness-finding-priority-${f.priority.toLowerCase()}`}
                >
                  {f.priority}
                </span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Plan de pruebas (layout)</h3>
          <ul className="ux-readiness-bullet-list">
            {ME_DEBEN_TEST_PLAN.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Tarjetas de crédito — 3.9 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                CRUD de tarjetas de crédito. Auditoría:{' '}
                <code>space-audit/tarjetas-credito.md</code> (2026-06-22).{' '}
                <Link to="/finanzas/tarjetas-credito" className="ux-readiness-link">
                  Ver pantalla →
                </Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">3.9</span>
          </div>

          <div className="ui-readiness-dimensions" style={{ marginTop: 'var(--spacing-lg)' }}>
            {TARJETAS_CREDITO_DIMENSIONS.map(d => (
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

          <h3 className="ux-readiness-subsection-title">Métricas de layout</h3>
          <div className="ux-readiness-metrics">
            {TARJETAS_CREDITO_LAYOUT_METRICS.map(m => (
              <div
                key={m.label}
                className={`ux-readiness-metric ux-readiness-metric-${m.status}`}
              >
                <div className="ux-readiness-metric-value">{m.value}</div>
                <div className="ux-readiness-metric-label">{m.label}</div>
              </div>
            ))}
          </div>

          <h3 className="ux-readiness-subsection-title">Fortalezas verificadas</h3>
          <ul className="ux-readiness-bullet-list">
            {TARJETAS_CREDITO_STRENGTHS.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Resueltos (2026-06-22)</h3>
          <ul className="ux-readiness-bullet-list">
            {TARJETAS_CREDITO_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Hallazgos abiertos</h3>
          <ul className="ux-readiness-findings">
            {TARJETAS_CREDITO_OPEN.map((f, i) => (
              <li key={i} className="ui-readiness-finding space-audit-finding-open">
                <span
                  className={`ui-readiness-finding-priority ui-readiness-finding-priority-${f.priority.toLowerCase()}`}
                >
                  {f.priority}
                </span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Plan de pruebas (layout)</h3>
          <ul className="ux-readiness-bullet-list">
            {TARJETAS_CREDITO_TEST_PLAN.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Tarjetas de débito — 4.0 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                CRUD de tarjetas de débito. Auditoría:{' '}
                <code>space-audit/tarjetas-debito.md</code> (2026-06-22).{' '}
                <Link to="/finanzas/tarjetas-debito" className="ux-readiness-link">
                  Ver pantalla →
                </Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">4.0</span>
          </div>

          <div className="ui-readiness-dimensions" style={{ marginTop: 'var(--spacing-lg)' }}>
            {TARJETAS_DEBITO_DIMENSIONS.map(d => (
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

          <h3 className="ux-readiness-subsection-title">Métricas de layout</h3>
          <div className="ux-readiness-metrics">
            {TARJETAS_DEBITO_LAYOUT_METRICS.map(m => (
              <div
                key={m.label}
                className={`ux-readiness-metric ux-readiness-metric-${m.status}`}
              >
                <div className="ux-readiness-metric-value">{m.value}</div>
                <div className="ux-readiness-metric-label">{m.label}</div>
              </div>
            ))}
          </div>

          <h3 className="ux-readiness-subsection-title">Fortalezas verificadas</h3>
          <ul className="ux-readiness-bullet-list">
            {TARJETAS_DEBITO_STRENGTHS.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Resueltos (2026-06-22)</h3>
          <ul className="ux-readiness-bullet-list">
            {TARJETAS_DEBITO_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Hallazgos abiertos</h3>
          <ul className="ux-readiness-findings">
            {TARJETAS_DEBITO_OPEN.map((f, i) => (
              <li key={i} className="ui-readiness-finding space-audit-finding-open">
                <span
                  className={`ui-readiness-finding-priority ui-readiness-finding-priority-${f.priority.toLowerCase()}`}
                >
                  {f.priority}
                </span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Plan de pruebas (layout)</h3>
          <ul className="ux-readiness-bullet-list">
            {TARJETAS_DEBITO_TEST_PLAN.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Subscripciones — 4.0 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                CRUD de subscripciones. Auditoría: <code>space-audit/subscripciones.md</code>{' '}
                (2026-06-22). Cierra sub-hub crédito.{' '}
                <Link to="/finanzas/subscripciones" className="ux-readiness-link">
                  Ver pantalla →
                </Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">4.0</span>
          </div>

          <div className="ui-readiness-dimensions" style={{ marginTop: 'var(--spacing-lg)' }}>
            {SUBSCRIPCIONES_DIMENSIONS.map(d => (
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

          <h3 className="ux-readiness-subsection-title">Métricas de layout</h3>
          <div className="ux-readiness-metrics">
            {SUBSCRIPCIONES_LAYOUT_METRICS.map(m => (
              <div
                key={m.label}
                className={`ux-readiness-metric ux-readiness-metric-${m.status}`}
              >
                <div className="ux-readiness-metric-value">{m.value}</div>
                <div className="ux-readiness-metric-label">{m.label}</div>
              </div>
            ))}
          </div>

          <h3 className="ux-readiness-subsection-title">Fortalezas verificadas</h3>
          <ul className="ux-readiness-bullet-list">
            {SUBSCRIPCIONES_STRENGTHS.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Resueltos (2026-06-22)</h3>
          <ul className="ux-readiness-bullet-list">
            {SUBSCRIPCIONES_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Hallazgos abiertos</h3>
          <ul className="ux-readiness-findings">
            {SUBSCRIPCIONES_OPEN.map((f, i) => (
              <li key={i} className="ui-readiness-finding space-audit-finding-open">
                <span
                  className={`ui-readiness-finding-priority ui-readiness-finding-priority-${f.priority.toLowerCase()}`}
                >
                  {f.priority}
                </span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Plan de pruebas (layout)</h3>
          <ul className="ux-readiness-bullet-list">
            {SUBSCRIPCIONES_TEST_PLAN.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">CDTs — 4.0 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                CRUD de certificados de depósito. Auditoría: <code>space-audit/cdts.md</code>{' '}
                (2026-06-22). Sub-hub ahorro.{' '}
                <Link to="/finanzas/cdts" className="ux-readiness-link">
                  Ver pantalla →
                </Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">4.0</span>
          </div>

          <div className="ui-readiness-dimensions" style={{ marginTop: 'var(--spacing-lg)' }}>
            {CDTS_DIMENSIONS.map(d => (
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

          <h3 className="ux-readiness-subsection-title">Métricas de layout</h3>
          <div className="ux-readiness-metrics">
            {CDTS_LAYOUT_METRICS.map(m => (
              <div
                key={m.label}
                className={`ux-readiness-metric ux-readiness-metric-${m.status}`}
              >
                <div className="ux-readiness-metric-value">{m.value}</div>
                <div className="ux-readiness-metric-label">{m.label}</div>
              </div>
            ))}
          </div>

          <h3 className="ux-readiness-subsection-title">Fortalezas verificadas</h3>
          <ul className="ux-readiness-bullet-list">
            {CDTS_STRENGTHS.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Resueltos (2026-06-22)</h3>
          <ul className="ux-readiness-bullet-list">
            {CDTS_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Hallazgos abiertos</h3>
          <ul className="ux-readiness-findings">
            {CDTS_OPEN.map((f, i) => (
              <li key={i} className="ui-readiness-finding space-audit-finding-open">
                <span
                  className={`ui-readiness-finding-priority ui-readiness-finding-priority-${f.priority.toLowerCase()}`}
                >
                  {f.priority}
                </span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Plan de pruebas (layout)</h3>
          <ul className="ux-readiness-bullet-list">
            {CDTS_TEST_PLAN.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Inflación — 3.8 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                Calculadora y contenido editorial. Auditoría: <code>space-audit/inflacion.md</code>{' '}
                (2026-06-22). Cierra sub-hub ahorro.{' '}
                <Link to="/finanzas/inflacion" className="ux-readiness-link">
                  Ver pantalla →
                </Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">3.8</span>
          </div>

          <div className="ui-readiness-dimensions" style={{ marginTop: 'var(--spacing-lg)' }}>
            {INFLACION_DIMENSIONS.map(d => (
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

          <h3 className="ux-readiness-subsection-title">Métricas de layout</h3>
          <div className="ux-readiness-metrics">
            {INFLACION_LAYOUT_METRICS.map(m => (
              <div
                key={m.label}
                className={`ux-readiness-metric ux-readiness-metric-${m.status}`}
              >
                <div className="ux-readiness-metric-value">{m.value}</div>
                <div className="ux-readiness-metric-label">{m.label}</div>
              </div>
            ))}
          </div>

          <h3 className="ux-readiness-subsection-title">Fortalezas verificadas</h3>
          <ul className="ux-readiness-bullet-list">
            {INFLACION_STRENGTHS.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Resueltos (2026-06-22)</h3>
          <ul className="ux-readiness-bullet-list">
            {INFLACION_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Hallazgos abiertos</h3>
          <ul className="ux-readiness-findings">
            {INFLACION_OPEN.map((f, i) => (
              <li key={i} className="ui-readiness-finding space-audit-finding-open">
                <span
                  className={`ui-readiness-finding-priority ui-readiness-finding-priority-${f.priority.toLowerCase()}`}
                >
                  {f.priority}
                </span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>

          <h3 className="ux-readiness-subsection-title">Plan de pruebas (layout)</h3>
          <ul className="ux-readiness-bullet-list">
            {INFLACION_TEST_PLAN.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Cripto Wallet — 4.0 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                CRUD de wallets. Auditoría: <code>space-audit/cripto-wallet.md</code> (2026-06-22).{' '}
                <Link to="/finanzas/cripto-wallet" className="ux-readiness-link">
                  Ver pantalla →
                </Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">4.0</span>
          </div>
          <div className="ui-readiness-dimensions" style={{ marginTop: 'var(--spacing-lg)' }}>
            {CRIPTO_WALLET_DIMENSIONS.map(d => (
              <div key={d.label} className="ui-readiness-dimension">
                <div className="ui-readiness-dimension-label">{d.label}</div>
                <div className="ui-readiness-dimension-score">{d.score}</div>
                <div className="ui-readiness-dimension-bar">
                  <div className="ui-readiness-dimension-bar-fill" style={{ width: `${(d.score / 5) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <h3 className="ux-readiness-subsection-title">Métricas de layout</h3>
          <div className="ux-readiness-metrics">
            {CRIPTO_WALLET_LAYOUT_METRICS.map(m => (
              <div key={m.label} className={`ux-readiness-metric ux-readiness-metric-${m.status}`}>
                <div className="ux-readiness-metric-value">{m.value}</div>
                <div className="ux-readiness-metric-label">{m.label}</div>
              </div>
            ))}
          </div>
          <h3 className="ux-readiness-subsection-title">Fortalezas verificadas</h3>
          <ul className="ux-readiness-bullet-list">
            {CRIPTO_WALLET_STRENGTHS.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3 className="ux-readiness-subsection-title">Resueltos (2026-06-22)</h3>
          <ul className="ux-readiness-bullet-list">
            {CRIPTO_WALLET_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3 className="ux-readiness-subsection-title">Plan de pruebas (layout)</h3>
          <ul className="ux-readiness-bullet-list">
            {CRIPTO_WALLET_TEST_PLAN.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Mi Cripto — 3.9 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                Posiciones y movimientos. Auditoría: <code>space-audit/cripto-transacciones.md</code>{' '}
                <Link to="/finanzas/cripto-transacciones" className="ux-readiness-link">
                  Ver pantalla →
                </Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">3.9</span>
          </div>
          <div className="ui-readiness-dimensions" style={{ marginTop: 'var(--spacing-lg)' }}>
            {CRIPTO_TRANSACCIONES_DIMENSIONS.map(d => (
              <div key={d.label} className="ui-readiness-dimension">
                <div className="ui-readiness-dimension-label">{d.label}</div>
                <div className="ui-readiness-dimension-score">{d.score}</div>
                <div className="ui-readiness-dimension-bar">
                  <div className="ui-readiness-dimension-bar-fill" style={{ width: `${(d.score / 5) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <h3 className="ux-readiness-subsection-title">Hallazgos abiertos</h3>
          <ul className="ux-readiness-findings">
            {CRIPTO_TRANSACCIONES_OPEN.map((f, i) => (
              <li key={i} className="ui-readiness-finding space-audit-finding-open">
                <span className={`ui-readiness-finding-priority ui-readiness-finding-priority-${f.priority.toLowerCase()}`}>
                  {f.priority}
                </span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
          <h3 className="ux-readiness-subsection-title">Resueltos (2026-06-22)</h3>
          <ul className="ux-readiness-bullet-list">
            {CRIPTO_TRANSACCIONES_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Vendedores cripto — 3.7 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                Formulario + lista. Auditoría: <code>space-audit/crypto-vendors.md</code>. Cierra sub-hub cripto.{' '}
                <Link to="/finanzas/crypto-vendors" className="ux-readiness-link">
                  Ver pantalla →
                </Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">3.7</span>
          </div>
          <div className="ui-readiness-dimensions" style={{ marginTop: 'var(--spacing-lg)' }}>
            {CRYPTO_VENDORS_DIMENSIONS.map(d => (
              <div key={d.label} className="ui-readiness-dimension">
                <div className="ui-readiness-dimension-label">{d.label}</div>
                <div className="ui-readiness-dimension-score">{d.score}</div>
                <div className="ui-readiness-dimension-bar">
                  <div className="ui-readiness-dimension-bar-fill" style={{ width: `${(d.score / 5) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <h3 className="ux-readiness-subsection-title">Hallazgos abiertos</h3>
          <ul className="ux-readiness-findings">
            {CRYPTO_VENDORS_OPEN.map((f, i) => (
              <li key={i} className="ui-readiness-finding space-audit-finding-open">
                <span className={`ui-readiness-finding-priority ui-readiness-finding-priority-${f.priority.toLowerCase()}`}>
                  {f.priority}
                </span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
          <h3 className="ux-readiness-subsection-title">Resueltos (2026-06-22)</h3>
          <ul className="ux-readiness-bullet-list">
            {CRYPTO_VENDORS_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Proyectos — 4.0 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                Proyectos de ahorro. <code>space-audit/proyectos.md</code>{' '}
                <Link to="/finanzas/proyectos" className="ux-readiness-link">Ver →</Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">4.0</span>
          </div>
          <ul className="ux-readiness-bullet-list" style={{ marginTop: 'var(--spacing-lg)' }}>
            {PROYECTOS_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Listas de mercado — 4.0 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                Lista de compras. <code>space-audit/listas-mercado.md</code>{' '}
                <Link to="/finanzas/listas-mercado" className="ux-readiness-link">Ver →</Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">4.0</span>
          </div>
          <ul className="ux-readiness-bullet-list" style={{ marginTop: 'var(--spacing-lg)' }}>
            {LISTAS_MERCADO_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Diseñador presupuestos — 3.8 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                Cierra pantallas sueltas Finanzas. <code>space-audit/disenador-presupuestos.md</code>{' '}
                <Link to="/finanzas/diseñador-presupuestos" className="ux-readiness-link">Ver →</Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">3.8</span>
          </div>
          <h3 className="ux-readiness-subsection-title">Resueltos (2026-06-22)</h3>
          <ul className="ux-readiness-bullet-list">
            {DISENADOR_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3 className="ux-readiness-subsection-title">Hallazgos abiertos</h3>
          <ul className="ux-readiness-findings">
            {DISENADOR_OPEN.map((f, i) => (
              <li key={i} className="ui-readiness-finding space-audit-finding-open">
                <span className={`ui-readiness-finding-priority ui-readiness-finding-priority-${f.priority.toLowerCase()}`}>
                  {f.priority}
                </span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Utilidades (Registros) — 3.8 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                Hub de utilidades. <code>space-audit/registros.md</code>{' '}
                <Link to="/registros" className="ux-readiness-link">Ver →</Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">3.8</span>
          </div>
          <ul className="ux-readiness-bullet-list" style={{ marginTop: 'var(--spacing-lg)' }}>
            {REGISTROS_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Registros — CRUD y herramientas</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                6 CRUD + 2 herramientas. Docs: cuadernos, secretos, archivos, empleados, vehículos, patrimonio, calculadora, generador-contrasenas.
              </p>
            </div>
            <span className="ux-readiness-login-score">3.9</span>
          </div>
          <h3 className="ux-readiness-subsection-title">CRUD resueltos (2026-06-22)</h3>
          <ul className="ux-readiness-bullet-list">
            {REGISTROS_CRUD_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3 className="ux-readiness-subsection-title">Herramientas</h3>
          <ul className="ux-readiness-bullet-list">
            {REGISTROS_TOOLS_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Trabajo — 3.9 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                Hub + Contratos + Actividades. <code>space-audit/trabajo.md</code>{' '}
                <Link to="/trabajo" className="ux-readiness-link">Ver →</Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">3.9</span>
          </div>
          <ul className="ux-readiness-bullet-list" style={{ marginTop: 'var(--spacing-lg)' }}>
            {TRABAJO_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Lifestyle (Tiempo) — 3.9 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                Hub + 4 pantallas. <code>space-audit/tiempo.md</code>{' '}
                <Link to="/tiempo" className="ux-readiness-link">Ver →</Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">3.9</span>
          </div>
          <ul className="ux-readiness-bullet-list" style={{ marginTop: 'var(--spacing-lg)' }}>
            {TIEMPO_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Ajustes — 4.0 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                Hub de configuración. <code>space-audit/ajustes.md</code>{' '}
                <Link to="/ajustes" className="ux-readiness-link">Ver →</Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">4.0</span>
          </div>
          <ul className="ux-readiness-bullet-list" style={{ marginTop: 'var(--spacing-lg)' }}>
            {AJUSTES_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Justicia — 3.9 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                Hub + Procesos judiciales. <code>space-audit/justicia.md</code>,{' '}
                <code>procesos.md</code>{' '}
                <Link to="/justicia" className="ux-readiness-link">Ver →</Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">3.9</span>
          </div>
          <ul className="ux-readiness-bullet-list" style={{ marginTop: 'var(--spacing-lg)' }}>
            {JUSTICIA_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section ux-readiness-login-section">
          <div className="ux-readiness-login-header">
            <div>
              <h2 className="ui-readiness-section-title">Notificaciones — 4.0 / 5</h2>
              <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
                Bandeja de alertas. <code>space-audit/notificaciones.md</code>{' '}
                <Link to="/notificaciones" className="ux-readiness-link">Ver →</Link>
              </p>
            </div>
            <span className="ux-readiness-login-score">4.0</span>
          </div>
          <ul className="ux-readiness-bullet-list" style={{ marginTop: 'var(--spacing-lg)' }}>
            {NOTIFICACIONES_RESOLVED.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ui-readiness-section">
          <ul className="ui-readiness-findings">
            {FINDINGS.map((f, i) => (
              <li
                key={i}
                className={`ui-readiness-finding ${!f.done ? 'space-audit-finding-open' : ''}`}
              >
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
          <h2 className="ui-readiness-section-title">Diagnóstico en una frase</h2>
          <p className="ui-readiness-section-desc" style={{ marginBottom: 0 }}>
            Mucho glass y padding, poca señal sobre qué hacer primero; los números y las listas
            cambian de forma según la pantalla aunque el contenido sea el mismo tipo de dato.
            Priorizar: <strong>CTA visible</strong>, <strong>summary unificado</strong>,{' '}
            <strong>una sola fila de lista</strong>, <strong>menos chrome vertical</strong>.
          </p>
        </section>
      </div>
    </div>
  )
}

export default SpaceAudit
