/** Eventos de sincronización entre módulos de Finanzas. */
export type FinanceEvent = 'budgetsUpdated' | 'debtorsUpdated' | 'debtsUpdated' | 'projectsUpdated'

export function emitFinanceEvent(event: FinanceEvent): void {
  window.dispatchEvent(new Event(event))
}

export function subscribeFinanceEvent(event: FinanceEvent, handler: () => void): () => void {
  window.addEventListener(event, handler)
  return () => window.removeEventListener(event, handler)
}
