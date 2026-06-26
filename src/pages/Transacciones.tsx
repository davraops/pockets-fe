import { useState, useEffect, useRef } from 'react'
import CrudSummaryStrip from '../components/crud/CrudSummaryStrip'
import { useNavigate, useLocation } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import WarningIcon from '@mui/icons-material/Warning'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { api } from '../services/api'
import { isDebugToolsEnabled } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import { emitTransactionSyncEvents } from '../utils/transactionMutation'
import FinanzasSubHeader from '../components/finanzas/FinanzasSubHeader'
import TransaccionPatrimonioFields from '../components/transacciones/TransaccionPatrimonioFields'
import TransaccionPatrimonioToggle from '../components/transacciones/TransaccionPatrimonioToggle'
import {
  EMPTY_PATRIMONY_FORM,
  EMPTY_PATRIMONY_FORM_ERRORS,
  formDataToPatrimonyPayload,
  validatePatrimonyForm,
  type PatrimonyFormData,
  type PatrimonyFormErrors,
} from '../components/patrimonio/patrimonioFormUtils'
import {
  buildPatrimonyFormFromTransaction,
  canAddTransactionToPatrimony,
  mergeCategorySuggestions,
  mergePatrimonyFromTransaction,
  shouldSuggestPatrimonio,
  type PatrimonySyncField,
} from '../utils/transactionPatrimonyUtils'
import './AppPage.css'
import './Transacciones.css'

// Interfaz que coincide con la respuesta de la API
interface TransactionAPI {
  id: string
  date: string
  type: 'ingreso' | 'egreso' | 'ahorro'
  amount: number
  description: string
  budget_id: string | null
  category: string
  currency: string
  bank_account_id: string | null
  credit_card_id: string | null
  debt_id: string | null
  debtor_id: string | null
  created_at: string
  updated_at: string
}

// Interfaz para uso interno del componente
interface Transaction {
  id: string
  fecha: string
  tipo: 'ingreso' | 'egreso' | 'ahorro'
  monto: number
  descripcion: string
  categoria: string
  moneda: string
  cuentaBancariaId: string
  presupuestoId: string | null
  cuentaBancariaNombre?: string
  presupuestoNombre?: string
  creditCardId?: string | null
  debtId?: string | null
  debtorId?: string | null
}

