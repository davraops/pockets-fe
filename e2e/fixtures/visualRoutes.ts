import { expect, type Page } from '@playwright/test'
import { setupJudicialMocks } from './judicialMocks'
import type { VisualRoute } from './visual'

function readyButton(name: string | RegExp) {
  return async (page: Page) => {
    await expect(page.getByRole('button', { name })).toBeVisible({ timeout: 20_000 })
  }
}

function readyFirstButton(name: string | RegExp) {
  return async (page: Page) => {
    await expect(page.getByRole('button', { name }).first()).toBeVisible({ timeout: 20_000 })
  }
}

function readyHeading(name: string | RegExp, level: 1 | 2 = 1) {
  return async (page: Page) => {
    await expect(page.getByRole('heading', { name, level })).toBeVisible({ timeout: 20_000 })
  }
}

function readyLocator(selector: string) {
  return async (page: Page) => {
    await expect(page.locator(selector)).toBeVisible({ timeout: 20_000 })
  }
}

function readyLabel(label: string) {
  return async (page: Page) => {
    await expect(page.getByLabel(label)).toBeVisible({ timeout: 20_000 })
  }
}

function readyRegion(name: string) {
  return async (page: Page) => {
    await expect(page.getByRole('region', { name })).toBeVisible({ timeout: 20_000 })
  }
}

const CRUD_LIST_MASKS = ['.crud-summary-strip', '.glass-group', '.utilidades-sub-meta']

function crudRoute(
  id: string,
  path: string,
  cta: string | RegExp,
  extraMasks: string[] = []
): VisualRoute {
  return {
    id,
    path,
    auth: true,
    fullPage: false,
    extraMaskSelectors: [...CRUD_LIST_MASKS, ...extraMasks],
    ready: readyButton(cta),
  }
}

/**
 * All user-facing routes for visual regression (excludes blank placeholders and
 * dynamic paths like /registros/cuadernos/:noteId).
 */
