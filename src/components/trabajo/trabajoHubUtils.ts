import type { TrabajoModuleId } from '../../constants/trabajoModules'
import {
  buildProcessInsights,
  formatProcessInsightSubtitle,
  type TrabajoProcessInsights,
} from './procesoHubUtils'

export type ActivityStatus = 'defined' | 'in_progress' | 'blocked' | 'done' | 'wont_do'

export interface TrabajoContractRow {
  id: string
  name: string
  data: {
    clientName?: string
    exclusivity?: boolean
    salary?: number
    currency?: string
  }
  updated_at?: string
}

export interface TrabajoActivityRow {
  id: string
  name: string
  data: {
    client?: string
    activity?: string
    ticket?: string
    priority?: string
    assignmentDate?: string
    status?: ActivityStatus
    completedDate?: string
  }
  updated_at?: string
}

export interface TrabajoProcessRow {
  id: string
  name: string
  data: {
    company?: string
    position?: string
    roleDescription?: string
    status?: 'Abierto' | 'Cerrado' | string
    applicationDate?: string
    interviewDates?: Array<{ date: string; time?: string }>
    hiringSteps?: Array<{ step: string; completed: boolean }>
    interactions?: Array<{ date: string; description: string }>
    negotiatedSalary?: { amount?: number; currency?: string }
    hasAgency?: boolean
    agencyName?: string
    contactVia?: string
  }
  updated_at?: string
  created_at?: string
}

export interface TrabajoHubStats {
  totalContratos: number
  contratosExclusivos: number
  actividadesActivas: number
  actividadesBloqueadas: number
  actividadesAltaPrioridad: number
  actividadesEnProgreso: number
  procesosAbiertos: number
  procesosCerrados: number
  entrevistasProximas: number
  procesosEstancados: number
  avancePromedioPasos: number
  pasosPendientesTotal: number
}

export interface TrabajoRecentItem {
  id: string
  kind: 'activity' | 'process'
  title: string
  detail: string
  date: string
  path: string
  tone?: 'warning' | 'danger'
}

export interface TrabajoAttentionItem {
  id: string
  label: string
  detail: string
  path: string
  tone: 'warning' | 'danger' | 'positive'
}

export interface TrabajoHubData {
  stats: TrabajoHubStats
  processInsights: TrabajoProcessInsights
  recentItems: TrabajoRecentItem[]
  attentionItems: TrabajoAttentionItem[]
}

export const EMPTY_TRABAJO_HUB_STATS: TrabajoHubStats = {
  totalContratos: 0,
  contratosExclusivos: 0,
  actividadesActivas: 0,
  actividadesBloqueadas: 0,
  actividadesAltaPrioridad: 0,
  actividadesEnProgreso: 0,
  procesosAbiertos: 0,
  procesosCerrados: 0,
  entrevistasProximas: 0,
  procesosEstancados: 0,
  avancePromedioPasos: 0,
  pasosPendientesTotal: 0,
}

export const EMPTY_TRABAJO_HUB_DATA: TrabajoHubData = {
  stats: EMPTY_TRABAJO_HUB_STATS,
  processInsights: buildProcessInsights([]),
  recentItems: [],
  attentionItems: [],
}

const INTERVIEW_WINDOW_DAYS = 14
const MS_PER_DAY = 24 * 60 * 60 * 1000

export function isActiveActivityStatus(status: ActivityStatus | undefined): boolean {
  return status !== 'done' && status !== 'wont_do'
}

export function getActivityStatusLabel(status: ActivityStatus | undefined): string {
  switch (status) {
    case 'in_progress':
      return 'En progreso'
    case 'blocked':
      return 'Bloqueada'
    case 'done':
      return 'Completada'
    case 'wont_do':
      return 'No se hará'
    default:
      return 'Definida'
  }
}

function parseDateAtNoon(dateStr: string): Date {
  const normalized = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
  return new Date(`${normalized}T12:00:00`)
}

function daysUntil(dateStr: string, today: Date): number {
  const target = parseDateAtNoon(dateStr)
  const todayNoon = new Date(today)
  todayNoon.setHours(12, 0, 0, 0)
  return Math.round((target.getTime() - todayNoon.getTime()) / MS_PER_DAY)
}

