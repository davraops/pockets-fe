import { useEffect, useMemo, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import { getNotePageIcon } from './cuadernoDisplayUtils'
import {
  buildNoteTree,
  computeSiblingReorder,
  computeNestUnderParent,
  getNoteAncestors,
  noteHasChildren,
  type CuadernoTreeNode,
  type NoteOrderUpdate,
} from './cuadernoTree'
import type { Note } from './cuadernosTypes'
import '../../pages/Cuadernos.css'

interface CuadernoTreeListProps {
  notes: Note[]
  activeNoteId?: string
  onOpenNote: (note: Note) => void
  onCreateChild?: (parentId: string) => void
  onReorder?: (updates: NoteOrderUpdate[]) => Promise<void>
  enableReorder?: boolean
}

function CuadernoTreeNodeRow({
  node,
  notes,
  activeNoteId,
  expandedIds,
  draggedId,
  dropTargetId,
  dropNestTargetId,
  level,
  posInSet,
  setSize,
  onToggle,
  onOpenNote,
  onCreateChild,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  enableReorder = true,
}: {
  node: CuadernoTreeNode
  notes: Note[]
  activeNoteId?: string
  expandedIds: Set<string>
  draggedId: string | null
  dropTargetId: string | null
  dropNestTargetId: string | null
  level: number
  posInSet: number
  setSize: number
  onToggle: (noteId: string) => void
  onOpenNote: (note: Note) => void
  onCreateChild?: (parentId: string) => void
  onDragStart: (noteId: string) => void
  onDragEnd: () => void
  onDragOver: (noteId: string, mode: 'reorder' | 'nest') => void
  onDrop: (noteId: string) => void
  enableReorder?: boolean
}) {
  const hasChildren = node.children.length > 0 || noteHasChildren(node.note.id, notes)
  const isExpanded = expandedIds.has(node.note.id)
  const isDragging = draggedId === node.note.id
  const isDropTarget = dropTargetId === node.note.id && draggedId !== node.note.id
  const isNestTarget = dropNestTargetId === node.note.id && draggedId !== node.note.id
  const isActive = activeNoteId === node.note.id
  const pageIcon = getNotePageIcon(node.note.contenido)
  const displayTitle = node.note.titulo.trim() || 'Sin título'

  return (
    <>
      <div
        className={[
          'cuaderno-tree-row',
          'cuaderno-tree-row--sidebar',
          isDragging ? 'cuaderno-tree-row--dragging' : '',
          isDropTarget ? 'cuaderno-tree-row--drop-target' : '',
          isNestTarget ? 'cuaderno-tree-row--drop-nest' : '',
          isActive ? 'cuaderno-tree-row--active' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ paddingLeft: `calc(${node.depth} * 0.85rem + 0.35rem)` }}
        role="treeitem"
        aria-level={level}
        aria-setsize={setSize}
        aria-posinset={posInSet}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-selected={isActive}
        onDragOver={event => {
          event.preventDefault()
          if (!draggedId || !enableReorder) {
            return
          }
          const mode = computeSiblingReorder(notes, draggedId, node.note.id) ? 'reorder' : 'nest'
          onDragOver(node.note.id, mode)
        }}
        onDrop={event => {
          event.preventDefault()
          if (!enableReorder) {
            return
          }
          onDrop(node.note.id)
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            className={`cuaderno-tree-row__toggle ${isExpanded ? 'cuaderno-tree-row__toggle--open' : ''}`}
            onClick={() => onToggle(node.note.id)}
            aria-label={isExpanded ? 'Contraer subcuadernos' : 'Expandir subcuadernos'}
            aria-expanded={isExpanded}
            tabIndex={-1}
          >
            <ChevronRightIcon fontSize="small" aria-hidden />
          </button>
        ) : (
          <span className="cuaderno-tree-row__toggle-spacer" aria-hidden />
        )}
        <button
          type="button"
          className="cuaderno-tree-row__drag"
          draggable={enableReorder}
          onDragStart={event => {
            if (!enableReorder) {
              event.preventDefault()
              return
            }
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', node.note.id)
            onDragStart(node.note.id)
          }}
          onDragEnd={onDragEnd}
          aria-label={`Reordenar ${displayTitle}`}
          tabIndex={-1}
          hidden={!enableReorder}
        >
          <DragIndicatorIcon fontSize="small" aria-hidden />
        </button>
        <button
          type="button"
          className="cuaderno-tree-sidebar-link"
          onClick={() => onOpenNote(node.note)}
          aria-current={isActive ? 'page' : undefined}
        >
          {pageIcon ? (
            <span className="cuaderno-tree-sidebar-link__icon" aria-hidden="true">
              {pageIcon}
            </span>
          ) : (
            <span
              className="cuaderno-tree-sidebar-link__icon cuaderno-tree-sidebar-link__icon--empty"
              aria-hidden="true"
            >
              ·
            </span>
          )}
          <span className="cuaderno-tree-sidebar-link__title">{displayTitle}</span>
        </button>
        {onCreateChild ? (
          <button
            type="button"
            className="cuaderno-tree-row__add"
            onClick={event => {
              event.stopPropagation()
              onCreateChild(node.note.id)
            }}
            aria-label={`Nueva subpágina en ${displayTitle}`}
            title="Nueva subpágina"
            tabIndex={-1}
          >
            <AddIcon fontSize="small" aria-hidden />
          </button>
        ) : null}
      </div>
      {hasChildren && isExpanded
        ? node.children.map((child, childIndex) => (
            <CuadernoTreeNodeRow
              key={child.note.id}
              node={child}
              notes={notes}
              activeNoteId={activeNoteId}
              expandedIds={expandedIds}
              draggedId={draggedId}
              dropTargetId={dropTargetId}
              dropNestTargetId={dropNestTargetId}
              level={level + 1}
              posInSet={childIndex + 1}
              setSize={node.children.length}
              onToggle={onToggle}
              onOpenNote={onOpenNote}
              onCreateChild={onCreateChild}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDrop={onDrop}
              enableReorder={enableReorder}
            />
          ))
        : null}
    </>
  )
}

function CuadernoTreeList({
  notes,
  activeNoteId,
  onOpenNote,
  onCreateChild,
  onReorder,
  enableReorder = true,
}: CuadernoTreeListProps) {
  const tree = useMemo(() => buildNoteTree(notes), [notes])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const [dropNestTargetId, setDropNestTargetId] = useState<string | null>(null)

  useEffect(() => {
    if (!activeNoteId) {
      return
    }
    const ancestors = getNoteAncestors(activeNoteId, notes)
    setExpandedIds(current => {
      const next = new Set(current)
      ancestors.forEach(ancestor => next.add(ancestor.id))
      return next
    })
  }, [activeNoteId, notes])

  const handleToggle = (noteId: string) => {
    setExpandedIds(current => {
      const next = new Set(current)
      if (next.has(noteId)) {
        next.delete(noteId)
      } else {
        next.add(noteId)
      }
      return next
    })
  }

  const handleDrop = async (targetId: string) => {
    if (!draggedId || !onReorder) {
      setDraggedId(null)
      setDropTargetId(null)
      setDropNestTargetId(null)
      return
    }

    const siblingUpdates = computeSiblingReorder(notes, draggedId, targetId)
    const updates = siblingUpdates ?? computeNestUnderParent(notes, draggedId, targetId)

    setDraggedId(null)
    setDropTargetId(null)
    setDropNestTargetId(null)

    if (updates && updates.length > 0) {
      if (!siblingUpdates) {
        setExpandedIds(current => new Set(current).add(targetId))
      }
      await onReorder(updates)
    }
  }

  if (tree.length === 0) {
    return null
  }

  return (
    <div className="cuaderno-tree-list cuaderno-tree-list--sidebar" role="tree" aria-label="Cuadernos">
      {tree.map((node, index) => (
        <CuadernoTreeNodeRow
          key={node.note.id}
          node={node}
          notes={notes}
          activeNoteId={activeNoteId}
          expandedIds={expandedIds}
          draggedId={draggedId}
          dropTargetId={dropTargetId}
          dropNestTargetId={dropNestTargetId}
          level={1}
          posInSet={index + 1}
          setSize={tree.length}
          onToggle={handleToggle}
          onOpenNote={onOpenNote}
          onCreateChild={onCreateChild}
          onDragStart={setDraggedId}
          onDragEnd={() => {
            setDraggedId(null)
            setDropTargetId(null)
            setDropNestTargetId(null)
          }}
          onDragOver={(noteId, mode) => {
            if (!enableReorder) {
              return
            }
            if (mode === 'reorder') {
              setDropTargetId(noteId)
              setDropNestTargetId(null)
            } else {
              setDropTargetId(null)
              setDropNestTargetId(noteId)
            }
          }}
          onDrop={targetId => {
            void handleDrop(targetId)
          }}
          enableReorder={enableReorder}
        />
      ))}
    </div>
  )
}

export default CuadernoTreeList
