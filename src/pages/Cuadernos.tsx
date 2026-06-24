import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useParams, useLocation, useBeforeUnload } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined'
import AddIcon from '@mui/icons-material/Add'
import BookIcon from '@mui/icons-material/Book'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { backToHubLabel } from '../constants/hubLabels'
import { api } from '../services/api'
import CuadernoCreateModal from '../components/cuadernos/CuadernoCreateModal'
import CuadernoWorkspace, {
  type CuadernoWorkspaceHandle,
} from '../components/cuadernos/CuadernoWorkspace'
import CuadernoSidebar from '../components/cuadernos/CuadernoSidebar'
import { getCuadernoSidebarOpen, setCuadernoSidebarOpen } from '../components/cuadernos/cuadernoSidebarPrefs'
import { useCuadernoMobileLayout } from '../components/cuadernos/useCuadernoMobileLayout'
import { useCuadernoLeaveGuard } from '../components/cuadernos/useCuadernoLeaveGuard'
import CuadernoDebugModal from '../components/cuadernos/CuadernoDebugModal'
import CuadernoEmptyPickGrid from '../components/cuadernos/CuadernoEmptyPickGrid'
import { getCuadernoPickCards } from '../components/cuadernos/cuadernoEmptyPick'
import type { CuadernoPickCardModel } from '../components/cuadernos/cuadernoPickCardTypes'
import { createNewCuadernoDocument, serializeDocument } from '../components/cuadernos/cuadernoDocument'
import { getNoteParentId, type NoteOrderUpdate } from '../components/cuadernos/cuadernoTree'
import type { Note } from '../components/cuadernos/cuadernosTypes'
import { applyNotePatch, mapNotesFromAPI } from '../components/cuadernos/cuadernosTypes'
import { devError, isDebugToolsEnabled } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import './AppPage.css'
import './Cuadernos.css'
import '../components/cuadernos/cuadernoEditor.css'

