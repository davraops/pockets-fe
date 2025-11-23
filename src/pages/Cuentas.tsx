import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PaymentIcon from '@mui/icons-material/Payment'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { api } from '../services/api'
import './AppPage.css'
import './Cuentas.css'

// Interfaz que coincide con la respuesta de la API
interface BankAccountAPI {
  id: string
  account_name: string
  bank: string
  currency: string
  account_id: string
  balance: {
    original: {
      amount: number
      currency: string
    }
    cop: {
      amount: number
      currency: string
    }
    conversion_rate?: number
    conversion_available: boolean
  }
  created_at: string
  updated_at: string
}

// Interfaz para uso interno del componente (mapeada desde API)
interface BankAccount {
  id: string
  nombre: string
  banco: string
  numeroCuenta: string
  balanceInicial: number
  currency: string
  balanceCOP: number
}

function Cuentas() {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [cards, setCards] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    banco: '',
    numeroCuenta: '',
    balanceInicial: ''
  })
  const [formErrors, setFormErrors] = useState({
    nombre: '',
    numeroCuenta: ''
  })
  const [exchangeRates, setExchangeRates] = useState({ USD: 3750, EUR: 4300 })

  // Mapear cuenta de API a formato interno
  const mapAccountFromAPI = (apiAccount: BankAccountAPI): BankAccount => {
    return {
      id: apiAccount.id,
      nombre: apiAccount.account_name,
      banco: apiAccount.bank,
      numeroCuenta: apiAccount.account_id,
      balanceInicial: apiAccount.balance.original.amount,
      currency: apiAccount.currency,
      balanceCOP: apiAccount.balance.cop.amount
    }
  }

  // Cargar cuentas desde la API
  useEffect(() => {
    const loadAccounts = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await api.getBankAccounts()
        if (response.accounts && Array.isArray(response.accounts)) {
          const mappedAccounts = response.accounts.map(mapAccountFromAPI)
          setAccounts(mappedAccounts)
        } else {
          setAccounts([])
        }
      } catch (err: any) {
        console.error('Error al cargar cuentas:', err)
        setError('Frontend says: Error al cargar las cuentas. Por favor, intenta de nuevo.')
        setAccounts([])
      } finally {
        setIsLoading(false)
      }
    }

    loadAccounts()
  }, [])

  // Cargar tarjetas de débito desde la API
  useEffect(() => {
    const loadCards = async () => {
      try {
        const response = await api.getCards()
        if (response.cards && Array.isArray(response.cards)) {
          setCards(response.cards)
        } else {
          setCards([])
        }
      } catch (err) {
        console.error('Error al cargar tarjetas:', err)
        setCards([])
      }
    }

    loadCards()

    // Escuchar eventos de actualización de tarjetas
    const handleCardsUpdate = () => {
      loadCards()
    }

    window.addEventListener('cardsUpdated', handleCardsUpdate)

    return () => {
      window.removeEventListener('cardsUpdated', handleCardsUpdate)
    }
  }, [])

  // Cargar tasas de cambio desde la API
  useEffect(() => {
    const loadExchangeRates = async () => {
      try {
        const usdResponse = await api.getExchangeRates({ origin: 'USD', target: 'COP' })
        const eurResponse = await api.getExchangeRates({ origin: 'EUR', target: 'COP' })

        if (usdResponse.exchange_rates && usdResponse.exchange_rates.length > 0) {
          setExchangeRates(prev => ({
            ...prev,
            USD: usdResponse.exchange_rates[0].exchange_rate
          }))
        }

        if (eurResponse.exchange_rates && eurResponse.exchange_rates.length > 0) {
          setExchangeRates(prev => ({
            ...prev,
            EUR: eurResponse.exchange_rates[0].exchange_rate
          }))
        }
      } catch (err) {
        console.error('Error al cargar tasas de cambio:', err)
        // Usar valores por defecto si falla
      }
    }

    loadExchangeRates()
  }, [])

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      nombre: '',
      banco: '',
      numeroCuenta: '',
      balanceInicial: ''
    })
    setFormErrors({
      nombre: '',
      numeroCuenta: ''
    })
  }

  const handleOpenDetailModal = (account: BankAccount) => {
    setSelectedAccount(account)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
    setFormData({
      nombre: account.nombre,
      banco: account.banco,
      numeroCuenta: account.numeroCuenta,
      balanceInicial: account.balanceInicial.toString()
    })
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedAccount(null)
    setIsEditMode(false)
    setFormData({
      nombre: '',
      banco: '',
      numeroCuenta: '',
      balanceInicial: ''
    })
    setFormErrors({
      nombre: '',
      numeroCuenta: ''
    })
  }

  const handleEditClick = () => {
    setIsEditMode(true)
  }

  const handleDeleteClick = async () => {
    if (selectedAccount && window.confirm('¿Estás seguro de que quieres eliminar esta cuenta?')) {
      try {
        await api.deleteBankAccount(selectedAccount.id)
        // Recargar cuentas después de eliminar
        const response = await api.getBankAccounts()
        if (response.accounts && Array.isArray(response.accounts)) {
          const mappedAccounts = response.accounts.map(mapAccountFromAPI)
          setAccounts(mappedAccounts)
        }
        handleCloseDetailModal()
      } catch (err: any) {
        console.error('Error al eliminar cuenta:', err)
        alert('Frontend says: Error al eliminar la cuenta. Por favor, intenta de nuevo.')
      }
    }
  }

  const validateForm = async (): Promise<boolean> => {
    const errors = {
      nombre: '',
      numeroCuenta: ''
    }
    let isValid = true

    // Validar nombre único - verificar contra la API
    try {
      const allAccounts = await api.getBankAccounts()
      if (allAccounts.accounts && Array.isArray(allAccounts.accounts)) {
        const nombreExists = allAccounts.accounts.some((acc: any) => 
          acc.account_name.toLowerCase() === formData.nombre.toLowerCase().trim() &&
          (!isEditMode || acc.id !== selectedAccount?.id)
        )
        if (nombreExists) {
          errors.nombre = 'Este nombre ya está en uso'
          isValid = false
        }

        // Validar número de cuenta único
        const numeroExists = allAccounts.accounts.some((acc: any) => 
          acc.account_id === formData.numeroCuenta.trim() &&
          (!isEditMode || acc.id !== selectedAccount?.id)
        )
        if (numeroExists) {
          errors.numeroCuenta = 'Este número de cuenta ya está en uso'
          isValid = false
        }
      }
    } catch (err) {
      console.error('Error al validar:', err)
      // Continuar con la validación local como fallback
      const nombreExists = accounts.some(acc => 
        acc.nombre.toLowerCase() === formData.nombre.toLowerCase().trim() &&
        (!isEditMode || acc.id !== selectedAccount?.id)
      )
      if (nombreExists) {
        errors.nombre = 'Este nombre ya está en uso'
        isValid = false
      }

      const numeroExists = accounts.some(acc => 
        acc.numeroCuenta === formData.numeroCuenta.trim() &&
        (!isEditMode || acc.id !== selectedAccount?.id)
      )
      if (numeroExists) {
        errors.numeroCuenta = 'Este número de cuenta ya está en uso'
        isValid = false
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
      if (isEditMode && selectedAccount) {
        // Editar cuenta existente
        await api.updateBankAccount(selectedAccount.id, {
          account_name: formData.nombre.trim(),
          account_id: formData.numeroCuenta.trim()
        })
        
        // Recargar cuentas después de actualizar
        const response = await api.getBankAccounts()
        if (response.accounts && Array.isArray(response.accounts)) {
          const mappedAccounts = response.accounts.map(mapAccountFromAPI)
          setAccounts(mappedAccounts)
        }
        handleCloseDetailModal()
      } else {
        // Agregar nueva cuenta
        const currency = getBancoCurrency(formData.banco)
        await api.createBankAccount({
          account_name: formData.nombre.trim(),
          bank: formData.banco,
          currency: currency,
          account_id: formData.numeroCuenta.trim(),
          balance: parseFloat(formData.balanceInicial)
        })

        // Recargar cuentas después de crear
        const response = await api.getBankAccounts()
        if (response.accounts && Array.isArray(response.accounts)) {
          const mappedAccounts = response.accounts.map(mapAccountFromAPI)
          setAccounts(mappedAccounts)
        }
        handleCloseModal()
      }
    } catch (err: any) {
      console.error('Error al guardar cuenta:', err)
      const errorMessage = err.data?.error
        ? `Backend says: ${err.data.error}`
        : 'Frontend says: Error al guardar la cuenta. Por favor, intenta de nuevo.'
      alert(errorMessage)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Limpiar errores cuando el usuario empiece a escribir
    if (formErrors[e.target.name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [e.target.name]: ''
      })
    }
  }

  // Mapeo de divisas por banco/pasarela
  const bancoCurrencies: Record<string, string> = {
    'Wise EUR': 'EUR',
    'Payoneer EUR': 'EUR',
    'Deel': 'USD',
    'Dolar App': 'USD',
    'Wise USD': 'USD',
    'Payoneer USD': 'USD',
    'Paypal': 'USD'
  }

  const getBancoCurrency = (banco: string): string => {
    return bancoCurrencies[banco] || 'COP'
  }

  const formatBalance = (balance: number, currency: string = 'COP') => {
    const locale = currency === 'EUR' ? 'es-ES' : currency === 'USD' ? 'en-US' : 'es-CO'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(balance)
  }

  const bancos = [
    'Bancolombia',
    'Davivienda',
    'Banco de Bogota',
    'GNB Sudameris',
    'Citibank',
    'Banco Agrario',
    'Banco de Occidente',
    'BBVA',
    'BTG Pactual',
    'Mundo Mujer',
    'Banco Caja Social',
    'ITAU',
    'Falabella',
    'Santander',
    'Bancamia',
    'JP Morgan Chase',
    'Mi Banco',
    'W',
    'Banco Popular',
    'Finandina',
    'Coopcentral',
    'Union',
    'Serfinanza',
    'Scotiabank',
    'Colpatria',
    'Bancoomeva',
    'Pichincha',
    'Av Villas',
    'Nequi',
    'Daviplata',
    'Movii',
    'Nu',
    'TPaga',
    'Tuya Pay',
    'Dale!',
    'Rappi',
    'Leal',
    'Bold',
    'Littio',
    'Uala',
    'Lulo Bank',
    'Coink',
    'Iris Neofinanciera',
    'Mercadopago',
    'PayU',
    'Deel',
    'Dolar App',
    'Wise USD',
    'Wise EUR',
    'Payoneer USD',
    'Payoneer EUR',
    'Paypal'
  ]

  // Colores para cada banco
  const bancoColors: Record<string, string> = {
    'Bancolombia': '#E2001A',
    'Davivienda': '#FF6B00',
    'Banco de Bogota': '#0033A0',
    'GNB Sudameris': '#00A859',
    'Citibank': '#0066CC',
    'Banco Agrario': '#00A859',
    'Banco de Occidente': '#FF6B00',
    'BBVA': '#004481',
    'BTG Pactual': '#000000',
    'Mundo Mujer': '#E91E63',
    'Banco Caja Social': '#0066CC',
    'ITAU': '#FF6B00',
    'Falabella': '#FF6B00',
    'Santander': '#EC0000',
    'Bancamia': '#00A859',
    'JP Morgan Chase': '#0066CC',
    'Mi Banco': '#0066CC',
    'W': '#000000',
    'Banco Popular': '#0066CC',
    'Finandina': '#0066CC',
    'Coopcentral': '#0066CC',
    'Union': '#0066CC',
    'Serfinanza': '#0066CC',
    'Scotiabank': '#E2001A',
    'Colpatria': '#0066CC',
    'Bancoomeva': '#0066CC',
    'Pichincha': '#0066CC',
    'Av Villas': '#0066CC',
    'Nequi': '#00A859',
    'Daviplata': '#0066CC',
    'Movii': '#0066CC',
    'Nu': '#8B5CF6',
    'TPaga': '#0066CC',
    'Tuya Pay': '#0066CC',
    'Dale!': '#FF6B00',
    'Rappi': '#00A859',
    'Leal': '#0066CC',
    'Bold': '#000000',
    'Littio': '#0066CC',
    'Uala': '#0066CC',
    'Lulo Bank': '#0066CC',
    'Coink': '#0066CC',
    'Iris Neofinanciera': '#0066CC',
    'Mercadopago': '#009EE3',
    'PayU': '#00A859',
    'Deel': '#0066CC',
    'Dolar App': '#00A859',
    'Wise USD': '#00B9FF',
    'Wise EUR': '#00B9FF',
    'Payoneer USD': '#FF6900',
    'Payoneer EUR': '#FF6900',
    'Paypal': '#003087'
  }

  const getBancoColor = (banco: string): string => {
    return bancoColors[banco] || '#007AFF'
  }

  const formatAccountNumber = (number: string) => {
    // Mostrar solo los últimos 4 dígitos
    return number.slice(-4).padStart(number.length, '•')
  }

  // Calcular el total en COP usando balanceCOP de cada cuenta
  const calculateTotalCOP = (): number => {
    return accounts.reduce((total, account) => {
      return total + account.balanceCOP
    }, 0)
  }

  // Contar tarjetas de débito por cuenta
  const getCardCountForAccount = (accountId: string): number => {
    return cards.filter(card => card.bank_account_id === accountId).length
  }

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isMenuOpen && !target.closest('.cuentas-toolbar-menu-container')) {
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

  // Función de debug para crear 10 cuentas de prueba
  const handleDebugCreateAccounts = async () => {
    const testAccounts = [
      { account_name: 'Cuenta Principal', bank: 'Bancolombia', currency: 'COP', account_id: '1234567890', balance: 5000000 },
      { account_name: 'Ahorros', bank: 'Davivienda', currency: 'COP', account_id: '9876543210', balance: 2500000 },
      { account_name: 'Nequi', bank: 'Nequi', currency: 'COP', account_id: '5555555555', balance: 500000 },
      { account_name: 'Paypal Personal', bank: 'Paypal', currency: 'USD', account_id: 'PP123456789', balance: 1500.5 },
      { account_name: 'Wise USD', bank: 'Wise USD', currency: 'USD', account_id: 'WISE123456', balance: 2500.75 },
      { account_name: 'Wise EUR', bank: 'Wise EUR', currency: 'EUR', account_id: 'WISE789012', balance: 1800.25 },
      { account_name: 'Deel', bank: 'Deel', currency: 'USD', account_id: 'DEEL456789', balance: 3200.0 },
      { account_name: 'Payoneer USD', bank: 'Payoneer USD', currency: 'USD', account_id: 'PAY123456', balance: 4500.0 },
      { account_name: 'Nu', bank: 'Nu', currency: 'COP', account_id: 'NU987654', balance: 800000 },
      { account_name: 'Mercadopago', bank: 'Mercadopago', currency: 'COP', account_id: 'MP123456789', balance: 1200000 }
    ]

    try {
      setIsLoading(true)
      for (const account of testAccounts) {
        await api.createBankAccount(account)
      }
      // Recargar cuentas después de crear todas
      const response = await api.getBankAccounts()
      if (response.accounts && Array.isArray(response.accounts)) {
        const mappedAccounts = response.accounts.map(mapAccountFromAPI)
        setAccounts(mappedAccounts)
      }
      setIsDebugModalOpen(false)
      alert('10 cuentas de prueba creadas exitosamente')
    } catch (err: any) {
      console.error('Error al crear cuentas de prueba:', err)
      alert('Backend says: ' + (err.data?.error || 'Error desconocido'))
    } finally {
      setIsLoading(false)
    }
  }

  // Función de debug para borrar todas las cuentas
  const handleDeleteAllAccounts = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar TODAS las cuentas? Esta acción es IRREVERSIBLE.')) {
      try {
        setIsLoading(true)
        await api.deleteAllBankAccounts()
        // Recargar cuentas después de borrar todas
        const response = await api.getBankAccounts()
        if (response.accounts && Array.isArray(response.accounts)) {
          const mappedAccounts = response.accounts.map(mapAccountFromAPI)
          setAccounts(mappedAccounts)
        }
        setIsDebugModalOpen(false)
        alert('Todas las cuentas han sido eliminadas exitosamente')
      } catch (err: any) {
        console.error('Error al eliminar todas las cuentas:', err)
        alert('Backend says: ' + (err.data?.error || 'Error desconocido'))
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <>
      <div className="app-page-container">
        <div className="app-page-content cuentas-content">
          {isLoading ? (
            <div className="loader-container">
              <div className="loader">
                <div className="loader-spinner"></div>
                <p className="loader-text">Cargando cuentas...</p>
              </div>
            </div>
          ) : error ? (
            <div className="loader-container">
              <div className="loader">
                <p className="loader-text" style={{ color: 'rgba(255, 59, 48, 0.9)' }}>{error}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Toolbar - HIG: Navigation */}
              <div className="cuentas-toolbar">
                <button
                  className="cuentas-toolbar-button"
                  onClick={() => navigate('/finanzas')}
                  aria-label="Volver a Finanzas"
                  type="button"
                >
                  <ArrowBackIcon className="cuentas-toolbar-icon" />
                </button>
                <div className="cuentas-toolbar-menu-container">
                  <button
                    className="cuentas-toolbar-button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Opciones"
                    aria-expanded={isMenuOpen}
                    type="button"
                  >
                    <MoreVertIcon className="cuentas-toolbar-icon" />
                  </button>
                  {isMenuOpen && (
                    <div className="cuentas-menu">
                      <button
                        className="cuentas-menu-item"
                        onClick={() => {
                          setIsMenuOpen(false)
                          handleOpenModal()
                        }}
                        type="button"
                      >
                        <AddIcon className="cuentas-menu-icon" />
                        <span>Agregar Cuenta</span>
                      </button>
                      {api.isTestUser() && (
                        <button
                          className="cuentas-menu-item"
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

              {/* Encabezado de Sección - HIG: Clear Navigation */}
              <h1 className="cuentas-page-title">Cuentas</h1>

              {/* Tasas de cambio y Total */}
              <div className="exchange-rates-block">
                <div className="exchange-rate-item">
                  <span className="exchange-rate-label">USD</span>
                  <span className="exchange-rate-value">{exchangeRates.USD.toLocaleString('es-CO')} COP</span>
                </div>
                <div className="exchange-rate-separator"></div>
                <div className="exchange-rate-item">
                  <span className="exchange-rate-label">EUR</span>
                  <span className="exchange-rate-value">{exchangeRates.EUR.toLocaleString('es-CO')} COP</span>
                </div>
                <div className="exchange-rate-separator separator-after-eur"></div>
                <div className="exchange-rate-item total-cop">
                  <span className="exchange-rate-label">Total</span>
                  <span className="exchange-rate-value total-value">{formatBalance(calculateTotalCOP(), 'COP')}</span>
                </div>
              </div>


              {accounts.length === 0 ? (
                <div className="empty-state">
                  <AccountBalanceWalletIcon className="empty-icon" />
                  <p className="empty-text">No hay cuentas agregadas</p>
                  <p className="empty-subtext">Agrega tu primera cuenta bancaria</p>
                </div>
              ) : (
                <div className="accounts-list">
                  <div className="accounts-group">
                    {[...accounts].sort((a, b) => b.balanceCOP - a.balanceCOP).map((account) => {
                      const bancoColor = getBancoColor(account.banco)
                      return (
                        <button
                          key={account.id}
                          className="account-row"
                          onClick={() => handleOpenDetailModal(account)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              handleOpenDetailModal(account)
                            }
                          }}
                          aria-label={`Ver detalles de cuenta ${account.nombre} del banco ${account.banco}. Balance: ${formatBalance(account.balanceInicial, account.currency)}`}
                          type="button"
                        >
                          <div className="account-row-content">
                            <div className="account-row-main">
                              <span className="account-row-title">{account.nombre}</span>
                              <span className="account-row-balance">{formatBalance(account.balanceInicial, account.currency)}</span>
                            </div>
                            <div className="account-row-secondary">
                              <span className="account-row-bank">{account.banco}</span>
                              {getCardCountForAccount(account.id) > 0 && (
                                <span className="account-row-cards">
                                  {getCardCountForAccount(account.id)} tarjeta{getCardCountForAccount(account.id) !== 1 ? 's' : ''}
                                </span>
                              )}
                              {account.currency !== 'COP' && (
                                <span className="account-row-equivalent">
                                  ≈ {formatBalance(account.balanceCOP)} COP
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRightIcon className="account-row-chevron" aria-hidden="true" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Botón de volver */}
            </>
          )}
        </div>
      </div>

      {/* Modal para agregar cuenta */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nueva Cuenta Bancaria</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="nombre">Nombre</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Cuenta Principal"
                  className={formErrors.nombre ? 'input-error' : ''}
                />
                {formErrors.nombre && (
                  <span className="error-message">{formErrors.nombre}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="banco">Banco</label>
                <select
                  id="banco"
                  name="banco"
                  value={formData.banco}
                  onChange={handleChange}
                  required
                  className="form-select"
                >
                  <option value="">Selecciona un banco</option>
                  {bancos.map((banco) => (
                    <option key={banco} value={banco}>
                      {banco}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="numeroCuenta">Número de Cuenta</label>
                <input
                  type="text"
                  id="numeroCuenta"
                  name="numeroCuenta"
                  value={formData.numeroCuenta}
                  onChange={handleChange}
                  required
                  placeholder="Ej: 1234567890"
                  className={formErrors.numeroCuenta ? 'input-error' : ''}
                />
                {formErrors.numeroCuenta && (
                  <span className="error-message">{formErrors.numeroCuenta}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="balanceInicial">Balance Inicial</label>
                <input
                  type="number"
                  id="balanceInicial"
                  name="balanceInicial"
                  value={formData.balanceInicial}
                  onChange={handleChange}
                  required
                  step="0.01"
                  placeholder="0.00"
                />
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
      {isDetailModalOpen && selectedAccount && (
        <div className="modal-overlay" onClick={handleCloseDetailModal}>
          <div 
            className="modal-content detail-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{ '--banco-color': getBancoColor(selectedAccount.banco) } as React.CSSProperties}
          >
            <div className="modal-header">
              <h2 className="modal-title">Detalles de la Cuenta</h2>
              <button className="modal-close" onClick={handleCloseDetailModal}>×</button>
            </div>
            
            {!isEditMode ? (
              <>
                <div className="detail-content">
                  <div className="detail-section">
                    <div className="detail-icon-large" style={{ backgroundColor: getBancoColor(selectedAccount.banco) }}>
                      <AccountBalanceWalletIcon />
                    </div>
                    <div className="detail-info">
                      <h3 className="detail-name">{selectedAccount.nombre}</h3>
                      <p className="detail-bank">{selectedAccount.banco}</p>
                    </div>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Número de Cuenta:</span>
                    <span className="detail-value">{selectedAccount.numeroCuenta}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Balance:</span>
                    <div className="detail-balance-wrapper">
                      <span className="detail-balance">{formatBalance(selectedAccount.balanceInicial, selectedAccount.currency)}</span>
                      <span className="detail-currency">{selectedAccount.currency}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-actions">
                  <button className="detail-button edit" onClick={handleEditClick}>
                    <EditIcon />
                    <span>Editar Cuenta</span>
                  </button>
                  <button className="detail-button delete" onClick={handleDeleteClick}>
                    <DeleteIcon />
                    <span>Eliminar Cuenta</span>
                  </button>
                </div>
              </>
            ) : (
              <form className="modal-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="edit-nombre">Nombre</label>
                  <input
                    type="text"
                    id="edit-nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Cuenta Principal"
                    className={formErrors.nombre ? 'input-error' : ''}
                  />
                  {formErrors.nombre && (
                    <span className="error-message">{formErrors.nombre}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="edit-banco">Banco</label>
                  <select
                    id="edit-banco"
                    name="banco"
                    value={formData.banco}
                    onChange={handleChange}
                    required
                    className="form-select disabled-input"
                    disabled
                  >
                    <option value="">Selecciona un banco</option>
                    {bancos.map((banco) => (
                      <option key={banco} value={banco}>
                        {banco}
                      </option>
                    ))}
                  </select>
                  <p className="form-hint">El banco no se puede modificar</p>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-numeroCuenta">Número de Cuenta</label>
                  <input
                    type="text"
                    id="edit-numeroCuenta"
                    name="numeroCuenta"
                    value={formData.numeroCuenta}
                    onChange={handleChange}
                    required
                    placeholder="Ej: 1234567890"
                    className={formErrors.numeroCuenta ? 'input-error' : ''}
                  />
                  {formErrors.numeroCuenta && (
                    <span className="error-message">{formErrors.numeroCuenta}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="edit-balanceInicial">Balance</label>
                  <div className="balance-input-wrapper">
                    <input
                      type="text"
                      id="edit-balanceInicial"
                      value={formatBalance(selectedAccount.balanceInicial, selectedAccount.currency)}
                      disabled
                      className="disabled-input"
                    />
                    <span className="input-currency">{selectedAccount.currency}</span>
                  </div>
                  <p className="form-hint">El balance no se puede modificar</p>
                </div>
                <div className="modal-actions">
                  <button type="button" className="modal-button cancel" onClick={() => setIsEditMode(false)}>
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Debug - Cuentas</h2>
              <button className="modal-close" onClick={() => setIsDebugModalOpen(false)}>×</button>
            </div>
            <div className="debug-modal-content">
              <div className="debug-options">
                <button
                  className="debug-option-button create-demo"
                  onClick={handleDebugCreateAccounts}
                  disabled={isLoading}
                >
                  <span className="debug-option-icon">📦</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Crear Cuentas Demo</h3>
                    <p className="debug-option-description">Crea 10 cuentas de ejemplo para pruebas</p>
                  </div>
                </button>
                <button
                  className="debug-option-button delete-all"
                  onClick={handleDeleteAllAccounts}
                  disabled={isLoading}
                >
                  <span className="debug-option-icon">🗑️</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Eliminar Todas las Cuentas</h3>
                    <p className="debug-option-description">⚠️ PELIGROSO: Elimina todas las cuentas (IRREVERSIBLE)</p>
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

export default Cuentas
