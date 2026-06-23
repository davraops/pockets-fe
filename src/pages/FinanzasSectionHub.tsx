import './AppPage.css'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import PaymentIcon from '@mui/icons-material/Payment'
import CardMembershipIcon from '@mui/icons-material/CardMembership'
import CurrencyBitcoinIcon from '@mui/icons-material/CurrencyBitcoin'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import SavingsIcon from '@mui/icons-material/Savings'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import { sectionColor } from '../constants/sectionColors'

type FinanzasSectionId = 'credito' | 'cripto' | 'ahorro'

interface HubRow {
  title: string
  subtitle: string
  path: string
  Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  color: string
  ariaLabel: string
}

interface HubSection {
  header: string
  rows: HubRow[]
}

const SECTION_CONFIG: Record<
  FinanzasSectionId,
  { title: string; backPath: string; sections: HubSection[] }
> = {
  credito: {
    title: 'Crédito y pagos',
    backPath: '/finanzas',
    sections: [
      {
        header: 'Deudas y crédito',
        rows: [
          {
            title: 'Deudas',
            subtitle: 'Préstamos y obligaciones',
            path: '/finanzas/deudas',
            Icon: CreditCardIcon,
            color: sectionColor.danger,
            ariaLabel: 'Ir a Deudas',
          },
          {
            title: 'Tarjetas de Crédito',
            subtitle: 'Cupo y disponible',
            path: '/finanzas/tarjetas-credito',
            Icon: CreditCardIcon,
            color: sectionColor.pink,
            ariaLabel: 'Ir a Tarjetas de Crédito',
          },
        ],
      },
      {
        header: 'Tarjetas y subscripciones',
        rows: [
          {
            title: 'Tarjetas de Débito',
            subtitle: 'Físicas y virtuales',
            path: '/finanzas/tarjetas-debito',
            Icon: PaymentIcon,
            color: sectionColor.indigo,
            ariaLabel: 'Ir a Tarjetas de Débito',
          },
          {
            title: 'Subscripciones',
            subtitle: 'Pagos recurrentes',
            path: '/finanzas/subscripciones',
            Icon: CardMembershipIcon,
            color: sectionColor.purple,
            ariaLabel: 'Ir a Subscripciones',
          },
        ],
      },
    ],
  },
  cripto: {
    title: 'Criptomonedas',
    backPath: '/finanzas',
    sections: [
      {
        header: 'Cartera y operaciones',
        rows: [
          {
            title: 'Cripto Wallet',
            subtitle: 'Direcciones y wallets',
            path: '/finanzas/cripto-wallet',
            Icon: CurrencyBitcoinIcon,
            color: sectionColor.bitcoin,
            ariaLabel: 'Ir a Cripto Wallet',
          },
          {
            title: 'Mi Cripto',
            subtitle: 'Posiciones y movimientos',
            path: '/finanzas/cripto-transacciones',
            Icon: CurrencyBitcoinIcon,
            color: sectionColor.lifestyle,
            ariaLabel: 'Ir a Mi Cripto',
          },
        ],
      },
      {
        header: 'Mercado',
        rows: [
          {
            title: 'Vendedores de Cripto',
            subtitle: 'Comercios que aceptan cripto',
            path: '/finanzas/crypto-vendors',
            Icon: CurrencyBitcoinIcon,
            color: sectionColor.bitcoin,
            ariaLabel: 'Ir a Vendedores de Cripto',
          },
        ],
      },
    ],
  },
  ahorro: {
    title: 'Ahorro e inflación',
    backPath: '/finanzas',
    sections: [
      {
        header: 'Protección de la riqueza',
        rows: [
          {
            title: 'CDTs',
            subtitle: 'Certificados de depósito',
            path: '/finanzas/cdts',
            Icon: SavingsIcon,
            color: sectionColor.blue,
            ariaLabel: 'Ir a CDTs',
          },
          {
            title: 'Inflación',
            subtitle: 'Devaluación y predictor',
            path: '/finanzas/inflacion',
            Icon: TrendingDownIcon,
            color: sectionColor.danger,
            ariaLabel: 'Ir a Inflación',
          },
        ],
      },
    ],
  },
}

interface FinanzasSectionHubProps {
  section: FinanzasSectionId
}

function FinanzasSectionHub({ section }: FinanzasSectionHubProps) {
  const navigate = useNavigate()
  const config = SECTION_CONFIG[section]

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide hub-page-content">
        <div className="app-toolbar">
          <button
            className="app-toolbar-button"
            onClick={() => navigate(config.backPath)}
            aria-label="Volver a Finanzas"
            type="button"
          >
            <ArrowBackIcon className="app-toolbar-icon" />
          </button>
        </div>

        <h1 className="app-page-title">{config.title}</h1>

        <div className="crud-hub-list">
          {config.sections.map(group => (
            <div key={group.header} className="crud-hub-section">
              <div className="crud-hub-section-header">{group.header}</div>
              <div className="glass-group">
                {group.rows.map(row => {
                  const IconComponent = row.Icon
                  return (
                    <button
                      key={row.path}
                      className="crud-hub-row"
                      onClick={() => navigate(row.path)}
                      aria-label={row.ariaLabel}
                      type="button"
                    >
                      <div
                        className="crud-hub-row-icon"
                        style={{ '--section-color': row.color } as React.CSSProperties}
                        aria-hidden="true"
                      >
                        <IconComponent />
                      </div>
                      <div className="crud-row-content">
                        <span className="crud-row-title">{row.title}</span>
                        <span className="crud-row-subtitle">{row.subtitle}</span>
                      </div>
                      <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function FinanzasCreditoHub() {
  return <FinanzasSectionHub section="credito" />
}

export function FinanzasCriptoHub() {
  return <FinanzasSectionHub section="cripto" />
}

export function FinanzasAhorroHub() {
  return <FinanzasSectionHub section="ahorro" />
}

export default FinanzasSectionHub
