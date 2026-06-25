import { useEffect, useMemo, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import DiamondIcon from '@mui/icons-material/Diamond'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import SpaIcon from '@mui/icons-material/Spa'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import { devError } from '../utils/debugTools'
import ListSkeleton from '../components/ListSkeleton'
import ModalOverlay from '../components/ModalOverlay'
import LifestyleSubHeader from '../components/tiempo/LifestyleSubHeader'
import ValorEntryCard from '../components/valores/ValorEntryCard'
import type {
  PersonalValueEntry,
  PersonalValueKind,
  ValoresFilterKind,
} from '../components/valores/valorTypes'
import {
  filterPersonalValuesByKind,
  filterPersonalValuesByQuery,
  getPersonalValueKindLabel,
  normalizePersonalValueKind,
  sortPersonalValues,
  summarizePersonalValues,
} from '../components/valores/valoresDisplayUtils'
import './AppPage.css'
import './Valores.css'

interface ValueFormState {
  kind: PersonalValueKind
  title: string
  description: string
}

const EMPTY_FORM: ValueFormState = {
  kind: 'value',
  title: '',
  description: '',
}

const FILTER_OPTIONS: Array<{ id: ValoresFilterKind; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'value', label: 'Valores' },
  { id: 'belief', label: 'Creencias' },
]

function mapApiEntry(entry: {
  id: string
  kind: string
  title: string
  description?: string | null
  created_at: string
  updated_at: string
}): PersonalValueEntry {
  return {
    id: entry.id,
    kind: normalizePersonalValueKind(entry.kind),
    title: entry.title,
    description: entry.description ?? null,
    created_at: entry.created_at,
    updated_at: entry.updated_at,
  }
}

