import type { PersonalValueEntry, PersonalValueKind, ValoresFilterKind } from './valorTypes'

export function normalizePersonalValueKind(kind: string | undefined): PersonalValueKind {
  return kind === 'belief' ? 'belief' : 'value'
}

export function getPersonalValueKindLabel(kind: PersonalValueKind): string {
  return kind === 'belief' ? 'Creencia' : 'Valor'
}

export function getPersonalValueKindPlural(kind: PersonalValueKind): string {
  return kind === 'belief' ? 'Creencias' : 'Valores'
}

export function filterPersonalValuesByKind(
  entries: PersonalValueEntry[],
  filter: ValoresFilterKind
): PersonalValueEntry[] {
  if (filter === 'all') {
    return entries
  }
  return entries.filter(entry => entry.kind === filter)
}

export function filterPersonalValuesByQuery(
  entries: PersonalValueEntry[],
  query: string
): PersonalValueEntry[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return entries
  }

  return entries.filter(entry => {
    const haystack = [entry.title, entry.description ?? '', getPersonalValueKindLabel(entry.kind)]
      .join(' ')
      .toLowerCase()
    return haystack.includes(normalized)
  })
}

export function sortPersonalValues(entries: PersonalValueEntry[]): PersonalValueEntry[] {
  return [...entries].sort((a, b) => {
    if (a.kind !== b.kind) {
      return a.kind === 'value' ? -1 : 1
    }
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })
}

export function summarizePersonalValues(entries: PersonalValueEntry[]): {
  total: number
  values: number
  beliefs: number
} {
  const values = entries.filter(entry => entry.kind === 'value').length
  const beliefs = entries.filter(entry => entry.kind === 'belief').length
  return {
    total: entries.length,
    values,
    beliefs,
  }
}

export function groupPersonalValuesByKind(entries: PersonalValueEntry[]): {
  values: PersonalValueEntry[]
  beliefs: PersonalValueEntry[]
} {
  return {
    values: entries.filter(entry => entry.kind === 'value'),
    beliefs: entries.filter(entry => entry.kind === 'belief'),
  }
}

export function formatPersonalValueExcerpt(description: string | null, maxLength = 140): string {
  if (!description?.trim()) {
    return ''
  }
  const trimmed = description.trim()
  if (trimmed.length <= maxLength) {
    return trimmed
  }
  return `${trimmed.slice(0, maxLength).trimEnd()}…`
}
