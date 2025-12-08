import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, dateFnsLocalizer, View, Event as CalendarEvent } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import AddIcon from '@mui/icons-material/Add'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ViewListIcon from '@mui/icons-material/ViewList'
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import './Fechas.css'

// Interfaz que coincide con la respuesta de la API (campos en inglés)
interface EventAPI {
  id: string
  title: string
  description?: string | null
  event_date: string
  event_time?: string | null
  is_all_day: boolean
  is_recurring: boolean
  recurrence_frequency?: string | null
  recurrence_interval?: number | null
  recurrence_end_date?: string | null
  recurrence_count?: number | null
  location?: string | null
  color?: string | null
  reminder_minutes?: number | null
  created_at: string
  updated_at: string
}

// Interfaz para uso interno del componente
interface Event {
  id: string
  titulo: string
  descripcion?: string | null
  fecha: string
  hora?: string | null
  esTodoElDia: boolean
  esRecurrente: boolean
  frecuenciaRecurrencia?: string | null
  intervaloRecurrencia?: number | null
  fechaFinRecurrencia?: string | null
  cantidadRecurrencias?: number | null
  ubicacion?: string | null
  color?: string | null
  recordatorioMinutos?: number | null
  fechaCreacion: string
  fechaActualizacion: string
}

// Configurar localizer para date-fns
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { es },
})

