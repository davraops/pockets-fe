import { describe, expect, it } from 'vitest'
import { getVisibleKanbanColumns } from './actividadKanbanUtils'
import type { KanbanColumnDef } from './activityTypes'

describe('getVisibleKanbanColumns', () => {
  const columns: KanbanColumnDef[] = [
    { id: 'defined', label: 'Por hacer' },
    { id: 'in_progress', label: 'En curso' },
    { id: 'blocked', label: 'Bloqueada' },
  ]

  it('returns all columns on desktop', () => {
    expect(getVisibleKanbanColumns(columns, 'defined', false)).toEqual(columns)
  })

  it('returns only the active column on mobile', () => {
    expect(getVisibleKanbanColumns(columns, 'in_progress', true)).toEqual([
      { id: 'in_progress', label: 'En curso' },
    ])
  })

  it('returns empty when active id is missing on mobile', () => {
    expect(getVisibleKanbanColumns(columns, 'unknown', true)).toEqual([])
  })
})
