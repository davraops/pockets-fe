const ROUTE_TITLES: Record<string, string> = {
  '/finanzas': 'Finanzas',
  '/finanzas/credito': 'Crédito y pagos',
  '/finanzas/cripto': 'Criptomonedas',
  '/finanzas/ahorro': 'Ahorro e inflación',
  '/finanzas/cuentas': 'Cuentas',
  '/finanzas/presupuestos': 'Presupuestos',
  '/finanzas/diseñador-presupuestos': 'Diseñador de Presupuestos',
  '/finanzas/listas-mercado': 'Listas de Mercado',
  '/finanzas/crypto-vendors': 'Vendedores de Cripto',
  '/finanzas/transacciones': 'Transacciones',
  '/finanzas/deudas': 'Deudas',
  '/finanzas/tarjetas-debito': 'Tarjetas Débito',
  '/finanzas/subscripciones': 'Subscripciones',
  '/finanzas/tarjetas-credito': 'Tarjetas Crédito',
  '/finanzas/proyectos': 'Proyectos',
  '/finanzas/me-deben': 'Me Deben',
  '/finanzas/cripto-wallet': 'Cripto Wallet',
  '/finanzas/cripto-transacciones': 'Mi Cripto',
  '/finanzas/inflacion': 'Inflación',
  '/finanzas/cdts': 'CDTs',
  '/registros': 'Utilidades',
  '/registros/cuadernos': 'Cuadernos',
  '/registros/secretos': 'Secretos',
  '/registros/generador-contrasenas': 'Generador de Contraseñas',
  '/registros/calculadora': 'Calculadora',
  '/registros/archivos': 'Archivos',
  '/registros/empleados': 'Empleados',
  '/registros/vehiculos': 'Vehículos',
  '/registros/patrimonio': 'Patrimonio',
  '/tiempo': 'Lifestyle',
  '/tiempo/fechas': 'Fechas',
  '/tiempo/rutinas': 'Rutinas',
  '/tiempo/mi-dia': 'Mi Día',
  '/tiempo/mi-diario': 'Mi Diario',
  '/notificaciones': 'Notificaciones',
  '/justicia': 'Justicia',
  '/justicia/procesos': 'Procesos',
  '/trabajo': 'Trabajo',
  '/trabajo/contratos': 'Contratos',
  '/trabajo/actividades': 'Actividades',
  '/trabajo/procesos': 'Procesos de contratación',
  '/ajustes': 'Ajustes',
  '/ui-readiness': 'UI Readiness',
  '/ux-readiness': 'UX Readiness',
  '/product-readiness': 'Product Readiness',
  '/space-audit': 'Space Audit',
  '/blank-2': '',
  '/blank-3': '',
  '/blank-4': '',
  '/blank-5': '',
  '/blank-6': '',
  '/blank-7': '',
  '/blank-8': '',
  '/blank-9': '',
  '/blank-10': '',
  '/blank-11': '',
  '/blank-12': '',
}

const SEGMENT_LABELS: Record<string, string> = {
  credito: 'Crédito y pagos',
  cripto: 'Criptomonedas',
  ahorro: 'Ahorro e inflación',
  cdts: 'CDTs',
  inflacion: 'Inflación',
  'cripto-wallet': 'Cripto Wallet',
  'cripto-transacciones': 'Mi Cripto',
  'crypto-vendors': 'Vendedores de Cripto',
  'listas-mercado': 'Listas de Mercado',
  'diseñador-presupuestos': 'Diseñador de Presupuestos',
  'tarjetas-debito': 'Tarjetas Débito',
  'tarjetas-credito': 'Tarjetas Crédito',
  'me-deben': 'Me Deben',
  'generador-contrasenas': 'Generador de Contraseñas',
  'mi-dia': 'Mi Día',
  'mi-diario': 'Mi Diario',
  'ui-readiness': 'UI Readiness',
  'ux-readiness': 'UX Readiness',
  'product-readiness': 'Product Readiness',
  'space-audit': 'Space Audit',
}

function titleCaseFromSegment(segment: string): string {
  return segment
    .split('-')
    .map(word => {
      if (word === 'cdt' || word === 'cdts') return 'CDTs'
      if (word === 'crypto') return 'Cripto'
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

const DYNAMIC_ROUTE_PREFIX_TITLES: Array<{ prefix: string; title: string }> = [
  { prefix: '/registros/cuadernos/', title: 'Cuadernos' },
  { prefix: '/product-readiness/', title: 'Product Readiness' },
]

function getDynamicRouteTitle(pathname: string): string | undefined {
  for (const { prefix, title } of DYNAMIC_ROUTE_PREFIX_TITLES) {
    if (pathname.startsWith(prefix) && pathname.length > prefix.length) {
      return title
    }
  }
  return undefined
}

/**
 * Resuelve el título de página: mapa explícito primero, rutas dinámicas, derivación por ruta como fallback.
 */
export function getRouteTitle(pathname: string): string {
  const explicit = ROUTE_TITLES[pathname]
  if (explicit !== undefined) {
    return explicit
  }

  const dynamic = getDynamicRouteTitle(pathname)
  if (dynamic !== undefined) {
    return dynamic
  }

  if (pathname === '/' || pathname === '/login') {
    return ''
  }

  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) {
    return ''
  }

  const lastSegment = segments[segments.length - 1]
  if (SEGMENT_LABELS[lastSegment]) {
    return SEGMENT_LABELS[lastSegment]
  }

  return titleCaseFromSegment(lastSegment)
}
