const LIST_TITLE_MAX_LENGTH = 80
const LIST_PREVIEW_MAX_LENGTH = 100
const CARD_EXCERPT_MAX_LENGTH = 140

export function formatDiaryDateLong(dateString: string): string {
  const date = parseDiaryDate(dateString)
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDiaryDateShort(dateString: string): string {
  const date = parseDiaryDate(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function parseDiaryDate(dateString: string): Date {
  const normalized = dateString.split('T')[0]
  return new Date(`${normalized}T12:00:00`)
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return `${text.slice(0, maxLength - 1)}…`
}

/** Título escaneable: primera línea del contenido, o fallback con fecha */
export function formatDiaryListTitle(content: string, entryDate: string): string {
  const trimmed = content.trim()
  if (!trimmed) {
    return `Entrada sin texto · ${formatDiaryDateShort(entryDate)}`
  }

  const firstLine = trimmed.split('\n').find(line => line.trim())?.trim() ?? trimmed
  return truncateText(firstLine, LIST_TITLE_MAX_LENGTH)
}

/** Meta: solo la fecha (una vez) */
export function formatDiaryListMeta(entryDate: string): string {
  return formatDiaryDateShort(entryDate)
}

/** Preview: resto del contenido cuando hay más de una línea */
export function formatDiaryListPreview(content: string): string | null {
  const trimmed = content.trim()
  if (!trimmed) {
    return null
  }

  const lines = trimmed.split('\n').map(line => line.trim()).filter(Boolean)
  if (lines.length <= 1) {
    return null
  }

  const rest = lines.slice(1).join(' · ')
  return truncateText(rest, LIST_PREVIEW_MAX_LENGTH)
}

export function formatDiaryCardDay(entryDate: string): string {
  return String(parseDiaryDate(entryDate).getDate())
}

export function formatDiaryCardMonth(entryDate: string): string {
  return parseDiaryDate(entryDate)
    .toLocaleDateString('es-ES', { month: 'short' })
    .replace('.', '')
    .toUpperCase()
}

export function formatDiaryCardWeekday(entryDate: string): string {
  const weekday = parseDiaryDate(entryDate).toLocaleDateString('es-ES', { weekday: 'long' })
  return weekday.charAt(0).toUpperCase() + weekday.slice(1)
}

export function formatDiaryCardExcerpt(content: string): string | null {
  const trimmed = content.trim()
  if (!trimmed) {
    return null
  }

  const lines = trimmed.split('\n').map(line => line.trim()).filter(Boolean)
  if (lines.length > 1) {
    return truncateText(lines.slice(1).join(' '), CARD_EXCERPT_MAX_LENGTH)
  }

  const firstLine = lines[0]
  if (firstLine.length <= LIST_TITLE_MAX_LENGTH) {
    return null
  }

  return truncateText(firstLine.slice(LIST_TITLE_MAX_LENGTH).trim(), CARD_EXCERPT_MAX_LENGTH)
}

export function getDiaryWordCount(content: string): number {
  const trimmed = content.trim()
  if (!trimmed) {
    return 0
  }
  return trimmed.split(/\s+/).filter(Boolean).length
}

export function formatDiaryWordCount(content: string): string {
  const count = getDiaryWordCount(content)
  if (count === 0) {
    return 'Sin texto'
  }
  return count === 1 ? '1 palabra' : `${count} palabras`
}

export function formatDiaryReadingTime(content: string): string | null {
  const words = getDiaryWordCount(content)
  if (words === 0) {
    return null
  }
  const minutes = Math.max(1, Math.ceil(words / 200))
  return minutes === 1 ? '1 min de lectura' : `${minutes} min de lectura`
}

export function formatDiaryCardMeta(entryDate: string, content: string): string {
  const parts = [formatDiaryCardWeekday(entryDate), formatDiaryWordCount(content)]
  const readingTime = formatDiaryReadingTime(content)
  if (readingTime) {
    parts.push(readingTime)
  }
  return parts.join(' · ')
}

export function hasDiaryEntryToday<T extends DiarySearchableEntry>(entries: T[]): boolean {
  const todayKey = formatLocalDateKey(new Date())
  return entries.some(entry => normalizeDiaryDateKey(entry.entry_date) === todayKey)
}

export function findTodayDiaryEntry<T extends DiarySearchableEntry & { id: string }>(
  entries: T[]
): T | null {
  const todayKey = formatLocalDateKey(new Date())
  return entries.find(entry => normalizeDiaryDateKey(entry.entry_date) === todayKey) ?? null
}

export function splitTodayDiaryEntry<T extends DiarySearchableEntry & { id: string }>(
  entries: T[]
): { todayEntry: T | null; rest: T[] } {
  const todayEntry = findTodayDiaryEntry(entries)
  if (!todayEntry) {
    return { todayEntry: null, rest: entries }
  }
  return {
    todayEntry,
    rest: entries.filter(entry => entry.id !== todayEntry.id),
  }
}

export function getDiaryStreakMessage(
  currentStreak: number,
  hasTodayEntry: boolean,
  totalEntries: number
): string {
  if (totalEntries === 0) {
    return 'Tu primer párrafo abre el diario.'
  }

  if (hasTodayEntry) {
    if (currentStreak >= 7) {
      return `Impresionante: ${currentStreak} días seguidos escribiendo.`
    }
    if (currentStreak >= 3) {
      return `Vas muy bien. Llevas ${currentStreak} días de racha.`
    }
    if (currentStreak > 1) {
      return `Ya escribiste hoy. Racha de ${currentStreak} días.`
    }
    return 'Ya escribiste hoy. Buen momento para cerrar el día.'
  }

  if (currentStreak > 0) {
    return `Escribe hoy para mantener tu racha de ${currentStreak} día${currentStreak === 1 ? '' : 's'}.`
  }

  return 'Unas líneas bastan para retomar el hábito.'
}

export function isDiaryEntryToday(entryDate: string): boolean {
  return normalizeDiaryDateKey(entryDate) === formatLocalDateKey(new Date())
}

export function isDiaryEntryYesterday(entryDate: string): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return normalizeDiaryDateKey(entryDate) === formatLocalDateKey(yesterday)
}

export function getDiaryEntryRecencyLabel(entryDate: string): string | null {
  if (isDiaryEntryToday(entryDate)) {
    return 'Hoy'
  }
  if (isDiaryEntryYesterday(entryDate)) {
    return 'Ayer'
  }
  return null
}

export function groupDiaryEntriesByMonth<T extends DiarySearchableEntry>(
  entries: T[]
): Array<{ monthKey: string; label: string; entries: T[] }> {
  const groups = new Map<string, T[]>()

  for (const entry of entries) {
    const monthKey = getDiaryMonthKey(entry.entry_date)
    const bucket = groups.get(monthKey)
    if (bucket) {
      bucket.push(entry)
    } else {
      groups.set(monthKey, [entry])
    }
  }

  const result: Array<{ monthKey: string; label: string; entries: T[] }> = []
  const seen = new Set<string>()

  for (const entry of entries) {
    const monthKey = getDiaryMonthKey(entry.entry_date)
    if (seen.has(monthKey)) {
      continue
    }
    seen.add(monthKey)
    result.push({
      monthKey,
      label: formatDiaryMonthLabel(entry.entry_date),
      entries: groups.get(monthKey) ?? [],
    })
  }

  return result
}

function getDiaryMonthKey(entryDate: string): string {
  const date = parseDiaryDate(entryDate)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}`
}

function formatDiaryMonthLabel(entryDate: string): string {
  const label = parseDiaryDate(entryDate).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeDiaryDateKey(dateString: string): string {
  return dateString.split('T')[0]
}

function parseDiaryDateKeys(entryDates: string[]): Date[] {
  const uniqueDates = new Set(entryDates.map(normalizeDiaryDateKey))
  return Array.from(uniqueDates)
    .map(dateKey => new Date(`${dateKey}T00:00:00`))
    .sort((a, b) => b.getTime() - a.getTime())
}

function calculateLongestDiaryStreak(sortedDates: Date[]): number {
  if (sortedDates.length === 0) {
    return 0
  }

  const datesAsc = [...sortedDates].sort((a, b) => a.getTime() - b.getTime())
  let longestStreakCount = 1
  let currentStreakCount = 1

  for (let index = 1; index < datesAsc.length; index += 1) {
    const previousDate = new Date(datesAsc[index - 1])
    const currentDate = new Date(datesAsc[index])
    const diffDays = Math.floor(
      (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffDays === 1) {
      currentStreakCount += 1
      longestStreakCount = Math.max(longestStreakCount, currentStreakCount)
    } else {
      currentStreakCount = 1
    }
  }

  return longestStreakCount
}

export function calculateDiaryStreaks(entryDates: string[]): { current: number; longest: number } {
  const sortedDates = parseDiaryDateKeys(entryDates)
  if (sortedDates.length === 0) {
    return { current: 0, longest: 0 }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const hasToday = sortedDates.some(date => formatLocalDateKey(date) === formatLocalDateKey(today))
  const hasYesterday = sortedDates.some(
    date => formatLocalDateKey(date) === formatLocalDateKey(yesterday)
  )

  let current = 0
  if (hasToday || hasYesterday) {
    const startDate = hasToday ? today : yesterday
    const checkDate = new Date(startDate)

    while (
      sortedDates.some(date => formatLocalDateKey(date) === formatLocalDateKey(checkDate))
    ) {
      current += 1
      checkDate.setDate(checkDate.getDate() - 1)
    }
  }

  return {
    current,
    longest: calculateLongestDiaryStreak(sortedDates),
  }
}

export interface DiarySearchableEntry {
  entry_date: string
  content: string
}

export function filterDiaryEntriesByQuery<T extends DiarySearchableEntry>(
  entries: T[],
  query: string
): T[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return entries
  }

  return entries.filter(entry => {
    const haystack = [
      entry.content,
      entry.entry_date.split('T')[0],
      formatDiaryDateLong(entry.entry_date),
      formatDiaryDateShort(entry.entry_date),
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalized)
  })
}
