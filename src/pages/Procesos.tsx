import { useState, useEffect, useCallback, useMemo } from 'react'
import CrudSummaryStrip from '../components/crud/CrudSummaryStrip'
import { useNavigate } from 'react-router-dom'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DescriptionIcon from '@mui/icons-material/Description'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import { fetchUserFullName } from '../utils/userFullName'
import {
  detectProcesoBadge,
  fetchProcessActuaciones,
  type JudicialActuacionAPI,
} from '../utils/judicialActuaciones'
import LifestyleSubHeader from '../components/tiempo/LifestyleSubHeader'
import ProcesoConsultaBanner from '../components/procesos/ProcesoConsultaBanner'
import ProcesoDetailModal from '../components/procesos/ProcesoDetailModal'
import {
  filterProcesos,
  formatProcesoDate,
  formatRelativeDate,
  formatUserRolesLabel,
  getEstadoColor,
  mapProcesoFromAPI,
} from '../components/procesos/procesoDisplayUtils'
import type { Actuacion, Proceso, ProcesoAPI, ProcesoFilter } from '../components/procesos/procesoTypes'
import './AppPage.css'
import ListSkeleton from '../components/ListSkeleton'
import './Procesos.css'

function mapActuaciones(actuaciones: JudicialActuacionAPI[]): Actuacion[] {
  return actuaciones.map(act => ({
    id: act.idRegActuacion,
    numero: act.consActuacion,
    fecha: act.fechaActuacion,
    tipo: act.actuacion,
    anotacion: act.anotacion,
    fechaInicial: act.fechaInicial,
    fechaFinal: act.fechaFinal,
    fechaRegistro: act.fechaRegistro,
    conDocumentos: act.conDocumentos,
  }))
}

const FILTER_OPTIONS: Array<{ id: ProcesoFilter; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'tracked', label: 'Seguimiento' },
  { id: 'tramite', label: 'En trámite' },
  { id: 'inactivos', label: 'Inactivos' },
]

