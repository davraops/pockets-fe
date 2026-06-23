import type { Vehicle } from './vehicleTypes'

import type { CrudSummaryItem } from '../crud/crudSummaryTypes'

export function formatVehicleMeta(vehicle: Vehicle): string {
  const parts: string[] = []
  if (vehicle.data.brand && vehicle.data.model) {
    parts.push(`${vehicle.data.brand} ${vehicle.data.model}`)
  }
  if (vehicle.data.plate) {
    parts.push(`Placa ${vehicle.data.plate}`)
  }
  if (vehicle.data.type) {
    parts.push(vehicle.data.type)
  }
  return parts.length > 0 ? parts.join(' • ') : 'Sin datos adicionales'
}

export function formatVehiclePreview(vehicle: Vehicle): string | null {
  if (vehicle.data.insurance?.expirationDate) {
    return `Seguro vence: ${new Date(vehicle.data.insurance.expirationDate).toLocaleDateString('es-CO')}`
  }
  if (vehicle.data.maintenance?.nextService) {
    return `Próximo servicio: ${new Date(vehicle.data.maintenance.nextService).toLocaleDateString('es-CO')}`
  }
  if (vehicle.data.mileage) {
    return `${vehicle.data.mileage.toLocaleString('es-CO')} km`
  }
  return null
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
    { label: 'Total', value: highlights.total, tone: 'info' },
    { label: 'Con placa', value: highlights.conPlaca, tone: 'available' },
    { label: 'Con seguro', value: highlights.conSeguro, tone: 'info' },
    { label: 'Mantenimiento', value: highlights.conMantenimiento, tone: 'info' },
  ]
}
