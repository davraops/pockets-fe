import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { api } from '../services/api'
import { isDebugToolsEnabled } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import { emitTransactionSyncEvents } from '../utils/transactionMutation'
import ListSkeleton from '../components/ListSkeleton'
import './AppPage.css'
import './Proyectos.css'

// Interfaz que coincide con la respuesta de la API (campos en inglés)
interface ProjectAPI {
  id: string
  name: string
  target_amount: number
  current_amount: number
  remaining: number
  progress_percentage: number
  start_date: string
  end_date: string
  duration_months: number
  status: 'active' | 'completed' | 'cancelled'
  budget_id?: string | null
  budget?: {
    id: string
    name: string
    max_amount: number
    total_spent: number
  }
  created_at: string
  updated_at: string
}

// Interfaz para uso interno del componente
interface Project {
  id: string
  nombre: string
  montoObjetivo: number
  montoActual: number
  restante: number
  porcentajeProgreso: number
  fechaInicio: string
  fechaFin: string
  duracionMeses: number
  estado: 'active' | 'completed' | 'cancelled'
  presupuestoId?: string | null
}

function Proyectos() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    montoObjetivo: '',
    montoActual: '0',
    duracionMeses: '',
    fechaInicio: '',
    fechaFin: '',
    estado: 'active' as 'active' | 'completed' | 'cancelled',
  })
  const [formErrors, setFormErrors] = useState({
    nombre: '',
    montoObjetivo: '',
    montoActual: '',
    duracionMeses: '',
    fechaInicio: '',
    fechaFin: '',
  })

  // Mapear proyecto de API a formato interno
  const mapProjectFromAPI = (apiProject: ProjectAPI): Project => {
    return {
      id: apiProject.id,
      nombre: apiProject.name,
      montoObjetivo: apiProject.target_amount,
      montoActual: apiProject.current_amount,
      restante: apiProject.remaining,
      porcentajeProgreso: apiProject.progress_percentage,
      fechaInicio: apiProject.start_date,
      fechaFin: apiProject.end_date,
      duracionMeses: apiProject.duration_months,
      estado: apiProject.status,
      presupuestoId: apiProject.budget_id || null,
    }
  }

  const loadProjects = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.getProjects()
      if (response.projects && Array.isArray(response.projects)) {
        const mappedProjects = response.projects.map(mapProjectFromAPI)
        setProjects(mappedProjects)
      } else {
        setProjects([])
      }
    } catch (err: any) {
      console.error('Error al cargar proyectos:', err)
      setError('Frontend says: Error al cargar los proyectos. Por favor, intenta de nuevo.')
      setProjects([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  // Cerrar menú al hacer clic fuera - HIG: Clear Feedback
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      nombre: '',
      montoObjetivo: '',
      montoActual: '0',
      duracionMeses: '',
      fechaInicio: '',
      fechaFin: '',
      estado: 'active',
    })
    setFormErrors({
      nombre: '',
      montoObjetivo: '',
      montoActual: '',
      duracionMeses: '',
      fechaInicio: '',
      fechaFin: '',
    })
  }

  const handleOpenDetailModal = (project: Project) => {
    setSelectedProject(project)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
    setFormData({
      nombre: project.nombre,
      montoObjetivo: project.montoObjetivo.toString(),
      montoActual: project.montoActual.toString(),
      duracionMeses: project.duracionMeses.toString(),
      fechaInicio: project.fechaInicio,
      fechaFin: project.fechaFin,
      estado: project.estado,
    })
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedProject(null)
    setIsEditMode(false)
    setFormData({
      nombre: '',
      montoObjetivo: '',
      montoActual: '0',
      duracionMeses: '',
      fechaInicio: '',
      fechaFin: '',
      estado: 'active',
    })
    setFormErrors({
      nombre: '',
      montoObjetivo: '',
      montoActual: '',
      duracionMeses: '',
      fechaInicio: '',
      fechaFin: '',
    })
  }

  const handleEditClick = () => {
    setIsEditMode(true)
  }

  const handleCompleteClick = async () => {
    if (!selectedProject) return

    if (
      window.confirm(
        `¿Estás seguro de que quieres marcar el proyecto "${selectedProject.nombre}" como completado? El presupuesto asociado será eliminado.`
      )
    ) {
      try {
        setIsLoading(true)

        await api.completeProject(selectedProject.id, { close_budget: true })

        await loadProjects()
        emitTransactionSyncEvents()
        handleCloseDetailModal()
      } catch (err: any) {
        console.error('Error al completar proyecto:', err)
        const errorMessage = getTranslatedErrorMessage(
          err,
          'Error al completar el proyecto. Por favor, intenta de nuevo.'
        )
        showNotification(errorMessage, 'error')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleDeleteClick = async () => {
    if (!selectedProject) return

    if (
      window.confirm(
        `¿Estás seguro de que quieres eliminar el proyecto "${selectedProject.nombre}"?`
      )
    ) {
      try {
        setIsLoading(true)
        await api.deleteProject(
          selectedProject.id,
          selectedProject.presupuestoId ? { delete_budget: 'soft' } : undefined
        )

        await loadProjects()
        emitTransactionSyncEvents()
        handleCloseDetailModal()
      } catch (err: any) {
        console.error('Error al eliminar proyecto:', err)
        const errorMessage = getTranslatedErrorMessage(
          err,
          'Error al eliminar el proyecto. Por favor, intenta de nuevo.'
        )
        showNotification(errorMessage, 'error')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const validateForm = async (): Promise<boolean> => {
    const errors = {
      nombre: '',
      montoObjetivo: '',
      montoActual: '',
      duracionMeses: '',
      fechaInicio: '',
      fechaFin: '',
    }
    let isValid = true

    // Validar nombre
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido'
      isValid = false
    }

    // Validar monto objetivo
    const montoObjetivo = parseFloat(formData.montoObjetivo)
    if (!formData.montoObjetivo.trim() || isNaN(montoObjetivo) || montoObjetivo <= 0) {
      errors.montoObjetivo = 'El monto objetivo debe ser un número positivo'
      isValid = false
    }

    // Validar monto actual
    const montoActual = parseFloat(formData.montoActual)
    if (formData.montoActual.trim() && (isNaN(montoActual) || montoActual < 0)) {
      errors.montoActual = 'El monto actual debe ser un número positivo o cero'
      isValid = false
    }

    // Validar que monto actual no exceda monto objetivo
    if (!errors.montoObjetivo && !errors.montoActual && montoActual > montoObjetivo) {
      errors.montoActual = 'El monto actual no puede exceder el monto objetivo'
      isValid = false
    }

    // Validar duración en meses (máximo 9 meses)
    const duracionMeses = parseInt(formData.duracionMeses)
    if (!formData.duracionMeses.trim() || isNaN(duracionMeses) || duracionMeses < 1) {
      errors.duracionMeses = 'La duración debe ser al menos 1 mes'
      isValid = false
    } else if (duracionMeses > 9) {
      errors.duracionMeses =
        'La duración máxima es de 9 meses (después de eso el dinero sufre depreciación por inflación). Si planeas ahorrar más de 1 año, lo más recomendable es poner el dinero en uno o varios CDT a más de la tasa inflacionaria.'
      isValid = false
    }

    // Validar fechas
    if (!formData.fechaInicio) {
      errors.fechaInicio = 'La fecha de inicio es requerida'
      isValid = false
    }

    if (!formData.fechaFin) {
      errors.fechaFin = 'La fecha de fin es requerida'
      isValid = false
    }

    // Validar que fecha fin sea posterior a fecha inicio
    if (formData.fechaInicio && formData.fechaFin) {
      const fechaInicio = new Date(formData.fechaInicio)
      const fechaFin = new Date(formData.fechaFin)
      if (fechaFin <= fechaInicio) {
        errors.fechaFin = 'La fecha de fin debe ser posterior a la fecha de inicio'
        isValid = false
      }

      // Validar que la duración coincida con las fechas
      if (!errors.duracionMeses && !errors.fechaInicio && !errors.fechaFin) {
        const diffTime = Math.abs(fechaFin.getTime() - fechaInicio.getTime())
        const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30))
        if (Math.abs(diffMonths - duracionMeses) > 1) {
          errors.duracionMeses = `La duración debe coincidir aproximadamente con las fechas seleccionadas (${diffMonths} meses)`
          isValid = false
        }
      }
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const isValid = await validateForm()
    if (!isValid) {
      return
    }

    try {
      if (isEditMode && selectedProject) {
        // Editar proyecto existente
        const previousStatus = selectedProject.estado
        const newStatus = formData.estado

        const montoObjetivo = parseFloat(formData.montoObjetivo)
        const duracionMeses = parseInt(formData.duracionMeses)
        const nuevaMetaMensual = montoObjetivo / duracionMeses

        const projectData: any = {
          name: formData.nombre.trim(),
          target_amount: montoObjetivo,
          current_amount: parseFloat(formData.montoActual) || 0,
          duration_months: duracionMeses,
          start_date: formData.fechaInicio,
          end_date: formData.fechaFin,
          status: newStatus,
        }

        if (previousStatus !== 'completed' && newStatus === 'completed') {
          const { status: _status, ...projectFields } = projectData
          await api.updateProject(selectedProject.id, projectFields)
          await api.completeProject(selectedProject.id, {
            close_budget: Boolean(selectedProject.presupuestoId),
          })
        } else {
          if (selectedProject.presupuestoId && newStatus !== 'completed') {
            try {
              await api.updateBudget(selectedProject.presupuestoId, {
                max_amount: nuevaMetaMensual,
              })
            } catch (budgetErr: any) {
              console.error('Error al actualizar presupuesto:', budgetErr)
            }
          }

          await api.updateProject(selectedProject.id, projectData)
        }

        await loadProjects()
        if (previousStatus !== 'completed' && newStatus === 'completed') {
          emitTransactionSyncEvents()
        }
        handleCloseDetailModal()
      } else {
        // Agregar nuevo proyecto
        // Calcular la meta de ahorro mensual (monto objetivo / duración en meses)
        const montoObjetivo = parseFloat(formData.montoObjetivo)
        const duracionMeses = parseInt(formData.duracionMeses)
        const metaMensual = montoObjetivo / duracionMeses

        await api.createProjectWithBudget({
          budget: {
            name: formData.nombre.trim(),
            max_amount: metaMensual,
          },
          project: {
            name: formData.nombre.trim(),
            target_amount: montoObjetivo,
            current_amount: parseFloat(formData.montoActual) || 0,
            duration_months: duracionMeses,
            start_date: formData.fechaInicio,
            end_date: formData.fechaFin,
          },
        })

        await loadProjects()
        handleCloseModal()
      }
    } catch (err: any) {
      console.error('Error al guardar proyecto:', err)
      const errorMessage =
        err.data?.error || err.message
          ? `Backend says: ${err.data?.error || err.message}`
          : 'Frontend says: Error al guardar el proyecto. Por favor, intenta de nuevo.'
      alert(errorMessage)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    // Manejar el campo de estado con tipo correcto
    if (name === 'estado') {
      setFormData({
        ...formData,
        [name]: value as 'active' | 'completed' | 'cancelled',
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }

    // Limpiar errores cuando el usuario empiece a escribir
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      })
    }
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Calcular highlights - HIG: Relevant Information
  const calculateHighlights = () => {
    const totalProyectos = projects.length
    const proyectosActivos = projects.filter(p => p.estado === 'active').length
    const proyectosCompletados = projects.filter(p => p.estado === 'completed').length
    const totalAhorrado = projects.reduce((total, p) => total + p.montoActual, 0)
    const totalObjetivo = projects.reduce((total, p) => total + p.montoObjetivo, 0)
    const porcentajePromedio =
      projects.length > 0
        ? projects.reduce((sum, p) => sum + p.porcentajeProgreso, 0) / projects.length
        : 0

    return {
      totalProyectos,
      proyectosActivos,
      proyectosCompletados,
      totalAhorrado,
      totalObjetivo,
      porcentajePromedio,
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#34C759'
      case 'cancelled':
        return '#FF3B30'
      default:
        return '#00C7BE'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado'
      case 'cancelled':
        return 'Cancelado'
      default:
        return 'Activo'
    }
  }

  // Función de debug para crear proyectos de prueba
  const handleDebugCreateProjects = async () => {
    const testProjects = [
      {
        name: 'Viaje a Europa',
        target_amount: 5000000,
        duration_months: 6,
        end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        start_date: new Date().toISOString().split('T')[0],
        current_amount: 1500000,
      },
      {
        name: 'Laptop Nueva',
        target_amount: 3000000,
        duration_months: 3,
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        start_date: new Date().toISOString().split('T')[0],
        current_amount: 500000,
      },
      {
        name: 'Fondo de Emergencia',
        target_amount: 10000000,
        duration_months: 9,
        end_date: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        start_date: new Date().toISOString().split('T')[0],
        current_amount: 2000000,
      },
    ]

    try {
      setIsLoading(true)
      for (const project of testProjects) {
        const metaMensual = project.target_amount / project.duration_months
        await api.createProjectWithBudget({
          budget: {
            name: project.name,
            max_amount: metaMensual,
          },
          project: {
            name: project.name,
            target_amount: project.target_amount,
            duration_months: project.duration_months,
            start_date: project.start_date,
            end_date: project.end_date,
            current_amount: project.current_amount,
          },
        })
      }
      await loadProjects()
      setIsDebugModalOpen(false)
      showNotification(
        `${testProjects.length} proyectos de prueba creados exitosamente (con sus presupuestos asociados)`,
        'success'
      )
    } catch (err: any) {
      console.error('Error al crear proyectos de prueba:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al crear los proyectos de prueba. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Función de debug para borrar todos los proyectos
  const handleDeleteAllProjects = async () => {
    if (
      window.confirm(
        '¿Estás seguro de que quieres eliminar TODOS los proyectos? Esta acción es IRREVERSIBLE.'
      )
    ) {
      try {
        setIsLoading(true)
        await api.deleteAllProjects()
        // Recargar proyectos después de borrar todas
        const response = await api.getProjects()
        if (response.projects && Array.isArray(response.projects)) {
          const mappedProjects = response.projects.map(mapProjectFromAPI)
          setProjects(mappedProjects)
        }
        setIsDebugModalOpen(false)
        showNotification('Todos los proyectos han sido eliminados exitosamente', 'success')
      } catch (err: any) {
        console.error('Error al eliminar todos los proyectos:', err)
        const errorMessage = getTranslatedErrorMessage(
          err,
          'Error al eliminar los proyectos. Por favor, intenta de nuevo.'
        )
        showNotification(errorMessage, 'error')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const highlights = calculateHighlights()

  return (
    <>
      <div className="app-page-container">
        <div className="app-page-content app-page-content-wide crud-page-content proyectos-content">
          {isLoading && projects.length === 0 ? (
            <>
              <div className="app-toolbar">
                <button
                  className="app-toolbar-button"
                  onClick={() => navigate('/finanzas')}
                  aria-label="Volver a Finanzas"
                  type="button"
                >
                  <ArrowBackIcon className="app-toolbar-icon" />
                </button>
              </div>
              <h1 className="app-page-title">Proyectos</h1>
              <div className="crud-card-list">
                <ListSkeleton variant="inset-row" count={4} aria-label="Cargando proyectos" />
              </div>
            </>
          ) : error && projects.length === 0 ? (
            <>
              <div className="app-toolbar">
                <button
                  className="app-toolbar-button"
                  onClick={() => navigate('/finanzas')}
                  aria-label="Volver a Finanzas"
                  type="button"
                >
                  <ArrowBackIcon className="app-toolbar-icon" />
                </button>
              </div>
              <h1 className="app-page-title">Proyectos</h1>
              <div className="loader-container">
                <div className="loader finanzas-stats-error-panel">
                  <p className="loader-text loader-text--error" role="alert">
                    {error}
                  </p>
                  <button
                    type="button"
                    className="btn-base btn-secondary finanzas-stats-retry-button"
                    onClick={() => void loadProjects()}
                    aria-label="Reintentar cargar proyectos"
                  >
                    <span>Reintentar</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="app-toolbar">
                <button
                  className="app-toolbar-button"
                  onClick={() => navigate('/finanzas')}
                  aria-label="Volver a Finanzas"
                  type="button"
                >
                  <ArrowBackIcon className="app-toolbar-icon" />
                </button>
                <div className="app-toolbar-menu-container" ref={menuRef}>
                  {isDebugToolsEnabled() && (
                    <>
                      <button
                        className="app-toolbar-button"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Opciones de depuración"
                        aria-expanded={isMenuOpen}
                        type="button"
                      >
                        <MoreVertIcon className="app-toolbar-icon" />
                      </button>
                      {isMenuOpen && (
                        <div className="crud-dropdown-menu">
                          <button
                            className="crud-dropdown-menu-item"
                            onClick={() => {
                              setIsDebugModalOpen(true)
                              setIsMenuOpen(false)
                            }}
                            type="button"
                          >
                            <span>🐛 Debug</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <h1 className="app-page-title">Proyectos</h1>

              <div
                className="crud-summary-strip crud-summary-strip--success"
                role="region"
                aria-label="Resumen de proyectos"
              >
                <div className="crud-summary-strip-item">
                  <span className="crud-summary-strip-label">Total</span>
                  <span className="crud-summary-strip-value crud-summary-strip-value--info">
                    {highlights.totalProyectos}
                  </span>
                </div>
                <div className="crud-summary-strip-separator" aria-hidden="true" />
                <div className="crud-summary-strip-item">
                  <span className="crud-summary-strip-label">Activos</span>
                  <span className="crud-summary-strip-value crud-summary-strip-value--available">
                    {highlights.proyectosActivos}
                  </span>
                </div>
                <div className="crud-summary-strip-separator" aria-hidden="true" />
                <div className="crud-summary-strip-item crud-summary-strip-item--emphasis">
                  <span className="crud-summary-strip-label">Ahorrado</span>
                  <span className="crud-summary-strip-value crud-summary-strip-value--income">
                    {formatPrice(highlights.totalAhorrado)}
                  </span>
                </div>
                <div className="crud-summary-strip-separator" aria-hidden="true" />
                <div className="crud-summary-strip-item">
                  <span className="crud-summary-strip-label">Progreso prom.</span>
                  <span className="crud-summary-strip-value crud-summary-strip-value--info">
                    {highlights.porcentajePromedio.toFixed(1)}%
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="btn-base btn-accent btn-block btn-submit crud-primary-cta"
                onClick={handleOpenModal}
                aria-label="Agregar proyecto"
              >
                <AddIcon aria-hidden={true} />
                Agregar proyecto
              </button>

              {projects.length === 0 ? (
                <div className="empty-state">
                  <FolderSpecialIcon className="empty-state-icon" />
                  <p className="empty-text">No hay proyectos agregados</p>
                  <p className="empty-subtext">Usa el botón de arriba para agregar el primero (máx. 9 meses)</p>
                </div>
              ) : (
                <div className="crud-card-list">
                  {projects.map(project => {
                    const statusColor = getStatusColor(project.estado)
                    return (
                      <button
                        key={project.id}
                        className="crud-card-row crud-card-row--project proyecto-row"
                        onClick={() => handleOpenDetailModal(project)}
                        type="button"
                        aria-label={`Ver detalles de ${project.nombre}`}
                      >
                        <div className="proyecto-row-content">
                          <div className="proyecto-row-main">
                            <span className="proyecto-row-title">{project.nombre}</span>
                            <span className="proyecto-row-subtitle" style={{ color: statusColor }}>
                              {getStatusText(project.estado)}
                            </span>
                          </div>
                          <div className="proyecto-row-secondary">
                            <div className="proyecto-row-progress">
                              <div className="proyecto-row-progress-bar">
                                <div
                                  className="proyecto-row-progress-fill"
                                  style={{
                                    width: `${Math.min(project.porcentajeProgreso, 100)}%`,
                                    backgroundColor: statusColor,
                                  }}
                                />
                              </div>
                              <span className="proyecto-row-progress-text">
                                {project.porcentajeProgreso.toFixed(1)}%
                              </span>
                            </div>
                            <span className="proyecto-row-amount">
                              {formatPrice(project.montoActual)} /{' '}
                              {formatPrice(project.montoObjetivo)}
                            </span>
                            <span className="proyecto-row-restante">
                              Restante: {formatPrice(project.restante)}
                            </span>
                            <span className="proyecto-row-duration">
                              {project.duracionMeses} mes{project.duracionMeses !== 1 ? 'es' : ''}
                            </span>
                          </div>
                        </div>
                        <ChevronRightIcon className="proyecto-row-chevron" aria-hidden="true" />
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal para agregar proyecto */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nuevo Proyecto de Ahorro</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group-base">
                <label htmlFor="nombre" className="form-label-base">Nombre del Proyecto</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Viaje a Europa"
                  className={`form-input-base ${formErrors.nombre ? 'input-error' : ''}`}
                />
                {formErrors.nombre && <span className="error-message">{formErrors.nombre}</span>}
              </div>
              <div className="form-group-base">
                <label htmlFor="montoObjetivo" className="form-label-base">Monto Objetivo (COP)</label>
                <input
                  type="number"
                  id="montoObjetivo"
                  name="montoObjetivo"
                  value={formData.montoObjetivo}
                  onChange={handleChange}
                  required
                  min="1"
                  step="1000"
                  placeholder="5000000"
                  className={`form-input-base ${formErrors.montoObjetivo ? 'input-error' : ''}`}
                />
                {formErrors.montoObjetivo && (
                  <span className="error-message">{formErrors.montoObjetivo}</span>
                )}
                {formData.montoObjetivo &&
                  formData.duracionMeses &&
                  !formErrors.montoObjetivo &&
                  !formErrors.duracionMeses && (
                    <p
                      className="form-hint"
                      style={{ color: 'rgba(0, 199, 190, 0.9)', marginTop: '0.5rem' }}
                    >
                      💰 Meta mensual:{' '}
                      {formatPrice(
                        parseFloat(formData.montoObjetivo) / parseInt(formData.duracionMeses)
                      )}
                    </p>
                  )}
              </div>
              <div className="form-group-base">
                <label htmlFor="montoActual" className="form-label-base">Monto Actual (COP)</label>
                <input
                  type="number"
                  id="montoActual"
                  name="montoActual"
                  value={formData.montoActual}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  placeholder="0"
                  className={`form-input-base ${formErrors.montoActual ? 'input-error' : ''}`}
                />
                {formErrors.montoActual && (
                  <span className="error-message">{formErrors.montoActual}</span>
                )}
              </div>
              <div className="form-group-base">
                <label htmlFor="duracionMeses" className="form-label-base">Duración en Meses (Máximo 9)</label>
                <input
                  type="number"
                  id="duracionMeses"
                  name="duracionMeses"
                  value={formData.duracionMeses}
                  onChange={handleChange}
                  required
                  min="1"
                  max="9"
                  placeholder="6"
                  className={`form-input-base ${formErrors.duracionMeses ? 'input-error' : ''}`}
                />
                {formErrors.duracionMeses && (
                  <span className="error-message">{formErrors.duracionMeses}</span>
                )}
                <p className="form-hint">
                  ⚠️ Máximo 9 meses: después de eso el dinero sufre depreciación por inflación. Si
                  planeas ahorrar más de 1 año, lo más recomendable es poner el dinero en uno o
                  varios CDT a más de la tasa inflacionaria.
                </p>
              </div>
              <div className="form-group-base">
                <label htmlFor="fechaInicio" className="form-label-base">Fecha de Inicio</label>
                <input
                  type="date"
                  id="fechaInicio"
                  name="fechaInicio"
                  value={formData.fechaInicio}
                  onChange={handleChange}
                  required
                  className={`form-input-base ${formErrors.fechaInicio ? 'input-error' : ''}`}
                />
                {formErrors.fechaInicio && (
                  <span className="error-message">{formErrors.fechaInicio}</span>
                )}
              </div>
              <div className="form-group-base">
                <label htmlFor="fechaFin" className="form-label-base">Fecha de Fin</label>
                <input
                  type="date"
                  id="fechaFin"
                  name="fechaFin"
                  value={formData.fechaFin}
                  onChange={handleChange}
                  required
                  className={`form-input-base ${formErrors.fechaFin ? 'input-error' : ''}`}
                />
                {formErrors.fechaFin && (
                  <span className="error-message">{formErrors.fechaFin}</span>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="modal-button cancel" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="modal-button submit">
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de detalles */}
      {isDetailModalOpen && selectedProject && (
        <div className="modal-overlay" onClick={handleCloseDetailModal}>
          <div
            className="modal-content detail-modal"
            onClick={e => e.stopPropagation()}
            style={
              { '--project-color': getStatusColor(selectedProject.estado) } as React.CSSProperties
            }
          >
            <div className="modal-header">
              <h2 className="modal-title">Detalles del Proyecto</h2>
              <button
                className="modal-close"
                onClick={handleCloseDetailModal}
                aria-label="Cerrar modal"
                type="button"
              >
                ×
              </button>
            </div>

            {!isEditMode ? (
              <>
                <div className="detail-content">
                  <div className="detail-section">
                    <div className="detail-info">
                      <h3 className="detail-name">{selectedProject.nombre}</h3>
                      <p
                        className="detail-status"
                        style={{ color: getStatusColor(selectedProject.estado) }}
                      >
                        {getStatusText(selectedProject.estado)}
                      </p>
                    </div>
                  </div>

                  <div className="project-detail-progress">
                    <div className="project-detail-progress-bar">
                      <div
                        className="project-detail-progress-fill"
                        style={{
                          width: `${Math.min(selectedProject.porcentajeProgreso, 100)}%`,
                          backgroundColor: getStatusColor(selectedProject.estado),
                        }}
                      />
                    </div>
                    <span className="project-detail-progress-text">
                      {selectedProject.porcentajeProgreso.toFixed(1)}%
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Monto Objetivo:</span>
                    <span className="detail-value">
                      {formatPrice(selectedProject.montoObjetivo)}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Monto Actual:</span>
                    <span className="detail-value">{formatPrice(selectedProject.montoActual)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Monto Restante:</span>
                    <span className="detail-value">{formatPrice(selectedProject.restante)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Meta Mensual:</span>
                    <span
                      className="detail-value"
                      style={{ color: 'rgba(0, 199, 190, 0.9)', fontWeight: 600 }}
                    >
                      {formatPrice(selectedProject.montoObjetivo / selectedProject.duracionMeses)}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Duración:</span>
                    <span className="detail-value">
                      {selectedProject.duracionMeses} mes
                      {selectedProject.duracionMeses !== 1 ? 'es' : ''}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Fecha de Inicio:</span>
                    <span className="detail-value">{formatDate(selectedProject.fechaInicio)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Fecha de Fin:</span>
                    <span className="detail-value">{formatDate(selectedProject.fechaFin)}</span>
                  </div>
                </div>

                <div className="detail-actions">
                  {selectedProject.estado === 'active' && (
                    <button
                      className="detail-button complete"
                      onClick={handleCompleteClick}
                      type="button"
                      aria-label="Marcar proyecto como completado"
                    >
                      <CheckCircleIcon aria-hidden="true" />
                      <span>Marcar como Completado</span>
                    </button>
                  )}
                  <button
                    className="detail-button edit"
                    onClick={handleEditClick}
                    type="button"
                    aria-label="Editar proyecto"
                  >
                    <EditIcon aria-hidden="true" />
                    <span>Editar Proyecto</span>
                  </button>
                  <button
                    className="detail-button delete"
                    onClick={handleDeleteClick}
                    type="button"
                    aria-label="Eliminar proyecto"
                  >
                    <DeleteIcon aria-hidden="true" />
                    <span>Eliminar Proyecto</span>
                  </button>
                </div>
              </>
            ) : (
              <form className="modal-form" onSubmit={handleSubmit}>
                <div className="form-group-base">
                  <label htmlFor="edit-nombre" className="form-label-base">Nombre del Proyecto</label>
                  <input
                    type="text"
                    id="edit-nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Viaje a Europa"
                    className={`form-input-base ${formErrors.nombre ? 'input-error' : ''}`}
                  />
                  {formErrors.nombre && <span className="error-message">{formErrors.nombre}</span>}
                </div>
                <div className="form-group-base">
                  <label htmlFor="edit-montoObjetivo" className="form-label-base">Monto Objetivo (COP)</label>
                  <input
                    type="number"
                    id="edit-montoObjetivo"
                    name="montoObjetivo"
                    value={formData.montoObjetivo}
                    onChange={handleChange}
                    required
                    min="1"
                    step="1000"
                    placeholder="5000000"
                    className={`form-input-base ${formErrors.montoObjetivo ? 'input-error' : ''}`}
                  />
                  {formErrors.montoObjetivo && (
                    <span className="error-message">{formErrors.montoObjetivo}</span>
                  )}
                  {formData.montoObjetivo &&
                    formData.duracionMeses &&
                    !formErrors.montoObjetivo &&
                    !formErrors.duracionMeses && (
                      <p
                        className="form-hint"
                        style={{ color: 'rgba(0, 199, 190, 0.9)', marginTop: '0.5rem' }}
                      >
                        💰 Meta mensual:{' '}
                        {formatPrice(
                          parseFloat(formData.montoObjetivo) / parseInt(formData.duracionMeses)
                        )}
                      </p>
                    )}
                </div>
                <div className="form-group-base">
                  <label htmlFor="edit-montoActual" className="form-label-base">Monto Actual (COP)</label>
                  <input
                    type="number"
                    id="edit-montoActual"
                    name="montoActual"
                    value={formData.montoActual}
                    onChange={handleChange}
                    min="0"
                    step="1000"
                    placeholder="0"
                    className={`form-input-base ${formErrors.montoActual ? 'input-error' : ''}`}
                  />
                  {formErrors.montoActual && (
                    <span className="error-message">{formErrors.montoActual}</span>
                  )}
                </div>
                <div className="form-group-base">
                  <label htmlFor="edit-duracionMeses" className="form-label-base">Duración en Meses (Máximo 9)</label>
                  <input
                    type="number"
                    id="edit-duracionMeses"
                    name="duracionMeses"
                    value={formData.duracionMeses}
                    onChange={handleChange}
                    required
                    min="1"
                    max="9"
                    placeholder="6"
                    className={`form-input-base ${formErrors.duracionMeses ? 'input-error' : ''}`}
                  />
                  {formErrors.duracionMeses && (
                    <span className="error-message">{formErrors.duracionMeses}</span>
                  )}
                  <p className="form-hint">
                    ⚠️ Máximo 9 meses: después de eso el dinero sufre depreciación por inflación. Si
                    planeas ahorrar más de 1 año, lo más recomendable es poner el dinero en uno o
                    varios CDT a más de la tasa inflacionaria.
                  </p>
                </div>
                <div className="form-group-base">
                  <label htmlFor="edit-fechaInicio" className="form-label-base">Fecha de Inicio</label>
                  <input
                    type="date"
                    id="edit-fechaInicio"
                    name="fechaInicio"
                    value={formData.fechaInicio}
                    onChange={handleChange}
                    required
                    className={`form-input-base ${formErrors.fechaInicio ? 'input-error' : ''}`}
                  />
                  {formErrors.fechaInicio && (
                    <span className="error-message">{formErrors.fechaInicio}</span>
                  )}
                </div>
                <div className="form-group-base">
                  <label htmlFor="edit-fechaFin" className="form-label-base">Fecha de Fin</label>
                  <input
                    type="date"
                    id="edit-fechaFin"
                    name="fechaFin"
                    value={formData.fechaFin}
                    onChange={handleChange}
                    required
                    className={`form-input-base ${formErrors.fechaFin ? 'input-error' : ''}`}
                  />
                  {formErrors.fechaFin && (
                    <span className="error-message">{formErrors.fechaFin}</span>
                  )}
                </div>
                <div className="form-group-base">
                  <label htmlFor="edit-estado" className="form-label-base">Estado</label>
                  <select
                    id="edit-estado"
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className="form-select-base"
                  >
                    <option value="active">Activo</option>
                    <option value="completed">Completado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                  {formData.estado === 'completed' && selectedProject?.presupuestoId && (
                    <p className="form-hint">
                      ⚠️ Al marcar como completado, el presupuesto asociado será eliminado
                      automáticamente.
                    </p>
                  )}
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-button cancel"
                    onClick={() => setIsEditMode(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="modal-button submit">
                    Guardar Cambios
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal de Debug */}
      {isDebugModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDebugModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Debug - Proyectos</h2>
              <button className="modal-close" onClick={() => setIsDebugModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="debug-modal-content">
              <div className="debug-options">
                <button
                  className="debug-option-button create-demo"
                  onClick={handleDebugCreateProjects}
                  disabled={isLoading}
                >
                  <span className="debug-option-icon">📦</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Crear Proyectos Demo</h3>
                    <p className="debug-option-description">
                      Crea 3 proyectos de ejemplo para pruebas. Todos respetan el límite de máximo 9
                      meses.
                    </p>
                  </div>
                </button>
                <button
                  className="debug-option-button delete-all"
                  onClick={handleDeleteAllProjects}
                  disabled={isLoading}
                >
                  <span className="debug-option-icon">🗑️</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Eliminar Todos los Proyectos</h3>
                    <p className="debug-option-description">
                      ⚠️ PELIGROSO: Elimina todos los proyectos (IRREVERSIBLE)
                    </p>
                  </div>
                </button>
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-button cancel"
                onClick={() => setIsDebugModalOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Proyectos
