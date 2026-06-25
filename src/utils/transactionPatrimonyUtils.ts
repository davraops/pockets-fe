import {
  EMPTY_PATRIMONY_FORM,
  formDataToPatrimonyPayload,
  type PatrimonyFormData,
} from '../components/patrimonio/patrimonioFormUtils'
import type { PatrimonyItem } from '../components/patrimonio/patrimonioTypes'

export interface TransactionPatrimonySource {
  descripcion: string
  categoria: string
  monto: string
  fecha: string
  moneda: string
}

export type PatrimonySyncField =
  | 'name'
  | 'category'
  | 'purchaseValue'
  | 'currentValue'
  | 'purchaseDate'
  | 'currency'
  | 'description'
  | 'brand'
  | 'model'
  | 'notes'

export const PATRIMONY_CONDITION_OPTIONS = [
  'Nuevo',
  'Excelente',
  'Muy buena',
  'Buena',
  'Regular',
  'Para restaurar',
] as const

export const PATRIMONY_CATEGORY_SUGGESTIONS = [
  'Electrónica',
  'Relojes',
  'Joyas',
  'Arte',
  'Muebles',
  'Herramientas',
  'Coleccionables',
  'Equipos',
  'Inmuebles',
  'Otros',
] as const

const GENERIC_TX_CATEGORIES = new Set([
  'compras',
  'gastos',
  'otros',
  'general',
  'egresos',
  'consumo',
  'servicios',
])

const PATRIMONY_LIKELY_TX_CATEGORIES = [
  'electrónica',
  'electronica',
  'tecnología',
  'tecnologia',
  'arte',
  'joyas',
  'reloj',
  'mueble',
  'herramienta',
  'coleccionable',
  'equipo',
  'inversión',
  'inversion',
  'patrimonio',
  'bien',
]

const CATEGORY_ALIASES: Array<{ match: RegExp; category: string }> = [
  { match: /electr[oó]ni|tecnolog/i, category: 'Electrónica' },
  { match: /reloj/i, category: 'Relojes' },
  { match: /joya/i, category: 'Joyas' },
  { match: /arte|pintura|escultura/i, category: 'Arte' },
  { match: /mueble/i, category: 'Muebles' },
  { match: /herramienta/i, category: 'Herramientas' },
  { match: /coleccion/i, category: 'Coleccionables' },
  { match: /inmueble|propiedad/i, category: 'Inmuebles' },
]

const BRAND_PATTERNS: Array<{ brand: string; patterns: RegExp[] }> = [
  { brand: 'Apple', patterns: [/macbook/i, /iphone/i, /ipad/i, /imac/i, /\bapple\b/i] },
  { brand: 'Rolex', patterns: [/\brolex\b/i, /submariner/i, /datejust/i] },
  { brand: 'Samsung', patterns: [/\bsamsung\b/i, /galaxy/i] },
  { brand: 'Sony', patterns: [/\bsony\b/i, /playstation/i] },
  { brand: 'Canon', patterns: [/\bcanon\b/i] },
  { brand: 'Nikon', patterns: [/\bnikon\b/i] },
]

export function canAddTransactionToPatrimony(
  tipo: 'ingreso' | 'egreso' | 'ahorro',
  isDebtPayment: boolean,
  isEditMode: boolean
): boolean {
  return tipo === 'egreso' && !isDebtPayment && !isEditMode
}

export function shouldSuggestPatrimonio(categoria: string): boolean {
  const normalized = categoria.trim().toLowerCase()
  if (!normalized) {
    return false
  }

  return PATRIMONY_LIKELY_TX_CATEGORIES.some(
    hint => normalized.includes(hint) || hint.includes(normalized)
  )
}

export function resolvePatrimonyCategory(txCategory: string): string {
  const normalized = txCategory.trim().toLowerCase()
  if (!normalized || GENERIC_TX_CATEGORIES.has(normalized)) {
    return ''
  }

  for (const alias of CATEGORY_ALIASES) {
    if (alias.match.test(normalized)) {
      return alias.category
    }
  }

  return txCategory.trim()
}