interface BankAccount {
  id: string
  nombre: string
  currency: string
  balance: number
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

interface CreditCard {
  id: string
  nombre: string
  banco: string
  cupoTotal: number
  cupoUsado: number
  cupoDisponible: number
}

interface Debtor {
  id: string
  nombre: string
  concepto: string
  valor: number
  totalPagado: number
}

function Transacciones() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showNotification, showError, showSuccess, showWarning } = useNotification()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [projectBudgets, setProjectBudgets] = useState<Budget[]>([])
  const [projectBudgetIds, setProjectBudgetIds] = useState<Set<string>>(new Set())
  const [debts, setDebts] = useState<Debt[]>([])
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [debtors, setDebtors] = useState<Debtor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    fecha: '',
    tipo: 'egreso' as 'ingreso' | 'egreso' | 'ahorro',
    monto: '',
    descripcion: '',
    categoria: '',
    moneda: 'COP',
    cuentaBancariaId: '',
    presupuestoId: '',
    bolsillo: '',
    isDebtPayment: false,
    debtId: '',
    isCreditCardPayment: false,
    creditCardId: '',
    isDebtorPayment: false,
    debtorId: '',
    addToPatrimonio: false,
  })
  const [patrimonyFormData, setPatrimonyFormData] =
    useState<PatrimonyFormData>(EMPTY_PATRIMONY_FORM)
  const [patrimonyFormErrors, setPatrimonyFormErrors] = useState<PatrimonyFormErrors>(
    EMPTY_PATRIMONY_FORM_ERRORS
  )
  const [patrimonyTouchedFields, setPatrimonyTouchedFields] = useState<Set<PatrimonySyncField>>(
    () => new Set()
  )
  const [patrimonyCategorySuggestions, setPatrimonyCategorySuggestions] = useState<string[]>([])
  const [formErrors, setFormErrors] = useState({
    monto: '',
    descripcion: '',
    categoria: '',
    cuentaBancariaId: '',
    presupuestoId: '',
    debtId: '',
    creditCardId: '',
    debtorId: '',
  })

  // Mapear transacción de API a formato interno
  const mapTransactionFromAPI = (
    apiTransaction: TransactionAPI,
    accountsMap: Map<string, string>,
    budgetsMap: Map<string, string>
  ): Transaction => {
    return {
      id: apiTransaction.id,
      fecha: apiTransaction.date,
      tipo: apiTransaction.type,
      monto: apiTransaction.amount,
      descripcion: apiTransaction.description,
      categoria: apiTransaction.category,
      moneda: apiTransaction.currency,
      cuentaBancariaId: apiTransaction.bank_account_id || '',
      presupuestoId: apiTransaction.budget_id,
      creditCardId: apiTransaction.credit_card_id,
      debtId: apiTransaction.debt_id,
      debtorId: apiTransaction.debtor_id,
      cuentaBancariaNombre: apiTransaction.bank_account_id
        ? accountsMap.get(apiTransaction.bank_account_id)
        : undefined,
      presupuestoNombre: apiTransaction.budget_id
        ? budgetsMap.get(apiTransaction.budget_id)
        : undefined,
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
            accountsList.push({
              id: acc.id,
              nombre: acc.account_name,
              currency: acc.currency || 'COP',
              balance: parseFloat(acc.balance?.original?.amount || acc.balance?.amount || acc.balance?.cop?.amount || '0'),
            })
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

        // Cargar proyectos para identificar presupuestos asociados
        try {
          const projectsResponse = await api.getProjects()
          const budgetIds = new Set<string>()
          const projectBudgetsList: Budget[] = []

          if (projectsResponse.projects && Array.isArray(projectsResponse.projects)) {
            projectsResponse.projects.forEach((project: any) => {
              if (project.budget_id) {
                budgetIds.add(project.budget_id)
                // Encontrar el presupuesto correspondiente
                const budget = budgetsList.find(b => b.id === project.budget_id)
                if (budget && !projectBudgetsList.find(b => b.id === budget.id)) {
                  projectBudgetsList.push(budget)
                }
              }
            })
          }
          setProjectBudgetIds(budgetIds)
          setProjectBudgets(projectBudgetsList)
        } catch (err: any) {
          console.error('Error al cargar proyectos:', err)
          // Continuar sin la información de proyectos
        }

        // Cargar deudas
        const debtsResponse = await api.getDebts()
        const debtsList: Debt[] = []
        if (debtsResponse.debts && Array.isArray(debtsResponse.debts)) {
          debtsResponse.debts.forEach((debt: any) => {
            debtsList.push({
              id: debt.id,
              concepto: debt.concept || debt.concepto,
              adeudado: debt.owed || debt.adeudado,
              divisa: debt.currency || debt.divisa,
            })
          })
        }
        setDebts(debtsList)

        // Cargar tarjetas de crédito
        const creditCardsResponse = await api.getCreditCards()
        const creditCardsList: CreditCard[] = []
        if (creditCardsResponse.credit_cards && Array.isArray(creditCardsResponse.credit_cards)) {
          creditCardsResponse.credit_cards.forEach((card: any) => {
            const cupoTotal = card.credit_limit || 0
            const cupoUsado = card.used_credit || 0
            creditCardsList.push({
              id: card.id,
              nombre: card.name,
              banco: card.bank,
              cupoTotal,
              cupoUsado,
              cupoDisponible: cupoTotal - cupoUsado,
            })
          })
        }
        setCreditCards(creditCardsList)

        // Cargar deudores
        const debtorsResponse = await api.getDebtors()
        const debtorsList: Debtor[] = []
        if (debtorsResponse.debtors && Array.isArray(debtorsResponse.debtors)) {
          debtorsResponse.debtors.forEach((debtor: any) => {
            debtorsList.push({
              id: debtor.id,
              nombre: debtor.debtor_name,
              concepto: debtor.concept,
              valor: debtor.value,
              totalPagado: debtor.total_paid,
            })
          })
        }
        setDebtors(debtorsList)

        // Mapear transacciones
        if (transactionsResponse.transactions && Array.isArray(transactionsResponse.transactions)) {
          const mappedTransactions = transactionsResponse.transactions.map((tx: TransactionAPI) =>
            mapTransactionFromAPI(tx, accountsMap, budgetsMap)
          )
          // Ordenar por fecha descendente (más recientes primero)
          mappedTransactions.sort(
            (a: Transaction, b: Transaction) =>
              new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
          )
          setTransactions(mappedTransactions)
        } else {
          setTransactions([])
        }
      } catch (err: any) {
        console.error('Error al cargar datos:', err)
        const errorMessage = getTranslatedErrorMessage(err, 'Error al cargar las transacciones. Por favor, intenta de nuevo.')
        setError(errorMessage)
        setTransactions([])
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Cerrar menú al hacer clic fuera - HIG: Clear Feedback
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(target)) {
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
      bolsillo: '',
      isDebtPayment: false,
      debtId: '',
      isCreditCardPayment: false,
      creditCardId: '',
      isDebtorPayment: false,
      debtorId: '',
      addToPatrimonio: false,
    })
    setPatrimonyFormData(EMPTY_PATRIMONY_FORM)
    setPatrimonyFormErrors(EMPTY_PATRIMONY_FORM_ERRORS)
    setPatrimonyTouchedFields(new Set())
    setFormErrors({
      monto: '',
      descripcion: '',
      categoria: '',
      cuentaBancariaId: '',
      presupuestoId: '',
      debtId: '',
      creditCardId: '',
      debtorId: '',
    })
  }

  // Abrir modal automáticamente si se navega desde Finanzas con el flag
  useEffect(() => {
    if (location.state?.openModal === true) {
      handleOpenModal()
      // Limpiar el estado para evitar que se abra en navegaciones posteriores
      navigate(location.pathname, { replace: true, state: {} })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

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
      bolsillo: '',
      isDebtPayment: false,
      debtId: '',
      isCreditCardPayment: false,
      creditCardId: '',
      isDebtorPayment: false,
      debtorId: '',
      addToPatrimonio: false,
    })
    setPatrimonyFormData(EMPTY_PATRIMONY_FORM)
    setPatrimonyFormErrors(EMPTY_PATRIMONY_FORM_ERRORS)
    setPatrimonyTouchedFields(new Set())
    setFormErrors({
      monto: '',
      descripcion: '',
      categoria: '',
      cuentaBancariaId: '',
      presupuestoId: '',
      debtId: '',
      creditCardId: '',
      debtorId: '',
    })
  }

  const handleOpenDetailModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedTransaction(null)
    setIsEditMode(false)
  }

  const handleEditClick = () => {
    if (!selectedTransaction) return
    setIsDetailModalOpen(false)
    setIsEditMode(true)
    setIsModalOpen(true)
    setFormData({
      fecha: selectedTransaction.fecha,
      tipo: selectedTransaction.tipo,
      monto: selectedTransaction.monto.toString(),
      descripcion: selectedTransaction.descripcion,
      categoria: selectedTransaction.categoria,
      moneda: selectedTransaction.moneda,
      cuentaBancariaId: selectedTransaction.cuentaBancariaId || '',
      presupuestoId: selectedTransaction.presupuestoId || '',
      bolsillo: '',
      isDebtPayment: Boolean(selectedTransaction.debtId),
      debtId: selectedTransaction.debtId || '',
      isCreditCardPayment: Boolean(selectedTransaction.creditCardId),
      creditCardId: selectedTransaction.creditCardId || '',
      isDebtorPayment: Boolean(selectedTransaction.debtorId),
      debtorId: selectedTransaction.debtorId || '',
      addToPatrimonio: false,
    })
    setPatrimonyFormData(EMPTY_PATRIMONY_FORM)
    setPatrimonyFormErrors(EMPTY_PATRIMONY_FORM_ERRORS)
    setPatrimonyTouchedFields(new Set())
  }

  const handleDeleteClick = async () => {
    if (!selectedTransaction) return

    if (!window.confirm('¿Estás seguro de que quieres eliminar esta transacción?')) return

    try {
      setIsLoading(true)
      await api.deleteTransaction(selectedTransaction.id)
      await reloadTransactions()
      emitTransactionSyncEvents()
      handleCloseDetailModal()
      showSuccess('Transacción eliminada exitosamente')
    } catch (err: any) {
      console.error('Error al eliminar transacción:', err)
      showNotification(
        getTranslatedErrorMessage(err, 'Error al eliminar la transacción. Por favor, intenta de nuevo.'),
        'error'
      )
    } finally {
      setIsLoading(false)
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
      const debtsResponse = await api.getDebts()
      const creditCardsResponse = await api.getCreditCards()

      const accountsList: BankAccount[] = []
      if (accountsResponse.accounts && Array.isArray(accountsResponse.accounts)) {
        accountsResponse.accounts.forEach((acc: any) => {
          accountsList.push({
            id: acc.id,
            nombre: acc.account_name,
            currency: acc.currency || 'COP',
            balance: parseFloat(acc.balance?.original?.amount || acc.balance?.amount || 0),
          })
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

      // Recargar deudas
      const debtsList: Debt[] = []
      if (debtsResponse.debts && Array.isArray(debtsResponse.debts)) {
        debtsResponse.debts.forEach((debt: any) => {
          debtsList.push({
            id: debt.id,
            concepto: debt.concept || debt.concepto,
            adeudado: debt.owed || debt.adeudado,
            divisa: debt.currency || debt.divisa,
          })
        })
      }
      setDebts(debtsList)

      // Recargar tarjetas de crédito
      const creditCardsList: CreditCard[] = []
      if (creditCardsResponse.credit_cards && Array.isArray(creditCardsResponse.credit_cards)) {
        creditCardsResponse.credit_cards.forEach((card: any) => {
          const cupoTotal = card.credit_limit || 0
          const cupoUsado = card.used_credit || 0
          creditCardsList.push({
            id: card.id,
            nombre: card.name,
            banco: card.bank,
            cupoTotal,
            cupoUsado,
            cupoDisponible: cupoTotal - cupoUsado,
          })
        })
      }
      setCreditCards(creditCardsList)

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
    const errors: any = {
      monto: '',
      descripcion: '',
      categoria: '',
      cuentaBancariaId: '',
      presupuestoId: '',
      debtId: '',
      creditCardId: '',
    }
    let isValid = true

    // Validar monto
    const monto = parseFloat(formData.monto)
    if (isNaN(monto) || monto <= 0) {
      errors.monto = 'El monto debe ser mayor a 0'
      isValid = false
    }

    // Validar descripción (solo si no es ahorro y no es pago de deudor)
    if (
      formData.tipo !== 'ahorro' &&
      !(formData.tipo === 'ingreso' && formData.isDebtorPayment) &&
      !formData.descripcion.trim()
    ) {
      errors.descripcion = 'La descripción es requerida'
      isValid = false
    }

    // Validar categoría (solo si no es ahorro y no es pago de deudor)
    if (
      formData.tipo !== 'ahorro' &&
      !(formData.tipo === 'ingreso' && formData.isDebtorPayment) &&
      !formData.categoria.trim()
    ) {
      errors.categoria = 'La categoría es requerida'
      isValid = false
    }

    // Validar cuenta bancaria (solo si no es pago con tarjeta de crédito o si es ahorro)
    if (
      (!formData.isCreditCardPayment || formData.tipo === 'ahorro') &&
      !formData.cuentaBancariaId
    ) {
      errors.cuentaBancariaId = 'Debes seleccionar una cuenta bancaria'
      isValid = false
    }

    // El presupuesto ya no es obligatorio para egresos (el backend ahora lo permite)

    // Validar presupuesto si es ahorro (debe estar asociado a un proyecto)
    if (formData.tipo === 'ahorro') {
      if (!formData.presupuestoId || formData.presupuestoId.trim() === '') {
        errors.presupuestoId = 'Debes seleccionar un presupuesto asociado a un proyecto'
        isValid = false
      } else if (!projectBudgetIds.has(formData.presupuestoId)) {
        errors.presupuestoId = 'El presupuesto seleccionado debe estar asociado a un proyecto'
        isValid = false
      }
    }

    // Validar cuenta bancaria para ahorros (siempre requerida)
    if (formData.tipo === 'ahorro' && !formData.cuentaBancariaId) {
      errors.cuentaBancariaId = 'Debes seleccionar una cuenta bancaria'
      isValid = false
    }

    // Validar deuda si es pago de deuda
    if (
      formData.tipo === 'egreso' &&
      (formData as any).isDebtPayment &&
      !(formData as any).debtId
    ) {
      errors.debtId = 'Debes seleccionar una deuda'
      isValid = false
    }

    // Validar tarjeta de crédito si es pago con tarjeta
    if (
      formData.tipo === 'egreso' &&
      (formData as any).isCreditCardPayment &&
      !(formData as any).creditCardId
    ) {
      errors.creditCardId = 'Debes seleccionar una tarjeta de crédito'
      isValid = false
    }

    // Validar deudor si es pago de deudor
    if (
      formData.tipo === 'ingreso' &&
      (formData as any).isDebtorPayment &&
      !(formData as any).debtorId
    ) {
      errors.debtorId = 'Debes seleccionar un deudor'
      isValid = false
    }

    // Validar cupo disponible si es pago con tarjeta de crédito
    if (
      formData.tipo === 'egreso' &&
      (formData as any).isCreditCardPayment &&
      (formData as any).creditCardId
    ) {
      const selectedCard = creditCards.find(c => c.id === (formData as any).creditCardId)
      if (selectedCard) {
        const monto = parseFloat(formData.monto)
        if (monto > selectedCard.cupoDisponible) {
          errors.creditCardId = `Cupo insuficiente. Disponible: ${formatBalance(selectedCard.cupoDisponible, formData.moneda)}`
          isValid = false
        }
      }
    }

    setFormErrors(errors as any)
    return isValid
  }

  const validatePatrimonySection = (): boolean => {
    if (!formData.addToPatrimonio) {
      setPatrimonyFormErrors(EMPTY_PATRIMONY_FORM_ERRORS)
      return true
    }

    const { isValid, errors } = validatePatrimonyForm(patrimonyFormData)
    setPatrimonyFormErrors(errors)
    return isValid
  }

  const handlePatrimonyFieldTouch = (field: PatrimonySyncField) => {
    setPatrimonyTouchedFields(prev => {
      if (prev.has(field)) {
        return prev
      }
      const next = new Set(prev)
      next.add(field)
      return next
    })
  }

  const handlePatrimonioToggle = (checked: boolean) => {
    if (checked) {
      setFormData(prev => ({ ...prev, addToPatrimonio: true }))
      setPatrimonyTouchedFields(new Set())
      setPatrimonyFormData(
        buildPatrimonyFormFromTransaction({
          descripcion: formData.descripcion,
          categoria: formData.categoria,
          monto: formData.monto,
          fecha: formData.fecha,
          moneda: formData.moneda,
        })
      )
      setPatrimonyFormErrors(EMPTY_PATRIMONY_FORM_ERRORS)
      return
    }

    setFormData(prev => ({ ...prev, addToPatrimonio: false }))
    setPatrimonyFormData(EMPTY_PATRIMONY_FORM)
    setPatrimonyFormErrors(EMPTY_PATRIMONY_FORM_ERRORS)
    setPatrimonyTouchedFields(new Set())
  }

  useEffect(() => {
    if (!formData.addToPatrimonio) {
      return
    }

    setPatrimonyFormData(prev =>
      mergePatrimonyFromTransaction(
        prev,
        {
          descripcion: formData.descripcion,
          categoria: formData.categoria,
          monto: formData.monto,
          fecha: formData.fecha,
          moneda: formData.moneda,
        },
        patrimonyTouchedFields
      )
    )
  }, [
    formData.addToPatrimonio,
    formData.descripcion,
    formData.categoria,
    formData.monto,
    formData.fecha,
    formData.moneda,
    patrimonyTouchedFields,
  ])

  useEffect(() => {
    if (!formData.addToPatrimonio) {
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const response = await api.getPatrimony()
        if (cancelled) {
          return
        }

        const existingCategories =
          response.items && Array.isArray(response.items)
            ? response.items
                .map((item: { data?: { category?: string } }) => item.data?.category?.trim())
                .filter((category: string | undefined): category is string => Boolean(category))
            : []

        setPatrimonyCategorySuggestions(mergeCategorySuggestions(existingCategories))
      } catch {
        if (!cancelled) {
          setPatrimonyCategorySuggestions(mergeCategorySuggestions([]))
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [formData.addToPatrimonio])

  const handlePatrimonyChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setPatrimonyFormData(prev => ({ ...prev, [name]: value }))
    if (patrimonyFormErrors[name as keyof PatrimonyFormErrors]) {
      setPatrimonyFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !validatePatrimonySection()) {
      return
    }

    try {
      setIsSubmitting(true)
      setIsLoading(true)

      const monto = parseFloat(formData.monto)

      const transactionData: any = {
        date: formData.fecha,
        type: formData.tipo,
        amount: monto,
        currency: formData.moneda,
      }

      // Solo agregar descripción y categoría si no es ahorro
      if (formData.tipo !== 'ahorro') {
        // Si es ingreso con pago de deudor, generar descripción y categoría automáticamente
        if (formData.tipo === 'ingreso' && formData.isDebtorPayment && formData.debtorId) {
          const selectedDebtor = debtors.find(d => d.id === formData.debtorId)
          if (selectedDebtor) {
            transactionData.description = `Pago de ${selectedDebtor.nombre} - ${selectedDebtor.concepto}`
            transactionData.category = 'retorno deuda'
          } else {
            transactionData.description = 'Pago de deudor'
            transactionData.category = 'retorno deuda'
          }
        } else {
          transactionData.description = formData.descripcion.trim()
          transactionData.category = formData.categoria.trim()
        }
      } else {
        // Para ahorros, usar valores por defecto según lo que requiera el backend
        transactionData.description = 'Ahorro para proyecto'
        transactionData.category = 'Ahorro'
      }

      // Agregar bank_account_id según el tipo de transacción
      if (formData.tipo === 'ahorro') {
        // Para ahorros siempre se requiere cuenta bancaria
        transactionData.bank_account_id = formData.cuentaBancariaId
      } else if (formData.tipo === 'egreso' && formData.isCreditCardPayment) {
        // Para egresos con tarjeta de crédito, bank_account_id debe ser null (el dinero no sale de la cuenta bancaria)
        transactionData.bank_account_id = null
      } else if (formData.tipo === 'egreso' && !formData.isCreditCardPayment) {
        // Para egresos sin tarjeta de crédito se requiere cuenta bancaria
        transactionData.bank_account_id = formData.cuentaBancariaId
      } else if (formData.tipo === 'ingreso') {
        // Para ingresos siempre se requiere cuenta bancaria
        transactionData.bank_account_id = formData.cuentaBancariaId
      }

      // Manejar budget_id según el tipo de transacción
      if (formData.tipo === 'egreso') {
        // Para egresos, el presupuesto es opcional
        if (formData.presupuestoId && formData.presupuestoId.trim() !== '') {
          transactionData.budget_id = formData.presupuestoId
        } else {
          transactionData.budget_id = null
        }
      } else if (formData.tipo === 'ahorro') {
        // Para ahorros, el presupuesto es obligatorio y debe estar asociado a un proyecto
        transactionData.budget_id = formData.presupuestoId
      }
      // Los ingresos no deben tener budget_id

      // Agregar credit_card_id si es un pago con tarjeta de crédito
      if (formData.tipo === 'egreso' && formData.isCreditCardPayment && formData.creditCardId) {
        transactionData.credit_card_id = formData.creditCardId
      }

      // Agregar debt_id si es un pago de deuda
      if (formData.tipo === 'egreso' && formData.isDebtPayment && formData.debtId) {
        transactionData.debt_id = formData.debtId
      } else {
        transactionData.debt_id = null
      }

      // Agregar debtor_id si es un ingreso de pago de deudor
      if (formData.tipo === 'ingreso' && formData.isDebtorPayment && formData.debtorId) {
        transactionData.debtor_id = formData.debtorId
      } else {
        transactionData.debtor_id = null
      }

      const successMessage =
        isEditMode && selectedTransaction
          ? 'Transacción actualizada exitosamente'
          : 'Transacción creada exitosamente'

      if (isEditMode && selectedTransaction) {
        await api.updateTransaction(selectedTransaction.id, transactionData)
      } else {
        await api.createTransaction(transactionData)
      }

      let patrimonyCreated = false
      let patrimonyError: string | null = null
      if (
        !isEditMode &&
        formData.addToPatrimonio &&
        canAddTransactionToPatrimony(formData.tipo, formData.isDebtPayment, isEditMode)
      ) {
        try {
          await api.createPatrimonyItem(formDataToPatrimonyPayload(patrimonyFormData))
          patrimonyCreated = true
        } catch (patrimonyErr: unknown) {
          patrimonyError = getTranslatedErrorMessage(
            patrimonyErr,
            'No se pudo registrar el ítem en Patrimonio.'
          )
        }
      }

      setIsModalOpen(false)
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
        bolsillo: '',
        isDebtPayment: false,
        debtId: '',
        isCreditCardPayment: false,
        creditCardId: '',
        isDebtorPayment: false,
        debtorId: '',
        addToPatrimonio: false,
      })
      setPatrimonyFormData(EMPTY_PATRIMONY_FORM)
      setPatrimonyFormErrors(EMPTY_PATRIMONY_FORM_ERRORS)
      setPatrimonyTouchedFields(new Set())
      setFormErrors({
        monto: '',
        descripcion: '',
        categoria: '',
        cuentaBancariaId: '',
        presupuestoId: '',
        debtId: '',
        creditCardId: '',
        debtorId: '',
      })

      await reloadTransactions()
      emitTransactionSyncEvents()
      if (patrimonyError) {
        showNotification(
          `Transacción guardada, pero no se pudo agregar a Patrimonio: ${patrimonyError}`,
          'warning'
        )
      } else if (patrimonyCreated) {
        showSuccess('Transacción creada y agregada a Patrimonio')
      } else {
        showSuccess(successMessage)
      }
    } catch (err: any) {
      console.error('Error al guardar transacción:', err)
      showError(
        getTranslatedErrorMessage(err, 'Error al guardar la transacción. Por favor, intenta de nuevo.')
      )
    } finally {
      setIsLoading(false)
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked,
      })
      // Si se desactiva el toggle de pago de deuda, limpiar la deuda seleccionada
      if (name === 'isDebtPayment' && !checked) {
        setFormData((prev: any) => ({
          ...prev,
          isDebtPayment: false,
          debtId: '',
        }))
      }
    } else {
      setFormData((prev: any) => ({
        ...prev,
        [name]: value,
      }))

      // Si cambia la divisa, limpiar la cuenta seleccionada si no coincide con la nueva divisa
      if (name === 'moneda') {
        setFormData((prevForm: any) => {
          const selectedAccount = accounts.find(acc => acc.id === prevForm.cuentaBancariaId)
          if (selectedAccount && selectedAccount.currency !== value) {
            return {
              ...prevForm,
              moneda: value,
              cuentaBancariaId: '',
            }
          }
          return {
            ...prevForm,
            moneda: value,
          }
        })
        return
      }
    }

    // Limpiar campos según el tipo de transacción
    if (name === 'tipo') {
      if (value === 'ingreso') {
        setFormData(prev => ({
          ...prev,
          tipo: 'ingreso',
          presupuestoId: '',
          bolsillo: '',
          isDebtPayment: false,
          debtId: '',
          isCreditCardPayment: false,
          creditCardId: '',
          addToPatrimonio: false,
        }))
        setPatrimonyFormData(EMPTY_PATRIMONY_FORM)
        setPatrimonyFormErrors(EMPTY_PATRIMONY_FORM_ERRORS)
        setPatrimonyTouchedFields(new Set())
        return
      } else if (value === 'ahorro') {
        setFormData(prev => ({
          ...prev,
          tipo: 'ahorro',
          presupuestoId: '',
          bolsillo: '',
          isDebtPayment: false,
          debtId: '',
          isCreditCardPayment: false,
          creditCardId: '',
          addToPatrimonio: false,
        }))
        setPatrimonyFormData(EMPTY_PATRIMONY_FORM)
        setPatrimonyFormErrors(EMPTY_PATRIMONY_FORM_ERRORS)
        setPatrimonyTouchedFields(new Set())
        return
      } else if (value === 'egreso') {
        setFormData(prev => ({
          ...prev,
          tipo: 'egreso',
          bolsillo: '',
        }))
        return
      }
    }

    // Si se activa el toggle de pago de deuda, limpiar el presupuesto y tarjeta de crédito
    if (name === 'isDebtPayment' && checked) {
      setFormData(prev => ({
        ...prev,
        isDebtPayment: true,
        presupuestoId: '',
        isCreditCardPayment: false,
        creditCardId: '',
        addToPatrimonio: false,
      }))
      setPatrimonyFormData(EMPTY_PATRIMONY_FORM)
      setPatrimonyFormErrors(EMPTY_PATRIMONY_FORM_ERRORS)
      setPatrimonyTouchedFields(new Set())
    }

    // Si se activa el toggle de pago con tarjeta de crédito, limpiar el presupuesto y pago de deuda
    if (name === 'isCreditCardPayment' && checked) {
      setFormData(prev => ({
        ...prev,
        isCreditCardPayment: true,
        presupuestoId: '',
        isDebtPayment: false,
        debtId: '',
      }))
    }

    // Si se desactiva el toggle de pago con tarjeta de crédito, limpiar la tarjeta seleccionada
    if (name === 'isCreditCardPayment' && !checked) {
      setFormData(prev => ({
        ...prev,
        isCreditCardPayment: false,
        creditCardId: '',
      }))
    }

    // Si se desactiva el toggle de pago de deudor, limpiar el deudor seleccionado
    if (name === 'isDebtorPayment' && !checked) {
      setFormData(prev => ({
        ...prev,
        isDebtorPayment: false,
        debtorId: '',
      }))
    }

    // Limpiar errores cuando el usuario empiece a escribir
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      })
    }
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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
    const ahorros = transactions
      .filter(tx => tx.tipo === 'ahorro')
      .reduce((sum, tx) => sum + tx.monto, 0)
    return { ingresos, egresos, ahorros, balance: ingresos - egresos - ahorros }
  }

  const totals = calculateTotals()

  // Funciones de debug
  const handleDeleteAllTransactions = async () => {
    if (
      window.confirm(
        '⚠️ ¿Estás seguro de que quieres eliminar TODAS las transacciones? Esta acción es IRREVERSIBLE.'
      )
    ) {
      try {
        setIsLoading(true)
        await api.deleteAllTransactions()
        await reloadTransactions()
        emitTransactionSyncEvents()
        setIsDebugModalOpen(false)
        showNotification('Todas las transacciones han sido eliminadas exitosamente.', 'success')
      } catch (err: any) {
        console.error('Error al eliminar todas las transacciones:', err)
        const errorMessage = getTranslatedErrorMessage(err, 'Error al eliminar todas las transacciones. Por favor, intenta de nuevo.')
        showNotification(errorMessage, 'error')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleCreateDemoIncomes = async () => {
    if (accounts.length === 0) {
      showNotification('No hay cuentas bancarias disponibles. Crea al menos una cuenta primero.', 'warning')
      return
    }

    const demoIncomes = [
      {
        description: 'Salario mensual',
        category: 'Salario',
        amount: 3000000,
        date: new Date().toISOString().split('T')[0],
      },
      {
        description: 'Freelance proyecto',
        category: 'Trabajo',
        amount: 500000,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        description: 'Venta de artículo',
        category: 'Ventas',
        amount: 200000,
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        description: 'Bonificación',
        category: 'Bonos',
        amount: 300000,
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        description: 'Reembolso',
        category: 'Reembolsos',
        amount: 150000,
        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ]

    try {
      setIsLoading(true)
      const accountId = accounts[0].id

      for (const income of demoIncomes) {
        await api.createTransaction({
          date: income.date,
          type: 'ingreso',
          amount: income.amount,
          description: income.description,
          category: income.category,
          currency: 'COP',
          bank_account_id: accountId,
        })
      }

      await reloadTransactions()
      emitTransactionSyncEvents()
      setIsDebugModalOpen(false)
      showNotification(`${demoIncomes.length} ingresos demo creados exitosamente.`, 'success')
    } catch (err: any) {
      console.error('Error al crear ingresos demo:', err)
      const errorMessage = getTranslatedErrorMessage(err, 'Error al crear los ingresos demo. Por favor, intenta de nuevo.')
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateDemoExpenses = async () => {
    if (accounts.length === 0) {
      showNotification('No hay cuentas bancarias disponibles. Crea al menos una cuenta primero.', 'warning')
      return
    }

    const demoExpenses = [
      {
        description: 'Supermercado',
        category: 'Compras',
        amount: 250000,
        date: new Date().toISOString().split('T')[0],
      },
      {
        description: 'Gasolina',
        category: 'Transporte',
        amount: 80000,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        description: 'Restaurante',
        category: 'Comida',
        amount: 120000,
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        description: 'Servicios públicos',
        category: 'Servicios',
        amount: 150000,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        description: 'Farmacia',
        category: 'Salud',
        amount: 60000,
        date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ]

    try {
      setIsLoading(true)
      const accountId = accounts[0].id

      for (const expense of demoExpenses) {
        await api.createTransaction({
          date: expense.date,
          type: 'egreso',
          amount: expense.amount,
          description: expense.description,
          category: expense.category,
          currency: 'COP',
          bank_account_id: accountId,
        })
      }

      await reloadTransactions()
      emitTransactionSyncEvents()
      setIsDebugModalOpen(false)
      showNotification(`${demoExpenses.length} egresos demo creados exitosamente.`, 'success')
    } catch (err: any) {
      console.error('Error al crear egresos demo:', err)
      const errorMessage = getTranslatedErrorMessage(err, 'Error al crear los egresos demo. Por favor, intenta de nuevo.')
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateDemoCreditCardPayments = async () => {
    if (accounts.length === 0) {
      showNotification('No hay cuentas bancarias disponibles. Crea al menos una cuenta primero.', 'warning')
      return
    }
    if (creditCards.length === 0) {
      showNotification('No hay tarjetas de crédito disponibles. Crea al menos una tarjeta primero.', 'warning')
      return
    }

    const demoPayments = [
      {
        description: 'Compra con tarjeta - Tienda',
        category: 'Compras',
        amount: 150000,
        date: new Date().toISOString().split('T')[0],
      },
      {
        description: 'Compra con tarjeta - Online',
        category: 'Compras',
        amount: 200000,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        description: 'Compra con tarjeta - Emergencia',
        category: 'Emergencias',
        amount: 300000,
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ]

    try {
      setIsLoading(true)
      const card = creditCards[0]

      for (const payment of demoPayments) {
        await api.createTransaction({
          date: payment.date,
          type: 'egreso',
          amount: payment.amount,
          description: payment.description,
          category: payment.category,
          currency: 'COP',
          bank_account_id: null,
          credit_card_id: card.id,
        })
      }

      await reloadTransactions()
      emitTransactionSyncEvents()
      setIsDebugModalOpen(false)
      showNotification(
        `${demoPayments.length} egresos con pago de tarjeta demo creados exitosamente.`,
        'success'
      )
    } catch (err: any) {
      console.error('Error al crear egresos con tarjeta demo:', err)
      const errorMessage = getTranslatedErrorMessage(err, 'Error al crear los egresos con tarjeta demo. Por favor, intenta de nuevo.')
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateDemoDebtPayments = async () => {
    if (accounts.length === 0) {
      showNotification('No hay cuentas bancarias disponibles. Crea al menos una cuenta primero.', 'warning')
      return
    }
    if (debts.length === 0) {
      showNotification('No hay deudas disponibles. Crea al menos una deuda primero.', 'warning')
      return
    }

    const demoPayments = [
      {
        description: 'Pago de deuda',
        category: 'Pago de Deuda',
        amount: 200000,
        date: new Date().toISOString().split('T')[0],
      },
      {
        description: 'Pago parcial de deuda',
        category: 'Pago de Deuda',
        amount: 150000,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ]

    try {
      setIsLoading(true)
      const accountId = accounts[0].id
      const debt = debts[0]

      for (const payment of demoPayments) {
        await api.createTransaction({
          date: payment.date,
          type: 'egreso',
          amount: payment.amount,
          description: payment.description,
          category: payment.category,
          currency: 'COP',
          bank_account_id: accountId,
          debt_id: debt.id,
        })
      }

      await reloadTransactions()
      emitTransactionSyncEvents()
      setIsDebugModalOpen(false)
      showNotification(
        `${demoPayments.length} egresos con pago de deuda demo creados exitosamente.`,
        'success'
      )
    } catch (err: any) {
      console.error('Error al crear egresos con deuda demo:', err)
      const errorMessage = getTranslatedErrorMessage(err, 'Error al crear los egresos con deuda demo. Por favor, intenta de nuevo.')
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateDemoSavings = async () => {
    if (accounts.length === 0) {
      showNotification('No hay cuentas bancarias disponibles. Crea al menos una cuenta primero.', 'warning')
      return
    }
    if (projectBudgets.length === 0) {
      showNotification('No hay presupuestos asociados a proyectos. Crea al menos un proyecto primero.', 'warning')
      return
    }

    const demoSavings = [
      { amount: 500000, date: new Date().toISOString().split('T')[0] },
      {
        amount: 300000,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        amount: 400000,
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ]

    try {
      setIsLoading(true)
      const accountId = accounts[0].id
      const budgetId = projectBudgets[0].id

      for (const saving of demoSavings) {
        await api.createTransaction({
          date: saving.date,
          type: 'ahorro',
          amount: saving.amount,
          description: 'Ahorro para proyecto',
          category: 'Ahorro',
          currency: 'COP',
          bank_account_id: accountId,
          budget_id: budgetId,
        })
      }

      await reloadTransactions()
      emitTransactionSyncEvents()
      setIsDebugModalOpen(false)
      showNotification(`${demoSavings.length} ahorros demo creados exitosamente.`, 'success')
    } catch (err: any) {
      console.error('Error al crear ahorros demo:', err)
      const errorMessage = getTranslatedErrorMessage(err, 'Error al crear los ahorros demo. Por favor, intenta de nuevo.')
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="app-page-container">
        <div className="app-page-content app-page-content-wide transacciones-content finanzas-sub-content">
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
                <p className="loader-text" style={{ color: 'rgba(255, 59, 48, 0.9)' }}>
                  {error}
                </p>
              </div>
            </div>
          ) : (
            <>
              <FinanzasSubHeader
                title="Transacciones"
                context="Movimientos"
                meta={`${transactions.length} registrada${transactions.length !== 1 ? 's' : ''}`}
                toolbarActions={
                  isDebugToolsEnabled() ? (
                    <div className="finanzas-sub-menu-container" ref={menuRef}>
                      <button
                        type="button"
                        className="app-toolbar-button"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Opciones de depuración"
                        aria-expanded={isMenuOpen}
                      >
                        <MoreVertIcon className="app-toolbar-icon" />
                      </button>
                      {isMenuOpen && (
                        <div className="finanzas-sub-menu">
                          <button
                            type="button"
                            className="finanzas-sub-menu-item"
                            onClick={() => {
                              setIsMenuOpen(false)
                              setIsDebugModalOpen(true)
                            }}
                          >
                            🐛 Debug
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null
                }
              />

              <CrudSummaryStrip
                ariaLabel="Resumen de transacciones"
                items={[
                  {
                    label: 'Ingresos',
                    value: formatBalance(totals.ingresos, 'COP'),
                    tone: 'income',
                  },
                  {
                    label: 'Egresos',
                    value: formatBalance(totals.egresos, 'COP'),
                    tone: 'expense',
                  },
                  {
                    label: 'Balance',
                    value: formatBalance(totals.balance, 'COP'),
                    tone: totals.balance >= 0 ? 'positive' : 'negative',
                  },
                  {
                    label: 'Ahorro',
                    value: formatBalance(totals.ahorros, 'COP'),
                    tone: 'savings',
                  },
                ]}
              />

              <button
                type="button"
                className="btn-base btn-accent btn-block btn-submit crud-primary-cta"
                onClick={handleOpenModal}
                aria-label="Agregar transacción"
              >
                <AddIcon aria-hidden="true" />
                Agregar transacción
              </button>

              {transactions.length === 0 ? (
                <div className="empty-state">
                  <SwapHorizIcon className="empty-icon" />
                  <p className="empty-text">No hay transacciones registradas</p>
                  <p className="empty-subtext">Usa el botón de arriba para registrar la primera</p>
                </div>
              ) : (
                <div className="glass-group">
                  {transactions.map(transaction => {
                    const isIngreso = transaction.tipo === 'ingreso'
                    const isAhorro = transaction.tipo === 'ahorro'
                    const accentClass = isIngreso
                      ? 'crud-row-accent-income'
                      : isAhorro
                        ? 'crud-row-accent-savings'
                        : 'crud-row-accent-expense'
                    const valueClass = isIngreso
                      ? 'crud-row-value--income'
                      : isAhorro
                        ? 'crud-row-value--savings'
                        : 'crud-row-value--expense'
                    const metaParts = [
                      transaction.categoria,
                      formatDate(transaction.fecha),
                      transaction.cuentaBancariaNombre,
                      transaction.presupuestoNombre,
                    ].filter(Boolean)

                    return (
                      <button
                        key={transaction.id}
                        type="button"
                        className={`crud-inset-row crud-inset-row--tall ${accentClass}`}
                        onClick={() => handleOpenDetailModal(transaction)}
                        aria-label={`Ver detalles de transacción ${transaction.descripcion}. ${isIngreso ? 'Ingreso' : isAhorro ? 'Ahorro' : 'Egreso'}: ${formatBalance(transaction.monto, transaction.moneda)}`}
                      >
                        <div className="crud-row-content">
                          <div className="crud-row-header">
                            <span className="crud-row-title">{transaction.descripcion}</span>
                            <span className={`crud-row-value ${valueClass}`}>
                              {isIngreso ? '+' : isAhorro ? '💰 ' : '−'}
                              {formatBalance(transaction.monto, transaction.moneda)}
                            </span>
                            <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
                          </div>
                          <p className="crud-row-meta">{metaParts.join(' · ')}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Botón de volver */}
            </>
          )}
        </div>
      </div>

      {/* Modal de detalles de transacción */}
      {isDetailModalOpen && selectedTransaction && (
        <div className="modal-overlay" onClick={handleCloseDetailModal}>
          <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Detalles de la Transacción</h2>
              <button
                className="modal-close"
                onClick={handleCloseDetailModal}
                aria-label="Cerrar modal"
                type="button"
              >
                ×
              </button>
            </div>

            <div className="detail-content">
              <div className="detail-section">
                <div className="detail-info">
                  <h3 className="detail-name">{selectedTransaction.descripcion}</h3>
                  <p
                    className={`detail-amount ${selectedTransaction.tipo === 'ingreso' ? 'income' : selectedTransaction.tipo === 'ahorro' ? 'savings' : 'expense'}`}
                  >
                    {selectedTransaction.tipo === 'ingreso'
                      ? '+'
                      : selectedTransaction.tipo === 'ahorro'
                        ? '💰'
                        : '-'}
                    {formatBalance(selectedTransaction.monto, selectedTransaction.moneda)}
                  </p>
                  <p className="detail-type">
                    {selectedTransaction.tipo === 'ingreso'
                      ? 'Ingreso'
                      : selectedTransaction.tipo === 'ahorro'
                        ? 'Ahorro'
                        : 'Egreso'}
                  </p>
                </div>
              </div>

              <div className="detail-row">
                <span className="detail-label">Categoría:</span>
                <span className="detail-value">{selectedTransaction.categoria}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Fecha:</span>
                <span className="detail-value">{formatDate(selectedTransaction.fecha)}</span>
              </div>
              {selectedTransaction.cuentaBancariaNombre && (
                <div className="detail-row">
                  <span className="detail-label">Cuenta Bancaria:</span>
                  <span className="detail-value">{selectedTransaction.cuentaBancariaNombre}</span>
                </div>
              )}
              {selectedTransaction.presupuestoNombre && (
                <div className="detail-row">
                  <span className="detail-label">Presupuesto:</span>
                  <span className="detail-value">{selectedTransaction.presupuestoNombre}</span>
                </div>
              )}
            </div>

            <div className="detail-actions">
              <button
                className="detail-button edit"
                onClick={handleEditClick}
                type="button"
                aria-label="Editar transacción"
              >
                <EditIcon aria-hidden="true" />
                <span>Editar Transacción</span>
              </button>
              <button
                className="detail-button delete"
                onClick={handleDeleteClick}
                type="button"
                aria-label="Eliminar transacción"
              >
                <DeleteIcon aria-hidden="true" />
                <span>Eliminar Transacción</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar/editar transacción */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {isEditMode ? 'Editar Transacción' : 'Nueva Transacción'}
              </h2>
              <button className="modal-close" onClick={handleCloseModal} disabled={isSubmitting}>
                ×
              </button>
            </div>
            {isSubmitting ? (
              <div className="modal-loading">
                <div className="loading-spinner"></div>
                <p className="loading-text">
                  {formData.addToPatrimonio && !isEditMode
                    ? 'Guardando transacción y patrimonio...'
                    : 'Guardando transacción...'}
                </p>
              </div>
            ) : (
              <form className="modal-form" onSubmit={handleSubmit}><div className="modal-panel__scroll">
                <section className="crud-form-section" aria-labelledby="tx-form-classification">
                  <h3 className="crud-form-section-title" id="tx-form-classification">
                    Clasificación
                  </h3>
                  <div className="crud-form-section__fields glass-group">
                    <div className="form-group-base">
                      <label htmlFor="tipo" className="form-label-base">Tipo</label>
                      <select
                        id="tipo"
                        name="tipo"
                        value={formData.tipo}
                        onChange={handleChange}
                        required
                        className="form-select-base"
                      >
                        <option value="ingreso">Ingreso</option>
                        <option value="egreso">Egreso</option>
                        <option value="ahorro">Ahorro</option>
                      </select>
                    </div>
                    <div className="form-group-base">
                      <label htmlFor="fecha" className="form-label-base">Fecha</label>
                      <input
                        type="date"
                        id="fecha"
                        name="fecha"
                        value={formData.fecha}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    {formData.tipo !== 'ahorro' &&
                      !(formData.tipo === 'ingreso' && formData.isDebtorPayment) && (
                        <>
                          <div className="form-group-base">
                            <label htmlFor="descripcion" className="form-label-base">Descripción</label>
                            <input
                              type="text"
                              id="descripcion"
                              name="descripcion"
                              value={formData.descripcion}
                              onChange={handleChange}
                              required
                              placeholder="Ej: Compra de supermercado"
                              className={`form-input-base ${formErrors.descripcion ? 'input-error' : ''}`}
                            />
                            {formErrors.descripcion && (
                              <span className="error-message">{formErrors.descripcion}</span>
                            )}
                          </div>
                          <div className="form-group-base">
                            <label htmlFor="categoria" className="form-label-base">Categoría</label>
                            <input
                              type="text"
                              id="categoria"
                              name="categoria"
                              value={formData.categoria}
                              onChange={handleChange}
                              required
                              placeholder="Ej: Compras, Salario, etc."
                              className={`form-input-base ${formErrors.categoria ? 'input-error' : ''}`}
                            />
                            {formErrors.categoria && (
                              <span className="error-message">{formErrors.categoria}</span>
                            )}
                          </div>
                        </>
                      )}
                    <div className="form-group-base">
                      <label htmlFor="monto" className="form-label-base">Monto</label>
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
                        className={`form-input-base ${formErrors.monto ? 'input-error' : ''}`}
                      />
                      {formErrors.monto && <span className="error-message">{formErrors.monto}</span>}
                    </div>
                    <div className="form-group-base">
                      <label htmlFor="moneda" className="form-label-base">Moneda</label>
                      <select
                        id="moneda"
                        name="moneda"
                        value={formData.moneda}
                        onChange={handleChange}
                        required
                        className="form-select-base"
                      >
                        <option value="COP">COP</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section className="crud-form-section" aria-labelledby="tx-form-origin">
                  <h3 className="crud-form-section-title" id="tx-form-origin">
                    Origen del pago
                  </h3>
                  <div className="crud-form-section__fields glass-group">
                {formData.tipo === 'ingreso' && (
                  <div className="form-group-base checkbox-group">
                    <label htmlFor="isDebtorPayment" className="checkbox-label">
                      <input
                        type="checkbox"
                        id="isDebtorPayment"
                        name="isDebtorPayment"
                        checked={formData.isDebtorPayment}
                        onChange={handleChange}
                      />
                      <span>¿Es un pago de un deudor?</span>
                    </label>
                  </div>
                )}
                {formData.tipo === 'ingreso' && formData.isDebtorPayment && (
                  <div className="form-group-base">
                    <label htmlFor="debtorId" className="form-label-base">Deudor *</label>
                    <select
                      id="debtorId"
                      name="debtorId"
                      value={formData.debtorId}
                      onChange={handleChange}
                      required
                      className="form-select-base"
                    >
                      <option value="">Selecciona un deudor</option>
                      {debtors.map(debtor => (
                        <option key={debtor.id} value={debtor.id}>
                          {debtor.nombre} - {debtor.concepto} (Pendiente:{' '}
                          {formatBalance(debtor.valor - debtor.totalPagado)})
                        </option>
                      ))}
                    </select>
                    {formErrors.debtorId && (
                      <span className="error-message">{formErrors.debtorId}</span>
                    )}
                  </div>
                )}
                {formData.tipo === 'egreso' && (
                  <div className="form-group-base checkbox-group">
                    <label htmlFor="isCreditCardPayment" className="checkbox-label">
                      <input
                        type="checkbox"
                        id="isCreditCardPayment"
                        name="isCreditCardPayment"
                        checked={formData.isCreditCardPayment}
                        onChange={handleChange}
                      />
                      <span>¿Es un pago con tarjeta de crédito?</span>
                    </label>
                  </div>
                )}

                {formData.tipo === 'egreso' && formData.isCreditCardPayment && (
                  <div className="credit-card-warning">
                    <div className="warning-header">
                      <WarningIcon className="warning-icon" />
                      <h4 className="warning-title">Advertencia sobre Tarjetas de Crédito</h4>
                    </div>
                    <div className="warning-content">
                      <p className="warning-text">
                        Los pagos con tarjeta de crédito son para casos de emergencia y no para
                        lujos o minipréstamos. No están presupuestados y el abuso de ellos puede
                        llevar a la quiebra.
                      </p>
                    </div>
                  </div>
                )}

                {formData.tipo === 'egreso' &&
                  formData.isCreditCardPayment &&
                  creditCards.length > 0 && (
                    <div className="form-group-base">
                      <label htmlFor="creditCardId" className="form-label-base">Tarjeta de Crédito</label>
                      <select
                        id="creditCardId"
                        name="creditCardId"
                        value={formData.creditCardId}
                        onChange={handleChange}
                        required
                        className={`form-input-base ${`form-select-base ${formErrors.creditCardId ? 'input-error' : ''}`}`}
                      >
                        <option value="">Selecciona una tarjeta</option>
                        {creditCards.map(card => (
                          <option key={card.id} value={card.id}>
                            {card.nombre} ({card.banco}) - Disponible:{' '}
                            {formatBalance(card.cupoDisponible, formData.moneda)}
                          </option>
                        ))}
                      </select>
                      {formErrors.creditCardId && (
                        <span className="error-message">{formErrors.creditCardId}</span>
                      )}
                    </div>
                  )}

                {(!formData.isCreditCardPayment || formData.tipo === 'ahorro') && (
                  <div className="form-group-base">
                    <label htmlFor="cuentaBancariaId" className="form-label-base">Cuenta Bancaria</label>
                    {accounts.filter(account => account.currency === formData.moneda).length ===
                    0 ? (
                      <div className="no-accounts-message">
                        <p>
                          No hay cuentas bancarias disponibles en {formData.moneda}. Por favor, crea
                          una cuenta en esta divisa primero.
                        </p>
                      </div>
                    ) : (
                      <select
                        id="cuentaBancariaId"
                        name="cuentaBancariaId"
                        value={formData.cuentaBancariaId}
                        onChange={handleChange}
                        required
                        className={`form-input-base ${`form-select-base ${formErrors.cuentaBancariaId ? 'input-error' : ''}`}`}
                      >
                        <option value="">Selecciona una cuenta</option>
                        {accounts
                          .filter(account => account.currency === formData.moneda)
                          .map(account => (
                            <option key={account.id} value={account.id}>
                              {account.nombre} ({account.currency}) -{' '}
                              {formatBalance(account.balance, account.currency)}
                            </option>
                          ))}
                      </select>
                    )}
                    {formErrors.cuentaBancariaId && (
                      <span className="error-message">{formErrors.cuentaBancariaId}</span>
                    )}
                  </div>
                )}

                {formData.tipo === 'egreso' && !formData.isCreditCardPayment && (
                  <>
                    {debts.length > 0 && (
                      <div className="form-group-base checkbox-group">
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
                      <div className="form-group-base">
                        <label htmlFor="debtId" className="form-label-base">Deuda a pagar</label>
                        <select
                          id="debtId"
                          name="debtId"
                          value={formData.debtId}
                          onChange={handleChange}
                          required
                          className={`form-input-base ${`form-select-base ${formErrors.debtId ? 'input-error' : ''}`}`}
                        >
                          <option value="">Selecciona una deuda</option>
                          {debts.map(debt => (
                            <option key={debt.id} value={debt.id}>
                              {debt.concepto} - Adeudado:{' '}
                              {formatBalance(debt.adeudado, debt.divisa)} ({debt.divisa})
                            </option>
                          ))}
                        </select>
                        {formErrors.debtId && (
                          <span className="error-message">{formErrors.debtId}</span>
                        )}
                      </div>
                    ) : (
                      <div className="form-group-base">
                        <label htmlFor="presupuestoId" className="form-label-base">Presupuesto</label>
                        <select
                          id="presupuestoId"
                          name="presupuestoId"
                          value={formData.presupuestoId}
                          onChange={handleChange}
                          className={`form-input-base ${`form-select-base ${formErrors.presupuestoId ? 'input-error' : ''}`}`}
                        >
                          <option value="">Selecciona un presupuesto</option>
                          {budgets.map(budget => (
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

                {formData.tipo === 'ahorro' && (
                  <>
                    <div className="form-group-base">
                      <label htmlFor="presupuestoId-ahorro" className="form-label-base">Presupuesto del Proyecto *</label>
                      <select
                        id="presupuestoId-ahorro"
                        name="presupuestoId"
                        value={formData.presupuestoId}
                        onChange={handleChange}
                        required
                        className={`form-input-base ${`form-select-base ${formErrors.presupuestoId ? 'input-error' : ''}`}`}
                      >
                        <option value="">Selecciona un presupuesto asociado a un proyecto</option>
                        {projectBudgets.map(budget => (
                          <option key={budget.id} value={budget.id}>
                            {budget.nombre}
                          </option>
                        ))}
                      </select>
                      {formErrors.presupuestoId && (
                        <span className="error-message">{formErrors.presupuestoId}</span>
                      )}
                      {projectBudgets.length === 0 && (
                        <p
                          className="form-hint"
                          style={{ color: 'rgba(255, 193, 7, 0.8)', marginTop: '0.5rem' }}
                        >
                          ⚠️ No hay presupuestos asociados a proyectos. Crea un proyecto primero
                          para poder registrar ahorros.
                        </p>
                      )}
                    </div>
                  </>
                )}
                  </div>
                </section>

                {canAddTransactionToPatrimony(
                  formData.tipo,
                  formData.isDebtPayment,
                  isEditMode
                ) && (
                  <section className="crud-form-section" aria-labelledby="tx-form-patrimonio">
                    <h3 className="crud-form-section-title" id="tx-form-patrimonio">
                      Patrimonio
                    </h3>
                    <TransaccionPatrimonioToggle
                      checked={formData.addToPatrimonio}
                      showSuggestion={shouldSuggestPatrimonio(formData.categoria)}
                      onChange={handlePatrimonioToggle}
                    />
                    {formData.addToPatrimonio && (
                      <TransaccionPatrimonioFields
                        formData={patrimonyFormData}
                        formErrors={patrimonyFormErrors}
                        categorySuggestions={patrimonyCategorySuggestions}
                        onChange={handlePatrimonyChange}
                        onFieldTouch={handlePatrimonyFieldTouch}
                      />
                    )}
                  </section>
                )}</div>

                <div className="modal-actions-base">
                  <button type="button" className="btn-base btn-secondary" onClick={handleCloseModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-base btn-accent btn-submit">
                    {isEditMode
                      ? 'Guardar Cambios'
                      : formData.addToPatrimonio
                        ? 'Agregar y registrar en Patrimonio'
                        : 'Agregar'}
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
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Debug - Transacciones</h2>
              <button className="modal-close" onClick={() => setIsDebugModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="debug-modal-content">
              <div className="debug-options">
                <button
                  className="debug-option-button create-demo"
                  onClick={handleCreateDemoIncomes}
                  disabled={isLoading}
                >
                  <span className="debug-option-icon">💰</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Crear Ingresos Demo</h3>
                    <p className="debug-option-description">
                      Crea 5 ingresos de ejemplo para pruebas
                    </p>
                  </div>
                </button>
                <button
                  className="debug-option-button create-demo"
                  onClick={handleCreateDemoExpenses}
                  disabled={isLoading}
                >
                  <span className="debug-option-icon">💸</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Crear Egresos Demo</h3>
                    <p className="debug-option-description">
                      Crea 5 egresos de ejemplo para pruebas
                    </p>
                  </div>
                </button>
                <button
                  className="debug-option-button create-demo"
                  onClick={handleCreateDemoCreditCardPayments}
                  disabled={isLoading}
                >
                  <span className="debug-option-icon">💳</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Crear Egresos con Tarjeta Demo</h3>
                    <p className="debug-option-description">
                      Crea 3 egresos con pago de tarjeta de crédito
                    </p>
                  </div>
                </button>
                <button
                  className="debug-option-button create-demo"
                  onClick={handleCreateDemoDebtPayments}
                  disabled={isLoading}
                >
                  <span className="debug-option-icon">📋</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Crear Egresos con Deuda Demo</h3>
                    <p className="debug-option-description">Crea 2 egresos con pago de deuda</p>
                  </div>
                </button>
                <button
                  className="debug-option-button create-demo"
                  onClick={handleCreateDemoSavings}
                  disabled={isLoading}
                >
                  <span className="debug-option-icon">💎</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Crear Ahorros Demo</h3>
                    <p className="debug-option-description">
                      Crea 3 ahorros de ejemplo para pruebas
                    </p>
                  </div>
                </button>
                <button
                  className="debug-option-button delete-all"
                  onClick={handleDeleteAllTransactions}
                  disabled={isLoading}
                >
                  <span className="debug-option-icon">🗑️</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Eliminar Todas las Transacciones</h3>
                    <p className="debug-option-description">
                      ⚠️ PELIGROSO: Elimina todas las transacciones (IRREVERSIBLE)
                    </p>
                  </div>
                </button>
              </div>
            </div>
            <div className="modal-actions-base">
              <button
                type="button"
                className="btn-base btn-secondary"
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

export default Transacciones
