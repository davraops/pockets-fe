import { useState, useEffect, useRef, useMemo } from 'react'
import CrudSummaryStrip from '../components/crud/CrudSummaryStrip'
import ActividadKanbanBoard from '../components/trabajo/ActividadKanbanBoard'
import ActividadMetricsPanel from '../components/trabajo/ActividadMetricsPanel'
import {
  buildActivityClientOptions,
  getContractClientNames,
  mergeClientFilterOptions,
} from '../components/trabajo/activityFormUtils'
import {
  addManualTimeLog,
  buildNewActivityData,
  formatDurationMinutes,
  normalizeActivityData,
  patchActivityFields,
  startTimer,
  stopTimer,
  summarizeActivityMetrics,
  transitionActivityStatus,
} from '../components/trabajo/activityMetricsUtils'
import {
  ACTIVITY_STATUS_LABELS,
  KANBAN_ACTIVE_COLUMNS,
  KANBAN_COMPLETED_COLUMNS,
  type ActivityStatus,
  type ClientActivity,
} from '../components/trabajo/activityTypes'
import { backToHubLabel } from '../constants/hubLabels'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import FolderIcon from '@mui/icons-material/Folder'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import PersonIcon from '@mui/icons-material/Person'
import AssignmentIcon from '@mui/icons-material/Assignment'
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber'
import PriorityHighIcon from '@mui/icons-material/PriorityHigh'
import EventIcon from '@mui/icons-material/Event'
import WorkIcon from '@mui/icons-material/Work'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { api } from '../services/api'
import { isDebugToolsEnabled, isDestructiveDebugEnabled, devError } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import { sectionColor } from '../constants/sectionColors'
import './AppPage.css'
import ModalOverlay from '../components/ModalOverlay'
import ListSkeleton from '../components/ListSkeleton'
import './Actividades.css'

interface ClientActivityRecord {
  id: string
  name: string
  data: ClientActivity['data']
  created_at: string
  updated_at: string
}

type ViewMode = 'list' | 'kanban'

