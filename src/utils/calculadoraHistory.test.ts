import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  addCalculadoraHistoryEntry,
  clearCalculadoraHistory,
  loadCalculadoraHistory,
  type CalculadoraHistoryEntry,
} from './calculadoraHistory'

const STORAGE_KEY = 'pockets-calculadora-history'

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
}

describe('calculadoraHistory', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock())
  })

  it('returns empty array when nothing is stored', () => {
    expect(loadCalculadoraHistory()).toEqual([])
  })

  it('persists and loads entries from localStorage', () => {
    const entry: CalculadoraHistoryEntry = {
      expression: '2 + 2 = 4',
      result: '4',
      timestamp: 1_700_000_000_000,
    }

    addCalculadoraHistoryEntry(entry)

    expect(loadCalculadoraHistory()).toEqual([entry])
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual([entry])
  })

  it('prepends new entries and keeps the most recent first', () => {
    const first: CalculadoraHistoryEntry = {
      expression: '1 + 1 = 2',
      result: '2',
      timestamp: 1,
    }
    const second: CalculadoraHistoryEntry = {
      expression: '3 + 3 = 6',
      result: '6',
      timestamp: 2,
    }

    addCalculadoraHistoryEntry(first)
    addCalculadoraHistoryEntry(second)

    expect(loadCalculadoraHistory()).toEqual([second, first])
  })

  it('clears stored history', () => {
    addCalculadoraHistoryEntry({
      expression: '5 × 5 = 25',
      result: '25',
      timestamp: Date.now(),
    })

    clearCalculadoraHistory()

    expect(loadCalculadoraHistory()).toEqual([])
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
