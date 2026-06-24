import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import { devError } from '../utils/debugTools'

export interface FinanzasRecentTransaction {
  id: string
  description: string
  amount: number
  type: 'ingreso' | 'egreso' | 'ahorro'
  date: string
}

export interface FinanzasBudgetAtRisk {
  id: string
  name: string
  percentUsed: number
}

export interface FinanzasHubStats {
  totalCuentasCOP: number
  totalDeudas: number
  totalCupoCredito: number
  totalCreditoDisponible: number
  numeroSubscripciones: number
  transaccionesMes: number
  porcentajePresupuestos: number
  totalPresupuestado: number
  totalIngresos: number
  totalEgresos: number
  monthNet: number
  tarjetasFisicas: number
  tarjetasVirtuales: number
  numeroProyectos: number
  porcentajeCompletacionProyectos: number
  totalMeDeben: number
  numeroCDTs: number
  totalValorCDTs: number
  numeroWallets: number
  numeroPosicionesCripto: number
  recentTransactions: FinanzasRecentTransaction[]
  budgetsAtRisk: FinanzasBudgetAtRisk[]
}

const emptyStats: FinanzasHubStats = {
  totalCuentasCOP: 0,
  totalDeudas: 0,
  totalCupoCredito: 0,
  totalCreditoDisponible: 0,
  numeroSubscripciones: 0,
  transaccionesMes: 0,
  porcentajePresupuestos: 0,
  totalPresupuestado: 0,
  totalIngresos: 0,
  totalEgresos: 0,
  monthNet: 0,
  tarjetasFisicas: 0,
  tarjetasVirtuales: 0,
  numeroProyectos: 0,
  porcentajeCompletacionProyectos: 0,
  totalMeDeben: 0,
  numeroCDTs: 0,
  totalValorCDTs: 0,
  numeroWallets: 0,
  numeroPosicionesCripto: 0,
  recentTransactions: [],
  budgetsAtRisk: [],
}

function getCurrentMonthDateRange(): { start: string; end: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const monthStr = String(month + 1).padStart(2, '0')
  const lastDay = new Date(year, month + 1, 0).getDate()
  return {
    start: `${year}-${monthStr}-01`,
    end: `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`,
  }
}

function isDateInRange(dateStr: string, start: string, end: string): boolean {
  const date = dateStr.split('T')[0]
  return date >= start && date <= end
}