function formatRelativeDate(dateStr: string, today: Date): string {
  const diff = daysUntil(dateStr, today)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  if (diff === -1) return 'Ayer'
  if (diff > 1 && diff <= 7) return `En ${diff} días`
  return parseDateAtNoon(dateStr).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

function getActivitySortDate(activity: TrabajoActivityRow): string {
  return activity.data.assignmentDate ?? activity.updated_at ?? ''
}

function getProcessSortDate(process: TrabajoProcessRow): string {
  const interactions = process.data.interactions ?? []
  if (interactions.length > 0) {
    return [...interactions].sort((a, b) => b.date.localeCompare(a.date))[0].date
  }
  return process.data.applicationDate ?? process.updated_at ?? process.created_at ?? ''
}

function buildAttentionItems(
  activities: TrabajoActivityRow[],
  processes: TrabajoProcessRow[],
  today: Date
): TrabajoAttentionItem[] {
  const items: TrabajoAttentionItem[] = []

  activities
    .filter(activity => activity.data.status === 'blocked')
    .forEach(activity => {
      items.push({
        id: `blocked-${activity.id}`,
        label: activity.name,
        detail: activity.data.client ? `Bloqueada · ${activity.data.client}` : 'Actividad bloqueada',
        path: '/trabajo/actividades',
        tone: 'danger',
      })
    })

  activities
    .filter(
      activity =>
        isActiveActivityStatus(activity.data.status) && activity.data.priority === 'Alta'
    )
    .forEach(activity => {
      items.push({
        id: `priority-${activity.id}`,
        label: activity.name,
        detail: activity.data.client ? `Alta prioridad · ${activity.data.client}` : 'Alta prioridad',
        path: '/trabajo/actividades',
        tone: 'warning',
      })
    })

  processes
    .filter(process => process.data.status !== 'Cerrado')
    .forEach(process => {
      ;(process.data.interviewDates ?? []).forEach((interview, index) => {
        const remaining = daysUntil(interview.date, today)
        if (remaining < 0 || remaining > INTERVIEW_WINDOW_DAYS) return

        const company = process.data.company ?? 'Sin empresa'
        const when =
          remaining === 0
            ? 'Entrevista hoy'
            : remaining === 1
              ? 'Entrevista mañana'
              : `Entrevista en ${remaining} días`

        items.push({
          id: `interview-${process.id}-${index}`,
          label: process.name,
          detail: `${when} · ${company}`,
          path: '/trabajo/procesos',
          tone: remaining <= 2 ? 'warning' : 'positive',
        })
      })

      const pendingSteps = (process.data.hiringSteps ?? []).filter(step => !step.completed)
      if (pendingSteps.length > 0) {
        items.push({
          id: `steps-${process.id}`,
          label: process.name,
          detail: `${pendingSteps.length} paso${pendingSteps.length !== 1 ? 's' : ''} pendiente${pendingSteps.length !== 1 ? 's' : ''}`,
          path: '/trabajo/procesos',
          tone: 'warning',
        })
      }
    })

  return items.slice(0, 6)
}

function buildRecentItems(
  activities: TrabajoActivityRow[],
  processes: TrabajoProcessRow[],
  today: Date
): TrabajoRecentItem[] {
  const activityItems: TrabajoRecentItem[] = activities
    .filter(activity => isActiveActivityStatus(activity.data.status))
    .map(activity => {
      const sortDate = getActivitySortDate(activity)
      const meta = [
        activity.data.client,
        getActivityStatusLabel(activity.data.status),
        activity.data.priority,
      ]
        .filter(Boolean)
        .join(' · ')

      return {
        id: `activity-${activity.id}`,
        kind: 'activity' as const,
        title: activity.name,
        detail: meta || 'Sin cliente',
        date: sortDate,
        path: '/trabajo/actividades',
        tone:
          activity.data.status === 'blocked'
            ? ('danger' as const)
            : activity.data.priority === 'Alta'
              ? ('warning' as const)
              : undefined,
      }
    })

  const processItems: TrabajoRecentItem[] = processes
    .filter(process => process.data.status !== 'Cerrado')
    .map(process => {
      const sortDate = getProcessSortDate(process)
      const company = process.data.company ?? 'Sin empresa'
      const position = process.data.position ?? process.data.roleDescription

      return {
        id: `process-${process.id}`,
        kind: 'process' as const,
        title: process.name,
        detail: position ? `${company} · ${position}` : company,
        date: sortDate,
        path: '/trabajo/procesos',
      }
    })

  return [...activityItems, ...processItems]
    .filter(item => item.date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)
    .map(item => ({
      ...item,
      detail: item.date ? `${formatRelativeDate(item.date, today)} · ${item.detail}` : item.detail,
    }))
}

export function buildTrabajoHubData(input: {
  contracts: TrabajoContractRow[]
  activities: TrabajoActivityRow[]
  processes: TrabajoProcessRow[]
  today?: Date
}): TrabajoHubData {
  const today = input.today ?? new Date()
  const activeActivities = input.activities.filter(activity =>
    isActiveActivityStatus(activity.data.status)
  )

  const processInsights = buildProcessInsights(input.processes, today)

  const stats: TrabajoHubStats = {
    totalContratos: input.contracts.length,
    contratosExclusivos: input.contracts.filter(contract => contract.data.exclusivity).length,
    actividadesActivas: activeActivities.length,
    actividadesBloqueadas: activeActivities.filter(activity => activity.data.status === 'blocked')
      .length,
    actividadesAltaPrioridad: activeActivities.filter(activity => activity.data.priority === 'Alta')
      .length,
    actividadesEnProgreso: activeActivities.filter(
      activity => activity.data.status === 'in_progress'
    ).length,
    procesosAbiertos: processInsights.stats.procesosAbiertos,
    procesosCerrados: processInsights.stats.procesosCerrados,
    entrevistasProximas: processInsights.stats.entrevistasProximas,
    procesosEstancados: processInsights.stats.procesosEstancados,
    avancePromedioPasos: processInsights.stats.avancePromedioPasos,
    pasosPendientesTotal: processInsights.stats.pasosPendientesTotal,
  }

  return {
    stats,
    processInsights,
    recentItems: buildRecentItems(input.activities, input.processes, today),
    attentionItems: buildAttentionItems(input.activities, input.processes, today),
  }
}

export function formatTrabajoHeroValue(stats: TrabajoHubStats): string {
  if (stats.actividadesActivas === 0 && stats.procesosAbiertos === 0) {
    return 'Al día'
  }
  return String(stats.actividadesActivas)
}

export function formatTrabajoHeroSubline(stats: TrabajoHubStats): string {
  const parts: string[] = []

  if (stats.actividadesActivas > 0) {
    parts.push(
      `${stats.actividadesActivas} actividad${stats.actividadesActivas !== 1 ? 'es' : ''} activa${stats.actividadesActivas !== 1 ? 's' : ''}`
    )
  }

  if (stats.procesosAbiertos > 0) {
    parts.push(
      `${stats.procesosAbiertos} proceso${stats.procesosAbiertos !== 1 ? 's' : ''} abierto${stats.procesosAbiertos !== 1 ? 's' : ''}`
    )
  }

  if (stats.totalContratos > 0) {
    parts.push(`${stats.totalContratos} contrato${stats.totalContratos !== 1 ? 's' : ''}`)
  }

  if (parts.length === 0) {
    return 'Contratos, actividades y procesos de contratación'
  }

  return parts.join(' · ')
}

export function formatTrabajoHeroStats(stats: TrabajoHubStats): Array<{
  id: string
  label: string
  value: number
  tone?: 'warning' | 'danger' | 'positive'
}> {
  const items: Array<{
    id: string
    label: string
    value: number
    tone?: 'warning' | 'danger' | 'positive'
  }> = []

  if (stats.actividadesEnProgreso > 0) {
    items.push({
      id: 'progress',
      label: 'En progreso',
      value: stats.actividadesEnProgreso,
      tone: 'positive',
    })
  }

  if (stats.actividadesAltaPrioridad > 0) {
    items.push({
      id: 'priority',
      label: 'Alta prioridad',
      value: stats.actividadesAltaPrioridad,
      tone: 'warning',
    })
  }

  if (stats.actividadesBloqueadas > 0) {
    items.push({
      id: 'blocked',
      label: 'Bloqueadas',
      value: stats.actividadesBloqueadas,
      tone: 'danger',
    })
  }

  if (stats.entrevistasProximas > 0) {
    items.push({
      id: 'interviews',
      label: 'Entrevistas',
      value: stats.entrevistasProximas,
      tone: 'warning',
    })
  }

  if (stats.procesosEstancados > 0) {
    items.push({
      id: 'stalled',
      label: 'Sin seguimiento',
      value: stats.procesosEstancados,
      tone: 'danger',
    })
  }

  return items
}

export function formatTrabajoModuleSubtitle(
  moduleId: TrabajoModuleId,
  stats: TrabajoHubStats
): string {
  switch (moduleId) {
    case 'contratos':
      if (stats.totalContratos === 0) return 'Sin contratos registrados'
      if (stats.contratosExclusivos > 0) {
        return `${stats.totalContratos} contrato${stats.totalContratos !== 1 ? 's' : ''} · ${stats.contratosExclusivos} exclusivo${stats.contratosExclusivos !== 1 ? 's' : ''}`
      }
      return `${stats.totalContratos} contrato${stats.totalContratos !== 1 ? 's' : ''}`
    case 'actividades':
      if (stats.actividadesActivas === 0) return 'Sin actividades activas'
      if (stats.actividadesBloqueadas > 0) {
        return `${stats.actividadesActivas} activa${stats.actividadesActivas !== 1 ? 's' : ''} · ${stats.actividadesBloqueadas} bloqueada${stats.actividadesBloqueadas !== 1 ? 's' : ''}`
      }
      return `${stats.actividadesActivas} activa${stats.actividadesActivas !== 1 ? 's' : ''}`
    case 'procesos':
      return formatProcessInsightSubtitle({
        procesosAbiertos: stats.procesosAbiertos,
        procesosCerrados: stats.procesosCerrados,
        entrevistasProximas: stats.entrevistasProximas,
        pasosPendientesTotal: stats.pasosPendientesTotal,
        procesosConPasosPendientes: 0,
        procesosEstancados: stats.procesosEstancados,
        diasPromedioAbiertos: 0,
        avancePromedioPasos: stats.avancePromedioPasos,
        conAgencia: 0,
        contactoDirecto: 0,
        conSalarioNegociado: 0,
      })
    default:
      return ''
  }
}
