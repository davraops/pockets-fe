import type { TrabajoProcessRow } from './trabajoHubUtils'

const INTERVIEW_WINDOW_DAYS = 21
const STALE_DAYS = 14
const MS_PER_DAY = 24 * 60 * 60 * 1000

export interface TrabajoProcessInsightStats {
  procesosAbiertos: number
  procesosCerrados: number
  entrevistasProximas: number
  pasosPendientesTotal: number
  procesosConPasosPendientes: number
  procesosEstancados: number
  diasPromedioAbiertos: number
  avancePromedioPasos: number
  conAgencia: number
  contactoDirecto: number
  conSalarioNegociado: number
}

export interface TrabajoProcessInterviewInsight {
  id: string
  processId: string
  processName: string
  company: string
  date: string
  time?: string
  daysUntil: number
  whenLabel: string
}

export interface TrabajoProcessPipelineItem {
  id: string
  name: string
  company: string
  detail: string
  progressPercent: number
  tone?: 'warning' | 'danger' | 'positive'
  daysOpen: number
  lastTouchDaysAgo: number | null
}

export interface TrabajoProcessInsights {
  stats: TrabajoProcessInsightStats
  upcomingInterviews: TrabajoProcessInterviewInsight[]
  stalledProcesses: TrabajoProcessPipelineItem[]
  activePipeline: TrabajoProcessPipelineItem[]
  summaryLines: string[]
}

export const EMPTY_PROCESS_INSIGHTS: TrabajoProcessInsights = {
  stats: {
    procesosAbiertos: 0,
    procesosCerrados: 0,
    entrevistasProximas: 0,
    pasosPendientesTotal: 0,
    procesosConPasosPendientes: 0,
    procesosEstancados: 0,
    diasPromedioAbiertos: 0,
    avancePromedioPasos: 0,
    conAgencia: 0,
    contactoDirecto: 0,
    conSalarioNegociado: 0,
  },
  upcomingInterviews: [],
  stalledProcesses: [],
  activePipeline: [],
  summaryLines: [],
}

function parseDateAtNoon(dateStr: string): Date {
  const normalized = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
  return new Date(`${normalized}T12:00:00`)
}

function daysBetween(start: string, end: Date): number {
  const startMs = parseDateAtNoon(start).getTime()
  const endNoon = new Date(end)
  endNoon.setHours(12, 0, 0, 0)
  return Math.max(0, Math.round((endNoon.getTime() - startMs) / MS_PER_DAY))
}

function daysUntil(dateStr: string, today: Date): number {
  const target = parseDateAtNoon(dateStr)
  const todayNoon = new Date(today)
  todayNoon.setHours(12, 0, 0, 0)
  return Math.round((target.getTime() - todayNoon.getTime()) / MS_PER_DAY)
}

function formatWhenLabel(daysUntilDate: number, dateStr: string): string {
  if (daysUntilDate === 0) return 'Hoy'
  if (daysUntilDate === 1) return 'Mañana'
  if (daysUntilDate > 1 && daysUntilDate <= 7) return `En ${daysUntilDate} días`
  return parseDateAtNoon(dateStr).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

function getProcessOpenedAt(process: TrabajoProcessRow): string {
  return process.data.applicationDate ?? process.created_at ?? process.updated_at ?? ''
}

function getLastTouchDate(process: TrabajoProcessRow): string | null {
  const interactions = process.data.interactions ?? []
  if (interactions.length > 0) {
    return [...interactions].sort((a, b) => b.date.localeCompare(a.date))[0].date
  }
  const openedAt = getProcessOpenedAt(process)
  return openedAt || null
}

function getHiringProgress(process: TrabajoProcessRow): number {
  const steps = process.data.hiringSteps ?? []
  if (steps.length === 0) {
    return 0
  }
  const completed = steps.filter(step => step.completed).length
  return Math.round((completed / steps.length) * 100)
}

function isOpenProcess(process: TrabajoProcessRow): boolean {
  return process.data.status !== 'Cerrado'
}

function buildUpcomingInterviews(
  processes: TrabajoProcessRow[],
  today: Date
): TrabajoProcessInterviewInsight[] {
  const items: TrabajoProcessInterviewInsight[] = []
  const windowEnd = today.getTime() + INTERVIEW_WINDOW_DAYS * MS_PER_DAY

  processes.filter(isOpenProcess).forEach(process => {
    ;(process.data.interviewDates ?? []).forEach((interview, index) => {
      const interviewTime = parseDateAtNoon(interview.date).getTime()
      if (interviewTime < today.getTime() - MS_PER_DAY || interviewTime > windowEnd) {
        return
      }

      const remaining = daysUntil(interview.date, today)
      items.push({
        id: `${process.id}-${index}`,
        processId: process.id,
        processName: process.name,
        company: process.data.company ?? 'Sin empresa',
        date: interview.date,
        time: interview.time,
        daysUntil: remaining,
        whenLabel: formatWhenLabel(remaining, interview.date),
      })
    })
  })

  return items.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6)
}

