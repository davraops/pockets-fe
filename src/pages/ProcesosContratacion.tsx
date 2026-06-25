import { useState, useEffect, useRef } from 'react'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import WorkIcon from '@mui/icons-material/Work'
import PersonIcon from '@mui/icons-material/Person'
import BusinessIcon from '@mui/icons-material/Business'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import EventIcon from '@mui/icons-material/Event'
import SaveIcon from '@mui/icons-material/Save'
import CloseIcon from '@mui/icons-material/Close'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import TodayIcon from '@mui/icons-material/Today'
import ScheduleIcon from '@mui/icons-material/Schedule'
import HistoryIcon from '@mui/icons-material/History'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ChatIcon from '@mui/icons-material/Chat'
import { buildDemoHiringProcesses } from '../components/trabajo/procesoDemoData'
import ProcesoContratacionCloseModal from '../components/procesosContratacion/ProcesoContratacionCloseModal'
import ProcesoContratacionClosurePanel from '../components/procesosContratacion/ProcesoContratacionClosurePanel'
import ProcesoContratacionDetailModal from '../components/procesosContratacion/ProcesoContratacionDetailModal'
import ProcesoContratacionListRow from '../components/procesosContratacion/ProcesoContratacionListRow'
import {
  buildCloseProcessPayload,
  buildClosureStats,
  buildInterviewEvents,
  buildReinforceSkillUpdate,
  formatProcesoDate,
  formatProcesoDateTime,
  isProcesoOpen,
  isProcesoStagnant,
  listProcesosToReinforceSkill,
  mapProcesoFromAPI,
} from '../components/procesosContratacion/procesoContratacionDisplayUtils'
import type {
  HiringProcessAPI,
  InterviewEvent,
  ProcesoContratacion,
  ProcesoContratacionTab,
  ProcesoClosureReason,
} from '../components/procesosContratacion/procesoContratacionTypes'
import CrudSummaryStrip from '../components/crud/CrudSummaryStrip'
import UtilidadesSubHeader from '../components/utilidades/UtilidadesSubHeader'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import {
  isDebugToolsEnabled,
  isDestructiveDebugEnabled,
  devError,
} from '../utils/debugTools'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import './ProcesosContratacion.css'

