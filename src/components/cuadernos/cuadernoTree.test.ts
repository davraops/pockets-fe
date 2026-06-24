import { describe, expect, it } from 'vitest'
import {
  buildNoteTree,
  computeNestUnderParent,
  computeSiblingReorder,
  flattenNoteTree,
  getNoteAncestors,
  isDescendantOf,
} from './cuadernoTree'
import type { Note } from './cuadernosTypes'

const ROOT_ID = '11111111-1111-4111-8111-111111111111'
const CHILD_ID = '22222222-2222-4222-8222-222222222222'
const MID_ID = '33333333-3333-4333-8333-333333333333'
const LEAF_ID = '44444444-4444-4444-8444-444444444444'
const NOTE_A_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const NOTE_B_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const OTHER_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'

function makeNote(overrides: Partial<Note> & Pick<Note, 'id'>): Note {
  return {
    id: overrides.id,
    titulo: overrides.titulo ?? 'Nota',
    contenido: overrides.contenido ?? '',
    sortOrder: overrides.sortOrder ?? 0,
    fechaCreacion: overrides.fechaCreacion ?? '2026-01-01T00:00:00.000Z',
    fechaActualizacion: overrides.fechaActualizacion ?? '2026-01-01T00:00:00.000Z',
    parentId: overrides.parentId,
  }
}

describe('buildNoteTree', () => {
  it('builds nested hierarchy from parent_id', () => {
    const notes = [
      makeNote({ id: ROOT_ID, titulo: 'Raíz', sortOrder: 0 }),
      makeNote({ id: CHILD_ID, titulo: 'Hijo', parentId: ROOT_ID, sortOrder: 0 }),
    ]

    const tree = buildNoteTree(notes)
    expect(tree).toHaveLength(1)
    expect(tree[0]?.note.id).toBe(ROOT_ID)
    expect(tree[0]?.children[0]?.note.id).toBe(CHILD_ID)
  })

  it('does not recurse infinitely when parent_id forms a cycle', () => {
    const notes = [
      makeNote({ id: NOTE_A_ID, parentId: NOTE_B_ID, sortOrder: 0 }),
      makeNote({ id: NOTE_B_ID, parentId: NOTE_A_ID, sortOrder: 1 }),
    ]

    expect(() => buildNoteTree(notes)).not.toThrow()
    expect(flattenNoteTree(buildNoteTree(notes))).toHaveLength(0)
  })
})

describe('getNoteAncestors', () => {
  it('returns ancestors in root-first order', () => {
    const notes = [
      makeNote({ id: ROOT_ID, sortOrder: 0 }),
      makeNote({ id: MID_ID, parentId: ROOT_ID, sortOrder: 0 }),
      makeNote({ id: LEAF_ID, parentId: MID_ID, sortOrder: 0 }),
    ]

    expect(getNoteAncestors(LEAF_ID, notes).map(note => note.id)).toEqual([ROOT_ID, MID_ID])
  })

  it('stops when parent chain cycles', () => {
    const notes = [
      makeNote({ id: NOTE_A_ID, parentId: NOTE_B_ID, sortOrder: 0 }),
      makeNote({ id: NOTE_B_ID, parentId: NOTE_A_ID, sortOrder: 1 }),
    ]

    expect(getNoteAncestors(NOTE_A_ID, notes)).toHaveLength(1)
    expect(getNoteAncestors(NOTE_A_ID, notes)[0]?.id).toBe(NOTE_B_ID)
  })
})

describe('computeSiblingReorder', () => {
  it('reorders siblings within the same parent', () => {
    const notes = [
      makeNote({ id: ROOT_ID, sortOrder: 0 }),
      makeNote({ id: CHILD_ID, sortOrder: 1 }),
      makeNote({ id: MID_ID, sortOrder: 2 }),
    ]

    const updates = computeSiblingReorder(notes, MID_ID, ROOT_ID)
    expect(updates).toEqual([
      { noteId: MID_ID, sortOrder: 0 },
      { noteId: ROOT_ID, sortOrder: 1 },
      { noteId: CHILD_ID, sortOrder: 2 },
    ])
  })

  it('returns null when dragged and target have different parents', () => {
    const notes = [
      makeNote({ id: ROOT_ID, sortOrder: 0 }),
      makeNote({ id: CHILD_ID, parentId: ROOT_ID, sortOrder: 0 }),
      makeNote({ id: OTHER_ID, sortOrder: 1 }),
    ]

    expect(computeSiblingReorder(notes, CHILD_ID, OTHER_ID)).toBeNull()
  })
})

describe('computeNestUnderParent', () => {
  it('nests a root note under another root', () => {
    const notes = [
      makeNote({ id: ROOT_ID, sortOrder: 0 }),
      makeNote({ id: OTHER_ID, sortOrder: 1 }),
    ]

    expect(computeNestUnderParent(notes, OTHER_ID, ROOT_ID)).toEqual([
      { noteId: OTHER_ID, sortOrder: 0, parentId: ROOT_ID },
    ])
  })

  it('blocks nesting under a descendant', () => {
    const notes = [
      makeNote({ id: ROOT_ID, sortOrder: 0 }),
      makeNote({ id: CHILD_ID, parentId: ROOT_ID, sortOrder: 0 }),
    ]

    expect(isDescendantOf(CHILD_ID, ROOT_ID, notes)).toBe(true)
    expect(computeNestUnderParent(notes, ROOT_ID, CHILD_ID)).toBeNull()
  })
})
