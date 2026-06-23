import type { Vehicle, VehicleData } from './vehicleTypes'

export interface VehicleFormData {
  name: string
  type: string
  brand: string
  model: string
  year: string
  plate: string
  color: string
  vin: string
  mileage: string
  fuelType: string
  insuranceCompany: string
  insurancePolicyNumber: string
  insuranceExpirationDate: string
  insuranceCoverage: string
  maintenanceLastService: string
  maintenanceNextService: string
  maintenanceServiceInterval: string
  soatNumber: string
  soatExpiration: string
  technicalReviewNumber: string
  technicalReviewExpiration: string
  notes: string
}

export interface VehicleFormErrors {
  name: string
}

export const EMPTY_VEHICLE_FORM: VehicleFormData = {
  name: '',
  type: '',
  brand: '',
  model: '',
  year: '',
  plate: '',
  color: '',
  vin: '',
  mileage: '',
  fuelType: '',
  insuranceCompany: '',
  insurancePolicyNumber: '',
  insuranceExpirationDate: '',
  insuranceCoverage: '',
  maintenanceLastService: '',
  maintenanceNextService: '',
  maintenanceServiceInterval: '',
  soatNumber: '',
  soatExpiration: '',
  technicalReviewNumber: '',
  technicalReviewExpiration: '',
  notes: '',
}

export const EMPTY_VEHICLE_FORM_ERRORS: VehicleFormErrors = { name: '' }

export function vehicleToFormData(vehicle: Vehicle): VehicleFormData {
  return {
    name: vehicle.name,
    type: vehicle.data.type || '',
    brand: vehicle.data.brand || '',
    model: vehicle.data.model || '',
    year: vehicle.data.year ? vehicle.data.year.toString() : '',
    plate: vehicle.data.plate || '',
    color: vehicle.data.color || '',
    vin: vehicle.data.vin || '',
    mileage: vehicle.data.mileage ? vehicle.data.mileage.toString() : '',
    fuelType: vehicle.data.fuelType || '',
    insuranceCompany: vehicle.data.insurance?.company || '',
    insurancePolicyNumber: vehicle.data.insurance?.policyNumber || '',
    insuranceExpirationDate: vehicle.data.insurance?.expirationDate || '',
    insuranceCoverage: vehicle.data.insurance?.coverage || '',
    maintenanceLastService: vehicle.data.maintenance?.lastService || '',
    maintenanceNextService: vehicle.data.maintenance?.nextService || '',
    maintenanceServiceInterval: vehicle.data.maintenance?.serviceInterval
      ? vehicle.data.maintenance.serviceInterval.toString()
      : '',
    soatNumber: vehicle.data.documents?.soat?.number || '',
    soatExpiration: vehicle.data.documents?.soat?.expiration || '',
    technicalReviewNumber: vehicle.data.documents?.technicalReview?.number || '',
    technicalReviewExpiration: vehicle.data.documents?.technicalReview?.expiration || '',
    notes: vehicle.data.notes || '',
  }
}

export function formDataToVehiclePayload(formData: VehicleFormData): {
  name: string
  data: VehicleData
} {
  const data: VehicleData = {
    type: formData.type.trim() || undefined,
    brand: formData.brand.trim() || undefined,
    model: formData.model.trim() || undefined,
    year: formData.year ? parseInt(formData.year, 10) : undefined,
    plate: formData.plate.trim() || undefined,
    color: formData.color.trim() || undefined,
    vin: formData.vin.trim() || undefined,
    mileage: formData.mileage ? parseFloat(formData.mileage) : undefined,
    fuelType: formData.fuelType.trim() || undefined,
    insurance:
      formData.insuranceCompany.trim() ||
      formData.insurancePolicyNumber.trim() ||
      formData.insuranceExpirationDate.trim() ||
      formData.insuranceCoverage.trim()
        ? {
            company: formData.insuranceCompany.trim() || undefined,
            policyNumber: formData.insurancePolicyNumber.trim() || undefined,
            expirationDate: formData.insuranceExpirationDate || undefined,
            coverage: formData.insuranceCoverage.trim() || undefined,
          }
        : undefined,
    maintenance:
      formData.maintenanceLastService.trim() ||
      formData.maintenanceNextService.trim() ||
      formData.maintenanceServiceInterval.trim()
        ? {
            lastService: formData.maintenanceLastService || undefined,
            nextService: formData.maintenanceNextService || undefined,
            serviceInterval: formData.maintenanceServiceInterval
              ? parseInt(formData.maintenanceServiceInterval, 10)
              : undefined,
          }
        : undefined,
    documents:
      formData.soatNumber.trim() ||
      formData.soatExpiration.trim() ||
      formData.technicalReviewNumber.trim() ||
      formData.technicalReviewExpiration.trim()
        ? {
            soat:
              formData.soatNumber.trim() || formData.soatExpiration.trim()
                ? {
                    number: formData.soatNumber.trim() || undefined,
                    expiration: formData.soatExpiration || undefined,
                  }
                : undefined,
            technicalReview:
              formData.technicalReviewNumber.trim() || formData.technicalReviewExpiration.trim()
                ? {
                    number: formData.technicalReviewNumber.trim() || undefined,
                    expiration: formData.technicalReviewExpiration || undefined,
                  }
                : undefined,
          }
        : undefined,
    notes: formData.notes.trim() || undefined,
  }

  return { name: formData.name.trim(), data }
}

export function validateVehicleForm(formData: VehicleFormData): {
  isValid: boolean
  errors: VehicleFormErrors
} {
  const errors = { ...EMPTY_VEHICLE_FORM_ERRORS }
  let isValid = true

  if (!formData.name.trim()) {
    errors.name = 'El nombre del vehículo es requerido'
    isValid = false
  }

  return { isValid, errors }
}
