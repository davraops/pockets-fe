import { api } from '../services/api'

const CACHE_TTL_MS = 5 * 60 * 1000

export type ProcesoBadge = 'Negado' | 'Rechazado' | null

export interface JudicialActuacionAPI {
  idRegActuacion: number
  llaveProceso: string
  consActuacion: number
  fechaActuacion: string
  actuacion: string
  anotacion: string | null
  fechaInicial: string | null
  fechaFinal: string | null
  fechaRegistro: string
  codRegla: string
  conDocumentos: boolean
  cant: number
}

const actuacionesCache = new Map<
  string,
  { actuaciones: JudicialActuacionAPI[]; fetchedAt: number }
>()

export function detectProcesoBadge(
  actuaciones: Array<{ actuacion?: string; anotacion?: string | null }>
): ProcesoBadge {
  let badge: ProcesoBadge = null

  for (const act of actuaciones) {
    const actuacionText = `${act.actuacion || ''} ${act.anotacion || ''}`.toLowerCase()

    if (
      actuacionText.includes('auto rechaza demanda') ||
      actuacionText.includes('auto rechaza') ||
      (act.actuacion?.toLowerCase().includes('auto') &&
        act.actuacion?.toLowerCase().includes('rechaza') &&
        act.actuacion?.toLowerCase().includes('demanda'))
    ) {
      return 'Rechazado'
    }

    if (actuacionText.includes('rechaza') || actuacionText.includes('rechazo')) {
      badge = 'Rechazado'
    }

    if ((actuacionText.includes('niega') || actuacionText.includes('deneg')) && !badge) {
      badge = 'Negado'
    }
  }

  return badge
}

export async function fetchProcessActuaciones(
  idProceso: number,
  pagina = 1,
  options?: { bypassCache?: boolean }
): Promise<JudicialActuacionAPI[]> {
  const cacheKey = `${idProceso}:${pagina}`
  const cached = actuacionesCache.get(cacheKey)

  if (!options?.bypassCache && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.actuaciones
  }

  const response = await api.getProcessActuaciones(idProceso, pagina)
  const actuaciones: JudicialActuacionAPI[] = Array.isArray(response.actuaciones)
    ? response.actuaciones
    : []

  actuacionesCache.set(cacheKey, { actuaciones, fetchedAt: Date.now() })
  return actuaciones
}
