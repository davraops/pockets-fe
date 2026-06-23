import type { Employee, EmployeeData } from './employeeTypes'

export interface EmployeeFormData {
  name: string
  identification: string
  position: string
  salary: string
  contractType: string
  startDate: string
  department: string
  email: string
  phone: string
  address: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
}

export interface EmployeeFormErrors {
  name: string
  identification: string
}

export const EMPTY_EMPLOYEE_FORM: EmployeeFormData = {
  name: '',
  identification: '',
  position: '',
  salary: '',
  contractType: '',
  startDate: '',
  department: '',
  email: '',
  phone: '',
  address: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: '',
}

export const EMPTY_EMPLOYEE_FORM_ERRORS: EmployeeFormErrors = {
  name: '',
  identification: '',
}

export function employeeToFormData(employee: Employee): EmployeeFormData {
  return {
    name: employee.name,
    identification: employee.data.identification || '',
    position: employee.data.position || '',
    salary: employee.data.salary ? employee.data.salary.toString() : '',
    contractType: employee.data.contractType || '',
    startDate: employee.data.startDate || '',
    department: employee.data.department || '',
    email: employee.data.email || '',
    phone: employee.data.phone || '',
    address: employee.data.address || '',
    emergencyContactName: employee.data.emergencyContact?.name || '',
    emergencyContactPhone: employee.data.emergencyContact?.phone || '',
    emergencyContactRelationship: employee.data.emergencyContact?.relationship || '',
  }
}

export function formDataToEmployeePayload(formData: EmployeeFormData): {
  name: string
  data: EmployeeData
} {
  return {
    name: formData.name.trim(),
    data: {
      identification: formData.identification.trim(),
      position: formData.position.trim() || undefined,
      salary: formData.salary ? parseFloat(formData.salary) : undefined,
      contractType: formData.contractType.trim() || undefined,
      startDate: formData.startDate || undefined,
      department: formData.department.trim() || undefined,
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      address: formData.address.trim() || undefined,
      emergencyContact:
        formData.emergencyContactName.trim() ||
        formData.emergencyContactPhone.trim() ||
        formData.emergencyContactRelationship.trim()
          ? {
              name: formData.emergencyContactName.trim() || undefined,
              phone: formData.emergencyContactPhone.trim() || undefined,
              relationship: formData.emergencyContactRelationship.trim() || undefined,
            }
          : undefined,
    },
  }
}

export function validateEmployeeForm(formData: EmployeeFormData): {
  isValid: boolean
  errors: EmployeeFormErrors
} {
  const errors = { ...EMPTY_EMPLOYEE_FORM_ERRORS }
  let isValid = true

  if (!formData.name.trim()) {
    errors.name = 'El nombre completo es requerido'
    isValid = false
  }

  if (!formData.identification.trim()) {
    errors.identification = 'El documento de identidad es requerido'
    isValid = false
  }

  return { isValid, errors }
}