export function inferBrandModel(description: string): { brand?: string; model?: string } {
  const trimmed = description.trim()
  if (!trimmed) {
    return {}
  }

  for (const entry of BRAND_PATTERNS) {
    if (entry.patterns.some(pattern => pattern.test(trimmed))) {
      return { brand: entry.brand, model: trimmed }
    }
  }

  return {}
}

export function buildTransactionPatrimonyNote(source: TransactionPatrimonySource): string {
  const amount = source.monto.trim()
  const currency = source.moneda.trim() || 'COP'
  const date = source.fecha.trim()

  const parts = ['Registrado desde una transacción']
  if (date) {
    parts.push(`fecha ${date}`)
  }
  if (amount) {
    parts.push(`monto ${amount} ${currency}`)
  }

  return parts.join(' · ')
}

export function buildPatrimonyFormFromTransaction(
  source: TransactionPatrimonySource
): PatrimonyFormData {
  const description = source.descripcion.trim()
  const amount = source.monto.trim()
  const resolvedCategory =
    resolvePatrimonyCategory(source.categoria) || source.categoria.trim()
  const { brand, model } = inferBrandModel(description)

  return {
    ...EMPTY_PATRIMONY_FORM,
    name: description,
    category: resolvedCategory,
    purchaseDate: source.fecha,
    purchaseValue: amount,
    currentValue: amount,
    currency: source.moneda || 'COP',
    brand: brand ?? '',
    model: model ?? '',
    description: description ? `Compra registrada: ${description}` : '',
    notes: buildTransactionPatrimonyNote(source),
  }
}

export function mergePatrimonyFromTransaction(
  current: PatrimonyFormData,
  source: TransactionPatrimonySource,
  touchedFields: ReadonlySet<PatrimonySyncField>
): PatrimonyFormData {
  const built = buildPatrimonyFormFromTransaction(source)

  return {
    ...current,
    name: touchedFields.has('name') ? current.name : built.name,
    category: touchedFields.has('category') ? current.category : built.category,
    purchaseDate: touchedFields.has('purchaseDate') ? current.purchaseDate : built.purchaseDate,
    purchaseValue: touchedFields.has('purchaseValue') ? current.purchaseValue : built.purchaseValue,
    currentValue: touchedFields.has('currentValue') ? current.currentValue : built.currentValue,
    currency: touchedFields.has('currency') ? current.currency : built.currency,
    description: touchedFields.has('description') ? current.description : built.description,
    brand: touchedFields.has('brand') ? current.brand : built.brand,
    model: touchedFields.has('model') ? current.model : built.model,
    notes: touchedFields.has('notes') ? current.notes : built.notes,
  }
}

export function mergeCategorySuggestions(
  existingCategories: string[],
  extra: string[] = []
): string[] {
  const seen = new Set<string>()
  const merged: string[] = []

  for (const category of [...PATRIMONY_CATEGORY_SUGGESTIONS, ...extra, ...existingCategories]) {
    const trimmed = category.trim()
    if (!trimmed) {
      continue
    }
    const key = trimmed.toLowerCase()
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    merged.push(trimmed)
  }

  return merged
}

export function patrimonyFormToPreviewItem(form: PatrimonyFormData): PatrimonyItem {
  const payload = formDataToPatrimonyPayload({
    ...form,
    name: form.name.trim() || 'Sin nombre',
  })

  return {
    id: 'preview',
    name: payload.name,
    data: payload.data,
  }
}

export function formatPatrimonyPreviewAmount(amount: string, currency: string): string | null {
  const parsed = parseFloat(amount)
  if (!amount.trim() || Number.isNaN(parsed) || parsed <= 0) {
    return null
  }

  const locale = currency === 'EUR' ? 'es-ES' : currency === 'USD' ? 'en-US' : 'es-CO'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency || 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parsed)
}
