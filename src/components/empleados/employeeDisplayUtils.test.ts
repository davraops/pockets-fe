import { describe, expect, it } from 'vitest'
import {
  calculateEmployeeHighlights,
  filterEmployeesByQuery,
  filterEmployeesWithDebt,
  formatEmployeePreview,
  getEmployeeDebtBreakdown,
  getEmployeeInitials,
  hasEmployeeDebt,
  sortEmployeesByDebtPriority,
} from './employeeDisplayUtils'
import type { Employee } from './employeeTypes'

const employee: Employee = {
  id: '1',
  name: 'Ana López',
  data: {
    position: 'Contadora',
    department: 'Finanzas',
    salary: 5000000,
    identification: '123456789',
    email: 'ana@empresa.com',
    debtNormal: 250000,
    debtCesantias: 1800000,
  },
}

describe('employeeDisplayUtils', () => {
  it('shows document in preview instead of duplicating salary', () => {
    expect(formatEmployeePreview(employee)).toBe('123456789')
  })

  it('filters employees by query', () => {
    expect(filterEmployeesByQuery([employee], 'contadora')).toHaveLength(1)
    expect(filterEmployeesByQuery([employee], 'ventas')).toHaveLength(0)
  })

  it('builds initials from employee name', () => {
    expect(getEmployeeInitials('Ana López')).toBe('AL')
    expect(getEmployeeInitials('Pedro')).toBe('PE')
  })

  it('detects employee debt and aggregates highlights', () => {
    expect(hasEmployeeDebt(employee)).toBe(true)
    const highlights = calculateEmployeeHighlights([employee])
    expect(highlights.deudaTotal).toBe('$2.050.000')
    expect(highlights.conDeuda).toBe(1)
  })

  it('sorts employees with higher debt first', () => {
    const other: Employee = {
      id: '2',
      name: 'Bruno',
      data: { debtNormal: 100000 },
    }
    const sorted = sortEmployeesByDebtPriority([other, employee])
    expect(sorted[0].id).toBe('1')
  })

  it('filters employees with debt and builds breakdown shares', () => {
    const clean: Employee = { id: '3', name: 'Carla', data: {} }
    expect(filterEmployeesWithDebt([employee, clean])).toHaveLength(1)
    const breakdown = getEmployeeDebtBreakdown(employee)
    expect(breakdown.total).toBe(2050000)
    expect(Math.round(breakdown.normalShare)).toBe(12)
    expect(Math.round(breakdown.cesantiasShare)).toBe(88)
  })
})
