import { useState, useEffect, useCallback, useMemo } from 'react'
import { backToHubLabel } from '../constants/hubLabels'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import RefreshIcon from '@mui/icons-material/Refresh'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DescriptionIcon from '@mui/icons-material/Description'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import { fetchUserFullName } from '../utils/userFullName'
import './AppPage.css'
import ModalOverlay from '../components/ModalOverlay'
import ListSkeleton from '../components/ListSkeleton'
import './Procesos.css'

interface ProcesoAPI {
  idProceso: number
  idConexion: number
  llaveProceso: string
  fechaProceso: string
  fechaUltimaActuacion: string
  despacho: string
  departamento: string
  sujetosProcesales: string
  esPrivado: boolean
  cantFilas: number
}

interface Proceso {
  id: string
  idProceso: number
  numero: string
  despacho: string
  departamento: string
  sujetosProcesales: string
  fechaInicio: string
  fechaUltimaActuacion: string
  estado: string
  badge?: 'Negado' | 'Rechazado' | null
  trackingId?: string // ID del tracking si está en seguimiento
  isTracked?: boolean // Si está siendo seguido
}

interface ActuacionAPI {
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

interface Actuacion {
  id: number
  numero: number
  fecha: string
  tipo: string
  anotacion: string | null
  fechaInicial: string | null
  fechaFinal: string | null
  fechaRegistro: string
  conDocumentos: boolean
}

function Procesos() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [procesos, setProcesos] = useState<Proceso[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedProceso, setSelectedProceso] = useState<Proceso | null>(null)
  const [actuaciones, setActuaciones] = useState<Actuacion[]>([])
  const [isLoadingActuaciones, setIsLoadingActuaciones] = useState(false)
  const [nombreCompleto, setNombreCompleto] = useState<string>('')
  const [trackingMap, setTrackingMap] = useState<Map<number, { id: string; is_active: boolean }>>(new Map())

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

