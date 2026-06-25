import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  calculateDiaryStreaks,
  filterDiaryEntriesByQuery,
  findTodayDiaryEntry,
  formatDiaryCardExcerpt,
  formatDiaryCardMeta,
  formatDiaryCardWeekday,
  formatDiaryDateLong,
  formatDiaryListMeta,
  formatDiaryListPreview,
  formatDiaryListTitle,
  formatDiaryReadingTime,
  formatDiaryWordCount,
  getDiaryEntryRecencyLabel,
  getDiaryStreakMessage,
  groupDiaryEntriesByMonth,
  hasDiaryEntryToday,
  isDiaryEntryToday,
  splitTodayDiaryEntry,
} from './miDiarioDisplayUtils'

describe('miDiarioDisplayUtils', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-23T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })
  it('uses content first line as list title and date only in meta', () => {
    const entryDate = '2026-06-15'
    const content = 'Hoy fue un día productivo.\nMañana sigo con el proyecto.'

    expect(formatDiaryListTitle(content, entryDate)).toBe('Hoy fue un día productivo.')
    expect(formatDiaryListMeta(entryDate)).toMatch(/15/)
    expect(formatDiaryListMeta(entryDate)).not.toContain('productivo')
  })

  it('falls back when content is empty', () => {
    expect(formatDiaryListTitle('   ', '2026-06-15')).toMatch(/Entrada sin texto/)
  })

  it('shows multiline remainder in preview only', () => {
    expect(formatDiaryListPreview('Solo una línea')).toBeNull()
    expect(formatDiaryListPreview('Línea uno\nLínea dos')).toMatch(/Línea dos/)
  })

  it('calculates current and longest diary streaks', () => {
    expect(
      calculateDiaryStreaks(['2026-06-23', '2026-06-22', '2026-06-20'])
    ).toEqual({ current: 2, longest: 2 })

    expect(calculateDiaryStreaks(['2026-06-20', '2026-06-18'])).toEqual({
      current: 0,
      longest: 1,
    })
  })

  it('filters diary entries by content and date', () => {
    const entries = [
      { entry_date: '2026-06-23', content: 'Día productivo en casa' },
      { entry_date: '2026-06-20', content: 'Viaje a la playa' },
    ]

    expect(filterDiaryEntriesByQuery(entries, 'playa')).toHaveLength(1)
    expect(filterDiaryEntriesByQuery(entries, '2026-06-23')).toHaveLength(1)
  })

  it('formats card date parts and recency labels', () => {
    expect(formatDiaryCardWeekday('2026-06-23')).toBe('Martes')
    expect(getDiaryEntryRecencyLabel('2026-06-23')).toBe('Hoy')
    expect(getDiaryEntryRecencyLabel('2026-06-22')).toBe('Ayer')
    expect(isDiaryEntryToday('2026-06-23')).toBe(true)
  })

  it('builds card excerpt and word count', () => {
    const content = 'Primera línea larga '.repeat(8).trim()
    expect(formatDiaryCardExcerpt(`${content}\nSegunda línea`)).toMatch(/Segunda/)
    expect(formatDiaryWordCount('Hola mundo otra vez')).toBe('4 palabras')
  })

  it('groups diary entries by month preserving order', () => {
    const entries = [
      { id: '1', entry_date: '2026-06-23', content: 'Junio reciente' },
      { id: '2', entry_date: '2026-06-10', content: 'Junio antiguo' },
      { id: '3', entry_date: '2026-05-30', content: 'Mayo' },
    ]

    const groups = groupDiaryEntriesByMonth(entries)
    expect(groups).toHaveLength(2)
    expect(groups[0].label).toMatch(/junio/i)
    expect(groups[0].entries).toHaveLength(2)
    expect(groups[1].label).toMatch(/mayo/i)
  })

  it('splits today entry from feed list', () => {
    const entries = [
      { id: 'today', entry_date: '2026-06-23', content: 'Hoy' },
      { id: 'old', entry_date: '2026-06-20', content: 'Antes' },
    ]

    expect(findTodayDiaryEntry(entries)?.id).toBe('today')
    expect(hasDiaryEntryToday(entries)).toBe(true)
    expect(splitTodayDiaryEntry(entries).rest).toHaveLength(1)
  })

  it('builds streak messages and reading time', () => {
    expect(getDiaryStreakMessage(4, true, 10)).toMatch(/4 días/)
    expect(getDiaryStreakMessage(3, false, 10)).toMatch(/mantener/)
    expect(formatDiaryReadingTime('uno dos tres cuatro cinco')).toBe('1 min de lectura')
    expect(formatDiaryCardMeta('2026-06-23', 'Hola mundo')).toContain('Martes')
  })
})
