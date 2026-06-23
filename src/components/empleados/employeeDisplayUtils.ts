import type { Employee } from './employeeTypes'

export function formatEmployeeMeta(employee: Employee): string {
  const parts = [employee.data.position, employee.data.department, employee.data.contractType].filter(
    Boolean
  )
  return parts.length > 0 ? parts.join(' • ') : 'Sin cargo asignado'
}

export function formatEmployeePreview(employee: Employee): string | null {
  if (employee.data.email) {
    return employee.data.email
  }
  if (employee.data.startDate) {
    return `Contratado: ${new Date(employee.data.startDate).toLocaleDateString('es-CO')}`
  }
  return null
}

import type { CrudSummaryItem } from '../crud/crudSummaryTypes'

export function calculateEmployeeHighlights(employees: Employee[]) {
  return {
    total: employees.length,
    conSalario: employees.filter(e => e.data.salary != null && e.data.salary > 0).length,
    conContrato: employees.filter(e => e.data.contractType?.trim()).length,
    conVacaciones: employees.filter(
      e => e.data.vacationDaysAvailable != null && e.data.vacationDaysAvailable > 0
    ).length,
  }
}

export function employeeSummaryItems(
  highlights: ReturnType<typeof calculateEmployeeHighlights>
): CrudSummaryItem[] {
  return [
    { label: 'Total', value: highlights.total, tone: 'info' },
    { label: 'Con salario', value: highlights.conSalario, tone: 'available' },
    { label: 'Con contrato', value: highlights.conContrato, tone: 'info' },
    { label: 'Con vacaciones', value: highlights.conVacaciones, tone: 'info' },
  ]
}
