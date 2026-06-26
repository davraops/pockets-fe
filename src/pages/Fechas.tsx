import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Calendar, dateFnsLocalizer, View, Event as CalendarEvent } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '../styles/big-calendar-theme.css'
import AddIcon from '@mui/icons-material/Add'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ViewListIcon from '@mui/icons-material/ViewList'
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek'
import SearchIcon from '@mui/icons-material/Search'
import { api } from '../services/api'
import { devError, isDebugToolsEnabled, isDestructiveDebugEnabled } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import { useIsMobile } from '../hooks/useBreakpoint'
import './AppPage.css'
import ModalOverlay from '../components/ModalOverlay'
import ListSkeleton from '../components/ListSkeleton'
import LifestyleSubHeader from '../components/tiempo/LifestyleSubHeader'
import CrudSummaryStrip from '../components/crud/CrudSummaryStrip'
import FechaEventCard, { FechaFeaturedEvent } from '../components/fechas/FechaEventCard'
import FechasEventFormFields from '../components/fechas/FechasEventFormFields'
import {
  EMPTY_FECHAS_EVENT_FORM,
  EMPTY_FECHAS_EVENT_FORM_ERRORS,
  eventToFormData,
  formDataToEventPayload,
  validateFechasEventForm,
  type FechasEventFormData,
  type FechasEventFormErrors,
  type RecurrenceFrequency,
} from '../components/fechas/fechasFormUtils'
import {
  calculateEventHighlights,
  compareEventsBySchedule,
  excludeFeaturedEvent,
  filterEventsByQuery,
  formatEventDateLong,
  formatEventMeta,
  formatEventTime,
  formatEventWhenLabel,
  formatRecurrenceLabel,
  getNextFeaturedEvent,
  groupEventsByPeriod,
} from '../components/fechas/fechasDisplayUtils'
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
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
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
  const isMobile = useIsMobile()
  const menuRef = useRef<HTMLDivElement>(null)
  const tituloRef = useRef<HTMLInputElement>(null)
  const fechaRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<FechasEventFormData>(EMPTY_FECHAS_EVENT_FORM)
  const [formErrors, setFormErrors] = useState<FechasEventFormErrors>(EMPTY_FECHAS_EVENT_FORM_ERRORS)
  const [searchQuery, setSearchQuery] = useState('')

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
  const buildCalendarEvents = useCallback((source: Event[]): CalendarEvent[] => {
    return source.map(event => {
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
  }, [])

  const filteredEvents = useMemo(
    () => filterEventsByQuery(events, searchQuery),
    [events, searchQuery]
  )
  const hasSearch = searchQuery.trim().length > 0

  const featuredEvent = useMemo(
    () => (hasSearch ? null : getNextFeaturedEvent(filteredEvents)),
    [filteredEvents, hasSearch]
  )

  const listEvents = useMemo(
    () => excludeFeaturedEvent(filteredEvents, featuredEvent),
    [filteredEvents, featuredEvent]
  )

  const periodGroups = useMemo(() => groupEventsByPeriod(listEvents), [listEvents])

  const searchResultEvents = useMemo(
    () => [...filteredEvents].sort(compareEventsBySchedule),
    [filteredEvents]
  )

  const calendarEvents = useMemo(
    () => buildCalendarEvents(filteredEvents),
    [buildCalendarEvents, filteredEvents]
  )

  const loadEvents = useCallback(async () => {
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
      devError('Error al cargar eventos:', err)
      setError('Error al cargar los eventos. Por favor, intenta de nuevo.')
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

  const handleSelectEvent = (calendarEvent: CalendarEvent) => {
    const event = calendarEvent.resource as Event
    if (event) {
      handleOpenDetailModal(event)
    }
  }

  const renderEventCard = (event: Event) => (
    <FechaEventCard
      key={event.id}
      event={event}
      onClick={() => handleOpenDetailModal(event)}
    />
  )

  // Cerrar menú al hacer clic fuera
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
    setIsEditMode(false)
    setFormData(EMPTY_FECHAS_EVENT_FORM)
    setFormErrors(EMPTY_FECHAS_EVENT_FORM_ERRORS)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setIsEditMode(false)
    setFormData(EMPTY_FECHAS_EVENT_FORM)
    setFormErrors(EMPTY_FECHAS_EVENT_FORM_ERRORS)
  }

  const handleOpenDetailModal = (event: Event) => {
    setSelectedEvent(event)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
    setFormData(eventToFormData(event))
    setFormErrors(EMPTY_FECHAS_EVENT_FORM_ERRORS)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedEvent(null)
    setIsEditMode(false)
    setFormData(EMPTY_FECHAS_EVENT_FORM)
    setFormErrors(EMPTY_FECHAS_EVENT_FORM_ERRORS)
  }

  const handleEditClick = () => {
    setIsEditMode(true)
  }

  const handleDeleteClick = async () => {
    if (selectedEvent && (await confirm({ message: '¿Estás seguro de que quieres eliminar este evento?', variant: 'danger' }))) {
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
        devError('Error al eliminar evento:', err)
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
    const { isValid, errors } = validateFechasEventForm(formData)
    setFormErrors(errors)
    if (!isValid) {
      queueMicrotask(() => {
        if (errors.titulo) {
          tituloRef.current?.focus()
        } else if (errors.fecha) {
          fechaRef.current?.focus()
        }
      })
    }
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const payload = formDataToEventPayload(formData)

    try {
      setIsLoading(true)
      if (isEditMode && selectedEvent) {
        await api.updateEvent(selectedEvent.id, payload)

        const response = await api.getEvents()
        if (response.events && Array.isArray(response.events)) {
          const mappedEvents = response.events.map(mapEventFromAPI)
          setEvents(mappedEvents)
        }
        handleCloseDetailModal()
        showNotification('Evento actualizado exitosamente', 'success')
      } else {
        await api.createEvent(payload)

        const response = await api.getEvents()
        if (response.events && Array.isArray(response.events)) {
          const mappedEvents = response.events.map(mapEventFromAPI)
          setEvents(mappedEvents)
        }
        handleCloseModal()
        showNotification('Evento creado exitosamente', 'success')
      }
    } catch (err: any) {
      devError('Error al guardar evento:', err)
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
    if (formErrors[name as keyof FechasEventFormErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleRecurrencePreset = (frequency: RecurrenceFrequency) => {
    setFormData(prev => ({
      ...prev,
      esRecurrente: true,
      frecuenciaRecurrencia: frequency,
      intervaloRecurrencia: '1',
    }))
    if (formErrors.frecuenciaRecurrencia) {
      setFormErrors(prev => ({ ...prev, frecuenciaRecurrencia: '' }))
    }
  }

  // Función de debug para crear eventos demo
  const handleDebugCreateEvents = async () => {
    if (!isDebugToolsEnabled()) return
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
          is_recurring: true,
          recurrence_frequency: 'yearly',
          recurrence_interval: 1,
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
          is_recurring: true,
          recurrence_frequency: 'yearly',
          recurrence_interval: 1,
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
      devError('Error al crear eventos demo:', err)
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
    if (!isDestructiveDebugEnabled()) return
    if (
      (await confirm({ message: '¿Estás seguro de que quieres eliminar TODOS los eventos? Esta acción es irreversible.', variant: 'danger' }))
    ) {
      try {
        setIsLoading(true)
        await api.deleteAllEvents()
        setEvents([])
        setIsDebugModalOpen(false)
        showNotification('Todos los eventos han sido eliminados', 'success')
      } catch (err: any) {
        devError('Error al eliminar todos los eventos:', err)
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

  const highlights = useMemo(() => calculateEventHighlights(events), [events])

  const headerMeta = !isLoading && !error
    ? hasSearch
      ? `${filteredEvents.length} de ${events.length} evento${events.length !== 1 ? 's' : ''}`
      : events.length === 0
        ? 'Sin eventos registrados'
        : `${highlights.total} eventos · ${highlights.hoy} hoy · ${highlights.proximos} próximos`
    : undefined

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide crud-page-content fechas-content lifestyle-sub-content">
        <LifestyleSubHeader
          title="Fechas"
          context="Agenda"
          meta={headerMeta}
          toolbarActions={
            isDebugToolsEnabled() ? (
              <div className="lifestyle-sub-menu-container" ref={menuRef}>
                <button
                  className="app-toolbar-button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Opciones de depuración"
                  aria-expanded={isMenuOpen}
                  type="button"
                >
                  <MoreVertIcon className="app-toolbar-icon" />
                </button>
                {isMenuOpen ? (
                  <div className="lifestyle-sub-menu">
                    <button
                      className="lifestyle-sub-menu-item"
                      onClick={() => {
                        setIsDebugModalOpen(true)
                        setIsMenuOpen(false)
                      }}
                      type="button"
                    >
                      🐛 Debug
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null
          }
        />

        {!isLoading && !error && events.length > 0 ? (
          <CrudSummaryStrip
            ariaLabel="Resumen de eventos"
            items={[
              { label: 'Total', value: highlights.total, tone: 'info' },
              { label: 'Hoy', value: highlights.hoy, tone: 'available' },
              { label: 'Próximos', value: highlights.proximos, tone: 'info' },
            ]}
          />
        ) : null}

        <div className="fechas-toolbar-row">
          <div
            className={`lifestyle-toolbar${!isLoading && !error && events.length === 0 ? ' lifestyle-toolbar--solo-cta' : ''}`}
          >
            {!isLoading && !error && (events.length > 0 || hasSearch) ? (
              <label className="lifestyle-search">
                <SearchIcon className="lifestyle-search-icon" aria-hidden="true" />
                <input
                  type="search"
                  className="lifestyle-search-input"
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder="Buscar por título, lugar, fecha…"
                  aria-label="Buscar eventos"
                />
              </label>
            ) : null}
            <button
              type="button"
              className="btn-base btn-accent btn-submit crud-primary-cta lifestyle-toolbar-cta"
              onClick={handleOpenModal}
              aria-label="Agregar evento"
            >
              <AddIcon aria-hidden={true} />
              Agregar evento
            </button>
          </div>

          {!isLoading && !error && events.length > 0 ? (
            <div className="fechas-view-toggle" role="tablist" aria-label="Vista de agenda">
              <button
                className={`fechas-view-toggle-button ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                type="button"
                role="tab"
                aria-selected={viewMode === 'list'}
                aria-label="Vista de lista"
              >
                <ViewListIcon />
                <span>Lista</span>
              </button>
              <button
                className={`fechas-view-toggle-button ${viewMode === 'calendar' ? 'active' : ''}`}
                onClick={() => setViewMode('calendar')}
                type="button"
                role="tab"
                aria-selected={viewMode === 'calendar'}
                aria-label="Vista de calendario"
              >
                <CalendarViewWeekIcon />
                <span>Calendario</span>
              </button>
            </div>
          ) : null}
        </div>

        {!hasSearch && !isLoading && !error && events.length > 0 ? (
          <div className="fechas-purpose-banner">
            <span className="fechas-purpose-banner__badge">Espacio personal</span>
            <p className="fechas-purpose-banner__text">
              Fechas y compromisos contigo y los tuyos. Cuando todo lo demás falle, vas a necesitar
              tiempo real con tu familia — aquí no van eventos laborales.
            </p>
          </div>
        ) : null}

        {!hasSearch && !isLoading && !error && featuredEvent && viewMode === 'list' ? (
          <FechaFeaturedEvent
            event={featuredEvent}
            onClick={() => handleOpenDetailModal(featuredEvent)}
          />
        ) : null}

        {/* Vista de Calendario */}
        {viewMode === 'calendar' && (
          <div className="fechas-calendar-container calendar-themed">
            {isLoading && events.length === 0 ? (
              <div className="glass-group">
                <ListSkeleton variant="inset-row" count={4} aria-label="Cargando eventos" />
              </div>
            ) : error ? (
              <div className="loader-container">
                <div className="loader finanzas-stats-error-panel">
                  <p className="loader-text loader-text--error" role="alert">
                    {error}
                  </p>
                  <button
                    type="button"
                    className="btn-base btn-secondary btn-retry"
                    onClick={() => void loadEvents()}
                    aria-label="Reintentar cargar eventos"
                  >
                    <span>Reintentar</span>
                  </button>
                </div>
              </div>
            ) : (
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ 
                  height: calendarView === 'agenda' 
                    ? 'auto' 
                    : (isMobile ? 400 : 600) 
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

        {viewMode === 'list' && (
          <>
            {isLoading && events.length === 0 ? (
              <div className="fechas-event-grid">
                <ListSkeleton variant="inset-row" count={4} aria-label="Cargando eventos" />
              </div>
            ) : error && events.length === 0 ? (
              <div className="loader-container">
                <div className="loader finanzas-stats-error-panel">
                  <p className="loader-text loader-text--error" role="alert">
                    {error}
                  </p>
                  <button
                    type="button"
                    className="btn-base btn-secondary btn-retry"
                    onClick={() => void loadEvents()}
                    aria-label="Reintentar cargar eventos"
                  >
                    <span>Reintentar</span>
                  </button>
                </div>
              </div>
            ) : hasSearch && filteredEvents.length === 0 ? (
              <div className="empty-state">
                <CalendarTodayIcon className="empty-state-icon" />
                <p className="empty-text">Sin coincidencias</p>
                <p className="empty-subtext">Prueba con otro término o limpia la búsqueda</p>
              </div>
            ) : hasSearch ? (
              <section className="fechas-section" aria-label="Resultados de búsqueda">
                <h2 className="fechas-section-title">Resultados</h2>
                <div className="fechas-event-grid">
                  {searchResultEvents.map(event => renderEventCard(event))}
                </div>
              </section>
            ) : events.length === 0 ? (
              <div className="empty-state">
                <CalendarTodayIcon className="empty-state-icon" />
                <p className="empty-text">No hay eventos registrados aún</p>
                <p className="empty-subtext">Usa Agregar evento para registrar el primero</p>
              </div>
            ) : periodGroups.length === 0 ? null : (
              periodGroups.map(group => (
                <section
                  key={group.id}
                  className="fechas-section"
                  aria-label={group.label}
                >
                  <h2 className="fechas-section-title">{group.label}</h2>
                  <div
                    className={`fechas-event-grid${group.id === 'past' ? ' fechas-event-grid--past' : ''}`}
                  >
                    {group.events.map(event => renderEventCard(event))}
                  </div>
                </section>
              ))
            )}
          </>
        )}

                {/* Modal de Crear/Editar Evento */}
        {isModalOpen && (
          <ModalOverlay onClose={handleCloseModal} className="modal-overlay">
            <div
              className="modal-panel fechas-modal lifestyle-modal lifestyle-modal--form"
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-labelledby="modal-title-fechas-nuevo"
            >
              <div className="lifestyle-modal__header">
                <div className="lifestyle-modal__header-copy">
                  <p className="lifestyle-modal__kicker">Fechas · Nuevo</p>
                  <h2 className="modal-panel-title" id="modal-title-fechas-nuevo">
                    Nuevo evento
                  </h2>
                </div>
                <button
                  className="modal-panel-close"
                  onClick={handleCloseModal}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="fechas-modal-form" noValidate>
                <FechasEventFormFields
                  formData={formData}
                  formErrors={formErrors}
                  tituloRef={tituloRef}
                  fechaRef={fechaRef}
                  onChange={handleChange}
                  onRecurrencePreset={handleRecurrencePreset}
                />

                <div className="modal-actions-base lifestyle-modal__footer">
                  <button
                    type="button"
                    className="btn-base btn-secondary lifestyle-modal__btn"
                    onClick={handleCloseModal}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-base btn-accent lifestyle-modal__btn" disabled={isLoading}>
                    {isLoading ? 'Guardando...' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </ModalOverlay>
        )}

        {/* Modal de Detalle de Evento */}
        {isDetailModalOpen && selectedEvent && (
          <ModalOverlay onClose={handleCloseDetailModal} className="modal-overlay">
            <div
              className={`modal-panel fechas-modal lifestyle-modal${isEditMode ? ' lifestyle-modal--form' : ''}`}
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-labelledby="modal-title-fechas-detalle"
            >
              <div className="lifestyle-modal__header">
                <div className="lifestyle-modal__header-copy">
                  <p className="lifestyle-modal__kicker">
                    Fechas · {isEditMode ? 'Editar' : 'Detalle'}
                  </p>
                  <h2 className="modal-panel-title" id="modal-title-fechas-detalle">
                    {isEditMode ? 'Editar evento' : selectedEvent.titulo}
                  </h2>
                  {!isEditMode ? (
                    <p className="lifestyle-modal__subtitle">
                      {formatEventWhenLabel(selectedEvent)} · {formatEventMeta(selectedEvent)}
                    </p>
                  ) : null}
                </div>
                <button
                  className="modal-panel-close"
                  onClick={handleCloseDetailModal}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>

              {isEditMode ? (
                <form onSubmit={handleSubmit} className="fechas-modal-form" noValidate>
                  <FechasEventFormFields
                    formData={formData}
                    formErrors={formErrors}
                    tituloRef={tituloRef}
                    fechaRef={fechaRef}
                    onChange={handleChange}
                    onRecurrencePreset={handleRecurrencePreset}
                    tituloErrorId="edit-titulo-error"
                    fechaErrorId="edit-fecha-error"
                  />

                  <div className="modal-actions-base lifestyle-modal__footer">
                    <button
                      type="button"
                      className="btn-base btn-secondary lifestyle-modal__btn"
                      onClick={() => setIsEditMode(false)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn-base btn-accent lifestyle-modal__btn" disabled={isLoading}>
                      {isLoading ? 'Guardando...' : 'Actualizar'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="modal-panel-content lifestyle-modal__body">
                  <dl className="lifestyle-modal__info-list">
                    <div className="lifestyle-modal__info-item">
                      <dt className="lifestyle-modal__info-label">Fecha</dt>
                      <dd className="lifestyle-modal__info-value">
                        {formatEventDateLong(selectedEvent.fecha)}
                      </dd>
                    </div>
                    {selectedEvent.hora && !selectedEvent.esTodoElDia ? (
                      <div className="lifestyle-modal__info-item">
                        <dt className="lifestyle-modal__info-label">Hora</dt>
                        <dd className="lifestyle-modal__info-value">
                          {formatEventTime(selectedEvent.hora)}
                        </dd>
                      </div>
                    ) : null}
                    {selectedEvent.esTodoElDia ? (
                      <div className="lifestyle-modal__info-item">
                        <dt className="lifestyle-modal__info-label">Duración</dt>
                        <dd className="lifestyle-modal__info-value">Todo el día</dd>
                      </div>
                    ) : null}
                    {selectedEvent.descripcion ? (
                      <div className="lifestyle-modal__info-item">
                        <dt className="lifestyle-modal__info-label">Descripción</dt>
                        <dd className="lifestyle-modal__info-value">{selectedEvent.descripcion}</dd>
                      </div>
                    ) : null}
                    {selectedEvent.ubicacion ? (
                      <div className="lifestyle-modal__info-item">
                        <dt className="lifestyle-modal__info-label">Ubicación</dt>
                        <dd className="lifestyle-modal__info-value">{selectedEvent.ubicacion}</dd>
                      </div>
                    ) : null}
                    {formatRecurrenceLabel(selectedEvent) ? (
                      <div className="lifestyle-modal__info-item">
                        <dt className="lifestyle-modal__info-label">Recurrencia</dt>
                        <dd className="lifestyle-modal__info-value">
                          {formatRecurrenceLabel(selectedEvent)}
                        </dd>
                      </div>
                    ) : null}
                    {selectedEvent.esRecurrente ? (
                      <div className="lifestyle-modal__info-item">
                        <dt className="lifestyle-modal__info-label">Fecha base</dt>
                        <dd className="lifestyle-modal__info-value">
                          {formatEventDateLong(selectedEvent.fecha)}
                        </dd>
                      </div>
                    ) : null}
                  </dl>

                  <div className="modal-actions-base lifestyle-modal__footer lifestyle-modal__footer--detail">
                    <button
                      type="button"
                      className="btn-base btn-secondary lifestyle-modal__btn lifestyle-modal__btn--danger"
                      onClick={handleDeleteClick}
                      disabled={isLoading}
                    >
                      <DeleteIcon className="fechas-button-icon" aria-hidden="true" />
                      Eliminar
                    </button>
                    <button
                      type="button"
                      className="btn-base btn-accent lifestyle-modal__btn lifestyle-modal__btn--primary"
                      onClick={handleEditClick}
                    >
                      <EditIcon className="fechas-button-icon" aria-hidden="true" />
                      Editar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </ModalOverlay>
        )}

        {/* Modal de Debug */}
        {isDebugModalOpen && isDebugToolsEnabled() && (
          <ModalOverlay onClose={() => setIsDebugModalOpen(false)} className="modal-overlay">
            <div className="modal-panel" onClick={e => e.stopPropagation()}>
              <div className="modal-panel-header">
                <h2 className="modal-panel-title" id="modal-panel-title-debug-eventos">Debug - Eventos</h2>
                <button
                  className="modal-panel-close"
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
          </ModalOverlay>
        )}
      </div>
    </div>
  )
}

export default Fechas