export function getCurrentMonthLabel(): string {
  const label = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function useFinanzasHubStats() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [statsWarning, setStatsWarning] = useState<string | null>(null)
  const [failedSources, setFailedSources] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState<FinanzasHubStats>(emptyStats)

  const loadStats = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    setStatsWarning(null)

    const { start: monthStart, end: monthEnd } = getCurrentMonthDateRange()

    const requests = [
      { key: 'accounts', label: 'Cuentas', fetch: () => api.getBankAccounts() },
      { key: 'debts', label: 'Deudas', fetch: () => api.getDebts() },
      { key: 'creditCards', label: 'Tarjetas de crédito', fetch: () => api.getCreditCards() },
      { key: 'subscriptions', label: 'Subscripciones', fetch: () => api.getSubscriptions() },
      { key: 'transactions', label: 'Transacciones', fetch: () => api.getTransactions({ start_date: monthStart, end_date: monthEnd }) },
      { key: 'budgets', label: 'Presupuestos', fetch: () => api.getBudgets() },
      { key: 'cards', label: 'Tarjetas débito', fetch: () => api.getCards() },
      { key: 'projects', label: 'Proyectos', fetch: () => api.getProjects() },
      { key: 'debtors', label: 'Me deben', fetch: () => api.getDebtors() },
      { key: 'cdts', label: 'CDTs', fetch: () => api.getCDTs() },
      { key: 'wallets', label: 'Cripto wallets', fetch: () => api.getWallets() },
      { key: 'cryptocurrencies', label: 'Mi Cripto', fetch: () => api.getCryptocurrencies() },
    ] as const

    try {
      const results = await Promise.allSettled(requests.map(request => request.fetch()))
      const failedLabels: string[] = []
      const failed = new Set<string>()

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          failedLabels.push(requests[index].label)
          failed.add(requests[index].key)
          devError(`Error al cargar ${requests[index].label}:`, result.reason)
        }
      })

      setFailedSources(failed)

      if (failedLabels.length === requests.length) {
        const firstError = results.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined
        setLoadError(
          getTranslatedErrorMessage(
            firstError?.reason,
            'No se pudieron cargar las estadísticas. Por favor, intenta de nuevo.'
          )
        )
        return
      }

      if (failedLabels.length > 0) {
        setStatsWarning(
          `No se pudieron actualizar: ${failedLabels.join(', ')}. Los totales mostrados pueden estar incompletos.`
        )
      }

      const [
        accountsRes,
        debtsRes,
        creditCardsRes,
        subscriptionsRes,
        transactionsRes,
        budgetsRes,
        cardsRes,
        projectsRes,
        debtorsRes,
        cdtsRes,
        walletsRes,
        cryptocurrenciesRes,
      ] = results.map(result => (result.status === 'fulfilled' ? result.value : null))

      const totalCuentasCOP =
        accountsRes?.accounts?.reduce((sum: number, acc: { balance?: { cop?: { amount?: number } } }) => {
          return sum + (acc.balance?.cop?.amount || 0)
        }, 0) || 0

      const totalDeudas =
        debtsRes?.debts?.reduce((sum: number, debt: { owed?: number }) => sum + (debt.owed || 0), 0) || 0

      const totalCupoCredito =
        creditCardsRes?.credit_cards?.reduce(
          (sum: number, card: { credit_limit?: number }) => sum + (card.credit_limit || 0),
          0
        ) || 0

      const totalCreditoDisponible =
        creditCardsRes?.credit_cards?.reduce(
          (sum: number, card: { available_credit?: number }) => sum + (card.available_credit || 0),
          0
        ) || 0

      const numeroSubscripciones = subscriptionsRes?.subscriptions?.length || 0

      const monthTransactions =
        transactionsRes?.transactions?.filter((tx: { date: string }) =>
          isDateInRange(tx.date, monthStart, monthEnd)
        ) || []

      const transaccionesMes = monthTransactions.length

      const totalIngresos = monthTransactions
        .filter((tx: { type: string }) => tx.type === 'ingreso')
        .reduce((sum: number, tx: { amount?: number }) => sum + (tx.amount || 0), 0)

      const totalEgresos = monthTransactions
        .filter((tx: { type: string }) => tx.type === 'egreso')
        .reduce((sum: number, tx: { amount?: number }) => sum + (tx.amount || 0), 0)

      let totalPresupuestado = 0
      let totalUsado = 0
      const budgetsAtRisk: FinanzasBudgetAtRisk[] = []

      if (budgetsRes?.budgets && Array.isArray(budgetsRes.budgets)) {
        budgetsRes.budgets.forEach((budget: { id: string; name?: string; category?: string; amount?: number; used_amount?: number }) => {
          const amount = budget.amount || 0
          const used = budget.used_amount || 0
          totalPresupuestado += amount
          totalUsado += used
          const percentUsed = amount > 0 ? (used / amount) * 100 : 0
          if (percentUsed >= 80) {
            budgetsAtRisk.push({
              id: budget.id,
              name: budget.name || budget.category || 'Presupuesto',
              percentUsed,
            })
          }
        })
      }

      budgetsAtRisk.sort((a, b) => b.percentUsed - a.percentUsed)

      const porcentajePresupuestos = totalPresupuestado > 0 ? (totalUsado / totalPresupuestado) * 100 : 0

      const tarjetasFisicas =
        cardsRes?.cards?.filter((card: { is_virtual?: boolean }) => !card.is_virtual).length || 0
      const tarjetasVirtuales =
        cardsRes?.cards?.filter((card: { is_virtual?: boolean }) => card.is_virtual).length || 0

      const numeroProyectos = projectsRes?.projects?.length || 0
      let porcentajeCompletacionProyectos = 0
      if (projectsRes?.projects && Array.isArray(projectsRes.projects) && projectsRes.projects.length > 0) {
        const totalPorcentaje = projectsRes.projects.reduce(
          (sum: number, project: { progress_percentage?: number }) =>
            sum + (project.progress_percentage || 0),
          0
        )
        porcentajeCompletacionProyectos = totalPorcentaje / projectsRes.projects.length
      }

      const totalMeDeben =
        debtorsRes?.debtors?.reduce((sum: number, debtor: { value?: number; total_paid?: number }) => {
          const pendiente = (debtor.value || 0) - (debtor.total_paid || 0)
          return sum + Math.max(0, pendiente)
        }, 0) || 0

      const numeroCDTs = cdtsRes?.cdts?.length || 0
      const totalValorCDTs =
        cdtsRes?.cdts?.reduce((sum: number, cdt: { value?: number }) => sum + (cdt.value || 0), 0) || 0
      const numeroWallets = walletsRes?.wallets?.length || 0
      const numeroPosicionesCripto = cryptocurrenciesRes?.cryptocurrencies?.length || 0

      const recentTransactions: FinanzasRecentTransaction[] = [...monthTransactions]
        .sort((a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date))
        .slice(0, 5)
        .map((tx: { id: string; description: string; amount: number; type: 'ingreso' | 'egreso' | 'ahorro'; date: string }) => ({
          id: tx.id,
          description: tx.description,
          amount: tx.amount,
          type: tx.type,
          date: tx.date.split('T')[0],
        }))

      setStats({
        totalCuentasCOP,
        totalDeudas,
        totalCupoCredito,
        totalCreditoDisponible,
        numeroSubscripciones,
        transaccionesMes,
        porcentajePresupuestos,
        totalPresupuestado,
        totalIngresos,
        totalEgresos,
        monthNet: totalIngresos - totalEgresos,
        tarjetasFisicas,
        tarjetasVirtuales,
        numeroProyectos,
        porcentajeCompletacionProyectos,
        totalMeDeben,
        numeroCDTs,
        totalValorCDTs,
        numeroWallets,
        numeroPosicionesCripto,
        recentTransactions,
        budgetsAtRisk: budgetsAtRisk.slice(0, 4),
      })
    } catch (err) {
      devError('Error al cargar estadísticas:', err)
      setLoadError(
        getTranslatedErrorMessage(
          err,
          'No se pudieron cargar las estadísticas. Por favor, intenta de nuevo.'
        )
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  return {
    isLoading,
    loadError,
    statsWarning,
    failedSources,
    stats,
    loadStats,
  }
}
