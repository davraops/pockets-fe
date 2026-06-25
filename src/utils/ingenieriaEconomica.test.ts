import { describe, expect, it } from 'vitest'
import {
  calcularIngenieriaEconomica,
  calcularTir,
  calcularVan,
  formatIngenieriaNumber,
  generarTablaFactores,
  gradientPresentFactor,
  parseFlujosCaja,
} from './ingenieriaEconomica'

describe('calcularIngenieriaEconomica', () => {
  it('calcula valor futuro con interés compuesto', () => {
    const result = calcularIngenieriaEconomica({
      funcion: 'vf',
      monto: 1000,
      tasaPorPeriodo: 10,
      periodos: 2,
    })
    expect(result.value).toBeCloseTo(1210, 4)
    expect(result.interpretacion).toBeTruthy()
  })

  it('calcula valor presente', () => {
    const result = calcularIngenieriaEconomica({
      funcion: 'vp',
      monto: 1210,
      tasaPorPeriodo: 10,
      periodos: 2,
    })
    expect(result.value).toBeCloseTo(1000, 4)
  })

  it('calcula valor presente de anualidad', () => {
    const result = calcularIngenieriaEconomica({
      funcion: 'pva',
      monto: 100,
      tasaPorPeriodo: 5,
      periodos: 3,
    })
    expect(result.value).toBeCloseTo(272.324, 2)
  })

  it('calcula valor futuro de anualidad', () => {
    const result = calcularIngenieriaEconomica({
      funcion: 'fva',
      monto: 100,
      tasaPorPeriodo: 5,
      periodos: 3,
    })
    expect(result.value).toBeCloseTo(315.25, 2)
  })

  it('calcula recuperación de capital', () => {
    const result = calcularIngenieriaEconomica({
      funcion: 'ap',
      monto: 1000,
      tasaPorPeriodo: 10,
      periodos: 2,
    })
    expect(result.value).toBeCloseTo(576.1905, 3)
  })

  it('calcula fondo de amortización', () => {
    const result = calcularIngenieriaEconomica({
      funcion: 'af',
      monto: 1000,
      tasaPorPeriodo: 10,
      periodos: 2,
    })
    expect(result.value).toBeCloseTo(476.1905, 3)
  })

  it('calcula tasa efectiva por periodo', () => {
    const result = calcularIngenieriaEconomica({
      funcion: 'tasaEfectiva',
      monto: 2,
      tasaPorPeriodo: 2,
      periodos: 4,
    })
    expect(result.value).toBeCloseTo(0.082432, 4)
  })

  it('calcula VAN con interpretación', () => {
    const result = calcularIngenieriaEconomica({
      funcion: 'van',
      monto: 0,
      tasaPorPeriodo: 10,
      periodos: 0,
      flujos: [-1000, 300, 400, 500, 600],
    })
    expect(result.value).toBeGreaterThan(0)
    expect(result.interpretacion).toMatch(/VAN positivo/)
  })

  it('calcula TIR', () => {
    const flujos = [-1000, 300, 400, 500, 600]
    const result = calcularIngenieriaEconomica({
      funcion: 'tir',
      monto: 0,
      tasaPorPeriodo: 12,
      periodos: 0,
      flujos,
    })
    expect(calcularVan(flujos, result.value)).toBeCloseTo(0, 2)
    expect(result.interpretacion).toBeTruthy()
  })

  it('calcula gradiente presente', () => {
    const result = calcularIngenieriaEconomica({
      funcion: 'pg',
      monto: 100,
      tasaPorPeriodo: 10,
      periodos: 4,
    })
    expect(result.value).toBeCloseTo(100 * gradientPresentFactor(0.1, 4), 2)
  })

  it('genera tabla de factores', () => {
    const result = calcularIngenieriaEconomica({
      funcion: 'tablas',
      monto: 0,
      tasaPorPeriodo: 10,
      periodos: 5,
    })
    expect(result.tabla).toHaveLength(8)
    expect(result.tabla?.[0].simbolo).toBe('(P/F)')
  })

  it('maneja tasa cero en anualidad', () => {
    const result = calcularIngenieriaEconomica({
      funcion: 'pva',
      monto: 50,
      tasaPorPeriodo: 0,
      periodos: 4,
    })
    expect(result.value).toBe(200)
  })

  it('rechaza periodos inválidos', () => {
    expect(() =>
      calcularIngenieriaEconomica({
        funcion: 'vf',
        monto: 100,
        tasaPorPeriodo: 5,
        periodos: 0,
      })
    ).toThrow('Los periodos deben ser mayores a 0')
  })
})

describe('parseFlujosCaja', () => {
  it('parsea flujos separados por coma', () => {
    expect(parseFlujosCaja('-1000, 300, 400')).toEqual([-1000, 300, 400])
  })
})

describe('calcularTir', () => {
  it('rechaza flujos sin cambio de signo', () => {
    expect(() => calcularTir([100, 200, 300])).toThrow('cambio de signo')
  })
})

describe('generarTablaFactores', () => {
  it('devuelve ocho factores', () => {
    expect(generarTablaFactores(10, 3)).toHaveLength(8)
  })
})

describe('formatIngenieriaNumber', () => {
  it('formatea números finitos', () => {
    expect(formatIngenieriaNumber(1234.5)).toMatch(/1\.234/)
  })
})
