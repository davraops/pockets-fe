import type { CrudSummaryItem } from '../crud/crudSummaryTypes'
import type { PatrimonyItem } from './patrimonioTypes'

export function calculatePatrimonyHighlights(items: PatrimonyItem[]) {
  return {
    total: items.length,
    conValor: items.filter(
      i =>
        (i.data.purchaseValue != null && i.data.purchaseValue > 0) ||
        (i.data.currentValue != null && i.data.currentValue > 0)
    ).length,
    conSeguro: items.filter(i => i.data.insurance?.company?.trim()).length,
    categorias: new Set(items.map(i => i.data.category?.trim()).filter(Boolean)).size,
  }
}

export function patrimonySummaryItems(
  highlights: ReturnType<typeof calculatePatrimonyHighlights>
): CrudSummaryItem[] {
  return [
    { label: 'Total', value: highlights.total, tone: 'info' },
    { label: 'Con valor', value: highlights.conValor, tone: 'available' },
    { label: 'Con seguro', value: highlights.conSeguro, tone: 'info' },
    { label: 'Categorías', value: highlights.categorias, tone: 'info' },
  ]
}

export function formatPatrimonyMeta(item: PatrimonyItem): string {
  const parts: string[] = []
  if (item.data.brand && item.data.model) {
    parts.push(`${item.data.brand} ${item.data.model}`)
  }
  if (item.data.category) {
    parts.push(item.data.category)
  }
  if (item.data.condition) {
    parts.push(item.data.condition)
  }
  return parts.length > 0 ? parts.join(' • ') : 'Sin categoría'
}

export function formatPatrimonyPreview(item: PatrimonyItem): string | null {
  if (item.data.currentValue != null && item.data.currentValue > 0) {
    return `Valor actual: ${item.data.currentValue.toLocaleString('es-CO')} ${item.data.currency || 'COP'}`
  }
  if (item.data.purchaseValue != null && item.data.purchaseValue > 0) {
    return `Valor compra: ${item.data.purchaseValue.toLocaleString('es-CO')} ${item.data.currency || 'COP'}`
  }
  if (item.data.location) {
    return item.data.location
  }
  return null
}

export function formatPatrimonyRowValue(item: PatrimonyItem): string | undefined {
  const hasValue =
    (item.data.currentValue != null && item.data.currentValue > 0) ||
    (item.data.purchaseValue != null && item.data.purchaseValue > 0)

  if (!hasValue) {
    return undefined
  }

  const amount = (item.data.currentValue ?? item.data.purchaseValue)?.toLocaleString('es-CO')
  return `${amount} ${item.data.currency || 'COP'}`
}
