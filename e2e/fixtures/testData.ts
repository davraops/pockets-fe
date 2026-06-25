/** Unique suffix for E2E entities — avoids collisions across runs. */
export function uniqueSuffix(): string {
  return Date.now().toString(36)
}

export function e2eLabel(prefix = 'E2E'): string {
  return `${prefix} ${uniqueSuffix()}`
}

/** ISO date (YYYY-MM-DD) for date inputs in forms. */
export function e2eToday(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Yesterday's ISO date — useful when today's entry uses a different UI panel. */
export function e2eYesterday(): string {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return date.toISOString().slice(0, 10)
}

/** ISO date N days in the future (forms that reject past dates). */
export function e2eDaysAhead(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

/** ISO date N months in the future. */
export function e2eMonthsAhead(months: number): string {
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  return date.toISOString().slice(0, 10)
}
