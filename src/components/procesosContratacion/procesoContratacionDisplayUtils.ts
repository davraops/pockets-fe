import type {
  HiringProcessAPI,
  InterviewEvent,
  ProcesoClosureReason,
  ProcesoContratacion,
  ProcesoClosureInfo,
} from './procesoContratacionTypes'
import { CLOSURE_REASON_OPTIONS } from './procesoContratacionTypes'

const STALE_DAYS = 7
const MS_PER_DAY = 24 * 60 * 60 * 1000

export interface ProcesoClosureStats {
  totalCerrados: number
  estancados: number
  precio: number
  skills: number
  contratados: number
  rechazados: number
  desistidos: number
  otros: number
  abiertosEstancados: number
}

export interface ProcesoClosureRecord {
  id: string
  titulo: string
  empresa: string
  posicion: string
  closure: ProcesoClosureInfo
  fechaCierre?: string
}

export interface SkillGapAggregate {
  skill: string
  key: string
  count: number
  procesos: string[]
}

export function normalizeSkillKey(skill: string): string {
  return skill.trim().toLowerCase()
}

export function buildReinforceSkillUpdate(
  proceso: ProcesoContratacion,
  skillKey: string,
  skillLabel: string
): { name: string; data: HiringProcessAPI['data'] } | null {
  const closure = proceso.rawData.data?.closure
  if (closure?.reason !== 'skills' || !closure.skillsGap?.length) {
    return null
  }

  const remainingGap = closure.skillsGap.filter(
    item => normalizeSkillKey(item) !== skillKey
  )
  const hadMatch = remainingGap.length !== closure.skillsGap.length
  if (!hadMatch) {
    return null
  }

  const reinforced = closure.skillsReinforced ?? []
  const alreadyListed = reinforced.some(item => normalizeSkillKey(item) === skillKey)
  const skillsReinforced = alreadyListed ? reinforced : [...reinforced, skillLabel.trim()]

  return {
    name: proceso.rawData.name,
    data: {
      ...proceso.rawData.data,
      closure: {
        ...closure,
        skillsGap: remainingGap.length > 0 ? remainingGap : undefined,
        skillsReinforced,
      },
    },
  }
}

export function listProcesosToReinforceSkill(
  procesos: ProcesoContratacion[],
  skillKey: string
): ProcesoContratacion[] {
  return procesos.filter(proceso => {
    const closure = proceso.rawData.data?.closure
    if (closure?.reason !== 'skills' || !closure.skillsGap?.length) {
      return false
    }
    return closure.skillsGap.some(item => normalizeSkillKey(item) === skillKey)
  })
}

export function mapProcesoFromAPI(proc: HiringProcessAPI): ProcesoContratacion {
  const data = proc.data || {}
  return {
    id: proc.id,
    titulo: proc.name,
    empresa: data.company || 'Sin empresa',
    posicion: data.roleDescription || data.position || 'Sin rol definido',
    estado: data.status || 'Abierto',
    fechaApertura: data.applicationDate || proc.created_at,
    fechaCierre: data.closingDate || data.closure?.closedAt,
    rawData: proc,
  }
}

