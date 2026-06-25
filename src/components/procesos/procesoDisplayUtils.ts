import type { Proceso, ProcesoAPI, ProcesoFilter, ProcesoParty } from './procesoTypes'

export function normalizeForMatch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseSujetosProcesales(
  sujetos: string,
  userFullName?: string
): { parties: ProcesoParty[]; userRoles: string[] } {
  if (!sujetos?.trim()) {
    return { parties: [], userRoles: [] }
  }

  const parties: ProcesoParty[] = sujetos
    .split('|')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const colonIndex = part.indexOf(':')
      if (colonIndex === -1) {
        return { role: 'Parte', names: part }
      }
      return {
        role: part.slice(0, colonIndex).trim(),
        names: part.slice(colonIndex + 1).trim(),
      }
    })

  const userRoles: string[] = []
  if (userFullName?.trim()) {
    const normalizedUser = normalizeForMatch(userFullName)
    const userTokens = normalizedUser.split(' ').filter(token => token.length > 2)

    for (const party of parties) {
      const normalizedNames = normalizeForMatch(party.names)
      const matchesUser =
        normalizedNames.includes(normalizedUser) ||
        userTokens.filter(token => normalizedNames.includes(token)).length >= 2

      if (matchesUser) {
        userRoles.push(party.role)
      }
    }
  }

  return { parties, userRoles }
}

export function computeEstadoFromLastActuacion(fechaUltimaActuacion: string): string {
  const dias = daysSince(fechaUltimaActuacion)
  if (dias > 365) return 'Archivado'
  if (dias > 180) return 'Suspendido'
  return 'En trámite'
}

export function daysSince(dateString: string): number {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 0
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return Math.floor((hoy.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

export function formatRelativeDate(dateString: string): string {
  const dias = daysSince(dateString)
  if (dias === 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 0) return 'fecha futura'
  if (dias < 30) return `hace ${dias} días`
  if (dias < 365) {
    const meses = Math.floor(dias / 30)
    return meses === 1 ? 'hace 1 mes' : `hace ${meses} meses`
  }
  const años = Math.floor(dias / 365)
  return años === 1 ? 'hace 1 año' : `hace ${años} años`
}

export function formatProcesoDate(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function getEstadoColor(estado: string): string {
  switch (estado.toLowerCase()) {
    case 'activo':
    case 'en trámite':
      return '#007AFF'
    case 'cerrado':
    case 'resuelto':
      return '#34C759'
    case 'suspendido':
      return '#FF9500'
    case 'archivado':
      return '#8E8E93'
    default:
      return '#5856D6'
  }
}

export function filterProcesos(
  procesos: Proceso[],
  options: { filter: ProcesoFilter; query: string }
): Proceso[] {
  const normalizedQuery = normalizeForMatch(options.query)

  return procesos.filter(proceso => {
    if (options.filter === 'tracked' && !proceso.isTracked) return false
    if (options.filter === 'tramite' && proceso.estado !== 'En trámite') return false
    if (
      options.filter === 'inactivos' &&
      proceso.estado !== 'Suspendido' &&
      proceso.estado !== 'Archivado'
    ) {
      return false
    }

    if (!normalizedQuery) return true

    const haystack = normalizeForMatch(
      [
        proceso.numero,
        proceso.despacho,
        proceso.departamento,
        proceso.sujetosProcesales,
        proceso.userRoles?.join(' '),
      ]
        .filter(Boolean)
        .join(' ')
    )

    return haystack.includes(normalizedQuery)
  })
}

export function mapProcesoFromAPI(
  proc: ProcesoAPI,
  userFullName: string,
  tracking?: { id: string; is_active: boolean }
): Proceso {
  const idProceso = Number(proc.idProceso)
  const { parties, userRoles } = parseSujetosProcesales(proc.sujetosProcesales, userFullName)

  return {
    id: idProceso.toString(),
    idProceso,
    numero: proc.llaveProceso,
    despacho: proc.despacho.trim(),
    departamento: proc.departamento,
    sujetosProcesales: proc.sujetosProcesales,
    fechaInicio: proc.fechaProceso,
    fechaUltimaActuacion: proc.fechaUltimaActuacion,
    estado: computeEstadoFromLastActuacion(proc.fechaUltimaActuacion),
    parties,
    userRoles,
    trackingId: tracking?.id,
    isTracked: tracking?.is_active ?? false,
  }
}

export function buildRamaJudicialConsultaUrl(numeroProceso: string): string {
  const encoded = encodeURIComponent(numeroProceso.trim())
  return `https://consultaprocesos.ramajudicial.gov.co/procesos/consulta?numero=${encoded}`
}

export function formatUserRolesLabel(roles: string[] | undefined): string | null {
  if (!roles?.length) return null
  const unique = [...new Set(roles)]
  return unique.join(' · ')
}
