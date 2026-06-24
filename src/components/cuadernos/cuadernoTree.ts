import { parseCuadernoContent } from './cuadernoDocument'
import { normalizeParentId } from './cuadernoPageMeta'
import type { Note } from './cuadernosTypes'

export interface CuadernoTreeNode {
  note: Note
  depth: number
  children: CuadernoTreeNode[]
}

export interface NoteOrderUpdate {
  noteId: string
  sortOrder: number
  parentId?: string | null
}

export { normalizeParentId } from './cuadernoPageMeta'

export function getNoteParentId(note: Note, validIds?: Set<string>): string | undefined {
  const ids = validIds ?? new Set<string>()
  const fromApi = normalizeParentId(note.parentId, ids.size > 0 ? ids : undefined)
  if (fromApi && fromApi !== note.id) {
    return fromApi
  }

  const doc = parseCuadernoContent(note.contenido)
  return normalizeParentId(doc.parentId, ids.size > 0 ? ids : undefined)
}

export function compareNotesByOrder(left: Note, right: Note): number {
  const orderDiff = left.sortOrder - right.sortOrder
  if (orderDiff !== 0) {
    return orderDiff
  }
  return new Date(right.fechaActualizacion).getTime() - new Date(left.fechaActualizacion).getTime()
}

export function noteHasChildren(noteId: string, notes: Note[]): boolean {
  const ids = new Set(notes.map(note => note.id))
  return notes.some(note => getNoteParentId(note, ids) === noteId)
}

export function getNoteChildren(noteId: string, notes: Note[]): Note[] {
  const ids = new Set(notes.map(note => note.id))
  return notes
    .filter(note => getNoteParentId(note, ids) === noteId)
    .sort(compareNotesByOrder)
}

export function buildNoteTree(notes: Note[]): CuadernoTreeNode[] {
  const ids = new Set(notes.map(note => note.id))
  const childrenByParent = new Map<string | undefined, Note[]>()

  for (const note of notes) {
    const rawParent = getNoteParentId(note, ids)
    const parentId = rawParent && rawParent !== note.id ? rawParent : undefined
    const bucket = childrenByParent.get(parentId) ?? []
    bucket.push(note)
    childrenByParent.set(parentId, bucket)
  }

  const sortNotes = (items: Note[]) => [...items].sort(compareNotesByOrder)

  const buildLevel = (
    parentId: string | undefined,
    depth: number,
    pathIds: Set<string>
  ): CuadernoTreeNode[] =>
    sortNotes(childrenByParent.get(parentId) ?? []).map(note => {
      if (pathIds.has(note.id)) {
        return { note, depth, children: [] }
      }
      const nextPath = new Set(pathIds)
      nextPath.add(note.id)
      return {
        note,
        depth,
        children: buildLevel(note.id, depth + 1, nextPath),
      }
    })

  return buildLevel(undefined, 0, new Set())
}

export function flattenNoteTree(nodes: CuadernoTreeNode[]): CuadernoTreeNode[] {
  const flat: CuadernoTreeNode[] = []
  const visit = (items: CuadernoTreeNode[]) => {
    items.forEach(node => {
      flat.push(node)
      visit(node.children)
    })
  }
  visit(nodes)
  return flat
}

export function getNoteAncestors(noteId: string, notes: Note[]): Note[] {
  const byId = new Map(notes.map(note => [note.id, note]))
  const ids = new Set(notes.map(note => note.id))
  const ancestors: Note[] = []
  const visited = new Set<string>([noteId])
  let current = byId.get(noteId)

  while (current) {
    const parentId = getNoteParentId(current, ids)
    if (!parentId || visited.has(parentId)) {
      break
    }
    const parent = byId.get(parentId)
    if (!parent) {
      break
    }
    visited.add(parentId)
    ancestors.unshift(parent)
    current = parent
  }

  return ancestors
}

export function computeSiblingReorder(
  notes: Note[],
  draggedId: string,
  targetId: string
): NoteOrderUpdate[] | null {
  if (draggedId === targetId) {
    return null
  }

  const ids = new Set(notes.map(note => note.id))
  const dragged = notes.find(note => note.id === draggedId)
  const target = notes.find(note => note.id === targetId)
  if (!dragged || !target) {
    return null
  }

  const parentId = getNoteParentId(target, ids)
  const draggedParentId = getNoteParentId(dragged, ids)
  if (parentId !== draggedParentId) {
    return null
  }

  const siblings = notes
    .filter(note => getNoteParentId(note, ids) === parentId)
    .sort(compareNotesByOrder)

  const withoutDragged = siblings.filter(note => note.id !== draggedId)
  const targetIndex = withoutDragged.findIndex(note => note.id === targetId)
  if (targetIndex === -1) {
    return null
  }

  const reordered = [...withoutDragged]
  reordered.splice(targetIndex, 0, dragged)

  return reordered.map((note, index) => ({
    noteId: note.id,
    sortOrder: index,
  }))
}

export function isDescendantOf(noteId: string, ancestorId: string, notes: Note[]): boolean {
  const ids = new Set(notes.map(note => note.id))
  let current = notes.find(note => note.id === noteId)
  const visited = new Set<string>()

  while (current) {
    const parentId = getNoteParentId(current, ids)
    if (!parentId) {
      return false
    }
    if (parentId === ancestorId) {
      return true
    }
    if (visited.has(parentId)) {
      return false
    }
    visited.add(parentId)
    current = notes.find(note => note.id === parentId)
  }

  return false
}

export function computeNestUnderParent(
  notes: Note[],
  draggedId: string,
  targetId: string
): NoteOrderUpdate[] | null {
  if (draggedId === targetId) {
    return null
  }

  const ids = new Set(notes.map(note => note.id))
  const dragged = notes.find(note => note.id === draggedId)
  const target = notes.find(note => note.id === targetId)
  if (!dragged || !target) {
    return null
  }

  if (isDescendantOf(targetId, draggedId, notes)) {
    return null
  }

  const draggedParentId = getNoteParentId(dragged, ids)
  if (draggedParentId === targetId) {
    return null
  }

  const siblings = notes.filter(
    note => getNoteParentId(note, ids) === targetId && note.id !== draggedId
  )

  return [
    {
      noteId: draggedId,
      sortOrder: siblings.length,
      parentId: targetId,
    },
  ]
}