  const loadProcesos = useCallback(async () => {
    try {
      setIsLoading(true)
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
        return
      }

      const response = await api.getJudicialProcesses(nombre, 'nat', false, 1)

      if (response.procesos && Array.isArray(response.procesos)) {
        const procesosFiltrados = response.procesos.filter(
          (proc: ProcesoAPI) => proc.idProceso && !isNaN(Number(proc.idProceso))
        )

        const currentTrackingMap = await loadTracking()

        const procesosMapeados: Proceso[] = await Promise.all(
          procesosFiltrados.map(async (proc: ProcesoAPI) => {
            // Determinar estado basado en la fecha de última actuación
            const fechaUltimaActuacion = new Date(proc.fechaUltimaActuacion)
            const hoy = new Date()
            const diasDesdeUltimaActuacion = Math.floor(
              (hoy.getTime() - fechaUltimaActuacion.getTime()) / (1000 * 60 * 60 * 24)
            )

            let estado = 'En trámite'
            if (diasDesdeUltimaActuacion > 365) {
              estado = 'Archivado'
            } else if (diasDesdeUltimaActuacion > 180) {
              estado = 'Suspendido'
            }

            const idProceso = Number(proc.idProceso)
            if (isNaN(idProceso) || idProceso <= 0) {
              throw new Error(`ID de proceso inválido: ${proc.idProceso}`)
            }

            // Verificar actuaciones para detectar negaciones/rechazos
            let badge: 'Negado' | 'Rechazado' | null = null
            try {
              const actuacionesResponse = await api.getProcessActuaciones(idProceso, 1)
              if (actuacionesResponse.actuaciones && Array.isArray(actuacionesResponse.actuaciones)) {
                // Buscar en todas las actuaciones
                for (const act of actuacionesResponse.actuaciones) {
                  const actuacionText = `${act.actuacion || ''} ${act.anotacion || ''}`.toLowerCase()
                  
                  // Priorizar "AUTO RECHAZA DEMANDA" primero
                  if (
                    actuacionText.includes('auto rechaza demanda') ||
                    actuacionText.includes('auto rechaza') ||
                    (act.actuacion?.toLowerCase().includes('auto') && 
                     act.actuacion?.toLowerCase().includes('rechaza') &&
                     act.actuacion?.toLowerCase().includes('demanda'))
                  ) {
                    badge = 'Rechazado'
                    break // Prioridad máxima, salir del loop
                  }
                  
                  // Luego buscar otras variantes de rechazo
                  if (
                    actuacionText.includes('rechaza') ||
                    actuacionText.includes('rechazo')
                  ) {
                    badge = 'Rechazado'
                    // No hacer break aquí, seguir buscando por si hay "auto rechaza demanda"
                  }
                  
                  // Buscar negaciones
                  if (
                    actuacionText.includes('niega') ||
                    actuacionText.includes('deneg')
                  ) {
                    // Solo asignar "Negado" si no hay rechazo previo
                    if (!badge) {
                      badge = 'Negado'
                    }
                  }
                }
              }
            } catch (err) {
              // Si falla cargar actuaciones, continuar sin badge
              // No es crítico para mostrar el proceso
            }

            // Verificar si está en seguimiento
            const tracking = currentTrackingMap.get(idProceso)
            
            return {
              id: idProceso.toString(),
              idProceso: idProceso,
              numero: proc.llaveProceso,
              despacho: proc.despacho.trim(),
              departamento: proc.departamento,
              sujetosProcesales: proc.sujetosProcesales,
              fechaInicio: proc.fechaProceso,
              fechaUltimaActuacion: proc.fechaUltimaActuacion,
              estado,
              badge,
              trackingId: tracking?.id,
              isTracked: tracking?.is_active || false,
            }
          })
        )

        // Ordenar por fecha de última actuación (más recientes primero)
        procesosMapeados.sort((a, b) => {
          return new Date(b.fechaUltimaActuacion).getTime() - new Date(a.fechaUltimaActuacion).getTime()
        })

        setProcesos(procesosMapeados)
      } else {
        setProcesos([])
      }
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al cargar los procesos judiciales. Por favor, intenta de nuevo.'
      )
      setError(errorMessage)
      showNotification(errorMessage, 'error')
      setProcesos([])
    } finally {
      setIsLoading(false)
    }
  }, [nombreCompleto, showNotification, loadTracking])

  useEffect(() => {
    void loadProcesos()
  }, [loadProcesos])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getEstadoColor = (estado: string) => {
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

  const handleOpenDetailModal = async (proceso: Proceso) => {
    // Validar que idProceso existe y es un número válido
    const idProceso = proceso.idProceso
    if (!idProceso || isNaN(Number(idProceso)) || idProceso <= 0) {
      showNotification('Error: No se pudo obtener el ID del proceso', 'error')
      return
    }

    setSelectedProceso(proceso)
    setIsDetailModalOpen(true)
    setIsLoadingActuaciones(true)
    setActuaciones([])

    try {
      const response = await api.getProcessActuaciones(Number(idProceso), 1)
      
      if (response.actuaciones && Array.isArray(response.actuaciones)) {
        const actuacionesMapeadas: Actuacion[] = response.actuaciones.map((act: ActuacionAPI) => ({
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
        setActuaciones(actuacionesMapeadas)
      }
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al cargar las actuaciones del proceso.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoadingActuaciones(false)
    }
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedProceso(null)
    setActuaciones([])
  }

  const handleToggleTracking = async (proceso: Proceso, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }

    try {
      if (proceso.isTracked && proceso.trackingId) {
        // Remover del seguimiento
        await api.removeProcessTracking(proceso.trackingId)
        showNotification('Proceso removido del seguimiento', 'success')
        
        // Actualizar tracking map
        const newMap = new Map(trackingMap)
        newMap.delete(proceso.idProceso)
        setTrackingMap(newMap)
        
        // Actualizar proceso en la lista
        setProcesos(prev => prev.map(p => 
          p.idProceso === proceso.idProceso 
            ? { ...p, isTracked: false, trackingId: undefined }
            : p
        ))
        
        // Actualizar proceso seleccionado si es el mismo
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
        
        showNotification('Proceso agregado al seguimiento. Recibirás notificaciones de nuevas actuaciones.', 'success')
        
        // Actualizar tracking map
        const newMap = new Map(trackingMap)
        if (response.tracking?.id) {
          newMap.set(proceso.idProceso, {
            id: response.tracking.id,
            is_active: true,
          })
        }
        setTrackingMap(newMap)
        
        // Actualizar proceso en la lista
        setProcesos(prev => prev.map(p => 
          p.idProceso === proceso.idProceso 
            ? { ...p, isTracked: true, trackingId: response.tracking?.id }
            : p
        ))
        
        // Actualizar proceso seleccionado si es el mismo
        if (selectedProceso?.idProceso === proceso.idProceso) {
          setSelectedProceso({
            ...selectedProceso,
            isTracked: true,
            trackingId: response.tracking?.id,
          })
        }
      }
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al actualizar el seguimiento del proceso.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide crud-page-content procesos-content">
        {/* Toolbar */}
        <div className="app-toolbar">
          <button
            className="app-toolbar-button"
            onClick={() => navigate('/justicia')}
            aria-label={backToHubLabel('justicia')}
            type="button"
          >
            <ArrowBackIcon className="app-toolbar-icon" />
          </button>
        </div>

        <h1 className="app-page-title">Procesos</h1>

        <div className="crud-summary-strip" role="region" aria-label="Resumen de procesos">
          <div className="crud-summary-strip-item">
            <span className="crud-summary-strip-label">Total</span>
            <span className="crud-summary-strip-value crud-summary-strip-value--info">
              {stripStats === null ? '…' : stripStats.total}
            </span>
          </div>
          <div className="crud-summary-strip-separator" aria-hidden="true" />
          <div className="crud-summary-strip-item">
            <span className="crud-summary-strip-label">En seguimiento</span>
            <span className="crud-summary-strip-value crud-summary-strip-value--available">
              {stripStats === null ? '…' : stripStats.tracked}
            </span>
          </div>
          <div className="crud-summary-strip-separator" aria-hidden="true" />
          <div className="crud-summary-strip-item">
            <span className="crud-summary-strip-label">En trámite</span>
            <span className="crud-summary-strip-value">
              {stripStats === null ? '…' : stripStats.enTramite}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn-base btn-accent btn-block btn-submit crud-primary-cta"
          onClick={() => void loadProcesos()}
          disabled={isLoading}
          aria-busy={isLoading}
          aria-label="Actualizar procesos judiciales"
        >
          <RefreshIcon aria-hidden="true" />
          {isLoading ? 'Actualizando…' : 'Actualizar procesos'}
        </button>

        {/* Lista de Procesos */}
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
              Los procesos se consultan con tu nombre completo configurado en Ajustes. Usa el botón
              Actualizar arriba para volver a consultar.
            </p>
          </div>
        ) : (
          <div className="procesos-list">
            <div className="glass-group">
              {procesos.map(proceso => (
                <button
                  key={proceso.id}
                  className="crud-inset-row crud-row-accent-indigo"
                  onClick={() => handleOpenDetailModal(proceso)}
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
                            {proceso.isTracked && (
                              <NotificationsActiveIcon 
                                className="procesos-item-tracking-icon" 
                                titleAccess="En seguimiento"
                              />
                            )}
                            {proceso.badge && (
                              <span
                                className={`procesos-item-badge procesos-item-badge-${proceso.badge.toLowerCase()}`}
                              >
                                {proceso.badge}
                              </span>
                            )}
                          </div>
                          <span className="crud-row-meta">{proceso.despacho}</span>
                        </div>
                      </div>
                      <ChevronRightIcon className="crud-row-chevron" />
                    </div>
                    {proceso.sujetosProcesales && (
                      <p className="crud-row-preview">{proceso.sujetosProcesales}</p>
                    )}
                    <div className="crud-row-meta">
                      <span
                        className="crud-row-meta"
                        style={{ color: getEstadoColor(proceso.estado) }}
                      >
                        {proceso.estado}
                      </span>
                      <span className="crud-row-separator">•</span>
                      <span className="crud-row-meta">
                        Última actuación: {formatDate(proceso.fechaUltimaActuacion)}
                      </span>
                    </div>
                    <div className="crud-row-meta">
                      <span className="crud-row-meta">{proceso.departamento}</span>
                      <span className="crud-row-separator">•</span>
                      <span className="crud-row-meta">
                        Inicio: {formatDate(proceso.fechaInicio)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modal de Detalle */}
        {isDetailModalOpen && selectedProceso && (
          <ModalOverlay onClose={handleCloseDetailModal} className="modal-overlay">
            <div className="modal-panel" onClick={e => e.stopPropagation()}>
              <div className="modal-panel-header">
                <h2 className="modal-panel-title" id="modal-panel-title-detalle-del-proceso">Detalle del Proceso</h2>
                <button
                  className="modal-panel-close"
                  onClick={handleCloseDetailModal}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>

              <div className="procesos-detail-content">
                {/* Información del Proceso */}
                <div className="procesos-detail-section">
                  <h3 className="procesos-detail-label">Número de Proceso</h3>
                  <p className="procesos-detail-value">{selectedProceso.numero}</p>
                </div>

                <div className="procesos-detail-section">
                  <h3 className="procesos-detail-label">Despacho</h3>
                  <p className="procesos-detail-value">{selectedProceso.despacho}</p>
                </div>

                <div className="procesos-detail-section">
                  <h3 className="procesos-detail-label">Departamento</h3>
                  <p className="procesos-detail-value">{selectedProceso.departamento}</p>
                </div>

                <div className="procesos-detail-section">
                  <h3 className="procesos-detail-label">Sujetos Procesales</h3>
                  <p className="procesos-detail-value">{selectedProceso.sujetosProcesales}</p>
                </div>

                <div className="procesos-detail-section">
                  <h3 className="procesos-detail-label">Estado</h3>
                  <p
                    className="procesos-detail-value"
                    style={{ color: getEstadoColor(selectedProceso.estado) }}
                  >
                    {selectedProceso.estado}
                  </p>
                </div>

                <div className="procesos-detail-section">
                  <h3 className="procesos-detail-label">Fecha de Inicio</h3>
                  <p className="procesos-detail-value">{formatDate(selectedProceso.fechaInicio)}</p>
                </div>

                <div className="procesos-detail-section">
                  <h3 className="procesos-detail-label">Última Actuación</h3>
                  <p className="procesos-detail-value">
                    {formatDate(selectedProceso.fechaUltimaActuacion)}
                  </p>
                </div>

                {/* Botón de Seguimiento */}
                <div className="procesos-detail-section">
                  <button
                    className={`procesos-tracking-button ${selectedProceso.isTracked ? 'procesos-tracking-button-active' : ''}`}
                    onClick={() => handleToggleTracking(selectedProceso)}
                    type="button"
                  >
                    {selectedProceso.isTracked ? (
                      <>
                        <NotificationsActiveIcon className="procesos-tracking-icon" />
                        <span>Remover del Seguimiento</span>
                      </>
                    ) : (
                      <>
                        <NotificationsOffIcon className="procesos-tracking-icon" />
                        <span>Agregar al Seguimiento</span>
                      </>
                    )}
                  </button>
                  {selectedProceso.isTracked && (
                    <p className="procesos-tracking-note">
                      Recibirás notificaciones automáticas cuando haya nuevas actuaciones en este proceso.
                    </p>
                  )}
                </div>

                {/* Actuaciones */}
                <div className="procesos-detail-section">
                  <h3 className="procesos-detail-label">Actuaciones</h3>
                  {isLoadingActuaciones ? (
                    <ListSkeleton variant="inset-row" count={3} aria-label="Cargando actuaciones" />
                  ) : actuaciones.length === 0 ? (
                    <p className="procesos-detail-value">No hay actuaciones disponibles</p>
                  ) : (
                    <div className="procesos-actuaciones-list">
                      {actuaciones.map(actuacion => (
                        <div key={actuacion.id} className="procesos-actuacion-item">
                          <div className="procesos-actuacion-header">
                            <span className="procesos-actuacion-numero">#{actuacion.numero}</span>
                            <span className="procesos-actuacion-fecha">
                              {formatDate(actuacion.fecha)}
                            </span>
                          </div>
                          <h4 className="procesos-actuacion-tipo">{actuacion.tipo}</h4>
                          {actuacion.anotacion && (
                            <p className="procesos-actuacion-anotacion">{actuacion.anotacion}</p>
                          )}
                          {actuacion.fechaInicial && actuacion.fechaFinal && (
                            <p className="procesos-actuacion-fechas">
                              Período: {formatDate(actuacion.fechaInicial)} -{' '}
                              {formatDate(actuacion.fechaFinal)}
                            </p>
                          )}
                          {actuacion.conDocumentos && (
                            <span className="procesos-actuacion-documentos">📄 Con documentos</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ModalOverlay>
        )}
      </div>
    </div>
  )
}

export default Procesos