function buildPipelineItem(process: TrabajoProcessRow, today: Date): TrabajoProcessPipelineItem {
  const openedAt = getProcessOpenedAt(process)
  const lastTouch = getLastTouchDate(process)
  const daysOpen = openedAt ? daysBetween(openedAt, today) : 0
  const lastTouchDaysAgo = lastTouch ? daysBetween(lastTouch, today) : null
  const progressPercent = getHiringProgress(process)
  const pendingSteps = (process.data.hiringSteps ?? []).filter(step => !step.completed).length
  const position = process.data.position ?? process.data.roleDescription

  let detail = position ? `${position}` : 'Sin rol definido'
  if (pendingSteps > 0) {
    detail += ` · ${pendingSteps} paso${pendingSteps !== 1 ? 's' : ''} pendiente${pendingSteps !== 1 ? 's' : ''}`
  } else if (progressPercent > 0) {
    detail += ` · ${progressPercent}% del pipeline`
  }

  let tone: TrabajoProcessPipelineItem['tone']
  if (lastTouchDaysAgo !== null && lastTouchDaysAgo >= STALE_DAYS) {
    tone = 'danger'
  } else if (progressPercent >= 75) {
    tone = 'positive'
  } else if (pendingSteps > 0) {
    tone = 'warning'
  }

  return {
    id: process.id,
    name: process.name,
    company: process.data.company ?? 'Sin empresa',
    detail,
    progressPercent,
    tone,
    daysOpen,
    lastTouchDaysAgo,
  }
}

function isStalledProcess(item: TrabajoProcessPipelineItem): boolean {
  if (item.lastTouchDaysAgo === null) {
    return item.daysOpen >= STALE_DAYS
  }
  return item.lastTouchDaysAgo >= STALE_DAYS
}

function buildSummaryLines(stats: TrabajoProcessInsightStats, today: Date): string[] {
  const lines: string[] = []

  if (stats.procesosAbiertos === 0 && stats.procesosCerrados === 0) {
    return ['Sin procesos de contratación registrados']
  }

  if (stats.procesosAbiertos > 0) {
    lines.push(
      `${stats.procesosAbiertos} proceso${stats.procesosAbiertos !== 1 ? 's' : ''} abierto${stats.procesosAbiertos !== 1 ? 's' : ''}`
    )
  }

  if (stats.entrevistasProximas > 0) {
    lines.push(
      `${stats.entrevistasProximas} entrevista${stats.entrevistasProximas !== 1 ? 's' : ''} en las próximas 3 semanas`
    )
  }

  if (stats.avancePromedioPasos > 0) {
    lines.push(`Avance medio del pipeline: ${stats.avancePromedioPasos}%`)
  }

  if (stats.procesosEstancados > 0) {
    lines.push(
      `${stats.procesosEstancados} sin seguimiento en ${STALE_DAYS}+ días`
    )
  }

  if (stats.conSalarioNegociado > 0) {
    lines.push(
      `${stats.conSalarioNegociado} con salario negociado`
    )
  }

  if (lines.length === 0 && stats.procesosCerrados > 0) {
    lines.push(`${stats.procesosCerrados} proceso${stats.procesosCerrados !== 1 ? 's' : ''} cerrado${stats.procesosCerrados !== 1 ? 's' : ''}`)
  }

  return lines.slice(0, 4)
}

