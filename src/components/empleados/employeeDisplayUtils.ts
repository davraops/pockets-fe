import type { CSSProperties } from 'react'
import type { CrudSummaryItem } from '../crud/crudSummaryTypes'
import type { Employee } from './employeeTypes'

const EMPLOYEE_AVATAR_HUES = [258, 212, 168, 142, 198, 24, 320, 185] as const

function hashEmployeeName(name: string): number {
  let hash = 0
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

export function getEmployeeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return '?'
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function getEmployeeAvatarStyle(name: string): CSSProperties {
  const hue = EMPLOYEE_AVATAR_HUES[hashEmployeeName(name) % EMPLOYEE_AVATAR_HUES.length]
  return {
    '--empleado-avatar-hue': String(hue),
  } as CSSProperties
}

export function formatEmployeeMoney(amount: number | undefined | null): string | undefined {
  if (amount == null || amount <= 0) {
    return undefined
  }

  return `$${amount.toLocaleString('es-CO')}`
}

export function formatEmployeeSalary(employee: Employee): string | undefined {
  return formatEmployeeMoney(employee.data.salary)
}

export function getEmployeeDebtTotal(employee: Employee): number {
  return (employee.data.debtNormal ?? 0) + (employee.data.debtCesantias ?? 0)
}

export function hasEmployeeDebt(employee: Employee): boolean {
  return getEmployeeDebtTotal(employee) > 0
}

export interface EmployeeDebtBreakdown {
  normal: number
  cesantias: number
  total: number
  normalShare: number
  cesantiasShare: number
}

export function getEmployeeDebtBreakdown(employee: Employee): EmployeeDebtBreakdown {
  const normal = employee.data.debtNormal ?? 0
  const cesantias = employee.data.debtCesantias ?? 0
  const total = normal + cesantias

  return {
    normal,
    cesantias,
    total,
    normalShare: total > 0 ? (normal / total) * 100 : 0,
    cesantiasShare: total > 0 ? (cesantias / total) * 100 : 0,
  }
}

export function sortEmployeesByDebtPriority(employees: Employee[]): Employee[] {
  return [...employees].sort((left, right) => {
    const debtDelta = getEmployeeDebtTotal(right) - getEmployeeDebtTotal(left)
    if (debtDelta !== 0) {
      return debtDelta
    }
    return left.name.localeCompare(right.name, 'es')
  })
}

export function filterEmployeesWithDebt(employees: Employee[]): Employee[] {
  return employees.filter(hasEmployeeDebt)
}

export function formatEmployeeMeta(employee: Employee): string {
  const parts = [employee.data.position, employee.data.department, employee.data.contractType].filter(
    Boolean
  )
  return parts.length > 0 ? parts.join(' · ') : 'Sin cargo asignado'
}

export function formatEmployeePreview(employee: Employee): string | null {
  if (employee.data.identification?.trim()) {
    return employee.data.identification.trim()
  }

  if (employee.data.email?.trim()) {
    return employee.data.email.trim()
  }

  if (employee.data.startDate) {
    return `Desde ${new Date(employee.data.startDate).toLocaleDateString('es-CO')}`
  }

  return null
}

export function formatEmployeeDetailSubtitle(employee: Employee): string {
  const parts = [employee.data.position, employee.data.department].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : 'Sin cargo ni departamento'
}

export function calculateEmployeeHighlights(employees: Employee[]) {
  const nominaTotal = employees.reduce((sum, employee) => sum + (employee.data.salary ?? 0), 0)
  const deudaNormalTotal = employees.reduce((sum, employee) => sum + (employee.data.debtNormal ?? 0), 0)
  const deudaCesantiasTotal = employees.reduce(
    (sum, employee) => sum + (employee.data.debtCesantias ?? 0),
    0
  )
  const deudaTotal = deudaNormalTotal + deudaCesantiasTotal
  const conDeuda = employees.filter(hasEmployeeDebt).length

  return {
    total: employees.length,
    nominaTotal: formatEmployeeMoney(nominaTotal) ?? '—',
    deudaTotal: formatEmployeeMoney(deudaTotal) ?? '—',
    deudaNormalTotal: formatEmployeeMoney(deudaNormalTotal) ?? '—',
    deudaCesantiasTotal: formatEmployeeMoney(deudaCesantiasTotal) ?? '—',
    conDeuda,
  }
}

export function employeeSummaryItems(
  highlights: ReturnType<typeof calculateEmployeeHighlights>
): CrudSummaryItem[] {
  return [
    { label: 'Empleados', value: highlights.total, tone: 'info' },
    { label: 'Nómina', value: highlights.nominaTotal, tone: 'available' },
    {
      label: 'Por pagar',
      value: highlights.deudaTotal,
      tone: 'expense',
      emphasis: highlights.conDeuda > 0,
    },
    {
      label: 'Con deuda',
      value: highlights.conDeuda,
      tone: highlights.conDeuda > 0 ? 'expense' : 'info',
    },
  ]
}

export function filterEmployeesByQuery(employees: Employee[], query: string): Employee[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return employees
  }

  return employees.filter(employee => {
    const haystack = [
      employee.name,
      employee.data.identification ?? '',
      employee.data.position ?? '',
      employee.data.department ?? '',
      employee.data.contractType ?? '',
      employee.data.email ?? '',
      employee.data.phone ?? '',
      employee.data.address ?? '',
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalized)
  })
}
