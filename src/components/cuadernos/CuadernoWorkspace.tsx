import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined'
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined'
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined'
import { useConfirm } from '../../contexts/ConfirmContext'
import { useNotification } from '../../contexts/NotificationContext'
import { useModalAccessibility } from '../../hooks/useModalAccessibility'
import CuadernoBlockEditor from './CuadernoBlockEditor'
import CuadernoBlockViewer from './CuadernoBlockViewer'
import CuadernoPageHeader from './CuadernoPageHeader'
import CuadernoPageCover from './CuadernoPageCover'
import CuadernoSubpagesModal from './CuadernoSubpagesModal'
import {
  documentHasContent,
  normalizeDocument,
  parseCuadernoContent,
  serializeDocument,
  type CuadernoDocument,
} from './cuadernoDocument'
import { documentToXml, tryParseXmlDocument } from './cuadernoXml'
import { normalizePageIcon, normalizePageCover, clampPageCommentDraft } from './cuadernoPageMeta'
import { getNoteChildren, getNoteParentId } from './cuadernoTree'
import type { CuadernoLinkTarget } from './cuadernoLinkUtils'
import type { Note } from './cuadernosTypes'
import { CUADERNO_AUTOSAVE_MS, isCuadernoPayloadDirty } from './cuadernoAutosave'
import './cuadernoEditor.css'

type DataPanelTab = 'json' | 'xml'
export type CuadernoWorkspaceMode = 'read' | 'edit'

export interface CuadernoWorkspaceHandle {
  hasUnsavedChanges: () => boolean
  persistIfDirty: () => Promise<void>
}

interface CuadernoWorkspaceProps {
  note: Note
  allNotes?: Note[]
  linkNotes?: CuadernoLinkTarget[]
  initialMode?: CuadernoWorkspaceMode
  isSaving: boolean
  showBackLink?: boolean
  showHierarchyLink?: boolean
  showSubpages?: boolean
  isMobileLayout?: boolean
  onBack?: () => void
  onShowHierarchy?: () => void
  onNavigateNote?: (noteId: string) => void | Promise<void>
  onCreateSubnotebook?: (parentId: string) => void
  onDirtyChange?: (isDirty: boolean) => void
  onSave: (payload: { title: string; content: string }) => Promise<void>
  onDelete: () => Promise<void>
}

