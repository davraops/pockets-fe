import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api'
import { devError } from '../utils/debugTools'

export type DashboardSourceStatus = 'loading' | 'ready' | 'error'

export interface HomeDashboardEvent {
  title: string
  date: string
  time: string | null
  isToday: boolean
}

export interface HomeDashboardRoutine {
  id: string
  title: string
  scheduledTime: string | null
}

export interface HomeDashboardData {
  routinesTotal: number
  routinesPending: number
  pendingRoutines: HomeDashboardRoutine[]
  routinesStatus: DashboardSourceStatus
  balanceCop: number
  monthIngresos: number
  monthEgresos: number
  monthNet: number
  financeStatus: DashboardSourceStatus
  upcomingEvents: HomeDashboardEvent[]
  eventsStatus: DashboardSourceStatus
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T12:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

function getCurrentMonthDateRange(): { start: string; end: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const monthStr = String(month + 1).padStart(2, '0')
  const lastDay = new Date(year, month + 1, 0).getDate()
  return {
    start: `${year}-${monthStr}-01`,
    end: `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`,
  }
}

interface EventApiRow {
  title: string
  event_date: string
  event_time?: string | null
  is_all_day?: boolean
}

interface RoutineApiRow {
  id: string
  title: string
  scheduled_time?: string | null
}

function sortByScheduledTime(
  a: { scheduledTime: string | null },
  b: { scheduledTime: string | null }
): number {
  const timeA = a.scheduledTime || ''
  const timeB = b.scheduledTime || ''
  if (timeA && timeB) return timeA.localeCompare(timeB)
  if (timeA && !timeB) return -1
  if (!timeA && timeB) return 1
  return 0
}

function findUpcomingEvents(events: EventApiRow[], limit = 4): HomeDashboardEvent[] {
  const now = new Date()
  const todayStr = getTodayDate()

  const sorted = [...events].sort((a, b) => {
    const dateA = a.event_date.split('T')[0]
    const dateB = b.event_date.split('T')[0]
    const dateCompare = dateA.localeCompare(dateB)
    if (dateCompare !== 0) return dateCompare
    const timeA = a.is_all_day ? '00:00' : a.event_time || '23:59'
    const timeB = b.is_all_day ? '00:00' : b.event_time || '23:59'
    return timeA.localeCompare(timeB)
  })

  const upcoming: HomeDashboardEvent[] = []

  for (const event of sorted) {
    const eventDate = event.event_date.split('T')[0]
    if (eventDate < todayStr) continue

    if (eventDate > todayStr) {
      upcoming.push({
        title: event.title,
        date: eventDate,
        time: event.event_time ?? null,
        isToday: false,
      })
    } else if (event.is_all_day || !event.event_time) {
      upcoming.push({
        title: event.title,
        date: eventDate,
        time: null,
        isToday: true,
      })
    } else {
      const [hours, minutes] = event.event_time.split(':').map(Number)
      const eventDateTime = new Date(now)
      eventDateTime.setHours(hours, minutes, 0, 0)
      if (eventDateTime >= now) {
        upcoming.push({
          title: event.title,
          date: eventDate,
          time: event.event_time,
          isToday: true,
        })
      }
    }

    if (upcoming.length >= limit) break
  }

  return upcoming
}

const initialData: HomeDashboardData = {
  routinesTotal: 0,
  routinesPending: 0,
  pendingRoutines: [],
  routinesStatus: 'loading',
  balanceCop: 0,
  monthIngresos: 0,
  monthEgresos: 0,
  monthNet: 0,
  financeStatus: 'loading',
  upcomingEvents: [],
  eventsStatus: 'loading',
}

export function useHomeDashboard() {
  const [data, setData] = useState<HomeDashboardData>(initialData)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadDashboard = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true)
    } else {
      setData(current => ({
        ...current,
        routinesStatus: 'loading',
        financeStatus: 'loading',
        eventsStatus: 'loading',
      }))
    }

    const today = getTodayDate()
    const weekEnd = addDays(today, 14)
    const { start: monthStart, end: monthEnd } = getCurrentMonthDateRange()

    const requests = [
      { key: 'routines', fetch: () => api.getRoutinesByDate(today) },
      { key: 'completions', fetch: () => api.getRoutineCompletions({ start_date: today, end_date: today }) },
      { key: 'accounts', fetch: () => api.getBankAccounts() },
      { key: 'transactions', fetch: () => api.getTransactions({ start_date: monthStart, end_date: monthEnd }) },
      { key: 'events', fetch: () => api.getEvents({ start_date: today, end_date: weekEnd }) },
    ] as const

    const results = await Promise.allSettled(requests.map(request => request.fetch()))
    const failed = new Set<string>()

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        failed.add(requests[index].key)
        devError(`Home dashboard: error al cargar ${requests[index].key}`, result.reason)
      }
    })

    const routinesRes = results[0].status === 'fulfilled' ? results[0].value : null
    const completionsRes = results[1].status === 'fulfilled' ? results[1].value : null
    const accountsRes = results[2].status === 'fulfilled' ? results[2].value : null
    const transactionsRes = results[3].status === 'fulfilled' ? results[3].value : null
    const eventsRes = results[4].status === 'fulfilled' ? results[4].value : null

    const routinesToday: RoutineApiRow[] = routinesRes?.routines ?? []
    const completions = (completionsRes?.completions ?? []).filter((completion: { completed_date?: string; completedDate?: string }) => {
      const completionDate = completion.completed_date || completion.completedDate
      if (!completionDate) return false
      return completionDate.split('T')[0] === today
    })
    const completedIds = new Set(
      completions.map((completion: { routine_id: string }) => completion.routine_id)
    )

    const allPendingRoutines = routinesToday
      .filter((routine: RoutineApiRow) => !completedIds.has(routine.id))
      .map((routine: RoutineApiRow) => ({
        id: routine.id,
        title: routine.title,
        scheduledTime: routine.scheduled_time ?? null,
      }))
      .sort(sortByScheduledTime)

    const routinesTotal = routinesToday.length
    const routinesPending = allPendingRoutines.length
    const pendingRoutines = allPendingRoutines.slice(0, 5)

    const balanceCop =
      accountsRes?.accounts?.reduce(
        (sum: number, account: { balance?: { cop?: { amount?: number } } }) =>
          sum + (account.balance?.cop?.amount || 0),
        0
      ) ?? 0

    const monthTransactions = transactionsRes?.transactions ?? []
    const monthIngresos = monthTransactions
      .filter((tx: { type: string }) => tx.type === 'ingreso')
      .reduce((sum: number, tx: { amount?: number }) => sum + (tx.amount || 0), 0)
    const monthEgresos = monthTransactions
      .filter((tx: { type: string }) => tx.type === 'egreso')
      .reduce((sum: number, tx: { amount?: number }) => sum + (tx.amount || 0), 0)

    const upcomingEvents = eventsRes?.events ? findUpcomingEvents(eventsRes.events) : []

    setData({
      routinesTotal,
      routinesPending,
      pendingRoutines,
      routinesStatus:
        failed.has('routines') || failed.has('completions') ? 'error' : 'ready',
      balanceCop,
      monthIngresos,
      monthEgresos,
      monthNet: monthIngresos - monthEgresos,
      financeStatus:
        failed.has('accounts') || failed.has('transactions') ? 'error' : 'ready',
      upcomingEvents,
      eventsStatus: failed.has('events') ? 'error' : 'ready',
    })
    setIsRefreshing(false)
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  return { data, isRefreshing, reload: () => void loadDashboard(true) }
}
