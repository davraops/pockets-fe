import { useCallback, useEffect, useState } from 'react'
import {
  buildTrabajoHubData,
  EMPTY_TRABAJO_HUB_DATA,
  type TrabajoActivityRow,
  type TrabajoContractRow,
  type TrabajoHubData,
  type TrabajoProcessRow,
} from '../components/trabajo/trabajoHubUtils'
import { api } from '../services/api'
import { devError } from '../utils/debugTools'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'

export function useTrabajoHubStats() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [statsWarning, setStatsWarning] = useState<string | null>(null)
  const [failedSources, setFailedSources] = useState<Set<string>>(new Set())
  const [data, setData] = useState<TrabajoHubData>(EMPTY_TRABAJO_HUB_DATA)

  const loadStats = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    setStatsWarning(null)

    const requests = [
      { key: 'contracts', label: 'Contratos', fetch: () => api.getContracts() },
      { key: 'activities', label: 'Actividades', fetch: () => api.getClientActivities() },
      { key: 'processes', label: 'Procesos', fetch: () => api.getHiringProcesses() },
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
        const firstError = results.find(result => result.status === 'rejected') as
          | PromiseRejectedResult
          | undefined
        setLoadError(
          getTranslatedErrorMessage(
            firstError?.reason,
            'No se pudo cargar el resumen de Trabajo. Por favor, intenta de nuevo.'
          )
        )
        setData(EMPTY_TRABAJO_HUB_DATA)
        return
      }

      if (failedLabels.length > 0) {
        setStatsWarning(
          `No se pudieron actualizar: ${failedLabels.join(', ')}. El resumen puede estar incompleto.`
        )
      }

      const contractsResult = results[0]
      const activitiesResult = results[1]
      const processesResult = results[2]

      const contracts: TrabajoContractRow[] =
        contractsResult.status === 'fulfilled' &&
        Array.isArray(contractsResult.value.contracts)
          ? contractsResult.value.contracts
          : []

      const activities: TrabajoActivityRow[] =
        activitiesResult.status === 'fulfilled' &&
        Array.isArray(activitiesResult.value.activities)
          ? activitiesResult.value.activities
          : []

      const processes: TrabajoProcessRow[] =
        processesResult.status === 'fulfilled' &&
        Array.isArray(processesResult.value.hiring_processes)
          ? processesResult.value.hiring_processes
          : []

      setData(
        buildTrabajoHubData({
          contracts,
          activities,
          processes,
        })
      )
    } catch (error) {
      devError('Error al cargar hub de Trabajo:', error)
      setLoadError('No se pudo cargar el resumen de Trabajo. Intenta de nuevo.')
      setData(EMPTY_TRABAJO_HUB_DATA)
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
    data,
    stats: data.stats,
    loadStats,
  }
}