export function buildProcessInsights(
  processes: TrabajoProcessRow[],
  today: Date = new Date()
): TrabajoProcessInsights {
  const openProcesses = processes.filter(isOpenProcess)
  const closedProcesses = processes.filter(process => process.data.status === 'Cerrado')

  const pipelineItems = openProcesses.map(process => buildPipelineItem(process, today))
  const stalledProcesses = pipelineItems
    .filter(isStalledProcess)
    .sort((a, b) => (b.lastTouchDaysAgo ?? b.daysOpen) - (a.lastTouchDaysAgo ?? a.daysOpen))
    .slice(0, 5)

  const activePipeline = pipelineItems
    .filter(item => !isStalledProcess(item))
    .sort((a, b) => b.progressPercent - a.progressPercent || a.daysOpen - b.daysOpen)
    .slice(0, 5)

  const upcomingInterviews = buildUpcomingInterviews(processes, today)

  let pasosPendientesTotal = 0
  let procesosConPasosPendientes = 0
  let progressSum = 0
  let progressCount = 0
  let daysOpenSum = 0
  let conAgencia = 0
  let conSalarioNegociado = 0

  openProcesses.forEach(process => {
    const pending = (process.data.hiringSteps ?? []).filter(step => !step.completed).length
    if (pending > 0) {
      procesosConPasosPendientes += 1
      pasosPendientesTotal += pending
    }

    const progress = getHiringProgress(process)
    if ((process.data.hiringSteps ?? []).length > 0) {
      progressSum += progress
      progressCount += 1
    }

    const openedAt = getProcessOpenedAt(process)
    if (openedAt) {
      daysOpenSum += daysBetween(openedAt, today)
    }

    if (process.data.hasAgency) {
      conAgencia += 1
    }
    if (process.data.negotiatedSalary?.amount) {
      conSalarioNegociado += 1
    }
  })

  const stats: TrabajoProcessInsightStats = {
    procesosAbiertos: openProcesses.length,
    procesosCerrados: closedProcesses.length,
    entrevistasProximas: upcomingInterviews.length,
    pasosPendientesTotal,
    procesosConPasosPendientes,
    procesosEstancados: stalledProcesses.length,
    diasPromedioAbiertos:
      openProcesses.length > 0 ? Math.round(daysOpenSum / openProcesses.length) : 0,
    avancePromedioPasos: progressCount > 0 ? Math.round(progressSum / progressCount) : 0,
    conAgencia,
    contactoDirecto: Math.max(0, openProcesses.length - conAgencia),
    conSalarioNegociado,
  }

  return {
    stats,
    upcomingInterviews,
    stalledProcesses,
    activePipeline,
    summaryLines: buildSummaryLines(stats, today),
  }
}

export function formatProcessInsightSubtitle(stats: TrabajoProcessInsightStats): string {
  if (stats.procesosAbiertos === 0 && stats.procesosCerrados === 0) {
    return 'Sin procesos registrados'
  }

  const parts: string[] = []
  if (stats.procesosAbiertos > 0) {
    parts.push(`${stats.procesosAbiertos} abierto${stats.procesosAbiertos !== 1 ? 's' : ''}`)
  }
  if (stats.entrevistasProximas > 0) {
    parts.push(`${stats.entrevistasProximas} entrevista${stats.entrevistasProximas !== 1 ? 's' : ''}`)
  }
  if (stats.procesosEstancados > 0) {
    parts.push(`${stats.procesosEstancados} sin seguimiento`)
  } else if (stats.avancePromedioPasos > 0) {
    parts.push(`${stats.avancePromedioPasos}% avance`)
  }

  return parts.join(' · ')
}
