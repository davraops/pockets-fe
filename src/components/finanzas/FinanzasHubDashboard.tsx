import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import AddIcon from '@mui/icons-material/Add'
import CalculateIcon from '@mui/icons-material/Calculate'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import ListSkeleton from '../ListSkeleton'
import { sectionColor } from '../../constants/sectionColors'
import type { FinanzasHubStats } from '../../hooks/useFinanzasHubStats'

interface FinanzasHubDashboardProps {
  stats: FinanzasHubStats
  failedSources: Set<string>
  isLoading: boolean
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatSignedPrice(amount: number): string {
  const prefix = amount > 0 ? '+' : amount < 0 ? '−' : ''
  return `${prefix}${formatPrice(Math.abs(amount))}`
}

function formatPercentage(value: number): string {
  return `${value.toFixed(0)}%`
}

function formatTxDate(date: string): string {
  const txDate = new Date(`${date}T12:00:00`)
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (txDate.toDateString() === today.toDateString()) return 'Hoy'
  if (txDate.toDateString() === yesterday.toDateString()) return 'Ayer'
  return txDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

function FinanzasHubDashboard({ stats, failedSources, isLoading }: FinanzasHubDashboardProps) {
  const navigate = useNavigate()
  const financeUnavailable = failedSources.has('accounts') || failedSources.has('transactions')

  const attentionItems = useMemo(() => {
    const items: Array<{
      id: string
      label: string
      detail: string
      path: string
      tone?: 'warning' | 'danger' | 'positive'
    }> = []

    stats.budgetsAtRisk.forEach(budget => {
      items.push({
        id: `budget-${budget.id}`,
        label: budget.name,
        detail: `${formatPercentage(budget.percentUsed)} usado`,
        path: '/finanzas/presupuestos',
        tone: budget.percentUsed >= 100 ? 'danger' : 'warning',
      })
    })

    if (!failedSources.has('debts') && stats.totalDeudas > 0) {
      items.push({
        id: 'debts',
        label: 'Deudas pendientes',
        detail: formatPrice(stats.totalDeudas),
        path: '/finanzas/deudas',
        tone: 'danger',
      })
    }

    if (!failedSources.has('creditCards') && stats.totalCupoCredito > 0) {
      const usedPercent =
        ((stats.totalCupoCredito - stats.totalCreditoDisponible) / stats.totalCupoCredito) * 100
      if (usedPercent >= 75) {
        items.push({
          id: 'credit',
          label: 'Cupo de crédito',
          detail: `${formatPercentage(usedPercent)} utilizado`,
          path: '/finanzas/tarjetas-credito',
          tone: 'warning',
        })
      }
    }

    if (!failedSources.has('debtors') && stats.totalMeDeben > 0) {
      items.push({
        id: 'debtors',
        label: 'Te deben',
        detail: formatPrice(stats.totalMeDeben),
        path: '/finanzas/me-deben',
        tone: 'positive',
      })
    }

    return items.slice(0, 5)
  }, [stats, failedSources])

  if (isLoading) {
    return (
      <div className="finanzas-dashboard" aria-label="Resumen financiero" aria-busy="true">
        <ListSkeleton variant="summary-card" count={1} className="finanzas-finance-skeleton" />
        <div className="finanzas-dashboard-panels">
          <ListSkeleton variant="hub-row" count={4} />
          <ListSkeleton variant="hub-row" count={3} />
        </div>
      </div>
    )
  }

  return (
    <div className="finanzas-dashboard" aria-label="Resumen financiero">
      <button
        type="button"
        className="finanzas-finance-hero"
        onClick={() => navigate('/finanzas/cuentas')}
        aria-label={
          financeUnavailable
            ? 'Cuentas. Datos no disponibles'
            : `Balance ${formatPrice(stats.totalCuentasCOP)}. Mes ${formatSignedPrice(stats.monthNet)}`
        }
      >
        <div
          className="finanzas-finance-hero-icon"
          style={{ '--section-color': sectionColor.finanzas } as React.CSSProperties}
          aria-hidden="true"
        >
          <AccountBalanceWalletIcon />
        </div>
        <div className="finanzas-finance-hero-body">
          <span className="finanzas-finance-hero-label">Balance disponible</span>
          <span
            className={`finanzas-finance-hero-value${financeUnavailable ? ' finanzas-dash-unavailable' : ''}`}
          >
            {failedSources.has('accounts')
              ? 'No disponible'
              : formatPrice(stats.totalCuentasCOP)}
          </span>
          {!financeUnavailable && (
            <div className="finanzas-finance-hero-stats">
              <span className="finanzas-finance-stat finanzas-finance-stat-positive">
                +{formatPrice(stats.totalIngresos)}
              </span>
              <span className="finanzas-finance-stat-sep" aria-hidden="true">
                /
              </span>
              <span className="finanzas-finance-stat finanzas-finance-stat-negative">
                −{formatPrice(stats.totalEgresos)}
              </span>
              <span className="finanzas-finance-stat-net">
                Neto {formatSignedPrice(stats.monthNet)}
              </span>
            </div>
          )}
        </div>
        <ChevronRightIcon className="finanzas-feed-chevron" aria-hidden="true" />
      </button>

      <div className="finanzas-quick-actions" role="group" aria-label="Acciones rápidas">
        <button
          type="button"
          className="btn-base btn-accent finanzas-quick-action"
          onClick={() => navigate('/finanzas/transacciones', { state: { openModal: true } })}
        >
          <AddIcon aria-hidden="true" />
          Transacción
        </button>
        <button
          type="button"
          className="btn-base btn-secondary finanzas-quick-action"
          onClick={() => navigate('/finanzas/presupuestos')}
        >
          <CalculateIcon aria-hidden="true" />
          Presupuestos
        </button>
        <button
          type="button"
          className="btn-base btn-secondary finanzas-quick-action"
          onClick={() => navigate('/finanzas/transacciones')}
        >
          <SwapHorizIcon aria-hidden="true" />
          Movimientos
        </button>
      </div>

      <div className="finanzas-dashboard-panels">
        <section className="finanzas-feed-panel" aria-labelledby="finanzas-tx-heading">
          <div className="finanzas-feed-panel-header">
            <h2 id="finanzas-tx-heading" className="finanzas-feed-panel-title">
              Movimientos del mes
            </h2>
            <button
              type="button"
              className="finanzas-feed-panel-link"
              onClick={() => navigate('/finanzas/transacciones')}
            >
              Ver todo
              <ChevronRightIcon aria-hidden="true" />
            </button>
          </div>
          <div className="finanzas-feed-list glass-group">
            {failedSources.has('transactions') && (
              <p className="finanzas-feed-empty finanzas-feed-error">
                No se pudieron cargar las transacciones
              </p>
            )}
            {!failedSources.has('transactions') && stats.recentTransactions.length === 0 && (
              <p className="finanzas-feed-empty">Sin movimientos este mes</p>
            )}
            {!failedSources.has('transactions') &&
              stats.recentTransactions.map(tx => (
                <button
                  key={tx.id}
                  type="button"
                  className="finanzas-feed-row"
                  onClick={() => navigate('/finanzas/transacciones')}
                  aria-label={`${tx.description}, ${formatPrice(tx.amount)}`}
                >
                  <span className="finanzas-feed-row-time">{formatTxDate(tx.date)}</span>
                  <span className="finanzas-feed-row-body">
                    <span className="finanzas-feed-row-title">{tx.description}</span>
                    <span
                      className={`finanzas-feed-row-amount finanzas-feed-row-amount-${tx.type}`}
                    >
                      {tx.type === 'ingreso' ? '+' : tx.type === 'egreso' ? '−' : ''}
                      {formatPrice(tx.amount)}
                    </span>
                  </span>
                  <ChevronRightIcon className="finanzas-feed-chevron" aria-hidden="true" />
                </button>
              ))}
          </div>
        </section>

        <section className="finanzas-feed-panel" aria-labelledby="finanzas-attention-heading">
          <div className="finanzas-feed-panel-header">
            <h2 id="finanzas-attention-heading" className="finanzas-feed-panel-title">
              Atención
            </h2>
            <button
              type="button"
              className="finanzas-feed-panel-link"
              onClick={() => navigate('/finanzas/credito')}
            >
              Crédito
              <ChevronRightIcon aria-hidden="true" />
            </button>
          </div>
          <div className="finanzas-feed-list glass-group">
            {attentionItems.length === 0 && (
              <p className="finanzas-feed-empty finanzas-feed-success">
                Sin alertas financieras
              </p>
            )}
            {attentionItems.map(item => (
              <button
                key={item.id}
                type="button"
                className={`finanzas-feed-row${item.tone ? ` finanzas-feed-row-${item.tone}` : ''}`}
                onClick={() => navigate(item.path)}
                aria-label={`${item.label}: ${item.detail}`}
              >
                <span
                  className="finanzas-feed-row-icon"
                  style={{ '--section-color': sectionColor.finanzas } as React.CSSProperties}
                  aria-hidden="true"
                >
                  {item.tone === 'danger' || item.id === 'credit' ? (
                    <CreditCardIcon />
                  ) : (
                    <CalculateIcon />
                  )}
                </span>
                <span className="finanzas-feed-row-body">
                  <span className="finanzas-feed-row-title">{item.label}</span>
                  <span className="finanzas-feed-row-sub">{item.detail}</span>
                </span>
                <ChevronRightIcon className="finanzas-feed-chevron" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default FinanzasHubDashboard
