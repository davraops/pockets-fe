import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import WorkIcon from '@mui/icons-material/Work'
import PersonIcon from '@mui/icons-material/Person'
import BusinessIcon from '@mui/icons-material/Business'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import EventIcon from '@mui/icons-material/Event'
import SaveIcon from '@mui/icons-material/Save'
import CloseIcon from '@mui/icons-material/Close'
import ViewListIcon from '@mui/icons-material/ViewList'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import TodayIcon from '@mui/icons-material/Today'
import ScheduleIcon from '@mui/icons-material/Schedule'
import HistoryIcon from '@mui/icons-material/History'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ChatIcon from '@mui/icons-material/Chat'
import WarningIcon from '@mui/icons-material/Warning'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import './ProcesosContratacion.css'

interface HiringProcessData {
  contact?: string
  contactVia?: 'LinkedIn' | 'WhatsApp' | 'Email'
  company?: string
  roleDescription?: string
  status?: 'Abierto' | 'Cerrado'
  salaryRange?: {
    min?: number
    max?: number
    currency?: string
  }
  negotiatedSalary?: {
    amount?: number
    currency?: string
  }
  benefits?: string[]
  hiringSteps?: Array<{ step: string; completed: boolean }>
  interviewDates?: Array<{ date: string; time: string }>
  interactions?: Array<{ date: string; description: string }>
  hasAgency?: boolean
  agencyName?: string
  payToLeadingZen?: boolean
  // Campos legacy para compatibilidad
  position?: string
  location?: string
  applicationDate?: string
  notes?: string
  [key: string]: any
}

interface HiringProcessAPI {
  id: string
  name: string
  data: HiringProcessData
  created_at: string
  updated_at: string
}

interface ProcesoContratacion {
  id: string
  titulo: string
  empresa: string
  posicion: string
  estado: string
  fechaApertura: string
  fechaCierre?: string
  rawData: HiringProcessAPI // Guardar datos completos para edición
}

interface InterviewEvent {
  procesoId: string
  procesoName: string
  empresa: string
  date: string
  time: string
  datetime: Date
}