function Cuadernos() {
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const navigate = useNavigate()
  const location = useLocation()
  const { noteId } = useParams<{ noteId?: string }>()
  const startInEditMode =
    (location.state as { startInEditMode?: boolean } | null)?.startInEditMode === true
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [workspaceNote, setWorkspaceNote] = useState<Note | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(getCuadernoSidebarOpen)
  const [newTitle, setNewTitle] = useState('')
  const [newTitleError, setNewTitleError] = useState('')
  const [newIcon, setNewIcon] = useState<string | undefined>(undefined)
  const [newCover, setNewCover] = useState<string | undefined>(undefined)
  const [createParentId, setCreateParentId] = useState<string | undefined>(undefined)
  const menuRef = useRef<HTMLDivElement>(null)
  const tituloRef = useRef<HTMLInputElement>(null)
  const workspaceRef = useRef<CuadernoWorkspaceHandle>(null)
  const [workspaceDirty, setWorkspaceDirty] = useState(false)

  const persistIfDirtyFromRef = useCallback(async () => {
    await workspaceRef.current?.persistIfDirty()
  }, [])

  useBeforeUnload(
    useCallback(
      (event: BeforeUnloadEvent) => {
        if (workspaceDirty) {
          event.preventDefault()
          event.returnValue = ''
        }
      },
      [workspaceDirty]
    )
  )

  useCuadernoLeaveGuard({
    isDirty: workspaceDirty,
    persistIfDirty: persistIfDirtyFromRef,
    confirm,
    navigate: to => navigate(to),
    pathname: location.pathname,
    search: location.search,
  })

  const loadNotes = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.getNotes()
      if (response.notes && Array.isArray(response.notes)) {
        setNotes(mapNotesFromAPI(response.notes))
      } else {
        setNotes([])
      }
    } catch (err: unknown) {
      devError('Error al cargar notas:', err)
      setError('Error al cargar los cuadernos. Por favor, intenta de nuevo.')
      setNotes([])
      showNotification('Error al cargar los cuadernos. Por favor, intenta de nuevo.', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [showNotification])

  useEffect(() => {
    void loadNotes()
  }, [loadNotes])

  useEffect(() => {
    if (!noteId) {
      setWorkspaceNote(null)
      return
    }
    const found = notes.find(note => note.id === noteId)
    if (found) {
      setWorkspaceNote(prev => {
        if (prev?.id !== found.id) {
          return found
        }
        if (
          prev.fechaCreacion === found.fechaCreacion &&
          prev.fechaActualizacion === found.fechaActualizacion
        ) {
          return prev
        }
        return {
          ...prev,
          fechaCreacion: found.fechaCreacion,
          fechaActualizacion: found.fechaActualizacion,
        }
      })
    } else if (!isLoading) {
      navigate('/registros/cuadernos', { replace: true })
    }
  }, [noteId, notes, isLoading, navigate])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const handleOpenCreateModal = (parentId?: string) => {
    setNewTitle('')
    setNewTitleError('')
    setNewIcon(undefined)
    setNewCover(undefined)
    setCreateParentId(parentId)
    setIsCreateModalOpen(true)
  }

  const handleHideSidebar = () => {
    setIsSidebarOpen(false)
    setCuadernoSidebarOpen(false)
  }

  const handleShowSidebar = () => {
    setIsSidebarOpen(true)
    setCuadernoSidebarOpen(true)
  }

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false)
    setNewTitle('')
    setNewTitleError('')
    setNewIcon(undefined)
    setNewCover(undefined)
    setCreateParentId(undefined)
  }

  const handleCreateSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newTitle.trim()) {
      setNewTitleError('El título es requerido')
      tituloRef.current?.focus()
      return
    }

    try {
      setIsSaving(true)
      const response = await api.createNote({
        title: newTitle.trim(),
        content: serializeDocument(createNewCuadernoDocument({ icon: newIcon, cover: newCover })),
        ...(createParentId ? { parent_id: createParentId } : {}),
      })
      await loadNotes()
      handleCloseCreateModal()
      const createdId = response.note?.id
      if (createdId) {
        navigate(`/registros/cuadernos/${createdId}`, { state: { startInEditMode: true } })
      }
      showNotification('Cuaderno creado', 'success')
    } catch (err: unknown) {
      devError('Error al crear cuaderno:', err)
      showNotification('Error al crear el cuaderno. Por favor, intenta de nuevo.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const navigateToNote = useCallback(
    async (id: string) => {
      if (noteId === id) {
        return
      }
      try {
        await workspaceRef.current?.persistIfDirty()
      } catch {
        const leave = await confirm({
          message: 'No se pudo guardar el cuaderno. ¿Cambiar de cuaderno sin guardar?',
          confirmLabel: 'Cambiar sin guardar',
          cancelLabel: 'Seguir editando',
        })
        if (!leave) {
          return
        }
      }
      navigate(`/registros/cuadernos/${id}`)
    },
    [confirm, navigate, noteId]
  )

  const navigateToRoot = useCallback(async () => {
    try {
      await workspaceRef.current?.persistIfDirty()
    } catch {
      const leave = await confirm({
        message: 'No se pudo guardar el cuaderno. ¿Volver al índice sin guardar?',
        confirmLabel: 'Volver sin guardar',
        cancelLabel: 'Seguir editando',
      })
      if (!leave) {
        return
      }
    }
    navigate('/registros/cuadernos')
  }, [confirm, navigate])

  const navigateToUtilidades = useCallback(async () => {
    try {
      await workspaceRef.current?.persistIfDirty()
    } catch {
      const leave = await confirm({
        message: 'No se pudo guardar el cuaderno. ¿Volver a Utilidades sin guardar?',
        confirmLabel: 'Volver sin guardar',
        cancelLabel: 'Seguir editando',
      })
      if (!leave) {
        return
      }
    }
    navigate('/registros')
  }, [confirm, navigate])

  const handleOpenWorkspace = (note: Note) => {
    void navigateToNote(note.id)
  }

  const handlePickCardSelect = useCallback(
    (card: CuadernoPickCardModel) => {
      if (card.isPlaceholder) {
        handleOpenCreateModal()
        return
      }
      const note = notes.find(item => item.id === card.id)
      if (note) {
        handleOpenWorkspace(note)
      }
    },
    [notes]
  )

  const handleSaveWorkspace = async (payload: { title: string; content: string }) => {
    if (!workspaceNote) {
      return
    }
    try {
      setIsSaving(true)
      await api.updateNote(workspaceNote.id, payload)
      const fechaActualizacion = new Date().toISOString()
      setNotes(prev =>
        prev.map(note =>
          note.id === workspaceNote.id
            ? {
                ...note,
                titulo: payload.title,
                contenido: payload.content,
                fechaActualizacion,
              }
            : note
        )
      )
      setWorkspaceNote(prev =>
        prev && prev.id === workspaceNote.id
          ? { ...prev, titulo: payload.title, contenido: payload.content, fechaActualizacion }
          : prev
      )
    } catch (err: unknown) {
      devError('Error al guardar cuaderno:', err)
      showNotification('Error al guardar el cuaderno. Por favor, intenta de nuevo.', 'error')
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteWorkspace = async () => {
    if (!workspaceNote) {
      return
    }
    try {
      setIsSaving(true)
      await api.deleteNote(workspaceNote.id)
      navigate('/registros/cuadernos')
      await loadNotes()
      showNotification('Cuaderno eliminado', 'success')
    } catch (err: unknown) {
      devError('Error al eliminar cuaderno:', err)
      showNotification('Error al eliminar el cuaderno. Por favor, intenta de nuevo.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReorderNotes = async (updates: NoteOrderUpdate[]) => {
    if (updates.length === 0) {
      return
    }

    const previousById = new Map(
      notes
        .filter(note => updates.some(update => update.noteId === note.id))
        .map(note => [
          note.id,
          {
            sort_order: note.sortOrder,
            parent_id: note.parentId ?? null,
          },
        ])
    )

    try {
      setIsSaving(true)
      const results = await Promise.allSettled(
        updates.map(update =>
          api.updateNote(update.noteId, {
            sort_order: update.sortOrder,
            ...(update.parentId !== undefined ? { parent_id: update.parentId } : {}),
          })
        )
      )

      const hasFailure = results.some(result => result.status === 'rejected')
      if (hasFailure) {
        const rollbackTasks = results.flatMap((result, index) => {
          if (result.status !== 'fulfilled') {
            return []
          }
          const update = updates[index]
          const previous = previousById.get(update.noteId)
          if (!previous) {
            return []
          }
          return [
            api.updateNote(update.noteId, {
              sort_order: previous.sort_order,
              parent_id: previous.parent_id,
            }),
          ]
        })
        await Promise.allSettled(rollbackTasks)
        devError('Error al reordenar cuadernos:', results.find(result => result.status === 'rejected'))
        showNotification('Error al reordenar los cuadernos.', 'error')
        await loadNotes()
        return
      }

      setNotes(current =>
        updates.reduce(
          (next, update) =>
            next.map(note =>
              note.id === update.noteId
                ? applyNotePatch(note, {
                    sort_order: update.sortOrder,
                    ...(update.parentId !== undefined ? { parent_id: update.parentId } : {}),
                  })
                : note
            ),
          current
        )
      )
    } catch (err: unknown) {
      devError('Error al reordenar cuadernos:', err)
      showNotification('Error al reordenar los cuadernos.', 'error')
      await loadNotes()
    } finally {
      setIsSaving(false)
    }
  }

  const createParentTitle = createParentId
    ? notes.find(note => note.id === createParentId)?.titulo
    : undefined

  const pickCards = useMemo(() => getCuadernoPickCards(notes), [notes])
  const showingPickPlaceholders = notes.length === 0

  const isMobile = useCuadernoMobileLayout()
  const showMobileList = isMobile && !noteId
  const showMobileEditor = isMobile && Boolean(noteId)
  const showSidebar = (!isMobile && isSidebarOpen) || showMobileList
  const showMain = !isMobile || showMobileEditor

  const shellClassName = [
    'app-page-content',
    'app-page-content-wide',
    'cuadernos-shell',
    !isMobile && !isSidebarOpen ? 'cuadernos-shell--sidebar-collapsed' : '',
    showMobileList ? 'cuadernos-shell--mobile-list' : '',
    showMobileEditor ? 'cuadernos-shell--mobile-editor' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const debugToolbar = isDebugToolsEnabled() ? (
    <div className="utilidades-sub-menu-container cuadernos-sidebar__debug" ref={menuRef}>
      <button
        type="button"
        className="app-toolbar-button"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Opciones de depuración"
        aria-expanded={isMenuOpen}
      >
        <MoreVertIcon className="app-toolbar-icon" />
      </button>
      {isMenuOpen ? (
        <div className="utilidades-sub-menu">
          <button
            type="button"
            className="utilidades-sub-menu-item"
            onClick={() => {
              setIsDebugModalOpen(true)
              setIsMenuOpen(false)
            }}
          >
            🐛 Debug
          </button>
        </div>
      ) : null}
    </div>
  ) : null

  return (
    <>
      <div className="app-page-container cuadernos-page">
        <div className={shellClassName}>
          <div className="app-toolbar cuadernos-hub-toolbar">
            <button
              type="button"
              className="app-toolbar-button"
              onClick={() => void navigateToUtilidades()}
              aria-label={backToHubLabel('registros')}
            >
              <ArrowBackIcon className="app-toolbar-icon" aria-hidden />
            </button>
          </div>

          <div className="cuadernos-shell__panes">
          {showSidebar ? (
            <CuadernoSidebar
              notes={notes}
              isLoading={isLoading}
              error={error}
              activeNoteId={noteId}
              onOpenNote={handleOpenWorkspace}
              onCreateRoot={() => handleOpenCreateModal()}
              onCreateChild={parentId => handleOpenCreateModal(parentId)}
              onReorder={handleReorderNotes}
              onRetry={() => void loadNotes()}
              onHide={isMobile ? undefined : handleHideSidebar}
              enableReorder={!isMobile}
              toolbarActions={debugToolbar}
            />
          ) : null}

          {showMain ? (
          <main
            className={[
              'cuadernos-main',
              !isMobile && !isSidebarOpen ? 'cuadernos-main--sidebar-collapsed' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {!isMobile && !isSidebarOpen && !workspaceNote ? (
              <div className="cuadernos-main__sidebar-toggle">
                <button
                  type="button"
                  className="cuadernos-sidebar-show"
                  onClick={handleShowSidebar}
                  aria-label="Mostrar jerarquía de cuadernos"
                  aria-expanded={false}
                >
                  <ViewSidebarOutlinedIcon fontSize="small" aria-hidden />
                  Jerarquía
                </button>
              </div>
            ) : null}
            {workspaceNote ? (
              <CuadernoWorkspace
                ref={workspaceRef}
                note={workspaceNote}
                allNotes={notes}
                linkNotes={notes.map(note => ({ id: note.id, titulo: note.titulo }))}
                initialMode={startInEditMode ? 'edit' : 'read'}
                isSaving={isSaving}
                showBackLink={isMobile}
                showHierarchyLink={!isMobile && !isSidebarOpen}
                onShowHierarchy={handleShowSidebar}
                showSubpages
                isMobileLayout={isMobile}
                onBack={() => {
                  if (workspaceNote && isMobile) {
                    const ids = new Set(notes.map(item => item.id))
                    const parentId = getNoteParentId(workspaceNote, ids)
                    if (parentId) {
                      void navigateToNote(parentId)
                      return
                    }
                  }
                  void navigateToRoot()
                }}
                onDirtyChange={setWorkspaceDirty}
                onNavigateNote={navigateToNote}
                onCreateSubnotebook={parentId => handleOpenCreateModal(parentId)}
                onSave={handleSaveWorkspace}
                onDelete={handleDeleteWorkspace}
              />
            ) : (
              <div className="cuadernos-main-empty">
                <div className="cuadernos-main-empty__icon-wrap">
                  <BookIcon className="cuadernos-main-empty__icon" aria-hidden />
                </div>
                <h2 className="cuadernos-main-empty__title">Selecciona un cuaderno</h2>
                <p className="cuadernos-main-empty__text">
                  {showingPickPlaceholders
                    ? 'Explora los ejemplos o crea tu primer cuaderno desde la jerarquía.'
                    : isSidebarOpen
                      ? 'Abre uno reciente o elige otro de la jerarquía.'
                      : 'Abre uno reciente o crea un cuaderno nuevo.'}
                </p>
                {!isMobile ? (
                  <>
                    <CuadernoEmptyPickGrid
                      cards={pickCards}
                      heading={showingPickPlaceholders ? 'Ejemplos' : 'Recientes'}
                      onSelect={handlePickCardSelect}
                    />
                    {showingPickPlaceholders || !isSidebarOpen ? (
                      <button
                        type="button"
                        className="btn-base btn-accent cuadernos-main-empty__cta"
                        onClick={() => handleOpenCreateModal()}
                      >
                        <AddIcon aria-hidden />
                        Nuevo cuaderno
                      </button>
                    ) : null}
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn-base btn-accent cuadernos-main-empty__cta"
                    onClick={() => handleOpenCreateModal()}
                  >
                    <AddIcon aria-hidden />
                    Nuevo cuaderno
                  </button>
                )}
              </div>
            )}
          </main>
          ) : null}
          </div>
        </div>
      </div>

      {isCreateModalOpen ? (
        <CuadernoCreateModal
          title={newTitle}
          titleError={newTitleError}
          icon={newIcon}
          cover={newCover}
          parentTitle={createParentTitle}
          isSaving={isSaving}
          tituloRef={tituloRef}
          onTitleChange={value => {
            setNewTitle(value)
            if (newTitleError) {
              setNewTitleError('')
            }
          }}
          onIconChange={setNewIcon}
          onCoverChange={setNewCover}
          onSubmit={event => void handleCreateSubmit(event)}
          onClose={handleCloseCreateModal}
        />
      ) : null}

      {isDebugModalOpen && isDebugToolsEnabled() ? (
        <CuadernoDebugModal
          onClose={() => setIsDebugModalOpen(false)}
          onReload={loadNotes}
          onClearList={() => setNotes([])}
        />
      ) : null}
    </>
  )
}

export default Cuadernos
