import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api'
import { mapNotesFromAPI } from '../components/cuadernos/cuadernosTypes'
import { mapSecretsFromAPI } from '../components/secretos/secretosTypes'
import type { FileAPI } from '../components/archivos/archivosTypes'
import { sortFilesByDate } from '../components/archivos/archivosTypes'
import { mapEmployeeRecords } from '../components/empleados/employeeTypes'
import { mapVehicleRecords } from '../components/vehiculos/vehicleTypes'
import type { Vehicle } from '../components/vehiculos/vehicleTypes'
import { mapPatrimonyRecords } from '../components/patrimonio/patrimonioTypes'
import type { PatrimonyItem } from '../components/patrimonio/patrimonioTypes'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import { devError } from '../utils/debugTools'

export type UtilidadesActivityType = 'note' | 'secret' | 'file'

export interface UtilidadesRecentActivity {
  id: string
  type: UtilidadesActivityType
  label: string
  date: string
  path: string
}

export interface UtilidadesAttentionItem {
  id: string
  label: string
  detail: string
  path: string
  tone: 'warning' | 'danger'
  daysUntil: number
}

export interface UtilidadesHubStats {
  totalNotas: number
  notasEstaSemana: number
  totalSecretos: number
  secretosEstaSemana: number
  totalArchivos: number
  bytesArchivos: number
  archivosPdf: number
  archivosImagenes: number
  totalEmpleados: number
  empleadosConContrato: number
  totalVehiculos: number
  vehiculosConSeguro: number
  totalPatrimonio: number
  valorPatrimonioCOP: number
  totalRegistros: number
  recentActivity: UtilidadesRecentActivity[]
  attentionItems: UtilidadesAttentionItem[]
}