function ProcesosContratacion() {
  const navigate = useNavigate()
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
  const [viewMode, setViewMode] = useState<'list' | 'agenda'>('list')
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
        const procesosMapeados: ProcesoContratacion[] = response.hiring_processes.map(
          (proc: HiringProcessAPI) => {
            const data = proc.data || {}
            return {
              id: proc.id,
              titulo: proc.name,
              empresa: data.company || 'Sin empresa',
              posicion: data.position || 'Sin posición',
              estado: data.status || 'Abierto',
              fechaApertura: data.applicationDate || proc.created_at,
              fechaCierre: data.closingDate,
              rawData: proc,
            }
          }
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

  const handleDebugCreateHiringProcesses = async () => {
    try {
      setIsDebugLoading(true)
      const demoProcesses = [
        {
          name: 'Desarrollador Senior Full Stack - TechCorp',
          data: {
            contact: 'María González',
            contactVia: 'LinkedIn',
            company: 'TechCorp Inc.',
            status: 'Abierto',
            roleDescription:
              'Desarrollador Senior Full Stack para trabajar en proyectos de alta escala. Requiere experiencia en React, Node.js, y arquitecturas cloud.',
            salaryRange: {
              min: 8000,
              max: 12000,
              currency: 'USD',
            },
            negotiatedSalary: {
              amount: 10000,
              currency: 'USD',
            },
            benefits: [
              'Seguro médico completo',
              'Dental y visión',
              '401k con match del 5%',
              'PTO ilimitado',
              'Work from home',
            ],
            hiringSteps: [
              { step: 'Aplicación enviada', completed: true },
              { step: 'Screening inicial', completed: true },
              { step: 'Entrevista técnica', completed: true },
              { step: 'Entrevista cultural', completed: false },
              { step: 'Oferta recibida', completed: false },
            ],
            interviewDates: [
              { date: '2026-01-15', time: '14:00' },
              { date: '2026-01-20', time: '15:30' },
            ],
            interactions: [
              {
                date: '2025-12-15',
                description: 'Contacto inicial por LinkedIn, mostró interés en el perfil',
              },
              {
                date: '2025-12-20',
                description: 'Seguimiento por email, confirmó disponibilidad para entrevista',
              },
              { date: '2025-12-22', description: 'Envié mi portafolio y CV actualizado' },
            ],
            hasAgency: false,
            payToLeadingZen: true,
          },
        },
        {
          name: 'Frontend Developer - StartupXYZ',
          data: {
            contact: 'Carlos Ramírez',
            contactVia: 'Email',
            company: 'StartupXYZ',
            status: 'Abierto',
            roleDescription:
              'Desarrollador Frontend para startup en crecimiento. Trabajo con React, TypeScript y diseño de interfaces modernas.',
            salaryRange: {
              min: 5000,
              max: 7000,
              currency: 'USD',
            },
            negotiatedSalary: {
              amount: 6000,
              currency: 'USD',
            },
            benefits: ['Seguro médico', 'Bonos por proyecto', 'Equidad'],
            hiringSteps: [
              { step: 'Aplicación enviada', completed: true },
              { step: 'Prueba técnica', completed: true },
              { step: 'Entrevista con el equipo', completed: false },
            ],
            interviewDates: [{ date: '2026-01-18', time: '10:00' }],
            interactions: [
              {
                date: '2025-12-10',
                description: 'Contacto inicial a través de la agencia Talent Recruiters',
              },
              {
                date: '2025-12-12',
                description: 'Llamada telefónica con el reclutador, discutimos el perfil',
              },
              {
                date: '2025-12-15',
                description: 'Envié documentación solicitada (CV, portafolio)',
              },
              {
                date: '2026-01-08',
                description: 'Seguimiento por WhatsApp, confirmaron entrevista para el 18',
              },
            ],
            hasAgency: true,
            agencyName: 'Talent Recruiters',
            payToLeadingZen: false,
          },
        },
        {
          name: 'Backend Engineer - CloudSolutions',
          data: {
            contact: 'Ana Martínez',
            contactVia: 'WhatsApp',
            company: 'CloudSolutions',
            status: 'Abierto',
            roleDescription:
              'Ingeniero Backend especializado en microservicios y arquitecturas distribuidas. Experiencia con AWS, Docker, Kubernetes.',
            salaryRange: {
              min: 9000,
              max: 13000,
              currency: 'USD',
            },
            benefits: [
              'Seguro médico premium',
              'Gym membership',
              'Learning budget',
              '25 días de vacaciones',
            ],
            hiringSteps: [
              { step: 'Aplicación enviada', completed: true },
              { step: 'Screening inicial', completed: true },
              { step: 'Entrevista técnica', completed: false },
            ],
            interviewDates: [{ date: '2026-01-22', time: '16:00' }],
            interactions: [
              {
                date: '2025-12-05',
                description: 'Contacto inicial por WhatsApp, muy interesado en el perfil',
              },
              {
                date: '2025-12-08',
                description: 'Reunión virtual para conocer más sobre la empresa',
              },
              { date: '2025-12-12', description: 'Envié propuesta técnica y casos de estudio' },
            ],
            hasAgency: false,
            payToLeadingZen: true,
          },
        },
        {
          name: 'DevOps Engineer - DataTech',
          data: {
            contact: 'Roberto Silva',
            contactVia: 'LinkedIn',
            company: 'DataTech',
            status: 'Abierto',
            roleDescription:
              'Ingeniero DevOps para gestionar infraestructura cloud y pipelines CI/CD. Experiencia con Terraform, Ansible, y monitoreo.',
            salaryRange: {
              min: 7000,
              max: 10000,
              currency: 'USD',
            },
            negotiatedSalary: {
              amount: 8500,
              currency: 'USD',
            },
            benefits: ['Seguro médico', 'Stock options', 'Home office', 'Equipment budget'],
            hiringSteps: [
              { step: 'Aplicación enviada', completed: true },
              { step: 'Screening inicial', completed: true },
              { step: 'Entrevista técnica', completed: true },
              { step: 'Entrevista con CTO', completed: true },
              { step: 'Oferta recibida', completed: true },
              { step: 'Negociación', completed: false },
            ],
            interviewDates: [
              { date: '2025-12-10', time: '11:00' },
              { date: '2025-12-12', time: '14:00' },
              { date: '2025-12-15', time: '10:00' },
            ],
            interactions: [
              {
                date: '2025-11-20',
                description: 'Contacto inicial por LinkedIn desde la agencia Tech Headhunters',
              },
              {
                date: '2025-11-25',
                description: 'Primera llamada con el reclutador, discutimos expectativas',
              },
              { date: '2025-11-28', description: 'Envié CV y portafolio actualizado' },
              {
                date: '2025-12-01',
                description: 'Seguimiento por email, programaron entrevistas técnicas',
              },
              {
                date: '2025-12-05',
                description: 'Preparación para las entrevistas, revisé documentación de la empresa',
              },
            ],
            hasAgency: true,
            agencyName: 'Tech Headhunters',
            payToLeadingZen: true,
          },
        },
        {
          name: 'Mobile Developer - AppStudio',
          data: {
            contact: 'Laura Fernández',
            contactVia: 'Email',
            company: 'AppStudio',
            status: 'Cerrado',
            roleDescription:
              'Desarrollador Mobile para iOS y Android. Experiencia con React Native, Swift, y Kotlin. Trabajo en apps de consumo masivo.',
            salaryRange: {
              min: 6000,
              max: 9000,
              currency: 'USD',
            },
            benefits: ['Seguro médico', 'PTO flexible', 'Conference budget', 'Latest devices'],
            hiringSteps: [
              { step: 'Aplicación enviada', completed: true },
              { step: 'Portfolio review', completed: true },
              { step: 'Entrevista técnica', completed: false },
            ],
            interviewDates: [{ date: '2026-01-25', time: '13:00' }],
            interactions: [
              { date: '2025-12-18', description: 'Contacto inicial por email, mostraron interés' },
              {
                date: '2025-12-20',
                description: 'Llamada telefónica para conocer más detalles del rol',
              },
            ],
            hasAgency: false,
            payToLeadingZen: false,
          },
        },
      ]

      // Crear todos los procesos
      for (const process of demoProcesses) {
        await api.createHiringProcess(process)
      }

      showNotification(`${demoProcesses.length} procesos demo creados exitosamente`, 'success')
      await loadProcesos()
      setIsDebugModalOpen(false)
    } catch (err: any) {
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
    } catch (err: any) {
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
          status: formData.status,
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string, timeString: string) => {
    const date = new Date(`${dateString}T${timeString}`)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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

  // Organizar entrevistas por categorías (solo procesos abiertos)
  const getInterviewEvents = (): InterviewEvent[] => {
    const events: InterviewEvent[] = []
    // Filtrar solo procesos abiertos
    const procesosAbiertos = procesos.filter(proceso => {
      const estadoLower = proceso.estado.toLowerCase()
      return estadoLower.includes('abierto') || estadoLower.includes('activo')
    })

    procesosAbiertos.forEach(proceso => {
      const data = proceso.rawData.data || {}
      if (data.interviewDates && Array.isArray(data.interviewDates)) {
        data.interviewDates.forEach((interview: { date: string; time: string }) => {
          const datetime = new Date(`${interview.date}T${interview.time || '00:00'}`)
          events.push({
            procesoId: proceso.id,
            procesoName: proceso.titulo,
            empresa: proceso.empresa,
            date: interview.date,
            time: interview.time || '00:00',
            datetime,
          })
        })
      }
    })
    return events.sort((a, b) => a.datetime.getTime() - b.datetime.getTime())
  }

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

  const getEstadoColor = (estado: string) => {
    const estadoLower = estado.toLowerCase()
    if (estadoLower.includes('abierto') || estadoLower.includes('activo')) {
      return '#34C759'
    } else if (
      estadoLower.includes('proceso') ||
      estadoLower.includes('revisión') ||
      estadoLower.includes('revision')
    ) {
      return '#007AFF'
    } else if (estadoLower.includes('cerrado') || estadoLower.includes('finalizado')) {
      return '#8E8E93'
    }
    return '#5856D6'
  }

  // Verificar si un proceso está estancado (última interacción hace más de una semana)
  const isProcessStagnant = (proceso: ProcesoContratacion): boolean => {
    const data = proceso.rawData.data || {}
    if (!data.interactions || !Array.isArray(data.interactions) || data.interactions.length === 0) {
      // Si no hay interacciones, verificar fecha de apertura
      const fechaApertura = new Date(proceso.fechaApertura)
      const hoy = new Date()
      const diffTime = hoy.getTime() - fechaApertura.getTime()
      const diffDays = diffTime / (1000 * 60 * 60 * 24)
      return diffDays > 7
    }

    // Ordenar interacciones por fecha (más reciente primero)
    const sortedInteractions = [...data.interactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA
    })

    const ultimaInteraccion = sortedInteractions[0]
    const fechaUltimaInteraccion = new Date(ultimaInteraccion.date)
    const hoy = new Date()
    const diffTime = hoy.getTime() - fechaUltimaInteraccion.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)

    return diffDays > 7
  }

  return (
    <div className="app-page-container">
      <div className="app-page-content procesos-contratacion-content">
        {/* Toolbar */}
        <div className="procesos-contratacion-toolbar">
          <button
            className="procesos-contratacion-toolbar-button"
            onClick={() => navigate('/trabajo')}
            aria-label="Volver"
            type="button"
          >
            <ArrowBackIcon className="procesos-contratacion-toolbar-icon" />
          </button>

          <div className="procesos-contratacion-toolbar-menu-container">
            <button
              className="procesos-contratacion-toolbar-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Opciones"
              aria-expanded={isMenuOpen}
              type="button"
            >
              <MoreVertIcon className="procesos-contratacion-toolbar-icon" />
            </button>
            {isMenuOpen && (
              <div className="procesos-contratacion-menu">
                <button
                  className="procesos-contratacion-menu-item"
                  onClick={() => {
                    setIsMenuOpen(false)
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
                  }}
                  type="button"
                >
                  <AddIcon className="procesos-contratacion-menu-icon" />
                  <span>Nuevo Proceso</span>
                </button>
                <button
                  className="procesos-contratacion-menu-item"
                  onClick={() => {
                    setIsMenuOpen(false)
                    loadProcesos()
                  }}
                  type="button"
                  disabled={isLoading}
                >
                  <RefreshIcon className="procesos-contratacion-menu-icon" />
                  <span>Actualizar</span>
                </button>
                <button
                  className="procesos-contratacion-menu-item"
                  onClick={() => {
                    setIsMenuOpen(false)
                    setViewMode(viewMode === 'list' ? 'agenda' : 'list')
                  }}
                  type="button"
                >
                  {viewMode === 'list' ? (
                    <>
                      <CalendarTodayIcon className="procesos-contratacion-menu-icon" />
                      <span>Vista Agenda</span>
                    </>
                  ) : (
                    <>
                      <ViewListIcon className="procesos-contratacion-menu-icon" />
                      <span>Vista Lista</span>
                    </>
                  )}
                </button>
                {process.env.NODE_ENV === 'development' && (
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
                )}
              </div>
            )}
          </div>
        </div>

        <h1 className="procesos-contratacion-page-title">Procesos de Contratación</h1>
        <p className="procesos-contratacion-page-subtitle">
          {viewMode === 'list'
            ? 'Gestiona los procesos de contratación abiertos'
            : 'Gestiona los procesos de contratación abiertos'}
        </p>

        {/* Vista de Agenda - Siempre visible */}
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
                                {formatDate(event.date)}
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
                                {formatDate(event.date)}
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

        {/* Lista de Procesos */}
        {viewMode === 'list' && (
          <>
            {/* Lista de Procesos */}
            {isLoading ? (
              <div className="procesos-contratacion-empty-state">
                <p>Cargando procesos...</p>
              </div>
            ) : error ? (
              <div className="procesos-contratacion-empty-state">
                <p>{error}</p>
              </div>
            ) : procesos.length === 0 ? (
              <div className="procesos-contratacion-empty-state">
                <WorkIcon className="empty-state-icon" />
                <p className="empty-state-text">No hay procesos de contratación registrados aún.</p>
                <p className="empty-state-subtext">
                  Crea tu primer proceso usando el botón del menú
                </p>
              </div>
            ) : (
              <div className="procesos-contratacion-list">
                <div className="procesos-contratacion-group">
                  {procesos.map(proceso => (
                    <div
                      key={proceso.id}
                      className="procesos-contratacion-item"
                      onClick={() => handleOpenDetailModal(proceso)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="procesos-contratacion-item-content">
                        <div className="procesos-contratacion-item-header">
                          <div className="procesos-contratacion-item-title-section">
                            <div
                              className="procesos-contratacion-item-estado-indicator"
                              style={{ backgroundColor: getEstadoColor(proceso.estado) }}
                            />
                            <div className="procesos-contratacion-item-info">
                              <div className="procesos-contratacion-item-title-row">
                                <h3 className="procesos-contratacion-item-title">
                                  {proceso.titulo}
                                </h3>
                                {isProcessStagnant(proceso) && (
                                  <div
                                    className="procesos-contratacion-item-stagnant-badge"
                                    title="Proceso estancado: última interacción hace más de una semana"
                                  >
                                    <WarningIcon className="procesos-contratacion-item-stagnant-icon" />
                                    <span>Estancado</span>
                                  </div>
                                )}
                              </div>
                              <span className="procesos-contratacion-item-empresa">
                                {proceso.empresa}
                              </span>
                            </div>
                          </div>
                          <div className="procesos-contratacion-item-actions">
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                handleEdit(proceso)
                              }}
                              className="procesos-contratacion-item-action-button"
                              aria-label="Editar proceso"
                              type="button"
                            >
                              <EditIcon className="procesos-contratacion-item-action-icon" />
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                handleDelete(proceso.id, proceso.titulo)
                              }}
                              className="procesos-contratacion-item-action-button procesos-contratacion-item-action-button-danger"
                              aria-label="Eliminar proceso"
                              type="button"
                            >
                              <DeleteIcon className="procesos-contratacion-item-action-icon" />
                            </button>
                          </div>
                        </div>
                        <div className="procesos-contratacion-item-meta">
                          <span className="procesos-contratacion-item-posicion">
                            {proceso.posicion}
                          </span>
                          <span className="procesos-contratacion-item-separator">•</span>
                          <span
                            className="procesos-contratacion-item-estado"
                            style={{ color: getEstadoColor(proceso.estado) }}
                          >
                            {proceso.estado}
                          </span>
                        </div>
                        {(() => {
                          const data = proceso.rawData.data || {}
                          return (
                            <>
                              {(data.negotiatedSalary || data.payToLeadingZen) && (
                                <div className="procesos-contratacion-item-meta">
                                  {data.negotiatedSalary && (
                                    <>
                                      <span className="procesos-contratacion-item-salary">
                                        <AttachMoneyIcon className="procesos-contratacion-item-salary-icon" />
                                        {formatCurrency(
                                          data.negotiatedSalary.amount,
                                          data.negotiatedSalary.currency || 'USD'
                                        )}
                                      </span>
                                    </>
                                  )}
                                  {data.payToLeadingZen && (
                                    <>
                                      {data.negotiatedSalary && (
                                        <span className="procesos-contratacion-item-separator">
                                          •
                                        </span>
                                      )}
                                      <span className="procesos-contratacion-item-leadingzen">
                                        <BusinessIcon className="procesos-contratacion-item-leadingzen-icon" />
                                        Leading Zen SAS
                                      </span>
                                    </>
                                  )}
                                </div>
                              )}
                            </>
                          )
                        })()}
                        <div className="procesos-contratacion-item-meta">
                          <span className="procesos-contratacion-item-date">
                            Apertura: {formatDate(proceso.fechaApertura)}
                          </span>
                          {proceso.fechaCierre && (
                            <>
                              <span className="procesos-contratacion-item-separator">•</span>
                              <span className="procesos-contratacion-item-date">
                                Cierre: {formatDate(proceso.fechaCierre)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                          <label htmlFor="status" className="procesos-contratacion-form-label">
                            Estado del Proceso
                          </label>
                          <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="procesos-contratacion-form-input"
                          >
                            <option value="Abierto">Abierto</option>
                            <option value="Cerrado">Cerrado</option>
                          </select>
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
                                    {formatDate(interview.date)} a las {interview.time || '00:00'}
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
                                      {formatDate(interaction.date)}
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
            {isDetailModalOpen && selectedProceso && (
              <div className="procesos-contratacion-modal-overlay" onClick={handleCloseDetailModal}>
                <div
                  className="procesos-contratacion-modal procesos-contratacion-modal-large"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="procesos-contratacion-modal-header">
                    <h2 className="procesos-contratacion-modal-title">Detalle del Proceso</h2>
                    <button
                      className="procesos-contratacion-modal-close"
                      onClick={handleCloseDetailModal}
                      aria-label="Cerrar"
                      type="button"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                  <div className="procesos-contratacion-modal-content">
                    <div className="procesos-contratacion-detail-content">
                      {(() => {
                        const data = selectedProceso.rawData.data || {}
                        return (
                          <>
                            {/* Información Principal */}
                            <div className="procesos-contratacion-detail-section">
                              <div className="procesos-contratacion-detail-info">
                                <div className="procesos-contratacion-detail-name-row">
                                  <h3 className="procesos-contratacion-detail-name">
                                    {selectedProceso.titulo}
                                  </h3>
                                </div>
                                {isProcessStagnant(selectedProceso) && (
                                  <div className="procesos-contratacion-detail-stagnant-alert">
                                    <WarningIcon className="procesos-contratacion-detail-stagnant-icon" />
                                    <span>
                                      Proceso estancado: última interacción hace más de una semana
                                    </span>
                                  </div>
                                )}
                                <p className="procesos-contratacion-detail-company">
                                  {selectedProceso.empresa}
                                </p>
                              </div>
                            </div>

                            {/* Información Básica */}
                            {data.roleDescription && (
                              <div className="procesos-contratacion-detail-row">
                                <span className="procesos-contratacion-detail-label">
                                  Descripción del Rol
                                </span>
                                <p className="procesos-contratacion-detail-value-text">
                                  {data.roleDescription}
                                </p>
                              </div>
                            )}

                            {/* Contacto */}
                            {(data.contact || data.contactVia) && (
                              <div className="procesos-contratacion-detail-row">
                                <span className="procesos-contratacion-detail-label">Contacto</span>
                                <span className="procesos-contratacion-detail-value">
                                  {data.contact || 'N/A'}
                                  {data.contactVia && ` • ${data.contactVia}`}
                                </span>
                              </div>
                            )}

                            {/* Agencia */}
                            {data.hasAgency && (
                              <div className="procesos-contratacion-detail-row">
                                <span className="procesos-contratacion-detail-label">Agencia</span>
                                <span className="procesos-contratacion-detail-value">
                                  {data.agencyName || 'Agencia (sin nombre especificado)'}
                                </span>
                              </div>
                            )}

                            {/* Pago a Leading Zen */}
                            {data.payToLeadingZen && (
                              <div className="procesos-contratacion-detail-row">
                                <span className="procesos-contratacion-detail-label">
                                  Pago a Leading Zen SAS
                                </span>
                                <span className="procesos-contratacion-detail-value procesos-contratacion-detail-value-highlight">
                                  ✓ Están de acuerdo con pagar directamente
                                </span>
                              </div>
                            )}

                            {/* Rango Salarial */}
                            {data.salaryRange && (
                              <div className="procesos-contratacion-detail-row">
                                <span className="procesos-contratacion-detail-label">
                                  Rango Salarial
                                </span>
                                <span className="procesos-contratacion-detail-value">
                                  {data.salaryRange.min &&
                                    data.salaryRange.max &&
                                    `${formatCurrency(data.salaryRange.min, data.salaryRange.currency || 'USD')} - ${formatCurrency(data.salaryRange.max, data.salaryRange.currency || 'USD')}`}
                                  {data.salaryRange.min &&
                                    !data.salaryRange.max &&
                                    `Desde ${formatCurrency(data.salaryRange.min, data.salaryRange.currency || 'USD')}`}
                                  {!data.salaryRange.min &&
                                    data.salaryRange.max &&
                                    `Hasta ${formatCurrency(data.salaryRange.max, data.salaryRange.currency || 'USD')}`}
                                </span>
                              </div>
                            )}

                            {/* Salario Negociado */}
                            {data.negotiatedSalary && (
                              <div className="procesos-contratacion-detail-row">
                                <span className="procesos-contratacion-detail-label">
                                  Salario Negociado
                                </span>
                                <span className="procesos-contratacion-detail-value procesos-contratacion-detail-value-highlight">
                                  {formatCurrency(
                                    data.negotiatedSalary.amount,
                                    data.negotiatedSalary.currency || 'USD'
                                  )}
                                </span>
                              </div>
                            )}

                            {/* Beneficios */}
                            {data.benefits &&
                              Array.isArray(data.benefits) &&
                              data.benefits.length > 0 && (
                                <div className="procesos-contratacion-detail-row">
                                  <span className="procesos-contratacion-detail-label">
                                    Beneficios
                                  </span>
                                  <div className="procesos-contratacion-detail-list">
                                    {data.benefits.map((benefit: string, index: number) => (
                                      <span
                                        key={index}
                                        className="procesos-contratacion-detail-badge"
                                      >
                                        {benefit}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                            {/* Pasos de Contratación */}
                            {data.hiringSteps &&
                              Array.isArray(data.hiringSteps) &&
                              data.hiringSteps.length > 0 && (
                                <div className="procesos-contratacion-detail-row">
                                  <span className="procesos-contratacion-detail-label">
                                    Pasos de Contratación
                                  </span>
                                  <div className="procesos-contratacion-detail-steps">
                                    {data.hiringSteps.map(
                                      (
                                        step: { step: string; completed: boolean },
                                        index: number
                                      ) => (
                                        <div
                                          key={index}
                                          className={`procesos-contratacion-detail-step ${
                                            step.completed
                                              ? 'procesos-contratacion-detail-step-completed'
                                              : ''
                                          }`}
                                        >
                                          <CheckCircleIcon
                                            className={`procesos-contratacion-detail-step-icon ${
                                              step.completed
                                                ? 'procesos-contratacion-detail-step-icon-completed'
                                                : ''
                                            }`}
                                          />
                                          <span>{step.step}</span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Fechas de Entrevistas */}
                            {data.interviewDates &&
                              Array.isArray(data.interviewDates) &&
                              data.interviewDates.length > 0 && (
                                <div className="procesos-contratacion-detail-row">
                                  <span className="procesos-contratacion-detail-label">
                                    Fechas de Entrevistas
                                  </span>
                                  <div className="procesos-contratacion-detail-interviews">
                                    {data.interviewDates.map(
                                      (
                                        interview: { date: string; time: string },
                                        index: number
                                      ) => (
                                        <div
                                          key={index}
                                          className="procesos-contratacion-detail-interview-item"
                                        >
                                          <EventIcon className="procesos-contratacion-detail-interview-icon" />
                                          <span>
                                            {formatDateTime(
                                              interview.date,
                                              interview.time || '00:00'
                                            )}
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Interacciones */}
                            {data.interactions &&
                              Array.isArray(data.interactions) &&
                              data.interactions.length > 0 && (
                                <div className="procesos-contratacion-detail-row">
                                  <span className="procesos-contratacion-detail-label">
                                    Interacciones
                                  </span>
                                  <div className="procesos-contratacion-detail-interactions">
                                    {data.interactions.map(
                                      (
                                        interaction: { date: string; description: string },
                                        index: number
                                      ) => (
                                        <div
                                          key={index}
                                          className="procesos-contratacion-detail-interaction-item"
                                        >
                                          <ChatIcon className="procesos-contratacion-detail-interaction-icon" />
                                          <div className="procesos-contratacion-detail-interaction-content">
                                            <span className="procesos-contratacion-detail-interaction-date">
                                              {formatDate(interaction.date)}
                                            </span>
                                            <span className="procesos-contratacion-detail-interaction-description">
                                              {interaction.description}
                                            </span>
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Fecha de Apertura */}
                            <div className="procesos-contratacion-detail-row">
                              <span className="procesos-contratacion-detail-label">
                                Fecha de Apertura
                              </span>
                              <span className="procesos-contratacion-detail-value">
                                {formatDate(selectedProceso.fechaApertura)}
                              </span>
                            </div>

                            {/* Estado */}
                            <div className="procesos-contratacion-detail-row">
                              <span className="procesos-contratacion-detail-label">Estado</span>
                              <span
                                className="procesos-contratacion-detail-value"
                                style={{ color: getEstadoColor(selectedProceso.estado) }}
                              >
                                {selectedProceso.estado}
                              </span>
                            </div>
                          </>
                        )
                      })()}
                    </div>

                    {/* Acciones */}
                    <div className="procesos-contratacion-detail-actions">
                      <button
                        type="button"
                        onClick={() => {
                          handleCloseDetailModal()
                          handleEdit(selectedProceso)
                        }}
                        className="procesos-contratacion-form-button procesos-contratacion-form-button-primary"
                      >
                        <EditIcon className="procesos-contratacion-form-button-icon" />
                        Editar Proceso
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseDetailModal}
                        className="procesos-contratacion-form-button procesos-contratacion-form-button-secondary"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de Debug */}
            {isDebugModalOpen && (
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
                        onClick={handleDebugCreateHiringProcesses}
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
                        onClick={handleDebugDeleteAll}
                        disabled={isDebugLoading}
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
          </>
        )}
      </div>
    </div>
  )
}

export default ProcesosContratacion
