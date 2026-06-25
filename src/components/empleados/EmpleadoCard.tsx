import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import BeachAccessOutlinedIcon from '@mui/icons-material/BeachAccessOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import type { Employee } from './employeeTypes'
import {
  formatEmployeeMoney,
  formatEmployeeSalary,
  getEmployeeAvatarStyle,
  getEmployeeDebtBreakdown,
  getEmployeeInitials,
  hasEmployeeDebt,
} from './employeeDisplayUtils'

interface EmpleadoCardProps {
  employee: Employee
  onClick: () => void
}

function EmpleadoCard({ employee, onClick }: EmpleadoCardProps) {
  const salary = formatEmployeeSalary(employee)
  const debtBreakdown = getEmployeeDebtBreakdown(employee)
  const hasDebt = hasEmployeeDebt(employee)
  const debtTotal = formatEmployeeMoney(debtBreakdown.total)
  const { position, department, contractType, identification, email, phone, vacationDaysAvailable } =
    employee.data

  const roleLine = [position, department].filter(Boolean).join(' · ')

  return (
    <button
      type="button"
      className={`empleado-card${hasDebt ? ' empleado-card--has-debt' : ''}`}
      onClick={onClick}
      aria-label={`Ver empleado ${employee.name}${hasDebt ? `, por pagar ${debtTotal}` : ''}`}
    >
      <div className="empleado-card__top">
        <span className="empleado-card__avatar" style={getEmployeeAvatarStyle(employee.name)} aria-hidden="true">
          {getEmployeeInitials(employee.name)}
        </span>
        <div className="empleado-card__identity">
          <span className="empleado-card__name">{employee.name}</span>
          <span className="empleado-card__role">{roleLine || 'Sin cargo asignado'}</span>
        </div>
        <ChevronRightIcon className="empleado-card__chevron" aria-hidden="true" />
      </div>

      {hasDebt ? (
        <div className="empleado-card__debt" aria-hidden="true">
          <div className="empleado-card__debt-head">
            <span className="empleado-card__debt-label">Por pagar</span>
            <strong className="empleado-card__debt-total">{debtTotal}</strong>
          </div>
          <div className="empleado-card__debt-bar">
            {debtBreakdown.normal > 0 ? (
              <span
                className="empleado-card__debt-segment empleado-card__debt-segment--normal"
                style={{ width: `${debtBreakdown.normalShare}%` }}
              />
            ) : null}
            {debtBreakdown.cesantias > 0 ? (
              <span
                className="empleado-card__debt-segment empleado-card__debt-segment--cesantias"
                style={{ width: `${debtBreakdown.cesantiasShare}%` }}
              />
            ) : null}
          </div>
          <div className="empleado-card__debt-legend">
            {debtBreakdown.normal > 0 ? (
              <span>Deuda {formatEmployeeMoney(debtBreakdown.normal)}</span>
            ) : null}
            {debtBreakdown.cesantias > 0 ? (
              <span>Cesantías {formatEmployeeMoney(debtBreakdown.cesantias)}</span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="empleado-card__footer">
        {salary ? <span className="empleado-card__salary">{salary}</span> : null}
        {contractType ? (
          <span className="empleado-card__chip empleado-card__chip--contract">{contractType}</span>
        ) : null}
        {identification?.trim() ? (
          <span className="empleado-card__chip">
            <BadgeOutlinedIcon className="empleado-card__chip-icon" aria-hidden="true" />
            {identification.trim()}
          </span>
        ) : null}
        {email?.trim() ? (
          <span className="empleado-card__chip">
            <EmailOutlinedIcon className="empleado-card__chip-icon" aria-hidden="true" />
            {email.trim()}
          </span>
        ) : null}
        {phone?.trim() ? (
          <span className="empleado-card__chip">
            <PhoneOutlinedIcon className="empleado-card__chip-icon" aria-hidden="true" />
            {phone.trim()}
          </span>
        ) : null}
        {vacationDaysAvailable != null && vacationDaysAvailable > 0 ? (
          <span className="empleado-card__chip empleado-card__chip--vacation">
            <BeachAccessOutlinedIcon className="empleado-card__chip-icon" aria-hidden="true" />
            {vacationDaysAvailable} día{vacationDaysAvailable !== 1 ? 's' : ''} vac.
          </span>
        ) : null}
      </div>
    </button>
  )
}

export default EmpleadoCard