const emptyStats: UtilidadesHubStats = {
  totalNotas: 0,
  notasEstaSemana: 0,
  totalSecretos: 0,
  secretosEstaSemana: 0,
  totalArchivos: 0,
  bytesArchivos: 0,
  archivosPdf: 0,
  archivosImagenes: 0,
  totalEmpleados: 0,
  empleadosConContrato: 0,
  totalVehiculos: 0,
  vehiculosConSeguro: 0,
  totalPatrimonio: 0,
  valorPatrimonioCOP: 0,
  totalRegistros: 0,
  recentActivity: [],
  attentionItems: [],
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const ATTENTION_WINDOW_DAYS = 30

function isWithinWeek(dateStr: string): boolean {
  return new Date(dateStr).getTime() >= Date.now() - WEEK_MS
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const today = new Date()
  target.setHours(12, 0, 0, 0)
  today.setHours(12, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
}

function formatActivityDate(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const eventDay = new Date(date)
  eventDay.setHours(12, 0, 0, 0)

  if (eventDay.getTime() === today.getTime()) return 'Hoy'
  if (eventDay.getTime() === yesterday.getTime()) return 'Ayer'
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

function collectVehicleAttention(vehicles: Vehicle[]): UtilidadesAttentionItem[] {
  const items: UtilidadesAttentionItem[] = []

  vehicles.forEach(vehicle => {
    const candidates: Array<{ label: string; date: string; kind: string }> = []

    if (vehicle.data.insurance?.expirationDate) {
      candidates.push({
        label: vehicle.name,
        date: vehicle.data.insurance.expirationDate,
        kind: 'Seguro',
      })
    }
    if (vehicle.data.maintenance?.nextService) {
      candidates.push({
        label: vehicle.name,
        date: vehicle.data.maintenance.nextService,
        kind: 'Servicio',
      })
    }
    if (vehicle.data.documents?.soat?.expiration) {
      candidates.push({
        label: vehicle.name,
        date: vehicle.data.documents.soat.expiration,
        kind: 'SOAT',
      })
    }
    if (vehicle.data.documents?.technicalReview?.expiration) {
      candidates.push({
        label: vehicle.name,
        date: vehicle.data.documents.technicalReview.expiration,
        kind: 'Revisión técnica',
      })
    }

    candidates.forEach(candidate => {
      const remaining = daysUntil(candidate.date)
      if (remaining > ATTENTION_WINDOW_DAYS) return

      items.push({
        id: `vehicle-${vehicle.id}-${candidate.kind}`,
        label: candidate.label,
        detail:
          remaining < 0
            ? `${candidate.kind} vencido`
            : remaining === 0
              ? `${candidate.kind} vence hoy`
              : `${candidate.kind} en ${remaining} día${remaining !== 1 ? 's' : ''}`,
        path: '/registros/vehiculos',
        tone: remaining <= 7 ? 'danger' : 'warning',
        daysUntil: remaining,
      })
    })
  })

  return items.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 5)
}

function sumPatrimonyValue(items: PatrimonyItem[]): number {
  return items.reduce((sum, item) => {
    const value =
      item.data.currentValue != null && item.data.currentValue > 0
        ? item.data.currentValue
        : item.data.purchaseValue != null && item.data.purchaseValue > 0
          ? item.data.purchaseValue
          : 0
    if ((item.data.currency || 'COP').toUpperCase() !== 'COP') return sum
    return sum + value
  }, 0)
}

function buildRecentActivity(
  notes: ReturnType<typeof mapNotesFromAPI>,
  secrets: ReturnType<typeof mapSecretsFromAPI>,
  files: FileAPI[]
): UtilidadesRecentActivity[] {
  const activities: UtilidadesRecentActivity[] = []

  notes.forEach(note => {
    activities.push({
      id: `note-${note.id}`,
      type: 'note',
      label: note.titulo || 'Cuaderno sin título',
      date: note.fechaActualizacion,
      path: `/registros/cuadernos/${note.id}`,
    })
  })

  secrets.forEach(secret => {
    activities.push({
      id: `secret-${secret.id}`,
      type: 'secret',
      label: secret.titulo,
      date: secret.fechaActualizacion,
      path: '/registros/secretos',
    })
  })

  files.forEach(file => {
    activities.push({
      id: `file-${file.id}`,
      type: 'file',
      label: file.title || file.file_name,
      date: file.updated_at || file.created_at,
      path: '/registros/archivos',
    })
  })

  return activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
}

export function formatUtilidadesBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatUtilidadesPrice(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export { formatActivityDate }

export function useUtilidadesHubStats() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [statsWarning, setStatsWarning] = useState<string | null>(null)
  const [failedSources, setFailedSources] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState<UtilidadesHubStats>(emptyStats)

  const loadStats = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    setStatsWarning(null)

    const requests = [
      { key: 'notes', label: 'Cuadernos', fetch: () => api.getNotes() },
      { key: 'secrets', label: 'Secretos', fetch: () => api.getSecrets() },
      { key: 'files', label: 'Archivos', fetch: () => api.getFiles() },
      { key: 'employees', label: 'Empleados', fetch: () => api.getEmployees() },
      { key: 'vehicles', label: 'Vehículos', fetch: () => api.getVehicles() },
      { key: 'patrimony', label: 'Patrimonio', fetch: () => api.getPatrimony() },
    ] as const

    try {
      const results = await Promise.allSettled(requests.map(request => request.fetch()))
      const failedLabels: string[] = []
      const failed = new Set<string>()

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          failedLabels.push(requests[index].label)
          failed.add(requests[index].key)
          devError(`Error al cargar ${requests[index].label}:`, result.reason)
        }
      })

      setFailedSources(failed)

      if (failedLabels.length === requests.length) {
        const firstError = results.find(r => r.status === 'rejected') as
          | PromiseRejectedResult
          | undefined
        setLoadError(
          getTranslatedErrorMessage(
            firstError?.reason,
            'No se pudieron cargar las estadísticas. Por favor, intenta de nuevo.'
          )
        )
        return
      }

      if (failedLabels.length > 0) {
        setStatsWarning(
          `No se pudieron actualizar: ${failedLabels.join(', ')}. Los totales mostrados pueden estar incompletos.`
        )
      }

      const [notesRes, secretsRes, filesRes, employeesRes, vehiclesRes, patrimonyRes] = results.map(
        result => (result.status === 'fulfilled' ? result.value : null)
      )

      const notes =
        notesRes?.notes && Array.isArray(notesRes.notes)
          ? mapNotesFromAPI(notesRes.notes)
          : []
      const secrets =
        secretsRes?.secrets && Array.isArray(secretsRes.secrets)
          ? mapSecretsFromAPI(secretsRes.secrets)
          : []
      const files: FileAPI[] =
        filesRes?.files && Array.isArray(filesRes.files)
          ? sortFilesByDate(filesRes.files)
          : []
      const employees =
        employeesRes?.employees && Array.isArray(employeesRes.employees)
          ? mapEmployeeRecords(employeesRes.employees)
          : []
      const vehicles =
        vehiclesRes?.vehicles && Array.isArray(vehiclesRes.vehicles)
          ? mapVehicleRecords(vehiclesRes.vehicles)
          : []
      const patrimonyItems =
        patrimonyRes?.items && Array.isArray(patrimonyRes.items)
          ? mapPatrimonyRecords(patrimonyRes.items)
          : []

      const totalNotas = notes.length
      const notasEstaSemana = notes.filter(n => isWithinWeek(n.fechaCreacion)).length
      const totalSecretos = secrets.length
      const secretosEstaSemana = secrets.filter(s => isWithinWeek(s.fechaActualizacion)).length
      const totalArchivos = files.length
      const bytesArchivos = files.reduce((sum, file) => sum + (file.file_size || 0), 0)
      const archivosPdf = files.filter(f => f.mime_type === 'application/pdf').length
      const archivosImagenes = files.filter(f => f.mime_type.startsWith('image/')).length
      const totalEmpleados = employees.length
      const empleadosConContrato = employees.filter(e => e.data.contractType?.trim()).length
      const totalVehiculos = vehicles.length
      const vehiculosConSeguro = vehicles.filter(v => v.data.insurance?.company?.trim()).length
      const totalPatrimonio = patrimonyItems.length
      const valorPatrimonioCOP = sumPatrimonyValue(patrimonyItems)
      const totalRegistros =
        totalNotas + totalSecretos + totalArchivos + totalEmpleados + totalVehiculos + totalPatrimonio

      setStats({
        totalNotas,
        notasEstaSemana,
        totalSecretos,
        secretosEstaSemana,
        totalArchivos,
        bytesArchivos,
        archivosPdf,
        archivosImagenes,
        totalEmpleados,
        empleadosConContrato,
        totalVehiculos,
        vehiculosConSeguro,
        totalPatrimonio,
        valorPatrimonioCOP,
        totalRegistros,
        recentActivity: buildRecentActivity(notes, secrets, files),
        attentionItems: collectVehicleAttention(vehicles),
      })
    } catch (err: unknown) {
      devError('Error al cargar estadísticas de Utilidades:', err)
      setLoadError(
        getTranslatedErrorMessage(
          err,
          'No se pudieron cargar las estadísticas. Por favor, intenta de nuevo.'
        )
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  return {
    isLoading,
    loadError,
    statsWarning,
    failedSources,
    stats,
    loadStats,
  }
}
