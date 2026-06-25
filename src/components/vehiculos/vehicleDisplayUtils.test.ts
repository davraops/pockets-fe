import { describe, expect, it } from 'vitest'
import {
  filterVehiclesByQuery,
  formatVehicleRowValue,
  getVehicleCardAlert,
  getVehicleCardChips,
} from './vehicleDisplayUtils'
import type { Vehicle } from './vehicleTypes'

const vehicle: Vehicle = {
  id: '1',
  name: 'Camioneta familiar',
  data: {
    brand: 'Toyota',
    model: 'Fortuner',
    year: 2022,
    plate: 'ABC123',
    mileage: 45000,
    type: 'SUV',
    color: 'Blanco',
    fuelType: 'Gasolina',
  },
}

describe('vehicleDisplayUtils', () => {
  it('filters vehicles by query', () => {
    expect(filterVehiclesByQuery([vehicle], 'abc123')).toHaveLength(1)
  })

  it('prefers year then plate for row value', () => {
    expect(formatVehicleRowValue(vehicle)).toBe('2022')
    expect(formatVehicleRowValue({ ...vehicle, data: { ...vehicle.data, year: undefined } })).toBe(
      'ABC123'
    )
  })

  it('builds card chips from vehicle attributes', () => {
    const chips = getVehicleCardChips(vehicle)
    expect(chips.map(chip => chip.label)).toEqual(['SUV', 'Blanco', 'Gasolina', '45.000 km'])
  })

  it('flags expired insurance on card alert', () => {
    const alert = getVehicleCardAlert({
      ...vehicle,
      data: {
        ...vehicle.data,
        insurance: { expirationDate: '2020-01-01' },
      },
    })

    expect(alert?.tone).toBe('danger')
    expect(alert?.text).toContain('Seguro vencido')
  })
})
