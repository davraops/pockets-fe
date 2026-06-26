import { useState, useEffect, useRef } from 'react'
import CrudSummaryStrip from '../components/crud/CrudSummaryStrip'
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
import PublicIcon from '@mui/icons-material/Public'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import WorkIcon from '@mui/icons-material/Work'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle'
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard'
import BlockIcon from '@mui/icons-material/Block'
import EventIcon from '@mui/icons-material/Event'
import BusinessIcon from '@mui/icons-material/Business'
import { api } from '../services/api'
import { isDebugToolsEnabled, isDestructiveDebugEnabled, devError } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import ModalOverlay from '../components/ModalOverlay'
import ListSkeleton from '../components/ListSkeleton'
import './Contratos.css'

interface BankAccount {
  id: string
  nombre: string
  banco: string
  currency: string
}

interface Contract {
  id: string
  name: string
  data: {
    clientName?: string
    country?: string
    workSchedule?: string
    contractType?: string
    salary?: number
    currency?: string
    paymentAccountId?: string
    deductions?: string
    benefits?: string
    exclusivity?: boolean
    ptos?: number
    holidaysCountry?: string
    hasAgency?: boolean
    agencyName?: string
  }
  created_at?: string
  updated_at?: string
}

interface ContractRecord {
  id: string
  name: string
  data: Contract['data']
  created_at: string
  updated_at: string
}

