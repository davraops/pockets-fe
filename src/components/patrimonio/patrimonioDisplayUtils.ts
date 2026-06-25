import type { CrudSummaryItem } from '../crud/crudSummaryTypes'
import type { PatrimonyItem } from './patrimonioTypes'

export interface PatrimonyDetailField {
  label: string
  value: string
}

export interface PatrimonyDetailSection {
  title: string
  fields: PatrimonyDetailField[]
}

export function formatPatrimonyCurrency(amount: number, currency = 'COP'): string {
  return `${amount.toLocaleString('es-CO')} ${currency}`
}

export function formatPatrimonyDate(dateString?: string): string | null {
  if (!dateString) {
    return null
  }

  const date = new Date(dateString.includes('T') ? dateString : `${dateString}T12:00:00`)
  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatPatrimonyTotalValue(items: PatrimonyItem[]): string {
  const byCurrency = new Map<string, number>()

  for (const item of items) {
    const amount = item.data.currentValue ?? item.data.purchaseValue
    if (amount == null || amount <= 0) {
      continue
    }
    const currency = item.data.currency || 'COP'
    byCurrency.set(currency, (byCurrency.get(currency) ?? 0) + amount)
  }

  if (byCurrency.size === 0) {
    return '—'
  }

  if (byCurrency.size === 1) {
    const [currency, total] = [...byCurrency.entries()][0]
    return formatPatrimonyCurrency(total, currency)
  }

  return `${byCurrency.size} monedas`
}

export function calculatePatrimonyHighlights(items: PatrimonyItem[]) {
  return {
    total: items.length,
    valorTotal: formatPatrimonyTotalValue(items),
    conSeguro: items.filter(i => i.data.insurance?.company?.trim()).length,
    categorias: new Set(items.map(i => i.data.category?.trim()).filter(Boolean)).size,
  }
}

export function patrimonySummaryItems(
  highlights: ReturnType<typeof calculatePatrimonyHighlights>
): CrudSummaryItem[] {
  return [
    { label: 'Ítems', value: highlights.total, tone: 'info' },
    { label: 'Valor total', value: highlights.valorTotal, tone: 'available' },
    { label: 'Con seguro', value: highlights.conSeguro, tone: 'info' },
    { label: 'Categorías', value: highlights.categorias, tone: 'info' },
  ]
}

export interface PatrimonyCardChip {
  label: string
  variant?: 'default' | 'category' | 'insurance' | 'location'
}

export function formatPatrimonyBrandModel(item: PatrimonyItem): string | null {
  const brand = item.data.brand?.trim()
  const model = item.data.model?.trim()
  if (brand && model) {
    return `${brand} ${model}`
  }
  return brand || model || null
}

export function getPatrimonyCardChips(item: PatrimonyItem): PatrimonyCardChip[] {
  const chips: PatrimonyCardChip[] = []

  if (item.data.condition?.trim()) {
    chips.push({ label: item.data.condition.trim() })
  }

  if (item.data.location?.trim()) {
    chips.push({ label: item.data.location.trim(), variant: 'location' })
  }

  if (item.data.insurance?.company?.trim()) {
    chips.push({
      label: item.data.insurance.company.trim(),
      variant: 'insurance',
    })
  }

  if (item.data.serialNumber?.trim()) {
    chips.push({ label: `S/N ${item.data.serialNumber.trim()}` })
  }

  return chips
}

export function formatPatrimonyMeta(item: PatrimonyItem): string {
  const parts: string[] = []

  if (item.data.category) {
    parts.push(item.data.category)
  }

  if (item.data.brand && item.data.model) {
    parts.push(`${item.data.brand} ${item.data.model}`)
  } else if (item.data.brand) {
    parts.push(item.data.brand)
  }

  if (item.data.condition) {
    parts.push(item.data.condition)
  }

  return parts.length > 0 ? parts.join(' · ') : 'Sin categoría'
}

export function formatPatrimonyPreview(item: PatrimonyItem): string | null {
  if (item.data.location?.trim()) {
    return item.data.location.trim()
  }

  if (item.data.description?.trim()) {
    const description = item.data.description.trim()
    return description.length > 80 ? `${description.slice(0, 80)}…` : description
  }

  if (item.data.insurance?.company?.trim()) {
    return `Seguro: ${item.data.insurance.company.trim()}`
  }

  return null
}

export function formatPatrimonyRowValue(item: PatrimonyItem): string | undefined {
  const amount = item.data.currentValue ?? item.data.purchaseValue
  if (amount == null || amount <= 0) {
    return undefined
  }

  return formatPatrimonyCurrency(amount, item.data.currency || 'COP')
}

export function formatPatrimonyDetailSubtitle(item: PatrimonyItem): string {
  const parts: string[] = []

  if (item.data.category) {
    parts.push(item.data.category)
  }

  const value = formatPatrimonyRowValue(item)
  if (value) {
    parts.push(value)
  }

  return parts.length > 0 ? parts.join(' · ') : 'Sin categoría ni valor declarado'
}

function pushField(
  fields: PatrimonyDetailField[],
  label: string,
  value: string | null | undefined
) {
  if (value?.trim()) {
    fields.push({ label, value: value.trim() })
  }
}

export function getPatrimonyDetailFields(item: PatrimonyItem): PatrimonyDetailSection[] {
  const { data } = item
  const currency = data.currency || 'COP'
  const sections: PatrimonyDetailSection[] = []

  const valorFields: PatrimonyDetailField[] = []
  if (data.currentValue != null && data.currentValue > 0) {
    valorFields.push({
      label: 'Valor actual',
      value: formatPatrimonyCurrency(data.currentValue, currency),
    })
  }
  if (data.purchaseValue != null && data.purchaseValue > 0) {
    valorFields.push({
      label: 'Valor de compra',
      value: formatPatrimonyCurrency(data.purchaseValue, currency),
    })
  }
  pushField(valorFields, 'Moneda', currency)
  const purchaseDate = formatPatrimonyDate(data.purchaseDate)
  if (purchaseDate) {
    valorFields.push({ label: 'Fecha de compra', value: purchaseDate })
  }
  if (valorFields.length > 0) {
    sections.push({ title: 'Valores', fields: valorFields })
  }

  const identificacionFields: PatrimonyDetailField[] = []
  pushField(identificacionFields, 'Marca', data.brand)
  pushField(identificacionFields, 'Modelo', data.model)
  pushField(identificacionFields, 'Número de serie', data.serialNumber)
  pushField(identificacionFields, 'Condición', data.condition)
  pushField(identificacionFields, 'Ubicación', data.location)
  if (identificacionFields.length > 0) {
    sections.push({ title: 'Identificación', fields: identificacionFields })
  }

  if (data.description?.trim()) {
    sections.push({
      title: 'Descripción',
      fields: [{ label: 'Detalle', value: data.description.trim() }],
    })
  }

  const insuranceFields: PatrimonyDetailField[] = []
  pushField(insuranceFields, 'Compañía', data.insurance?.company)
  pushField(insuranceFields, 'Póliza', data.insurance?.policyNumber)
  if (data.insurance?.coverage != null && data.insurance.coverage > 0) {
    insuranceFields.push({
      label: 'Cobertura',
      value: formatPatrimonyCurrency(data.insurance.coverage, 'COP'),
    })
  }
  if (insuranceFields.length > 0) {
    sections.push({ title: 'Seguro', fields: insuranceFields })
  }

  if (data.notes?.trim()) {
    sections.push({
      title: 'Notas',
      fields: [{ label: 'Notas', value: data.notes.trim() }],
    })
  }

  const registroFields: PatrimonyDetailField[] = []
  const created = formatPatrimonyDate(item.created_at)
  const updated = formatPatrimonyDate(item.updated_at)
  if (created) {
    registroFields.push({ label: 'Registrado', value: created })
  }
  if (updated && updated !== created) {
    registroFields.push({ label: 'Actualizado', value: updated })
  }
  if (registroFields.length > 0) {
    sections.push({ title: 'Registro', fields: registroFields })
  }

  if (sections.length === 0) {
    sections.push({
      title: 'Información',
      fields: [{ label: 'Estado', value: 'Sin datos adicionales registrados' }],
    })
  }

  return sections
}

export function filterPatrimonyByQuery(items: PatrimonyItem[], query: string): PatrimonyItem[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return items
  }

  return items.filter(item => {
    const haystack = [
      item.name,
      item.data.category ?? '',
      item.data.brand ?? '',
      item.data.model ?? '',
      item.data.serialNumber ?? '',
      item.data.location ?? '',
      item.data.description ?? '',
      item.data.notes ?? '',
      item.data.insurance?.company ?? '',
      item.data.insurance?.policyNumber ?? '',
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalized)
  })
}
