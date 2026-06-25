import type { KanbanColumnDef } from './activityTypes'

/** Mirrors mobile column filtering in ActividadKanbanBoard. */
export function getVisibleKanbanColumns(
  columns: KanbanColumnDef[],
  activeColumnId: string,
  isMobile: boolean
): KanbanColumnDef[] {
  if (!isMobile) {
    return columns
  }
  return columns.filter(column => column.id === activeColumnId)
}
