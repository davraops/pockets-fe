import '../App.css'
import './AppPage.css'
import './Finanzas.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import CalculateIcon from '@mui/icons-material/Calculate'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import PaymentIcon from '@mui/icons-material/Payment'
import CardMembershipIcon from '@mui/icons-material/CardMembership'
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import AddIcon from '@mui/icons-material/Add'
import { api } from '../services/api'
import type { SvgIconProps } from '@mui/material'

interface FinanceItem {
  id: string
  title: string
  Icon: React.ComponentType<SvgIconProps>
  color: string
  path?: string
}

const financeItems: FinanceItem[] = [
  {
    id: '1',
    title: 'Cuentas',
    Icon: AccountBalanceWalletIcon,
    color: '#34C759',
    path: '/finanzas/cuentas'
  },
  {
    id: '2',
    title: 'Presupuestos',
    Icon: CalculateIcon,
    color: '#007AFF',
    path: '/finanzas/presupuestos'
  },
  {
    id: '3',
    title: 'Transacciones',
    Icon: SwapHorizIcon,
    color: '#FF9500',
    path: '/finanzas/transacciones'
  },
  {
    id: '4',
    title: 'Deudas',
    Icon: CreditCardIcon,
    color: '#FF3B30',
    path: '/finanzas/deudas'
  },
  {
    id: '5',
    title: 'Tarjetas Débito',
    Icon: PaymentIcon,
    color: '#5856D6',
    path: '/finanzas/tarjetas-debito'
  },
  {
    id: '6',
    title: 'Subscripciones',
    Icon: CardMembershipIcon,
    color: '#AF52DE',
    path: '/finanzas/subscripciones'
  },
  {
    id: '7',
    title: 'Tarjetas Crédito',
    Icon: CreditCardIcon,
    color: '#FF2D55',
    path: '/finanzas/tarjetas-credito'
  },
  {
    id: '8',
    title: 'Proyectos',
    Icon: FolderSpecialIcon,
    color: '#00C7BE',
    path: '/finanzas/proyectos'
  },
  {
    id: '9',
    title: 'Me Deben',
    Icon: PersonAddIcon,
    color: '#5AC8FA',
    path: '/finanzas/me-deben'
  }
]