function Procesos() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [procesos, setProcesos] = useState<Proceso[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedProceso, setSelectedProceso] = useState<Proceso | null>(null)
  const [actuaciones, setActuaciones] = useState<Actuacion[]>([])
  const [isLoadingActuaciones, setIsLoadingActuaciones] = useState(false)
  const [actuacionesError, setActuacionesError] = useState<string | null>(null)
  const [isTrackingBusy, setIsTrackingBusy] = useState(false)
  const [nombreCompleto, setNombreCompleto] = useState<string>('')
  const [trackingMap, setTrackingMap] = useState<Map<number, { id: string; is_active: boolean }>>(
    new Map()
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<ProcesoFilter>('all')
  const [soloActivos, setSoloActivos] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMorePages, setHasMorePages] = useState(false)

  const stripStats = useMemo(() => {
    if (isLoading && procesos.length === 0) {
      return null
    }
    return {
      total: procesos.length,
      tracked: procesos.filter(p => p.isTracked).length,
      enTramite: procesos.filter(p => p.estado === 'En trámite').length,
    }
  }, [procesos, isLoading])

  const filteredProcesos = useMemo(
    () => filterProcesos(procesos, { filter: activeFilter, query: searchQuery }),
    [procesos, activeFilter, searchQuery]
  )

  const headerMeta = useMemo(() => {
    if (isLoading || error) return undefined
    if (procesos.length === 0) return 'Consulta por nombre en Rama Judicial'
    const tracked = procesos.filter(p => p.isTracked).length
    const base = `${procesos.length} proceso${procesos.length === 1 ? '' : 's'}`
    if (searchQuery.trim() || activeFilter !== 'all') {
      return `${filteredProcesos.length} visibles · ${base}`
    }
    return tracked > 0 ? `${base} · ${tracked} en seguimiento` : base
  }, [isLoading, error, procesos, filteredProcesos.length, searchQuery, activeFilter])

  const loadTracking = useCallback(async () => {
    try {
      const response = await api.getProcessTracking(true)

      if (response.tracking && Array.isArray(response.tracking)) {
        const map = new Map<number, { id: string; is_active: boolean }>()
        response.tracking.forEach((track: { id: string; id_proceso?: number; is_active: boolean }) => {
          if (track.id_proceso) {
            map.set(track.id_proceso, {
              id: track.id,
              is_active: track.is_active,
            })
          }
        })
        setTrackingMap(map)
        return map
      }
      return new Map<number, { id: string; is_active: boolean }>()
    } catch {
      return new Map<number, { id: string; is_active: boolean }>()
    }
  }, [])

  const loadProcesos = useCallback(
    async (options?: { page?: number; append?: boolean }) => {
      const page = options?.page ?? 1
      const append = options?.append ?? false

      try {
        if (append) {
          setIsLoadingMore(true)
        } else {
          setIsLoading(true)
        }
        setError(null)

        const nombre =
          nombreCompleto.trim() || (await fetchUserFullName())?.trim() || ''

        if (!nombreCompleto && nombre) {
          setNombreCompleto(nombre)
        }

        if (!nombre) {
          setError(
            'Configura tu nombre completo en Ajustes para consultar tus procesos judiciales.'
          )
          setProcesos([])
          setHasMorePages(false)
          return
        }

        const response = await api.getJudicialProcesses(nombre, 'nat', soloActivos, page)

        if (response.procesos && Array.isArray(response.procesos)) {
          const procesosFiltrados = response.procesos.filter(
            (proc: ProcesoAPI) => proc.idProceso && !Number.isNaN(Number(proc.idProceso))
          )

          const currentTrackingMap = await loadTracking()

          const procesosMapeados: Proceso[] = procesosFiltrados.map((proc: ProcesoAPI) => {
            const idProceso = Number(proc.idProceso)
            const tracking = currentTrackingMap.get(idProceso)
            return mapProcesoFromAPI(proc, nombre, tracking)
          })

          procesosMapeados.sort(
            (a, b) =>
              new Date(b.fechaUltimaActuacion).getTime() -
              new Date(a.fechaUltimaActuacion).getTime()
          )

          setProcesos(prev => {
            if (!append) return procesosMapeados
            const merged = new Map(prev.map(item => [item.idProceso, item]))
            procesosMapeados.forEach(item => merged.set(item.idProceso, item))
            return Array.from(merged.values()).sort(
              (a, b) =>
                new Date(b.fechaUltimaActuacion).getTime() -
                new Date(a.fechaUltimaActuacion).getTime()
            )
          })

          const paginacion = response.paginacion as
            | { pagina?: number; totalPaginas?: number }
            | undefined
          const totalPaginas = paginacion?.totalPaginas ?? 1
          setCurrentPage(page)
          setHasMorePages(page < totalPaginas)
        } else if (!append) {
          setProcesos([])
          setHasMorePages(false)
        }
      } catch (err: unknown) {
        const errorMessage = getTranslatedErrorMessage(
          err,
          'Error al cargar los procesos judiciales. Por favor, intenta de nuevo.'
        )
        setError(errorMessage)
        showNotification(errorMessage, 'error')
        if (!append) {
          setProcesos([])
        }
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [nombreCompleto, showNotification, loadTracking, soloActivos]
  )

  useEffect(() => {
    void loadProcesos()
  }, [loadProcesos])

  useEffect(() => {
    const handleProfileUpdate = () => {
      void loadProcesos()
    }
    window.addEventListener('pockets:user-details-updated', handleProfileUpdate)
    return () => window.removeEventListener('pockets:user-details-updated', handleProfileUpdate)
  }, [loadProcesos])

  const loadActuacionesForProceso = useCallback(
    async (idProceso: number, options?: { bypassCache?: boolean }) => {
      setIsLoadingActuaciones(true)
      setActuacionesError(null)
      setActuaciones([])

      try {
        const response = await fetchProcessActuaciones(idProceso, 1, options)
        const actuacionesMapeadas = mapActuaciones(response)
        const badge = detectProcesoBadge(response)

        setActuaciones(actuacionesMapeadas)
        setSelectedProceso(prev =>
          prev?.idProceso === idProceso ? { ...prev, badge } : prev
        )
        setProcesos(prev =>
          prev.map(p => (p.idProceso === idProceso ? { ...p, badge } : p))
        )
      } catch (err: unknown) {
        const errorMessage = getTranslatedErrorMessage(
          err,
          'Error al cargar las actuaciones del proceso.'
        )
        setActuacionesError(errorMessage)
        showNotification(errorMessage, 'error')
      } finally {
        setIsLoadingActuaciones(false)
      }
    },
    [showNotification]
  )

  const handleOpenDetailModal = async (proceso: Proceso) => {
    if (!proceso.idProceso || Number.isNaN(Number(proceso.idProceso)) || proceso.idProceso <= 0) {
      showNotification('Error: No se pudo obtener el ID del proceso', 'error')
      return
    }

    setSelectedProceso(proceso)
    setIsDetailModalOpen(true)
    await loadActuacionesForProceso(proceso.idProceso)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedProceso(null)
    setActuaciones([])
    setActuacionesError(null)
  }

  const handleToggleTracking = async (proceso: Proceso) => {
    setIsTrackingBusy(true)
    try {
      if (proceso.isTracked && proceso.trackingId) {
        await api.removeProcessTracking(proceso.trackingId)
        showNotification('Proceso removido del seguimiento', 'success')

        const newMap = new Map(trackingMap)
        newMap.delete(proceso.idProceso)
        setTrackingMap(newMap)

        setProcesos(prev =>
          prev.map(p =>
            p.idProceso === proceso.idProceso
              ? { ...p, isTracked: false, trackingId: undefined }
              : p
          )
        )

        if (selectedProceso?.idProceso === proceso.idProceso) {
          setSelectedProceso({
            ...selectedProceso,
            isTracked: false,
            trackingId: undefined,
          })
        }
      } else {
        const nombre =
          nombreCompleto.trim() || (await fetchUserFullName())?.trim() || ''
        if (!nombre) {
          showNotification(
            'Configura tu nombre completo en Ajustes antes de agregar seguimiento.',
            'error'
          )
          return
        }

        const response = await api.addProcessTracking({
          id_proceso: proceso.idProceso,
          llave_proceso: proceso.numero,
          nombre_persona: nombre,
          despacho: proceso.despacho,
          departamento: proceso.departamento,
        })

        showNotification(
          'Proceso agregado al seguimiento. Recibirás notificaciones de nuevas actuaciones.',
          'success'
        )

        const newMap = new Map(trackingMap)
        if (response.tracking?.id) {
          newMap.set(proceso.idProceso, {
            id: response.tracking.id,
            is_active: true,
          })
        }
        setTrackingMap(newMap)

        setProcesos(prev =>
          prev.map(p =>
            p.idProceso === proceso.idProceso
              ? { ...p, isTracked: true, trackingId: response.tracking?.id }
              : p
          )
        )

        if (selectedProceso?.idProceso === proceso.idProceso) {
          setSelectedProceso({
            ...selectedProceso,
            isTracked: true,
            trackingId: response.tracking?.id,
          })
        }
      }
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al actualizar el seguimiento del proceso.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsTrackingBusy(false)
    }
  }

  const handleCopyNumero = async () => {
    if (!selectedProceso) return
    try {
      await navigator.clipboard.writeText(selectedProceso.numero)
      showNotification('Radicado copiado al portapapeles', 'success')
    } catch {
      showNotification('No se pudo copiar el radicado', 'error')
    }
  }

  const showFilters = !isLoading && !error && procesos.length > 0
  const showSearch = showFilters || searchQuery.trim().length > 0

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide crud-page-content procesos-content lifestyle-sub-content">
        <LifestyleSubHeader
          title="Procesos"
          context="Justicia"
          meta={headerMeta}
          backTo="/justicia"
          backLabel="Volver a Justicia"
        />

        {!isLoading && !error && nombreCompleto ? (
          <ProcesoConsultaBanner
            nombre={nombreCompleto}
            onOpenAjustes={() => navigate('/ajustes')}
          />
        ) : null}

        <CrudSummaryStrip
          ariaLabel="Resumen de procesos"
          items={[
            {
              label: 'Total',
              value: stripStats === null ? '…' : stripStats.total,
              tone: 'info',
            },
            {
              label: 'En seguimiento',
              value: stripStats === null ? '…' : stripStats.tracked,
              tone: 'available',
            },
            {
              label: 'En trámite',
              value: stripStats === null ? '…' : stripStats.enTramite,
            },
          ]}
        />

        {showFilters ? (
          <div className="crud-segmented-tabs-container procesos-filters">
            <div className="crud-segmented-tabs" role="tablist" aria-label="Filtrar procesos">
              {FILTER_OPTIONS.map(option => (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={activeFilter === option.id}
                  className={`crud-segmented-tab${activeFilter === option.id ? ' crud-segmented-tab--active' : ''}`}
                  onClick={() => setActiveFilter(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <label className="procesos-solo-activos">
              <input
                type="checkbox"
                checked={soloActivos}
                onChange={event => setSoloActivos(event.target.checked)}
              />
              <span>Solo activos</span>
            </label>
          </div>
        ) : null}

        <div
          className={`lifestyle-toolbar${!showSearch ? ' lifestyle-toolbar--solo-cta' : ''}`}
        >
          {showSearch ? (
            <label className="lifestyle-search">
              <SearchIcon className="lifestyle-search-icon" aria-hidden="true" />
              <input
                type="search"
                className="lifestyle-search-input"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Buscar por radicado, despacho o parte…"
                aria-label="Buscar procesos judiciales"
              />
            </label>
          ) : null}
          <button
            type="button"
            className="btn-base btn-accent btn-submit crud-primary-cta lifestyle-toolbar-cta"
            onClick={() => void loadProcesos()}
            disabled={isLoading}
            aria-busy={isLoading}
            aria-label="Actualizar procesos judiciales"
          >
            <RefreshIcon aria-hidden="true" />
            {isLoading ? 'Actualizando…' : 'Actualizar procesos'}
          </button>
        </div>

        {isLoading && procesos.length === 0 ? (
          <div className="glass-group">
            <ListSkeleton variant="inset-row" count={4} aria-label="Cargando procesos" />
          </div>
        ) : error ? (
          <div className="loader-container">
            <div className="loader finanzas-stats-error-panel">
              <p className="loader-text loader-text--error" role="alert">
                {error}
              </p>
              {error.includes('Ajustes') ? (
                <button
                  type="button"
                  className="btn-base btn-secondary finanzas-stats-retry-button"
                  onClick={() => navigate('/ajustes')}
                  aria-label="Ir a Ajustes"
                >
                  <span>Ir a Ajustes</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-base btn-secondary finanzas-stats-retry-button"
                  onClick={() => void loadProcesos()}
                  aria-label="Reintentar cargar procesos"
                >
                  <span>Reintentar</span>
                </button>
              )}
            </div>
          </div>
        ) : procesos.length === 0 ? (
          <div className="procesos-empty-state">
            <DescriptionIcon className="empty-state-icon" />
            <p className="empty-state-text">No se encontraron procesos judiciales</p>
            <p className="empty-state-subtext">
              Los procesos se consultan con tu nombre completo configurado en Ajustes. Usa Actualizar
              procesos para volver a consultar la Rama Judicial.
            </p>
          </div>
        ) : filteredProcesos.length === 0 ? (
          <div className="procesos-empty-state procesos-empty-state--filtered">
            <DescriptionIcon className="empty-state-icon" />
            <p className="empty-state-text">Ningún proceso coincide con el filtro</p>
            <p className="empty-state-subtext">
              Prueba otro término de búsqueda o cambia el filtro seleccionado.
            </p>
          </div>
        ) : (
          <div className="procesos-list">
            <div className="glass-group">
              {filteredProcesos.map(proceso => {
                const userRolesLabel = formatUserRolesLabel(proceso.userRoles)
                return (
                  <button
                    key={proceso.id}
                    className="crud-inset-row crud-row-accent-indigo"
                    onClick={() => void handleOpenDetailModal(proceso)}
                    type="button"
                  >
                    <div className="crud-row-content">
                      <div className="crud-row-header">
                        <div className="crud-row-title-section">
                          <div
                            className="crud-row-meta-indicator"
                            style={{ backgroundColor: getEstadoColor(proceso.estado) }}
                          />
                          <div className="procesos-item-info">
                            <div className="crud-row-title-row">
                              <h3 className="crud-row-title">{proceso.numero}</h3>
                              {proceso.isTracked ? (
                                <NotificationsActiveIcon
                                  className="procesos-item-tracking-icon"
                                  titleAccess="En seguimiento"
                                />
                              ) : null}
                              {proceso.badge ? (
                                <span
                                  className={`procesos-item-badge procesos-item-badge-${proceso.badge.toLowerCase()}`}
                                >
                                  {proceso.badge}
                                </span>
                              ) : null}
                            </div>
                            <span className="crud-row-meta">{proceso.despacho}</span>
                          </div>
                        </div>
                        <ChevronRightIcon className="crud-row-chevron" />
                      </div>
                      {userRolesLabel ? (
                        <p className="procesos-item-role">Tu rol: {userRolesLabel}</p>
                      ) : null}
                      {proceso.sujetosProcesales ? (
                        <p className="crud-row-preview">{proceso.sujetosProcesales}</p>
                      ) : null}
                      <div className="crud-row-meta">
                        <span
                          className="crud-row-meta"
                          style={{ color: getEstadoColor(proceso.estado) }}
                        >
                          {proceso.estado}
                        </span>
                        <span className="crud-row-separator">•</span>
                        <span className="crud-row-meta">
                          Última actuación {formatRelativeDate(proceso.fechaUltimaActuacion)}
                        </span>
                      </div>
                      <div className="crud-row-meta">
                        <span className="crud-row-meta">{proceso.departamento}</span>
                        <span className="crud-row-separator">•</span>
                        <span className="crud-row-meta">
                          Inicio {formatProcesoDate(proceso.fechaInicio)}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            {hasMorePages ? (
              <button
                type="button"
                className="btn-base btn-secondary btn-block procesos-load-more"
                onClick={() => void loadProcesos({ page: currentPage + 1, append: true })}
                disabled={isLoadingMore}
                aria-busy={isLoadingMore}
              >
                {isLoadingMore ? 'Cargando más procesos…' : 'Cargar más procesos'}
              </button>
            ) : null}
          </div>
        )}

        {isDetailModalOpen && selectedProceso ? (
          <ProcesoDetailModal
            proceso={selectedProceso}
            actuaciones={actuaciones}
            isLoadingActuaciones={isLoadingActuaciones}
            actuacionesError={actuacionesError}
            isTrackingBusy={isTrackingBusy}
            onClose={handleCloseDetailModal}
            onRefreshActuaciones={() =>
              void loadActuacionesForProceso(selectedProceso.idProceso, { bypassCache: true })
            }
            onToggleTracking={() => void handleToggleTracking(selectedProceso)}
            onCopyNumero={() => void handleCopyNumero()}
          />
        ) : null}
      </div>
    </div>
  )
}

export default Procesos
