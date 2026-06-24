const STORAGE_KEY = 'pockets-calculadora-history'
const MAX_ENTRIES = 50

export interface CalculadoraHistoryEntry {
  expression: string
  result: string
  timestamp: number
}

function isValidEntry(value: unknown): value is CalculadoraHistoryEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as CalculadoraHistoryEntry
  return (
    typeof entry.expression === 'string' &&
    typeof entry.result === 'string' &&
    typeof entry.timestamp === 'number'
  )
}

export function loadCalculadoraHistory(): CalculadoraHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidEntry)
  } catch {
    return []
  }
}

export function saveCalculadoraHistory(entries: CalculadoraHistoryEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)))
}

export function addCalculadoraHistoryEntry(entry: CalculadoraHistoryEntry): CalculadoraHistoryEntry[] {
  const next = [entry, ...loadCalculadoraHistory()].slice(0, MAX_ENTRIES)
  saveCalculadoraHistory(next)
  return next
}

export function clearCalculadoraHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}