export const VISUAL_ROUTES: VisualRoute[] = [
  // — Auth & home —
  {
    id: 'login',
    path: '/login',
    auth: false,
    ready: readyHeading(/Pockets.*Iniciar sesión/i),
  },
  {
    id: 'home',
    path: '/',
    auth: true,
    fullPage: false,
    ready: async page => {
      await expect(page.getByRole('navigation', { name: 'Navegación por secciones' })).toBeVisible({
        timeout: 20_000,
      })
    },
  },

  // — Finanzas hub & section hubs —
  {
    id: 'finanzas-hub',
    path: '/finanzas',
    auth: true,
    ready: readyLocator('.finanzas-dashboard'),
  },
  {
    id: 'finanzas-credito',
    path: '/finanzas/credito',
    auth: true,
    ready: readyHeading('Crédito y pagos'),
  },
  {
    id: 'finanzas-cripto',
    path: '/finanzas/cripto',
    auth: true,
    ready: readyHeading('Criptomonedas'),
  },
  {
    id: 'finanzas-ahorro',
    path: '/finanzas/ahorro',
    auth: true,
    ready: readyHeading('Ahorro e inflación'),
  },

  // — Finanzas CRUD & tools —
  crudRoute('transacciones', '/finanzas/transacciones', 'Agregar transacción'),
  {
    id: 'cuentas',
    path: '/finanzas/cuentas',
    auth: true,
    fullPage: false,
    extraMaskSelectors: ['.cuentas-hub-meta', '.cuentas-balance-hero', '.cuentas-accounts-list'],
    ready: readyButton('Agregar cuenta bancaria'),
  },
  crudRoute('presupuestos', '/finanzas/presupuestos', 'Agregar presupuesto'),
  crudRoute('deudas', '/finanzas/deudas', 'Agregar deuda'),
  crudRoute('tarjetas-credito', '/finanzas/tarjetas-credito', 'Agregar tarjeta'),
  crudRoute('tarjetas-debito', '/finanzas/tarjetas-debito', 'Agregar tarjeta'),
  crudRoute('subscripciones', '/finanzas/subscripciones', 'Agregar subscripción'),
  crudRoute('proyectos', '/finanzas/proyectos', 'Agregar proyecto'),
  crudRoute('me-deben', '/finanzas/me-deben', 'Agregar deudor'),
  crudRoute('cdts', '/finanzas/cdts', 'Agregar CDT'),
  crudRoute('cripto-wallet', '/finanzas/cripto-wallet', 'Agregar wallet'),
  crudRoute('cripto-transacciones', '/finanzas/cripto-transacciones', 'Agregar transacción'),
  crudRoute('listas-mercado', '/finanzas/listas-mercado', 'Agregar producto'),
  {
    id: 'inflacion',
    path: '/finanzas/inflacion',
    auth: true,
    fullPage: false,
    ready: readyHeading('Inflación'),
  },
  {
    id: 'disenador-presupuestos',
    path: '/finanzas/diseñador-presupuestos',
    auth: true,
    fullPage: false,
    extraMaskSelectors: ['.glass-group'],
    ready: readyHeading('Diseñador de Presupuestos'),
  },
  {
    id: 'crypto-vendors',
    path: '/finanzas/crypto-vendors',
    auth: true,
    fullPage: false,
    extraMaskSelectors: ['.glass-group'],
    ready: readyHeading('Vendedores de Cripto'),
  },

  // — Registros hub & modules —
  {
    id: 'registros-hub',
    path: '/registros',
    auth: true,
    ready: readyHeading(/Utilidades/),
  },
  {
    id: 'cuadernos',
    path: '/registros/cuadernos',
    auth: true,
    fullPage: false,
    extraMaskSelectors: ['.cuaderno-sidebar', '.cuaderno-workspace', '.utilidades-sub-meta'],
    ready: readyFirstButton('Nuevo cuaderno'),
  },
  crudRoute('secretos', '/registros/secretos', 'Agregar secreto'),
  {
    id: 'generador-contrasenas',
    path: '/registros/generador-contrasenas',
    auth: true,
    fullPage: false,
    extraMaskSelectors: ['[aria-label="Contraseña generada"]'],
    ready: readyHeading('Generador de contraseñas', 2),
  },
  {
    id: 'calculadora',
    path: '/registros/calculadora',
    auth: true,
    fullPage: false,
    extraMaskSelectors: ['.calculadora-display-value'],
    ready: readyHeading(/Calculadora/),
  },
  crudRoute('archivos', '/registros/archivos', 'Subir archivo'),
  {
    id: 'empleados',
    path: '/registros/empleados',
    auth: true,
    fullPage: false,
    extraMaskSelectors: ['.crud-summary-strip', '.empleados-list', '.utilidades-sub-meta'],
    ready: readyButton('Agregar empleado'),
  },
  crudRoute('vehiculos', '/registros/vehiculos', 'Agregar vehículo'),
  crudRoute('patrimonio', '/registros/patrimonio', 'Agregar ítem'),

  // — Tiempo hub & modules —
  {
    id: 'tiempo-hub',
    path: '/tiempo',
    auth: true,
    ready: readyLocator('.tiempo-dashboard'),
  },
  {
    id: 'fechas',
    path: '/tiempo/fechas',
    auth: true,
    fullPage: false,
    extraMaskSelectors: ['.fechas-calendar-container', '.fechas-event-grid', '.glass-group'],
    ready: readyButton('Agregar evento'),
  },
  {
    id: 'rutinas',
    path: '/tiempo/rutinas',
    auth: true,
    fullPage: false,
    extraMaskSelectors: CRUD_LIST_MASKS,
    ready: readyFirstButton('Agregar rutina'),
  },
  {
    id: 'mi-dia',
    path: '/tiempo/mi-dia',
    auth: true,
    fullPage: false,
    extraMaskSelectors: ['.glass-group'],
    ready: readyRegion('Rutinas de hoy'),
  },
  {
    id: 'mi-diario',
    path: '/tiempo/mi-diario',
    auth: true,
    fullPage: false,
    extraMaskSelectors: ['.midiario-card-list', '.glass-group'],
    ready: readyFirstButton('Nueva entrada'),
  },
  {
    id: 'metas',
    path: '/tiempo/metas',
    auth: true,
    fullPage: false,
    extraMaskSelectors: ['.metas-goal-list', '.glass-group', '.crud-summary-strip'],
    ready: readyButton('Nueva meta'),
  },
  {
    id: 'valores',
    path: '/tiempo/valores',
    auth: true,
    fullPage: false,
    extraMaskSelectors: ['.valores-grid', '.glass-group'],
    ready: readyButton('Nuevo valor'),
  },

  // — Notificaciones —
  {
    id: 'notificaciones',
    path: '/notificaciones',
    auth: true,
    fullPage: false,
    extraMaskSelectors: ['.glass-group', '.crud-summary-strip'],
    ready: readyHeading('Notificaciones'),
  },

  // — Justicia (mocked API) —
  {
    id: 'justicia-hub',
    path: '/justicia',
    auth: true,
    ready: readyButton(/Ir a Procesos/i),
  },
  {
    id: 'justicia-procesos',
    path: '/justicia/procesos',
    auth: true,
    fullPage: false,
    extraMaskSelectors: ['.glass-group', '.procesos-list'],
    setupBefore: setupJudicialMocks,
    ready: readyRegion('Resumen de procesos'),
  },

  // — Trabajo hub & modules —
  {
    id: 'trabajo-hub',
    path: '/trabajo',
    auth: true,
    ready: readyLocator('.trabajo-dashboard'),
  },
  crudRoute('contratos', '/trabajo/contratos', 'Crear contrato'),
  {
    id: 'actividades',
    path: '/trabajo/actividades',
    auth: true,
    fullPage: false,
    extraMaskSelectors: ['.actividad-kanban-board-wrapper', '.crud-summary-strip'],
    ready: readyButton('Crear actividad'),
  },
  {
    id: 'procesos-contratacion',
    path: '/trabajo/procesos',
    auth: true,
    fullPage: false,
    extraMaskSelectors: ['.procesos-contratacion-list', '.glass-group'],
    ready: readyRegion('Resumen de procesos de contratación'),
  },

  // — Ajustes —
  {
    id: 'ajustes',
    path: '/ajustes',
    auth: true,
    ready: readyLabel('Resumen de ajustes'),
  },

  // — Internal audit / docs (static layout) —
  {
    id: 'ui-readiness',
    path: '/ui-readiness',
    auth: true,
    fullPage: false,
    ready: readyHeading('UI Readiness'),
  },
  {
    id: 'ux-readiness',
    path: '/ux-readiness',
    auth: true,
    fullPage: false,
    ready: readyHeading('UX Readiness'),
  },
  {
    id: 'space-audit',
    path: '/space-audit',
    auth: true,
    fullPage: false,
    ready: readyHeading('Space Audit'),
  },
  {
    id: 'product-readiness',
    path: '/product-readiness',
    auth: true,
    fullPage: false,
    ready: async page => {
      await expect(page.getByRole('heading', { name: 'Auditorías', level: 2 })).toBeVisible({
        timeout: 20_000,
      })
    },
  },
  {
    id: 'e2e',
    path: '/e2e',
    auth: true,
    fullPage: false,
    ready: readyHeading('E2E Flows'),
  },
]