function Valores() {
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const [entries, setEntries] = useState<PersonalValueEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<ValoresFilterKind>('all')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<PersonalValueEntry | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<ValueFormState>(EMPTY_FORM)

  const loadEntries = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.getPersonalValues()
      const rows = Array.isArray(response.entries) ? response.entries.map(mapApiEntry) : []
      setEntries(sortPersonalValues(rows))
    } catch (err: unknown) {
      devError('Error al cargar valores:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al cargar valores y creencias. Por favor, intenta de nuevo.'
      )
      setError(errorMessage)
      showNotification(errorMessage, 'error')
      setEntries([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadEntries()
  }, [])

  const stats = useMemo(() => summarizePersonalValues(entries), [entries])

  const visibleEntries = useMemo(() => {
    const filtered = filterPersonalValuesByKind(entries, activeFilter)
    return sortPersonalValues(filterPersonalValuesByQuery(filtered, searchQuery))
  }, [activeFilter, entries, searchQuery])

  const headerMeta = !isLoading && !error
    ? stats.total === 0
      ? 'Define lo que te guía y lo en lo que crees'
      : `${stats.values} valor${stats.values !== 1 ? 'es' : ''} · ${stats.beliefs} creencia${stats.beliefs !== 1 ? 's' : ''}`
    : undefined

  const openCreateModal = (kind: PersonalValueKind = 'value') => {
    setEditingEntryId(null)
    setFormData({ ...EMPTY_FORM, kind })
    setIsFormOpen(true)
    setIsMenuOpen(false)
  }

  const openEditModal = (entry: PersonalValueEntry) => {
    setEditingEntryId(entry.id)
    setFormData({
      kind: entry.kind,
      title: entry.title,
      description: entry.description ?? '',
    })
    setIsFormOpen(true)
    setIsDetailOpen(false)
  }

  const openDetailModal = (entry: PersonalValueEntry) => {
    setSelectedEntry(entry)
    setIsDetailOpen(true)
  }

  const closeFormModal = () => {
    setIsFormOpen(false)
    setEditingEntryId(null)
    setFormData(EMPTY_FORM)
  }

  const closeDetailModal = () => {
    setIsDetailOpen(false)
    setSelectedEntry(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const title = formData.title.trim()
    if (!title) {
      showNotification('El título es obligatorio', 'error')
      return
    }

    const payload = {
      kind: formData.kind,
      title,
      description: formData.description.trim() || null,
    }

    try {
      setIsSaving(true)
      if (editingEntryId) {
        const response = await api.updatePersonalValue(editingEntryId, payload)
        const updated = response.entry ? mapApiEntry(response.entry) : null
        if (updated) {
          setEntries(current => sortPersonalValues(current.map(item => (item.id === updated.id ? updated : item))))
          if (selectedEntry?.id === updated.id) {
            setSelectedEntry(updated)
          }
        }
        showNotification('Entrada actualizada', 'success')
      } else {
        const response = await api.createPersonalValue(payload)
        const created = response.entry ? mapApiEntry(response.entry) : null
        if (created) {
          setEntries(current => sortPersonalValues([created, ...current]))
          setActiveFilter(created.kind)
        }
        showNotification(
          created?.kind === 'belief' ? 'Creencia creada' : 'Valor creado',
          'success'
        )
      }
      closeFormModal()
    } catch (err: unknown) {
      devError('Error al guardar valor:', err)
      showNotification(
        getTranslatedErrorMessage(err, 'Error al guardar. Por favor, intenta de nuevo.'),
        'error'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (entry: PersonalValueEntry) => {
    const accepted = await confirm({
      title: 'Eliminar entrada',
      message: `¿Eliminar "${entry.title}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!accepted) {
      return
    }

    try {
      await api.deletePersonalValue(entry.id)
      setEntries(current => current.filter(item => item.id !== entry.id))
      closeDetailModal()
      showNotification('Entrada eliminada', 'success')
    } catch (err: unknown) {
      devError('Error al eliminar valor:', err)
      showNotification(
        getTranslatedErrorMessage(err, 'Error al eliminar. Por favor, intenta de nuevo.'),
        'error'
      )
    }
  }

  return (
    <div className="app-page-container">
      <div className="app-page-content lifestyle-sub-content valores-content">
        <LifestyleSubHeader
          title="Valores"
          context="Identidad"
          meta={headerMeta}
          toolbarActions={
            <div className="lifestyle-sub-menu-container">
              <button
                type="button"
                className="app-toolbar-button"
                onClick={() => setIsMenuOpen(open => !open)}
                aria-label="Opciones"
                aria-expanded={isMenuOpen}
              >
                <MoreVertIcon className="app-toolbar-icon" />
              </button>
              {isMenuOpen ? (
                <div className="lifestyle-sub-menu">
                  <button
                    type="button"
                    className="lifestyle-sub-menu-item"
                    onClick={() => openCreateModal('value')}
                  >
                    Nuevo valor
                  </button>
                  <button
                    type="button"
                    className="lifestyle-sub-menu-item"
                    onClick={() => openCreateModal('belief')}
                  >
                    Nueva creencia
                  </button>
                  <button
                    type="button"
                    className="lifestyle-sub-menu-item"
                    onClick={() => {
                      setIsMenuOpen(false)
                      void loadEntries()
                    }}
                    disabled={isLoading}
                  >
                    Actualizar
                  </button>
                </div>
              ) : null}
            </div>
          }
        />

        <section className="valores-hero" aria-label="Resumen de valores y creencias">
          <div className="valores-hero__copy">
            <SpaIcon className="valores-hero__icon" aria-hidden="true" />
            <div>
              <h2 className="valores-hero__title">Tu brújula personal</h2>
              <p className="valores-hero__subtitle">
                Los valores definen quién quieres ser; las creencias, cómo interpretas el mundo.
              </p>
            </div>
          </div>
          <div className="valores-hero__stats">
            <div className="valores-stat-pill valores-stat-pill--value">
              <DiamondIcon aria-hidden="true" />
              <span className="valores-stat-pill__value">{stats.values}</span>
              <span className="valores-stat-pill__label">Valores</span>
            </div>
            <div className="valores-stat-pill valores-stat-pill--belief">
              <AutoStoriesIcon aria-hidden="true" />
              <span className="valores-stat-pill__value">{stats.beliefs}</span>
              <span className="valores-stat-pill__label">Creencias</span>
            </div>
          </div>
        </section>

        <div className="valores-toolbar">
          <div className="valores-search">
            <SearchIcon className="valores-search-icon" aria-hidden="true" />
            <input
              type="search"
              className="valores-search-input"
              placeholder="Buscar por título o descripción"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              aria-label="Buscar valores y creencias"
            />
          </div>

          <div className="valores-filter-tabs" role="tablist" aria-label="Filtrar por tipo">
            {FILTER_OPTIONS.map(option => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={activeFilter === option.id}
                className={`valores-filter-tab${activeFilter === option.id ? ' valores-filter-tab--active' : ''}`}
                onClick={() => setActiveFilter(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="valores-actions">
          <button type="button" className="valores-action valores-action--value" onClick={() => openCreateModal('value')}>
            <DiamondIcon fontSize="small" aria-hidden="true" />
            Nuevo valor
          </button>
          <button type="button" className="valores-action valores-action--belief" onClick={() => openCreateModal('belief')}>
            <AutoStoriesIcon fontSize="small" aria-hidden="true" />
            Nueva creencia
          </button>
        </div>

        {isLoading ? (
          <ListSkeleton variant="summary-card" count={4} aria-label="Cargando valores" />
        ) : error ? (
          <div className="valores-empty">
            <p role="alert">{error}</p>
            <button type="button" className="valores-secondary-button" onClick={() => void loadEntries()}>
              <RefreshIcon fontSize="small" aria-hidden="true" />
              Reintentar
            </button>
          </div>
        ) : visibleEntries.length === 0 ? (
          <div className="valores-empty">
            <SpaIcon className="valores-empty__icon" aria-hidden="true" />
            <p className="valores-empty__title">
              {searchQuery || activeFilter !== 'all'
                ? 'No hay entradas que coincidan'
                : 'Tu brújula está en blanco'}
            </p>
            <p className="valores-empty__subtitle">
              {searchQuery || activeFilter !== 'all'
                ? 'Prueba otro filtro o término de búsqueda.'
                : 'Empieza con un valor que quieras honrar o una creencia que te inspire.'}
            </p>
            {!searchQuery && activeFilter === 'all' ? (
              <div className="valores-empty__actions">
                <button type="button" className="valores-action valores-action--value" onClick={() => openCreateModal('value')}>
                  <AddIcon fontSize="small" aria-hidden="true" />
                  Crear valor
                </button>
                <button type="button" className="valores-action valores-action--belief" onClick={() => openCreateModal('belief')}>
                  <AddIcon fontSize="small" aria-hidden="true" />
                  Crear creencia
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="valores-grid">
            {visibleEntries.map(entry => (
              <ValorEntryCard
                key={entry.id}
                entry={entry}
                onOpen={() => openDetailModal(entry)}
                onEdit={() => openEditModal(entry)}
              />
            ))}
          </div>
        )}
      </div>

      {isFormOpen ? (
        <ModalOverlay onClose={closeFormModal}>
          <div className="valores-modal" onClick={event => event.stopPropagation()}>
            <div className="valores-modal-header">
              <h2 className="valores-modal-title">
                {editingEntryId
                  ? `Editar ${getPersonalValueKindLabel(formData.kind).toLowerCase()}`
                  : formData.kind === 'belief'
                    ? 'Nueva creencia'
                    : 'Nuevo valor'}
              </h2>
              <button type="button" className="valores-icon-button" onClick={closeFormModal} aria-label="Cerrar">
                <CloseIcon />
              </button>
            </div>

            <form className="valores-form" onSubmit={event => void handleSubmit(event)}>
              <fieldset className="valores-kind-picker">
                <legend>Tipo</legend>
                <label className={`valores-kind-option${formData.kind === 'value' ? ' valores-kind-option--active' : ''}`}>
                  <input
                    type="radio"
                    name="kind"
                    value="value"
                    checked={formData.kind === 'value'}
                    onChange={() => setFormData(current => ({ ...current, kind: 'value' }))}
                  />
                  <DiamondIcon aria-hidden="true" />
                  <span>Valor</span>
                </label>
                <label className={`valores-kind-option${formData.kind === 'belief' ? ' valores-kind-option--active' : ''}`}>
                  <input
                    type="radio"
                    name="kind"
                    value="belief"
                    checked={formData.kind === 'belief'}
                    onChange={() => setFormData(current => ({ ...current, kind: 'belief' }))}
                  />
                  <AutoStoriesIcon aria-hidden="true" />
                  <span>Creencia</span>
                </label>
              </fieldset>

              <label className="valores-field">
                <span>Título *</span>
                <input
                  type="text"
                  value={formData.title}
                  onChange={event => setFormData(current => ({ ...current, title: event.target.value }))}
                  placeholder={formData.kind === 'belief' ? 'Ej: El esfuerzo constante da resultados' : 'Ej: Honestidad'}
                  required
                />
              </label>

              <label className="valores-field">
                <span>Descripción</span>
                <textarea
                  value={formData.description}
                  onChange={event =>
                    setFormData(current => ({ ...current, description: event.target.value }))
                  }
                  placeholder={
                    formData.kind === 'belief'
                      ? '¿Qué significa esta creencia para ti?'
                      : '¿Cómo se manifiesta este valor en tu vida?'
                  }
                  rows={4}
                />
              </label>

              <div className="valores-form-actions">
                <button type="button" className="valores-secondary-button" onClick={closeFormModal}>
                  Cancelar
                </button>
                <button type="submit" className="valores-primary-button" disabled={isSaving}>
                  {isSaving ? 'Guardando…' : editingEntryId ? 'Guardar cambios' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      ) : null}

      {isDetailOpen && selectedEntry ? (
        <ModalOverlay onClose={closeDetailModal}>
          <div
            className={`valores-detail valores-detail--${selectedEntry.kind}`}
            onClick={event => event.stopPropagation()}
          >
            <div className="valores-detail-header">
              <span className="valores-detail-kind">{getPersonalValueKindLabel(selectedEntry.kind)}</span>
              <button type="button" className="valores-icon-button" onClick={closeDetailModal} aria-label="Cerrar">
                <CloseIcon />
              </button>
            </div>
            <h2 className="valores-detail-title">{selectedEntry.title}</h2>
            {selectedEntry.description ? (
              <p className="valores-detail-description">
                {selectedEntry.kind === 'belief' ? `“${selectedEntry.description}”` : selectedEntry.description}
              </p>
            ) : (
              <p className="valores-detail-placeholder">Sin descripción</p>
            )}
            <div className="valores-detail-actions">
              <button type="button" className="valores-secondary-button" onClick={() => openEditModal(selectedEntry)}>
                Editar
              </button>
              <button
                type="button"
                className="valores-danger-button"
                onClick={() => void handleDelete(selectedEntry)}
              >
                <DeleteIcon fontSize="small" aria-hidden="true" />
                Eliminar
              </button>
            </div>
          </div>
        </ModalOverlay>
      ) : null}
    </div>
  )
}

export default Valores
