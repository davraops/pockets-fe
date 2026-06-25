import type { Page, Route } from '@playwright/test'

/** Minimal Rama Judicial search payload for UI smoke tests (no live API). */
export const MOCK_JUDICIAL_SEARCH_RESPONSE = {
  procesos: [
    {
      idProceso: 900100200,
      idConexion: 1,
      llaveProceso: '11001-E2E-2026-00001-00',
      fechaProceso: '2024-01-15',
      fechaUltimaActuacion: new Date().toISOString().slice(0, 10),
      despacho: 'Juzgado E2E Smoke',
      departamento: 'BOGOTA',
      sujetosProcesales: 'Demandante: E2E Test User|Demandado: Empresa Demo',
      esPrivado: false,
      cantFilas: 1,
    },
  ],
  paginacion: {
    pagina: 1,
    totalPaginas: 1,
    totalRegistros: 1,
  },
}

export const MOCK_JUDICIAL_TRACKING_RESPONSE = {
  tracking: [],
}

export const MOCK_JUDICIAL_ACTUACIONES_RESPONSE = {
  actuaciones: [
    {
      idRegActuacion: 1,
      consActuacion: 1,
      fechaActuacion: new Date().toISOString().slice(0, 10),
      actuacion: 'Auto admite demanda',
      anotacion: 'E2E fixture',
      fechaInicial: null,
      fechaFinal: null,
      fechaRegistro: new Date().toISOString(),
      conDocumentos: false,
    },
  ],
  paginacion: {
    pagina: 1,
    totalPaginas: 1,
  },
}

function jsonRoute(body: unknown) {
  return (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  }
}

/**
 * Intercepts lifestyle judicial endpoints so Procesos smoke never hits Rama Judicial.
 * Also stubs user full name so the page can query without Ajustes setup.
 */
export async function setupJudicialMocks(page: Page): Promise<void> {
  await page.route('**/api/core/user-details**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user_details: { nombre_completo: 'E2E Test User' },
      }),
    })
  })

  await page.route('**/api/lifestyle/judicial-processes/tracking**', jsonRoute(MOCK_JUDICIAL_TRACKING_RESPONSE))
  await page.route('**/api/lifestyle/judicial-processes/*/actuaciones**', jsonRoute(MOCK_JUDICIAL_ACTUACIONES_RESPONSE))
  await page.route('**/api/lifestyle/judicial-processes?**', jsonRoute(MOCK_JUDICIAL_SEARCH_RESPONSE))
}
