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
import { useNotification } from '../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
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

  useEffect(() => {
    loadRecords()
    loadBankAccounts()
  }, [])

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isMenuOpen && !target.closest('.contratos-toolbar-menu-container')) {
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
    } catch (err: any) {
      console.error('Error al cargar cuentas bancarias:', err)
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
    } catch (err: any) {
      console.error('Error al cargar contratos:', err)
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      showNotification('El nombre del contrato es requerido', 'error')
      return
    }

    if (!formData.clientName.trim()) {
      showNotification('El nombre del cliente es requerido', 'error')
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
          agencyName:
            formData.hasAgency && formData.agencyName.trim()
              ? formData.agencyName.trim()
              : undefined,
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
    } catch (err: any) {
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
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el contrato "${name}"?`)) {
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
            paymentAccountId:
              bankAccounts.length > 1
                ? bankAccounts[1].id
                : bankAccounts.length > 0
                  ? bankAccounts[0].id
                  : undefined,
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
    if (
      !window.confirm(
        '¿Estás seguro de que quieres eliminar TODOS los contratos? Esta acción es irreversible.'
      )
    ) {
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

  // Calcular total de ingresos en COP
  const calculateTotalIncomeCOP = (): number => {
    return contracts.reduce((total, contract) => {
      if (contract.data.salary && contract.data.currency) {
        return total + convertToCOP(contract.data.salary, contract.data.currency)
      }
      return total
    }, 0)
  }

  return (
    <div className="app-page">
      <div className="app-page-content contratos-content">
        {/* Toolbar */}
        <div className="contratos-toolbar">
          <button
            className="contratos-toolbar-button"
            onClick={() => navigate('/trabajo')}
            aria-label="Volver"
            type="button"
          >
            <ArrowBackIcon className="contratos-toolbar-icon" />
          </button>
          <div className="contratos-toolbar-menu-container" ref={menuRef}>
            <button
              className="contratos-toolbar-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Opciones"
              aria-expanded={isMenuOpen}
              type="button"
            >
              <MoreVertIcon className="contratos-toolbar-icon" />
            </button>
            {isMenuOpen && (
              <div className="contratos-menu">
                <button
                  className="contratos-menu-item"
                  onClick={() => {
                    setIsMenuOpen(false)
                    setShowFormModal(true)
                  }}
                  type="button"
                >
                  <AddIcon className="contratos-menu-icon" />
                  <span>Crear Contrato</span>
                </button>
                {process.env.NODE_ENV === 'development' && (
                  <button
                    className="contratos-menu-item"
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

        <h1 className="contratos-page-title">Contratos</h1>
        <p className="contratos-page-subtitle">Gestiona tus contratos laborales</p>

        {/* Estado de carga */}
        {isLoading ? (
          <div className="contratos-empty-state">
            <p className="empty-state-text">Cargando contratos...</p>
          </div>
        ) : error ? (
          <div className="contratos-empty-state">
            <p className="empty-state-text">{error}</p>
          </div>
        ) : (
          <>
            {/* Total de Ingresos - Highlight */}
            {contracts.length > 0 && (
              <div className="contratos-total-income">
                <div className="contratos-total-income-content">
                  <div className="contratos-total-income-icon">
                    <AttachMoneyIcon />
                  </div>
                  <div className="contratos-total-income-info">
                    <span className="contratos-total-income-label">
                      Total de Ingresos Mensuales
                    </span>
                    <span className="contratos-total-income-value">
                      {formatBalance(calculateTotalIncomeCOP(), 'COP')}
                    </span>
                  </div>
                </div>
                <div className="contratos-total-income-stats">
                  <div className="contratos-total-income-stat">
                    <span className="contratos-total-income-stat-label">Contratos Activos</span>
                    <span className="contratos-total-income-stat-value">{contracts.length}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Contratos */}
            {contracts.length === 0 ? (
              <div className="contratos-empty-state">
                <p className="empty-state-text">No hay contratos guardados</p>
                <p className="empty-state-subtext">
                  Crea tu primer contrato usando el botón del menú
                </p>
              </div>
            ) : (
              <div className="contratos-list">
                <h2 className="contratos-list-title">Contratos Guardados</h2>
                <div className="contratos-items">
                  {contracts.map(contract => (
                    <div key={contract.id} className="contratos-item">
                      <div className="contratos-item-header">
                        <h3 className="contratos-item-name">{contract.name}</h3>
                        <div className="contratos-item-actions">
                          <button
                            onClick={() => {
                              handleEdit(contract)
                              setShowFormModal(true)
                            }}
                            className="contratos-item-action-button"
                            aria-label="Editar contrato"
                            type="button"
                          >
                            <EditIcon className="contratos-item-action-icon" />
                          </button>
                          <button
                            onClick={() => handleDelete(contract.id, contract.name)}
                            className="contratos-item-action-button contratos-item-action-button-danger"
                            aria-label="Eliminar contrato"
                            type="button"
                          >
                            <DeleteIcon className="contratos-item-action-icon" />
                          </button>
                        </div>
                      </div>

                      <div className="contratos-item-content">
                        {/* Información Principal - Destacada */}
                        <div className="contratos-item-main-info">
                          {contract.data.salary && (
                            <div className="contratos-item-salary-badge">
                              <AttachMoneyIcon className="contratos-item-salary-icon" />
                              <span className="contratos-item-salary-value">
                                {formatCurrency(contract.data.salary, contract.data.currency)}
                              </span>
                            </div>
                          )}
                          <div className="contratos-item-badges">
                            {contract.data.contractType && (
                              <span className="contratos-item-badge contratos-item-badge-type">
                                <WorkIcon className="contratos-item-badge-icon" />
                                {contract.data.contractType}
                              </span>
                            )}
                            {contract.data.exclusivity && (
                              <span className="contratos-item-badge contratos-item-badge-exclusivity">
                                <BlockIcon className="contratos-item-badge-icon" />
                                Exclusivo
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Información Básica - Grid */}
                        <div className="contratos-item-info-grid">
                          {contract.data.clientName && (
                            <div className="contratos-item-info-item">
                              <PersonIcon className="contratos-item-info-icon" />
                              <div className="contratos-item-info-content">
                                <span className="contratos-item-info-label">Cliente</span>
                                <span className="contratos-item-info-value">
                                  {contract.data.clientName}
                                </span>
                              </div>
                            </div>
                          )}

                          {contract.data.country && (
                            <div className="contratos-item-info-item">
                              <PublicIcon className="contratos-item-info-icon" />
                              <div className="contratos-item-info-content">
                                <span className="contratos-item-info-label">País</span>
                                <span className="contratos-item-info-value">
                                  {contract.data.country}
                                </span>
                              </div>
                            </div>
                          )}

                          {contract.data.workSchedule && (
                            <div className="contratos-item-info-item">
                              <AccessTimeIcon className="contratos-item-info-icon" />
                              <div className="contratos-item-info-content">
                                <span className="contratos-item-info-label">Horario</span>
                                <span className="contratos-item-info-value">
                                  {contract.data.workSchedule}
                                </span>
                              </div>
                            </div>
                          )}

                          {contract.data.paymentAccountId && (
                            <div className="contratos-item-info-item">
                              <AccountBalanceIcon className="contratos-item-info-icon" />
                              <div className="contratos-item-info-content">
                                <span className="contratos-item-info-label">Cuenta</span>
                                <span className="contratos-item-info-value">
                                  {(() => {
                                    const account = bankAccounts.find(
                                      acc => acc.id === contract.data.paymentAccountId
                                    )
                                    return account ? `${account.nombre} - ${account.banco}` : 'N/A'
                                  })()}
                                </span>
                              </div>
                            </div>
                          )}

                          {contract.data.ptos !== undefined && (
                            <div className="contratos-item-info-item">
                              <EventIcon className="contratos-item-info-icon" />
                              <div className="contratos-item-info-content">
                                <span className="contratos-item-info-label">PTOs</span>
                                <span className="contratos-item-info-value">
                                  {contract.data.ptos} días
                                </span>
                              </div>
                            </div>
                          )}

                          {contract.data.holidaysCountry && (
                            <div className="contratos-item-info-item">
                              <PublicIcon className="contratos-item-info-icon" />
                              <div className="contratos-item-info-content">
                                <span className="contratos-item-info-label">Holidays</span>
                                <span className="contratos-item-info-value">
                                  {contract.data.holidaysCountry}
                                </span>
                              </div>
                            </div>
                          )}

                          {contract.data.hasAgency && contract.data.agencyName && (
                            <div className="contratos-item-info-item">
                              <BusinessIcon className="contratos-item-info-icon" />
                              <div className="contratos-item-info-content">
                                <span className="contratos-item-info-label">Agencia</span>
                                <span className="contratos-item-info-value">
                                  {contract.data.agencyName}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Información Adicional - Texto Completo */}
                        {(contract.data.benefits || contract.data.deductions) && (
                          <div className="contratos-item-additional">
                            {contract.data.benefits && (
                              <div className="contratos-item-additional-item">
                                <CardGiftcardIcon className="contratos-item-additional-icon" />
                                <div className="contratos-item-additional-content">
                                  <span className="contratos-item-additional-label">
                                    Beneficios
                                  </span>
                                  <p className="contratos-item-additional-text">
                                    {contract.data.benefits}
                                  </p>
                                </div>
                              </div>
                            )}

                            {contract.data.deductions && (
                              <div className="contratos-item-additional-item">
                                <RemoveCircleIcon className="contratos-item-additional-icon" />
                                <div className="contratos-item-additional-content">
                                  <span className="contratos-item-additional-label">
                                    Deducciones
                                  </span>
                                  <p className="contratos-item-additional-text">
                                    {contract.data.deductions}
                                  </p>
                                </div>
                              </div>
                            )}
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
            className="contratos-modal-overlay"
            onClick={() => {
              setShowFormModal(false)
              handleCancelEdit()
            }}
          >
            <div
              className="contratos-modal contratos-modal-large"
              onClick={e => e.stopPropagation()}
            >
              <div className="contratos-modal-header">
                <h2 className="contratos-modal-title">
                  {editingId ? 'Editar Contrato' : 'Crear Contrato'}
                </h2>
                <button
                  className="contratos-modal-close"
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
              <div className="contratos-modal-content">
                <form className="contratos-form" onSubmit={handleSubmit}>
                  <div className="contratos-form-section">
                    <h3 className="contratos-form-section-title">Información Básica</h3>

                    <div className="contratos-form-group">
                      <label htmlFor="name" className="contratos-form-label">
                        Nombre del Contrato *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="contratos-form-input"
                        placeholder="Ej: Contrato con Empresa XYZ"
                        required
                      />
                    </div>

                    <div className="contratos-form-group">
                      <label htmlFor="clientName" className="contratos-form-label">
                        <PersonIcon className="contratos-form-label-icon" />
                        Nombre del Cliente *
                      </label>
                      <input
                        type="text"
                        id="clientName"
                        name="clientName"
                        value={formData.clientName}
                        onChange={handleChange}
                        className="contratos-form-input"
                        placeholder="Nombre de la empresa o cliente"
                        required
                      />
                    </div>

                    <div className="contratos-form-group">
                      <label htmlFor="country" className="contratos-form-label">
                        <PublicIcon className="contratos-form-label-icon" />
                        País
                      </label>
                      <input
                        type="text"
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="contratos-form-input"
                        placeholder="Ej: Colombia, Estados Unidos"
                      />
                    </div>

                    <div className="contratos-form-group">
                      <label htmlFor="workSchedule" className="contratos-form-label">
                        <AccessTimeIcon className="contratos-form-label-icon" />
                        Horario de Atención
                      </label>
                      <input
                        type="text"
                        id="workSchedule"
                        name="workSchedule"
                        value={formData.workSchedule}
                        onChange={handleChange}
                        className="contratos-form-input"
                        placeholder="Ej: Lunes a Viernes 9am-6pm EST"
                      />
                    </div>

                    <div className="contratos-form-group">
                      <label htmlFor="contractType" className="contratos-form-label">
                        <WorkIcon className="contratos-form-label-icon" />
                        Tipo de Contrato
                      </label>
                      <select
                        id="contractType"
                        name="contractType"
                        value={formData.contractType}
                        onChange={handleChange}
                        className="contratos-form-input"
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

                  <div className="contratos-form-section">
                    <h3 className="contratos-form-section-title">Compensación</h3>

                    <div className="contratos-form-group">
                      <label htmlFor="salary" className="contratos-form-label">
                        <AttachMoneyIcon className="contratos-form-label-icon" />
                        Salario
                      </label>
                      <div className="contratos-form-salary-group">
                        <input
                          type="number"
                          id="salary"
                          name="salary"
                          value={formData.salary}
                          onChange={handleChange}
                          className="contratos-form-input contratos-form-salary-input"
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                        <select
                          id="currency"
                          name="currency"
                          value={formData.currency}
                          onChange={handleChange}
                          className="contratos-form-input contratos-form-currency-select"
                        >
                          <option value="USD">USD</option>
                          <option value="COP">COP</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>
                    </div>

                    <div className="contratos-form-group">
                      <label htmlFor="paymentAccountId" className="contratos-form-label">
                        <AccountBalanceIcon className="contratos-form-label-icon" />
                        Cuenta a la que Pagan
                      </label>
                      <select
                        id="paymentAccountId"
                        name="paymentAccountId"
                        value={formData.paymentAccountId}
                        onChange={handleChange}
                        className="contratos-form-input"
                      >
                        <option value="">Seleccionar cuenta</option>
                        {bankAccounts.map(account => (
                          <option key={account.id} value={account.id}>
                            {account.nombre} - {account.banco} ({account.currency})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="contratos-form-group">
                      <label htmlFor="deductions" className="contratos-form-label">
                        <RemoveCircleIcon className="contratos-form-label-icon" />
                        Deducciones
                      </label>
                      <textarea
                        id="deductions"
                        name="deductions"
                        value={formData.deductions}
                        onChange={handleChange}
                        className="contratos-form-input contratos-form-textarea"
                        placeholder="Describe las deducciones que se aplican (impuestos, seguros, etc.)"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="contratos-form-section">
                    <h3 className="contratos-form-section-title">Beneficios y Condiciones</h3>

                    <div className="contratos-form-group">
                      <label htmlFor="benefits" className="contratos-form-label">
                        <CardGiftcardIcon className="contratos-form-label-icon" />
                        Beneficios
                      </label>
                      <textarea
                        id="benefits"
                        name="benefits"
                        value={formData.benefits}
                        onChange={handleChange}
                        className="contratos-form-input contratos-form-textarea"
                        placeholder="Describe los beneficios (seguro médico, bonos, etc.)"
                        rows={3}
                      />
                    </div>

                    <div className="contratos-form-group">
                      <label className="contratos-form-checkbox-label">
                        <input
                          type="checkbox"
                          name="exclusivity"
                          checked={formData.exclusivity}
                          onChange={handleChange}
                          className="contratos-form-checkbox"
                        />
                        <BlockIcon className="contratos-form-label-icon" />
                        <span>Exclusividad</span>
                      </label>
                    </div>

                    <div className="contratos-form-group">
                      <label htmlFor="ptos" className="contratos-form-label">
                        <EventIcon className="contratos-form-label-icon" />
                        PTOs (Días de Vacaciones)
                      </label>
                      <input
                        type="number"
                        id="ptos"
                        name="ptos"
                        value={formData.ptos}
                        onChange={handleChange}
                        className="contratos-form-input"
                        placeholder="Ej: 15"
                        min="0"
                      />
                    </div>

                    <div className="contratos-form-group">
                      <label htmlFor="holidaysCountry" className="contratos-form-label">
                        <PublicIcon className="contratos-form-label-icon" />
                        Holidays (País)
                      </label>
                      <input
                        type="text"
                        id="holidaysCountry"
                        name="holidaysCountry"
                        value={formData.holidaysCountry}
                        onChange={handleChange}
                        className="contratos-form-input"
                        placeholder="Ej: Colombia, Estados Unidos"
                      />
                    </div>
                  </div>

                  <div className="contratos-form-section">
                    <h3 className="contratos-form-section-title">Agencia</h3>

                    <div className="contratos-form-group">
                      <label className="contratos-form-checkbox-label">
                        <input
                          type="checkbox"
                          name="hasAgency"
                          checked={formData.hasAgency}
                          onChange={handleChange}
                          className="contratos-form-checkbox"
                        />
                        <BusinessIcon className="contratos-form-label-icon" />
                        <span>Hay Agencia de por Medio</span>
                      </label>
                    </div>

                    {formData.hasAgency && (
                      <div className="contratos-form-group">
                        <label htmlFor="agencyName" className="contratos-form-label">
                          <BusinessIcon className="contratos-form-label-icon" />
                          Nombre de la Agencia
                        </label>
                        <input
                          type="text"
                          id="agencyName"
                          name="agencyName"
                          value={formData.agencyName}
                          onChange={handleChange}
                          className="contratos-form-input"
                          placeholder="Nombre de la agencia"
                        />
                      </div>
                    )}
                  </div>

                  <div className="contratos-form-actions">
                    {editingId ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setShowFormModal(false)
                            handleCancelEdit()
                          }}
                          className="contratos-form-button contratos-form-button-secondary"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="contratos-form-button contratos-form-button-primary"
                        >
                          <SaveIcon className="contratos-form-button-icon" />
                          {isSaving ? 'Guardando...' : 'Actualizar Contrato'}
                        </button>
                      </>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="contratos-form-button contratos-form-button-primary"
                      >
                        <SaveIcon className="contratos-form-button-icon" />
                        {isSaving ? 'Guardando...' : 'Guardar Contrato'}
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
          <div className="contratos-modal-overlay" onClick={() => setShowRecordsModal(false)}>
            <div className="contratos-modal" onClick={e => e.stopPropagation()}>
              <div className="contratos-modal-header">
                <h2 className="contratos-modal-title">Contratos Guardados</h2>
                <button
                  className="contratos-modal-close"
                  onClick={() => setShowRecordsModal(false)}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="contratos-modal-content">
                {isLoading ? (
                  <p>Cargando...</p>
                ) : records.length === 0 ? (
                  <p className="contratos-modal-empty">No hay contratos guardados</p>
                ) : (
                  <div className="contratos-modal-list">
                    {records.map(record => (
                      <div key={record.id} className="contratos-modal-item">
                        <div className="contratos-modal-item-info">
                          <h3 className="contratos-modal-item-name">{record.name}</h3>
                          <p className="contratos-modal-item-meta">
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
                          className="contratos-modal-item-button"
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
          <div className="contratos-modal-overlay" onClick={() => setIsDebugModalOpen(false)}>
            <div className="contratos-modal" onClick={e => e.stopPropagation()}>
              <div className="contratos-modal-header">
                <h2 className="contratos-modal-title">🐛 Debug - Contratos</h2>
                <button
                  className="contratos-modal-close"
                  onClick={() => setIsDebugModalOpen(false)}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="contratos-modal-content">
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

                <div className="contratos-modal-form-actions">
                  <button
                    type="button"
                    className="contratos-form-button contratos-form-button-secondary"
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

export default Contratos
