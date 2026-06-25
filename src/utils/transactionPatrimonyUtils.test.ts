import { describe, expect, it } from 'vitest'
import { EMPTY_PATRIMONY_FORM } from '../components/patrimonio/patrimonioFormUtils'
import {
  buildPatrimonyFormFromTransaction,
  canAddTransactionToPatrimony,
  inferBrandModel,
  mergeCategorySuggestions,
  mergePatrimonyFromTransaction,
  resolvePatrimonyCategory,
  shouldSuggestPatrimonio,
} from './transactionPatrimonyUtils'

describe('transactionPatrimonyUtils', () => {
  it('allows patrimonio only for new egreso purchases', () => {
    expect(canAddTransactionToPatrimony('egreso', false, false)).toBe(true)
    expect(canAddTransactionToPatrimony('egreso', true, false)).toBe(false)
    expect(canAddTransactionToPatrimony('egreso', false, true)).toBe(false)
    expect(canAddTransactionToPatrimony('ingreso', false, false)).toBe(false)
    expect(canAddTransactionToPatrimony('ahorro', false, false)).toBe(false)
  })

  it('prefills patrimonio form from transaction fields', () => {
    const form = buildPatrimonyFormFromTransaction({
      descripcion: 'MacBook Pro 16"',
      categoria: 'Electrónica',
      monto: '12000000',
      fecha: '2024-03-20',
      moneda: 'COP',
    })

    expect(form.name).toBe('MacBook Pro 16"')
    expect(form.category).toBe('Electrónica')
    expect(form.purchaseValue).toBe('12000000')
    expect(form.currentValue).toBe('12000000')
    expect(form.purchaseDate).toBe('2024-03-20')
    expect(form.currency).toBe('COP')
    expect(form.brand).toBe('Apple')
    expect(form.notes).toContain('transacción')
  })

  it('maps generic transaction categories and suggests likely patrimonio purchases', () => {
    expect(resolvePatrimonyCategory('Compras')).toBe('')
    expect(resolvePatrimonyCategory('Tecnología')).toBe('Electrónica')
    expect(shouldSuggestPatrimonio('Arte y decoración')).toBe(true)
    expect(shouldSuggestPatrimonio('Supermercado')).toBe(false)
  })

  it('infers known brands from descriptions', () => {
    expect(inferBrandModel('Rolex Submariner Date')).toEqual({
      brand: 'Rolex',
      model: 'Rolex Submariner Date',
    })
    expect(inferBrandModel('Compra supermercado')).toEqual({})
  })

  it('merges patrimonio form while respecting touched fields', () => {
    const current = {
      ...EMPTY_PATRIMONY_FORM,
      name: 'Mi reloj',
      brand: 'Omega',
    }

    const merged = mergePatrimonyFromTransaction(
      current,
      {
        descripcion: 'Rolex Submariner',
        categoria: 'Relojes',
        monto: '5000000',
        fecha: '2024-01-10',
        moneda: 'COP',
      },
      new Set(['name', 'brand'])
    )

    expect(merged.name).toBe('Mi reloj')
    expect(merged.brand).toBe('Omega')
    expect(merged.purchaseValue).toBe('5000000')
    expect(merged.category).toBe('Relojes')
  })

  it('deduplicates category suggestions', () => {
    expect(
      mergeCategorySuggestions(['Electrónica', 'Relojes'], ['electrónica', 'Arte'])
    ).toEqual(expect.arrayContaining(['Electrónica', 'Relojes', 'Arte']))
  })
})