export function formatProcesoDate(dateString: string): string {
  const date = new Date(dateString.includes('T') ? dateString : `${dateString}T12:00:00`)
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatProcesoDateTime(dateString: string, timeString: string): string {
  const date = new Date(`${dateString}T${timeString || '00:00'}`)
  return date.toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatProcesoCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getProcesoEstadoColor(estado: string): string {
  const estadoLower = estado.toLowerCase()
  if (estadoLower.includes('abierto') || estadoLower.includes('activo')) {
    return 'var(--highlight-success-text, #34C759)'
  }
  if (estadoLower.includes('cerrado') || estadoLower.includes('finalizado')) {
    return 'var(--text-tertiary, #8E8E93)'
  }
  return 'var(--section-indigo, #5856D6)'
}

export function getClosureReasonLabel(reason: ProcesoClosureReason): string {
  return CLOSURE_REASON_OPTIONS.find(option => option.id === reason)?.label ?? reason
}

export function getClosureReasonTone(
  reason: ProcesoClosureReason
): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  switch (reason) {
    case 'contratado':
      return 'success'
    case 'precio':
    case 'skills':
      return 'warning'
    case 'estancado':
    case 'rechazado':
      return 'danger'
    case 'desistido':
      return 'info'
    default:
      return 'neutral'
  }
}

export function isProcesoOpen(proceso: ProcesoContratacion): boolean {
  return proceso.estado.toLowerCase() !== 'cerrado'
}

export function getHiringProgress(proceso: ProcesoContratacion): number {
  const steps = proceso.rawData.data?.hiringSteps ?? []
  if (steps.length === 0) return 0
  const completed = steps.filter(step => step.completed).length
  return Math.round((completed / steps.length) * 100)
}

export function getLastTouchDaysAgo(proceso: ProcesoContratacion, today = new Date()): number | null {
  const interactions = proceso.rawData.data?.interactions ?? []
  const todayNoon = new Date(today)
  todayNoon.setHours(12, 0, 0, 0)

  const referenceDate =
    interactions.length > 0
      ? [...interactions].sort((a, b) => b.date.localeCompare(a.date))[0].date
      : proceso.fechaApertura

  if (!referenceDate) return null

  const ref = new Date(referenceDate.includes('T') ? referenceDate : `${referenceDate}T12:00:00`)
  ref.setHours(12, 0, 0, 0)
  return Math.max(0, Math.round((todayNoon.getTime() - ref.getTime()) / MS_PER_DAY))
}

export function isProcesoStagnant(proceso: ProcesoContratacion, today = new Date()): boolean {
  if (!isProcesoOpen(proceso)) return false
  const days = getLastTouchDaysAgo(proceso, today)
  return days !== null && days > STALE_DAYS
}

export function buildInterviewEvents(procesos: ProcesoContratacion[]): InterviewEvent[] {
  const events: InterviewEvent[] = []

  procesos.filter(isProcesoOpen).forEach(proceso => {
    const interviews = proceso.rawData.data?.interviewDates ?? []
    interviews.forEach(interview => {
      events.push({
        procesoId: proceso.id,
        procesoName: proceso.titulo,
        empresa: proceso.empresa,
        date: interview.date,
        time: interview.time || '00:00',
        datetime: new Date(`${interview.date}T${interview.time || '00:00'}`),
      })
    })
  })

  return events.sort((a, b) => a.datetime.getTime() - b.datetime.getTime())
}

export function buildClosureStats(
  procesos: ProcesoContratacion[],
  today: Date = new Date()
): ProcesoClosureStats {
  const cerrados = procesos.filter(proceso => !isProcesoOpen(proceso))
  const stats: ProcesoClosureStats = {
    totalCerrados: cerrados.length,
    estancados: 0,
    precio: 0,
    skills: 0,
    contratados: 0,
    rechazados: 0,
    desistidos: 0,
    otros: 0,
    abiertosEstancados: procesos.filter(proceso => isProcesoStagnant(proceso, today)).length,
  }

  cerrados.forEach(proceso => {
    const reason = proceso.rawData.data?.closure?.reason
    if (!reason) {
      stats.otros += 1
      return
    }
    if (reason === 'estancado') stats.estancados += 1
    else if (reason === 'precio') stats.precio += 1
    else if (reason === 'skills') stats.skills += 1
    else if (reason === 'contratado') stats.contratados += 1
    else if (reason === 'rechazado') stats.rechazados += 1
    else if (reason === 'desistido') stats.desistidos += 1
    else stats.otros += 1
  })

  return stats
}

export function buildClosureRecords(procesos: ProcesoContratacion[]): ProcesoClosureRecord[] {
  return procesos
    .filter(proceso => proceso.rawData.data?.closure)
    .map(proceso => ({
      id: proceso.id,
      titulo: proceso.titulo,
      empresa: proceso.empresa,
      posicion: proceso.posicion,
      closure: proceso.rawData.data.closure!,
      fechaCierre: proceso.fechaCierre,
    }))
    .sort((a, b) => b.closure.closedAt.localeCompare(a.closure.closedAt))
}

export function buildSkillGapAggregates(procesos: ProcesoContratacion[]): SkillGapAggregate[] {
  const map = new Map<string, SkillGapAggregate>()

  procesos.forEach(proceso => {
    const closure = proceso.rawData.data?.closure
    if (closure?.reason !== 'skills' || !closure.skillsGap?.length) return

    closure.skillsGap.forEach(rawSkill => {
      const skill = rawSkill.trim()
      if (!skill) return
      const key = skill.toLowerCase()
      const existing = map.get(key)
      if (existing) {
        existing.count += 1
        if (!existing.procesos.includes(proceso.titulo)) {
          existing.procesos.push(proceso.titulo)
        }
      } else {
        map.set(key, { skill, key, count: 1, procesos: [proceso.titulo] })
      }
    })
  })

  return [...map.values()].sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill))
}

export function buildProcesoSummaryMeta(proceso: ProcesoContratacion): string {
  const parts: string[] = [proceso.empresa]
  const progress = getHiringProgress(proceso)
  if (progress > 0) {
    parts.push(`${progress}% pipeline`)
  }
  const interviews = proceso.rawData.data?.interviewDates?.length ?? 0
  if (interviews > 0) {
    parts.push(`${interviews} entrevista${interviews !== 1 ? 's' : ''}`)
  }
  const days = getLastTouchDaysAgo(proceso)
  if (days !== null && isProcesoOpen(proceso)) {
    parts.push(days === 0 ? 'Contacto hoy' : `Último contacto hace ${days} d`)
  }
  return parts.join(' · ')
}

export function buildCloseProcessPayload(
  proceso: ProcesoContratacion,
  reason: ProcesoClosureReason,
  notes: string,
  skillsGap: string[],
  wasStalledAtClose: boolean
): { name: string; data: HiringProcessAPI['data'] } {
  const closedAt = new Date().toISOString()
  return {
    name: proceso.rawData.name,
    data: {
      ...proceso.rawData.data,
      status: 'Cerrado',
      closingDate: closedAt.split('T')[0],
      closure: {
        reason,
        closedAt,
        notes: notes.trim() || undefined,
        skillsGap: reason === 'skills' && skillsGap.length > 0 ? skillsGap : undefined,
        wasStalledAtClose: wasStalledAtClose || undefined,
      },
    },
  }
}
