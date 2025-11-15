import '../App.css'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import CalculateIcon from '@mui/icons-material/Calculate'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import PaymentIcon from '@mui/icons-material/Payment'
import CardMembershipIcon from '@mui/icons-material/CardMembership'
import type { SvgIconComponent } from '@mui/material'
import { useNavigate } from 'react-router-dom'

interface FinanceItem {
  id: string
  title: string
  Icon: SvgIconComponent
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
  }
]

function Finanzas() {
  const navigate = useNavigate()

  return (
    <div className="app-container">
      <div className="glass-menu">
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
      </div>
    </div>
  )
}

export default Finanzas

