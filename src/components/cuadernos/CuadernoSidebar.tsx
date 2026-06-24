import { useMemo, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import SearchIcon from '@mui/icons-material/Search'
import CuadernoTreeList from './CuadernoTreeList'
import { filterNotesForSidebar } from './cuadernoSidebarSearch'
import type { NoteOrderUpdate } from './cuadernoTree'
import type { Note } from './cuadernosTypes'
import ListSkeleton from '../ListSkeleton'

interface CuadernoSidebarProps {
  notes: Note[]
  isLoading: boolean
  error: string | null
  activeNoteId?: string
  onOpenNote: (note: Note) => void
  onCreateRoot: () => void
  onCreateChild: (parentId: string) => void
  onReorder: (updates: NoteOrderUpdate[]) => Promise<void>
  onRetry: () => void
  onHide?: () => void
  enableReorder?: boolean
  toolbarActions?: React.ReactNode
}

function CuadernoSidebar({
  notes,
  isLoading,
  error,
  activeNoteId,
  onOpenNote,
  onCreateRoot,
  onCreateChild,
  onReorder,
  onRetry,
  onHide,
  enableReorder = true,
  toolbarActions,
}: CuadernoSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const visibleNotes = useMemo(
    () => filterNotesForSidebar(notes, searchQuery),
    [notes, searchQuery]
  )
  const hasSearch = searchQuery.trim().length > 0

  return (
    <aside className="cuadernos-sidebar" aria-label="Jerarquía de cuadernos">
      <div className="cuadernos-sidebar__header">
        <div className="cuadernos-sidebar__title-row">
          <div className="cuadernos-sidebar__title-copy">
            <h1 className="cuadernos-sidebar__title">Jerarquía</h1>
            {!isLoading && !error ? (
              <p className="cuadernos-sidebar__meta">
                {notes.length} cuaderno{notes.length !== 1 ? 's' : ''}
              </p>
            ) : null}
          </div>
          {(toolbarActions || onHide) ? (
            <div className="cuadernos-sidebar__title-actions">
              {toolbarActions}
              {onHide ? (
                <button
                  type="button"
                  className="cuadernos-sidebar__hide"
                  onClick={onHide}
                  aria-label="Ocultar jerarquía"
                  title="Ocultar jerarquía"
                >
                  <ChevronLeftIcon fontSize="small" aria-hidden />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="cuadernos-sidebar__add"
          onClick={onCreateRoot}
          aria-label="Nuevo cuaderno"
        >
          <AddIcon fontSize="small" aria-hidden />
          Nuevo cuaderno
        </button>
        {!isLoading && !error && notes.length > 0 ? (
          <label className="cuadernos-sidebar__search">
            <SearchIcon className="cuadernos-sidebar__search-icon" aria-hidden />
            <input
              type="search"
              className="cuadernos-sidebar__search-input"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Buscar cuadernos…"
              aria-label="Buscar cuadernos"
            />
          </label>
        ) : null}
      </div>

      <div className="cuadernos-sidebar__body">
        {isLoading ? (
          <ListSkeleton variant="inset-row" count={5} aria-label="Cargando cuadernos" />
        ) : error ? (
          <div className="cuadernos-sidebar__empty">
            <p className="cuadernos-sidebar__empty-text">{error}</p>
            <button type="button" className="cuadernos-sidebar__retry" onClick={onRetry}>
              Reintentar
            </button>
          </div>
        ) : notes.length === 0 ? (
          <div className="cuadernos-sidebar__empty">
            <p className="cuadernos-sidebar__empty-text">Aún no hay cuadernos.</p>
            <button type="button" className="cuadernos-sidebar__retry" onClick={onCreateRoot}>
              Crear el primero
            </button>
          </div>
        ) : hasSearch && visibleNotes.length === 0 ? (
          <div className="cuadernos-sidebar__empty">
            <p className="cuadernos-sidebar__empty-text">Ningún cuaderno coincide con la búsqueda.</p>
          </div>
        ) : (
          <CuadernoTreeList
            notes={visibleNotes}
            activeNoteId={activeNoteId}
            onOpenNote={onOpenNote}
            onCreateChild={onCreateChild}
            onReorder={onReorder}
            enableReorder={enableReorder}
          />
        )}
      </div>
    </aside>
  )
}

export default CuadernoSidebar