function Actividades() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const [activities, setActivities] = useState<ClientActivity[]>([])
  const [contractClients, setContractClients] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    activity: '',
    ticket: '',
    priority: '',
    assignmentDate: '',
    status: 'defined' as ActivityStatus,
  })
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [isUpdatingActivityId, setIsUpdatingActivityId] = useState<string | null>(null)
  const [clientFilter, setClientFilter] = useState<string>('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [records, setRecords] = useState<ClientActivityRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRecordsModal, setShowRecordsModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isDebugLoading, setIsDebugLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const clientRef = useRef<HTMLSelectElement>(null)
  const [formErrors, setFormErrors] = useState({ name: '', client: '' })

  useEffect(() => {
    loadRecords()
    void loadContractClients()
  }, [])

  const loadContractClients = async () => {
    try {
      const response = await api.getContracts()
      if (response.contracts && Array.isArray(response.contracts)) {
        setContractClients(getContractClientNames(response.contracts))
      } else {
        setContractClients([])
      }
    } catch (err: unknown) {
      devError('Error al cargar clientes de contratos:', err)
      setContractClients([])
    }
  }

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isMenuOpen && !target.closest('.app-toolbar-menu-container')) {
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

  const loadRecords = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.getClientActivities()
      if (response.activities && Array.isArray(response.activities)) {
        setRecords(response.activities)
        const mappedActivities = response.activities.map((record: ClientActivityRecord) => ({
          id: record.id,
          name: record.name,
          data: record.data,
          created_at: record.created_at,
          updated_at: record.updated_at,
        }))
        setActivities(mappedActivities)
      } else {
        setActivities([])
        setRecords([])
      }
    } catch (err: unknown) {
      devError('Error al cargar actividades:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al cargar actividades. Por favor, intenta de nuevo.'
      )
      setError(errorMessage)
      setActivities([])
      setRecords([])
      showNotification(errorMessage, 'error')
    } finally {
        setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const validateForm = (): boolean => {
    const errors = { name: '', client: '' }
    let isValid = true

    if (!formData.name.trim()) {
      errors.name = 'El nombre de la actividad es requerido'
      isValid = false
    }

    if (!formData.client.trim()) {
      errors.client = 'Selecciona un cliente'
      isValid = false
    }

    setFormErrors(errors)
    if (!isValid) {
      queueMicrotask(() => {
        if (errors.name) {
          nameRef.current?.focus()
        } else if (errors.client) {
          clientRef.current?.focus()
        }
      })
    }

    return isValid
  }

  const persistActivity = async (
    activity: ClientActivity,
    options?: { successMessage?: string; reload?: boolean }
  ) => {
    await api.updateClientActivity(activity.id, {
      name: activity.name,
      data: activity.data,
    })

    if (options?.successMessage) {
      showNotification(options.successMessage, 'success')
    }

    if (options?.reload !== false) {
      await loadRecords()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setIsSaving(true)

      const fieldPatch = {
        client: formData.client.trim(),
        activity: formData.activity.trim() || undefined,
        ticket: formData.ticket.trim() || undefined,
        priority: formData.priority || undefined,
        assignmentDate: formData.assignmentDate || undefined,
        status: formData.status || 'defined',
      }

      if (editingId) {
        const existing = activities.find(activity => activity.id === editingId)
        const data = existing
          ? patchActivityFields(existing.data, fieldPatch, existing.created_at)
          : buildNewActivityData(fieldPatch)

        await persistActivity(
          { id: editingId, name: formData.name.trim(), data },
          { successMessage: 'Actividad actualizada exitosamente' }
        )
        setEditingId(null)
      } else {
        await api.createClientActivity({
          name: formData.name.trim(),
          data: buildNewActivityData(fieldPatch),
        })
        showNotification('Actividad creada exitosamente', 'success')
        await loadRecords()
      }

      setFormData({
        name: '',
        client: '',
        activity: '',
        ticket: '',
        priority: '',
        assignmentDate: '',
        status: 'defined',
      })

      // Cerrar modal si estaba abierto
      setShowFormModal(false)
      setFormErrors({ name: '', client: '' })
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al guardar la actividad. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (activity: ClientActivity) => {
    setFormData({
      name: activity.name,
      client: activity.data.client || '',
      activity: activity.data.activity || '',
      ticket: activity.data.ticket || '',
      priority: activity.data.priority || '',
      assignmentDate: activity.data.assignmentDate || '',
      status: activity.data.status || 'defined',
    })
    setEditingId(activity.id)
    setShowFormModal(true)
    setFormErrors({ name: '', client: '' })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({
      name: '',
      client: '',
      activity: '',
      ticket: '',
      priority: '',
      assignmentDate: '',
      status: 'defined',
    })
    setShowFormModal(false)
    setFormErrors({ name: '', client: '' })
  }

  const handleDelete = async (id: string, name: string) => {
    if (!(await confirm({ message: `¿Estás seguro de que quieres eliminar la actividad "${name}"?`, variant: 'danger' }))) {
      return
    }

    try {
      await api.deleteClientActivity(id)
      showNotification('Actividad eliminada exitosamente', 'success')
      await loadRecords()
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar la actividad. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleStatusChange = async (activity: ClientActivity, status: ActivityStatus) => {
    try {
      setIsUpdatingActivityId(activity.id)
      const data = transitionActivityStatus(
        normalizeActivityData(activity.data, activity.created_at),
        status
      )
      await persistActivity(
        { ...activity, data },
        { successMessage: `Movida a ${ACTIVITY_STATUS_LABELS[status]}` }
      )
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al actualizar el estado. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsUpdatingActivityId(null)
    }
  }

  const handleToggleTimer = async (activity: ClientActivity) => {
    try {
      setIsUpdatingActivityId(activity.id)
      const normalized = normalizeActivityData(activity.data, activity.created_at)
      const wasRunning = Boolean(normalized.activeTimerStartedAt)
      const data = wasRunning ? stopTimer(normalized) : startTimer(normalized)

      await persistActivity(
        { ...activity, data },
        {
          successMessage: wasRunning ? 'Tiempo registrado' : 'Cronómetro iniciado',
        }
      )
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al actualizar el cronómetro. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsUpdatingActivityId(null)
    }
  }

  const handleAddManualLog = async (minutes: number, note?: string) => {
    if (!editingId) {
      return
    }

    const activity = activities.find(item => item.id === editingId)
    if (!activity) {
      return
    }

    try {
      setIsSaving(true)
      const data = addManualTimeLog(
        normalizeActivityData(activity.data, activity.created_at),
        minutes,
        note
      )
      await persistActivity(
        { ...activity, data },
        { successMessage: 'Tiempo registrado', reload: true }
      )
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al registrar el tiempo. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleComplete = async (activity: ClientActivity) => {
    try {
      const data = transitionActivityStatus(
        normalizeActivityData(activity.data, activity.created_at),
        'done'
      )
      await persistActivity(
        { ...activity, data },
        { successMessage: 'Actividad completada exitosamente' }
      )
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al completar la actividad. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'
    try {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    } catch {
      return dateString
    }
  }

  const calculateDaysSince = (dateString: string | undefined) => {
    if (!dateString) return null
    try {
      const date = new Date(dateString)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      date.setHours(0, 0, 0, 0)
      const diffTime = today.getTime() - date.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    } catch {
      return null
    }
  }

  const getPriorityClass = (priority: string | undefined) => {
    switch (priority) {
      case 'Alta':
        return 'crud-priority-high'
      case 'Media':
        return 'crud-priority-medium'
      case 'Baja':
        return 'crud-priority-low'
      default:
        return ''
    }
  }

  const getPriorityColor = (priority: string | undefined) => {
    switch (priority) {
      case 'Alta':
        return sectionColor.danger
      case 'Media':
        return '#FF9500'
      case 'Baja':
        return '#34C759'
      default:
        return 'var(--text-secondary)'
    }
  }

  const formClientOptions = useMemo(
    () => buildActivityClientOptions(contractClients, formData.client),
    [contractClients, formData.client]
  )

  const uniqueClients = useMemo(
    () =>
      mergeClientFilterOptions(
        contractClients,
        activities.map(activity => activity.data.client ?? '').filter(Boolean)
      ),
    [contractClients, activities]
  )

  // Obtener valor numérico de prioridad para ordenar
  const getPriorityValue = (priority: string | undefined) => {
    switch (priority) {
      case 'Alta':
        return 1
      case 'Media':
        return 2
      case 'Baja':
        return 3
      default:
        return 4 // Sin prioridad va al final
    }
  }

  // Filtrar actividades según el tab activo y el filtro de cliente
  const getFilteredActivities = () => {
    let filtered = activities

    // Filtrar por tab
    if (activeTab === 'active') {
      filtered = filtered.filter(
        a => a.data.status !== 'done' && a.data.status !== 'wont_do'
      )
    } else {
      filtered = filtered.filter(
        a => a.data.status === 'done' || a.data.status === 'wont_do'
      )
    }

    // Filtrar por cliente
    if (clientFilter) {
      filtered = filtered.filter(a => a.data.client === clientFilter)
    }

    // Ordenar por prioridad (Alta, Media, Baja) y luego por fecha de creación (más antiguos primero)
    filtered.sort((a, b) => {
      // Primero por prioridad
      const priorityA = getPriorityValue(a.data.priority)
      const priorityB = getPriorityValue(b.data.priority)
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }

      // Si tienen la misma prioridad, ordenar por fecha de creación (más antiguos primero)
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
      
      return dateA - dateB
    })

    return filtered
  }

  const filteredActivities = getFilteredActivities()

  // Calcular estadísticas (solo de actividades activas)
  const calculateStats = () => {
    const activeActivities = activities.filter(
      a => a.data.status !== 'done' && a.data.status !== 'wont_do'
    )
    const total = activeActivities.length
    const alta = activeActivities.filter(a => a.data.priority === 'Alta').length
    const media = activeActivities.filter(a => a.data.priority === 'Media').length
    const baja = activeActivities.filter(a => a.data.priority === 'Baja').length
    return { total, alta, media, baja }
  }

  const stats = calculateStats()
  const timeStats = summarizeActivityMetrics(activities)
  const editingActivity = editingId ? activities.find(activity => activity.id === editingId) : null

  const getEmptyStateCopy = () => {
    if (activities.length === 0) {
      return {
        title: activeTab === 'active' ? 'No hay actividades activas' : 'No hay actividades completadas',
        subtext:
          activeTab === 'active'
            ? 'Crea tu primera actividad para comenzar'
            : 'Las actividades completadas o descartadas aparecerán aquí',
      }
    }

    if (clientFilter) {
      return {
        title: 'No hay actividades para este cliente',
        subtext:
          activeTab === 'active'
            ? 'Prueba otro filtro o crea una actividad nueva'
            : 'Este cliente no tiene actividades completadas',
      }
    }

    return {
      title: activeTab === 'active' ? 'No hay actividades activas' : 'No hay actividades completadas',
      subtext:
        activeTab === 'active'
          ? 'Todas tus actividades están completadas o descartadas'
          : 'Las actividades completadas o descartadas aparecerán aquí',
    }
  }

  const emptyStateCopy = getEmptyStateCopy()

  // Obtener color del estado
  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'defined':
        return '#8E8E93'
      case 'in_progress':
        return '#007AFF'
      case 'blocked':
        return sectionColor.danger
      case 'done':
        return '#34C759'
      case 'wont_do':
        return '#AF52DE'
      default:
        return 'var(--text-secondary)'
    }
  }

  // Obtener label del estado
  const getStatusLabel = (status: ActivityStatus | undefined) =>
    ACTIVITY_STATUS_LABELS[status ?? 'defined']

  const formatActivityMeta = (activity: ClientActivity) => {
    const parts = [
      activity.data.client,
      getStatusLabel(activity.data.status),
      activity.data.priority,
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(' • ') : 'Sin cliente'
  }

  const formatActivityPreview = (activity: ClientActivity) => {
    if (activity.data.ticket) return `Ticket: ${activity.data.ticket}`
    if (activity.data.activity) return activity.data.activity
    if (activity.data.assignmentDate) return `Asignada: ${formatDate(activity.data.assignmentDate)}`
    return null
  }

  return (
    <div className="app-page">
      <div className="app-page-content app-page-content-wide crud-page-content actividades-content">
        {/* Toolbar */}
        <div className="app-toolbar">
          <button
            className="app-toolbar-button"
            onClick={() => navigate('/trabajo')}
            aria-label={backToHubLabel('trabajo')}
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
                        setIsMenuOpen(false)
                        setIsDebugModalOpen(true)
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

        <h1 className="app-page-title">Actividades</h1>

        <CrudSummaryStrip
          ariaLabel="Resumen de actividades"
          items={[
            { label: 'Activas', value: stats.total, tone: 'info' },
            { label: 'Alta', value: stats.alta, tone: 'expense' },
            { label: 'Media', value: stats.media, tone: 'info' },
            { label: 'Baja', value: stats.baja, tone: 'available' },
            {
              label: 'Trabajado',
              value: formatDurationMinutes(timeStats.totalLoggedMinutes),
              tone: 'info',
            },
            ...(timeStats.resolvedCount > 0
              ? [
                  {
                    label: 'Resolución media',
                    value: formatDurationMinutes(timeStats.averageLeadTimeMinutes),
                    tone: 'info' as const,
                  },
                ]
              : []),
          ]}
        />

        <button
          type="button"
          className="btn-base btn-accent btn-block btn-submit crud-primary-cta"
          onClick={() => setShowFormModal(true)}
          aria-label="Crear actividad"
        >
          <AddIcon aria-hidden={true} />
          Crear actividad
        </button>

        {/* Estado de carga */}
        {isLoading && activities.length === 0 ? (
          <div className="glass-group">
            <ListSkeleton variant="inset-row" count={4} aria-label="Cargando actividades" />
          </div>
        ) : error && activities.length === 0 ? (
          <div className="loader-container">
            <div className="loader finanzas-stats-error-panel">
              <p className="loader-text loader-text--error" role="alert">
                {error}
              </p>
              <button
                type="button"
                className="btn-base btn-secondary btn-retry"
                onClick={() => void loadRecords()}
                aria-label="Reintentar cargar actividades"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="crud-segmented-tabs-container">
              <div className="crud-segmented-tabs">
                <button
                  className={`crud-segmented-tab ${activeTab === 'active' ? 'crud-segmented-tab--active' : ''}`}
                  onClick={() => setActiveTab('active')}
                  type="button"
                >
                  Activas
                </button>
                <button
                  className={`crud-segmented-tab ${activeTab === 'completed' ? 'crud-segmented-tab--active' : ''}`}
                  onClick={() => setActiveTab('completed')}
                  type="button"
                >
                  Completadas
                </button>
              </div>
              {uniqueClients.length > 0 && (
                <div className="crud-inline-filter">
                  <select
                    className="crud-inline-filter-select"
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value)}
                  >
                    <option value="">Todos los clientes</option>
                    {uniqueClients.map(client => (
                      <option key={client} value={client}>
                        {client}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="actividades-view-toggle" role="group" aria-label="Vista de actividades">
                <button
                  type="button"
                  className={`crud-segmented-tab ${viewMode === 'kanban' ? 'crud-segmented-tab--active' : ''}`}
                  onClick={() => setViewMode('kanban')}
                >
                  Kanban
                </button>
                <button
                  type="button"
                  className={`crud-segmented-tab ${viewMode === 'list' ? 'crud-segmented-tab--active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  Lista
                </button>
              </div>
            </div>

            {isUpdatingActivityId && (
              <p className="form-hint" role="status" aria-live="polite">
                Actualizando actividad…
              </p>
            )}

            {filteredActivities.length === 0 ? (
              <div className="empty-state">
                <WorkIcon className="empty-state-icon" />
                <p className="empty-text">{emptyStateCopy.title}</p>
                <p className="empty-subtext">
                  {activities.length === 0
                    ? 'Usa el botón de arriba para crear la primera'
                    : emptyStateCopy.subtext}
                </p>
              </div>
            ) : viewMode === 'kanban' ? (
              <ActividadKanbanBoard
                className={activeTab === 'completed' ? 'actividad-kanban-board--completed' : undefined}
                columns={activeTab === 'active' ? KANBAN_ACTIVE_COLUMNS : KANBAN_COMPLETED_COLUMNS}
                activities={filteredActivities}
                onOpen={handleEdit}
                onStatusChange={(activity, status) => void handleStatusChange(activity, status)}
                onToggleTimer={activity => void handleToggleTimer(activity)}
              />
            ) : (
              <div className="glass-group">
                {filteredActivities.map(activity => (
                  <button
                    key={activity.id}
                    type="button"
                    className="crud-inset-row crud-row-accent-indigo"
                    onClick={() => handleEdit(activity)}
                    aria-label={`Editar actividad ${activity.name}`}
                  >
                    <div className="crud-row-content">
                      <div className="crud-row-header">
                        <span className="crud-row-title">{activity.name}</span>
                        <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
                      </div>
                      <p className="crud-row-meta">{formatActivityMeta(activity)}</p>
                      {formatActivityPreview(activity) && (
                        <p className="crud-row-preview">{formatActivityPreview(activity)}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

                {/* Modal de Formulario */}
        {showFormModal && (
          <ModalOverlay
            onClose={() => {
              setShowFormModal(false)
              handleCancelEdit()
            }}
            className="modal-overlay"
          >
            <div className="crud-form-panel-shell crud-form-panel-shell--large" onClick={e => e.stopPropagation()}>
              <div className="modal-panel-header">
                <h2 className="modal-panel-title" id="modal-panel-title-editingid-editar-actividad-crear-actividad">{editingId ? 'Editar Actividad' : 'Crear Actividad'}</h2>
                <button
                  className="modal-panel-close"
                  onClick={() => {
                    setShowFormModal(false)
                    handleCancelEdit()
                  }}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="modal-panel-content">
                <form className="crud-form-panel" onSubmit={handleSubmit} noValidate>
                  <div className="modal-panel__scroll">
                  <div className="crud-form-panel-section">
                    <h3 className="app-subsection-title crud-form-panel-section-title">Información de la Actividad</h3>

                    <div className="form-group-base form-group-base--compact">
                      <label htmlFor="name" className="form-label-base form-label-base--inline">
                        Nombre de la Actividad *
                      </label>
                      <input
                        ref={nameRef}
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`form-input-base ${formErrors.name ? 'input-error' : ''}`}
                        placeholder="Ej: Revisión de código - Cliente XYZ"
                        autoFocus
                        aria-invalid={!!formErrors.name}
                        {...(formErrors.name ? { 'aria-describedby': 'activity-name-error' } : {})}
                      />
                      {formErrors.name && (
                        <span id="activity-name-error" className="error-message" role="alert">
                          {formErrors.name}
                        </span>
                      )}
                </div>

                    <div className="form-group-base form-group-base--compact">
                      <label htmlFor="client" className="form-label-base form-label-base--inline">
                        <PersonIcon className="form-label-base form-label-base--inline-icon" />
                        Cliente *
                      </label>
                      <select
                        ref={clientRef}
                        id="client"
                        name="client"
                        value={formData.client}
                        onChange={handleChange}
                        className={`form-input-base ${formErrors.client ? 'input-error' : ''}`}
                        aria-invalid={!!formErrors.client}
                        disabled={formClientOptions.length === 0}
                        {...(formErrors.client
                          ? { 'aria-describedby': 'activity-client-error' }
                          : contractClients.length === 0
                            ? { 'aria-describedby': 'activity-client-hint' }
                            : {})}
                      >
                        <option value="">
                          {formClientOptions.length === 0
                            ? 'Sin contratos disponibles'
                            : 'Selecciona un cliente'}
                        </option>
                        {formClientOptions.map(client => (
                          <option key={client} value={client}>
                            {client}
                          </option>
                        ))}
                      </select>
                      {contractClients.length === 0 && (
                        <p id="activity-client-hint" className="form-hint">
                          Crea un contrato en Contratos para registrar actividades por cliente.
                        </p>
                      )}
                      {formErrors.client && (
                        <span id="activity-client-error" className="error-message" role="alert">
                          {formErrors.client}
                        </span>
                      )}
                    </div>

                    <div className="form-group-base form-group-base--compact">
                      <label htmlFor="activity" className="form-label-base form-label-base--inline">
                        <AssignmentIcon className="form-label-base form-label-base--inline-icon" />
                        Actividad
                      </label>
                      <input
                        type="text"
                        id="activity"
                        name="activity"
                        value={formData.activity}
                        onChange={handleChange}
                        className="form-input-base"
                        placeholder="Descripción de la actividad"
                      />
                </div>

                    <div className="form-group-base form-group-base--compact">
                      <label htmlFor="ticket" className="form-label-base form-label-base--inline">
                        <ConfirmationNumberIcon className="form-label-base form-label-base--inline-icon" />
                        Ticket
                      </label>
                      <input
                        type="text"
                        id="ticket"
                        name="ticket"
                        value={formData.ticket}
                        onChange={handleChange}
                        className="form-input-base"
                        placeholder="Número o ID del ticket"
                      />
                </div>

                    <div className="form-group-base form-group-base--compact">
                      <label htmlFor="priority" className="form-label-base form-label-base--inline">
                        <PriorityHighIcon className="form-label-base form-label-base--inline-icon" />
                        Prioridad
                      </label>
                      <select
                        id="priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className="form-input-base"
                      >
                        <option value="">Seleccionar prioridad</option>
                        <option value="Alta">Alta</option>
                        <option value="Media">Media</option>
                        <option value="Baja">Baja</option>
                      </select>
                </div>

                    <div className="form-group-base form-group-base--compact">
                      <label htmlFor="assignmentDate" className="form-label-base form-label-base--inline">
                        <EventIcon className="form-label-base form-label-base--inline-icon" />
                        Día de Asignación
                      </label>
                      <input
                        type="date"
                        id="assignmentDate"
                        name="assignmentDate"
                        value={formData.assignmentDate}
                        onChange={handleChange}
                        className="form-input-base"
                      />
                </div>

                    <div className="form-group-base form-group-base--compact">
                      <label htmlFor="status" className="form-label-base form-label-base--inline">
                        <WorkIcon className="form-label-base form-label-base--inline-icon" />
                        Estado
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={(e) =>
                          setFormData(prev => ({
                            ...prev,
                            status: e.target.value as ActivityStatus,
                          }))
                        }
                        className="form-input-base"
                      >
                        <option value="defined">Definida</option>
                        <option value="in_progress">En Progreso</option>
                        <option value="blocked">Bloqueada</option>
                        <option value="done">Completada</option>
                        <option value="wont_do">No se hará</option>
                      </select>
                    </div>
                </div>

                  {editingActivity && (
                    <ActividadMetricsPanel
                      activity={editingActivity}
                      onAddManualLog={(minutes, note) => void handleAddManualLog(minutes, note)}
                    />
                  )}

                  </div>

                  <div className="crud-form-panel-actions">
                    {editingId ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setShowFormModal(false)
                            handleCancelEdit()
                          }}
                          className="crud-form-panel-button crud-form-panel-button--secondary"
                        >
                          Cancelar
                        </button>
                        {(() => {
                          const activity = activities.find(a => a.id === editingId)
                          if (
                            activity &&
                            activity.data.status !== 'done' &&
                            activity.data.status !== 'wont_do'
                          ) {
                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  void handleComplete(activity).then(() => {
                                    setShowFormModal(false)
                                    handleCancelEdit()
                                  })
                                }}
                                className="crud-form-panel-button crud-form-panel-button--secondary"
                              >
                                Completar
                              </button>
                            )
                          }
                          return null
                        })()}
                        <button
                          type="button"
                          onClick={() => {
                            const activity = activities.find(a => a.id === editingId)
                            if (activity) {
                              void handleDelete(activity.id, activity.name).then(() => {
                                setShowFormModal(false)
                                handleCancelEdit()
                              })
                            }
                          }}
                          className="crud-form-panel-button crud-form-panel-button--secondary"
                        >
                          Eliminar
                        </button>
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="crud-form-panel-button crud-form-panel-button--primary"
                        >
                          <SaveIcon className="crud-form-panel-button-icon" />
                          {isSaving ? 'Guardando...' : 'Actualizar Actividad'}
                        </button>
                      </>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="crud-form-panel-button crud-form-panel-button--primary"
                      >
                        <SaveIcon className="crud-form-panel-button-icon" />
                        {isSaving ? 'Guardando...' : 'Guardar Actividad'}
                  </button>
                  )}
                </div>
                </form>
              </div>
            </div>
          </ModalOverlay>
        )}

        {/* Modal de Registros Guardados */}
        {showRecordsModal && (
          <ModalOverlay onClose={() => setShowRecordsModal(false)} className="modal-overlay">
            <div className="modal-panel" onClick={e => e.stopPropagation()}>
              <div className="modal-panel-header">
                <h2 className="modal-panel-title" id="modal-panel-title-actividades-guardadas">Actividades Guardadas</h2>
                <button
                  className="modal-panel-close"
                  onClick={() => setShowRecordsModal(false)}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="modal-panel-content">
                {records.length === 0 ? (
                  <p className="modal-panel-empty">No hay actividades guardadas</p>
                ) : (
                  <div className="crud-modal-pick-list">
                    {records.map(record => (
                      <div key={record.id} className="crud-modal-pick-item">
                        <div className="crud-modal-pick-item-info">
                          <h3 className="crud-modal-pick-item-title">{record.name}</h3>
                          <p className="crud-modal-pick-item-meta">Cliente: {record.data.client || 'N/A'}</p>
                          </div>
                        <button
                          onClick={() => {
                            handleEdit({
                              id: record.id,
                              name: record.name,
                              data: record.data,
                              created_at: record.created_at,
                              updated_at: record.updated_at,
                            })
                            setShowRecordsModal(false)
                          }}
                          className="crud-modal-pick-item-action"
                          type="button"
                        >
                          Cargar
                        </button>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </ModalOverlay>
        )}

        {/* Modal de Debug */}
        {isDebugModalOpen && isDebugToolsEnabled() && (
          <ModalOverlay onClose={() => setIsDebugModalOpen(false)} className="modal-overlay">
            <div className="modal-panel" onClick={e => e.stopPropagation()}>
              <div className="modal-panel-header">
                <h2 className="modal-panel-title" id="modal-panel-title-debug-actividades">🐛 Debug - Actividades</h2>
                <button
                  className="modal-panel-close"
                  onClick={() => setIsDebugModalOpen(false)}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="modal-panel-content">
                <div className="debug-options">
                  <button
                    className="debug-option-button create-demo"
                    onClick={async () => {
                      try {
                        setIsDebugLoading(true)
                        const demoActivities = [
                          {
                            name: 'Revisión de Código - Cliente TechCorp',
                            data: {
                              client: 'TechCorp Inc.',
                              activity: 'Revisión de código del módulo de autenticación',
                              ticket: 'TECH-1234',
                              priority: 'Alta',
                              assignmentDate: new Date().toISOString().split('T')[0],
                            },
                          },
                          {
                            name: 'Reunión de Seguimiento - StartupXYZ',
                            data: {
                              client: 'StartupXYZ',
                              activity: 'Reunión semanal de seguimiento del proyecto',
                              ticket: 'STX-5678',
                              priority: 'Media',
                              assignmentDate: new Date().toISOString().split('T')[0],
                            },
                          },
                          {
                            name: 'Corrección de Bug - DesignStudio',
                            data: {
                              client: 'DesignStudio',
                              activity: 'Corrección de bug en el sistema de diseño',
                              ticket: 'DS-9012',
                              priority: 'Alta',
                              assignmentDate: new Date().toISOString().split('T')[0],
                            },
                          },
                        ]

                        for (const activity of demoActivities) {
                          await api.createClientActivity(activity)
                        }

                        showNotification(`${demoActivities.length} actividades demo creadas exitosamente`, 'success')
                        await loadRecords()
                        setIsDebugModalOpen(false)
                      } catch (err: any) {
                        const errorMessage = getTranslatedErrorMessage(
                          err,
                          'Error al crear las actividades demo. Por favor, intenta de nuevo.'
                        )
                        showNotification(errorMessage, 'error')
                      } finally {
                        setIsDebugLoading(false)
                      }
                    }}
                    disabled={isDebugLoading}
                    type="button"
                  >
                    <span className="debug-option-icon">📦</span>
                    <div className="debug-option-info">
                      <h3 className="debug-option-title">Crear Actividades Demo</h3>
                      <p className="debug-option-description">
                        Crea 3 actividades de ejemplo con diferentes configuraciones
                      </p>
                </div>
                  </button>
                  <button
                    className="debug-option-button delete-all"
                    onClick={async () => {
                      if (!isDestructiveDebugEnabled()) return
                      if (
                        !(await confirm({ message: '¿Estás seguro de que quieres eliminar TODAS las actividades? Esta acción es irreversible.', variant: 'danger' }))
                      ) {
                        return
                      }

                      try {
                        setIsDebugLoading(true)
                        await api.deleteAllClientActivities()
                        showNotification('Todas las actividades han sido eliminadas', 'success')
                        await loadRecords()
                        setIsDebugModalOpen(false)
                      } catch (err: any) {
                        const errorMessage = getTranslatedErrorMessage(
                          err,
                          'Error al eliminar las actividades. Por favor, intenta de nuevo.'
                        )
                        showNotification(errorMessage, 'error')
                      } finally {
                        setIsDebugLoading(false)
                      }
                    }}
                    disabled={isDebugLoading}
                    type="button"
                  >
                    <span className="debug-option-icon">🗑️</span>
                    <div className="debug-option-info">
                      <h3 className="debug-option-title">Eliminar Todas las Actividades</h3>
                      <p className="debug-option-description">
                        ⚠️ PELIGROSO: Elimina todas las actividades (IRREVERSIBLE)
                  </p>
                </div>
                  </button>
                </div>

                <div className="crud-modal-pick-actions">
                  <button
                    type="button"
                    className="crud-form-panel-button crud-form-panel-button--secondary"
                    onClick={() => setIsDebugModalOpen(false)}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </ModalOverlay>
        )}
      </div>
    </div>
  )
}

export default Actividades
