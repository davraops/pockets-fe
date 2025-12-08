import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import FolderIcon from '@mui/icons-material/Folder'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PersonIcon from '@mui/icons-material/Person'
import AssignmentIcon from '@mui/icons-material/Assignment'
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber'
import PriorityHighIcon from '@mui/icons-material/PriorityHigh'
import EventIcon from '@mui/icons-material/Event'
import WorkIcon from '@mui/icons-material/Work'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import './Actividades.css'

interface ClientActivity {
  id: string
  name: string
  data: {
    client?: string
    activity?: string
    ticket?: string
    priority?: string
    assignmentDate?: string
    status?: 'defined' | 'in_progress' | 'blocked' | 'done' | 'wont_do'
    completedDate?: string
  }
  created_at?: string
  updated_at?: string
}

interface ClientActivityRecord {
  id: string
  name: string
  data: ClientActivity['data']
  created_at: string
  updated_at: string
}

function Actividades() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [activities, setActivities] = useState<ClientActivity[]>([])
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    activity: '',
    ticket: '',
    priority: '',
    assignmentDate: '',
    status: 'defined' as 'defined' | 'in_progress' | 'blocked' | 'done' | 'wont_do',
  })
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
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

  useEffect(() => {
    loadRecords()
  }, [])

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isMenuOpen && !target.closest('.actividades-toolbar-menu-container')) {
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
    } catch (err: any) {
      console.error('Error al cargar actividades:', err)
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      showNotification('El nombre de la actividad es requerido', 'error')
      return
    }

    if (!formData.client.trim()) {
      showNotification('El cliente es requerido', 'error')
      return
    }

    try {
      setIsSaving(true)

      const activityData = {
        name: formData.name.trim(),
        data: {
          client: formData.client.trim(),
          activity: formData.activity.trim() || undefined,
          ticket: formData.ticket.trim() || undefined,
          priority: formData.priority || undefined,
          assignmentDate: formData.assignmentDate || undefined,
          status: formData.status || 'defined',
        },
      }

      if (editingId) {
        await api.updateClientActivity(editingId, activityData)
        showNotification('Actividad actualizada exitosamente', 'success')
        setEditingId(null)
      } else {
        await api.createClientActivity(activityData)
        showNotification('Actividad creada exitosamente', 'success')
      }

      await loadRecords()

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
    } catch (err: any) {
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
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la actividad "${name}"?`)) {
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

  const handleComplete = async (activity: ClientActivity) => {
    try {
      const activityData = {
        name: activity.name,
        data: {
          ...activity.data,
          status: 'done' as const,
          completedDate: new Date().toISOString().split('T')[0],
        },
      }
      await api.updateClientActivity(activity.id, activityData)
      showNotification('Actividad completada exitosamente', 'success')
      await loadRecords()
    } catch (err: any) {
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

  const getPriorityColor = (priority: string | undefined) => {
    switch (priority) {
      case 'Alta':
        return '#FF3B30'
      case 'Media':
        return '#FF9500'
      case 'Baja':
        return '#34C759'
      default:
        return 'var(--text-secondary)'
    }
  }

  // Obtener lista única de clientes para el filtro
  const uniqueClients = Array.from(
    new Set(activities.map(a => a.data.client).filter(Boolean))
  ).sort()

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
      filtered = filtered.filter(a => a.data.status !== 'done' && a.data.status !== 'wont_do')
    } else {
      filtered = filtered.filter(a => a.data.status === 'done' || a.data.status === 'wont_do')
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

  // Obtener color del estado
  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'defined':
        return '#8E8E93'
      case 'in_progress':
        return '#007AFF'
      case 'blocked':
        return '#FF3B30'
      case 'done':
        return '#34C759'
      case 'wont_do':
        return '#AF52DE'
      default:
        return 'var(--text-secondary)'
    }
  }

  // Obtener label del estado
  const getStatusLabel = (status: string | undefined) => {
    switch (status) {
      case 'defined':
        return 'Definida'
      case 'in_progress':
        return 'En Progreso'
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

  return (
    <div className="app-page">
      <div className="app-page-content actividades-content">
        {/* Toolbar */}
        <div className="actividades-toolbar">
          <button
            className="actividades-toolbar-button"
            onClick={() => navigate('/trabajo')}
            aria-label="Volver"
            type="button"
          >
            <ArrowBackIcon className="actividades-toolbar-icon" />
          </button>
          <div className="actividades-toolbar-menu-container" ref={menuRef}>
            <button
              className="actividades-toolbar-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Opciones"
              aria-expanded={isMenuOpen}
              type="button"
            >
              <MoreVertIcon className="actividades-toolbar-icon" />
            </button>
            {isMenuOpen && (
              <div className="actividades-menu">
                <button
                  className="actividades-menu-item"
                  onClick={() => {
                    setIsMenuOpen(false)
                    setShowFormModal(true)
                  }}
                  type="button"
                >
                  <AddIcon className="actividades-menu-icon" />
                  <span>Crear Actividad</span>
                </button>
                {process.env.NODE_ENV === 'development' && (
                  <button
                    className="actividades-menu-item"
                    onClick={() => {
                      setIsMenuOpen(false)
                      setIsDebugModalOpen(true)
                    }}
                    type="button"
                  >
                    <span>🐛 Debug</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <h1 className="actividades-page-title">Actividades</h1>
        <p className="actividades-page-subtitle">Gestiona las actividades de tus clientes</p>

        {/* Estado de carga */}
        {isLoading ? (
          <div className="actividades-empty-state">
            <p className="empty-state-text">Cargando actividades...</p>
          </div>
        ) : error ? (
          <div className="actividades-empty-state">
            <p className="empty-state-text">{error}</p>
          </div>
        ) : (
          <>
            {/* Estadísticas - Highlight */}
            {activities.length > 0 && (
              <div className="actividades-total-stats">
                <div className="actividades-total-stats-content">
                  <div className="actividades-total-stats-icon">
                    <WorkIcon />
                  </div>
                  <div className="actividades-total-stats-info">
                    <span className="actividades-total-stats-label">Total de Actividades</span>
                    <span className="actividades-total-stats-value">{stats.total}</span>
                  </div>
                </div>
                <div className="actividades-total-stats-details">
                  <div className="actividades-total-stats-detail">
                    <span className="actividades-total-stats-detail-label">Alta</span>
                    <span className="actividades-total-stats-detail-value actividades-priority-alta">
                      {stats.alta}
                    </span>
                  </div>
                  <div className="actividades-total-stats-detail">
                    <span className="actividades-total-stats-detail-label">Media</span>
                    <span className="actividades-total-stats-detail-value actividades-priority-media">
                      {stats.media}
                    </span>
                  </div>
                  <div className="actividades-total-stats-detail">
                    <span className="actividades-total-stats-detail-label">Baja</span>
                    <span className="actividades-total-stats-detail-value actividades-priority-baja">
                      {stats.baja}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs y Filtro */}
            <div className="actividades-tabs-container">
              <div className="actividades-tabs">
                <button
                  className={`actividades-tab ${activeTab === 'active' ? 'actividades-tab-active' : ''}`}
                  onClick={() => setActiveTab('active')}
                  type="button"
                >
                  Activas
                </button>
                <button
                  className={`actividades-tab ${activeTab === 'completed' ? 'actividades-tab-active' : ''}`}
                  onClick={() => setActiveTab('completed')}
                  type="button"
                >
                  Completadas
                </button>
              </div>
              {uniqueClients.length > 0 && (
                <div className="actividades-filter">
                  <select
                    className="actividades-filter-select"
                    value={clientFilter}
                    onChange={e => setClientFilter(e.target.value)}
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
            </div>

            {/* Lista de Actividades */}
            {filteredActivities.length === 0 ? (
              <div className="actividades-empty-state">
                <p className="empty-state-text">
                  {activeTab === 'active'
                    ? 'No hay actividades activas'
                    : 'No hay actividades completadas'}
                </p>
                <p className="empty-state-subtext">
                  {activeTab === 'active'
                    ? 'Crea tu primera actividad usando el botón del menú'
                    : 'Las actividades completadas o descartadas aparecerán aquí'}
                </p>
              </div>
            ) : (
              <div className="actividades-list">
                <h2 className="actividades-list-title">
                  {activeTab === 'active' ? 'Actividades Activas' : 'Actividades Completadas'}
                </h2>
                <div className="actividades-items">
                  {filteredActivities.map(activity => (
                    <div key={activity.id} className="actividades-item">
                      <div className="actividades-item-header">
                        <h3 className="actividades-item-name">{activity.name}</h3>
                        <div className="actividades-item-actions">
                          {activeTab === 'active' &&
                            activity.data.status !== 'done' &&
                            activity.data.status !== 'wont_do' && (
                              <button
                                onClick={() => handleComplete(activity)}
                                className="actividades-item-action-button actividades-item-action-button-complete"
                                aria-label="Completar actividad"
                                type="button"
                              >
                                <CheckCircleIcon className="actividades-item-action-icon" />
                              </button>
                            )}
                          <button
                            onClick={() => handleEdit(activity)}
                            className="actividades-item-action-button"
                            aria-label="Editar actividad"
                            type="button"
                          >
                            <EditIcon className="actividades-item-action-icon" />
                          </button>
                          <button
                            onClick={() => handleDelete(activity.id, activity.name)}
                            className="actividades-item-action-button actividades-item-action-button-danger"
                            aria-label="Eliminar actividad"
                            type="button"
                          >
                            <DeleteIcon className="actividades-item-action-icon" />
                          </button>
                        </div>
                      </div>

                      <div className="actividades-item-content">
                        {/* Estado y Prioridad - Badges Destacados */}
                        <div className="actividades-item-main-info">
                          <span
                            className="actividades-item-status-badge"
                            style={{
                              backgroundColor: `${getStatusColor(activity.data.status)}20`,
                              borderColor: getStatusColor(activity.data.status),
                              color: getStatusColor(activity.data.status),
                            }}
                          >
                            {getStatusLabel(activity.data.status)}
                          </span>
                          {activity.data.priority && (
                            <span
                              className={`actividades-item-priority-badge actividades-priority-${activity.data.priority.toLowerCase()}`}
                            >
                              <PriorityHighIcon className="actividades-item-priority-badge-icon" />
                              {activity.data.priority}
                            </span>
                          )}
                          {activity.data.assignmentDate && (
                            <div className="actividades-item-date-badge">
                              <CalendarTodayIcon className="actividades-item-date-icon" />
                              <div className="actividades-item-date-content">
                                <span className="actividades-item-date-value">
                                  {formatDate(activity.data.assignmentDate)}
                                </span>
                                {(() => {
                                  const daysSince = calculateDaysSince(activity.data.assignmentDate)
                                  if (daysSince !== null) {
                                    return (
                                      <span className="actividades-item-date-days">
                                        {daysSince === 0
                                          ? 'Hoy'
                                          : daysSince === 1
                                            ? 'Hace 1 día'
                                            : `Hace ${daysSince} días`}
                                      </span>
                                    )
                                  }
                                  return null
                                })()}
                              </div>
                            </div>
                          )}
                          {activity.data.completedDate && (
                            <div className="actividades-item-completed-badge">
                              <CheckCircleIcon className="actividades-item-completed-icon" />
                              <div className="actividades-item-completed-content">
                                <span className="actividades-item-completed-label">
                                  Completada:
                                </span>
                                <span className="actividades-item-completed-value">
                                  {formatDate(activity.data.completedDate)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Información Básica - Grid */}
                        <div className="actividades-item-info-grid">
                          {activity.data.client && (
                            <div className="actividades-item-info-item">
                              <PersonIcon className="actividades-item-info-icon" />
                              <div className="actividades-item-info-content">
                                <span className="actividades-item-info-label">Cliente</span>
                                <span className="actividades-item-info-value">
                                  {activity.data.client}
                                </span>
                              </div>
                            </div>
                          )}

                          {activity.data.ticket && (
                            <div className="actividades-item-info-item">
                              <ConfirmationNumberIcon className="actividades-item-info-icon" />
                              <div className="actividades-item-info-content">
                                <span className="actividades-item-info-label">Ticket</span>
                                <span className="actividades-item-info-value">
                                  {activity.data.ticket}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Descripción de la Actividad */}
                        {activity.data.activity && (
                          <div className="actividades-item-additional">
                            <div className="actividades-item-additional-item">
                              <AssignmentIcon className="actividades-item-additional-icon" />
                              <div className="actividades-item-additional-content">
                                <span className="actividades-item-additional-label">Actividad</span>
                                <p className="actividades-item-additional-text">
                                  {activity.data.activity}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal de Formulario */}
        {showFormModal && (
          <div
            className="actividades-modal-overlay"
            onClick={() => {
              setShowFormModal(false)
              handleCancelEdit()
            }}
          >
            <div
              className="actividades-modal actividades-modal-large"
              onClick={e => e.stopPropagation()}
            >
              <div className="actividades-modal-header">
                <h2 className="actividades-modal-title">
                  {editingId ? 'Editar Actividad' : 'Crear Actividad'}
                </h2>
                <button
                  className="actividades-modal-close"
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
              <div className="actividades-modal-content">
                <form className="actividades-form" onSubmit={handleSubmit}>
                  <div className="actividades-form-section">
                    <h3 className="actividades-form-section-title">Información de la Actividad</h3>

                    <div className="actividades-form-group">
                      <label htmlFor="name" className="actividades-form-label">
                        Nombre de la Actividad *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="actividades-form-input"
                        placeholder="Ej: Revisión de código - Cliente XYZ"
                        required
                      />
                    </div>

                    <div className="actividades-form-group">
                      <label htmlFor="client" className="actividades-form-label">
                        <PersonIcon className="actividades-form-label-icon" />
                        Cliente *
                      </label>
                      <input
                        type="text"
                        id="client"
                        name="client"
                        value={formData.client}
                        onChange={handleChange}
                        className="actividades-form-input"
                        placeholder="Nombre del cliente"
                        required
                      />
                    </div>

                    <div className="actividades-form-group">
                      <label htmlFor="activity" className="actividades-form-label">
                        <AssignmentIcon className="actividades-form-label-icon" />
                        Actividad
                      </label>
                      <input
                        type="text"
                        id="activity"
                        name="activity"
                        value={formData.activity}
                        onChange={handleChange}
                        className="actividades-form-input"
                        placeholder="Descripción de la actividad"
                      />
                    </div>

                    <div className="actividades-form-group">
                      <label htmlFor="ticket" className="actividades-form-label">
                        <ConfirmationNumberIcon className="actividades-form-label-icon" />
                        Ticket
                      </label>
                      <input
                        type="text"
                        id="ticket"
                        name="ticket"
                        value={formData.ticket}
                        onChange={handleChange}
                        className="actividades-form-input"
                        placeholder="Número o ID del ticket"
                      />
                    </div>

                    <div className="actividades-form-group">
                      <label htmlFor="priority" className="actividades-form-label">
                        <PriorityHighIcon className="actividades-form-label-icon" />
                        Prioridad
                      </label>
                      <select
                        id="priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className="actividades-form-input"
                      >
                        <option value="">Seleccionar prioridad</option>
                        <option value="Alta">Alta</option>
                        <option value="Media">Media</option>
                        <option value="Baja">Baja</option>
                      </select>
                    </div>

                    <div className="actividades-form-group">
                      <label htmlFor="assignmentDate" className="actividades-form-label">
                        <EventIcon className="actividades-form-label-icon" />
                        Día de Asignación
                      </label>
                      <input
                        type="date"
                        id="assignmentDate"
                        name="assignmentDate"
                        value={formData.assignmentDate}
                        onChange={handleChange}
                        className="actividades-form-input"
                      />
                    </div>

                    <div className="actividades-form-group">
                      <label htmlFor="status" className="actividades-form-label">
                        <WorkIcon className="actividades-form-label-icon" />
                        Estado
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            status: e.target.value as
                              | 'defined'
                              | 'in_progress'
                              | 'blocked'
                              | 'done'
                              | 'wont_do',
                          }))
                        }
                        className="actividades-form-input"
                      >
                        <option value="defined">Definida</option>
                        <option value="in_progress">En Progreso</option>
                        <option value="blocked">Bloqueada</option>
                        <option value="done">Completada</option>
                        <option value="wont_do">No se hará</option>
                      </select>
                    </div>
                  </div>

                  <div className="actividades-form-actions">
                    {editingId ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setShowFormModal(false)
                            handleCancelEdit()
                          }}
                          className="actividades-form-button actividades-form-button-secondary"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="actividades-form-button actividades-form-button-primary"
                        >
                          <SaveIcon className="actividades-form-button-icon" />
                          {isSaving ? 'Guardando...' : 'Actualizar Actividad'}
                        </button>
                      </>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="actividades-form-button actividades-form-button-primary"
                      >
                        <SaveIcon className="actividades-form-button-icon" />
                        {isSaving ? 'Guardando...' : 'Guardar Actividad'}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Registros Guardados */}
        {showRecordsModal && (
          <div className="actividades-modal-overlay" onClick={() => setShowRecordsModal(false)}>
            <div className="actividades-modal" onClick={e => e.stopPropagation()}>
              <div className="actividades-modal-header">
                <h2 className="actividades-modal-title">Actividades Guardadas</h2>
                <button
                  className="actividades-modal-close"
                  onClick={() => setShowRecordsModal(false)}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="actividades-modal-content">
                {records.length === 0 ? (
                  <p className="actividades-modal-empty">No hay actividades guardadas</p>
                ) : (
                  <div className="actividades-modal-list">
                    {records.map(record => (
                      <div key={record.id} className="actividades-modal-item">
                        <div className="actividades-modal-item-info">
                          <h3 className="actividades-modal-item-name">{record.name}</h3>
                          <p className="actividades-modal-item-meta">
                            Cliente: {record.data.client || 'N/A'}
                          </p>
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
                          className="actividades-modal-item-button"
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
          </div>
        )}

        {/* Modal de Debug */}
        {isDebugModalOpen && (
          <div className="actividades-modal-overlay" onClick={() => setIsDebugModalOpen(false)}>
            <div className="actividades-modal" onClick={e => e.stopPropagation()}>
              <div className="actividades-modal-header">
                <h2 className="actividades-modal-title">🐛 Debug - Actividades</h2>
                <button
                  className="actividades-modal-close"
                  onClick={() => setIsDebugModalOpen(false)}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="actividades-modal-content">
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

                        showNotification(
                          `${demoActivities.length} actividades demo creadas exitosamente`,
                          'success'
                        )
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
                      if (
                        !window.confirm(
                          '¿Estás seguro de que quieres eliminar TODAS las actividades? Esta acción es irreversible.'
                        )
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

                <div className="actividades-modal-form-actions">
                  <button
                    type="button"
                    className="actividades-form-button actividades-form-button-secondary"
                    onClick={() => setIsDebugModalOpen(false)}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Actividades
