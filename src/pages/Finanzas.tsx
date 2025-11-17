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
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
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
    totalEgresos: 0
  })

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true)
      try {
        // Cargar todos los datos en paralelo
        const [accountsRes, debtsRes, creditCardsRes, subscriptionsRes, transactionsRes, budgetsRes] = await Promise.all([
          api.getBankAccounts(),
          api.getDebts(),
          api.getCreditCards(),
          api.getSubscriptions(),
          api.getTransactions({}),
          api.getBudgets()
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
          totalEgresos
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
            {/* Minicards de estadísticas */}
            <div className="stats-grid">
              {/* Finanzas Básicas */}
              <div className="stat-card" onClick={() => navigate('/finanzas/cuentas')}>
                <div className="stat-icon" style={{ backgroundColor: '#34C759' }}>
                  <AccountBalanceWalletIcon />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total en Cuentas (COP)</span>
                  <span className="stat-value">{formatPrice(stats.totalCuentasCOP)}</span>
                </div>
              </div>

              <div className="stat-card" onClick={() => navigate('/finanzas/transacciones')}>
                <div className="stat-icon" style={{ backgroundColor: '#34C759' }}>
                  <SwapHorizIcon />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total Ingresos</span>
                  <span className="stat-value">{formatPrice(stats.totalIngresos)}</span>
                </div>
              </div>

              <div className="stat-card" onClick={() => navigate('/finanzas/transacciones')}>
                <div className="stat-icon" style={{ backgroundColor: '#FF3B30' }}>
                  <SwapHorizIcon />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total Egresos</span>
                  <span className="stat-value">{formatPrice(stats.totalEgresos)}</span>
                </div>
              </div>

              {/* Presupuestos */}
              <div className="stat-card" onClick={() => navigate('/finanzas/presupuestos')}>
                <div className="stat-icon" style={{ backgroundColor: '#007AFF' }}>
                  <CalculateIcon />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total Presupuestado</span>
                  <span className="stat-value">{formatPrice(stats.totalPresupuestado)}</span>
                </div>
              </div>

              <div className="stat-card" onClick={() => navigate('/finanzas/presupuestos')}>
                <div className="stat-icon" style={{ backgroundColor: '#007AFF' }}>
                  <CalculateIcon />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Porcentaje Presupuestos</span>
                  <span className="stat-value">{formatPercentage(stats.porcentajePresupuestos)}</span>
                </div>
              </div>

              {/* Deudas y Crédito */}
              <div className="stat-card" onClick={() => navigate('/finanzas/deudas')}>
                <div className="stat-icon" style={{ backgroundColor: '#FF3B30' }}>
                  <CreditCardIcon />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total en Deudas</span>
                  <span className="stat-value">{formatPrice(stats.totalDeudas)}</span>
                </div>
              </div>

              <div className="stat-card" onClick={() => navigate('/finanzas/tarjetas-credito')}>
                <div className="stat-icon" style={{ backgroundColor: '#FF2D55' }}>
                  <CreditCardIcon />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total Cupo de Crédito</span>
                  <span className="stat-value">{formatPrice(stats.totalCupoCredito)}</span>
                </div>
              </div>

              <div className="stat-card" onClick={() => navigate('/finanzas/tarjetas-credito')}>
                <div className="stat-icon" style={{ backgroundColor: '#FF2D55' }}>
                  <CreditCardIcon />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total Crédito Disponible</span>
                  <span className="stat-value">{formatPrice(stats.totalCreditoDisponible)}</span>
                </div>
              </div>

              {/* Actividad */}
              <div className="stat-card" onClick={() => navigate('/finanzas/subscripciones')}>
                <div className="stat-icon" style={{ backgroundColor: '#AF52DE' }}>
                  <CardMembershipIcon />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Número de Subscripciones</span>
                  <span className="stat-value">{stats.numeroSubscripciones}</span>
                </div>
              </div>

              <div className="stat-card" onClick={() => navigate('/finanzas/transacciones')}>
                <div className="stat-icon" style={{ backgroundColor: '#FF9500' }}>
                  <SwapHorizIcon />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total de Transacciones</span>
                  <span className="stat-value">{stats.totalTransacciones}</span>
                </div>
              </div>
            </div>

            {/* Grid de iconos de navegación */}
            <div className="apps-grid">
              {financeItems.map((item) => {
                const IconComponent = item.Icon
                return (
                  <div 
                    key={item.id} 
                    className="app-icon" 
                    style={{ '--app-color': item.color } as React.CSSProperties}
                    onClick={() => item.path && navigate(item.path)}
                  >
                    <div className="app-icon-wrapper">
                      <div className="app-icon-bg" style={{ backgroundColor: item.color }}>
                        <IconComponent className="app-material-icon" />
                      </div>
                    </div>
                    <span className="app-name">{item.title}</span>
                  </div>
                )
              })}
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

