import CrudInsetRow from '../crud/CrudInsetRow'
import type { Employee } from './employeeTypes'
import { formatEmployeeMeta, formatEmployeePreview } from './employeeDisplayUtils'

interface EmpleadoListRowProps {
  employee: Employee
  onClick: () => void
}

function EmpleadoListRow({ employee, onClick }: EmpleadoListRowProps) {
  const salaryValue =
    employee.data.salary != null && employee.data.salary > 0
      ? `$${employee.data.salary.toLocaleString('es-CO')}`
      : undefined

  return (
    <CrudInsetRow
      accentClass="crud-row-accent-purple"
      ariaLabel={`Ver empleado ${employee.name}`}
      onClick={onClick}
      title={employee.name}
      value={salaryValue}
      meta={formatEmployeeMeta(employee)}
      preview={formatEmployeePreview(employee)}
    />
  )
}

export default EmpleadoListRow
