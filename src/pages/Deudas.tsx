import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { api } from '../services/api'
import './AppPage.css'
import './Deudas.css'

// Interfaz que coincide con la respuesta de la API (campos en inglés)
interface DebtAPI {
  id: string
  value: number
  currency: string
  concept: string
  owed: number
  reference?: string
  cut_date: string
  interest_rate: number
  overdue_interest: number
  minimum_payment: number
  has_insurance: boolean
  insurance_value: number
  created_at: string
  updated_at: string
}

// Interfaz para uso interno del componente
interface Debt {
  id: string
  concepto: string
  referencia?: string
  valor: number
  adeudado: number
  divisa: string
  fechaCorte: string
  tasaInteres: number
  interesEnMora: number
  pagoMinimo: number
  tieneSeguro: boolean
  valorSeguro: number
}

function Deudas() {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const [debts, setDebts] = useState<Debt[]>([])
  const [creditCards, setCreditCards] = useState<Array<{ id: string, nombre: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [formData, setFormData] = useState({
    concepto: '',
    referencia: '',
    valor: '',
    adeudado: '',
    divisa: 'COP',
    fechaCorte: '',
    tasaInteres: '',
    interesEnMora: '',
    pagoMinimo: '',
    tieneSeguro: false,
    valorSeguro: ''
  })
  const [formErrors, setFormErrors] = useState({
    concepto: '',
    valor: '',
    adeudado: '',
    fechaCorte: ''
  })

  // Mapear deuda de API a formato interno
  const mapDebtFromAPI = (apiDebt: DebtAPI): Debt => {
    return {
      id: apiDebt.id,
      concepto: apiDebt.concept,
      referencia: apiDebt.reference,
      valor: apiDebt.value,
      adeudado: apiDebt.owed,
      divisa: apiDebt.currency,
      fechaCorte: apiDebt.cut_date,
      tasaInteres: apiDebt.interest_rate,
      interesEnMora: apiDebt.overdue_interest,
      pagoMinimo: apiDebt.minimum_payment,
      tieneSeguro: apiDebt.has_insurance,
      valorSeguro: apiDebt.insurance_value
    }
  }

  // Función para verificar si una deuda está asociada a una tarjeta de crédito
  const isDebtAssociatedWithCreditCard = (debtConcepto: string): boolean => {
    return creditCards.some(card => card.nombre === debtConcepto)
  }

  // Función para recargar deudas
  const reloadDebts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Cargar tarjetas de crédito para verificar asociaciones
      const creditCardsResponse = await api.getCreditCards()
      const creditCardsList: Array<{ id: string, nombre: string }> = []
      if (creditCardsResponse.credit_cards && Array.isArray(creditCardsResponse.credit_cards)) {
        creditCardsResponse.credit_cards.forEach((card: any) => {
          creditCardsList.push({ id: card.id, nombre: card.name })
        })
      }
      setCreditCards(creditCardsList)

      const response = await api.getDebts()
      if (response.debts && Array.isArray(response.debts)) {
        const mappedDebts = response.debts.map(mapDebtFromAPI)
        // Ordenar por tasa de interés según el orden seleccionado y luego por monto adeudado (descendente)
        mappedDebts.sort((a: Debt, b: Debt) => {
          if (a.tasaInteres !== b.tasaInteres) {
            if (sortOrder === 'desc') {
              return b.tasaInteres - a.tasaInteres // Mayor tasa de interés primero
            } else {
              return a.tasaInteres - b.tasaInteres // Menor tasa de interés primero
            }
          }
          return b.adeudado - a.adeudado // Si misma tasa, mayor monto adeudado primero
        })
        setDebts(mappedDebts)
      } else {
        setDebts([])
      }
    } catch (err: any) {
      console.error('Error al cargar deudas:', err)
      setError('Frontend says: Error al cargar las deudas. Por favor, intenta de nuevo.')
      setDebts([])
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar deudas desde la API
  useEffect(() => {
    reloadDebts()
  }, [sortOrder])

  // Función para alternar el orden de clasificación
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      concepto: '',
      referencia: '',
      valor: '',
      adeudado: '',
      divisa: 'COP',
      fechaCorte: '',
      tasaInteres: '',
      interesEnMora: '',
      pagoMinimo: '',
      tieneSeguro: false,
      valorSeguro: ''
    })
    setFormErrors({
      concepto: '',
      valor: '',
      adeudado: '',
      fechaCorte: ''
    })
  }

  const handleOpenDetailModal = (debt: Debt) => {
    setSelectedDebt(debt)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
    setFormData({
      concepto: debt.concepto,
      referencia: debt.referencia || '',
      valor: debt.valor.toString(),
      adeudado: debt.adeudado.toString(),
      divisa: debt.divisa,
      fechaCorte: debt.fechaCorte,
      tasaInteres: debt.tasaInteres.toString(),
      interesEnMora: debt.interesEnMora.toString(),
      pagoMinimo: debt.pagoMinimo.toString(),
      tieneSeguro: debt.tieneSeguro,
      valorSeguro: debt.valorSeguro.toString()
    })
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedDebt(null)
    setIsEditMode(false)
    setFormData({
      concepto: '',
      referencia: '',
      valor: '',
      adeudado: '',
      divisa: 'COP',
      fechaCorte: '',
      tasaInteres: '',
      interesEnMora: '',
      pagoMinimo: '',
      tieneSeguro: false,
      valorSeguro: ''
    })
    setFormErrors({
      concepto: '',
      valor: '',
      adeudado: '',
      fechaCorte: ''
    })
  }

  const handleEditClick = () => {
    if (!selectedDebt) return
    
    // Prevenir edición de deudas asociadas a tarjetas de crédito
    if (isDebtAssociatedWithCreditCard(selectedDebt.concepto)) {
      alert('Frontend says: Esta deuda está asociada a una tarjeta de crédito y no puede ser editada. Para modificarla, edita la tarjeta de crédito asociada.')
      return
    }
    
    setIsEditMode(true)
  }

  const validateForm = async (): Promise<boolean> => {
    const errors = {
      concepto: '',
      valor: '',
      adeudado: '',
      fechaCorte: ''
    }
    let isValid = true

    // Validar concepto
    if (!formData.concepto.trim()) {
      errors.concepto = 'El concepto es requerido'
      isValid = false
    }

    // Validar valor
    const valor = parseFloat(formData.valor)
    if (isNaN(valor) || valor <= 0) {
      errors.valor = 'El valor debe ser mayor a 0'
      isValid = false
    }

    // Validar adeudado
    const adeudado = parseFloat(formData.adeudado)
    if (isNaN(adeudado) || adeudado < 0) {
      errors.adeudado = 'El monto adeudado debe ser mayor o igual a 0'
      isValid = false
    }

    if (adeudado > valor) {
      errors.adeudado = 'El monto adeudado no puede ser mayor al valor total'
      isValid = false
    }

    // Validar fecha de corte
    if (!formData.fechaCorte) {
      errors.fechaCorte = 'La fecha de corte es requerida'
      isValid = false
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
      if (isEditMode && selectedDebt) {
        // Editar deuda existente
        await api.updateDebt(selectedDebt.id, {
          concept: formData.concepto.trim(),
          reference: formData.referencia.trim() || undefined,
          value: parseFloat(formData.valor),
          owed: parseFloat(formData.adeudado),
          currency: formData.divisa,
          cut_date: formData.fechaCorte,
          interest_rate: parseFloat(formData.tasaInteres) || 0,
          overdue_interest: parseFloat(formData.interesEnMora) || 0,
          minimum_payment: parseFloat(formData.pagoMinimo) || 0,
          has_insurance: formData.tieneSeguro,
          insurance_value: parseFloat(formData.valorSeguro) || 0
        })
        
        // Recargar deudas después de actualizar
        const response = await api.getDebts()
        if (response.debts && Array.isArray(response.debts)) {
          const mappedDebts = response.debts.map(mapDebtFromAPI)
          setDebts(mappedDebts)
        }
        // Disparar evento para actualizar tarjetas de crédito
        window.dispatchEvent(new Event('debtsUpdated'))
        handleCloseDetailModal()
      } else {
        // Agregar nueva deuda
        await api.createDebt({
          concept: formData.concepto.trim(),
          reference: formData.referencia.trim() || undefined,
          value: parseFloat(formData.valor),
          owed: parseFloat(formData.adeudado),
          currency: formData.divisa,
          cut_date: formData.fechaCorte,
          interest_rate: parseFloat(formData.tasaInteres) || 0,
          overdue_interest: parseFloat(formData.interesEnMora) || 0,
          minimum_payment: parseFloat(formData.pagoMinimo) || 0,
          has_insurance: formData.tieneSeguro,
          insurance_value: parseFloat(formData.valorSeguro) || 0
        })

        // Recargar deudas después de crear
        const response = await api.getDebts()
        if (response.debts && Array.isArray(response.debts)) {
          const mappedDebts = response.debts.map(mapDebtFromAPI)
          setDebts(mappedDebts)
        }
        // Disparar evento para actualizar tarjetas de crédito
        window.dispatchEvent(new Event('debtsUpdated'))
        handleCloseModal()
      }
    } catch (err: any) {
      console.error('Error al guardar deuda:', err)
      const errorMessage = err.data?.error
        ? `Backend says: ${err.data.error}`
        : 'Frontend says: Error al guardar la deuda. Por favor, intenta de nuevo.'
      alert(errorMessage)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value
    
    setFormData({
      ...formData,
      [target.name]: value
    })
    // Limpiar errores cuando el usuario empiece a escribir
    if (formErrors[target.name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [target.name]: ''
      })
    }
  }

  const handleDeleteClick = async () => {
    if (!selectedDebt) return

    // Verificar si la deuda está asociada a una tarjeta de crédito
    if (isDebtAssociatedWithCreditCard(selectedDebt.concepto)) {
      alert('Frontend says: Esta deuda está asociada a una tarjeta de crédito. Para eliminarla, primero debes eliminar la tarjeta de crédito asociada.')
      return
    }

    if (window.confirm(`¿Estás seguro de que quieres eliminar la deuda "${selectedDebt.concepto}"?`)) {
      try {
        await api.deleteDebt(selectedDebt.id)
        const response = await api.getDebts()
        if (response.debts && Array.isArray(response.debts)) {
          const mappedDebts = response.debts.map(mapDebtFromAPI)
          setDebts(mappedDebts)
        }
        // Disparar evento para actualizar tarjetas de crédito
        window.dispatchEvent(new Event('debtsUpdated'))
        handleCloseDetailModal()
      } catch (err: any) {
        console.error('Error al eliminar deuda:', err)
        alert('Frontend says: Error al eliminar la deuda. Por favor, intenta de nuevo.')
      }
    }
  }

  const formatBalance = (balance: number, currency: string = 'COP') => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(balance)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Función para obtener un color único basado en el concepto de la deuda (paleta de rojos sangre)
  const getDebtColor = (concepto: string): string => {
    const redColors = [
      '#DC143C', // Rojo carmesí
      '#C41E3A', // Rojo oscuro
      '#B22222', // Rojo fuego
      '#8B0000', // Rojo oscuro intenso
      '#A52A2A', // Rojo marrón
      '#CD5C5C', // Rojo indio
      '#DC3545', // Rojo bootstrap
      '#C82333', // Rojo oscuro bootstrap
      '#E74C3C', // Rojo tomate oscuro
      '#C0392B', // Rojo granate
      '#A93226', // Rojo rojizo oscuro
      '#922B21'  // Rojo sangre oscuro
    ]
    let hash = 0
    for (let i = 0; i < concepto.length; i++) {
      hash = concepto.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % redColors.length
    return redColors[index]
  }

  // Calcular porcentaje pagado
  const calculatePaidPercentage = (valor: number, adeudado: number): number => {
    if (valor === 0) return 0
    return ((valor - adeudado) / valor) * 100
  }

  // Función de debug para crear deudas de prueba
  const handleCreateDemoDebts = async () => {
    const testDebts = [
      {
        value: 5000000,
        currency: 'COP',
        concept: 'Préstamo Bancolombia',
        owed: 3000000,
        reference: 'PREST-1234',
        cut_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 días desde hoy
        interest_rate: 2.5,
        overdue_interest: 5.0,
        minimum_payment: 150000,
        has_insurance: true,
        insurance_value: 50000
      },
      {
        value: 3000000,
        currency: 'COP',
        concept: 'Crédito de Libre Inversión',
        owed: 1800000,
        reference: 'CRED-5678',
        cut_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        interest_rate: 3.0,
        overdue_interest: 6.0,
        minimum_payment: 90000,
        has_insurance: false,
        insurance_value: 0
      },
      {
        value: 2000000,
        currency: 'COP',
        concept: 'Préstamo Personal',
        owed: 2000000,
        reference: 'PREST-9012',
        cut_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        interest_rate: 1.8,
        overdue_interest: 4.5,
        minimum_payment: 200000,
        has_insurance: false,
        insurance_value: 0
      },
      {
        value: 10000,
        currency: 'USD',
        concept: 'Préstamo Internacional',
        owed: 7500,
        reference: 'INT-3456',
        cut_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        interest_rate: 2.0,
        overdue_interest: 5.5,
        minimum_payment: 500,
        has_insurance: true,
        insurance_value: 50
      },
      {
        value: 8000000,
        currency: 'COP',
        concept: 'Crédito Vehicular',
        owed: 6000000,
        reference: 'VEH-7890',
        cut_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        interest_rate: 1.5,
        overdue_interest: 3.0,
        minimum_payment: 400000,
        has_insurance: true,
        insurance_value: 120000
      },
      {
        value: 1500000,
        currency: 'COP',
        concept: 'Línea de Crédito',
        owed: 500000,
        reference: 'LINEA-2468',
        cut_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        interest_rate: 2.2,
        overdue_interest: 4.8,
        minimum_payment: 75000,
        has_insurance: false,
        insurance_value: 0
      },
      {
        value: 4000000,
        currency: 'COP',
        concept: 'Crédito Hipotecario',
        owed: 2500000,
        reference: 'HIP-1357',
        cut_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        interest_rate: 2.8,
        overdue_interest: 5.5,
        minimum_payment: 125000,
        has_insurance: true,
        insurance_value: 40000
      },
      {
        value: 6000,
        currency: 'EUR',
        concept: 'Préstamo en Euros',
        owed: 4500,
        reference: 'EUR-9876',
        cut_date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        interest_rate: 1.9,
        overdue_interest: 4.2,
        minimum_payment: 300,
        has_insurance: false,
        insurance_value: 0
      }
    ]

    try {
      setIsLoading(true)
      for (const debt of testDebts) {
        await api.createDebt(debt)
      }
      await reloadDebts()
      setIsDebugModalOpen(false)
      alert('8 deudas de prueba creadas exitosamente')
    } catch (err: any) {
      console.error('Error al crear deudas de prueba:', err)
      alert('Backend says: ' + (err.data?.error || 'Error desconocido'))
    } finally {
      setIsLoading(false)
    }
  }

  // Función para eliminar todas las deudas
  const handleDeleteAllDebts = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar TODAS las deudas? Esta acción es IRREVERSIBLE.')) {
      try {
        setIsLoading(true)
        await api.deleteAllDebts()
        await reloadDebts()
        setIsDebugModalOpen(false)
        alert('Todas las deudas han sido eliminadas exitosamente')
      } catch (err: any) {
        console.error('Error al eliminar todas las deudas:', err)
        alert('Backend says: ' + (err.data?.error || 'Error desconocido'))
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <>
      <div className="app-page-container">
        <div className="app-page-content deudas-content">
          {isLoading ? (
            <div className="loader-container">
              <div className="loader">
                <div className="loader-spinner"></div>
                <p className="loader-text">Cargando deudas...</p>
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
              <div className="deudas-header">
                <button className="add-debt-button" onClick={handleOpenModal}>
                  <AddIcon />
                  <span>Agregar Deuda</span>
                </button>
                <div className="deudas-header-actions">
                  <button 
                    className="sort-button" 
                    onClick={toggleSortOrder}
                    title={sortOrder === 'desc' ? 'Ordenar por tasa ascendente' : 'Ordenar por tasa descendente'}
                  >
                    {sortOrder === 'desc' ? (
                      <>
                        <ArrowDownwardIcon />
                        <span>Tasa ↓</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpwardIcon />
                        <span>Tasa ↑</span>
                      </>
                    )}
                  </button>
                  {api.isTestUser() && (
                    <button className="debug-button" onClick={() => setIsDebugModalOpen(true)} title="Debug: Opciones de desarrollo">
                      🐛 Debug
                    </button>
                  )}
                </div>
              </div>

              {debts.length === 0 ? (
                <div className="empty-state">
                  <AccountBalanceIcon className="empty-icon" />
                  <p className="empty-text">No hay deudas registradas</p>
                  <p className="empty-subtext">Agrega tu primera deuda</p>
                </div>
              ) : (
                <div className="debts-grid">
                  {debts.map((debt) => {
                    // Verificar si la deuda está asociada a una tarjeta de crédito y está pagada
                    const isCreditCardDebt = isDebtAssociatedWithCreditCard(debt.concepto)
                    const isPaidOff = isCreditCardDebt && (debt.adeudado === 0 || Math.abs(debt.adeudado) < 0.01)
                    const debtColor = isPaidOff ? '#34C759' : getDebtColor(debt.concepto) // Verde si está pagada
                    const paidPercentage = calculatePaidPercentage(debt.valor, debt.adeudado)
                    return (
                      <div 
                        key={debt.id} 
                        className={`debt-card ${isPaidOff ? 'debt-paid-off' : ''}`}
                        onClick={() => handleOpenDetailModal(debt)}
                        style={{ '--debt-color': debtColor } as React.CSSProperties}
                      >
                        <div className="debt-card-content">
                          <div className="debt-card-left">
                            <div className="debt-icon" style={{ backgroundColor: debtColor }}>
                              {isCreditCardDebt ? <CreditCardIcon /> : <AccountBalanceIcon />}
                            </div>
                            <div className="debt-info">
                              <h3 className="debt-concepto">{debt.concepto}</h3>
                              <div className="debt-meta">
                                {debt.referencia && (
                                  <span className="debt-reference">{debt.referencia}</span>
                                )}
                                {debt.referencia && <span className="debt-meta-separator">•</span>}
                                <span className="debt-currency">{debt.divisa}</span>
                                {debt.tasaInteres > 0 && (
                                  <>
                                    <span className="debt-meta-separator">•</span>
                                    <span className="debt-rate">{debt.tasaInteres}% interés</span>
                                  </>
                                )}
                                <span className="debt-meta-separator">•</span>
                                <span className="debt-date">Corte: {formatDate(debt.fechaCorte)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="debt-card-right">
                            <div className="debt-main-amount">
                              <span className="debt-main-label">Adeudado</span>
                              <span className="debt-main-value">{formatBalance(debt.adeudado, debt.divisa)}</span>
                            </div>
                            <div className="debt-secondary-info">
                              <div className="debt-secondary-item">
                                <span className="debt-secondary-label">Total</span>
                                <span className="debt-secondary-value">{formatBalance(debt.valor, debt.divisa)}</span>
                              </div>
                              <div className="debt-secondary-item">
                                <span className="debt-secondary-label">Pago Mín.</span>
                                <span className="debt-secondary-value">{formatBalance(debt.pagoMinimo, debt.divisa)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="debt-progress-container">
                          <div className="debt-progress-bar">
                            <div 
                              className="debt-progress-fill" 
                              style={{ 
                                width: `${Math.min(paidPercentage, 100)}%`,
                                backgroundColor: debtColor
                              }}
                            ></div>
                          </div>
                          <span className="debt-progress-text">{paidPercentage.toFixed(1)}% pagado</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Botón de volver */}
              <div className="back-button-container">
                <button className="back-button" onClick={() => navigate('/finanzas')}>
                  <ArrowBackIcon />
                  <span>Volver a Finanzas</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal para agregar deuda */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nueva Deuda</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', backgroundColor: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)', borderRadius: '8px', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)' }}>
              <strong>💡 Nota:</strong> Para registrar deudas de tarjetas de crédito, hazlo desde la sección <strong>Tarjetas Crédito</strong> en Finanzas.
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="concepto">Concepto *</label>
                <input
                  type="text"
                  id="concepto"
                  name="concepto"
                  value={formData.concepto}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Préstamo personal"
                  className={formErrors.concepto ? 'input-error' : ''}
                />
                {formErrors.concepto && (
                  <span className="error-message">{formErrors.concepto}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="referencia">Referencia</label>
                  <input
                    type="text"
                    id="referencia"
                    name="referencia"
                    value={formData.referencia}
                    onChange={handleChange}
                    placeholder="Ej: REF-1234"
                  />
              </div>
              <div className="form-group">
                <label htmlFor="divisa">Divisa *</label>
                <select
                  id="divisa"
                  name="divisa"
                  value={formData.divisa}
                  onChange={handleChange}
                  required
                  className="form-select"
                >
                  <option value="COP">COP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="valor">Valor Total *</label>
                <input
                  type="number"
                  id="valor"
                  name="valor"
                  value={formData.valor}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0.01"
                  placeholder="0"
                  className={formErrors.valor ? 'input-error' : ''}
                />
                {formErrors.valor && (
                  <span className="error-message">{formErrors.valor}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="adeudado">Monto Adeudado *</label>
                <input
                  type="number"
                  id="adeudado"
                  name="adeudado"
                  value={formData.adeudado}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  placeholder="0"
                  className={formErrors.adeudado ? 'input-error' : ''}
                />
                {formErrors.adeudado && (
                  <span className="error-message">{formErrors.adeudado}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="fechaCorte">Fecha de Corte *</label>
                <input
                  type="date"
                  id="fechaCorte"
                  name="fechaCorte"
                  value={formData.fechaCorte}
                  onChange={handleChange}
                  required
                  className={formErrors.fechaCorte ? 'input-error' : ''}
                />
                {formErrors.fechaCorte && (
                  <span className="error-message">{formErrors.fechaCorte}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="tasaInteres">Tasa de Interés (%)</label>
                <input
                  type="number"
                  id="tasaInteres"
                  name="tasaInteres"
                  value={formData.tasaInteres}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="interesEnMora">Interés en Mora (%)</label>
                <input
                  type="number"
                  id="interesEnMora"
                  name="interesEnMora"
                  value={formData.interesEnMora}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="pagoMinimo">Pago Mínimo</label>
                <input
                  type="number"
                  id="pagoMinimo"
                  name="pagoMinimo"
                  value={formData.pagoMinimo}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0"
                />
              </div>
              <div className="form-group checkbox-group">
                <label htmlFor="tieneSeguro" className="checkbox-label">
                  <input
                    type="checkbox"
                    id="tieneSeguro"
                    name="tieneSeguro"
                    checked={formData.tieneSeguro}
                    onChange={handleChange}
                  />
                  <span>Tiene Seguro</span>
                </label>
              </div>
              {formData.tieneSeguro && (
                <div className="form-group">
                  <label htmlFor="valorSeguro">Valor del Seguro</label>
                  <input
                    type="number"
                    id="valorSeguro"
                    name="valorSeguro"
                    value={formData.valorSeguro}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="0"
                  />
                </div>
              )}
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
      {isDetailModalOpen && selectedDebt && (
        <div className="modal-overlay" onClick={handleCloseDetailModal}>
          <div 
            className="modal-content detail-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{ '--debt-color': (() => {
              const isCreditCardDebt = isDebtAssociatedWithCreditCard(selectedDebt.concepto)
              const isPaidOff = isCreditCardDebt && (selectedDebt.adeudado === 0 || Math.abs(selectedDebt.adeudado) < 0.01)
              return isPaidOff ? '#34C759' : getDebtColor(selectedDebt.concepto)
            })() } as React.CSSProperties}
          >
            <div className="modal-header">
              <h2 className="modal-title">Detalles de la Deuda</h2>
              <button className="modal-close" onClick={handleCloseDetailModal}>×</button>
            </div>
            
            {!isEditMode ? (
              <>
                <div className="detail-content">
                  <div className="detail-section">
                    <div className="detail-icon-large" style={{ backgroundColor: (() => {
                      const isCreditCardDebt = isDebtAssociatedWithCreditCard(selectedDebt.concepto)
                      const isPaidOff = isCreditCardDebt && (selectedDebt.adeudado === 0 || Math.abs(selectedDebt.adeudado) < 0.01)
                      return isPaidOff ? '#34C759' : getDebtColor(selectedDebt.concepto)
                    })() }}>
                      {isDebtAssociatedWithCreditCard(selectedDebt.concepto) ? <CreditCardIcon /> : <AccountBalanceIcon />}
                    </div>
                    <div className="detail-info">
                      <h3 className="detail-name">{selectedDebt.concepto}</h3>
                      {selectedDebt.referencia && (
                        <p className="detail-bank">{selectedDebt.referencia}</p>
                      )}
                      <p className="detail-bank">{selectedDebt.divisa}</p>
                    </div>
                  </div>

                  <div className="debt-detail-progress">
                    <div className="debt-detail-progress-bar">
                      <div 
                        className="debt-detail-progress-fill" 
                        style={{ 
                          width: `${Math.min(calculatePaidPercentage(selectedDebt.valor, selectedDebt.adeudado), 100)}%`,
                          backgroundColor: (() => {
                            const isCreditCardDebt = isDebtAssociatedWithCreditCard(selectedDebt.concepto)
                            const isPaidOff = isCreditCardDebt && (selectedDebt.adeudado === 0 || Math.abs(selectedDebt.adeudado) < 0.01)
                            return isPaidOff ? '#34C759' : getDebtColor(selectedDebt.concepto)
                          })()
                        }}
                      ></div>
                    </div>
                    <span className="debt-detail-progress-text">{calculatePaidPercentage(selectedDebt.valor, selectedDebt.adeudado).toFixed(1)}% pagado</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Valor Total:</span>
                    <span className="detail-value">{formatBalance(selectedDebt.valor, selectedDebt.divisa)}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Monto Adeudado:</span>
                    <span className="detail-value spent">{formatBalance(selectedDebt.adeudado, selectedDebt.divisa)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Pagado:</span>
                    <span className="detail-value remaining">{formatBalance(selectedDebt.valor - selectedDebt.adeudado, selectedDebt.divisa)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Fecha de Corte:</span>
                    <span className="detail-value">{formatDate(selectedDebt.fechaCorte)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Pago Mínimo:</span>
                    <span className="detail-value">{formatBalance(selectedDebt.pagoMinimo, selectedDebt.divisa)}</span>
                  </div>

                  {selectedDebt.tasaInteres > 0 && (
                    <div className="detail-row">
                      <span className="detail-label">Tasa de Interés:</span>
                      <span className="detail-value">{selectedDebt.tasaInteres}%</span>
                    </div>
                  )}

                  {selectedDebt.interesEnMora > 0 && (
                    <div className="detail-row">
                      <span className="detail-label">Interés en Mora:</span>
                      <span className="detail-value">{selectedDebt.interesEnMora}%</span>
                    </div>
                  )}

                  {selectedDebt.tieneSeguro && (
                    <div className="detail-row">
                      <span className="detail-label">Valor del Seguro:</span>
                      <span className="detail-value">{formatBalance(selectedDebt.valorSeguro, selectedDebt.divisa)}</span>
                    </div>
                  )}
                </div>

                <div className="detail-actions">
                  {!isDebtAssociatedWithCreditCard(selectedDebt.concepto) && (
                    <>
                      <button className="detail-button edit" onClick={handleEditClick}>
                        <EditIcon />
                        <span>Editar Deuda</span>
                      </button>
                      <button className="detail-button delete" onClick={handleDeleteClick}>
                        <DeleteIcon />
                        <span>Eliminar Deuda</span>
                      </button>
                    </>
                  )}
                  {isDebtAssociatedWithCreditCard(selectedDebt.concepto) && (
                    <div style={{ padding: '0.5rem', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', width: '100%' }}>
                      Esta deuda está asociada a una tarjeta de crédito y no puede ser editada ni eliminada. Para modificarla, edita o elimina la tarjeta de crédito asociada.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <form className="modal-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="edit-concepto">Concepto *</label>
                  <input
                    type="text"
                    id="edit-concepto"
                    name="concepto"
                    value={formData.concepto}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Préstamo personal"
                    className={formErrors.concepto ? 'input-error' : ''}
                  />
                  {formErrors.concepto && (
                    <span className="error-message">{formErrors.concepto}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="edit-referencia">Referencia</label>
                  <input
                    type="text"
                    id="edit-referencia"
                    name="referencia"
                    value={formData.referencia}
                    onChange={handleChange}
                    placeholder="Ej: REF-1234"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-divisa">Divisa *</label>
                  <select
                    id="edit-divisa"
                    name="divisa"
                    value={formData.divisa}
                    onChange={handleChange}
                    required
                    className="form-select"
                  >
                    <option value="COP">COP</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-valor">Valor Total *</label>
                  <input
                    type="number"
                    id="edit-valor"
                    name="valor"
                    value={formData.valor}
                    onChange={handleChange}
                    required
                    step="0.01"
                    min="0.01"
                    placeholder="0"
                    className={formErrors.valor ? 'input-error' : ''}
                  />
                  {formErrors.valor && (
                    <span className="error-message">{formErrors.valor}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="edit-adeudado">Monto Adeudado *</label>
                  <input
                    type="number"
                    id="edit-adeudado"
                    name="adeudado"
                    value={formData.adeudado}
                    onChange={handleChange}
                    required
                    step="0.01"
                    min="0"
                    placeholder="0"
                    className={formErrors.adeudado ? 'input-error' : ''}
                  />
                  {formErrors.adeudado && (
                    <span className="error-message">{formErrors.adeudado}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="edit-fechaCorte">Fecha de Corte *</label>
                  <input
                    type="date"
                    id="edit-fechaCorte"
                    name="fechaCorte"
                    value={formData.fechaCorte}
                    onChange={handleChange}
                    required
                    className={formErrors.fechaCorte ? 'input-error' : ''}
                  />
                  {formErrors.fechaCorte && (
                    <span className="error-message">{formErrors.fechaCorte}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="edit-tasaInteres">Tasa de Interés (%)</label>
                  <input
                    type="number"
                    id="edit-tasaInteres"
                    name="tasaInteres"
                    value={formData.tasaInteres}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-interesEnMora">Interés en Mora (%)</label>
                  <input
                    type="number"
                    id="edit-interesEnMora"
                    name="interesEnMora"
                    value={formData.interesEnMora}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-pagoMinimo">Pago Mínimo</label>
                  <input
                    type="number"
                    id="edit-pagoMinimo"
                    name="pagoMinimo"
                    value={formData.pagoMinimo}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div className="form-group checkbox-group">
                  <label htmlFor="edit-tieneSeguro" className="checkbox-label">
                    <input
                      type="checkbox"
                      id="edit-tieneSeguro"
                      name="tieneSeguro"
                      checked={formData.tieneSeguro}
                      onChange={handleChange}
                    />
                    <span>Tiene Seguro</span>
                  </label>
                </div>
                {formData.tieneSeguro && (
                  <div className="form-group">
                    <label htmlFor="edit-valorSeguro">Valor del Seguro</label>
                    <input
                      type="number"
                      id="edit-valorSeguro"
                      name="valorSeguro"
                      value={formData.valorSeguro}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                )}
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
              <h2 className="modal-title">Debug - Deudas</h2>
              <button className="modal-close" onClick={() => setIsDebugModalOpen(false)}>×</button>
            </div>
            <div className="debug-modal-content">
              <div className="debug-options">
                <button
                  className="debug-option-button create-demo"
                  onClick={handleCreateDemoDebts}
                  disabled={isLoading}
                >
                  <span className="debug-option-icon">📦</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Crear Deudas Demo</h3>
                    <p className="debug-option-description">Crea 8 deudas de ejemplo para pruebas</p>
                  </div>
                </button>
                <button
                  className="debug-option-button delete-all"
                  onClick={handleDeleteAllDebts}
                  disabled={isLoading}
                >
                  <span className="debug-option-icon">🗑️</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Eliminar Todas las Deudas</h3>
                    <p className="debug-option-description">⚠️ PELIGROSO: Elimina todas las deudas (IRREVERSIBLE)</p>
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

export default Deudas

