import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import DescriptionIcon from '@mui/icons-material/Description'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedProceso, setSelectedProceso] = useState<Proceso | null>(null)
  const [actuaciones, setActuaciones] = useState<Actuacion[]>([])
  const [isLoadingActuaciones, setIsLoadingActuaciones] = useState(false)
  const [nombreCompleto, setNombreCompleto] = useState<string>('')
  const [trackingMap, setTrackingMap] = useState<Map<number, { id: string; is_active: boolean }>>(
    new Map()
  )
  const [isLoadingTracking, setIsLoadingTracking] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadData = async () => {
      await loadTracking()
      await loadProcesos()
    }
    loadData()
  }, [])

  const loadTracking = async () => {
    try {
      setIsLoadingTracking(true)
      const response = await api.getProcessTracking(true) // Solo activos

      if (response.tracking && Array.isArray(response.tracking)) {
        const map = new Map<number, { id: string; is_active: boolean }>()
        response.tracking.forEach((track: any) => {
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
      return new Map()
    } catch (err) {
      // Silenciar errores de tracking, no es crítico
      return new Map()
    } finally {
      setIsLoadingTracking(false)
    }
  }

  const loadProcesos = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Obtener nombre completo del usuario
      // Por ahora usamos un valor por defecto, pero debería venir del perfil del usuario
      // TODO: Obtener nombre completo desde el perfil del usuario
      const nombre = nombreCompleto || 'Rafael Augusto Avella Pena'

      if (!nombre || nombre.trim() === '') {
        setError('No se ha configurado el nombre completo del usuario')
        setIsLoading(false)
        return
      }

      const response = await api.getJudicialProcesses(nombre, 'nat', false, 1)

      if (response.procesos && Array.isArray(response.procesos)) {
        const procesosFiltrados = response.procesos.filter(
          (proc: ProcesoAPI) => proc.idProceso && !isNaN(Number(proc.idProceso))
        )

        // Obtener tracking actualizado si no está cargado
        let currentTrackingMap = trackingMap
        if (currentTrackingMap.size === 0) {
          currentTrackingMap = await loadTracking()
        }

        // Mapear procesos y cargar actuaciones para verificar negaciones/rechazos
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
              if (
                actuacionesResponse.actuaciones &&
                Array.isArray(actuacionesResponse.actuaciones)
              ) {
                // Buscar en todas las actuaciones
                for (const act of actuacionesResponse.actuaciones) {
                  const actuacionText =
                    `${act.actuacion || ''} ${act.anotacion || ''}`.toLowerCase()

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
                  if (actuacionText.includes('rechaza') || actuacionText.includes('rechazo')) {
                    badge = 'Rechazado'
                    // No hacer break aquí, seguir buscando por si hay "auto rechaza demanda"
                  }

                  // Buscar negaciones
                  if (actuacionText.includes('niega') || actuacionText.includes('deneg')) {
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
          return (
            new Date(b.fechaUltimaActuacion).getTime() - new Date(a.fechaUltimaActuacion).getTime()
          )
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
  }

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isMenuOpen && !target.closest('.procesos-toolbar-menu-container')) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

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
        setProcesos(prev =>
          prev.map(p =>
            p.idProceso === proceso.idProceso
              ? { ...p, isTracked: false, trackingId: undefined }
              : p
          )
        )

        // Actualizar proceso seleccionado si es el mismo
        if (selectedProceso?.idProceso === proceso.idProceso) {
          setSelectedProceso({
            ...selectedProceso,
            isTracked: false,
            trackingId: undefined,
          })
        }
      } else {
        // Agregar al seguimiento
        const nombre = nombreCompleto || 'Rafael Augusto Avella Pena'
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
        setProcesos(prev =>
          prev.map(p =>
            p.idProceso === proceso.idProceso
              ? { ...p, isTracked: true, trackingId: response.tracking?.id }
              : p
          )
        )

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
      <div className="app-page-content procesos-content">
        {/* Toolbar */}
        <div className="procesos-toolbar">
          <button
            className="procesos-toolbar-button"
            onClick={() => navigate('/justicia')}
            aria-label="Volver"
            type="button"
          >
            <ArrowBackIcon className="procesos-toolbar-icon" />
          </button>

          <div className="procesos-toolbar-menu-container" ref={menuRef}>
            <button
              className="procesos-toolbar-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Opciones"
              aria-expanded={isMenuOpen}
              type="button"
            >
              <MoreVertIcon className="procesos-toolbar-icon" />
            </button>
            {isMenuOpen && (
              <div className="procesos-menu">
                <button
                  className="procesos-menu-item"
                  onClick={() => {
                    setIsMenuOpen(false)
                    loadProcesos()
                  }}
                  type="button"
                  disabled={isLoading}
                >
                  <RefreshIcon className="procesos-menu-icon" />
                  <span>Actualizar</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <h1 className="procesos-page-title">Procesos</h1>
        <p className="procesos-page-subtitle">Gestiona tus procesos legales y jurídicos</p>

        {/* Lista de Procesos */}
        {isLoading ? (
          <div className="procesos-empty-state">
            <p>Cargando procesos...</p>
          </div>
        ) : error ? (
          <div className="procesos-empty-state">
            <p>{error}</p>
          </div>
        ) : procesos.length === 0 ? (
          <div className="procesos-empty-state">
            <DescriptionIcon className="empty-state-icon" />
            <p className="empty-state-text">No hay procesos registrados aún.</p>
          </div>
        ) : (
          <div className="procesos-list">
            <div className="procesos-group">
              {procesos.map(proceso => (
                <button
                  key={proceso.id}
                  className="procesos-item"
                  onClick={() => handleOpenDetailModal(proceso)}
                  type="button"
                >
                  <div className="procesos-item-content">
                    <div className="procesos-item-header">
                      <div className="procesos-item-title-section">
                        <div
                          className="procesos-item-estado-indicator"
                          style={{ backgroundColor: getEstadoColor(proceso.estado) }}
                        />
                        <div className="procesos-item-info">
                          <div className="procesos-item-title-row">
                            <h3 className="procesos-item-title">{proceso.numero}</h3>
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
                          <span className="procesos-item-tipo">{proceso.despacho}</span>
                        </div>
                      </div>
                      <ChevronRightIcon className="procesos-item-chevron" />
                    </div>
                    {proceso.sujetosProcesales && (
                      <p className="procesos-item-description">{proceso.sujetosProcesales}</p>
                    )}
                    <div className="procesos-item-meta">
                      <span
                        className="procesos-item-estado"
                        style={{ color: getEstadoColor(proceso.estado) }}
                      >
                        {proceso.estado}
                      </span>
                      <span className="procesos-item-separator">•</span>
                      <span className="procesos-item-date">
                        Última actuación: {formatDate(proceso.fechaUltimaActuacion)}
                      </span>
                    </div>
                    <div className="procesos-item-meta">
                      <span className="procesos-item-departamento">{proceso.departamento}</span>
                      <span className="procesos-item-separator">•</span>
                      <span className="procesos-item-date">
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
          <div className="procesos-modal-overlay" onClick={handleCloseDetailModal}>
            <div className="procesos-modal" onClick={e => e.stopPropagation()}>
              <div className="procesos-modal-header">
                <h2 className="procesos-modal-title">Detalle del Proceso</h2>
                <button
                  className="procesos-modal-close-button"
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
                      Recibirás notificaciones automáticas cuando haya nuevas actuaciones en este
                      proceso.
                    </p>
                  )}
                </div>

                {/* Actuaciones */}
                <div className="procesos-detail-section">
                  <h3 className="procesos-detail-label">Actuaciones</h3>
                  {isLoadingActuaciones ? (
                    <p className="procesos-detail-value">Cargando actuaciones...</p>
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
          </div>
        )}
      </div>
    </div>
  )
}

export default Procesos
