import { describe, expect, it } from 'vitest'
import {
  filterPatrimonyByQuery,
  formatPatrimonyBrandModel,
  formatPatrimonyPreview,
  formatPatrimonyRowValue,
  formatPatrimonyTotalValue,
  getPatrimonyCardChips,
} from './patrimonioDisplayUtils'
import type { PatrimonyItem } from './patrimonioTypes'

const sampleItem: PatrimonyItem = {
  id: '1',
  name: 'Rolex Submariner',
  data: {
    category: 'Relojes',
    brand: 'Rolex',
    model: 'Submariner',
    currentValue: 45000000,
    currency: 'COP',
    location: 'Caja fuerte',
    description: 'Reloj de colección en excelente estado',
  },
}

describe('patrimonioDisplayUtils', () => {
  it('shows value in row and location in preview without duplicating amount', () => {
    expect(formatPatrimonyRowValue(sampleItem)).toBe('45.000.000 COP')
    expect(formatPatrimonyPreview(sampleItem)).toBe('Caja fuerte')
    expect(formatPatrimonyPreview(sampleItem)).not.toMatch(/45\.000\.000/)
  })

  it('filters items by searchable fields', () => {
    const items = [
      sampleItem,
      {
        id: '2',
        name: 'MacBook Pro',
        data: { category: 'Electrónica', brand: 'Apple', model: 'MacBook Pro' },
      },
    ]
    expect(filterPatrimonyByQuery(items, 'rolex')).toHaveLength(1)
    expect(filterPatrimonyByQuery(items, 'macbook')).toHaveLength(1)
  })

  it('builds card chips from condition, location and insurance', () => {
    const chips = getPatrimonyCardChips(sampleItem)
    expect(chips.some(chip => chip.label === 'Caja fuerte' && chip.variant === 'location')).toBe(
      true
    )
    expect(formatPatrimonyBrandModel(sampleItem)).toBe('Rolex Submariner')
  })

  it('sums total value per currency', () => {
    const items: PatrimonyItem[] = [
      sampleItem,
      {
        id: '2',
        name: 'Otro',
        data: { purchaseValue: 1000, currency: 'USD' },
      },
    ]
    expect(formatPatrimonyTotalValue(items)).toBe('2 monedas')
  })
})
