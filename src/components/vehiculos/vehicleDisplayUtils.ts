import type { CrudSummaryItem } from '../crud/crudSummaryTypes'
import type { Vehicle } from './vehicleTypes'

export type VehicleCardAlertTone = 'info' | 'warning' | 'danger'

export interface VehicleCardAlert {
  text: string
  tone: VehicleCardAlertTone
}

export interface VehicleCardChip {
  label: string
}

const MS_PER_DAY = 86_400_000

function daysUntil(dateIso: string): number {
  const target = new Date(dateIso)
  target.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / MS_PER_DAY)
}

function formatShortDate(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
  })
}

export function formatVehicleBrandModel(vehicle: Vehicle): string | null {
  const brand = vehicle.data.brand?.trim()
  const model = vehicle.data.model?.trim()
  if (brand && model) {
    return `${brand} ${model}`
  }
  return brand || model || null
}

export function formatVehiclePlate(vehicle: Vehicle): string | null {
  const plate = vehicle.data.plate?.trim()
  return plate || null
}

export function formatVehicleMileage(vehicle: Vehicle): string | null {
  if (vehicle.data.mileage == null || vehicle.data.mileage < 0) {
    return null
  }
  return `${vehicle.data.mileage.toLocaleString('es-CO')} km`
}

export function getVehicleCardChips(vehicle: Vehicle): VehicleCardChip[] {
  const chips: VehicleCardChip[] = []

  if (vehicle.data.type?.trim()) {
    chips.push({ label: vehicle.data.type.trim() })
  }
  if (vehicle.data.color?.trim()) {
    chips.push({ label: vehicle.data.color.trim() })
  }
  if (vehicle.data.fuelType?.trim()) {
    chips.push({ label: vehicle.data.fuelType.trim() })
  }

  const mileage = formatVehicleMileage(vehicle)
  if (mileage) {
    chips.push({ label: mileage })
  }

  return chips
}

export function getVehicleCardAlert(vehicle: Vehicle): VehicleCardAlert | null {
  const insuranceDate = vehicle.data.insurance?.expirationDate
  if (insuranceDate) {
    const days = daysUntil(insuranceDate)
    if (days < 0) {
      return { text: `Seguro vencido · ${formatShortDate(insuranceDate)}`, tone: 'danger' }
    }
    if (days <= 30) {
      return {
        text: `Seguro vence en ${days} día${days === 1 ? '' : 's'}`,
        tone: days <= 7 ? 'danger' : 'warning',
      }
    }
    return { text: `Seguro al día · ${formatShortDate(insuranceDate)}`, tone: 'info' }
  }

  const nextService = vehicle.data.maintenance?.nextService
  if (nextService) {
    const days = daysUntil(nextService)
    if (days < 0) {
      return { text: `Servicio atrasado · ${formatShortDate(nextService)}`, tone: 'danger' }
    }
    if (days <= 30) {
      return {
        text: `Servicio en ${days} día${days === 1 ? '' : 's'}`,
        tone: days <= 7 ? 'warning' : 'info',
      }
    }
    return { text: `Próximo servicio · ${formatShortDate(nextService)}`, tone: 'info' }
  }

  return null
}

export function formatVehicleMeta(vehicle: Vehicle): string {
  const parts: string[] = []
  if (vehicle.data.brand && vehicle.data.model) {
    parts.push(`${vehicle.data.brand} ${vehicle.data.model}`)
  }
  if (vehicle.data.plate) {
    parts.push(vehicle.data.plate)
  }
  if (vehicle.data.type) {
    parts.push(vehicle.data.type)
  }
  return parts.length > 0 ? parts.join(' · ') : 'Sin datos adicionales'
}

export function formatVehiclePreview(vehicle: Vehicle): string | null {
  if (vehicle.data.insurance?.expirationDate) {
    return `Seguro vence ${new Date(vehicle.data.insurance.expirationDate).toLocaleDateString('es-CO')}`
  }

  if (vehicle.data.maintenance?.nextService) {
    return `Servicio ${new Date(vehicle.data.maintenance.nextService).toLocaleDateString('es-CO')}`
  }

  if (vehicle.data.mileage) {
    return `${vehicle.data.mileage.toLocaleString('es-CO')} km`
  }

  return null
}

export function formatVehicleRowValue(vehicle: Vehicle): string | undefined {
  if (vehicle.data.year) {
    return String(vehicle.data.year)
  }

  if (vehicle.data.plate?.trim()) {
    return vehicle.data.plate.trim()
  }

  return undefined
}

export function formatVehicleDetailSubtitle(vehicle: Vehicle): string {
  const parts: string[] = []
  if (vehicle.data.brand && vehicle.data.model) {
    parts.push(`${vehicle.data.brand} ${vehicle.data.model}`)
  }
  if (vehicle.data.plate?.trim()) {
    parts.push(vehicle.data.plate.trim())
  }
  return parts.length > 0 ? parts.join(' · ') : 'Sin placa ni modelo'
}

export function calculateVehicleHighlights(vehicles: Vehicle[]) {
  return {
    total: vehicles.length,
    conPlaca: vehicles.filter(v => v.data.plate?.trim()).length,
    conSeguro: vehicles.filter(v => v.data.insurance?.company?.trim()).length,
    conMantenimiento: vehicles.filter(v => v.data.maintenance?.nextService).length,
  }
}

export function vehicleSummaryItems(
  highlights: ReturnType<typeof calculateVehicleHighlights>
): CrudSummaryItem[] {
  return [
    { label: 'Vehículos', value: highlights.total, tone: 'info' },
    { label: 'Con placa', value: highlights.conPlaca, tone: 'available' },
    { label: 'Con seguro', value: highlights.conSeguro, tone: 'info' },
    { label: 'Mantenimiento', value: highlights.conMantenimiento, tone: 'info' },
  ]
}

export function filterVehiclesByQuery(vehicles: Vehicle[], query: string): Vehicle[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return vehicles
  }

  return vehicles.filter(vehicle => {
    const haystack = [
      vehicle.name,
      vehicle.data.brand ?? '',
      vehicle.data.model ?? '',
      vehicle.data.plate ?? '',
      vehicle.data.type ?? '',
      vehicle.data.color ?? '',
      vehicle.data.fuelType ?? '',
      vehicle.data.insurance?.company ?? '',
      vehicle.data.notes ?? '',
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalized)
  })
}
