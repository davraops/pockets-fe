import './AppPage.css'
import './Finanzas.css'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import CalculateIcon from '@mui/icons-material/Calculate'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import CurrencyBitcoinIcon from '@mui/icons-material/CurrencyBitcoin'
import SavingsIcon from '@mui/icons-material/Savings'
import DesignServicesIcon from '@mui/icons-material/DesignServices'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import AddIcon from '@mui/icons-material/Add'
import SyncIcon from '@mui/icons-material/Sync'
import { api } from '../services/api'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import { devError } from '../utils/debugTools'
import { sectionColor } from '../constants/sectionColors'
import ListSkeleton from '../components/ListSkeleton'

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

function Finanzas() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [statsWarning, setStatsWarning] = useState<string | null>(null)
  const [failedSources, setFailedSources] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({
    totalCuentasCOP: 0,
    totalDeudas: 0,
    totalCupoCredito: 0,
    totalCreditoDisponible: 0,
    numeroSubscripciones: 0,
    totalTransacciones: 0,
    porcentajePresupuestos: 0,
    totalPresupuestado: 0,
    totalIngresos: 0,
    totalEgresos: 0,
    tarjetasFisicas: 0,
    tarjetasVirtuales: 0,
    numeroProyectos: 0,
    porcentajeCompletacionProyectos: 0,
    totalMeDeben: 0,
    numeroCDTs: 0,
    totalValorCDTs: 0,
    numeroWallets: 0,
    numeroPosicionesCripto: 0,
  })

  const loadStats = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    setStatsWarning(null)

    const requests = [
      { key: 'accounts', label: 'Cuentas', fetch: () => api.getBankAccounts() },
      { key: 'debts', label: 'Deudas', fetch: () => api.getDebts() },
      { key: 'creditCards', label: 'Tarjetas de crédito', fetch: () => api.getCreditCards() },
      { key: 'subscriptions', label: 'Subscripciones', fetch: () => api.getSubscriptions() },
      { key: 'transactions', label: 'Transacciones', fetch: () => api.getTransactions({}) },
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

      // Calcular total en cuentas COP
      const totalCuentasCOP =
        accountsRes?.accounts?.reduce((sum: number, acc: any) => {
          return sum + (acc.balance?.cop?.amount || 0)
        }, 0) || 0

      // Calcular total de deudas
      const totalDeudas =
        debtsRes?.debts?.reduce((sum: number, debt: any) => {
          return sum + (debt.owed || 0)
        }, 0) || 0

      // Calcular total cupo de crédito y disponible
      const totalCupoCredito =
        creditCardsRes?.credit_cards?.reduce((sum: number, card: any) => {
          return sum + (card.credit_limit || 0)
        }, 0) || 0

      const totalCreditoDisponible =
        creditCardsRes?.credit_cards?.reduce((sum: number, card: any) => {
          return sum + (card.available_credit || 0)
        }, 0) || 0

      // Contar subscripciones
      const numeroSubscripciones = subscriptionsRes?.subscriptions?.length || 0

      // Contar transacciones
      const totalTransacciones = transactionsRes?.transactions?.length || 0

      const { start: monthStart, end: monthEnd } = getCurrentMonthDateRange()
      const monthTransactions =
        transactionsRes?.transactions?.filter((tx: any) => isDateInRange(tx.date, monthStart, monthEnd)) ||
        []

      // Ingresos y egresos del mes en curso
      const totalIngresos =
        monthTransactions
          .filter((tx: any) => tx.type === 'ingreso')
          .reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0) || 0

      const totalEgresos =
        monthTransactions
          .filter((tx: any) => tx.type === 'egreso')
          .reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0) || 0

      // Calcular porcentaje de presupuestos y total presupuestado
      let totalPresupuestado = 0
      let totalUsado = 0
      if (budgetsRes?.budgets && Array.isArray(budgetsRes.budgets)) {
        budgetsRes.budgets.forEach((budget: any) => {
          totalPresupuestado += budget.amount || 0
          totalUsado += budget.used_amount || 0
        })
      }
      const porcentajePresupuestos =
        totalPresupuestado > 0 ? (totalUsado / totalPresupuestado) * 100 : 0

      // Calcular tarjetas físicas y virtuales
      const tarjetasFisicas = cardsRes?.cards?.filter((card: any) => !card.is_virtual).length || 0
      const tarjetasVirtuales = cardsRes?.cards?.filter((card: any) => card.is_virtual).length || 0

      // Calcular proyectos y porcentaje de completación promedio
      const numeroProyectos = projectsRes?.projects?.length || 0
      let porcentajeCompletacionProyectos = 0
      if (projectsRes?.projects && Array.isArray(projectsRes.projects) && projectsRes.projects.length > 0) {
        const totalPorcentaje = projectsRes.projects.reduce((sum: number, project: any) => {
          return sum + (project.progress_percentage || 0)
        }, 0)
        porcentajeCompletacionProyectos = totalPorcentaje / projectsRes.projects.length
      }

      // Calcular total que me deben
      const totalMeDeben =
        debtorsRes?.debtors?.reduce((sum: number, debtor: any) => {
          const pendiente = (debtor.value || 0) - (debtor.total_paid || 0)
          return sum + Math.max(0, pendiente)
        }, 0) || 0

      const numeroCDTs = cdtsRes?.cdts?.length || 0
      const totalValorCDTs =
        cdtsRes?.cdts?.reduce((sum: number, cdt: any) => sum + (cdt.value || 0), 0) || 0
      const numeroWallets = walletsRes?.wallets?.length || 0
      const numeroPosicionesCripto = cryptocurrenciesRes?.cryptocurrencies?.length || 0

      setStats({
        totalCuentasCOP,
        totalDeudas,
        totalCupoCredito,
        totalCreditoDisponible,
        numeroSubscripciones,
        totalTransacciones,
        porcentajePresupuestos,
        totalPresupuestado,
        totalIngresos,
        totalEgresos,
        tarjetasFisicas,
        tarjetasVirtuales,
        numeroProyectos,
        porcentajeCompletacionProyectos,
        totalMeDeben,
        numeroCDTs,
        totalValorCDTs,
        numeroWallets,
        numeroPosicionesCripto,
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
    loadStats()
  }, [loadStats])

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const statSubtitle = (source: string, value: string) => {
    if (failedSources.has(source)) {
      return 'No disponible'
    }
    return value
  }

  const statSubtitleClass = (source: string) =>
    failedSources.has(source) ? 'crud-row-subtitle crud-row-subtitle--unavailable' : 'crud-row-subtitle'

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide hub-page-content finanzas-content">
        {isLoading ? (
          <>
            <div className="app-toolbar">
              <button
                className="app-toolbar-button"
                onClick={() => navigate('/')}
                aria-label="Volver al inicio"
                type="button"
              >
                <ArrowBackIcon className="app-toolbar-icon" />
              </button>
            </div>
            <h1 className="app-page-title">Finanzas</h1>
            <ListSkeleton
              variant="summary-card"
              count={2}
              className="skeleton-list-summary-card finanzas-summary-skeleton"
              aria-label="Cargando resumen financiero"
            />
            <div className="crud-hub-list">
              <div className="crud-hub-section">
                <div className="crud-hub-section-header">Cuentas y Presupuestos</div>
                <div className="glass-group">
                  <ListSkeleton variant="hub-row" count={3} aria-label="Cargando secciones" />
                </div>
              </div>
              <div className="crud-hub-section">
                <div className="crud-hub-section-header">Tarjetas y Pagos</div>
                <div className="glass-group">
                  <ListSkeleton variant="hub-row" count={4} />
                </div>
              </div>
            </div>
          </>
        ) : loadError ? (
          <>
            <div className="app-toolbar">
              <button
                className="app-toolbar-button"
                onClick={() => navigate('/')}
                aria-label="Volver al inicio"
                type="button"
              >
                <ArrowBackIcon className="app-toolbar-icon" />
              </button>
            </div>
            <h1 className="app-page-title">Finanzas</h1>
            <div className="loader-container">
              <div className="loader finanzas-stats-error-panel">
                <p className="finanzas-stats-error" role="alert">
                  {loadError}
                </p>
                <button
                  type="button"
                  className="btn-base btn-secondary finanzas-stats-retry-button"
                  onClick={loadStats}
                  aria-label="Reintentar cargar estadísticas"
                >
                  <SyncIcon aria-hidden="true" />
                  <span>Reintentar</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Toolbar - HIG: Navigation */}
            <div className="app-toolbar">
              <button
                className="app-toolbar-button"
                onClick={() => navigate('/')}
                aria-label="Volver al inicio"
                type="button"
              >
                <ArrowBackIcon className="app-toolbar-icon" />
              </button>
            </div>

            {/* Encabezado de Sección - HIG: Clear Navigation */}
            <h1 className="app-page-title">Finanzas</h1>

            {statsWarning && (
              <div className="finanzas-stats-warning" role="status" aria-live="polite">
                <p>{statsWarning}</p>
                <button
                  type="button"
                  className="btn-base btn-secondary finanzas-stats-retry-button finanzas-stats-retry-button-inline"
                  onClick={loadStats}
                  aria-label="Reintentar cargar estadísticas"
                >
                  <SyncIcon aria-hidden="true" />
                  <span>Reintentar</span>
                </button>
              </div>
            )}

            {/* Resumen — contexto antes del CTA */}
            <section className="hub-summary" aria-label="Resumen financiero">
              <div className="hub-summary-cards">
                <div className="hub-summary-card hub-summary-card-primary">
                  <div
                    className="hub-summary-icon"
                    style={{ '--section-color': sectionColor.finanzas } as React.CSSProperties}
                    aria-hidden="true"
                  >
                    <AccountBalanceWalletIcon />
                  </div>
                  <div className="hub-summary-content">
                    <span className="hub-summary-label">Balance disponible</span>
                    <span
                      className={`hub-summary-value${failedSources.has('accounts') ? ' hub-summary-value-unavailable' : ''}`}
                    >
                      {statSubtitle('accounts', formatPrice(stats.totalCuentasCOP))}
                    </span>
                  </div>
                </div>

                <div className="hub-summary-card hub-summary-card-secondary">
                  <div className="hub-summary-row">
                    <div className="hub-summary-item">
                      <span className="hub-summary-label-small">Ingresos (mes)</span>
                      <span
                        className={`hub-summary-value-small hub-summary-positive${failedSources.has('transactions') ? ' hub-summary-value-unavailable' : ''}`}
                      >
                        {statSubtitle('transactions', formatPrice(stats.totalIngresos))}
                      </span>
                    </div>
                    <div className="hub-summary-item">
                      <span className="hub-summary-label-small">Egresos (mes)</span>
                      <span
                        className={`hub-summary-value-small hub-summary-negative${failedSources.has('transactions') ? ' hub-summary-value-unavailable' : ''}`}
                      >
                        {statSubtitle('transactions', formatPrice(stats.totalEgresos))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <button
              className="btn-base btn-accent btn-block btn-submit hub-primary-cta"
              onClick={() => navigate('/finanzas/transacciones', { state: { openModal: true } })}
              aria-label="Agregar transacción"
              type="button"
            >
              <AddIcon aria-hidden={true} />
              Agregar transacción
            </button>

            {/* Lista de módulos */}
            <div className="crud-hub-list">
              {/* Sección: Cuentas y Presupuestos */}
              <div className="crud-hub-section">
                <div className="crud-hub-section-header">Cuentas y Presupuestos</div>
                <div className="glass-group">
                  <button
                    className="crud-hub-row"
                    onClick={() => navigate('/finanzas/cuentas')}
                    aria-label={`Ir a Cuentas. Balance: ${formatPrice(stats.totalCuentasCOP)}`}
                    type="button"
                  >
                    <div
                      className="crud-hub-row-icon"
                      style={{ '--section-color': sectionColor.finanzas } as React.CSSProperties}
                      aria-hidden="true"
                    >
                      <AccountBalanceWalletIcon />
                    </div>
                    <div className="crud-row-content">
                      <span className="crud-row-title">Cuentas</span>
                      <span className={statSubtitleClass('accounts')}>
                        {statSubtitle('accounts', formatPrice(stats.totalCuentasCOP))}
                      </span>
                    </div>
                    <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
                  </button>

                  <button
                    className="crud-hub-row"
                    onClick={() => navigate('/finanzas/presupuestos')}
                    aria-label={`Ir a Presupuestos. Uso: ${formatPercentage(stats.porcentajePresupuestos)}`}
                    type="button"
                  >
                    <div
                      className="crud-hub-row-icon"
                      style={{ '--section-color': sectionColor.blue } as React.CSSProperties}
                      aria-hidden="true"
                    >
                      <CalculateIcon />
                    </div>
                    <div className="crud-row-content">
                      <span className="crud-row-title">Presupuestos</span>
                      <span className={statSubtitleClass('budgets')}>
                        {statSubtitle('budgets', `${formatPercentage(stats.porcentajePresupuestos)} usado`)}
                      </span>
                    </div>
                    <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
                  </button>

                  <button
                    className="crud-hub-row"
                    onClick={() => navigate('/finanzas/diseñador-presupuestos')}
                    aria-label="Ir a Diseñador de Presupuestos"
                    type="button"
                  >
                    <div
                      className="crud-hub-row-icon"
                      style={{ '--section-color': sectionColor.purple } as React.CSSProperties}
                      aria-hidden="true"
                    >
                      <DesignServicesIcon />
                    </div>
                    <div className="crud-row-content">
                      <span className="crud-row-title">Diseñador de Presupuestos</span>
                      <span className="crud-row-subtitle">
                        Diseña tus presupuestos
                      </span>
                    </div>
                    <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Sección: Transacciones */}
              <div className="crud-hub-section">
                <div className="crud-hub-section-header">Transacciones</div>
                <div className="glass-group">
                  <button
                    className="crud-hub-row"
                    onClick={() => navigate('/finanzas/transacciones')}
                    aria-label={`Ir a Transacciones. Total: ${stats.totalTransacciones}`}
                    type="button"
                  >
                    <div
                      className="crud-hub-row-icon"
                      style={{ '--section-color': sectionColor.lifestyle } as React.CSSProperties}
                      aria-hidden="true"
                    >
                      <SwapHorizIcon />
                    </div>
                    <div className="crud-row-content">
                      <span className="crud-row-title">Transacciones</span>
                      <span className={statSubtitleClass('transactions')}>
                        {statSubtitle('transactions', `${stats.totalTransacciones} registros`)}
                      </span>
                    </div>
                    <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
                  </button>

                  <button
                    className="crud-hub-row"
                    onClick={() => navigate('/finanzas/listas-mercado')}
                    aria-label="Ir a Listas de Mercado"
                    type="button"
                  >
                    <div
                      className="crud-hub-row-icon"
                      style={{ '--section-color': sectionColor.finanzas } as React.CSSProperties}
                      aria-hidden="true"
                    >
                      <ShoppingCartIcon />
                    </div>
                    <div className="crud-row-content">
                      <span className="crud-row-title">Listas de Mercado</span>
                      <span className="crud-row-subtitle">
                        Gestiona tus compras
                      </span>
                    </div>
                    <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="crud-hub-section">
                <div className="crud-hub-section-header">Crédito, cripto y ahorro</div>
                <div className="glass-group">
                  <button
                    className="crud-hub-row"
                    onClick={() => navigate('/finanzas/credito')}
                    aria-label={`Ir a Crédito y pagos. Deudas: ${formatPrice(stats.totalDeudas)}`}
                    type="button"
                  >
                    <div
                      className="crud-hub-row-icon"
                      style={{ '--section-color': sectionColor.danger } as React.CSSProperties}
                      aria-hidden="true"
                    >
                      <CreditCardIcon />
                    </div>
                    <div className="crud-row-content">
                      <span className="crud-row-title">Crédito y pagos</span>
                      <span className={statSubtitleClass('debts')}>
                        {statSubtitle(
                          'debts',
                          `${formatPrice(stats.totalDeudas)} deudas · ${stats.numeroSubscripciones} subscripciones`
                        )}
                      </span>
                    </div>
                    <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
                  </button>

                  <button
                    className="crud-hub-row"
                    onClick={() => navigate('/finanzas/cripto')}
                    aria-label={`Ir a Criptomonedas. ${stats.numeroWallets} wallets`}
                    type="button"
                  >
                    <div
                      className="crud-hub-row-icon"
                      style={{ '--section-color': sectionColor.bitcoin } as React.CSSProperties}
                      aria-hidden="true"
                    >
                      <CurrencyBitcoinIcon />
                    </div>
                    <div className="crud-row-content">
                      <span className="crud-row-title">Criptomonedas</span>
                      <span className={statSubtitleClass('wallets')}>
                        {statSubtitle(
                          'wallets',
                          `${stats.numeroWallets} wallet${stats.numeroWallets !== 1 ? 's' : ''} · ${stats.numeroPosicionesCripto} posición${stats.numeroPosicionesCripto !== 1 ? 'es' : ''}`
                        )}
                      </span>
                    </div>
                    <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
                  </button>

                  <button
                    className="crud-hub-row"
                    onClick={() => navigate('/finanzas/ahorro')}
                    aria-label="Ir a Ahorro e inflación"
                    type="button"
                  >
                    <div
                      className="crud-hub-row-icon"
                      style={{ '--section-color': sectionColor.blue } as React.CSSProperties}
                      aria-hidden="true"
                    >
                      <SavingsIcon />
                    </div>
                    <div className="crud-row-content">
                      <span className="crud-row-title">Ahorro e inflación</span>
                      <span className={statSubtitleClass('cdts')}>
                        {statSubtitle(
                          'cdts',
                          stats.numeroCDTs > 0
                            ? `${stats.numeroCDTs} CDT${stats.numeroCDTs !== 1 ? 's' : ''} · inflación`
                            : 'CDTs e inflación'
                        )}
                      </span>
                    </div>
                    <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Sección: Actividad */}
              <div className="crud-hub-section">
                <div className="crud-hub-section-header">Actividad</div>
                <div className="glass-group">
                  <button
                    className="crud-hub-row"
                    onClick={() => navigate('/finanzas/proyectos')}
                    aria-label={`Ir a Proyectos. ${stats.numeroProyectos} proyectos, ${formatPercentage(stats.porcentajeCompletacionProyectos)} completado`}
                    type="button"
                  >
                    <div
                      className="crud-hub-row-icon"
                      style={{ '--section-color': sectionColor.teal } as React.CSSProperties}
                      aria-hidden="true"
                    >
                      <FolderSpecialIcon />
                    </div>
                    <div className="crud-row-content">
                      <span className="crud-row-title">Proyectos</span>
                      <span className={statSubtitleClass('projects')}>
                        {statSubtitle(
                          'projects',
                          `${stats.numeroProyectos} proyecto${stats.numeroProyectos !== 1 ? 's' : ''}, ${formatPercentage(stats.porcentajeCompletacionProyectos)} completado`
                        )}
                      </span>
                    </div>
                    <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
                  </button>

                  <button
                    className="crud-hub-row"
                    onClick={() => navigate('/finanzas/me-deben')}
                    aria-label={`Ir a Me Deben. Total pendiente: ${formatPrice(stats.totalMeDeben)}`}
                    type="button"
                  >
                    <div
                      className="crud-hub-row-icon"
                      style={{ '--section-color': sectionColor.cyan } as React.CSSProperties}
                      aria-hidden="true"
                    >
                      <PersonAddIcon />
                    </div>
                    <div className="crud-row-content">
                      <span className="crud-row-title">Me Deben</span>
                      <span className={statSubtitleClass('debtors')}>
                        {statSubtitle('debtors', `${formatPrice(stats.totalMeDeben)} pendiente`)}
                      </span>
                    </div>
                    <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Finanzas