function Contratos() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    country: '',
    workSchedule: '',
    contractType: '',
    salary: '',
    currency: 'USD',
    paymentAccountId: '',
    deductions: '',
    benefits: '',
    exclusivity: false,
    ptos: '',
    holidaysCountry: '',
    hasAgency: false,
    agencyName: '',
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [records, setRecords] = useState<ContractRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRecordsModal, setShowRecordsModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isDebugLoading, setIsDebugLoading] = useState(false)
  const [exchangeRates, setExchangeRates] = useState({ USD: 3750, EUR: 4300, GBP: 4800 })
  const menuRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const clientNameRef = useRef<HTMLInputElement>(null)
  const [formErrors, setFormErrors] = useState({ name: '', clientName: '' })

  useEffect(() => {
    loadRecords()
    loadBankAccounts()
  }, [])

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

  const loadBankAccounts = async () => {
    try {
      const response = await api.getBankAccounts()
      if (response.accounts && Array.isArray(response.accounts)) {
        const mappedAccounts: BankAccount[] = response.accounts.map((acc: any) => ({
          id: acc.id,
          nombre: acc.account_name,
          banco: acc.bank,
          currency: acc.currency || 'COP',
        }))
        setBankAccounts(mappedAccounts)
      }
    } catch (err: unknown) {
      devError('Error al cargar cuentas bancarias:', err)
    }
  }

  const loadRecords = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.getContracts()
      if (response.contracts && Array.isArray(response.contracts)) {
        setRecords(response.contracts)
        // Cargar también en la lista local para mostrar
        const mappedContracts = response.contracts.map((record: ContractRecord) => ({
          id: record.id,
          name: record.name,
          data: record.data,
          created_at: record.created_at,
          updated_at: record.updated_at,
        }))
        setContracts(mappedContracts)
      } else {
        setContracts([])
        setRecords([])
      }
    } catch (err: unknown) {
      devError('Error al cargar contratos:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al cargar contratos. Por favor, intenta de nuevo.'
      )
      setError(errorMessage)
      setContracts([])
      setRecords([])
      showNotification(errorMessage, 'error')
    } finally {
        setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }))
    }
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const validateForm = (): boolean => {
    const errors = { name: '', clientName: '' }
    let isValid = true

    if (!formData.name.trim()) {
      errors.name = 'El nombre del contrato es requerido'
      isValid = false
    }

    if (!formData.clientName.trim()) {
      errors.clientName = 'El nombre del cliente es requerido'
      isValid = false
    }

    setFormErrors(errors)
    if (!isValid) {
      queueMicrotask(() => {
        if (errors.name) {
          nameRef.current?.focus()
        } else if (errors.clientName) {
          clientNameRef.current?.focus()
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

    try {
      setIsSaving(true)

      const contractData = {
        name: formData.name.trim(),
        data: {
          clientName: formData.clientName.trim(),
          country: formData.country.trim() || undefined,
          workSchedule: formData.workSchedule.trim() || undefined,
          contractType: formData.contractType.trim() || undefined,
          salary: formData.salary ? parseFloat(formData.salary) : undefined,
          currency: formData.currency || 'USD',
          paymentAccountId: formData.paymentAccountId || undefined,
          deductions: formData.deductions.trim() || undefined,
          benefits: formData.benefits.trim() || undefined,
          exclusivity: formData.exclusivity,
          ptos: formData.ptos ? parseInt(formData.ptos) : undefined,
          holidaysCountry: formData.holidaysCountry.trim() || undefined,
          hasAgency: formData.hasAgency,
          agencyName: formData.hasAgency && formData.agencyName.trim() ? formData.agencyName.trim() : undefined,
        },
      }

      if (editingId) {
        // Actualizar contrato existente
        await api.updateContract(editingId, contractData)
        showNotification('Contrato actualizado exitosamente', 'success')
        setEditingId(null)
      } else {
        // Crear nuevo contrato
        await api.createContract(contractData)
        showNotification('Contrato creado exitosamente', 'success')
      }

      // Recargar lista
      await loadRecords()

      // Limpiar formulario
      setFormData({
        name: '',
        clientName: '',
        country: '',
        workSchedule: '',
        contractType: '',
        salary: '',
        currency: 'USD',
        paymentAccountId: '',
        deductions: '',
        benefits: '',
        exclusivity: false,
        ptos: '',
        holidaysCountry: '',
        hasAgency: false,
        agencyName: '',
      })

      // Cerrar modal si estaba abierto
      setShowFormModal(false)
      setFormErrors({ name: '', clientName: '' })
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al guardar el contrato. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (contract: Contract) => {
    setFormData({
      name: contract.name,
      clientName: contract.data.clientName || '',
      country: contract.data.country || '',
      workSchedule: contract.data.workSchedule || '',
      contractType: contract.data.contractType || '',
      salary: contract.data.salary ? contract.data.salary.toString() : '',
      currency: contract.data.currency || 'USD',
      paymentAccountId: contract.data.paymentAccountId || '',
      deductions: contract.data.deductions || '',
      benefits: contract.data.benefits || '',
      exclusivity: contract.data.exclusivity || false,
      ptos: contract.data.ptos ? contract.data.ptos.toString() : '',
      holidaysCountry: contract.data.holidaysCountry || '',
      hasAgency: contract.data.hasAgency || false,
      agencyName: contract.data.agencyName || '',
    })
    setEditingId(contract.id)
    setFormErrors({ name: '', clientName: '' })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({
      name: '',
      clientName: '',
      country: '',
      workSchedule: '',
      contractType: '',
      salary: '',
      currency: 'USD',
      paymentAccountId: '',
      deductions: '',
      benefits: '',
      exclusivity: false,
      ptos: '',
      holidaysCountry: '',
      hasAgency: false,
      agencyName: '',
    })
    setShowFormModal(false)
    setFormErrors({ name: '', clientName: '' })
  }

  const handleDelete = async (id: string, name: string) => {
    if (!(await confirm({ message: `¿Estás seguro de que quieres eliminar el contrato "${name}"?`, variant: 'danger' }))) {
      return
    }

    try {
      await api.deleteContract(id)
      showNotification('Contrato eliminado exitosamente', 'success')
      await loadRecords()
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar el contrato. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleDebugCreateContracts = async () => {
    if (!isDebugToolsEnabled()) return
    try {
      setIsDebugLoading(true)
      const demoContracts = [
        {
          name: 'Contrato Full Stack Developer - TechCorp',
          data: {
            clientName: 'TechCorp Inc.',
            country: 'Estados Unidos',
            workSchedule: 'Lunes a Viernes 9am-6pm EST',
            contractType: 'Tiempo Completo',
            salary: 8000,
            currency: 'USD',
            paymentAccountId: bankAccounts.length > 0 ? bankAccounts[0].id : undefined,
            deductions: 'Impuestos federales y estatales, seguro social',
            benefits: 'Seguro médico, dental, visión. 401k con match del 5%. PTO ilimitado.',
            exclusivity: true,
            ptos: 20,
            holidaysCountry: 'Estados Unidos',
            hasAgency: false,
          },
        },
        {
          name: 'Contrato Freelance - StartupXYZ',
          data: {
            clientName: 'StartupXYZ',
            country: 'Colombia',
            workSchedule: 'Lunes a Viernes 8am-5pm COT',
            contractType: 'Freelance',
            salary: 5000,
            currency: 'USD',
            paymentAccountId: bankAccounts.length > 1 ? bankAccounts[1].id : bankAccounts.length > 0 ? bankAccounts[0].id : undefined,
            deductions: 'Impuestos según ley colombiana',
            benefits: 'Bonos por proyecto completado',
            exclusivity: false,
            ptos: 0,
            holidaysCountry: 'Colombia',
            hasAgency: true,
            agencyName: 'Agencia de Talento Digital',
          },
        },
        {
          name: 'Contrato Por Proyecto - DesignStudio',
          data: {
            clientName: 'DesignStudio',
            country: 'España',
            workSchedule: 'Flexible, reuniones semanales',
            contractType: 'Por Proyecto',
            salary: 3000,
            currency: 'EUR',
            paymentAccountId: bankAccounts.length > 0 ? bankAccounts[0].id : undefined,
            deductions: 'IVA según normativa española',
            benefits: 'Pago por milestone completado',
            exclusivity: false,
            ptos: 0,
            holidaysCountry: 'España',
            hasAgency: false,
          },
        },
        {
          name: 'Contrato Medio Tiempo - Consultoría ABC',
          data: {
            clientName: 'Consultoría ABC',
            country: 'Colombia',
            workSchedule: 'Lunes, Miércoles y Viernes 2pm-6pm',
            contractType: 'Medio Tiempo',
            salary: 2500,
            currency: 'USD',
            paymentAccountId: bankAccounts.length > 0 ? bankAccounts[0].id : undefined,
            deductions: 'Retención en la fuente',
            benefits: 'Seguro de vida, bonos trimestrales',
            exclusivity: true,
            ptos: 10,
            holidaysCountry: 'Colombia',
            hasAgency: false,
          },
        },
        {
          name: 'Contrato Remoto - GlobalTech',
          data: {
            clientName: 'GlobalTech Solutions',
            country: 'Reino Unido',
            workSchedule: 'Lunes a Viernes 9am-5pm GMT',
            contractType: 'Tiempo Completo',
            salary: 6000,
            currency: 'GBP',
            paymentAccountId: bankAccounts.length > 0 ? bankAccounts[0].id : undefined,
            deductions: 'National Insurance, Income Tax',
            benefits: 'Pension scheme, private health insurance, 25 días de vacaciones',
            exclusivity: false,
            ptos: 25,
            holidaysCountry: 'Reino Unido',
            hasAgency: true,
            agencyName: 'TechRecruiters UK',
          },
        },
      ]

      // Crear todos los contratos
      for (const contract of demoContracts) {
        await api.createContract(contract)
      }

      showNotification(`${demoContracts.length} contratos demo creados exitosamente`, 'success')
      await loadRecords()
      setIsDebugModalOpen(false)
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al crear los contratos demo. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsDebugLoading(false)
    }
  }

  const handleDebugDeleteAll = async () => {
    if (!isDebugToolsEnabled()) return
    if (!(await confirm({ message: '¿Estás seguro de que quieres eliminar TODOS los contratos? Esta acción es irreversible.', variant: 'danger' }))) {
      return
    }

    try {
      setIsDebugLoading(true)
      await api.deleteAllContracts()
      showNotification('Todos los contratos han sido eliminados', 'success')
      await loadRecords()
      setIsDebugModalOpen(false)
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar los contratos. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsDebugLoading(false)
    }
  }

  const formatCurrency = (amount: number | undefined, currency: string = 'USD') => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const formatBalance = (balance: number, currency: string = 'COP') => {
    const locale = currency === 'EUR' ? 'es-ES' : currency === 'USD' ? 'en-US' : 'es-CO'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(balance)
  }

  // Convertir salario a COP
  const convertToCOP = (amount: number, currency: string): number => {
    if (currency === 'COP') return amount
    if (currency === 'USD') return amount * exchangeRates.USD
    if (currency === 'EUR') return amount * exchangeRates.EUR
    if (currency === 'GBP') return amount * exchangeRates.GBP
    return amount // Si no se reconoce, retornar el valor original
  }

  const calculateTotalIncomeCOP = (): number => {
    return contracts.reduce((total, contract) => {
      if (contract.data.salary && contract.data.currency) {
        return total + convertToCOP(contract.data.salary, contract.data.currency)
      }
      return total
    }, 0)
  }

  const calculateHighlights = () => {
    const total = contracts.length
    const ingresos = formatBalance(calculateTotalIncomeCOP(), 'COP')
    const exclusivos = contracts.filter(c => c.data.exclusivity).length
    return { total, ingresos, exclusivos }
  }

  const highlights = calculateHighlights()

  const formatContractMeta = (contract: Contract) => {
    const parts = [
      contract.data.clientName,
      contract.data.contractType,
      contract.data.country,
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(' • ') : 'Sin cliente asignado'
  }

  const openContractEdit = (contract: Contract) => {
    handleEdit(contract)
    setShowFormModal(true)
  }

  return (
    <div className="app-page">
      <div className="app-page-content app-page-content-wide crud-page-content contratos-content">
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

        <h1 className="app-page-title">Contratos</h1>

        <CrudSummaryStrip
          ariaLabel="Resumen de contratos"
          stripClassName="crud-summary-strip--success"
          items={[
            { label: 'Contratos', value: highlights.total, tone: 'info' },
            {
              label: 'Ingresos / mes',
              value: highlights.ingresos,
              tone: 'available',
              emphasis: true,
            },
            { label: 'Exclusivos', value: highlights.exclusivos, tone: 'info' },
          ]}
        />

        <button
          type="button"
          className="btn-base btn-accent btn-block btn-submit crud-primary-cta"
          onClick={() => setShowFormModal(true)}
          aria-label="Crear contrato"
        >
          <AddIcon aria-hidden={true} />
          Crear contrato
        </button>

        {/* Estado de carga */}
        {isLoading && contracts.length === 0 ? (
          <div className="glass-group">
            <ListSkeleton variant="inset-row" count={4} aria-label="Cargando contratos" />
          </div>
        ) : error && contracts.length === 0 ? (
          <div className="loader-container">
            <div className="loader finanzas-stats-error-panel">
              <p className="loader-text loader-text--error" role="alert">
                {error}
              </p>
              <button
                type="button"
                className="btn-base btn-secondary btn-retry"
                onClick={() => void loadRecords()}
                aria-label="Reintentar cargar contratos"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : contracts.length === 0 ? (
          <div className="empty-state">
            <FolderIcon className="empty-state-icon" />
            <p className="empty-text">No hay contratos guardados</p>
            <p className="empty-subtext">Usa el botón de arriba para crear el primero</p>
          </div>
        ) : (
          <div className="glass-group">
            {contracts.map(contract => (
              <button
                key={contract.id}
                type="button"
                className="crud-inset-row crud-row-accent-blue"
                onClick={() => openContractEdit(contract)}
                aria-label={`Editar contrato ${contract.name}`}
              >
                <div className="crud-row-content">
                  <div className="crud-row-header">
                    <span className="crud-row-title">{contract.name}</span>
                    {contract.data.salary != null && contract.data.salary > 0 && (
                      <span className="crud-row-value">
                        {formatCurrency(contract.data.salary, contract.data.currency)}
                      </span>
                    )}
                    <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
                  </div>
                  <p className="crud-row-meta">{formatContractMeta(contract)}</p>
                  {contract.data.workSchedule && (
                    <p className="crud-row-preview">{contract.data.workSchedule}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
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
            <div
              className="crud-form-panel-shell crud-form-panel-shell--large contratos-form-modal"
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-panel-header">
                <h2 className="modal-panel-title" id="modal-panel-title-editingid-editar-contrato-crear-contrato">{editingId ? 'Editar Contrato' : 'Crear Contrato'}</h2>
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
                  <div className="crud-form-panel-section">
                    <h3 className="crud-form-panel-section-title">Información Básica</h3>
                    
                    <div className="form-group-base form-group-base--compact">
                      <label htmlFor="name" className="form-label-base form-label-base--inline">
                        Nombre del Contrato *
                      </label>
                      <input
                        ref={nameRef}
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`form-input-base ${formErrors.name ? 'input-error' : ''}`}
                        placeholder="Ej: Contrato con Empresa XYZ"
                        autoFocus
                        aria-invalid={!!formErrors.name}
                        {...(formErrors.name ? { 'aria-describedby': 'contract-name-error' } : {})}
                      />
                      {formErrors.name && (
                        <span id="contract-name-error" className="error-message" role="alert">
                          {formErrors.name}
                        </span>
                      )}
                    </div>

                    <div className="form-group-base form-group-base--compact">
                      <label htmlFor="clientName" className="form-label-base form-label-base--inline">
                        <PersonIcon className="form-label-base form-label-base--inline-icon" />
                        Nombre del Cliente *
                      </label>
                      <input
                        ref={clientNameRef}
                        type="text"
                        id="clientName"
                        name="clientName"
                        value={formData.clientName}
                        onChange={handleChange}
                        className={`form-input-base ${formErrors.clientName ? 'input-error' : ''}`}
                        placeholder="Nombre de la empresa o cliente"
                        aria-invalid={!!formErrors.clientName}
                        {...(formErrors.clientName ? { 'aria-describedby': 'contract-client-error' } : {})}
                      />
                      {formErrors.clientName && (
                        <span id="contract-client-error" className="error-message" role="alert">
                          {formErrors.clientName}
                        </span>
                      )}
                    </div>

                    <div className="form-group-base form-group-base--compact">
                      <label htmlFor="country" className="form-label-base form-label-base--inline">
                        <PublicIcon className="form-label-base form-label-base--inline-icon" />
                        País
                      </label>
                      <input
                        type="text"
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="form-input-base"
                        placeholder="Ej: Colombia, Estados Unidos"
                      />
                    </div>

                    <div className="form-group-base form-group-base--compact">
                      <label htmlFor="workSchedule" className="form-label-base form-label-base--inline">
                        <AccessTimeIcon className="form-label-base form-label-base--inline-icon" />
                        Horario de Atención
                      </label>
                      <input
                        type="text"
                        id="workSchedule"
                        name="workSchedule"
                        value={formData.workSchedule}
                        onChange={handleChange}
                        className="form-input-base"
                        placeholder="Ej: Lunes a Viernes 9am-6pm EST"
                      />
                    </div>

                    <div className="form-group-base form-group-base--compact">
                      <label htmlFor="contractType" className="form-label-base form-label-base--inline">
                        <WorkIcon className="form-label-base form-label-base--inline-icon" />
                        Tipo de Contrato
                      </label>
                      <select
                        id="contractType"
                        name="contractType"
                        value={formData.contractType}
                        onChange={handleChange}
                        className="form-input-base"
                      >
                        <option value="">Seleccionar tipo</option>
                        <option value="Tiempo Completo">Tiempo Completo</option>
                        <option value="Medio Tiempo">Medio Tiempo</option>
                        <option value="Por Proyecto">Por Proyecto</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Contrato Indefinido">Contrato Indefinido</option>
                        <option value="Contrato Temporal">Contrato Temporal</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div className="crud-form-panel-section">
                    <h3 className="crud-form-panel-section-title">Compensación</h3>

                    <div className="form-group-base form-group-base--compact">
                      <label htmlFor="salary" className="form-label-base form-label-base--inline">
                        <AttachMoneyIcon className="form-label-base form-label-base--inline-icon" />
                        Salario
                      </label>
                      <div className="crud-form-amount-row">
                        <input
                          type="number"
                          id="salary"
                          name="salary"
                          value={formData.salary}
                          onChange={handleChange}
                          className="form-input-base crud-form-amount-input"
                          placeholder="Ej: 5000000"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                        />
                        <select
                          id="currency"
                          name="currency"
                          value={formData.currency}
                          onChange={handleChange}
                          className="form-input-base crud-form-amount-currency"
                        >
                          <option value="USD">USD</option>
                          <option value="COP">COP</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group-base form-group-base--compact">
                      <label htmlFor="paymentAccountId" className="form-label-base form-label-base--inline">
                        <AccountBalanceIcon className="form-label-base form-label-base--inline-icon" />
                        Cuenta a la que Pagan
                      </label>
                      <select
                        id="paymentAccountId"
                        name="paymentAccountId"
                        value={formData.paymentAccountId}
                        onChange={handleChange}
                        className="form-input-base"
                      >
                        <option value="">Seleccionar cuenta</option>
                        {bankAccounts.map(account => (
                          <option key={account.id} value={account.id}>
                            {account.nombre} - {account.banco} ({account.currency})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group-base form-group-base--compact">
                      <label htmlFor="deductions" className="form-label-base form-label-base--inline">
                        <RemoveCircleIcon className="form-label-base form-label-base--inline-icon" />
                        Deducciones
                      </label>
                      <textarea
                        id="deductions"
                        name="deductions"
                        value={formData.deductions}
                        onChange={handleChange}
                        className="form-textarea-base"
                        placeholder="Describe las deducciones que se aplican (impuestos, seguros, etc.)"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="crud-form-panel-section">
                    <h3 className="crud-form-panel-section-title">Beneficios y Condiciones</h3>

                    <div className="form-group-base form-group-base--compact">
                      <label htmlFor="benefits" className="form-label-base form-label-base--inline">
                        <CardGiftcardIcon className="form-label-base form-label-base--inline-icon" />
                        Beneficios
                      </label>
                      <textarea
                        id="benefits"
                        name="benefits"
                        value={formData.benefits}
                        onChange={handleChange}
                        className="form-textarea-base"
                        placeholder="Describe los beneficios (seguro médico, bonos, etc.)"
                        rows={3}
                      />
                    </div>

                    <div className="form-group-base form-group-base--compact">
                      <label className="crud-form-checkbox-label">
                        <input
                          type="checkbox"
                          name="exclusivity"
                          checked={formData.exclusivity}
                          onChange={handleChange}
                          className="crud-form-checkbox"
                        />
                        <BlockIcon className="form-label-base form-label-base--inline-icon" />
                        <span>Exclusividad</span>
                      </label>
                    </div>

                    <div className="form-group-base form-group-base--compact">
                      <label htmlFor="ptos" className="form-label-base form-label-base--inline">
                        <EventIcon className="form-label-base form-label-base--inline-icon" />
                        PTOs (Días de Vacaciones)
                      </label>
                      <input
                        type="number"
                        id="ptos"
                        name="ptos"
                        value={formData.ptos}
                        onChange={handleChange}
                        className="form-input-base"
                        placeholder="Ej: 15"
                        min="0"
                      />
                    </div>

                    <div className="form-group-base form-group-base--compact">
                      <label htmlFor="holidaysCountry" className="form-label-base form-label-base--inline">
                        <PublicIcon className="form-label-base form-label-base--inline-icon" />
                        Holidays (País)
                      </label>
                      <input
                        type="text"
                        id="holidaysCountry"
                        name="holidaysCountry"
                        value={formData.holidaysCountry}
                        onChange={handleChange}
                        className="form-input-base"
                        placeholder="Ej: Colombia, Estados Unidos"
                      />
                    </div>
                  </div>

                  <div className="crud-form-panel-section">
                    <h3 className="crud-form-panel-section-title">Agencia</h3>

                    <div className="form-group-base form-group-base--compact">
                      <label className="crud-form-checkbox-label">
                        <input
                          type="checkbox"
                          name="hasAgency"
                          checked={formData.hasAgency}
                          onChange={handleChange}
                          className="crud-form-checkbox"
                        />
                        <BusinessIcon className="form-label-base form-label-base--inline-icon" />
                        <span>Hay Agencia de por Medio</span>
                      </label>
                    </div>

                    {formData.hasAgency && (
                      <div className="form-group-base form-group-base--compact">
                        <label htmlFor="agencyName" className="form-label-base form-label-base--inline">
                          <BusinessIcon className="form-label-base form-label-base--inline-icon" />
                          Nombre de la Agencia
                        </label>
                        <input
                          type="text"
                          id="agencyName"
                          name="agencyName"
                          value={formData.agencyName}
                          onChange={handleChange}
                          className="form-input-base"
                          placeholder="Nombre de la agencia"
                        />
                      </div>
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
                        <button
                          type="button"
                          onClick={() => {
                            const contract = contracts.find(c => c.id === editingId)
                            if (contract) {
                              void handleDelete(contract.id, contract.name).then(() => {
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
                          {isSaving ? 'Guardando...' : 'Actualizar Contrato'}
                        </button>
                      </>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="crud-form-panel-button crud-form-panel-button--primary"
                      >
                        <SaveIcon className="crud-form-panel-button-icon" />
                        {isSaving ? 'Guardando...' : 'Guardar Contrato'}
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
                <h2 className="modal-panel-title" id="modal-panel-title-contratos-guardados">Contratos Guardados</h2>
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
                {isLoading ? (
                  <p>Cargando...</p>
                ) : records.length === 0 ? (
                  <p className="modal-panel-empty">No hay contratos guardados</p>
                ) : (
                  <div className="crud-modal-pick-list">
                    {records.map(record => (
                      <div key={record.id} className="crud-modal-pick-item">
                        <div className="crud-modal-pick-item-info">
                          <h3 className="crud-modal-pick-item-title">{record.name}</h3>
                          <p className="crud-modal-pick-item-meta">
                            Cliente: {record.data.clientName || 'N/A'}
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
                <h2 className="modal-panel-title" id="modal-panel-title-debug-contratos">🐛 Debug - Contratos</h2>
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
                    onClick={handleDebugCreateContracts}
                    disabled={isDebugLoading}
                    type="button"
                  >
                    <span className="debug-option-icon">📦</span>
                    <div className="debug-option-info">
                      <h3 className="debug-option-title">Crear Contratos Demo</h3>
                      <p className="debug-option-description">
                        Crea 5 contratos de ejemplo con diferentes tipos y configuraciones
                      </p>
                        </div>
                  </button>
                  <button
                    className="debug-option-button delete-all"
                    onClick={handleDebugDeleteAll}
                    disabled={isDebugLoading}
                    type="button"
                  >
                    <span className="debug-option-icon">🗑️</span>
                    <div className="debug-option-info">
                      <h3 className="debug-option-title">Eliminar Todos los Contratos</h3>
                      <p className="debug-option-description">
                        ⚠️ PELIGROSO: Elimina todos los contratos (IRREVERSIBLE)
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

export default Contratos
