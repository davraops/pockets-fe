import type { PatrimonyData, PatrimonyItem } from './patrimonioTypes'

export interface PatrimonyFormData {
  name: string
  category: string
  purchaseDate: string
  purchaseValue: string
  currency: string
  description: string
  brand: string
  model: string
  serialNumber: string
  condition: string
  currentValue: string
  location: string
  insuranceCompany: string
  insurancePolicyNumber: string
  insuranceCoverage: string
  notes: string
}

export interface PatrimonyFormErrors {
  name: string
}

export const EMPTY_PATRIMONY_FORM: PatrimonyFormData = {
  name: '',
  category: '',
  purchaseDate: '',
  purchaseValue: '',
  currency: 'COP',
  description: '',
  brand: '',
  model: '',
  serialNumber: '',
  condition: '',
  currentValue: '',
  location: '',
  insuranceCompany: '',
  insurancePolicyNumber: '',
  insuranceCoverage: '',
  notes: '',
}

export const EMPTY_PATRIMONY_FORM_ERRORS: PatrimonyFormErrors = { name: '' }

export function patrimonyItemToFormData(item: PatrimonyItem): PatrimonyFormData {
  return {
    name: item.name,
    category: item.data.category || '',
    purchaseDate: item.data.purchaseDate || '',
    purchaseValue: item.data.purchaseValue ? item.data.purchaseValue.toString() : '',
    currency: item.data.currency || 'COP',
    description: item.data.description || '',
    brand: item.data.brand || '',
    model: item.data.model || '',
    serialNumber: item.data.serialNumber || '',
    condition: item.data.condition || '',
    currentValue: item.data.currentValue ? item.data.currentValue.toString() : '',
    location: item.data.location || '',
    insuranceCompany: item.data.insurance?.company || '',
    insurancePolicyNumber: item.data.insurance?.policyNumber || '',
    insuranceCoverage: item.data.insurance?.coverage
      ? item.data.insurance.coverage.toString()
      : '',
    notes: item.data.notes || '',
  }
}

export function formDataToPatrimonyPayload(formData: PatrimonyFormData): {
  name: string
  data: PatrimonyData
} {
  return {
    name: formData.name.trim(),
    data: {
      category: formData.category.trim() || undefined,
      purchaseDate: formData.purchaseDate || undefined,
      purchaseValue: formData.purchaseValue ? parseFloat(formData.purchaseValue) : undefined,
      currency: formData.currency.trim() || undefined,
      description: formData.description.trim() || undefined,
      brand: formData.brand.trim() || undefined,
      model: formData.model.trim() || undefined,
      serialNumber: formData.serialNumber.trim() || undefined,
      condition: formData.condition.trim() || undefined,
      currentValue: formData.currentValue ? parseFloat(formData.currentValue) : undefined,
      location: formData.location.trim() || undefined,
      insurance:
        formData.insuranceCompany.trim() ||
        formData.insurancePolicyNumber.trim() ||
        formData.insuranceCoverage.trim()
          ? {
              company: formData.insuranceCompany.trim() || undefined,
              policyNumber: formData.insurancePolicyNumber.trim() || undefined,
              coverage: formData.insuranceCoverage
                ? parseFloat(formData.insuranceCoverage)
                : undefined,
            }
          : undefined,
      notes: formData.notes.trim() || undefined,
    },
  }
}

export function validatePatrimonyForm(formData: PatrimonyFormData): {
  isValid: boolean
  errors: PatrimonyFormErrors
} {
  const errors = { ...EMPTY_PATRIMONY_FORM_ERRORS }
  let isValid = true

  if (!formData.name.trim()) {
    errors.name = 'El nombre del item es requerido'
    isValid = false
  }

  return { isValid, errors }
}
