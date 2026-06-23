export interface EmployeeData {
  identification?: string
  position?: string
  salary?: number
  contractType?: string
  startDate?: string
  department?: string
  email?: string
  phone?: string
  address?: string
  emergencyContact?: {
    name?: string
    phone?: string
    relationship?: string
  }
  vacationDaysAvailable?: number
  vacations?: Array<{
    startDate: string
    endDate: string
    days: number
    notes?: string
  }>
  permissions?: Array<{
    date: string
    reason: string
    hours?: number
    notes?: string
  }>
  delays?: Array<{
    date: string
    minutes: number
    reason?: string
    notes?: string
  }>
}

export interface EmployeeRecord {
  id: string
  name: string
  data: EmployeeData
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  name: string
  data: EmployeeData
  created_at?: string
  updated_at?: string
}

export type EmployeeSyncHandler = (employeeId: string) => Promise<void>

export function mapEmployeeRecords(records: EmployeeRecord[]): Employee[] {
  return records.map(record => ({
    id: record.id,
    name: record.name,
    data: record.data,
    created_at: record.created_at,
    updated_at: record.updated_at,
  }))
}