function ProcesosContratacion() {
  const { showNotification } = useNotification()
  const [procesos, setProcesos] = useState<ProcesoContratacion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isDebugLoading, setIsDebugLoading] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedProceso, setSelectedProceso] = useState<ProcesoContratacion | null>(null)
  const [pageTab, setPageTab] = useState<ProcesoContratacionTab>('pipeline')
  const [closeTarget, setCloseTarget] = useState<ProcesoContratacion | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [reinforcingSkillKey, setReinforcingSkillKey] = useState<string | null>(null)
  const [isUpcomingExpanded, setIsUpcomingExpanded] = useState(true)
  const [isPastExpanded, setIsPastExpanded] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    contactVia: 'LinkedIn' as 'LinkedIn' | 'WhatsApp' | 'Email',
    company: '',
    roleDescription: '',
    salaryRangeMin: '',
    salaryRangeMax: '',
    salaryCurrency: 'USD',
    negotiatedSalary: '',
    negotiatedCurrency: 'USD',
    benefits: [] as string[],
    newBenefit: '',
    hiringSteps: [] as Array<{ step: string; completed: boolean }>,
    newHiringStep: '',
    interviewDates: [] as Array<{ date: string; time: string }>,
    newInterviewDate: '',
    newInterviewTime: '',
    interactions: [] as Array<{ date: string; description: string }>,
    newInteractionDate: '',
    newInteractionDescription: '',
    status: 'Abierto' as 'Abierto' | 'Cerrado',
    hasAgency: false,
    agencyName: '',
    payToLeadingZen: false,
  })

  useEffect(() => {
    loadProcesos()
  }, [])

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isMenuOpen && !target.closest('.procesos-contratacion-toolbar-menu-container')) {
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

  const loadProcesos = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await api.getHiringProcesses()

      if (response.hiring_processes && Array.isArray(response.hiring_processes)) {
        const procesosMapeados = response.hiring_processes.map((proc: HiringProcessAPI) =>
          mapProcesoFromAPI(proc)
        )

        // Ordenar por fecha de apertura (más recientes primero)
        procesosMapeados.sort((a, b) => {
          return new Date(b.fechaApertura).getTime() - new Date(a.fechaApertura).getTime()
        })

        setProcesos(procesosMapeados)
      } else {
        setProcesos([])
      }
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al cargar los procesos de contratación. Por favor, intenta de nuevo.'
      )
      setError(errorMessage)
      showNotification(errorMessage, 'error')
      setProcesos([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el proceso "${name}"?`)) {
      return
    }

    try {
      await api.deleteHiringProcess(id)
      showNotification('Proceso eliminado exitosamente', 'success')
      await loadProcesos()
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar el proceso. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      if (name.startsWith('hiringStep_')) {
        const stepIndex = parseInt(name.replace('hiringStep_', ''))
        setFormData(prev => ({
          ...prev,
          hiringSteps: prev.hiringSteps.map((step, index) =>
            index === stepIndex ? { ...step, completed: checked } : step
          ),
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: checked,
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleAddHiringStep = () => {
    if (formData.newHiringStep.trim()) {
      setFormData(prev => ({
        ...prev,
        hiringSteps: [...prev.hiringSteps, { step: prev.newHiringStep.trim(), completed: false }],
        newHiringStep: '',
      }))
    }
  }

  const handleRemoveHiringStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      hiringSteps: prev.hiringSteps.filter((_, i) => i !== index),
    }))
  }

  const handleAddBenefit = () => {
    if (formData.newBenefit.trim()) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, prev.newBenefit.trim()],
        newBenefit: '',
      }))
    }
  }

  const handleRemoveBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }))
  }

  const handleAddInterviewDate = () => {
    if (formData.newInterviewDate) {
      setFormData(prev => ({
        ...prev,
        interviewDates: [
          ...prev.interviewDates,
          {
            date: prev.newInterviewDate,
            time: prev.newInterviewTime || '00:00',
          },
        ],
        newInterviewDate: '',
        newInterviewTime: '',
      }))
    }
  }

  const handleRemoveInterviewDate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      interviewDates: prev.interviewDates.filter((_, i) => i !== index),
    }))
  }

  const handleAddInteraction = () => {
    if (formData.newInteractionDate && formData.newInteractionDescription.trim()) {
      setFormData(prev => ({
        ...prev,
        interactions: [
          ...prev.interactions,
          {
            date: prev.newInteractionDate,
            description: prev.newInteractionDescription.trim(),
          },
        ],
        newInteractionDate: '',
        newInteractionDescription: '',
      }))
    }
  }

  const handleRemoveInteraction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      interactions: prev.interactions.filter((_, i) => i !== index),
    }))
  }

  const handleEdit = (proceso: ProcesoContratacion) => {
    const data = proceso.rawData.data || {}
    // Manejar compatibilidad: interviewDates puede ser array de strings o array de objetos
    let interviewDates: Array<{ date: string; time: string }> = []
    if (data.interviewDates && Array.isArray(data.interviewDates)) {
      interviewDates = data.interviewDates.map((item: any) => {
        if (typeof item === 'string') {
          // Compatibilidad: si es string, asumimos que es solo fecha
          return { date: item, time: '00:00' }
        }
        return { date: item.date || '', time: item.time || '00:00' }
      })
    }

    setFormData({
      name: proceso.rawData.name,
      contact: data.contact || '',
      contactVia: data.contactVia || 'LinkedIn',
      company: data.company || '',
      roleDescription: data.roleDescription || '',
      salaryRangeMin: data.salaryRange?.min?.toString() || '',
      salaryRangeMax: data.salaryRange?.max?.toString() || '',
      salaryCurrency: data.salaryRange?.currency || 'USD',
      negotiatedSalary: data.negotiatedSalary?.amount?.toString() || '',
      negotiatedCurrency: data.negotiatedSalary?.currency || 'USD',
      benefits: data.benefits || [],
      newBenefit: '',
      hiringSteps: Array.isArray(data.hiringSteps)
        ? data.hiringSteps
        : data.hiringSteps
          ? Object.entries(data.hiringSteps).map(([step, completed]) => ({
              step,
              completed: Boolean(completed),
            }))
          : [],
      newHiringStep: '',
      interviewDates: interviewDates,
      newInterviewDate: '',
      newInterviewTime: '',
      interactions: Array.isArray(data.interactions) ? data.interactions : [],
      newInteractionDate: '',
      newInteractionDescription: '',
      status: (data.status as 'Abierto' | 'Cerrado') || 'Abierto',
      hasAgency: data.hasAgency || false,
      agencyName: data.agencyName || '',
      payToLeadingZen: data.payToLeadingZen || false,
    })
    setEditingId(proceso.id)
    setShowFormModal(true)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({
      name: '',
      contact: '',
      contactVia: 'LinkedIn',
      company: '',
      roleDescription: '',
      salaryRangeMin: '',
      salaryRangeMax: '',
      salaryCurrency: 'USD',
      negotiatedSalary: '',
      negotiatedCurrency: 'USD',
      benefits: [],
      newBenefit: '',
      hiringSteps: [],
      newHiringStep: '',
      interviewDates: [],
      newInterviewDate: '',
      newInterviewTime: '',
      interactions: [],
      newInteractionDate: '',
      newInteractionDescription: '',
      status: 'Abierto',
      hasAgency: false,
      agencyName: '',
      payToLeadingZen: false,
    })
    setShowFormModal(false)
  }

  const handleOpenCreateModal = () => {
    setEditingId(null)
    setFormData({
      name: '',
      contact: '',
      contactVia: 'LinkedIn',
      company: '',
      roleDescription: '',
      salaryRangeMin: '',
      salaryRangeMax: '',
      salaryCurrency: 'USD',
      negotiatedSalary: '',
      negotiatedCurrency: 'USD',
      benefits: [],
      newBenefit: '',
      hiringSteps: [],
      newHiringStep: '',
      interviewDates: [],
      newInterviewDate: '',
      newInterviewTime: '',
      interactions: [],
      newInteractionDate: '',
      newInteractionDescription: '',
      status: 'Abierto',
      hasAgency: false,
      agencyName: '',
      payToLeadingZen: false,
    })
    setShowFormModal(true)
  }

  const handleDebugCreateHiringProcesses = async () => {
    if (!isDebugToolsEnabled()) {
      return
    }

    try {
      setIsDebugLoading(true)
      const demoProcesses = buildDemoHiringProcesses()

      for (const process of demoProcesses) {
        await api.createHiringProcess(process)
      }

      showNotification(`${demoProcesses.length} procesos demo creados exitosamente`, 'success')
      await loadProcesos()
      setIsDebugModalOpen(false)
    } catch (err: unknown) {
      devError('Error al crear procesos demo:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al crear los procesos demo. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsDebugLoading(false)
    }
  }

  const handleDebugDeleteAll = async () => {
    if (!isDestructiveDebugEnabled()) {
      return
    }

    if (
      !window.confirm(
        '¿Estás seguro de que quieres eliminar TODOS los procesos de contratación? Esta acción es irreversible.'
      )
    ) {
      return
    }

    try {
      setIsDebugLoading(true)
      await api.deleteAllHiringProcesses()
      showNotification('Todos los procesos han sido eliminados', 'success')
      await loadProcesos()
      setIsDebugModalOpen(false)
    } catch (err: unknown) {
      devError('Error al eliminar procesos demo:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar los procesos. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsDebugLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      showNotification('El nombre del proceso es requerido', 'error')
      return
    }

    if (!formData.company.trim()) {
      showNotification('El nombre de la empresa es requerido', 'error')
      return
    }

    try {
      setIsSaving(true)

      const existing = editingId ? procesos.find(item => item.id === editingId) : null
      const existingData = existing?.rawData.data

      const processData = {
        name: formData.name.trim(),
        data: {
          contact: formData.contact.trim() || undefined,
          contactVia: formData.contactVia,
          company: formData.company.trim(),
          roleDescription: formData.roleDescription.trim() || undefined,
          salaryRange:
            formData.salaryRangeMin || formData.salaryRangeMax
              ? {
                  min: formData.salaryRangeMin ? parseFloat(formData.salaryRangeMin) : undefined,
                  max: formData.salaryRangeMax ? parseFloat(formData.salaryRangeMax) : undefined,
                  currency: formData.salaryCurrency,
                }
              : undefined,
          negotiatedSalary: formData.negotiatedSalary
            ? {
                amount: parseFloat(formData.negotiatedSalary),
                currency: formData.negotiatedCurrency,
              }
            : undefined,
          benefits: formData.benefits.length > 0 ? formData.benefits : undefined,
          hiringSteps: formData.hiringSteps.length > 0 ? formData.hiringSteps : undefined,
          interviewDates: formData.interviewDates.length > 0 ? formData.interviewDates : undefined,
          interactions: formData.interactions.length > 0 ? formData.interactions : undefined,
          status: existingData?.status === 'Cerrado' ? 'Cerrado' : 'Abierto',
          closingDate: existingData?.closingDate,
          closure: existingData?.closure,
          hasAgency: formData.hasAgency || undefined,
          agencyName:
            formData.hasAgency && formData.agencyName.trim()
              ? formData.agencyName.trim()
              : undefined,
          payToLeadingZen: formData.payToLeadingZen || undefined,
        },
      }

      if (editingId) {
        await api.updateHiringProcess(editingId, processData)
        showNotification('Proceso actualizado exitosamente', 'success')
      } else {
        await api.createHiringProcess(processData)
        showNotification('Proceso creado exitosamente', 'success')
      }

      await loadProcesos()
      handleCancelEdit()
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al guardar el proceso. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const handleOpenDetailModal = (proceso: ProcesoContratacion) => {
    setSelectedProceso(proceso)
    setIsDetailModalOpen(true)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedProceso(null)
  }

  const handleOpenCloseModal = (proceso: ProcesoContratacion) => {
    setCloseTarget(proceso)
    setIsDetailModalOpen(false)
  }

  const handleConfirmClose = async (payload: {
    reason: ProcesoClosureReason
    notes: string
    skillsGap: string[]
  }) => {
    if (!closeTarget) return

    try {
      setIsClosing(true)
      const wasStalled = isProcesoStagnant(closeTarget)
      const processPayload = buildCloseProcessPayload(
        closeTarget,
        payload.reason,
        payload.notes,
        payload.skillsGap,
        wasStalled
      )
      await api.updateHiringProcess(closeTarget.id, processPayload)
      showNotification('Proceso cerrado con motivo registrado', 'success')
      setCloseTarget(null)
      await loadProcesos()
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al cerrar el proceso. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsClosing(false)
    }
  }

  const handleReinforceSkill = async (skillKey: string, skillLabel: string) => {
    const affected = listProcesosToReinforceSkill(procesos, skillKey)
    if (affected.length === 0) {
      return
    }

    try {
      setReinforcingSkillKey(skillKey)
      for (const proceso of affected) {
        const payload = buildReinforceSkillUpdate(proceso, skillKey, skillLabel)
        if (!payload) continue
        await api.updateHiringProcess(proceso.id, payload)
      }
      showNotification(`"${skillLabel}" marcada como reforzada`, 'success')
      await loadProcesos()
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al marcar la skill como reforzada. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setReinforcingSkillKey(null)
    }
  }

  const closureStats = buildClosureStats(procesos)
  const openProcesos = procesos.filter(isProcesoOpen)
  const summaryItems = [
    { label: 'Abiertos', value: openProcesos.length },
    { label: 'Estancados', value: closureStats.abiertosEstancados },
    { label: 'Cerrados', value: closureStats.totalCerrados },
    { label: 'Por precio', value: closureStats.precio },
    { label: 'Por skills', value: closureStats.skills },
  ]

  const getInterviewEvents = (): InterviewEvent[] => buildInterviewEvents(procesos)

  const getTodayInterviews = (): InterviewEvent[] => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return getInterviewEvents().filter(event => {
      const eventDate = new Date(event.datetime)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate.getTime() >= today.getTime() && eventDate.getTime() < tomorrow.getTime()
    })
  }

  const getUpcomingInterviews = (): InterviewEvent[] => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    return getInterviewEvents().filter(event => {
      const eventDate = new Date(event.datetime)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate.getTime() >= tomorrow.getTime()
    })
  }

  const getPastInterviews = (): InterviewEvent[] => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return getInterviewEvents().filter(event => {
      const eventDate = new Date(event.datetime)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate.getTime() < today.getTime()
    })
  }

  const getWeekInterviews = (): InterviewEvent[] => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekLater = new Date(today)
    weekLater.setDate(today.getDate() + 7)

    return getInterviewEvents().filter(event => {
      const eventDate = new Date(event.datetime)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate.getTime() >= today.getTime() && eventDate.getTime() <= weekLater.getTime()
    })
  }

  return (
    <div className="app-page-container">
      <div className="app-page-content procesos-contratacion-content">
        <UtilidadesSubHeader
          title="Procesos"
          context="Contratación"
          backTo="/trabajo"
          backLabel="Volver a Trabajo"
          meta={`${openProcesos.length} abiertos · ${closureStats.totalCerrados} cerrados`}
          toolbarActions={
            <div className="procesos-contratacion-toolbar-menu-container" ref={menuRef}>
              <button
                className="app-toolbar-button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Opciones"
                aria-expanded={isMenuOpen}
                type="button"
              >
                <MoreVertIcon className="app-toolbar-icon" />
              </button>
              {isMenuOpen ? (
                <div className="procesos-contratacion-menu">
                  <button
                    className="procesos-contratacion-menu-item"
                    onClick={() => {
                      setIsMenuOpen(false)
                      void loadProcesos()
                    }}
                    type="button"
                    disabled={isLoading}
                  >
                    <RefreshIcon className="procesos-contratacion-menu-icon" />
                    <span>Actualizar</span>
                  </button>
                  {isDebugToolsEnabled() ? (
                    <button
                      className="procesos-contratacion-menu-item"
                      onClick={() => {
                        setIsMenuOpen(false)
                        setIsDebugModalOpen(true)
                      }}
                      type="button"
                    >
                      <span>🐛 Debug</span>
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          }
        />

        <CrudSummaryStrip
          ariaLabel="Resumen de procesos de contratación"
          items={summaryItems}
        />

        <button
          type="button"
          className="btn-base btn-accent btn-block btn-submit crud-primary-cta"
          onClick={handleOpenCreateModal}
          aria-label="Nuevo proceso de contratación"
        >
          <AddIcon aria-hidden="true" />
          Nuevo proceso
        </button>

        <div className="proceso-contratacion-tabs" role="tablist" aria-label="Vistas de procesos">
          {(
            [
              { id: 'pipeline', label: 'Pipeline' },
              { id: 'cierres', label: 'Motivos de cierre' },
              { id: 'agenda', label: 'Agenda' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={pageTab === tab.id}
              className={`crud-segmented-tab${pageTab === tab.id ? ' crud-segmented-tab--active' : ''}`}
              onClick={() => setPageTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {pageTab === 'agenda' ? (
          <div className="procesos-contratacion-agenda">
          {isLoading ? (
            <div className="procesos-contratacion-empty-state">
              <p>Cargando entrevistas...</p>
            </div>
          ) : (
            <>
              {/* Highlight de entrevistas de la semana */}
              {getWeekInterviews().length > 0 && (
                <div className="procesos-contratacion-week-highlight">
                  <EventIcon className="procesos-contratacion-week-highlight-icon" />
                  <div className="procesos-contratacion-week-highlight-content">
                    <span className="procesos-contratacion-week-highlight-label">
                      Entrevistas esta semana
                    </span>
                    <span className="procesos-contratacion-week-highlight-count">
                      {getWeekInterviews().length}
                    </span>
                  </div>
                </div>
              )}

              {/* Entrevistas de Hoy */}
              {getTodayInterviews().length > 0 && (
                <div className="procesos-contratacion-agenda-section">
                  <div className="procesos-contratacion-agenda-section-header">
                    <TodayIcon className="procesos-contratacion-agenda-section-icon" />
                    <h2 className="procesos-contratacion-agenda-section-title">Hoy</h2>
                    <span className="procesos-contratacion-agenda-section-count">
                      {getTodayInterviews().length}
                    </span>
                  </div>
                  <div className="procesos-contratacion-agenda-list">
                    {getTodayInterviews().map((event, index) => {
                      const proceso = procesos.find(p => p.id === event.procesoId)
                      return (
                        <div
                          key={`today-${index}`}
                          className="procesos-contratacion-agenda-item procesos-contratacion-agenda-item-today"
                          onClick={() => proceso && handleOpenDetailModal(proceso)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="procesos-contratacion-agenda-item-time">
                            <span className="procesos-contratacion-agenda-item-hour">
                              {event.time}
                            </span>
                          </div>
                          <div className="procesos-contratacion-agenda-item-content">
                            <h3 className="procesos-contratacion-agenda-item-title">
                              {event.procesoName}
                            </h3>
                            <p className="procesos-contratacion-agenda-item-company">
                              {event.empresa}
                            </p>
                          </div>
                          <ChevronRightIcon className="procesos-contratacion-agenda-item-chevron" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Próximas Entrevistas - Collapsible */}
              {getUpcomingInterviews().length > 0 && (
                <div className="procesos-contratacion-agenda-section">
                  <button
                    className="procesos-contratacion-agenda-section-header procesos-contratacion-agenda-section-header-collapsible"
                    onClick={() => setIsUpcomingExpanded(!isUpcomingExpanded)}
                    type="button"
                  >
                    <ScheduleIcon className="procesos-contratacion-agenda-section-icon" />
                    <h2 className="procesos-contratacion-agenda-section-title">Próximas</h2>
                    <span className="procesos-contratacion-agenda-section-count">
                      {getUpcomingInterviews().length}
                    </span>
                    {isUpcomingExpanded ? (
                      <ExpandLessIcon className="procesos-contratacion-agenda-section-expand-icon" />
                    ) : (
                      <ExpandMoreIcon className="procesos-contratacion-agenda-section-expand-icon" />
                    )}
                  </button>
                  {isUpcomingExpanded && (
                    <div className="procesos-contratacion-agenda-list">
                      {getUpcomingInterviews().map((event, index) => {
                        const proceso = procesos.find(p => p.id === event.procesoId)
                        return (
                          <div
                            key={`upcoming-${index}`}
                            className="procesos-contratacion-agenda-item"
                            onClick={() => proceso && handleOpenDetailModal(proceso)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="procesos-contratacion-agenda-item-time">
                              <span className="procesos-contratacion-agenda-item-date">
                                {formatProcesoDate(event.date)}
                              </span>
                              <span className="procesos-contratacion-agenda-item-hour">
                                {event.time}
                              </span>
                            </div>
                            <div className="procesos-contratacion-agenda-item-content">
                              <h3 className="procesos-contratacion-agenda-item-title">
                                {event.procesoName}
                              </h3>
                              <p className="procesos-contratacion-agenda-item-company">
                                {event.empresa}
                              </p>
                            </div>
                            <ChevronRightIcon className="procesos-contratacion-agenda-item-chevron" />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Entrevistas Pasadas - Collapsible */}
              {getPastInterviews().length > 0 && (
                <div className="procesos-contratacion-agenda-section">
                  <button
                    className="procesos-contratacion-agenda-section-header procesos-contratacion-agenda-section-header-collapsible"
                    onClick={() => setIsPastExpanded(!isPastExpanded)}
                    type="button"
                  >
                    <HistoryIcon className="procesos-contratacion-agenda-section-icon" />
                    <h2 className="procesos-contratacion-agenda-section-title">Pasadas</h2>
                    <span className="procesos-contratacion-agenda-section-count">
                      {getPastInterviews().length}
                    </span>
                    {isPastExpanded ? (
                      <ExpandLessIcon className="procesos-contratacion-agenda-section-expand-icon" />
                    ) : (
                      <ExpandMoreIcon className="procesos-contratacion-agenda-section-expand-icon" />
                    )}
                  </button>
                  {isPastExpanded && (
                    <div className="procesos-contratacion-agenda-list">
                      {getPastInterviews().map((event, index) => {
                        const proceso = procesos.find(p => p.id === event.procesoId)
                        return (
                          <div
                            key={`past-${index}`}
                            className="procesos-contratacion-agenda-item procesos-contratacion-agenda-item-past"
                            onClick={() => proceso && handleOpenDetailModal(proceso)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="procesos-contratacion-agenda-item-time">
                              <span className="procesos-contratacion-agenda-item-date">
                                {formatProcesoDate(event.date)}
                              </span>
                              <span className="procesos-contratacion-agenda-item-hour">
                                {event.time}
                              </span>
                            </div>
                            <div className="procesos-contratacion-agenda-item-content">
                              <h3 className="procesos-contratacion-agenda-item-title">
                                {event.procesoName}
                              </h3>
                              <p className="procesos-contratacion-agenda-item-company">
                                {event.empresa}
                              </p>
                            </div>
                            <ChevronRightIcon className="procesos-contratacion-agenda-item-chevron" />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Estado vacío si no hay entrevistas */}
              {getTodayInterviews().length === 0 &&
                getUpcomingInterviews().length === 0 &&
                getPastInterviews().length === 0 && (
                  <div className="procesos-contratacion-empty-state">
                    <EventIcon className="empty-state-icon" />
                    <p className="empty-state-text">No hay entrevistas programadas</p>
                    <p className="empty-state-subtext">
                      Agrega fechas de entrevistas a tus procesos para verlas aquí
                    </p>
                  </div>
                )}
            </>
          )}
          </div>
        ) : null}

        {pageTab === 'pipeline' ? (
          <>
            {isLoading ? (
              <div className="procesos-contratacion-empty-state">
                <p>Cargando procesos...</p>
              </div>
            ) : error ? (
              <div className="procesos-contratacion-empty-state">
                <p>{error}</p>
              </div>
            ) : openProcesos.length === 0 ? (
              <div className="procesos-contratacion-empty-state">
                <WorkIcon className="empty-state-icon" />
                <p className="empty-state-text">No hay procesos abiertos.</p>
                <p className="empty-state-subtext">
                  Crea un proceso nuevo o revisa los cierres en la pestaña correspondiente.
                </p>
              </div>
            ) : (
              <div className="procesos-contratacion-list">
                <div className="glass-group">
                  {openProcesos.map(proceso => (
                    <ProcesoContratacionListRow
                      key={proceso.id}
                      proceso={proceso}
                      onOpen={() => handleOpenDetailModal(proceso)}
                      onEdit={() => handleEdit(proceso)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}

        {pageTab === 'cierres' ? (
          <ProcesoContratacionClosurePanel
            procesos={procesos}
            reinforcingSkillKey={reinforcingSkillKey}
            onSelectProceso={proceso => handleOpenDetailModal(proceso)}
            onReinforceSkill={(skillKey, skillLabel) => void handleReinforceSkill(skillKey, skillLabel)}
          />
        ) : null}

        {/* Modal de Formulario */}
        {showFormModal && (
              <div className="procesos-contratacion-modal-overlay" onClick={handleCancelEdit}>
                <div
                  className="procesos-contratacion-modal procesos-contratacion-modal-large"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="procesos-contratacion-modal-header">
                    <h2 className="procesos-contratacion-modal-title">
                      {editingId ? 'Editar Proceso' : 'Nuevo Proceso de Contratación'}
                    </h2>
                    <button
                      className="procesos-contratacion-modal-close"
                      onClick={handleCancelEdit}
                      aria-label="Cerrar"
                      type="button"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                  <div className="procesos-contratacion-modal-content">
                    <form className="procesos-contratacion-form" onSubmit={handleSubmit}>
                      {/* Información Básica */}
                      <div className="procesos-contratacion-form-section">
                        <h3 className="procesos-contratacion-form-section-title">
                          Información Básica
                        </h3>

                        <div className="procesos-contratacion-form-group">
                          <label htmlFor="name" className="procesos-contratacion-form-label">
                            Nombre del Proceso *
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="procesos-contratacion-form-input"
                            placeholder="Ej: Desarrollador Senior - Empresa XYZ"
                            required
                          />
                        </div>

                        <div className="procesos-contratacion-form-group">
                          <label htmlFor="company" className="procesos-contratacion-form-label">
                            <BusinessIcon className="procesos-contratacion-form-label-icon" />
                            Nombre de la Empresa *
                          </label>
                          <input
                            type="text"
                            id="company"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            className="procesos-contratacion-form-input"
                            placeholder="Ej: Empresa XYZ"
                            required
                          />
                        </div>

                        <div className="procesos-contratacion-form-group">
                          <label
                            htmlFor="roleDescription"
                            className="procesos-contratacion-form-label"
                          >
                            <WorkIcon className="procesos-contratacion-form-label-icon" />
                            Descripción del Rol
                          </label>
                          <textarea
                            id="roleDescription"
                            name="roleDescription"
                            value={formData.roleDescription}
                            onChange={handleChange}
                            className="procesos-contratacion-form-input procesos-contratacion-form-textarea"
                            placeholder="Describe el rol y responsabilidades..."
                            rows={4}
                          />
                        </div>

                        <div className="procesos-contratacion-form-group">
                          <p className="proceso-contratacion-form-status-note">
                            Los procesos se cierran desde el detalle con un motivo registrado.
                          </p>
                        </div>
                      </div>

                      {/* Contacto */}
                      <div className="procesos-contratacion-form-section">
                        <h3 className="procesos-contratacion-form-section-title">Contacto</h3>

                        <div className="procesos-contratacion-form-group">
                          <label htmlFor="contact" className="procesos-contratacion-form-label">
                            <PersonIcon className="procesos-contratacion-form-label-icon" />
                            Contacto
                          </label>
                          <input
                            type="text"
                            id="contact"
                            name="contact"
                            value={formData.contact}
                            onChange={handleChange}
                            className="procesos-contratacion-form-input"
                            placeholder="Ej: Juan Pérez"
                          />
                        </div>

                        <div className="procesos-contratacion-form-group">
                          <label htmlFor="contactVia" className="procesos-contratacion-form-label">
                            Vía de Contacto
                          </label>
                          <select
                            id="contactVia"
                            name="contactVia"
                            value={formData.contactVia}
                            onChange={handleChange}
                            className="procesos-contratacion-form-input"
                          >
                            <option value="LinkedIn">LinkedIn</option>
                            <option value="WhatsApp">WhatsApp</option>
                            <option value="Email">Email</option>
                          </select>
                        </div>

                        <div className="procesos-contratacion-form-group">
                          <label className="procesos-contratacion-form-checkbox-label">
                            <input
                              type="checkbox"
                              name="hasAgency"
                              checked={formData.hasAgency}
                              onChange={handleChange}
                              className="procesos-contratacion-form-checkbox"
                            />
                            <BusinessIcon className="procesos-contratacion-form-label-icon" />
                            <span>Es a través de agencia</span>
                          </label>
                        </div>

                        {formData.hasAgency && (
                          <div className="procesos-contratacion-form-group">
                            <label
                              htmlFor="agencyName"
                              className="procesos-contratacion-form-label"
                            >
                              <BusinessIcon className="procesos-contratacion-form-label-icon" />
                              Nombre de la Agencia
                            </label>
                            <input
                              type="text"
                              id="agencyName"
                              name="agencyName"
                              value={formData.agencyName}
                              onChange={handleChange}
                              className="procesos-contratacion-form-input"
                              placeholder="Ej: Agencia de Talento Digital"
                            />
                          </div>
                        )}

                        <div className="procesos-contratacion-form-group">
                          <label className="procesos-contratacion-form-checkbox-label">
                            <input
                              type="checkbox"
                              name="payToLeadingZen"
                              checked={formData.payToLeadingZen}
                              onChange={handleChange}
                              className="procesos-contratacion-form-checkbox"
                            />
                            <AttachMoneyIcon className="procesos-contratacion-form-label-icon" />
                            <span>Están de acuerdo con pagar a Leading Zen SAS directamente</span>
                          </label>
                        </div>
                      </div>

                      {/* Compensación */}
                      <div className="procesos-contratacion-form-section">
                        <h3 className="procesos-contratacion-form-section-title">Compensación</h3>

                        <div className="procesos-contratacion-form-salary-container">
                          <div className="procesos-contratacion-form-salary-card">
                            <label className="procesos-contratacion-form-label">
                              <AttachMoneyIcon className="procesos-contratacion-form-label-icon" />
                              Rango Salarial
                            </label>
                            <div className="procesos-contratacion-form-salary-row">
                              <div className="procesos-contratacion-form-salary-input-group">
                                <span className="procesos-contratacion-form-salary-label">
                                  Mínimo
                                </span>
                                <input
                                  type="number"
                                  name="salaryRangeMin"
                                  value={formData.salaryRangeMin}
                                  onChange={handleChange}
                                  className="procesos-contratacion-form-input"
                                  placeholder="0"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                              <div className="procesos-contratacion-form-salary-input-group">
                                <span className="procesos-contratacion-form-salary-label">
                                  Máximo
                                </span>
                                <input
                                  type="number"
                                  name="salaryRangeMax"
                                  value={formData.salaryRangeMax}
                                  onChange={handleChange}
                                  className="procesos-contratacion-form-input"
                                  placeholder="0"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                              <div className="procesos-contratacion-form-salary-input-group">
                                <span className="procesos-contratacion-form-salary-label">
                                  Moneda
                                </span>
                                <select
                                  name="salaryCurrency"
                                  value={formData.salaryCurrency}
                                  onChange={handleChange}
                                  className="procesos-contratacion-form-input"
                                >
                                  <option value="USD">USD</option>
                                  <option value="COP">COP</option>
                                  <option value="EUR">EUR</option>
                                  <option value="GBP">GBP</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="procesos-contratacion-form-salary-card">
                            <label className="procesos-contratacion-form-label">
                              <AttachMoneyIcon className="procesos-contratacion-form-label-icon" />
                              Salario Negociado
                            </label>
                            <div className="procesos-contratacion-form-salary-row">
                              <div className="procesos-contratacion-form-salary-input-group">
                                <span className="procesos-contratacion-form-salary-label">
                                  Monto
                                </span>
                                <input
                                  type="number"
                                  name="negotiatedSalary"
                                  value={formData.negotiatedSalary}
                                  onChange={handleChange}
                                  className="procesos-contratacion-form-input"
                                  placeholder="0"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                              <div className="procesos-contratacion-form-salary-input-group">
                                <span className="procesos-contratacion-form-salary-label">
                                  Moneda
                                </span>
                                <select
                                  name="negotiatedCurrency"
                                  value={formData.negotiatedCurrency}
                                  onChange={handleChange}
                                  className="procesos-contratacion-form-input"
                                >
                                  <option value="USD">USD</option>
                                  <option value="COP">COP</option>
                                  <option value="EUR">EUR</option>
                                  <option value="GBP">GBP</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Beneficios */}
                      <div className="procesos-contratacion-form-section">
                        <h3 className="procesos-contratacion-form-section-title">Beneficios</h3>

                        <div className="procesos-contratacion-form-group">
                          <label className="procesos-contratacion-form-label">
                            Lista de Beneficios
                          </label>
                          <div className="procesos-contratacion-form-array-input">
                            <input
                              type="text"
                              value={formData.newBenefit}
                              onChange={e =>
                                setFormData(prev => ({ ...prev, newBenefit: e.target.value }))
                              }
                              className="procesos-contratacion-form-input"
                              placeholder="Ej: Seguro médico, PTO ilimitado..."
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleAddBenefit()
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleAddBenefit}
                              className="procesos-contratacion-form-array-add-button"
                            >
                              <AddIcon />
                            </button>
                          </div>
                          {formData.benefits.length > 0 && (
                            <div className="procesos-contratacion-form-array-list">
                              {formData.benefits.map((benefit, index) => (
                                <div key={index} className="procesos-contratacion-form-array-item">
                                  <span>{benefit}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveBenefit(index)}
                                    className="procesos-contratacion-form-array-remove-button"
                                  >
                                    <CloseIcon />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pasos de Contratación */}
                      <div className="procesos-contratacion-form-section">
                        <h3 className="procesos-contratacion-form-section-title">
                          Pasos de Contratación
                        </h3>

                        <div className="procesos-contratacion-form-group">
                          <label className="procesos-contratacion-form-label">
                            <CheckCircleIcon className="procesos-contratacion-form-label-icon" />
                            Agregar Paso de Contratación
                          </label>
                          <div className="procesos-contratacion-form-array-input">
                            <input
                              type="text"
                              value={formData.newHiringStep}
                              onChange={e =>
                                setFormData(prev => ({ ...prev, newHiringStep: e.target.value }))
                              }
                              className="procesos-contratacion-form-input"
                              placeholder="Ej: Aplicación enviada, Screening inicial..."
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleAddHiringStep()
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleAddHiringStep}
                              className="procesos-contratacion-form-array-add-button"
                            >
                              <AddIcon />
                            </button>
                          </div>
                          {formData.hiringSteps.length > 0 && (
                            <div className="procesos-contratacion-form-hiring-steps-list">
                              {formData.hiringSteps.map((hiringStep, index) => (
                                <div
                                  key={index}
                                  className="procesos-contratacion-form-hiring-step-item"
                                >
                                  <label className="procesos-contratacion-form-checkbox-label">
                                    <input
                                      type="checkbox"
                                      name={`hiringStep_${index}`}
                                      checked={hiringStep.completed}
                                      onChange={handleChange}
                                      className="procesos-contratacion-form-checkbox"
                                    />
                                    <CheckCircleIcon
                                      className={`procesos-contratacion-form-checkbox-icon ${
                                        hiringStep.completed
                                          ? 'procesos-contratacion-form-checkbox-icon-completed'
                                          : ''
                                      }`}
                                    />
                                    <span
                                      className={
                                        hiringStep.completed
                                          ? 'procesos-contratacion-form-hiring-step-completed'
                                          : ''
                                      }
                                    >
                                      {hiringStep.step}
                                    </span>
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveHiringStep(index)}
                                    className="procesos-contratacion-form-array-remove-button"
                                  >
                                    <CloseIcon />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Fechas de Entrevistas */}
                      <div className="procesos-contratacion-form-section">
                        <h3 className="procesos-contratacion-form-section-title">
                          Fechas de Entrevistas
                        </h3>

                        <div className="procesos-contratacion-form-group">
                          <label className="procesos-contratacion-form-label">
                            <EventIcon className="procesos-contratacion-form-label-icon" />
                            Agregar Fecha y Hora de Entrevista
                          </label>
                          <div className="procesos-contratacion-form-interview-input-group">
                            <input
                              type="date"
                              value={formData.newInterviewDate}
                              onChange={e =>
                                setFormData(prev => ({ ...prev, newInterviewDate: e.target.value }))
                              }
                              className="procesos-contratacion-form-input"
                            />
                            <input
                              type="time"
                              value={formData.newInterviewTime}
                              onChange={e =>
                                setFormData(prev => ({ ...prev, newInterviewTime: e.target.value }))
                              }
                              className="procesos-contratacion-form-input"
                            />
                            <button
                              type="button"
                              onClick={handleAddInterviewDate}
                              className="procesos-contratacion-form-array-add-button"
                            >
                              <AddIcon />
                            </button>
                          </div>
                          {formData.interviewDates.length > 0 && (
                            <div className="procesos-contratacion-form-array-list">
                              {formData.interviewDates.map((interview, index) => (
                                <div key={index} className="procesos-contratacion-form-array-item">
                                  <span>
                                    {formatProcesoDate(interview.date)} a las {interview.time || '00:00'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveInterviewDate(index)}
                                    className="procesos-contratacion-form-array-remove-button"
                                  >
                                    <CloseIcon />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interacciones */}
                      <div className="procesos-contratacion-form-section">
                        <h3 className="procesos-contratacion-form-section-title">
                          Interacciones con Contacto
                        </h3>

                        <div className="procesos-contratacion-form-group">
                          <label className="procesos-contratacion-form-label">
                            <ChatIcon className="procesos-contratacion-form-label-icon" />
                            Agregar Interacción
                          </label>
                          <div className="procesos-contratacion-form-interaction-input-group">
                            <input
                              type="date"
                              value={formData.newInteractionDate}
                              onChange={e =>
                                setFormData(prev => ({
                                  ...prev,
                                  newInteractionDate: e.target.value,
                                }))
                              }
                              className="procesos-contratacion-form-input"
                            />
                            <input
                              type="text"
                              value={formData.newInteractionDescription}
                              onChange={e =>
                                setFormData(prev => ({
                                  ...prev,
                                  newInteractionDescription: e.target.value,
                                }))
                              }
                              className="procesos-contratacion-form-input"
                              placeholder="Descripción de la interacción..."
                              onKeyDown={e => {
                                if (e.key === 'Enter' && formData.newInteractionDate) {
                                  e.preventDefault()
                                  handleAddInteraction()
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleAddInteraction}
                              className="procesos-contratacion-form-array-add-button"
                            >
                              <AddIcon />
                            </button>
                          </div>
                          {formData.interactions.length > 0 && (
                            <div className="procesos-contratacion-form-array-list">
                              {formData.interactions.map((interaction, index) => (
                                <div key={index} className="procesos-contratacion-form-array-item">
                                  <div className="procesos-contratacion-form-interaction-item">
                                    <span className="procesos-contratacion-form-interaction-date">
                                      {formatProcesoDate(interaction.date)}
                                    </span>
                                    <span className="procesos-contratacion-form-interaction-description">
                                      {interaction.description}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveInteraction(index)}
                                    className="procesos-contratacion-form-array-remove-button"
                                  >
                                    <CloseIcon />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Botones de Acción */}
                      <div className="procesos-contratacion-form-actions">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="procesos-contratacion-form-button procesos-contratacion-form-button-secondary"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="procesos-contratacion-form-button procesos-contratacion-form-button-primary"
                        >
                          <SaveIcon className="procesos-contratacion-form-button-icon" />
                          {isSaving
                            ? 'Guardando...'
                            : editingId
                              ? 'Actualizar Proceso'
                              : 'Crear Proceso'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de Detalle */}
            {isDetailModalOpen && selectedProceso ? (
              <ProcesoContratacionDetailModal
                proceso={selectedProceso}
                onClose={handleCloseDetailModal}
                onEdit={() => {
                  handleCloseDetailModal()
                  handleEdit(selectedProceso)
                }}
                onCloseProcess={
                  isProcesoOpen(selectedProceso)
                    ? () => handleOpenCloseModal(selectedProceso)
                    : undefined
                }
              />
            ) : null}

            {closeTarget ? (
              <ProcesoContratacionCloseModal
                proceso={closeTarget}
                isSaving={isClosing}
                onClose={() => setCloseTarget(null)}
                onConfirm={payload => void handleConfirmClose(payload)}
              />
            ) : null}

        {/* Modal de Debug */}
        {isDebugModalOpen && isDebugToolsEnabled() && (
              <div
                className="procesos-contratacion-modal-overlay"
                onClick={() => setIsDebugModalOpen(false)}
              >
                <div className="procesos-contratacion-modal" onClick={e => e.stopPropagation()}>
                  <div className="procesos-contratacion-modal-header">
                    <h2 className="procesos-contratacion-modal-title">🐛 Debug - Procesos</h2>
                    <button
                      className="procesos-contratacion-modal-close"
                      onClick={() => setIsDebugModalOpen(false)}
                      aria-label="Cerrar"
                      type="button"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                  <div className="procesos-contratacion-modal-content">
                    <div className="procesos-contratacion-debug-options">
                      <button
                        className="procesos-contratacion-debug-option-button procesos-contratacion-debug-option-create"
                        onClick={() => void handleDebugCreateHiringProcesses()}
                        disabled={isDebugLoading}
                        type="button"
                      >
                        <span className="procesos-contratacion-debug-option-icon">📦</span>
                        <div className="procesos-contratacion-debug-option-info">
                          <h3 className="procesos-contratacion-debug-option-title">
                            Crear Procesos Demo
                          </h3>
                          <p className="procesos-contratacion-debug-option-description">
                            Crea 5 procesos de contratación de ejemplo con diferentes
                            configuraciones
                          </p>
                        </div>
                      </button>
                      <button
                        className="procesos-contratacion-debug-option-button procesos-contratacion-debug-option-delete"
                        onClick={() => void handleDebugDeleteAll()}
                        disabled={isDebugLoading || !isDestructiveDebugEnabled()}
                        type="button"
                      >
                        <span className="procesos-contratacion-debug-option-icon">🗑️</span>
                        <div className="procesos-contratacion-debug-option-info">
                          <h3 className="procesos-contratacion-debug-option-title">
                            Eliminar Todos los Procesos
                          </h3>
                          <p className="procesos-contratacion-debug-option-description">
                            ⚠️ PELIGROSO: Elimina todos los procesos (IRREVERSIBLE)
                          </p>
                        </div>
                      </button>
                    </div>

                    <div className="procesos-contratacion-form-actions">
                      <button
                        type="button"
                        className="procesos-contratacion-form-button procesos-contratacion-form-button-secondary"
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

export default ProcesosContratacion