function Fechas() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [calendarView, setCalendarView] = useState<View>('month')
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const menuRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha: '',
    hora: '',
    esTodoElDia: false,
    ubicacion: '',
  })
  const [formErrors, setFormErrors] = useState({
    titulo: '',
    fecha: '',
  })

  // Mapear Evento de API a formato interno
  const mapEventFromAPI = (apiEvent: EventAPI): Event => {
    return {
      id: apiEvent.id,
      titulo: apiEvent.title,
      descripcion: apiEvent.description,
      fecha: apiEvent.event_date,
      hora: apiEvent.event_time || null,
      esTodoElDia: apiEvent.is_all_day,
      esRecurrente: apiEvent.is_recurring,
      frecuenciaRecurrencia: apiEvent.recurrence_frequency,
      intervaloRecurrencia: apiEvent.recurrence_interval,
      fechaFinRecurrencia: apiEvent.recurrence_end_date,
      cantidadRecurrencias: apiEvent.recurrence_count,
      ubicacion: apiEvent.location,
      color: apiEvent.color,
      recordatorioMinutos: apiEvent.reminder_minutes,
      fechaCreacion: apiEvent.created_at,
      fechaActualizacion: apiEvent.updated_at,
    }
  }

  // Convertir eventos al formato de react-big-calendar
  const getCalendarEvents = (): CalendarEvent[] => {
    return events.map(event => {
      const eventDate = new Date(event.fecha)
      let start: Date
      let end: Date

      if (event.esTodoElDia) {
        // Evento de todo el día: de 00:00 a 23:59
        start = new Date(eventDate)
        start.setHours(0, 0, 0, 0)
        end = new Date(eventDate)
        end.setHours(23, 59, 59, 999)
      } else if (event.hora) {
        // Evento con hora específica: duración de 1 hora por defecto
        const [hours, minutes] = event.hora.split(':').map(Number)
        start = new Date(eventDate)
        start.setHours(hours, minutes, 0, 0)
        end = new Date(start)
        end.setHours(hours + 1, minutes, 0, 0)
      } else {
        // Evento sin hora: todo el día
        start = new Date(eventDate)
        start.setHours(0, 0, 0, 0)
        end = new Date(eventDate)
        end.setHours(23, 59, 59, 999)
      }

      return {
        id: event.id,
        title: event.titulo,
        start,
        end,
        resource: event, // Guardar el evento completo para acceso rápido
      }
    })
  }

  // Manejar clic en evento del calendario
  const handleSelectEvent = (calendarEvent: CalendarEvent) => {
    const event = calendarEvent.resource as Event
    if (event) {
      handleOpenDetailModal(event)
    }
  }

  // Obtener eventos próximos (hasta 30 días)
  const getUpcomingEvents = (): Event[] => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const thirtyDaysLater = new Date(today)
    thirtyDaysLater.setDate(today.getDate() + 30)

    return events
      .filter(event => {
        const eventDate = new Date(event.fecha)
        eventDate.setHours(0, 0, 0, 0)
        return eventDate >= today && eventDate <= thirtyDaysLater
      })
      .sort((a, b) => {
        const dateA = new Date(a.fecha)
        const dateB = new Date(b.fecha)
        return dateA.getTime() - dateB.getTime()
      })
      .slice(0, 5) // Mostrar máximo 5 eventos próximos
  }

  const upcomingEvents = getUpcomingEvents()

  // Cargar eventos desde la API
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await api.getEvents()
        if (response.events && Array.isArray(response.events)) {
          const mappedEvents = response.events.map(mapEventFromAPI)
          setEvents(mappedEvents)
        } else {
          setEvents([])
        }
      } catch (err: any) {
        console.error('Error al cargar eventos:', err)
        setError('Error al cargar los eventos. Por favor, intenta de nuevo.')
        setEvents([])
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()
  }, [])

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isMenuOpen && !target.closest('.fechas-toolbar-menu-container')) {
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
    setIsEditMode(false)
    setFormData({
      titulo: '',
      descripcion: '',
      fecha: '',
      hora: '',
      esTodoElDia: false,
      ubicacion: '',
    })
    setFormErrors({
      titulo: '',
      fecha: '',
    })
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setIsEditMode(false)
    setFormData({
      titulo: '',
      descripcion: '',
      fecha: '',
      hora: '',
      esTodoElDia: false,
      ubicacion: '',
    })
    setFormErrors({
      titulo: '',
      fecha: '',
    })
  }

  const handleOpenDetailModal = (event: Event) => {
    setSelectedEvent(event)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
    setFormData({
      titulo: event.titulo,
      descripcion: event.descripcion || '',
      fecha: event.fecha,
      hora: event.hora || '',
      esTodoElDia: event.esTodoElDia,
      ubicacion: event.ubicacion || '',
    })
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedEvent(null)
    setIsEditMode(false)
    setFormData({
      titulo: '',
      descripcion: '',
      fecha: '',
      hora: '',
      esTodoElDia: false,
      ubicacion: '',
    })
    setFormErrors({
      titulo: '',
      fecha: '',
    })
  }

  const handleEditClick = () => {
    setIsEditMode(true)
  }

  const handleDeleteClick = async () => {
    if (selectedEvent && window.confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      try {
        setIsLoading(true)
        await api.deleteEvent(selectedEvent.id)
        const response = await api.getEvents()
        if (response.events && Array.isArray(response.events)) {
          const mappedEvents = response.events.map(mapEventFromAPI)
          setEvents(mappedEvents)
        }
        handleCloseDetailModal()
        showNotification('Evento eliminado exitosamente', 'success')
      } catch (err: any) {
        console.error('Error al eliminar evento:', err)
        const errorMessage = getTranslatedErrorMessage(
          err,
          'Error al eliminar el evento. Por favor, intenta de nuevo.'
        )
        showNotification(errorMessage, 'error')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const validateForm = (): boolean => {
    const errors = {
      titulo: '',
      fecha: '',
    }
    let isValid = true

    if (!formData.titulo.trim()) {
      errors.titulo = 'El título es requerido'
      isValid = false
    }

    if (!formData.fecha) {
      errors.fecha = 'La fecha es requerida'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const isValid = validateForm()
    if (!isValid) {
      return
    }

    try {
      setIsLoading(true)
      if (isEditMode && selectedEvent) {
        // Editar evento existente
        const updateData: any = {
          title: formData.titulo.trim(),
          event_date: formData.fecha,
          is_all_day: formData.esTodoElDia,
        }

        if (formData.descripcion.trim()) {
          updateData.description = formData.descripcion.trim()
        }

        if (!formData.esTodoElDia && formData.hora) {
          updateData.event_time = formData.hora
        }

        if (formData.ubicacion.trim()) {
          updateData.location = formData.ubicacion.trim()
        }

        await api.updateEvent(selectedEvent.id, updateData)

        const response = await api.getEvents()
        if (response.events && Array.isArray(response.events)) {
          const mappedEvents = response.events.map(mapEventFromAPI)
          setEvents(mappedEvents)
        }
        handleCloseDetailModal()
        showNotification('Evento actualizado exitosamente', 'success')
      } else {
        // Agregar nuevo evento
        const createData: any = {
          title: formData.titulo.trim(),
          event_date: formData.fecha,
          is_all_day: formData.esTodoElDia,
        }

        if (formData.descripcion.trim()) {
          createData.description = formData.descripcion.trim()
        }

        if (!formData.esTodoElDia && formData.hora) {
          createData.event_time = formData.hora
        }

        if (formData.ubicacion.trim()) {
          createData.location = formData.ubicacion.trim()
        }

        await api.createEvent(createData)

        const response = await api.getEvents()
        if (response.events && Array.isArray(response.events)) {
          const mappedEvents = response.events.map(mapEventFromAPI)
          setEvents(mappedEvents)
        }
        handleCloseModal()
        showNotification('Evento creado exitosamente', 'success')
      }
    } catch (err: any) {
      console.error('Error al guardar evento:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al guardar el evento. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return ''
    const [hours, minutes] = timeString.split(':')
    return `${hours}:${minutes}`
  }

  // Función de debug para crear eventos demo
  const handleDebugCreateEvents = async () => {
    try {
      setIsLoading(true)
      const today = new Date()
      const demoEvents = [
        {
          title: 'Cumpleaños de Juan',
          description: 'Celebración de cumpleaños número 30',
          event_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5)
            .toISOString()
            .split('T')[0],
          is_all_day: true,
          location: 'Casa de Juan',
        },
        {
          title: 'Reunión con amigos',
          description: 'Quedada para ver el partido de fútbol',
          event_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3)
            .toISOString()
            .split('T')[0],
          event_time: '14:00',
          is_all_day: false,
          location: 'Bar El Deportivo',
        },
        {
          title: 'Cita médica',
          description: 'Control de rutina',
          event_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)
            .toISOString()
            .split('T')[0],
          event_time: '10:30',
          is_all_day: false,
          location: 'Clínica San Rafael',
        },
        {
          title: 'Aniversario de boda',
          description: 'Celebración de 5 años de matrimonio',
          event_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15)
            .toISOString()
            .split('T')[0],
          is_all_day: true,
          location: 'Restaurante El Jardín',
        },
        {
          title: 'Cena con la familia',
          description: 'Cena especial en casa de los padres',
          event_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10)
            .toISOString()
            .split('T')[0],
          event_time: '19:00',
          is_all_day: false,
          location: 'Casa de los padres',
        },
        {
          title: 'Reunión familiar',
          description: 'Almuerzo dominical con la familia',
          event_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14)
            .toISOString()
            .split('T')[0],
          event_time: '12:00',
          is_all_day: false,
          location: 'Casa de los abuelos',
        },
        {
          title: 'Concierto',
          description: 'Concierto de música clásica',
          event_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 20)
            .toISOString()
            .split('T')[0],
          event_time: '19:30',
          is_all_day: false,
          location: 'Teatro Nacional',
        },
        {
          title: 'Vacaciones',
          description: 'Semana de descanso en la playa',
          event_date: new Date(today.getFullYear(), today.getMonth() + 1, 1)
            .toISOString()
            .split('T')[0],
          is_all_day: true,
          location: 'Cartagena',
        },
      ]

      for (const event of demoEvents) {
        await api.createEvent(event)
      }

      const response = await api.getEvents()
      if (response.events && Array.isArray(response.events)) {
        const mappedEvents = response.events.map(mapEventFromAPI)
        setEvents(mappedEvents)
      }
      setIsDebugModalOpen(false)
      showNotification('Eventos demo creados exitosamente', 'success')
    } catch (err: any) {
      console.error('Error al crear eventos demo:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al crear los eventos demo. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAllEvents = async () => {
    if (
      window.confirm(
        '¿Estás seguro de que quieres eliminar TODOS los eventos? Esta acción es irreversible.'
      )
    ) {
      try {
        setIsLoading(true)
        await api.deleteAllEvents()
        setEvents([])
        setIsDebugModalOpen(false)
        showNotification('Todos los eventos han sido eliminados', 'success')
      } catch (err: any) {
        console.error('Error al eliminar todos los eventos:', err)
        const errorMessage = getTranslatedErrorMessage(
          err,
          'Error al eliminar los eventos. Por favor, intenta de nuevo.'
        )
        showNotification(errorMessage, 'error')
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="app-page-container">
      <div className="app-page-content fechas-content">
        {/* Toolbar - HIG: Navigation */}
        <div className="fechas-toolbar">
          <button
            className="fechas-toolbar-button"
            onClick={() => navigate('/tiempo')}
            aria-label="Volver a Tiempo"
            type="button"
          >
            <ArrowBackIcon className="fechas-toolbar-icon" />
          </button>

          <div className="fechas-toolbar-menu-container" ref={menuRef}>
            <button
              className="fechas-toolbar-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menú de acciones"
              type="button"
            >
              <MoreVertIcon className="fechas-toolbar-icon" />
            </button>

            {isMenuOpen && (
              <div className="fechas-menu">
                <button
                  className="fechas-menu-item"
                  onClick={() => {
                    handleOpenModal()
                    setIsMenuOpen(false)
                  }}
                  type="button"
                >
                  <AddIcon className="fechas-menu-icon" />
                  <span>Agregar Evento</span>
                </button>
                <button
                  className="fechas-menu-item"
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
          </div>
        </div>

        <h1 className="fechas-page-title">Fechas</h1>
        <p className="fechas-page-subtitle">Gestiona tus eventos, recordatorios y cumpleaños</p>

        {/* Mensaje Inspirador */}
        <div className="fechas-inspiration-message">
          <div className="fechas-inspiration-content">
            <p className="fechas-inspiration-badge">✨ Respira tranquilo</p>
            <p className="fechas-inspiration-main">Este es un espacio libre de trabajo</p>
            <p className="fechas-inspiration-text">
              Cuando todos los engaños fallen y cuando las cosas se pongan difíciles, te vas a
              necesitar a ti y a tu familia real. Este espacio es para las fechas y compromisos
              contigo y los tuyos.
            </p>
          </div>
        </div>

        {/* Próximos Eventos */}
        {!isLoading && !error && upcomingEvents.length > 0 && (
          <div className="fechas-upcoming-section">
            <h2 className="fechas-upcoming-title">Próximos Eventos</h2>
            <div className="fechas-upcoming-list">
              {upcomingEvents.map(event => {
                const eventDate = new Date(event.fecha)
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                eventDate.setHours(0, 0, 0, 0)
                const daysUntil = Math.ceil(
                  (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                )
                const isToday = daysUntil === 0
                const isTomorrow = daysUntil === 1

                return (
                  <div
                    key={event.id}
                    className="fechas-upcoming-item"
                    onClick={() => handleOpenDetailModal(event)}
                  >
                    <div className="fechas-upcoming-item-date">
                      <span className="fechas-upcoming-item-day">
                        {eventDate.toLocaleDateString('es-ES', { day: 'numeric' })}
                      </span>
                      <span className="fechas-upcoming-item-month">
                        {eventDate.toLocaleDateString('es-ES', { month: 'short' })}
                      </span>
                    </div>
                    <div className="fechas-upcoming-item-content">
                      <div className="fechas-upcoming-item-header">
                        <h3 className="fechas-upcoming-item-title">{event.titulo}</h3>
                        <span className="fechas-upcoming-item-badge">
                          {isToday ? 'Hoy' : isTomorrow ? 'Mañana' : `En ${daysUntil} días`}
                        </span>
                      </div>
                      <div className="fechas-upcoming-item-meta">
                        {event.hora && !event.esTodoElDia && (
                          <span className="fechas-upcoming-item-time">
                            {formatTime(event.hora)}
                          </span>
                        )}
                        {event.esTodoElDia && (
                          <span className="fechas-upcoming-item-all-day">Todo el día</span>
                        )}
                        {event.ubicacion && (
                          <span className="fechas-upcoming-item-location">
                            📍 {event.ubicacion}
                          </span>
                        )}
                      </div>
                      {event.descripcion && (
                        <p className="fechas-upcoming-item-description">{event.descripcion}</p>
                      )}
                    </div>
                    <ChevronRightIcon className="fechas-upcoming-item-chevron" />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Toggle de Vista */}
        <div className="fechas-view-toggle">
          <button
            className={`fechas-view-toggle-button ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            type="button"
            aria-label="Vista de lista"
          >
            <ViewListIcon />
            <span>Lista</span>
          </button>
          <button
            className={`fechas-view-toggle-button ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
            type="button"
            aria-label="Vista de calendario"
          >
            <CalendarViewWeekIcon />
            <span>Calendario</span>
          </button>
        </div>

        {/* Vista de Calendario */}
        {viewMode === 'calendar' && (
          <div className="fechas-calendar-container">
            {isLoading ? (
              <div className="fechas-empty-state">
                <p>Cargando eventos...</p>
              </div>
            ) : error ? (
              <div className="fechas-empty-state">
                <p>{error}</p>
              </div>
            ) : (
              <Calendar
                localizer={localizer}
                events={getCalendarEvents()}
                startAccessor="start"
                endAccessor="end"
                style={{
                  height: calendarView === 'agenda' ? 'auto' : isMobile ? 400 : 600,
                }}
                view={calendarView}
                onView={setCalendarView}
                date={calendarDate}
                onNavigate={setCalendarDate}
                onSelectEvent={handleSelectEvent}
                messages={{
                  next: 'Siguiente',
                  previous: 'Anterior',
                  today: 'Hoy',
                  month: 'Mes',
                  week: 'Semana',
                  day: 'Día',
                  agenda: 'Agenda',
                  date: 'Fecha',
                  time: 'Hora',
                  event: 'Evento',
                  noEventsInRange: 'No hay eventos en este rango',
                }}
                culture="es"
              />
            )}
          </div>
        )}

        {/* Lista de Eventos */}
        {viewMode === 'list' && (
          <>
            {isLoading ? (
              <div className="fechas-empty-state">
                <p>Cargando eventos...</p>
              </div>
            ) : error ? (
              <div className="fechas-empty-state">
                <p>{error}</p>
              </div>
            ) : events.length === 0 ? (
              <div className="fechas-empty-state">
                <CalendarTodayIcon className="empty-state-icon" />
                <p className="empty-state-text">No hay eventos registrados aún.</p>
                <button className="empty-state-button" onClick={handleOpenModal} type="button">
                  Agregar Evento
                </button>
              </div>
            ) : (
              <div className="fechas-list">
                {events.map(event => (
                  <div
                    key={event.id}
                    className="fechas-item"
                    onClick={() => handleOpenDetailModal(event)}
                  >
                    <div className="fechas-item-content">
                      <div className="fechas-item-header">
                        <h3 className="fechas-item-title">{event.titulo}</h3>
                        <ChevronRightIcon className="fechas-item-chevron" />
                      </div>
                      <div className="fechas-item-meta">
                        <span className="fechas-item-date">{formatDate(event.fecha)}</span>
                        {event.hora && !event.esTodoElDia && (
                          <span className="fechas-item-time">{formatTime(event.hora)}</span>
                        )}
                        {event.esTodoElDia && (
                          <span className="fechas-item-all-day">Todo el día</span>
                        )}
                      </div>
                      {event.descripcion && (
                        <p className="fechas-item-description">{event.descripcion}</p>
                      )}
                      {event.ubicacion && (
                        <p className="fechas-item-location">📍 {event.ubicacion}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Modal de Crear/Editar Evento */}
        {isModalOpen && (
          <div className="fechas-modal-overlay" onClick={handleCloseModal}>
            <div className="fechas-modal" onClick={e => e.stopPropagation()}>
              <div className="fechas-modal-header">
                <h2 className="fechas-modal-title">
                  {isEditMode ? 'Editar Evento' : 'Nuevo Evento'}
                </h2>
                <button
                  className="fechas-modal-close"
                  onClick={handleCloseModal}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="fechas-modal-form">
                {/* Nota sobre eventos laborales */}
                <div className="fechas-form-notice">
                  <span className="fechas-form-notice-icon">🚫</span>
                  <span className="fechas-form-notice-text">
                    Prohibido agregar eventos laborales aquí. Este espacio es solo para fechas y
                    compromisos contigo y los tuyos.
                  </span>
                </div>

                <div className="fechas-form-group">
                  <label htmlFor="titulo" className="fechas-form-label">
                    Título *
                  </label>
                  <input
                    type="text"
                    id="titulo"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                    className={`fechas-form-input ${formErrors.titulo ? 'error' : ''}`}
                    placeholder="Ej: Cumpleaños de Juan"
                  />
                  {formErrors.titulo && (
                    <span className="fechas-form-error">{formErrors.titulo}</span>
                  )}
                </div>

                <div className="fechas-form-group">
                  <label htmlFor="descripcion" className="fechas-form-label">
                    Descripción
                  </label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    className="fechas-form-textarea"
                    rows={3}
                    placeholder="Descripción del evento (opcional)"
                  />
                </div>

                <div className="fechas-form-group">
                  <label htmlFor="fecha" className="fechas-form-label">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    id="fecha"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    className={`fechas-form-input ${formErrors.fecha ? 'error' : ''}`}
                  />
                  {formErrors.fecha && (
                    <span className="fechas-form-error">{formErrors.fecha}</span>
                  )}
                </div>

                <div className="fechas-form-group">
                  <label className="fechas-form-checkbox-label">
                    <input
                      type="checkbox"
                      name="esTodoElDia"
                      checked={formData.esTodoElDia}
                      onChange={handleChange}
                      className="fechas-form-checkbox"
                    />
                    <span>Todo el día</span>
                  </label>
                </div>

                {!formData.esTodoElDia && (
                  <div className="fechas-form-group">
                    <label htmlFor="hora" className="fechas-form-label">
                      Hora
                    </label>
                    <input
                      type="time"
                      id="hora"
                      name="hora"
                      value={formData.hora}
                      onChange={handleChange}
                      className="fechas-form-input"
                    />
                  </div>
                )}

                <div className="fechas-form-group">
                  <label htmlFor="ubicacion" className="fechas-form-label">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    id="ubicacion"
                    name="ubicacion"
                    value={formData.ubicacion}
                    onChange={handleChange}
                    className="fechas-form-input"
                    placeholder="Ej: Restaurante El Jardín"
                  />
                </div>

                <div className="fechas-modal-actions">
                  <button
                    type="button"
                    className="fechas-button-secondary"
                    onClick={handleCloseModal}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="fechas-button-primary" disabled={isLoading}>
                    {isLoading ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Detalle de Evento */}
        {isDetailModalOpen && selectedEvent && (
          <div className="fechas-modal-overlay" onClick={handleCloseDetailModal}>
            <div className="fechas-modal" onClick={e => e.stopPropagation()}>
              <div className="fechas-modal-header">
                <h2 className="fechas-modal-title">
                  {isEditMode ? 'Editar Evento' : selectedEvent.titulo}
                </h2>
                <button
                  className="fechas-modal-close"
                  onClick={handleCloseDetailModal}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>

              {isEditMode ? (
                <form onSubmit={handleSubmit} className="fechas-modal-form">
                  {/* Nota sobre eventos laborales */}
                  <div className="fechas-form-notice">
                    <span className="fechas-form-notice-icon">🚫</span>
                    <span className="fechas-form-notice-text">
                      Prohibido agregar eventos laborales aquí. Este espacio es solo para fechas y
                      compromisos contigo y los tuyos.
                    </span>
                  </div>

                  <div className="fechas-form-group">
                    <label htmlFor="titulo" className="fechas-form-label">
                      Título *
                    </label>
                    <input
                      type="text"
                      id="titulo"
                      name="titulo"
                      value={formData.titulo}
                      onChange={handleChange}
                      className={`fechas-form-input ${formErrors.titulo ? 'error' : ''}`}
                    />
                    {formErrors.titulo && (
                      <span className="fechas-form-error">{formErrors.titulo}</span>
                    )}
                  </div>

                  <div className="fechas-form-group">
                    <label htmlFor="descripcion" className="fechas-form-label">
                      Descripción
                    </label>
                    <textarea
                      id="descripcion"
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleChange}
                      className="fechas-form-textarea"
                      rows={3}
                    />
                  </div>

                  <div className="fechas-form-group">
                    <label htmlFor="fecha" className="fechas-form-label">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      id="fecha"
                      name="fecha"
                      value={formData.fecha}
                      onChange={handleChange}
                      className={`fechas-form-input ${formErrors.fecha ? 'error' : ''}`}
                    />
                    {formErrors.fecha && (
                      <span className="fechas-form-error">{formErrors.fecha}</span>
                    )}
                  </div>

                  <div className="fechas-form-group">
                    <label className="fechas-form-checkbox-label">
                      <input
                        type="checkbox"
                        name="esTodoElDia"
                        checked={formData.esTodoElDia}
                        onChange={handleChange}
                        className="fechas-form-checkbox"
                      />
                      <span>Todo el día</span>
                    </label>
                  </div>

                  {!formData.esTodoElDia && (
                    <div className="fechas-form-group">
                      <label htmlFor="hora" className="fechas-form-label">
                        Hora
                      </label>
                      <input
                        type="time"
                        id="hora"
                        name="hora"
                        value={formData.hora}
                        onChange={handleChange}
                        className="fechas-form-input"
                      />
                    </div>
                  )}

                  <div className="fechas-form-group">
                    <label htmlFor="ubicacion" className="fechas-form-label">
                      Ubicación
                    </label>
                    <input
                      type="text"
                      id="ubicacion"
                      name="ubicacion"
                      value={formData.ubicacion}
                      onChange={handleChange}
                      className="fechas-form-input"
                    />
                  </div>

                  <div className="fechas-modal-actions">
                    <button
                      type="button"
                      className="fechas-button-secondary"
                      onClick={() => setIsEditMode(false)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="fechas-button-primary" disabled={isLoading}>
                      {isLoading ? 'Guardando...' : 'Actualizar'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="fechas-detail-content">
                  <div className="fechas-detail-section">
                    <h3 className="fechas-detail-label">Fecha</h3>
                    <p className="fechas-detail-value">{formatDate(selectedEvent.fecha)}</p>
                  </div>

                  {selectedEvent.hora && !selectedEvent.esTodoElDia && (
                    <div className="fechas-detail-section">
                      <h3 className="fechas-detail-label">Hora</h3>
                      <p className="fechas-detail-value">{formatTime(selectedEvent.hora)}</p>
                    </div>
                  )}

                  {selectedEvent.esTodoElDia && (
                    <div className="fechas-detail-section">
                      <h3 className="fechas-detail-label">Duración</h3>
                      <p className="fechas-detail-value">Todo el día</p>
                    </div>
                  )}

                  {selectedEvent.descripcion && (
                    <div className="fechas-detail-section">
                      <h3 className="fechas-detail-label">Descripción</h3>
                      <p className="fechas-detail-value">{selectedEvent.descripcion}</p>
                    </div>
                  )}

                  {selectedEvent.ubicacion && (
                    <div className="fechas-detail-section">
                      <h3 className="fechas-detail-label">Ubicación</h3>
                      <p className="fechas-detail-value">📍 {selectedEvent.ubicacion}</p>
                    </div>
                  )}

                  <div className="fechas-modal-actions">
                    <button
                      type="button"
                      className="fechas-button-danger"
                      onClick={handleDeleteClick}
                      disabled={isLoading}
                    >
                      <DeleteIcon className="fechas-button-icon" />
                      Eliminar
                    </button>
                    <button
                      type="button"
                      className="fechas-button-primary"
                      onClick={handleEditClick}
                    >
                      <EditIcon className="fechas-button-icon" />
                      Editar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Debug */}
        {isDebugModalOpen && (
          <div className="fechas-modal-overlay" onClick={() => setIsDebugModalOpen(false)}>
            <div className="fechas-modal" onClick={e => e.stopPropagation()}>
              <div className="fechas-modal-header">
                <h2 className="fechas-modal-title">Debug - Eventos</h2>
                <button
                  className="fechas-modal-close"
                  onClick={() => setIsDebugModalOpen(false)}
                  aria-label="Cerrar modal"
                  type="button"
                >
                  ×
                </button>
              </div>

              <div className="fechas-detail-content">
                <div className="debug-options">
                  <button
                    className="debug-option-button create-demo"
                    onClick={handleDebugCreateEvents}
                    disabled={isLoading}
                    type="button"
                  >
                    <span className="debug-option-icon">📦</span>
                    <div className="debug-option-info">
                      <h3 className="debug-option-title">Crear Eventos Demo</h3>
                      <p className="debug-option-description">
                        Crea 8 eventos de ejemplo para pruebas (cumpleaños, reuniones, citas, etc.)
                      </p>
                    </div>
                  </button>
                  <button
                    className="debug-option-button delete-all"
                    onClick={handleDeleteAllEvents}
                    disabled={isLoading}
                    type="button"
                  >
                    <span className="debug-option-icon">🗑️</span>
                    <div className="debug-option-info">
                      <h3 className="debug-option-title">Eliminar Todos los Eventos</h3>
                      <p className="debug-option-description">
                        ⚠️ PELIGROSO: Elimina todos los eventos (IRREVERSIBLE)
                      </p>
                    </div>
                  </button>
                </div>

                <div className="fechas-modal-actions">
                  <button
                    type="button"
                    className="fechas-button-secondary"
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

export default Fechas
