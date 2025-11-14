import { useState, useEffect } from 'react'
import AddIcon from '@mui/icons-material/Add'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { api } from '../services/api'
import './AppPage.css'
import './Transacciones.css'

// Interfaz que coincide con la respuesta de la API
interface TransactionAPI {
  id: string
  date: string
  type: 'ingreso' | 'egreso'
  amount: number
  description: string
  budget_id: string | null
  category: string
  currency: string
  bank_account_id: string
  created_at: string
  updated_at: string
}

// Interfaz para uso interno del componente
interface Transaction {
  id: string
  fecha: string
  tipo: 'ingreso' | 'egreso'
  monto: number
  descripcion: string
  categoria: string
  moneda: string
  cuentaBancariaId: string
  presupuestoId: string | null
  cuentaBancariaNombre?: string
  presupuestoNombre?: string
}

interface BankAccount {
  id: string
  nombre: string
}

interface Budget {
  id: string
  nombre: string
}

interface Debt {
  id: string
  concepto: string
  adeudado: number
  divisa: string
}

function Transacciones() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fecha: '',
    tipo: 'egreso' as 'ingreso' | 'egreso',
    monto: '',
    descripcion: '',
    categoria: '',
    moneda: 'COP',
    cuentaBancariaId: '',
    presupuestoId: '',
    isDebtPayment: false,
    debtId: ''
  })
  const [formErrors, setFormErrors] = useState({
    monto: '',
    descripcion: '',
    categoria: '',
    cuentaBancariaId: '',
    presupuestoId: '',
    debtId: ''
  })

  // Mapear transacción de API a formato interno
  const mapTransactionFromAPI = (apiTransaction: TransactionAPI, accountsMap: Map<string, string>, budgetsMap: Map<string, string>): Transaction => {
    return {
      id: apiTransaction.id,
      fecha: apiTransaction.date,
      tipo: apiTransaction.type,
      monto: apiTransaction.amount,
      descripcion: apiTransaction.description,
      categoria: apiTransaction.category,
      moneda: apiTransaction.currency,
      cuentaBancariaId: apiTransaction.bank_account_id,
      presupuestoId: apiTransaction.budget_id,
      cuentaBancariaNombre: accountsMap.get(apiTransaction.bank_account_id),
      presupuestoNombre: apiTransaction.budget_id ? budgetsMap.get(apiTransaction.budget_id) : undefined
    }
  }

  // Cargar transacciones, cuentas y presupuestos desde la API
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Cargar transacciones
        const transactionsResponse = await api.getTransactions()
        
        // Cargar cuentas bancarias
        const accountsResponse = await api.getBankAccounts()
        const accountsList: BankAccount[] = []
        if (accountsResponse.accounts && Array.isArray(accountsResponse.accounts)) {
          accountsResponse.accounts.forEach((acc: any) => {
            accountsList.push({ id: acc.id, nombre: acc.account_name })
          })
        }
        setAccounts(accountsList)
        const accountsMap = new Map(accountsList.map(acc => [acc.id, acc.nombre]))

        // Cargar presupuestos
        const budgetsResponse = await api.getBudgets()
        const budgetsList: Budget[] = []
        if (budgetsResponse.budgets && Array.isArray(budgetsResponse.budgets)) {
          budgetsResponse.budgets.forEach((bud: any) => {
            budgetsList.push({ id: bud.id, nombre: bud.name })
          })
        }
        setBudgets(budgetsList)
        const budgetsMap = new Map(budgetsList.map(bud => [bud.id, bud.nombre]))

        // Cargar deudas
        const debtsResponse = await api.getDebts()
        const debtsList: Debt[] = []
        if (debtsResponse.debts && Array.isArray(debtsResponse.debts)) {
          debtsResponse.debts.forEach((debt: any) => {
            debtsList.push({ 
              id: debt.id, 
              concepto: debt.concepto,
              adeudado: debt.adeudado,
              divisa: debt.divisa
            })
          })
        }
        setDebts(debtsList)

        // Mapear transacciones
        if (transactionsResponse.transactions && Array.isArray(transactionsResponse.transactions)) {
          const mappedTransactions = transactionsResponse.transactions.map((tx: TransactionAPI) =>
            mapTransactionFromAPI(tx, accountsMap, budgetsMap)
          )
          // Ordenar por fecha descendente (más recientes primero)
          mappedTransactions.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
          setTransactions(mappedTransactions)
        } else {
          setTransactions([])
        }
      } catch (err: any) {
        console.error('Error al cargar datos:', err)
        setError('Error al cargar las transacciones. Por favor, intenta de nuevo.')
        setTransactions([])
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleOpenModal = () => {
    setIsModalOpen(true)
    setIsEditMode(false)
    setSelectedTransaction(null)
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'egreso',
      monto: '',
      descripcion: '',
      categoria: '',
      moneda: 'COP',
      cuentaBancariaId: '',
      presupuestoId: '',
      isDebtPayment: false,
      debtId: ''
    })
    setFormErrors({
      monto: '',
      descripcion: '',
      categoria: '',
      cuentaBancariaId: '',
      presupuestoId: '',
      debtId: ''
    })
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setIsEditMode(false)
    setSelectedTransaction(null)
    setFormData({
      fecha: '',
      tipo: 'egreso',
      monto: '',
      descripcion: '',
      categoria: '',
      moneda: 'COP',
      cuentaBancariaId: '',
      presupuestoId: '',
      isDebtPayment: false,
      debtId: ''
    })
    setFormErrors({
      monto: '',
      descripcion: '',
      categoria: '',
      cuentaBancariaId: '',
      presupuestoId: '',
      debtId: ''
    })
  }

  const handleEditClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsEditMode(true)
    setIsModalOpen(true)
    setFormData({
      fecha: transaction.fecha,
      tipo: transaction.tipo,
      monto: transaction.monto.toString(),
      descripcion: transaction.descripcion,
      categoria: transaction.categoria,
      moneda: transaction.moneda,
      cuentaBancariaId: transaction.cuentaBancariaId,
      presupuestoId: transaction.presupuestoId || '',
      isDebtPayment: false,
      debtId: ''
    })
  }

  const handleDeleteClick = async (transaction: Transaction) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
      try {
        // Nota: La API no tiene DELETE, pero podemos implementarlo si existe
        // Por ahora solo mostramos un mensaje
        alert('Funcionalidad de eliminación pendiente de implementar en la API')
        // Recargar transacciones después de eliminar
        // const response = await api.getTransactions()
        // ... actualizar estado
      } catch (err: any) {
        console.error('Error al eliminar transacción:', err)
        alert('Error al eliminar la transacción. Por favor, intenta de nuevo.')
      }
    }
  }

  // Función para recargar transacciones
  const reloadTransactions = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const transactionsResponse = await api.getTransactions()
      const accountsResponse = await api.getBankAccounts()
      const budgetsResponse = await api.getBudgets()

      const accountsList: BankAccount[] = []
      if (accountsResponse.accounts && Array.isArray(accountsResponse.accounts)) {
        accountsResponse.accounts.forEach((acc: any) => {
          accountsList.push({ id: acc.id, nombre: acc.account_name })
        })
      }
      setAccounts(accountsList)
      const accountsMap = new Map(accountsList.map(acc => [acc.id, acc.nombre]))

      const budgetsList: Budget[] = []
      if (budgetsResponse.budgets && Array.isArray(budgetsResponse.budgets)) {
        budgetsResponse.budgets.forEach((bud: any) => {
          budgetsList.push({ id: bud.id, nombre: bud.name })
        })
      }
      setBudgets(budgetsList)
      const budgetsMap = new Map(budgetsList.map(bud => [bud.id, bud.nombre]))

      if (transactionsResponse.transactions && Array.isArray(transactionsResponse.transactions)) {
        const mappedTransactions = transactionsResponse.transactions.map((tx: TransactionAPI) =>
          mapTransactionFromAPI(tx, accountsMap, budgetsMap)
        )
        mappedTransactions.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        setTransactions(mappedTransactions)
      } else {
        setTransactions([])
      }
    } catch (err: any) {
      console.error('Error al cargar transacciones:', err)
      setError('Error al cargar las transacciones. Por favor, intenta de nuevo.')
      setTransactions([])
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const errors = {
      monto: '',
      descripcion: '',
      categoria: '',
      cuentaBancariaId: '',
      presupuestoId: ''
    }
    let isValid = true

    // Validar monto
    const monto = parseFloat(formData.monto)
    if (isNaN(monto) || monto <= 0) {
      errors.monto = 'El monto debe ser mayor a 0'
      isValid = false
    }

    // Validar descripción
    if (!formData.descripcion.trim()) {
      errors.descripcion = 'La descripción es requerida'
      isValid = false
    }

    // Validar categoría
    if (!formData.categoria.trim()) {
      errors.categoria = 'La categoría es requerida'
      isValid = false
    }

    // Validar cuenta bancaria
    if (!formData.cuentaBancariaId) {
      errors.cuentaBancariaId = 'Debes seleccionar una cuenta bancaria'
      isValid = false
    }

    // Validar presupuesto para egresos (solo si no es pago de deuda)
    if (formData.tipo === 'egreso' && !formData.isDebtPayment && !formData.presupuestoId) {
      errors.presupuestoId = 'Los egresos requieren un presupuesto'
      isValid = false
    }

    // Validar deuda si es pago de deuda
    if (formData.tipo === 'egreso' && formData.isDebtPayment && !formData.debtId) {
      errors.debtId = 'Debes seleccionar una deuda'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      const transactionData: any = {
        date: formData.fecha,
        type: formData.tipo,
        amount: parseFloat(formData.monto),
        description: formData.descripcion.trim(),
        category: formData.categoria.trim(),
        currency: formData.moneda,
        bank_account_id: formData.cuentaBancariaId
      }

      // Solo agregar budget_id para egresos (si no es pago de deuda)
      if (formData.tipo === 'egreso' && !formData.isDebtPayment && formData.presupuestoId) {
        transactionData.budget_id = formData.presupuestoId
      }

      if (isEditMode && selectedTransaction) {
        // Nota: La API no tiene PUT, pero podemos implementarlo si existe
        alert('Funcionalidad de edición pendiente de implementar en la API')
        handleCloseModal()
      } else {
        // Crear nueva transacción
        await api.createTransaction(transactionData)

        // Si es un pago de deuda, actualizar el monto adeudado
        if (formData.tipo === 'egreso' && formData.isDebtPayment && formData.debtId) {
          const selectedDebt = debts.find(d => d.id === formData.debtId)
          if (selectedDebt) {
            const montoPago = parseFloat(formData.monto)
            // Convertir el monto del pago a la moneda de la deuda si es necesario
            // Por ahora asumimos que están en la misma moneda
            const nuevoAdeudado = Math.max(0, selectedDebt.adeudado - montoPago)
            await api.updateDebt(formData.debtId, {
              owed: nuevoAdeudado
            })
          }
        }

        // Recargar transacciones después de crear
        await reloadTransactions()
        handleCloseModal()
      }
    } catch (err: any) {
      console.error('Error al guardar transacción:', err)
      const errorMessage = err.data?.error || 'Error al guardar la transacción. Por favor, intenta de nuevo.'
      alert(errorMessage)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      })
      // Si se desactiva el toggle de pago de deuda, limpiar la deuda seleccionada
      if (name === 'isDebtPayment' && !checked) {
        setFormData(prev => ({
          ...prev,
          isDebtPayment: false,
          debtId: ''
        }))
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
    
    // Limpiar presupuesto si cambia a ingreso
    if (name === 'tipo' && value === 'ingreso') {
      setFormData(prev => ({
        ...prev,
        tipo: 'ingreso',
        presupuestoId: '',
        isDebtPayment: false,
        debtId: ''
      }))
    }
    
    // Si se activa el toggle de pago de deuda, limpiar el presupuesto
    if (name === 'isDebtPayment' && checked) {
      setFormData(prev => ({
        ...prev,
        isDebtPayment: true,
        presupuestoId: ''
      }))
    }
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      })
    }
  }

  const formatBalance = (balance: number, currency: string = 'COP') => {
    const locale = currency === 'EUR' ? 'es-ES' : currency === 'USD' ? 'en-US' : 'es-CO'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(balance)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Calcular totales
  const calculateTotals = () => {
    const ingresos = transactions
      .filter(tx => tx.tipo === 'ingreso')
      .reduce((sum, tx) => sum + tx.monto, 0)
    const egresos = transactions
      .filter(tx => tx.tipo === 'egreso')
      .reduce((sum, tx) => sum + tx.monto, 0)
    return { ingresos, egresos, balance: ingresos - egresos }
  }

  const totals = calculateTotals()

  return (
    <>
      <div className="app-page-container">
        <div className="app-page-content transacciones-content">
          {isLoading ? (
            <div className="loader-container">
              <div className="loader">
                <div className="loader-spinner"></div>
                <p className="loader-text">Cargando transacciones...</p>
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
              {/* Resumen de transacciones */}
              <div className="transactions-summary-block">
                <div className="summary-item">
                  <span className="summary-label">Ingresos</span>
                  <span className="summary-value income">{formatBalance(totals.ingresos, 'COP')}</span>
                </div>
                <div className="summary-separator"></div>
                <div className="summary-item">
                  <span className="summary-label">Egresos</span>
                  <span className="summary-value expense">{formatBalance(totals.egresos, 'COP')}</span>
                </div>
                <div className="summary-separator"></div>
                <div className="summary-item">
                  <span className="summary-label">Balance</span>
                  <span className={`summary-value ${totals.balance >= 0 ? 'positive' : 'negative'}`}>
                    {formatBalance(totals.balance, 'COP')}
                  </span>
                </div>
              </div>

              <div className="transacciones-header">
                <button className="add-transaction-button" onClick={handleOpenModal}>
                  <AddIcon />
                  <span>Agregar Transacción</span>
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="empty-state">
                  <SwapHorizIcon className="empty-icon" />
                  <p className="empty-text">No hay transacciones registradas</p>
                  <p className="empty-subtext">Agrega tu primera transacción</p>
                </div>
              ) : (
                <div className="transactions-list">
                  {transactions.map((transaction) => {
                    const isIngreso = transaction.tipo === 'ingreso'
                    return (
                      <div 
                        key={transaction.id} 
                        className={`transaction-item ${isIngreso ? 'income' : 'expense'}`}
                      >
                        <div className="transaction-icon-wrapper">
                          <div className={`transaction-icon ${isIngreso ? 'income' : 'expense'}`}>
                            {isIngreso ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                          </div>
                        </div>
                        <div className="transaction-content">
                          <div className="transaction-header">
                            <h3 className="transaction-description">{transaction.descripcion}</h3>
                            <span className={`transaction-amount ${isIngreso ? 'income' : 'expense'}`}>
                              {isIngreso ? '+' : '-'}{formatBalance(transaction.monto, transaction.moneda)}
                            </span>
                          </div>
                          <div className="transaction-details">
                            <span className="transaction-category">{transaction.categoria}</span>
                            <span className="transaction-separator">•</span>
                            <span className="transaction-date">{formatDate(transaction.fecha)}</span>
                            {transaction.cuentaBancariaNombre && (
                              <>
                                <span className="transaction-separator">•</span>
                                <span className="transaction-account">{transaction.cuentaBancariaNombre}</span>
                              </>
                            )}
                            {transaction.presupuestoNombre && (
                              <>
                                <span className="transaction-separator">•</span>
                                <span className="transaction-budget">{transaction.presupuestoNombre}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="transaction-actions">
                          <button 
                            className="transaction-action-button edit"
                            onClick={() => handleEditClick(transaction)}
                            title="Editar"
                          >
                            <EditIcon />
                          </button>
                          <button 
                            className="transaction-action-button delete"
                            onClick={() => handleDeleteClick(transaction)}
                            title="Eliminar"
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal para agregar/editar transacción */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {isEditMode ? 'Editar Transacción' : 'Nueva Transacción'}
              </h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="tipo">Tipo</label>
                <select
                  id="tipo"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  required
                  className="form-select"
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="fecha">Fecha</label>
                <input
                  type="date"
                  id="fecha"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="descripcion">Descripción</label>
                <input
                  type="text"
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Compra de supermercado"
                  className={formErrors.descripcion ? 'input-error' : ''}
                />
                {formErrors.descripcion && (
                  <span className="error-message">{formErrors.descripcion}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="categoria">Categoría</label>
                <input
                  type="text"
                  id="categoria"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Compras, Salario, etc."
                  className={formErrors.categoria ? 'input-error' : ''}
                />
                {formErrors.categoria && (
                  <span className="error-message">{formErrors.categoria}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="monto">Monto</label>
                <input
                  type="number"
                  id="monto"
                  name="monto"
                  value={formData.monto}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className={formErrors.monto ? 'input-error' : ''}
                />
                {formErrors.monto && (
                  <span className="error-message">{formErrors.monto}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="moneda">Moneda</label>
                <select
                  id="moneda"
                  name="moneda"
                  value={formData.moneda}
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
                <label htmlFor="cuentaBancariaId">Cuenta Bancaria</label>
                <select
                  id="cuentaBancariaId"
                  name="cuentaBancariaId"
                  value={formData.cuentaBancariaId}
                  onChange={handleChange}
                  required
                  className={formErrors.cuentaBancariaId ? 'input-error form-select' : 'form-select'}
                >
                  <option value="">Selecciona una cuenta</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.nombre}
                    </option>
                  ))}
                </select>
                {formErrors.cuentaBancariaId && (
                  <span className="error-message">{formErrors.cuentaBancariaId}</span>
                )}
              </div>
              {formData.tipo === 'egreso' && (
                <>
                  {debts.length > 0 && (
                    <div className="form-group checkbox-group">
                      <label htmlFor="isDebtPayment" className="checkbox-label">
                        <input
                          type="checkbox"
                          id="isDebtPayment"
                          name="isDebtPayment"
                          checked={formData.isDebtPayment}
                          onChange={handleChange}
                        />
                        <span>Pago de Deuda</span>
                      </label>
                    </div>
                  )}
                  
                  {formData.isDebtPayment && debts.length > 0 ? (
                    <div className="form-group">
                      <label htmlFor="debtId">Deuda a pagar</label>
                      <select
                        id="debtId"
                        name="debtId"
                        value={formData.debtId}
                        onChange={handleChange}
                        required
                        className={formErrors.debtId ? 'input-error form-select' : 'form-select'}
                      >
                        <option value="">Selecciona una deuda</option>
                        {debts.map((debt) => (
                          <option key={debt.id} value={debt.id}>
                            {debt.concepto} - Adeudado: {formatBalance(debt.adeudado, debt.divisa)} ({debt.divisa})
                          </option>
                        ))}
                      </select>
                      {formErrors.debtId && (
                        <span className="error-message">{formErrors.debtId}</span>
                      )}
                    </div>
                  ) : (
                    <div className="form-group">
                      <label htmlFor="presupuestoId">Presupuesto</label>
                      <select
                        id="presupuestoId"
                        name="presupuestoId"
                        value={formData.presupuestoId}
                        onChange={handleChange}
                        required
                        className={formErrors.presupuestoId ? 'input-error form-select' : 'form-select'}
                      >
                        <option value="">Selecciona un presupuesto</option>
                        {budgets.map((budget) => (
                          <option key={budget.id} value={budget.id}>
                            {budget.nombre}
                          </option>
                        ))}
                      </select>
                      {formErrors.presupuestoId && (
                        <span className="error-message">{formErrors.presupuestoId}</span>
                      )}
                    </div>
                  )}
                </>
              )}
              <div className="modal-actions">
                <button type="button" className="modal-button cancel" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="modal-button submit">
                  {isEditMode ? 'Guardar Cambios' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default Transacciones

