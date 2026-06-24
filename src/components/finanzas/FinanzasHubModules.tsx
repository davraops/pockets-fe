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
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { sectionColor } from '../../constants/sectionColors'
import type { FinanzasHubStats } from '../../hooks/useFinanzasHubStats'

interface FinanzasHubModulesProps {
  stats: FinanzasHubStats
  formatPrice: (amount: number) => string
  formatPercentage: (value: number) => string
  statSubtitle: (source: string, value: string) => string
  statSubtitleClass: (source: string) => string
}

interface ModuleRow {
  id: string
  title: string
  subtitle: string
  subtitleClass?: string
  path: string
  Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  color: string
  ariaLabel: string
}

interface ModuleGroup {
  header: string
  rows: ModuleRow[]
}

function FinanzasHubModules({
  stats,
  formatPrice,
  formatPercentage,
  statSubtitle,
  statSubtitleClass,
}: FinanzasHubModulesProps) {
  const navigate = useNavigate()

  const groups: ModuleGroup[] = [
    {
      header: 'Cuentas',
      rows: [
        {
          id: 'cuentas',
          title: 'Cuentas',
          subtitle: statSubtitle('accounts', formatPrice(stats.totalCuentasCOP)),
          subtitleClass: statSubtitleClass('accounts'),
          path: '/finanzas/cuentas',
          Icon: AccountBalanceWalletIcon,
          color: sectionColor.finanzas,
          ariaLabel: `Ir a Cuentas. Balance: ${formatPrice(stats.totalCuentasCOP)}`,
        },
        {
          id: 'presupuestos',
          title: 'Presupuestos',
          subtitle: statSubtitle('budgets', `${formatPercentage(stats.porcentajePresupuestos)} usado`),
          subtitleClass: statSubtitleClass('budgets'),
          path: '/finanzas/presupuestos',
          Icon: CalculateIcon,
          color: sectionColor.blue,
          ariaLabel: `Ir a Presupuestos. Uso: ${formatPercentage(stats.porcentajePresupuestos)}`,
        },
        {
          id: 'disenador',
          title: 'Diseñador',
          subtitle: 'Diseña tus presupuestos',
          path: '/finanzas/diseñador-presupuestos',
          Icon: DesignServicesIcon,
          color: sectionColor.purple,
          ariaLabel: 'Ir a Diseñador de Presupuestos',
        },
      ],
    },
    {
      header: 'Operaciones',
      rows: [
        {
          id: 'transacciones',
          title: 'Transacciones',
          subtitle: statSubtitle('transactions', `${stats.transaccionesMes} este mes`),
          subtitleClass: statSubtitleClass('transactions'),
          path: '/finanzas/transacciones',
          Icon: SwapHorizIcon,
          color: sectionColor.lifestyle,
          ariaLabel: `Ir a Transacciones. ${stats.transaccionesMes} este mes`,
        },
        {
          id: 'listas',
          title: 'Listas de mercado',
          subtitle: 'Gestiona tus compras',
          path: '/finanzas/listas-mercado',
          Icon: ShoppingCartIcon,
          color: sectionColor.finanzas,
          ariaLabel: 'Ir a Listas de Mercado',
        },
      ],
    },
    {
      header: 'Crédito y ahorro',
      rows: [
        {
          id: 'credito',
          title: 'Crédito y pagos',
          subtitle: statSubtitle(
            'debts',
            `${formatPrice(stats.totalDeudas)} · ${stats.numeroSubscripciones} subs.`
          ),
          subtitleClass: statSubtitleClass('debts'),
          path: '/finanzas/credito',
          Icon: CreditCardIcon,
          color: sectionColor.danger,
          ariaLabel: `Ir a Crédito y pagos`,
        },
        {
          id: 'cripto',
          title: 'Criptomonedas',
          subtitle: statSubtitle(
            'wallets',
            `${stats.numeroWallets} wallets · ${stats.numeroPosicionesCripto} pos.`
          ),
          subtitleClass: statSubtitleClass('wallets'),
          path: '/finanzas/cripto',
          Icon: CurrencyBitcoinIcon,
          color: sectionColor.bitcoin,
          ariaLabel: 'Ir a Criptomonedas',
        },
        {
          id: 'ahorro',
          title: 'Ahorro e inflación',
          subtitle: statSubtitle(
            'cdts',
            stats.numeroCDTs > 0 ? `${stats.numeroCDTs} CDTs` : 'CDTs e inflación'
          ),
          subtitleClass: statSubtitleClass('cdts'),
          path: '/finanzas/ahorro',
          Icon: SavingsIcon,
          color: sectionColor.blue,
          ariaLabel: 'Ir a Ahorro e inflación',
        },
      ],
    },
    {
      header: 'Actividad',
      rows: [
        {
          id: 'proyectos',
          title: 'Proyectos',
          subtitle: statSubtitle(
            'projects',
            `${stats.numeroProyectos} · ${formatPercentage(stats.porcentajeCompletacionProyectos)}`
          ),
          subtitleClass: statSubtitleClass('projects'),
          path: '/finanzas/proyectos',
          Icon: FolderSpecialIcon,
          color: sectionColor.teal,
          ariaLabel: 'Ir a Proyectos',
        },
        {
          id: 'me-deben',
          title: 'Me deben',
          subtitle: statSubtitle('debtors', formatPrice(stats.totalMeDeben)),
          subtitleClass: statSubtitleClass('debtors'),
          path: '/finanzas/me-deben',
          Icon: PersonAddIcon,
          color: sectionColor.cyan,
          ariaLabel: `Ir a Me Deben. ${formatPrice(stats.totalMeDeben)}`,
        },
      ],
    },
  ]

  return (
    <nav className="finanzas-modules" aria-label="Módulos de Finanzas">
      {groups.map(group => (
        <section key={group.header} className="finanzas-modules-group">
          <h2 className="finanzas-modules-group-title">{group.header}</h2>
          <div className="glass-group">
            {group.rows.map(row => {
              const IconComponent = row.Icon
              return (
                <button
                  key={row.id}
                  type="button"
                  className="finanzas-module-row"
                  onClick={() => navigate(row.path)}
                  aria-label={row.ariaLabel}
                >
                  <div
                    className="finanzas-module-icon"
                    style={{ '--section-color': row.color } as React.CSSProperties}
                    aria-hidden="true"
                  >
                    <IconComponent />
                  </div>
                  <div className="finanzas-module-body">
                    <span className="finanzas-module-title">{row.title}</span>
                    <span className={row.subtitleClass ?? 'finanzas-module-sub'}>{row.subtitle}</span>
                  </div>
                  <ChevronRightIcon className="finanzas-feed-chevron" aria-hidden="true" />
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </nav>
  )
}

export default FinanzasHubModules