const CuadernoWorkspace = forwardRef<CuadernoWorkspaceHandle, CuadernoWorkspaceProps>(function CuadernoWorkspace({
  note,
  allNotes = [],
  linkNotes = [],
  initialMode = 'read',
  isSaving,
  showBackLink = true,
  showHierarchyLink = false,
  showSubpages = true,
  isMobileLayout = false,
  onBack,
  onShowHierarchy,
  onNavigateNote,
  onCreateSubnotebook,
  onDirtyChange,
  onSave,
  onDelete,
}, ref) {
  const { confirm } = useConfirm()
  const { showNotification } = useNotification()
  const [mode, setMode] = useState<CuadernoWorkspaceMode>(initialMode)
  const [title, setTitle] = useState(note.titulo)
  const [cuadernoDoc, setCuadernoDocState] = useState<CuadernoDocument>(() =>
    parseCuadernoContent(note.contenido)
  )
  const cuadernoDocRef = useRef(cuadernoDoc)
  const titleRef = useRef(title)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [showDataPanel, setShowDataPanel] = useState(false)
  const [showSubpagesModal, setShowSubpagesModal] = useState(false)
  const [showOverflowMenu, setShowOverflowMenu] = useState(false)
  const [dataTab, setDataTab] = useState<DataPanelTab>('json')
  const [dataDraft, setDataDraft] = useState('')
  const [dataError, setDataError] = useState<string | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const isExitingEditRef = useRef(false)
  const lastSavedRef = useRef({
    title: note.titulo,
    content: serializeDocument(parseCuadernoContent(note.contenido)),
  })
  const overflowRef = useRef<HTMLDivElement>(null)
  const overflowMenuRef = useRef<HTMLDivElement>(null)
  const dataPanelRef = useRef<HTMLDivElement>(null)
  const loadedNoteIdRef = useRef<string | null>(null)
  const [overflowHighlight, setOverflowHighlight] = useState(0)
  const autosaveTimerRef = useRef<number | null>(null)
  const persistInFlightRef = useRef<Promise<void> | null>(null)

  cuadernoDocRef.current = cuadernoDoc
  titleRef.current = title

  const clearAutosaveTimer = useCallback(() => {
    if (autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current)
      autosaveTimerRef.current = null
    }
  }, [])

  const buildPayload = useCallback(
    () => ({
      title: titleRef.current.trim() || 'Sin título',
      content: serializeDocument(cuadernoDocRef.current),
    }),
    []
  )

  const hasUnsavedChanges = useCallback(() => {
    if (mode !== 'edit') {
      return false
    }
    const payload = buildPayload()
    return isCuadernoPayloadDirty(payload, lastSavedRef.current)
  }, [buildPayload, mode])

  const setCuadernoDoc = useCallback(
    (value: CuadernoDocument | ((prev: CuadernoDocument) => CuadernoDocument)) => {
      setCuadernoDocState(prev => {
        const next = typeof value === 'function' ? value(prev) : value
        cuadernoDocRef.current = next
        return next
      })
    },
    []
  )

  useEffect(() => {
    if (loadedNoteIdRef.current === note.id) {
      return
    }
    loadedNoteIdRef.current = note.id
    setTitle(note.titulo)
    const parsed = parseCuadernoContent(note.contenido)
    setCuadernoDoc(parsed)
    lastSavedRef.current = {
      title: note.titulo,
      content: serializeDocument(parsed),
    }
  }, [note.id, note.titulo, note.contenido])

  useEffect(() => {
    setMode(initialMode)
  }, [note.id, initialMode])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(event.target as Node)) {
        setShowOverflowMenu(false)
      }
    }
    if (showOverflowMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showOverflowMenu])

  useEffect(() => {
    if (!showOverflowMenu) {
      return
    }
    setOverflowHighlight(0)
    const handleKeyDown = (event: KeyboardEvent) => {
      const buttons = overflowMenuRef.current?.querySelectorAll<HTMLButtonElement>('button')
      if (!buttons?.length) {
        return
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setOverflowHighlight(index => (index + 1) % buttons.length)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setOverflowHighlight(index => (index - 1 + buttons.length) % buttons.length)
      } else if (event.key === 'Enter') {
        event.preventDefault()
        buttons[overflowHighlight]?.click()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        setShowOverflowMenu(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showOverflowMenu, overflowHighlight])

  useModalAccessibility(showDataPanel, () => setShowDataPanel(false), dataPanelRef)

  const enterEditMode = () => {
    setMode('edit')
    window.requestAnimationFrame(() => titleInputRef.current?.focus())
  }

  const handleReadSurfacePointerUp = (event: ReactMouseEvent) => {
    const target = event.target
    if (target instanceof Element && target.closest('a, button, input, textarea, select')) {
      return
    }
    const selection = window.getSelection()
    if (selection && selection.toString().trim().length > 0) {
      return
    }
    enterEditMode()
  }

  const updatePageMeta = (patch: {
    icon?: string | undefined
    comment?: string
    cover?: string | undefined
  }) => {
    setCuadernoDoc(current => {
      const next: CuadernoDocument = { ...current, blocks: current.blocks }
      if ('icon' in patch) {
        const icon = normalizePageIcon(patch.icon)
        if (icon) {
          next.icon = icon
        } else {
          delete next.icon
        }
      }
      if ('comment' in patch) {
        if (typeof patch.comment !== 'string' || patch.comment.length === 0) {
          delete next.comment
        } else {
          next.comment = clampPageCommentDraft(patch.comment)
        }
      }
      if ('cover' in patch) {
        const cover = normalizePageCover(patch.cover)
        if (cover) {
          next.cover = cover
        } else {
          delete next.cover
        }
      }
      return next
    })
  }

  const persist = useCallback(
    async (manual = false) => {
      const doc = cuadernoDocRef.current
      const payload = buildPayload()
      const serialized = payload.content
      if (
        !manual &&
        serialized === lastSavedRef.current.content &&
        payload.title === lastSavedRef.current.title
      ) {
        return
      }
      if (!documentHasContent(doc) && !titleRef.current.trim()) {
        return
      }

      setSaveState('saving')
      const savePromise = (async () => {
        try {
          await onSave(payload)
          lastSavedRef.current = { title: payload.title, content: serialized }
          setSaveState('saved')
          window.setTimeout(() => setSaveState('idle'), 2000)
        } catch {
          setSaveState('error')
          throw new Error('save failed')
        }
      })()

      persistInFlightRef.current = savePromise
      try {
        await savePromise
      } finally {
        if (persistInFlightRef.current === savePromise) {
          persistInFlightRef.current = null
        }
      }
    },
    [buildPayload, onSave]
  )

  const persistIfDirty = useCallback(async () => {
    clearAutosaveTimer()
    if (persistInFlightRef.current) {
      await persistInFlightRef.current.catch(() => undefined)
    }
    if (!hasUnsavedChanges()) {
      return
    }
    await persist(false)
  }, [clearAutosaveTimer, hasUnsavedChanges, persist])

  useImperativeHandle(
    ref,
    () => ({
      hasUnsavedChanges,
      persistIfDirty,
    }),
    [hasUnsavedChanges, persistIfDirty]
  )

  useEffect(() => {
    if (mode !== 'edit') {
      onDirtyChange?.(false)
      return
    }
    onDirtyChange?.(isCuadernoPayloadDirty(buildPayload(), lastSavedRef.current))
  }, [buildPayload, cuadernoDoc, mode, onDirtyChange, saveState, title])

  useEffect(() => {
    if (mode !== 'edit') {
      clearAutosaveTimer()
      return
    }
    if (!hasUnsavedChanges()) {
      return
    }

    clearAutosaveTimer()
    autosaveTimerRef.current = window.setTimeout(() => {
      autosaveTimerRef.current = null
      void persist(false)
    }, CUADERNO_AUTOSAVE_MS)

    return clearAutosaveTimer
  }, [clearAutosaveTimer, cuadernoDoc, hasUnsavedChanges, mode, persist, title])

  const exitEditMode = useCallback(async () => {
    if (isExitingEditRef.current || mode !== 'edit') {
      return
    }
    isExitingEditRef.current = true
    try {
      await persist(false)
      setMode('read')
    } finally {
      isExitingEditRef.current = false
    }
  }, [mode, persist])

  useEffect(() => {
    if (mode !== 'edit') {
      return
    }

    const isActiveEditingTarget = (element: Element | null) =>
      Boolean(
        element?.closest('.cuaderno-block-input') ||
          element?.closest('.cuaderno-workspace__title') ||
          element?.closest('.cuaderno-page-comment') ||
          element?.closest('.cuaderno-todo-block') ||
          element?.closest('.cuaderno-list-block') ||
          element?.closest('.cuaderno-column-block') ||
          element?.closest('.cuaderno-table-block')
      )

    const shouldKeepEditing = (target: EventTarget | null) => {
      if (!(target instanceof Element)) {
        return false
      }
      return Boolean(
        target.closest('.cuaderno-block-row') ||
          target.closest('.cuaderno-block-editor') ||
          target.closest('.cuaderno-block-input') ||
          target.closest('.cuaderno-workspace__title') ||
          target.closest('.cuaderno-page-header') ||
          target.closest('.cuaderno-page-comment') ||
          target.closest('.cuaderno-page-cover-wrap') ||
          target.closest('.cuaderno-emoji-picker') ||
          target.closest('.cuaderno-cover-picker') ||
          target.closest('.cuaderno-workspace__header') ||
          target.closest('.cuaderno-workspace__page') ||
          target.closest('.cuaderno-workspace__page-body') ||
          target.closest('.cuaderno-link-picker') ||
          target.closest('.cuaderno-inline-toolbar') ||
          target.closest('.cuaderno-block-menu') ||
          target.closest('.cuaderno-todo-block') ||
          target.closest('.cuaderno-list-block') ||
          target.closest('.cuaderno-column-block') ||
          target.closest('.cuaderno-table-block') ||
          target.closest('.cuaderno-data-panel') ||
          target.closest('.cuadernos-sidebar') ||
          target.closest('.modal-overlay') ||
          target.closest('.confirm-dialog')
      )
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (shouldKeepEditing(event.target)) {
        return
      }

      const active = document.activeElement
      if (active instanceof Element && isActiveEditingTarget(active)) {
        if (event.target instanceof Element && event.target.closest('.cuadernos-main')) {
          return
        }
      }

      void exitEditMode()
    }

    document.addEventListener('click', handleClickOutside, true)
    return () => document.removeEventListener('click', handleClickOutside, true)
  }, [exitEditMode, mode])

  const openDataPanel = (tab: DataPanelTab) => {
    const normalized = normalizeDocument(cuadernoDoc)
    setDataTab(tab)
    setDataError(null)
    setDataDraft(tab === 'json' ? serializeDocument(normalized) : documentToXml(normalized))
    setShowDataPanel(true)
    setShowOverflowMenu(false)
  }

  const applyDataDraft = () => {
    setDataError(null)
    if (dataTab === 'json') {
      try {
        const parsed = parseCuadernoContent(dataDraft)
        setCuadernoDoc(parsed)
        setMode('edit')
        setShowDataPanel(false)
      } catch {
        setDataError('JSON inválido o formato no reconocido')
      }
      return
    }

    const parsed = tryParseXmlDocument(dataDraft)
    if (!parsed) {
      setDataError('XML inválido')
      return
    }
    setCuadernoDoc(parsed)
    setMode('edit')
    setShowDataPanel(false)
  }

  const handleDelete = async () => {
    setShowOverflowMenu(false)
    if (
      !(await confirm({
        message: '¿Eliminar este cuaderno? Esta acción no se puede deshacer.',
        variant: 'danger',
      }))
    ) {
      return
    }
    await onDelete()
  }

  const isEditing = mode === 'edit'

  const childNotes = useMemo(() => getNoteChildren(note.id, allNotes), [note.id, allNotes])

  const parentNote = useMemo(() => {
    const ids = new Set(allNotes.map(item => item.id))
    const parentId = getNoteParentId(note, ids)
    return parentId ? allNotes.find(item => item.id === parentId) : undefined
  }, [allNotes, note])

  const backLabel = useMemo(() => {
    if (isMobileLayout && parentNote) {
      return parentNote.titulo.trim() || 'Sin título'
    }
    return 'Cuadernos'
  }, [isMobileLayout, parentNote])

  const statusText = isEditing
    ? saveState === 'saving' || isSaving
      ? 'Guardando…'
      : saveState === 'saved'
        ? 'Guardado'
        : saveState === 'error'
          ? 'Error al guardar'
          : ''
    : ''

  const hasCover = Boolean(cuadernoDoc.cover)

  const workspaceHeader = (
    <header
      className={[
        'cuaderno-workspace__header',
        hasCover ? 'cuaderno-workspace__header--over-cover' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="cuaderno-workspace__header-start">
        {showHierarchyLink && onShowHierarchy ? (
          <button
            type="button"
            className="cuaderno-workspace__action cuaderno-workspace__hierarchy"
            onClick={onShowHierarchy}
            aria-label="Mostrar jerarquía de cuadernos"
            aria-expanded={false}
          >
            <ViewSidebarOutlinedIcon fontSize="small" aria-hidden />
            Jerarquía
          </button>
        ) : null}
        {showBackLink && onBack ? (
          <button
            type="button"
            className="cuaderno-workspace__back"
            onClick={onBack}
            aria-label={`Volver a ${backLabel}`}
          >
            <ArrowBackIcon fontSize="small" aria-hidden />
            {backLabel}
          </button>
        ) : null}
      </div>

      <div className="cuaderno-workspace__header-end">
        {statusText ? (
          <span
            className={[
              'cuaderno-workspace__status',
              saveState === 'error' ? 'cuaderno-workspace__status--error' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-live="polite"
          >
            {statusText}
            {saveState === 'error' ? (
              <button
                type="button"
                className="cuaderno-workspace__retry"
                onClick={() => void persist(true)}
              >
                Reintentar
              </button>
            ) : null}
          </span>
        ) : null}

        {showSubpages && onCreateSubnotebook ? (
          <button
            type="button"
            className="cuaderno-workspace__action"
            onClick={() => setShowSubpagesModal(true)}
          >
            <FolderOpenOutlinedIcon fontSize="small" aria-hidden />
            Subpáginas{childNotes.length > 0 ? ` (${childNotes.length})` : ''}
          </button>
        ) : null}

        <div className="cuaderno-workspace__overflow" ref={overflowRef}>
          <button
            type="button"
            className="cuaderno-workspace__overflow-trigger"
            onClick={() => setShowOverflowMenu(open => !open)}
            aria-label="Más opciones"
            aria-expanded={showOverflowMenu}
          >
            <MoreHorizIcon fontSize="small" aria-hidden />
          </button>
          {showOverflowMenu && (
            <div
              ref={overflowMenuRef}
              className="cuaderno-workspace__overflow-menu"
              role="menu"
              aria-label="Opciones del cuaderno"
            >
              {!isEditing ? (
                <button
                  type="button"
                  className={overflowHighlight === 0 ? 'active' : ''}
                  role="menuitem"
                  onClick={() => {
                    setShowOverflowMenu(false)
                    setShowSubpagesModal(true)
                  }}
                >
                  <FolderOpenOutlinedIcon fontSize="small" aria-hidden />
                  Ver subpáginas
                </button>
              ) : (
                <button
                  type="button"
                  className={overflowHighlight === 0 ? 'active' : ''}
                  role="menuitem"
                  onClick={() => void persist(true)}
                >
                  Guardar ahora
                </button>
              )}
              <button
                type="button"
                className={overflowHighlight === 1 ? 'active' : ''}
                role="menuitem"
                onClick={() => {
                  setShowOverflowMenu(false)
                  onCreateSubnotebook?.(note.id)
                }}
              >
                <CreateNewFolderOutlinedIcon fontSize="small" aria-hidden />
                Nueva subpágina
              </button>
              <button
                type="button"
                className={overflowHighlight === 2 ? 'active' : ''}
                role="menuitem"
                onClick={() => openDataPanel('json')}
              >
                Ver / editar JSON
              </button>
              <button
                type="button"
                className={overflowHighlight === 3 ? 'active' : ''}
                role="menuitem"
                onClick={() => openDataPanel('xml')}
              >
                Ver / editar XML
              </button>
              <button
                type="button"
                className={`danger ${overflowHighlight === 4 ? 'active' : ''}`}
                role="menuitem"
                onClick={() => void handleDelete()}
              >
                <DeleteOutlineIcon fontSize="small" aria-hidden />
                Eliminar cuaderno
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )

  return (
    <div
      className={[
        'cuaderno-workspace',
        isEditing ? 'cuaderno-workspace--edit' : 'cuaderno-workspace--read',
        isMobileLayout ? 'cuaderno-workspace--mobile' : '',
        hasCover ? 'cuaderno-workspace--has-cover' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >

      {showSubpagesModal && showSubpages && onCreateSubnotebook ? (
        <CuadernoSubpagesModal
          parentTitle={title}
          childNotes={childNotes}
          onClose={() => setShowSubpagesModal(false)}
          onOpenChild={childId => void onNavigateNote?.(childId)}
          onCreateChild={() => onCreateSubnotebook(note.id)}
        />
      ) : null}

      <div
        className={`cuaderno-workspace__page${hasCover ? ' cuaderno-workspace__page--has-cover' : ''}`}
      >
        {hasCover ? (
          <div className="cuaderno-workspace__hero">
            <CuadernoPageCover
              cover={cuadernoDoc.cover}
              isEditing={isEditing}
              onCoverChange={nextCover => updatePageMeta({ cover: nextCover })}
            />
            {workspaceHeader}
          </div>
        ) : (
          workspaceHeader
        )}
        {!hasCover && isEditing ? (
          <CuadernoPageCover
            cover={cuadernoDoc.cover}
            isEditing={isEditing}
            onCoverChange={nextCover => updatePageMeta({ cover: nextCover })}
          />
        ) : null}
        <div className="cuaderno-workspace__page-body">
        {isEditing ? (
          <>
            <CuadernoPageHeader
              icon={cuadernoDoc.icon}
              comment={cuadernoDoc.comment}
              title={title}
              isEditing
              hasCover={Boolean(cuadernoDoc.cover)}
              fechaCreacion={note.fechaCreacion}
              fechaActualizacion={note.fechaActualizacion}
              titleInputRef={titleInputRef}
              onIconChange={nextIcon => updatePageMeta({ icon: nextIcon })}
              onCommentChange={nextComment => updatePageMeta({ comment: nextComment })}
              onTitleChange={setTitle}
            />
            <CuadernoBlockEditor
              document={cuadernoDoc}
              onChange={setCuadernoDoc}
              linkNotes={linkNotes}
              currentNoteId={note.id}
              onImagePasteError={message => showNotification(message, 'error')}
            />
          </>
        ) : (
          <div
            className="cuaderno-read-surface"
            onMouseUp={handleReadSurfacePointerUp}
            role="region"
            aria-label="Contenido del cuaderno. Pulsa el texto para editar."
          >
            <CuadernoPageHeader
              icon={cuadernoDoc.icon}
              comment={cuadernoDoc.comment}
              title={title}
              isEditing={false}
              hasCover={Boolean(cuadernoDoc.cover)}
              fechaCreacion={note.fechaCreacion}
              fechaActualizacion={note.fechaActualizacion}
            />
            <CuadernoBlockViewer document={cuadernoDoc} />
          </div>
        )}
        </div>
      </div>

      {showDataPanel && (
        <div className="cuaderno-data-panel" role="presentation">
          <div
            ref={dataPanelRef}
            className="cuaderno-data-panel__sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Editor de datos"
          >
            <div className="cuaderno-data-panel__tabs">
              <button
                type="button"
                className={dataTab === 'json' ? 'active' : ''}
                onClick={() => openDataPanel('json')}
              >
                JSON
              </button>
              <button
                type="button"
                className={dataTab === 'xml' ? 'active' : ''}
                onClick={() => openDataPanel('xml')}
              >
                XML
              </button>
            </div>
            <p className="cuaderno-data-panel__hint">
              Edita el documento en {dataTab.toUpperCase()} y aplica los cambios al editor visual.
            </p>
            <textarea
              className="cuaderno-data-panel__textarea"
              value={dataDraft}
              onChange={event => setDataDraft(event.target.value)}
              spellCheck={false}
              rows={16}
            />
            {dataError && (
              <p className="cuaderno-data-panel__error" role="alert">
                {dataError}
              </p>
            )}
            <div className="cuaderno-data-panel__actions">
              <button type="button" className="modal-button secondary" onClick={() => setShowDataPanel(false)}>
                Cerrar
              </button>
              <button type="button" className="modal-button primary" onClick={applyDataDraft}>
                Aplicar al editor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

export default CuadernoWorkspace
