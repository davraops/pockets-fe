import { useEffect, useMemo, useState } from 'react'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined'
import { api } from '../../services/api'
import { useConfirm } from '../../contexts/ConfirmContext'
import { useNotification } from '../../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../../utils/errorTranslations'
import { parseOptionalAmount } from './employeeFormUtils'
import {
  formatEmployeeMoney,
  getEmployeeDebtBreakdown,
  getEmployeeDebtTotal,
} from './employeeDisplayUtils'
import type { Employee, EmployeeSyncHandler } from './employeeTypes'

interface EmpleadoDeudasSectionProps {
  employee: Employee
  onSync: EmployeeSyncHandler
}

function EmpleadoDeudasSection({ employee, onSync }: EmpleadoDeudasSectionProps) {
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const [debtNormal, setDebtNormal] = useState('')
  const [debtCesantias, setDebtCesantias] = useState('')
  const [debtNormalNotes, setDebtNormalNotes] = useState('')
  const [debtCesantiasNotes, setDebtCesantiasNotes] = useState('')
  const [abonoNormal, setAbonoNormal] = useState('')
  const [abonoCesantias, setAbonoCesantias] = useState('')

  useEffect(() => {
    setDebtNormal(employee.data.debtNormal ? employee.data.debtNormal.toString() : '')
    setDebtCesantias(employee.data.debtCesantias ? employee.data.debtCesantias.toString() : '')
    setDebtNormalNotes(employee.data.debtNormalNotes || '')
    setDebtCesantiasNotes(employee.data.debtCesantiasNotes || '')
    setAbonoNormal('')
    setAbonoCesantias('')
  }, [employee])

  const breakdown = getEmployeeDebtBreakdown(employee)
  const hasDebt = breakdown.total > 0

  const isDirty = useMemo(() => {
    const savedNormal = employee.data.debtNormal ? employee.data.debtNormal.toString() : ''
    const savedCesantias = employee.data.debtCesantias ? employee.data.debtCesantias.toString() : ''

    return (
      debtNormal !== savedNormal ||
      debtCesantias !== savedCesantias ||
      debtNormalNotes !== (employee.data.debtNormalNotes || '') ||
      debtCesantiasNotes !== (employee.data.debtCesantiasNotes || '')
    )
  }, [debtCesantias, debtCesantiasNotes, debtNormal, debtNormalNotes, employee])

  const buildDebtPayload = (overrides: {
    debtNormal?: number | undefined
    debtCesantias?: number | undefined
    debtNormalNotes?: string | undefined
    debtCesantiasNotes?: string | undefined
  }) => ({
    data: {
      ...employee.data,
      debtNormal: overrides.debtNormal ?? parseOptionalAmount(debtNormal),
      debtCesantias: overrides.debtCesantias ?? parseOptionalAmount(debtCesantias),
      debtNormalNotes: (overrides.debtNormalNotes ?? debtNormalNotes).trim() || undefined,
      debtCesantiasNotes: (overrides.debtCesantiasNotes ?? debtCesantiasNotes).trim() || undefined,
    },
  })

  const handleSave = async () => {
    try {
      await api.updateEmployee(employee.id, buildDebtPayload({}))
      showNotification('Deudas actualizadas', 'success')
      await onSync(employee.id)
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al actualizar deudas. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleLiquidate = async (type: 'normal' | 'cesantias') => {
    const label = type === 'normal' ? 'deuda normal' : 'cesantías'
    if (
      !(await confirm({
        message: `¿Marcar la ${label} de ${employee.name} como liquidada?`,
        variant: 'danger',
      }))
    ) {
      return
    }

    try {
      await api.updateEmployee(
        employee.id,
        buildDebtPayload(
          type === 'normal' ? { debtNormal: undefined } : { debtCesantias: undefined }
        )
      )
      showNotification(`${label.charAt(0).toUpperCase()}${label.slice(1)} liquidada`, 'success')
      await onSync(employee.id)
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al liquidar la deuda. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleAbono = async (type: 'normal' | 'cesantias') => {
    const abonoValue = type === 'normal' ? abonoNormal : abonoCesantias
    const abonoAmount = parseOptionalAmount(abonoValue)
    const currentAmount = type === 'normal' ? breakdown.normal : breakdown.cesantias

    if (!abonoAmount) {
      showNotification('Ingresa un monto de abono válido', 'error')
      return
    }

    if (currentAmount <= 0) {
      showNotification('No hay saldo pendiente para abonar', 'error')
      return
    }

    const nextAmount = Math.max(currentAmount - abonoAmount, 0)
    const payload =
      type === 'normal'
        ? { debtNormal: nextAmount > 0 ? nextAmount : undefined }
        : { debtCesantias: nextAmount > 0 ? nextAmount : undefined }

    try {
      await api.updateEmployee(employee.id, buildDebtPayload(payload))
      showNotification('Abono registrado', 'success')
      if (type === 'normal') {
        setAbonoNormal('')
      } else {
        setAbonoCesantias('')
      }
      await onSync(employee.id)
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al registrar el abono. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  return (
    <div className="empleados-detail-section empleados-deudas-section">
      <h3 className="empleados-detail-section-title">
        <AccountBalanceWalletIcon className="empleados-detail-section-icon" />
        Deudas pendientes
      </h3>

      {hasDebt ? (
        <div className="empleados-deudas-hero" role="status">
          <div className="empleados-deudas-hero__copy">
            <span className="empleados-deudas-hero__label">Total por pagar</span>
            <strong className="empleados-deudas-hero__value">
              {formatEmployeeMoney(getEmployeeDebtTotal(employee))}
            </strong>
          </div>
          <div
            className="empleados-deudas-hero__bar"
            role="img"
            aria-label={`Deuda normal ${Math.round(breakdown.normalShare)}%, cesantías ${Math.round(breakdown.cesantiasShare)}%`}
          >
            {breakdown.normal > 0 ? (
              <span
                className="empleados-deudas-hero__segment empleados-deudas-hero__segment--normal"
                style={{ width: `${breakdown.normalShare}%` }}
              />
            ) : null}
            {breakdown.cesantias > 0 ? (
              <span
                className="empleados-deudas-hero__segment empleados-deudas-hero__segment--cesantias"
                style={{ width: `${breakdown.cesantiasShare}%` }}
              />
            ) : null}
          </div>
          <div className="empleados-deudas-hero__legend">
            {breakdown.normal > 0 ? (
              <span className="empleados-deudas-hero__legend-item">
                <span className="empleados-deudas-hero__dot empleados-deudas-hero__dot--normal" />
                Deuda {formatEmployeeMoney(breakdown.normal)}
              </span>
            ) : null}
            {breakdown.cesantias > 0 ? (
              <span className="empleados-deudas-hero__legend-item">
                <span className="empleados-deudas-hero__dot empleados-deudas-hero__dot--cesantias" />
                Cesantías {formatEmployeeMoney(breakdown.cesantias)}
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="empleados-deudas-hint">
          Sin deudas registradas. Puedes anotar montos pendientes por deuda general o cesantías.
        </p>
      )}

      <div className="empleados-deudas-grid">
        <div className="empleados-deudas-card">
          <div className="empleados-deudas-card__head">
            <AccountBalanceWalletIcon className="empleados-deudas-card__icon" aria-hidden="true" />
            <span className="empleados-deudas-card__label">Deuda normal</span>
          </div>
          <label className="form-label-base form-label-base--inline" htmlFor={`debt-normal-${employee.id}`}>
            Monto pendiente (COP)
          </label>
          <input
            id={`debt-normal-${employee.id}`}
            type="number"
            value={debtNormal}
            onChange={event => setDebtNormal(event.target.value)}
            className="form-input-base"
            min="0"
            step="1000"
            placeholder="0"
          />
          <label className="form-label-base form-label-base--inline" htmlFor={`debt-normal-notes-${employee.id}`}>
            Notas
          </label>
          <input
            id={`debt-normal-notes-${employee.id}`}
            type="text"
            value={debtNormalNotes}
            onChange={event => setDebtNormalNotes(event.target.value)}
            className="form-input-base"
            placeholder="Ej: Préstamo, nómina atrasada…"
          />
          {breakdown.normal > 0 ? (
            <div className="empleados-deudas-card__actions">
              <div className="empleados-deudas-abono">
                <input
                  type="number"
                  value={abonoNormal}
                  onChange={event => setAbonoNormal(event.target.value)}
                  className="form-input-base empleados-deudas-abono__input"
                  min="0"
                  step="1000"
                  placeholder="Abono"
                  aria-label="Monto de abono a deuda normal"
                />
                <button
                  type="button"
                  className="empleados-deudas-card__action"
                  onClick={() => void handleAbono('normal')}
                >
                  Abonar
                </button>
              </div>
              <button
                type="button"
                className="empleados-deudas-card__action empleados-deudas-card__action--danger"
                onClick={() => void handleLiquidate('normal')}
              >
                Liquidar
              </button>
            </div>
          ) : null}
        </div>

        <div className="empleados-deudas-card empleados-deudas-card--cesantias">
          <div className="empleados-deudas-card__head">
            <SavingsOutlinedIcon className="empleados-deudas-card__icon" aria-hidden="true" />
            <span className="empleados-deudas-card__label">Cesantías</span>
          </div>
          <label className="form-label-base form-label-base--inline" htmlFor={`debt-cesantias-${employee.id}`}>
            Monto pendiente (COP)
          </label>
          <input
            id={`debt-cesantias-${employee.id}`}
            type="number"
            value={debtCesantias}
            onChange={event => setDebtCesantias(event.target.value)}
            className="form-input-base"
            min="0"
            step="1000"
            placeholder="0"
          />
          <label
            className="form-label-base form-label-base--inline"
            htmlFor={`debt-cesantias-notes-${employee.id}`}
          >
            Notas
          </label>
          <input
            id={`debt-cesantias-notes-${employee.id}`}
            type="text"
            value={debtCesantiasNotes}
            onChange={event => setDebtCesantiasNotes(event.target.value)}
            className="form-input-base"
            placeholder="Ej: Periodo 2024, liquidación parcial…"
          />
          {breakdown.cesantias > 0 ? (
            <div className="empleados-deudas-card__actions">
              <div className="empleados-deudas-abono">
                <input
                  type="number"
                  value={abonoCesantias}
                  onChange={event => setAbonoCesantias(event.target.value)}
                  className="form-input-base empleados-deudas-abono__input"
                  min="0"
                  step="1000"
                  placeholder="Abono"
                  aria-label="Monto de abono a cesantías"
                />
                <button
                  type="button"
                  className="empleados-deudas-card__action"
                  onClick={() => void handleAbono('cesantias')}
                >
                  Abonar
                </button>
              </div>
              <button
                type="button"
                className="empleados-deudas-card__action empleados-deudas-card__action--danger"
                onClick={() => void handleLiquidate('cesantias')}
              >
                Liquidar
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        className="empleados-form-button empleados-form-button-primary"
        onClick={() => void handleSave()}
        disabled={!isDirty}
      >
        {isDirty ? 'Guardar cambios' : 'Sin cambios pendientes'}
      </button>
    </div>
  )
}

export default EmpleadoDeudasSection
