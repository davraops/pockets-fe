import { emitFinanceEvent } from './financeEvents'

/** Notifica a módulos dependientes tras mutar transacciones (backend atómico). */
export function emitTransactionSyncEvents(): void {
  emitFinanceEvent('budgetsUpdated')
  emitFinanceEvent('debtsUpdated')
  emitFinanceEvent('debtorsUpdated')
  emitFinanceEvent('projectsUpdated')
}