function Finanzas() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
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
    totalMeDeben: 0
  })

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true)
      try {
        // Cargar todos los datos en paralelo
        const [accountsRes, debtsRes, creditCardsRes, subscriptionsRes, transactionsRes, budgetsRes, cardsRes, projectsRes, debtorsRes] = await Promise.all([
          api.getBankAccounts(),
          api.getDebts(),
          api.getCreditCards(),
          api.getSubscriptions(),
          api.getTransactions({}),
          api.getBudgets(),
          api.getCards(),
          api.getProjects(),
          api.getDebtors()
        ])

        // Calcular total en cuentas COP
        const totalCuentasCOP = accountsRes.accounts?.reduce((sum: number, acc: any) => {
          return sum + (acc.balance?.cop?.amount || 0)
        }, 0) || 0

        // Calcular total de deudas
        const totalDeudas = debtsRes.debts?.reduce((sum: number, debt: any) => {
          return sum + (debt.owed || 0)
        }, 0) || 0

        // Calcular total cupo de crédito y disponible
        const totalCupoCredito = creditCardsRes.credit_cards?.reduce((sum: number, card: any) => {
          return sum + (card.credit_limit || 0)
        }, 0) || 0

        const totalCreditoDisponible = creditCardsRes.credit_cards?.reduce((sum: number, card: any) => {
          return sum + (card.available_credit || 0)
        }, 0) || 0

        // Contar subscripciones
        const numeroSubscripciones = subscriptionsRes.subscriptions?.length || 0

        // Contar transacciones
        const totalTransacciones = transactionsRes.transactions?.length || 0

        // Calcular totales de ingresos y egresos
        const totalIngresos = transactionsRes.transactions?.filter((tx: any) => tx.type === 'ingreso')
          .reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0) || 0

        const totalEgresos = transactionsRes.transactions?.filter((tx: any) => tx.type === 'egreso')
          .reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0) || 0

        // Calcular porcentaje de presupuestos y total presupuestado
        let totalPresupuestado = 0
        let totalUsado = 0
        if (budgetsRes.budgets && Array.isArray(budgetsRes.budgets)) {
          budgetsRes.budgets.forEach((budget: any) => {
            totalPresupuestado += budget.amount || 0
            totalUsado += budget.used_amount || 0
          })
        }
        const porcentajePresupuestos = totalPresupuestado > 0 
          ? (totalUsado / totalPresupuestado) * 100 
          : 0

        // Calcular tarjetas físicas y virtuales
        const tarjetasFisicas = cardsRes.cards?.filter((card: any) => !card.is_virtual).length || 0
        const tarjetasVirtuales = cardsRes.cards?.filter((card: any) => card.is_virtual).length || 0

        // Calcular proyectos y porcentaje de completación promedio
        const numeroProyectos = projectsRes.projects?.length || 0
        let porcentajeCompletacionProyectos = 0
        if (projectsRes.projects && Array.isArray(projectsRes.projects) && projectsRes.projects.length > 0) {
          const totalPorcentaje = projectsRes.projects.reduce((sum: number, project: any) => {
            return sum + (project.progress_percentage || 0)
          }, 0)
          porcentajeCompletacionProyectos = totalPorcentaje / projectsRes.projects.length
        }

        // Calcular total que me deben
        const totalMeDeben = debtorsRes.debtors?.reduce((sum: number, debtor: any) => {
          const pendiente = (debtor.value || 0) - (debtor.total_paid || 0)
          return sum + Math.max(0, pendiente) // Solo sumar si hay pendiente positivo
        }, 0) || 0

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
          totalMeDeben
        })
      } catch (err) {
        console.error('Error al cargar estadísticas:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <div className="app-page-container">
      <div className="app-page-content finanzas-content">
        {isLoading ? (
          <div className="loader-container">
            <div className="loader">
              <div className="loader-spinner"></div>
              <p className="loader-text">Cargando estadísticas...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Toolbar - HIG: Navigation */}
            <div className="finanzas-toolbar">
              <button
                className="finanzas-toolbar-button"
                onClick={() => navigate('/')}
                aria-label="Volver al inicio"
                type="button"
              >
                <ArrowBackIcon className="finanzas-toolbar-icon" />
              </button>
            </div>

            {/* Encabezado de Sección - HIG: Clear Navigation */}
            <h1 className="finanzas-page-title">Finanzas</h1>

            {/* Botón Principal - Agregar Transacción - HIG: Prominent Action */}
            <button
              className="finanzas-add-transaction-button"
              onClick={() => navigate('/finanzas/transacciones', { state: { openModal: true } })}
              aria-label="Agregar Transacción"
              type="button"
            >
              <AddIcon className="finanzas-add-transaction-icon" />
              <span className="finanzas-add-transaction-text">Agregar Transacción</span>
            </button>

            {/* Resumen Principal - HIG: Visual Hierarchy */}
            <section className="finanzas-summary" aria-label="Resumen financiero">
              <div className="summary-cards">
                <div className="summary-card summary-card-primary">
                  <div className="summary-icon" style={{ backgroundColor: '#34C759' }} aria-hidden="true">
                    <AccountBalanceWalletIcon />
                  </div>
                  <div className="summary-content">
                    <span className="summary-label">Balance Disponible</span>
                    <span className="summary-value">{formatPrice(stats.totalCuentasCOP)}</span>
                  </div>
                </div>

                <div className="summary-card summary-card-secondary">
                  <div className="summary-row">
                    <div className="summary-item">
                      <span className="summary-label-small">Ingresos</span>
                      <span className="summary-value-small summary-positive">{formatPrice(stats.totalIngresos)}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label-small">Egresos</span>
                      <span className="summary-value-small summary-negative">{formatPrice(stats.totalEgresos)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Lista de Opciones estilo iOS Settings - HIG: Clear Navigation */}
            <div className="settings-list">
              {/* Sección: Cuentas y Presupuestos */}
              <div className="settings-section">
                <div className="settings-section-header">Cuentas y Presupuestos</div>
                <div className="settings-group">
                  <button
                    className="settings-row"
                    onClick={() => navigate('/finanzas/cuentas')}
                    aria-label={`Ir a Cuentas. Balance: ${formatPrice(stats.totalCuentasCOP)}`}
                    type="button"
                  >
                    <div className="settings-row-icon" style={{ backgroundColor: '#34C759' }} aria-hidden="true">
                      <AccountBalanceWalletIcon />
                    </div>
                    <div className="settings-row-content">
                      <span className="settings-row-title">Cuentas</span>
                      <span className="settings-row-subtitle">{formatPrice(stats.totalCuentasCOP)}</span>
                    </div>
                    <ChevronRightIcon className="settings-row-chevron" aria-hidden="true" />
                  </button>

                  <button
                    className="settings-row"
                    onClick={() => navigate('/finanzas/presupuestos')}
                    aria-label={`Ir a Presupuestos. Uso: ${formatPercentage(stats.porcentajePresupuestos)}`}
                    type="button"
                  >
                    <div className="settings-row-icon" style={{ backgroundColor: '#007AFF' }} aria-hidden="true">
                      <CalculateIcon />
                    </div>
                    <div className="settings-row-content">
                      <span className="settings-row-title">Presupuestos</span>
                      <span className="settings-row-subtitle">{formatPercentage(stats.porcentajePresupuestos)} usado</span>
                    </div>
                    <ChevronRightIcon className="settings-row-chevron" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Sección: Transacciones */}
              <div className="settings-section">
                <div className="settings-section-header">Transacciones</div>
                <div className="settings-group">
                  <button
                    className="settings-row"
                    onClick={() => navigate('/finanzas/transacciones')}
                    aria-label={`Ir a Transacciones. Total: ${stats.totalTransacciones}`}
                    type="button"
                  >
                    <div className="settings-row-icon" style={{ backgroundColor: '#FF9500' }} aria-hidden="true">
                      <SwapHorizIcon />
                    </div>
                    <div className="settings-row-content">
                      <span className="settings-row-title">Transacciones</span>
                      <span className="settings-row-subtitle">{stats.totalTransacciones} registros</span>
                    </div>
                    <ChevronRightIcon className="settings-row-chevron" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Sección: Crédito y Deudas */}
              <div className="settings-section">
                <div className="settings-section-header">Crédito y Deudas</div>
                <div className="settings-group">
                  <button
                    className="settings-row"
                    onClick={() => navigate('/finanzas/deudas')}
                    aria-label={`Ir a Deudas. Total: ${formatPrice(stats.totalDeudas)}`}
                    type="button"
                  >
                    <div className="settings-row-icon" style={{ backgroundColor: '#FF3B30' }} aria-hidden="true">
                      <CreditCardIcon />
                    </div>
                    <div className="settings-row-content">
                      <span className="settings-row-title">Deudas</span>
                      <span className="settings-row-subtitle">{formatPrice(stats.totalDeudas)}</span>
                    </div>
                    <ChevronRightIcon className="settings-row-chevron" aria-hidden="true" />
                  </button>

                  <button
                    className="settings-row"
                    onClick={() => navigate('/finanzas/tarjetas-credito')}
                    aria-label={`Ir a Tarjetas de Crédito. Disponible: ${formatPrice(stats.totalCreditoDisponible)}`}
                    type="button"
                  >
                    <div className="settings-row-icon" style={{ backgroundColor: '#FF2D55' }} aria-hidden="true">
                      <CreditCardIcon />
                    </div>
                    <div className="settings-row-content">
                      <span className="settings-row-title">Tarjetas de Crédito</span>
                      <span className="settings-row-subtitle">{formatPrice(stats.totalCreditoDisponible)} disponible</span>
                    </div>
                    <ChevronRightIcon className="settings-row-chevron" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Sección: Tarjetas y Subscripciones */}
              <div className="settings-section">
                <div className="settings-section-header">Tarjetas y Subscripciones</div>
                <div className="settings-group">
                  <button
                    className="settings-row"
                    onClick={() => navigate('/finanzas/tarjetas-debito')}
                    aria-label={`Ir a Tarjetas de Débito. ${stats.tarjetasFisicas} físicas, ${stats.tarjetasVirtuales} virtuales`}
                    type="button"
                  >
                    <div className="settings-row-icon" style={{ backgroundColor: '#5856D6' }} aria-hidden="true">
                      <PaymentIcon />
                    </div>
                    <div className="settings-row-content">
                      <span className="settings-row-title">Tarjetas de Débito</span>
                      <span className="settings-row-subtitle">
                        {stats.tarjetasFisicas} física{stats.tarjetasFisicas !== 1 ? 's' : ''}, {stats.tarjetasVirtuales} virtual{stats.tarjetasVirtuales !== 1 ? 'es' : ''}
                      </span>
                    </div>
                    <ChevronRightIcon className="settings-row-chevron" aria-hidden="true" />
                  </button>

                  <button
                    className="settings-row"
                    onClick={() => navigate('/finanzas/subscripciones')}
                    aria-label={`Ir a Subscripciones. Total: ${stats.numeroSubscripciones}`}
                    type="button"
                  >
                    <div className="settings-row-icon" style={{ backgroundColor: '#AF52DE' }} aria-hidden="true">
                      <CardMembershipIcon />
                    </div>
                    <div className="settings-row-content">
                      <span className="settings-row-title">Subscripciones</span>
                      <span className="settings-row-subtitle">{stats.numeroSubscripciones} activas</span>
                    </div>
                    <ChevronRightIcon className="settings-row-chevron" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Sección: Actividad */}
              <div className="settings-section">
                <div className="settings-section-header">Actividad</div>
                <div className="settings-group">
                  <button
                    className="settings-row"
                    onClick={() => navigate('/finanzas/proyectos')}
                    aria-label={`Ir a Proyectos. ${stats.numeroProyectos} proyectos, ${formatPercentage(stats.porcentajeCompletacionProyectos)} completado`}
                    type="button"
                  >
                    <div className="settings-row-icon" style={{ backgroundColor: '#00C7BE' }} aria-hidden="true">
                      <FolderSpecialIcon />
                    </div>
                    <div className="settings-row-content">
                      <span className="settings-row-title">Proyectos</span>
                      <span className="settings-row-subtitle">
                        {stats.numeroProyectos} proyecto{stats.numeroProyectos !== 1 ? 's' : ''}, {formatPercentage(stats.porcentajeCompletacionProyectos)} completado
                      </span>
                    </div>
                    <ChevronRightIcon className="settings-row-chevron" aria-hidden="true" />
                  </button>

                  <button
                    className="settings-row"
                    onClick={() => navigate('/finanzas/me-deben')}
                    aria-label={`Ir a Me Deben. Total pendiente: ${formatPrice(stats.totalMeDeben)}`}
                    type="button"
                  >
                    <div className="settings-row-icon" style={{ backgroundColor: '#5AC8FA' }} aria-hidden="true">
                      <PersonAddIcon />
                    </div>
                    <div className="settings-row-content">
                      <span className="settings-row-title">Me Deben</span>
                      <span className="settings-row-subtitle">{formatPrice(stats.totalMeDeben)} pendiente</span>
                    </div>
                    <ChevronRightIcon className="settings-row-chevron" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            {/* Botón de volver */}
            <div className="back-button-container">
              <button className="back-button" onClick={() => navigate('/')}>
                <ArrowBackIcon />
                <span>Volver al Inicio</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Finanzas

