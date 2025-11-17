import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import WarningIcon from '@mui/icons-material/Warning'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { api } from '../services/api'
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
}

interface BankAccount {
  id: string
  nombre: string
  currency: string
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

function Transacciones() {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [projectBudgets, setProjectBudgets] = useState<Budget[]>([])
  const [projectBudgetIds, setProjectBudgetIds] = useState<Set<string>>(new Set())
  const [debts, setDebts] = useState<Debt[]>([])
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
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
    creditCardId: ''
  })
  const [formErrors, setFormErrors] = useState({
    monto: '',
    descripcion: '',
    categoria: '',
    cuentaBancariaId: '',
    presupuestoId: '',
    debtId: '',
    creditCardId: ''
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
            accountsList.push({ 
              id: acc.id, 
              nombre: acc.account_name,
              currency: acc.currency || 'COP'
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
              divisa: debt.currency || debt.divisa
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
              cupoDisponible: cupoTotal - cupoUsado
            })
          })
        }
        setCreditCards(creditCardsList)

        // Mapear transacciones
        if (transactionsResponse.transactions && Array.isArray(transactionsResponse.transactions)) {
          const mappedTransactions = transactionsResponse.transactions.map((tx: TransactionAPI) =>
            mapTransactionFromAPI(tx, accountsMap, budgetsMap)
          )
          // Ordenar por fecha descendente (más recientes primero)
          mappedTransactions.sort((a: Transaction, b: Transaction) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
          setTransactions(mappedTransactions)
        } else {
          setTransactions([])
        }
      } catch (err: any) {
        console.error('Error al cargar datos:', err)
        setError('Frontend says: Error al cargar las transacciones. Por favor, intenta de nuevo.')
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
      bolsillo: '',
      isDebtPayment: false,
      debtId: '',
      isCreditCardPayment: false,
      creditCardId: ''
    })
    setFormErrors({
      monto: '',
      descripcion: '',
      categoria: '',
      cuentaBancariaId: '',
      presupuestoId: '',
      debtId: '',
      creditCardId: ''
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
      bolsillo: '',
      isDebtPayment: false,
      debtId: '',
      isCreditCardPayment: false,
      creditCardId: ''
    })
    setFormErrors({
      monto: '',
      descripcion: '',
      categoria: '',
      cuentaBancariaId: '',
      presupuestoId: '',
      debtId: '',
      creditCardId: ''
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
      bolsillo: '',
      isDebtPayment: false,
      debtId: '',
      isCreditCardPayment: false,
      creditCardId: ''
    })
  }

  const handleDeleteClick = async (transaction: Transaction) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
      try {
        setIsLoading(true)
        
        // Obtener la transacción completa para saber qué revertir
        let tx: any
        try {
          const transactionResponse = await api.getTransactions({ id: transaction.id })
          if (!transactionResponse.transactions || transactionResponse.transactions.length === 0) {
            throw new Error('Transaction not found')
          }
          tx = transactionResponse.transactions[0]
        } catch (err: any) {
          console.error('Error al obtener transacción:', err)
          throw new Error(`Error al obtener transacción: ${err.data?.error || err.message || 'Error desconocido'}`)
        }
        
        // Guardar valores originales para rollback
        const monto = parseFloat(tx.amount.toString())
        let originalBudgetTotalSpent: number | null = null
        let originalAccountBalance: number | null = null
        let originalCreditCardUsedCredit: number | null = null
        let originalDebtOwed: number | null = null
        let originalProjectCurrentAmount: number | null = null
        let projectId: string | null = null
        let budgetUpdated = false
        let accountUpdated = false
        let creditCardUpdated = false
        let debtUpdated = false
        let projectUpdated = false
        
        // Obtener valores originales antes de hacer cambios
        if (tx.budget_id && (tx.type === 'egreso' || tx.type === 'ahorro')) {
          const budgetResponse = await api.getBudgets(tx.budget_id)
          if (budgetResponse.budgets && budgetResponse.budgets.length > 0) {
            originalBudgetTotalSpent = parseFloat(budgetResponse.budgets[0].total_spent.toString())
          }
        }
        
        // Solo obtener balance de cuenta bancaria si NO es un pago con tarjeta de crédito
        // (los pagos con tarjeta de crédito tienen bank_account_id = null)
        if (tx.bank_account_id && tx.bank_account_id !== null) {
          const bankAccountResponse = await api.getBankAccounts(tx.bank_account_id)
          if (bankAccountResponse.accounts && bankAccountResponse.accounts.length > 0) {
            originalAccountBalance = parseFloat(bankAccountResponse.accounts[0].balance.original.amount)
          }
        }
        
        // Si es un pago con tarjeta de crédito, obtener el used_credit original
        if (tx.credit_card_id && tx.type === 'egreso') {
          const creditCardResponse = await api.getCreditCards(tx.credit_card_id)
          if (creditCardResponse.credit_cards && creditCardResponse.credit_cards.length > 0) {
            originalCreditCardUsedCredit = parseFloat(creditCardResponse.credit_cards[0].used_credit?.toString() || '0')
          }
        }
        
        // Si es un pago de deuda, obtener el owed original
        if (tx.debt_id && tx.type === 'egreso') {
          const debtResponse = await api.getDebts(tx.debt_id)
          if (debtResponse.debts && debtResponse.debts.length > 0) {
            originalDebtOwed = parseFloat(debtResponse.debts[0].owed?.toString() || '0')
          }
        }
        
        // Si es un ahorro, obtener el current_amount original del proyecto asociado
        if (tx.type === 'ahorro' && tx.budget_id) {
          try {
            const projectsResponse = await api.getProjects()
            if (projectsResponse.projects && Array.isArray(projectsResponse.projects)) {
              const project = projectsResponse.projects.find((p: any) => p.budget_id === tx.budget_id)
              if (project) {
                projectId = project.id
                originalProjectCurrentAmount = parseFloat(project.current_amount?.toString() || '0')
              }
            }
          } catch (err) {
            console.error('Error al obtener proyecto para rollback:', err)
          }
        }
        
        try {
          // 1. PRIMERO: Eliminar la transacción
          console.log('Eliminando transacción:', transaction.id)
          await api.deleteTransaction(transaction.id)
          console.log('Transacción eliminada exitosamente')
          
          // 2. SEGUNDO: Revertir balance de cuenta bancaria (solo si tiene bank_account_id)
          if (tx.bank_account_id && originalAccountBalance !== null) {
            let newBalance = originalAccountBalance
            
            if (tx.type === 'ingreso') {
              newBalance -= monto // Revertir ingreso: restar el monto
            } else if (tx.type === 'egreso' || tx.type === 'ahorro') {
              newBalance += monto // Revertir egreso/ahorro: sumar el monto
            }
            
            console.log('Revirtiendo balance de cuenta bancaria:', tx.bank_account_id, 'De:', originalAccountBalance, 'A:', newBalance)
            await api.updateBankAccount(tx.bank_account_id, {
              balance: newBalance
            })
            accountUpdated = true
            console.log('Balance de cuenta bancaria revertido exitosamente')
          } else if (tx.credit_card_id) {
            console.log('No se revierte balance de cuenta bancaria porque es un pago con tarjeta de crédito')
          }
          
          // 2b. Revertir used_credit de la tarjeta de crédito si tiene credit_card_id
          if (tx.credit_card_id && tx.type === 'egreso' && originalCreditCardUsedCredit !== null) {
            const nuevoUsedCredit = Math.max(0, originalCreditCardUsedCredit - monto)
            console.log('Revirtiendo used_credit de tarjeta de crédito:', tx.credit_card_id, 'De:', originalCreditCardUsedCredit, 'A:', nuevoUsedCredit)
            await api.updateCreditCard(tx.credit_card_id, {
              used_credit: nuevoUsedCredit
            })
            creditCardUpdated = true
            console.log('Used_credit de tarjeta de crédito revertido exitosamente')
            
            // También revertir la deuda asociada si existe
            // Ya tenemos la respuesta de la tarjeta de crédito de arriba, pero la necesitamos aquí también
            const creditCardResponse = await api.getCreditCards(tx.credit_card_id)
            if (creditCardResponse.credit_cards && creditCardResponse.credit_cards.length > 0) {
              const cardName = creditCardResponse.credit_cards[0].name
              const associatedDebt = debts.find(d => d.concepto === cardName)
              if (associatedDebt) {
                const adeudadoActual = parseFloat(String(associatedDebt.adeudado || 0))
                const nuevoAdeudado = Math.max(0, adeudadoActual - monto)
                console.log('Revirtiendo deuda asociada:', associatedDebt.id, 'De:', adeudadoActual, 'A:', nuevoAdeudado)
                await api.updateDebt(associatedDebt.id, {
                  owed: nuevoAdeudado
                })
                console.log('Deuda asociada revertida exitosamente')
                window.dispatchEvent(new Event('debtsUpdated'))
              }
            }
          }
          
          // 2c. Revertir pago de deuda si la transacción tiene debt_id
          if (tx.debt_id && tx.type === 'egreso') {
            // Obtener la deuda actual para saber el monto adeudado
            const debtResponse = await api.getDebts(tx.debt_id)
            if (debtResponse.debts && debtResponse.debts.length > 0) {
              const debt = debtResponse.debts[0]
              const adeudadoActual = parseFloat(String(debt.owed || 0))
              const nuevoAdeudado = adeudadoActual + monto
              
              console.log('Revirtiendo pago de deuda:', {
                debtId: tx.debt_id,
                concepto: debt.concept || debt.concepto,
                adeudadoActual,
                montoTransaccion: monto,
                nuevoAdeudado
              })
              
              await api.updateDebt(tx.debt_id, {
                owed: nuevoAdeudado
              })
              debtUpdated = true
              console.log('Pago de deuda revertido exitosamente')
              window.dispatchEvent(new Event('debtsUpdated'))
            }
          }

          // 3. TERCERO: Recalcular total_spent del presupuesto usando el endpoint de recalculate
          // Esto es necesario porque el backend no acepta total_spent directamente en PUT /budgets/{id}
          // El recalculate automáticamente excluirá la transacción eliminada
          if (tx.budget_id && (tx.type === 'egreso' || tx.type === 'ahorro')) {
            console.log('Recalculando presupuesto después de eliminar transacción:', tx.budget_id)
            await api.recalculateBudget(tx.budget_id)
            console.log('Presupuesto recalculado exitosamente')
            budgetUpdated = true
            
            // Verificar que el presupuesto se actualizó correctamente
            const verifyResponse = await api.getBudgets(tx.budget_id)
            if (verifyResponse.budgets && verifyResponse.budgets.length > 0) {
              const updatedBudget = verifyResponse.budgets[0]
              const expectedTotalSpent = originalBudgetTotalSpent !== null ? Math.max(0, originalBudgetTotalSpent - monto) : 0
              console.log('Presupuesto después de recalcular:', {
                id: tx.budget_id,
                name: updatedBudget.name,
                total_spent: updatedBudget.total_spent,
                expected_total_spent: expectedTotalSpent
              })
              
              if (Math.abs(parseFloat(updatedBudget.total_spent.toString()) - expectedTotalSpent) > 0.01) {
                console.warn('⚠️ El total_spent no coincide con el valor esperado después de recalcular')
              } else {
                console.log('✅ Presupuesto recalculado correctamente en el backend')
              }
            }
          }

          // 3b. Si es un ahorro eliminado, revertir el current_amount del proyecto asociado
          if (tx.type === 'ahorro' && projectId && originalProjectCurrentAmount !== null) {
            try {
              const newCurrentAmount = Math.max(0, originalProjectCurrentAmount - monto)
              
              console.log('Revirtiendo current_amount del proyecto:', {
                projectId,
                currentAmountOriginal: originalProjectCurrentAmount,
                montoTransaccion: monto,
                newCurrentAmount
              })
              
              await api.updateProject(projectId, {
                current_amount: newCurrentAmount
              })
              
              projectUpdated = true
              console.log('✅ Proyecto revertido exitosamente')
              window.dispatchEvent(new Event('projectsUpdated'))
            } catch (projectErr: any) {
              console.error('Error al revertir proyecto:', projectErr)
              // Continuar aunque falle, ya que la transacción ya fue eliminada
            }
          }

          // Recargar transacciones después de eliminar
          await reloadTransactions()
          
          // Disparar evento para actualizar presupuestos si se actualizó uno
          if (budgetUpdated) {
            console.log('Disparando evento budgetsUpdated. budgetId:', tx.budget_id)
            setTimeout(() => {
              window.dispatchEvent(new Event('budgetsUpdated'))
              console.log('Evento budgetsUpdated disparado')
            }, 100)
          }
          
          alert('Frontend says: Transacción eliminada exitosamente.')
        } catch (err: any) {
          console.error('Error al eliminar transacción:', err)
          
          // ROLLBACK: Si falló después de eliminar la transacción, revertir los cambios
          // Nota: La transacción ya fue eliminada, así que no podemos revertirla
          // Solo podemos revertir los cambios en cuenta, tarjeta de crédito y presupuesto
          try {
            // Revertir cuenta bancaria si se actualizó
            if (accountUpdated && tx.bank_account_id && originalAccountBalance !== null) {
              console.log('Haciendo rollback de la cuenta bancaria:', tx.bank_account_id)
              await api.updateBankAccount(tx.bank_account_id, {
                balance: originalAccountBalance
              })
              console.log('Rollback de cuenta bancaria completado')
            }
            
            // Revertir tarjeta de crédito si se actualizó
            if (creditCardUpdated && tx.credit_card_id && originalCreditCardUsedCredit !== null) {
              console.log('Haciendo rollback del used_credit de la tarjeta de crédito:', tx.credit_card_id)
              await api.updateCreditCard(tx.credit_card_id, {
                used_credit: originalCreditCardUsedCredit
              })
              console.log('Rollback de tarjeta de crédito completado')
            }
            
            // Revertir deuda si se actualizó
            if (debtUpdated && tx.debt_id && originalDebtOwed !== null) {
              console.log('Haciendo rollback del pago de deuda:', tx.debt_id)
              await api.updateDebt(tx.debt_id, {
                owed: originalDebtOwed
              })
              console.log('Rollback de deuda completado')
            }
            
            // Revertir proyecto si se actualizó
            if (projectUpdated && projectId && originalProjectCurrentAmount !== null) {
              console.log('Haciendo rollback del proyecto:', projectId)
              await api.updateProject(projectId, {
                current_amount: originalProjectCurrentAmount
              })
              console.log('Rollback de proyecto completado')
            }
            
            // Revertir presupuesto: recalcular el presupuesto
            // Esto debería restaurar el total_spent original porque la transacción ya fue eliminada
            if (budgetUpdated && tx.budget_id) {
              console.log('Haciendo rollback del presupuesto (recalculando):', tx.budget_id)
              await api.recalculateBudget(tx.budget_id)
              console.log('Rollback de presupuesto completado (recalculado)')
            }
          } catch (rollbackErr: any) {
            console.error('Error al hacer rollback:', rollbackErr)
            alert(`Frontend says: Error crítico: La transacción fue eliminada pero hubo un error al revertir los cambios. Por favor, verifica manualmente la cuenta bancaria, tarjeta de crédito, deuda y presupuesto.`)
          }
          
          throw err // Re-lanzar el error original
        }
      } catch (err: any) {
        console.error('Error completo al eliminar transacción:', err)
        console.error('Error response:', err.response)
        console.error('Error data:', err.data)
        console.error('Error message:', err.message)
        
        let errorMessage = 'Frontend says: Error al eliminar la transacción. Por favor, intenta de nuevo.'
        
        if (err.data?.error) {
          errorMessage = `Backend says: ${err.data.error}`
        } else if (err.message) {
          errorMessage = `Frontend says: ${err.message}`
        } else if (err.response?.status) {
          errorMessage = `Backend says: Error ${err.response.status} - ${err.response.statusText || 'Error desconocido'}`
        } else if (typeof err === 'string') {
          errorMessage = `Frontend says: ${err}`
        }
        
        alert(errorMessage)
      } finally {
        setIsLoading(false)
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
      const debtsResponse = await api.getDebts()
      const creditCardsResponse = await api.getCreditCards()

      const accountsList: BankAccount[] = []
      if (accountsResponse.accounts && Array.isArray(accountsResponse.accounts)) {
        accountsResponse.accounts.forEach((acc: any) => {
          accountsList.push({ 
            id: acc.id, 
            nombre: acc.account_name,
            currency: acc.currency || 'COP'
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
            divisa: debt.currency || debt.divisa
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
            cupoDisponible: cupoTotal - cupoUsado
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
      creditCardId: ''
    }
    let isValid = true

    // Validar monto
    const monto = parseFloat(formData.monto)
    if (isNaN(monto) || monto <= 0) {
      errors.monto = 'El monto debe ser mayor a 0'
      isValid = false
    }

    // Validar descripción (solo si no es ahorro)
    if (formData.tipo !== 'ahorro' && !formData.descripcion.trim()) {
      errors.descripcion = 'La descripción es requerida'
      isValid = false
    }

    // Validar categoría (solo si no es ahorro)
    if (formData.tipo !== 'ahorro' && !formData.categoria.trim()) {
      errors.categoria = 'La categoría es requerida'
      isValid = false
    }

    // Validar cuenta bancaria (solo si no es pago con tarjeta de crédito o si es ahorro)
    if ((!formData.isCreditCardPayment || formData.tipo === 'ahorro') && !formData.cuentaBancariaId) {
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
    if (formData.tipo === 'egreso' && (formData as any).isDebtPayment && !(formData as any).debtId) {
      errors.debtId = 'Debes seleccionar una deuda'
      isValid = false
    }

    // Validar tarjeta de crédito si es pago con tarjeta
    if (formData.tipo === 'egreso' && (formData as any).isCreditCardPayment && !(formData as any).creditCardId) {
      errors.creditCardId = 'Debes seleccionar una tarjeta de crédito'
      isValid = false
    }

    // Validar cupo disponible si es pago con tarjeta de crédito
    if (formData.tipo === 'egreso' && (formData as any).isCreditCardPayment && (formData as any).creditCardId) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setIsLoading(true)
      
      const monto = parseFloat(formData.monto)
      
      const transactionData: any = {
        date: formData.fecha,
        type: formData.tipo,
        amount: monto,
        currency: formData.moneda
      }

      // Solo agregar descripción y categoría si no es ahorro
      if (formData.tipo !== 'ahorro') {
        transactionData.description = formData.descripcion.trim()
        transactionData.category = formData.categoria.trim()
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

      // Agregar información sobre tarjeta de crédito si es un pago con tarjeta
      if (formData.tipo === 'egreso' && formData.isCreditCardPayment && formData.creditCardId) {
        const selectedCard = creditCards.find(c => c.id === formData.creditCardId)
        console.log('=== PAYLOAD DE TRANSACCIÓN CON TARJETA DE CRÉDITO ===')
        console.log('Tarjeta seleccionada:', selectedCard ? `${selectedCard.nombre} (${selectedCard.banco})` : 'No encontrada')
        console.log('Cupo usado antes:', selectedCard ? selectedCard.cupoUsado : 'N/A')
        console.log('Cupo disponible antes:', selectedCard ? selectedCard.cupoDisponible : 'N/A')
        console.log('Monto de la transacción:', monto)
        console.log('Cupo usado después (calculado):', selectedCard ? selectedCard.cupoUsado + monto : 'N/A')
        console.log('Payload completo:')
      } else {
        console.log('=== PAYLOAD DE TRANSACCIÓN ===')
      }
      console.log(JSON.stringify(transactionData, null, 2))

      if (isEditMode && selectedTransaction) {
        // Nota: La API no tiene PUT, pero podemos implementarlo si existe
        alert('Frontend says: Funcionalidad de edición pendiente de implementar en la API')
        handleCloseModal()
      } else {
        // Crear nueva transacción con rollback manual
        let budgetUpdated = false
        let accountUpdated = false
        let projectUpdated = false
        let originalBudgetTotalSpent: number | null = null
        let originalAccountBalance: number | null = null
        let originalProjectCurrentAmount: number | null = null
        let budgetId: string | null = null
        let accountId: string | null = null
        let projectId: string | null = null

        try {
          // Guardar valores originales para rollback si es necesario
          if (transactionData.budget_id && (formData.tipo === 'egreso' || formData.tipo === 'ahorro')) {
            budgetId = transactionData.budget_id
            const budgetResponse = await api.getBudgets(budgetId)
            if (budgetResponse.budgets && budgetResponse.budgets.length > 0) {
              const budget = budgetResponse.budgets[0]
              originalBudgetTotalSpent = parseFloat(budget.total_spent.toString())
            }
          }

          // Solo obtener balance de cuenta bancaria si NO es un pago con tarjeta de crédito
          // (los pagos con tarjeta de crédito no tienen bank_account_id)
          if (!(formData.tipo === 'egreso' && formData.isCreditCardPayment)) {
            accountId = transactionData.bank_account_id
            if (accountId) {
              const bankAccountResponse = await api.getBankAccounts(accountId)
              if (bankAccountResponse.accounts && bankAccountResponse.accounts.length > 0) {
                const account = bankAccountResponse.accounts[0]
                originalAccountBalance = parseFloat(account.balance.original.amount)
              }
            }
          }

          // 1. PRIMERO: Crear la transacción
          console.log('Creando transacción...')
          await api.createTransaction(transactionData)
          console.log('Transacción creada exitosamente')

          // 2. SEGUNDO: Actualizar used_credit de la tarjeta de crédito si tiene credit_card_id
          // Según la documentación actualizada del backend, esto debe hacerse después de crear la transacción
          if (transactionData.credit_card_id && formData.tipo === 'egreso' && formData.isCreditCardPayment && formData.creditCardId) {
            const selectedCard = creditCards.find(c => c.id === formData.creditCardId)
            if (selectedCard) {
              // Incrementar el cupo usado de la tarjeta
              const nuevoCupoUsado = selectedCard.cupoUsado + monto
              console.log('Actualizando used_credit de tarjeta de crédito:', formData.creditCardId, 'De:', selectedCard.cupoUsado, 'A:', nuevoCupoUsado)
              await api.updateCreditCard(formData.creditCardId, {
                used_credit: nuevoCupoUsado
              })
              console.log('Used_credit de tarjeta de crédito actualizado exitosamente')

              // Buscar la deuda asociada por concepto (nombre de la tarjeta)
              const associatedDebt = debts.find(d => d.concepto === selectedCard.nombre)
              if (associatedDebt) {
                // Incrementar el monto adeudado
                // Asegurar que adeudado sea un número válido (default: 0)
                const adeudadoActual = parseFloat(String(associatedDebt.adeudado || 0))
                const nuevoAdeudado = adeudadoActual + monto
                
                // Validar que el nuevo monto adeudado sea un número positivo válido
                if (isNaN(nuevoAdeudado) || nuevoAdeudado < 0 || !isFinite(nuevoAdeudado)) {
                  console.error('Error: nuevoAdeudado no es válido:', {
                    nuevoAdeudado,
                    adeudadoActual,
                    monto,
                    adeudadoOriginal: associatedDebt.adeudado,
                    tipoAdeudado: typeof associatedDebt.adeudado
                  })
                  throw new Error(`Frontend says: Error al calcular el nuevo monto adeudado. Valor inválido: ${nuevoAdeudado}`)
                }
                
                console.log('Actualizando deuda asociada:', {
                  debtId: associatedDebt.id,
                  adeudadoActual,
                  monto,
                  nuevoAdeudado,
                  tipoNuevoAdeudado: typeof nuevoAdeudado
                })
                
                await api.updateDebt(associatedDebt.id, {
                  owed: nuevoAdeudado
                })
                console.log('Deuda asociada actualizada exitosamente')
                // Disparar evento para actualizar tarjetas de crédito
                window.dispatchEvent(new Event('debtsUpdated'))
              }
            }
          }

          // 3. TERCERO: Actualizar balance de cuenta bancaria manualmente
          // NO actualizar el balance si es un pago con tarjeta de crédito (el dinero no sale de la cuenta bancaria)
          if (originalAccountBalance !== null && accountId && !(formData.tipo === 'egreso' && formData.isCreditCardPayment)) {
            let newBalance = originalAccountBalance
            
            if (formData.tipo === 'ingreso') {
              newBalance += monto
            } else if (formData.tipo === 'egreso' || formData.tipo === 'ahorro') {
              newBalance -= monto
            }
            
            console.log('Actualizando balance de cuenta bancaria:', accountId, 'De:', originalAccountBalance, 'A:', newBalance)
            await api.updateBankAccount(accountId, {
              balance: newBalance
            })
            accountUpdated = true
            console.log('Balance de cuenta bancaria actualizado exitosamente')
          } else if (formData.tipo === 'egreso' && formData.isCreditCardPayment) {
            console.log('No se actualiza el balance de cuenta bancaria porque es un pago con tarjeta de crédito')
          }

          // 4. CUARTO: Recalcular total_spent del presupuesto usando el endpoint de recalculate
          // Esto es necesario porque el backend no acepta total_spent directamente en PUT /budgets/{id}
          if (transactionData.budget_id && (formData.tipo === 'egreso' || formData.tipo === 'ahorro')) {
            budgetId = transactionData.budget_id
            console.log('Recalculando presupuesto:', budgetId)
            await api.recalculateBudget(budgetId)
            console.log('Presupuesto recalculado exitosamente')
            budgetUpdated = true
            
            // Verificar que el presupuesto se actualizó correctamente
            const verifyResponse = await api.getBudgets(budgetId)
            if (verifyResponse.budgets && verifyResponse.budgets.length > 0) {
              const updatedBudget = verifyResponse.budgets[0]
              const expectedTotalSpent = originalBudgetTotalSpent !== null ? originalBudgetTotalSpent + monto : monto
              console.log('Presupuesto después de recalcular:', {
                id: budgetId,
                name: updatedBudget.name,
                total_spent: updatedBudget.total_spent,
                expected_total_spent: expectedTotalSpent
              })
              
              if (Math.abs(parseFloat(updatedBudget.total_spent.toString()) - expectedTotalSpent) > 0.01) {
                console.warn('⚠️ El total_spent no coincide con el valor esperado después de recalcular')
              } else {
                console.log('✅ Presupuesto recalculado correctamente en el backend')
              }
            }
          }

          // 5. QUINTO: Si es un ahorro, actualizar el current_amount del proyecto asociado
          if (formData.tipo === 'ahorro' && transactionData.budget_id) {
            try {
              // Buscar el proyecto que tiene este budget_id
              const projectsResponse = await api.getProjects()
              let projectToUpdate: any = null
              
              if (projectsResponse.projects && Array.isArray(projectsResponse.projects)) {
                projectToUpdate = projectsResponse.projects.find((p: any) => p.budget_id === transactionData.budget_id)
              }
              
              if (projectToUpdate) {
                projectId = projectToUpdate.id
                const currentAmount = parseFloat(projectToUpdate.current_amount?.toString() || '0')
                originalProjectCurrentAmount = currentAmount
                const newCurrentAmount = currentAmount + monto
                
                console.log('Actualizando current_amount del proyecto:', {
                  projectId: projectToUpdate.id,
                  proyectoNombre: projectToUpdate.name,
                  currentAmountActual: currentAmount,
                  montoTransaccion: monto,
                  newCurrentAmount
                })
                
                await api.updateProject(projectToUpdate.id, {
                  current_amount: newCurrentAmount
                })
                
                projectUpdated = true
                console.log('✅ Proyecto actualizado exitosamente')
                // Disparar evento para actualizar proyectos en otros componentes
                window.dispatchEvent(new Event('projectsUpdated'))
              } else {
                console.warn('⚠️ No se encontró proyecto asociado al budget_id:', transactionData.budget_id)
              }
            } catch (projectErr: any) {
              console.error('Error al actualizar proyecto:', projectErr)
              // No lanzar error, solo registrar, ya que la transacción ya fue creada
              // El rollback manejará esto si es necesario
            }
          }

          // Si es un pago de deuda (no con tarjeta de crédito), actualizar el monto adeudado
          if (formData.tipo === 'egreso' && formData.isDebtPayment && formData.debtId && !formData.isCreditCardPayment) {
            const selectedDebt = debts.find(d => d.id === formData.debtId)
            if (selectedDebt) {
              // Convertir el monto del pago a la moneda de la deuda si es necesario
              // Por ahora asumimos que están en la misma moneda
              // Asegurar que adeudado sea un número válido (default: 0)
              const adeudadoActual = parseFloat(selectedDebt.adeudado.toString()) || 0
              const nuevoAdeudado = Math.max(0, adeudadoActual - monto) // Asegurar que sea positivo
              
              console.log('Actualizando deuda por pago:', {
                debtId: formData.debtId,
                adeudadoActual,
                monto,
                nuevoAdeudado
              })
              
              await api.updateDebt(formData.debtId, {
                owed: nuevoAdeudado
              })
              console.log('Deuda actualizada exitosamente')
              // Disparar evento para actualizar tarjetas de crédito
              window.dispatchEvent(new Event('debtsUpdated'))
            }
          }

          // Recargar transacciones después de crear
          await reloadTransactions()
          
          // Disparar evento para actualizar presupuestos si se actualizó uno
          if (budgetUpdated) {
            console.log('Disparando evento budgetsUpdated. budgetId:', budgetId)
            // Pequeño delay para asegurar que el backend haya procesado la actualización
            setTimeout(() => {
              window.dispatchEvent(new Event('budgetsUpdated'))
              console.log('Evento budgetsUpdated disparado')
            }, 100)
          } else {
            console.log('No se dispara evento budgetsUpdated porque budgetUpdated es false')
          }
          
          handleCloseModal()
        } catch (err: any) {
          console.error('Error al guardar transacción:', err)
          
          // ROLLBACK: Revertir cambios si algo falló
          // Nota: Como ahora creamos la transacción primero, si algo falla después,
          // necesitamos eliminar la transacción y recalcular el presupuesto
          try {
            // Revertir cuenta bancaria si se actualizó (esto debe hacerse primero)
            if (accountUpdated && accountId && originalAccountBalance !== null) {
              console.log('Haciendo rollback de la cuenta bancaria:', accountId)
              await api.updateBankAccount(accountId, {
                balance: originalAccountBalance
              })
              console.log('Rollback de cuenta bancaria completado')
            }

            // Revertir proyecto si se actualizó
            if (projectUpdated && projectId && originalProjectCurrentAmount !== null) {
              console.log('Haciendo rollback del proyecto:', projectId)
              await api.updateProject(projectId, {
                current_amount: originalProjectCurrentAmount
              })
              console.log('Rollback de proyecto completado')
            }
            
            // Revertir presupuesto: si la transacción fue creada, recalcular el presupuesto
            // Esto debería revertir el total_spent automáticamente
            if (budgetUpdated && budgetId) {
              console.log('Haciendo rollback del presupuesto (recalculando):', budgetId)
              await api.recalculateBudget(budgetId)
              console.log('Rollback de presupuesto completado (recalculado)')
            }
          } catch (rollbackErr: any) {
            console.error('Error al hacer rollback:', rollbackErr)
            alert(`Frontend says: Error crítico: La transacción falló y hubo un error al revertir los cambios. Por favor, verifica manualmente el presupuesto y la cuenta bancaria.`)
          }

          const errorMessage = err.data?.error 
            ? `Backend says: ${err.data.error}` 
            : 'Frontend says: Error al guardar la transacción. Por favor, intenta de nuevo.'
          alert(errorMessage)
        } finally {
          setIsLoading(false)
        }
      }
    } catch (err: any) {
      console.error('Error al guardar transacción:', err)
      const errorMessage = err.data?.error 
        ? `Backend says: ${err.data.error}` 
        : 'Frontend says: Error al guardar la transacción. Por favor, intenta de nuevo.'
      alert(errorMessage)
      setIsLoading(false)
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
        setFormData((prev: any) => ({
          ...prev,
          isDebtPayment: false,
          debtId: ''
        }))
      }
    } else {
      setFormData((prev: any) => ({
        ...prev,
        [name]: value
      }))
      
      // Si cambia la divisa, limpiar la cuenta seleccionada si no coincide con la nueva divisa
      if (name === 'moneda') {
        setFormData((prevForm: any) => {
          const selectedAccount = accounts.find(acc => acc.id === prevForm.cuentaBancariaId)
          if (selectedAccount && selectedAccount.currency !== value) {
            return {
              ...prevForm,
              moneda: value,
              cuentaBancariaId: ''
            }
          }
          return {
            ...prevForm,
            moneda: value
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
          creditCardId: ''
        }))
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
          creditCardId: ''
        }))
        return
      } else if (value === 'egreso') {
        setFormData(prev => ({
          ...prev,
          tipo: 'egreso',
          bolsillo: ''
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
          creditCardId: ''
        }))
      }

      // Si se activa el toggle de pago con tarjeta de crédito, limpiar el presupuesto y pago de deuda
      if (name === 'isCreditCardPayment' && checked) {
        setFormData(prev => ({
          ...prev,
          isCreditCardPayment: true,
          presupuestoId: '',
          isDebtPayment: false,
          debtId: ''
        }))
      }

      // Si se desactiva el toggle de pago con tarjeta de crédito, limpiar la tarjeta seleccionada
      if (name === 'isCreditCardPayment' && !checked) {
        setFormData(prev => ({
          ...prev,
          isCreditCardPayment: false,
          creditCardId: ''
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
    const ahorros = transactions
      .filter(tx => tx.tipo === 'ahorro')
      .reduce((sum, tx) => sum + tx.monto, 0)
    return { ingresos, egresos, ahorros, balance: ingresos - egresos - ahorros }
  }

  const totals = calculateTotals()

  // Funciones de debug
  const handleDeleteAllTransactions = async () => {
    if (window.confirm('⚠️ ¿Estás seguro de que quieres eliminar TODAS las transacciones? Esta acción es IRREVERSIBLE.')) {
      try {
        setIsLoading(true)
        
        // Primero obtener todas las transacciones para saber qué revertir
        const allTransactionsResponse = await api.getTransactions()
        const allTransactions = allTransactionsResponse.transactions || []
        
        // Eliminar todas las transacciones usando el endpoint DELETE /transactions/all
        await api.deleteAllTransactions()
        
        // Agrupar por cuenta bancaria y presupuesto para calcular cambios
        const balanceChanges: Record<string, number> = {}
        const budgetChanges: Record<string, number> = {}
        
        allTransactions.forEach((tx: any) => {
          // Calcular cambios de balance
          if (!balanceChanges[tx.bank_account_id]) {
            balanceChanges[tx.bank_account_id] = 0
          }
          
          if (tx.type === 'ingreso') {
            balanceChanges[tx.bank_account_id] -= parseFloat(tx.amount.toString())
          } else if (tx.type === 'egreso' || tx.type === 'ahorro') {
            balanceChanges[tx.bank_account_id] += parseFloat(tx.amount.toString())
          }
          
          // Calcular cambios de presupuesto
          if (tx.budget_id) {
            if (!budgetChanges[tx.budget_id]) {
              budgetChanges[tx.budget_id] = 0
            }
            budgetChanges[tx.budget_id] -= parseFloat(tx.amount.toString())
          }
        })
        
        // Aplicar cambios de balance
        for (const [accountId, change] of Object.entries(balanceChanges)) {
          try {
            const accountResponse = await api.getBankAccounts(accountId)
            if (accountResponse.accounts && accountResponse.accounts.length > 0) {
              const account = accountResponse.accounts[0]
              const currentBalance = parseFloat(account.balance.original.amount)
              await api.updateBankAccount(accountId, {
                balance: currentBalance + change
              })
            }
          } catch (err: any) {
            console.error(`Error al actualizar balance de cuenta ${accountId}:`, err)
          }
        }
        
        // Actualizar presupuestos afectados
        for (const [budgetId, change] of Object.entries(budgetChanges)) {
          try {
            const budgetResponse = await api.getBudgets(budgetId)
            if (budgetResponse.budgets && budgetResponse.budgets.length > 0) {
              const budget = budgetResponse.budgets[0]
              const currentTotalSpent = parseFloat(budget.total_spent.toString())
              // El backend requiere name o max_amount, así que incluimos el name del presupuesto
              await api.updateBudget(budgetId, {
                name: budget.name,
                total_spent: Math.max(0, currentTotalSpent + change)
              })
            }
          } catch (err: any) {
            console.error(`Error al actualizar presupuesto ${budgetId}:`, err)
          }
        }
        
        await reloadTransactions()
        setIsDebugModalOpen(false)
        alert('Frontend says: Todas las transacciones han sido eliminadas exitosamente.')
      } catch (err: any) {
        console.error('Error al eliminar todas las transacciones:', err)
        const errorMessage = err.data?.error
          ? `Backend says: ${err.data.error}`
          : 'Frontend says: Error al eliminar todas las transacciones. Por favor, intenta de nuevo.'
        alert(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleCreateDemoIncomes = async () => {
    if (accounts.length === 0) {
      alert('Frontend says: No hay cuentas bancarias disponibles. Crea al menos una cuenta primero.')
      return
    }

    const demoIncomes = [
      { description: 'Salario mensual', category: 'Salario', amount: 3000000, date: new Date().toISOString().split('T')[0] },
      { description: 'Freelance proyecto', category: 'Trabajo', amount: 500000, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { description: 'Venta de artículo', category: 'Ventas', amount: 200000, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { description: 'Bonificación', category: 'Bonos', amount: 300000, date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { description: 'Reembolso', category: 'Reembolsos', amount: 150000, date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
    ]

    try {
      setIsLoading(true)
      const accountId = accounts[0].id
      
      // Obtener cuenta bancaria para actualizar balance
      const bankAccountResponse = await api.getBankAccounts(accountId)
      let currentBalance = 0
      if (bankAccountResponse.accounts && bankAccountResponse.accounts.length > 0) {
        currentBalance = parseFloat(bankAccountResponse.accounts[0].balance.original.amount)
      }
      
      let totalAmount = 0
      for (const income of demoIncomes) {
        await api.createTransaction({
          date: income.date,
          type: 'ingreso',
          amount: income.amount,
          description: income.description,
          category: income.category,
          currency: 'COP',
          bank_account_id: accountId
        })
        totalAmount += income.amount
      }
      
      // Actualizar balance manualmente
      await api.updateBankAccount(accountId, {
        balance: currentBalance + totalAmount
      })
      
      await reloadTransactions()
      setIsDebugModalOpen(false)
      alert(`Frontend says: ${demoIncomes.length} ingresos demo creados exitosamente.`)
    } catch (err: any) {
      console.error('Error al crear ingresos demo:', err)
      const errorMessage = err.data?.error
        ? `Backend says: ${err.data.error}`
        : 'Frontend says: Error al crear ingresos demo. Por favor, intenta de nuevo.'
      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateDemoExpenses = async () => {
    if (accounts.length === 0) {
      alert('Frontend says: No hay cuentas bancarias disponibles. Crea al menos una cuenta primero.')
      return
    }

    const demoExpenses = [
      { description: 'Supermercado', category: 'Compras', amount: 250000, date: new Date().toISOString().split('T')[0] },
      { description: 'Gasolina', category: 'Transporte', amount: 80000, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { description: 'Restaurante', category: 'Comida', amount: 120000, date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { description: 'Servicios públicos', category: 'Servicios', amount: 150000, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { description: 'Farmacia', category: 'Salud', amount: 60000, date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
    ]

    try {
      setIsLoading(true)
      const accountId = accounts[0].id
      
      // Obtener cuenta bancaria para actualizar balance
      const bankAccountResponse = await api.getBankAccounts(accountId)
      let currentBalance = 0
      if (bankAccountResponse.accounts && bankAccountResponse.accounts.length > 0) {
        currentBalance = parseFloat(bankAccountResponse.accounts[0].balance.original.amount)
      }
      
      let totalAmount = 0
      for (const expense of demoExpenses) {
        await api.createTransaction({
          date: expense.date,
          type: 'egreso',
          amount: expense.amount,
          description: expense.description,
          category: expense.category,
          currency: 'COP',
          bank_account_id: accountId
        })
        totalAmount += expense.amount
      }
      
      // Actualizar balance manualmente
      await api.updateBankAccount(accountId, {
        balance: currentBalance - totalAmount
      })
      
      await reloadTransactions()
      setIsDebugModalOpen(false)
      alert(`Frontend says: ${demoExpenses.length} egresos demo creados exitosamente.`)
    } catch (err: any) {
      console.error('Error al crear egresos demo:', err)
      const errorMessage = err.data?.error
        ? `Backend says: ${err.data.error}`
        : 'Frontend says: Error al crear egresos demo. Por favor, intenta de nuevo.'
      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateDemoCreditCardPayments = async () => {
    if (accounts.length === 0) {
      alert('Frontend says: No hay cuentas bancarias disponibles. Crea al menos una cuenta primero.')
      return
    }
    if (creditCards.length === 0) {
      alert('Frontend says: No hay tarjetas de crédito disponibles. Crea al menos una tarjeta primero.')
      return
    }

    const demoPayments = [
      { description: 'Compra con tarjeta - Tienda', category: 'Compras', amount: 150000, date: new Date().toISOString().split('T')[0] },
      { description: 'Compra con tarjeta - Online', category: 'Compras', amount: 200000, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { description: 'Compra con tarjeta - Emergencia', category: 'Emergencias', amount: 300000, date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
    ]

    try {
      setIsLoading(true)
      const accountId = accounts[0].id
      const card = creditCards[0]
      
      // Obtener cuenta bancaria para actualizar balance
      const bankAccountResponse = await api.getBankAccounts(accountId)
      let currentBalance = 0
      if (bankAccountResponse.accounts && bankAccountResponse.accounts.length > 0) {
        currentBalance = parseFloat(bankAccountResponse.accounts[0].balance.original.amount)
      }
      
      let totalAmount = 0
      let currentCupoUsado = card.cupoUsado
      
      for (const payment of demoPayments) {
        await api.createTransaction({
          date: payment.date,
          type: 'egreso',
          amount: payment.amount,
          description: payment.description,
          category: payment.category,
          currency: 'COP',
          bank_account_id: accountId
        })
        totalAmount += payment.amount
        currentCupoUsado += payment.amount
      }

      // Actualizar balance manualmente
      await api.updateBankAccount(accountId, {
        balance: currentBalance - totalAmount
      })

      // Actualizar cupo usado de la tarjeta
      await api.updateCreditCard(card.id, {
        used_credit: currentCupoUsado
      })

      // Buscar y actualizar deuda asociada si existe
      const associatedDebt = debts.find(d => d.concepto === card.nombre)
      if (associatedDebt) {
        const nuevoAdeudado = associatedDebt.adeudado + totalAmount
        await api.updateDebt(associatedDebt.id, {
          owed: nuevoAdeudado
        })
      }
      
      // Recargar datos
      await reloadTransactions()
      window.dispatchEvent(new Event('debtsUpdated'))
      setIsDebugModalOpen(false)
      alert(`Frontend says: ${demoPayments.length} egresos con pago de tarjeta demo creados exitosamente.`)
    } catch (err: any) {
      console.error('Error al crear egresos con tarjeta demo:', err)
      const errorMessage = err.data?.error
        ? `Backend says: ${err.data.error}`
        : 'Frontend says: Error al crear egresos con tarjeta demo. Por favor, intenta de nuevo.'
      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateDemoDebtPayments = async () => {
    if (accounts.length === 0) {
      alert('Frontend says: No hay cuentas bancarias disponibles. Crea al menos una cuenta primero.')
      return
    }
    if (debts.length === 0) {
      alert('Frontend says: No hay deudas disponibles. Crea al menos una deuda primero.')
      return
    }

    const demoPayments = [
      { description: 'Pago de deuda', category: 'Pago de Deuda', amount: 200000, date: new Date().toISOString().split('T')[0] },
      { description: 'Pago parcial de deuda', category: 'Pago de Deuda', amount: 150000, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
    ]

    try {
      setIsLoading(true)
      const accountId = accounts[0].id
      const debt = debts[0]
      
      // Obtener cuenta bancaria para actualizar balance
      const bankAccountResponse = await api.getBankAccounts(accountId)
      let currentBalance = 0
      if (bankAccountResponse.accounts && bankAccountResponse.accounts.length > 0) {
        currentBalance = parseFloat(bankAccountResponse.accounts[0].balance.original.amount)
      }
      
      let totalAmount = 0
      let currentAdeudado = debt.adeudado
      
      for (const payment of demoPayments) {
        await api.createTransaction({
          date: payment.date,
          type: 'egreso',
          amount: payment.amount,
          description: payment.description,
          category: payment.category,
          currency: 'COP',
          bank_account_id: accountId
        })
        totalAmount += payment.amount
        currentAdeudado = Math.max(0, currentAdeudado - payment.amount)
      }

      // Actualizar balance manualmente
      await api.updateBankAccount(accountId, {
        balance: currentBalance - totalAmount
      })

      // Actualizar monto adeudado
      await api.updateDebt(debt.id, {
        owed: currentAdeudado
      })
      
      // Recargar datos
      await reloadTransactions()
      window.dispatchEvent(new Event('debtsUpdated'))
      setIsDebugModalOpen(false)
      alert(`Frontend says: ${demoPayments.length} egresos con pago de deuda demo creados exitosamente.`)
    } catch (err: any) {
      console.error('Error al crear egresos con deuda demo:', err)
      const errorMessage = err.data?.error
        ? `Backend says: ${err.data.error}`
        : 'Frontend says: Error al crear egresos con deuda demo. Por favor, intenta de nuevo.'
      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateDemoSavings = async () => {
    if (accounts.length === 0) {
      alert('Frontend says: No hay cuentas bancarias disponibles. Crea al menos una cuenta primero.')
      return
    }
    if (projectBudgets.length === 0) {
      alert('Frontend says: No hay presupuestos asociados a proyectos. Crea al menos un proyecto primero.')
      return
    }

    const demoSavings = [
      { amount: 500000, date: new Date().toISOString().split('T')[0] },
      { amount: 300000, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { amount: 400000, date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
    ]

    try {
      setIsLoading(true)
      const accountId = accounts[0].id
      const budgetId = projectBudgets[0].id
      
      // Obtener cuenta bancaria y presupuesto para actualizar balances
      const bankAccountResponse = await api.getBankAccounts(accountId)
      let currentBalance = 0
      if (bankAccountResponse.accounts && bankAccountResponse.accounts.length > 0) {
        currentBalance = parseFloat(bankAccountResponse.accounts[0].balance.original.amount)
      }
      
      const budgetResponse = await api.getBudgets(budgetId)
      let currentTotalSpent = 0
      if (budgetResponse.budgets && budgetResponse.budgets.length > 0) {
        currentTotalSpent = parseFloat(budgetResponse.budgets[0].total_spent.toString())
      }
      
      // Obtener proyecto asociado al presupuesto
      const projectsResponse = await api.getProjects()
      let projectToUpdate: any = null
      let currentProjectAmount = 0
      
      if (projectsResponse.projects && Array.isArray(projectsResponse.projects)) {
        projectToUpdate = projectsResponse.projects.find((p: any) => p.budget_id === budgetId)
        if (projectToUpdate) {
          currentProjectAmount = parseFloat(projectToUpdate.current_amount?.toString() || '0')
        }
      }
      
      let totalAmount = 0
      for (const saving of demoSavings) {
        await api.createTransaction({
          date: saving.date,
          type: 'ahorro',
          amount: saving.amount,
          description: 'Ahorro para proyecto',
          category: 'Ahorro',
          currency: 'COP',
          bank_account_id: accountId,
          budget_id: budgetId
        })
        totalAmount += saving.amount
      }
      
      // Actualizar balance manualmente
      await api.updateBankAccount(accountId, {
        balance: currentBalance - totalAmount
      })
      
      // Actualizar total_spent del presupuesto usando recalculate
      await api.recalculateBudget(budgetId)
      
      // Actualizar current_amount del proyecto si existe
      if (projectToUpdate) {
        const newProjectAmount = currentProjectAmount + totalAmount
        await api.updateProject(projectToUpdate.id, {
          current_amount: newProjectAmount
        })
        window.dispatchEvent(new Event('projectsUpdated'))
      }
      
      await reloadTransactions()
      setIsDebugModalOpen(false)
      alert(`Frontend says: ${demoSavings.length} ahorros demo creados exitosamente.`)
    } catch (err: any) {
      console.error('Error al crear ahorros demo:', err)
      const errorMessage = err.data?.error
        ? `Backend says: ${err.data.error}`
        : 'Frontend says: Error al crear ahorros demo. Por favor, intenta de nuevo.'
      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

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
                <div className="summary-item total-balance">
                  <span className="summary-label">Balance</span>
                  <span className={`summary-value ${totals.balance >= 0 ? 'positive' : 'negative'}`}>
                    {formatBalance(totals.balance, 'COP')}
                  </span>
                </div>
                <div className="summary-separator"></div>
                <div className="summary-item">
                  <span className="summary-label">Ahorro</span>
                  <span className="summary-value savings">{formatBalance(totals.ahorros, 'COP')}</span>
                </div>
              </div>

              <div className="transacciones-header">
                <button className="add-transaction-button" onClick={handleOpenModal}>
                  <AddIcon />
                  <span>Agregar Transacción</span>
                </button>
                <button className="debug-button" onClick={() => setIsDebugModalOpen(true)} title="Debug: Opciones de desarrollo">
                  🐛 Debug
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
                    const isAhorro = transaction.tipo === 'ahorro'
                    const transactionClass = isIngreso ? 'income' : isAhorro ? 'savings' : 'expense'
                    return (
                      <div 
                        key={transaction.id} 
                        className={`transaction-item ${transactionClass}`}
                      >
                        <div className="transaction-icon-wrapper">
                          <div className={`transaction-icon ${transactionClass}`}>
                            {isIngreso ? <ArrowUpwardIcon /> : isAhorro ? <SwapHorizIcon /> : <ArrowDownwardIcon />}
                          </div>
                        </div>
                        <div className="transaction-content">
                          <div className="transaction-header">
                            <h3 className="transaction-description">{transaction.descripcion}</h3>
                            <span className={`transaction-amount ${transactionClass}`}>
                              {isIngreso ? '+' : isAhorro ? '💰' : '-'}{formatBalance(transaction.monto, transaction.moneda)}
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
                  <option value="ahorro">Ahorro</option>
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
              {formData.tipo !== 'ahorro' && (
                <>
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
                </>
              )}
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
              {formData.tipo === 'egreso' && (
                <div className="form-group checkbox-group">
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
                      Los pagos con tarjeta de crédito son para casos de emergencia y no para lujos o minipréstamos. 
                      No están presupuestados y el abuso de ellos puede llevar a la quiebra.
                    </p>
                  </div>
                </div>
              )}

              {formData.tipo === 'egreso' && formData.isCreditCardPayment && creditCards.length > 0 && (
                <div className="form-group">
                  <label htmlFor="creditCardId">Tarjeta de Crédito</label>
                  <select
                    id="creditCardId"
                    name="creditCardId"
                    value={formData.creditCardId}
                    onChange={handleChange}
                    required
                    className={formErrors.creditCardId ? 'input-error form-select' : 'form-select'}
                  >
                    <option value="">Selecciona una tarjeta</option>
                    {creditCards.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.nombre} ({card.banco}) - Disponible: {formatBalance(card.cupoDisponible, formData.moneda)}
                      </option>
                    ))}
                  </select>
                  {formErrors.creditCardId && (
                    <span className="error-message">{formErrors.creditCardId}</span>
                  )}
                </div>
              )}

              {(!formData.isCreditCardPayment || formData.tipo === 'ahorro') && (
                <div className="form-group">
                  <label htmlFor="cuentaBancariaId">Cuenta Bancaria</label>
                  {accounts.filter((account) => account.currency === formData.moneda).length === 0 ? (
                    <div className="no-accounts-message">
                      <p>No hay cuentas bancarias disponibles en {formData.moneda}. Por favor, crea una cuenta en esta divisa primero.</p>
                    </div>
                  ) : (
                    <select
                      id="cuentaBancariaId"
                      name="cuentaBancariaId"
                      value={formData.cuentaBancariaId}
                      onChange={handleChange}
                      required
                      className={formErrors.cuentaBancariaId ? 'input-error form-select' : 'form-select'}
                    >
                      <option value="">Selecciona una cuenta</option>
                      {accounts
                        .filter((account) => account.currency === formData.moneda)
                        .map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.nombre} ({account.currency})
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
                      <label htmlFor="presupuestoId">Presupuesto (Opcional)</label>
                      <select
                        id="presupuestoId"
                        name="presupuestoId"
                        value={formData.presupuestoId}
                        onChange={handleChange}
                        className={formErrors.presupuestoId ? 'input-error form-select' : 'form-select'}
                      >
                        <option value="">Selecciona un presupuesto (opcional)</option>
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

              {formData.tipo === 'ahorro' && (
                <>
                  <div className="form-group">
                    <label htmlFor="presupuestoId-ahorro">Presupuesto del Proyecto *</label>
                    <select
                      id="presupuestoId-ahorro"
                      name="presupuestoId"
                      value={formData.presupuestoId}
                      onChange={handleChange}
                      required
                      className={formErrors.presupuestoId ? 'input-error form-select' : 'form-select'}
                    >
                      <option value="">Selecciona un presupuesto asociado a un proyecto</option>
                      {projectBudgets.map((budget) => (
                        <option key={budget.id} value={budget.id}>
                          {budget.nombre}
                        </option>
                      ))}
                    </select>
                    {formErrors.presupuestoId && (
                      <span className="error-message">{formErrors.presupuestoId}</span>
                    )}
                    {projectBudgets.length === 0 && (
                      <p className="form-hint" style={{ color: 'rgba(255, 193, 7, 0.8)', marginTop: '0.5rem' }}>
                        ⚠️ No hay presupuestos asociados a proyectos. Crea un proyecto primero para poder registrar ahorros.
                      </p>
                    )}
                  </div>
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

      {/* Modal de Debug */}
      {isDebugModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDebugModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Debug - Transacciones</h2>
              <button className="modal-close" onClick={() => setIsDebugModalOpen(false)}>×</button>
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
                    <p className="debug-option-description">Crea 5 ingresos de ejemplo para pruebas</p>
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
                    <p className="debug-option-description">Crea 5 egresos de ejemplo para pruebas</p>
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
                    <p className="debug-option-description">Crea 3 egresos con pago de tarjeta de crédito</p>
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
                    <p className="debug-option-description">Crea 3 ahorros de ejemplo para pruebas</p>
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
                    <p className="debug-option-description">⚠️ PELIGROSO: Elimina todas las transacciones (IRREVERSIBLE)</p>
                  </div>
                </button>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="modal-button cancel" onClick={() => setIsDebugModalOpen(false)}>
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

