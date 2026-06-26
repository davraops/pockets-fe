import { useEffect, useMemo, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import FlagIcon from '@mui/icons-material/Flag'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import { devError } from '../utils/debugTools'
import ListSkeleton from '../components/ListSkeleton'
import ModalOverlay from '../components/ModalOverlay'
import LifestyleSubHeader from '../components/tiempo/LifestyleSubHeader'
import MetaGoalCard from '../components/metas/MetaGoalCard'
import type { Goal, GoalTask, GoalTaskStatus } from '../components/metas/metaTypes'
import {
  cycleGoalTaskStatus,
  filterGoalsByQuery,
  normalizeGoalTaskStatus,
  sortGoalsByUpdated,
  summarizeGoalsStats,
  updateGoalTaskStatus,
} from '../components/metas/metasDisplayUtils'
import './AppPage.css'
import './Metas.css'

interface GoalFormTask {
  id?: string
  title: string
  status: GoalTaskStatus
}

interface GoalFormState {
  title: string
  description: string
  tasks: GoalFormTask[]
  newTaskTitle: string
}

const EMPTY_FORM: GoalFormState = {
  title: '',
  description: '',
  tasks: [],
  newTaskTitle: '',
}

function mapApiGoal(goal: {
  id: string
  title: string
  description?: string | null
  tasks?: Array<{ id?: string; title: string; status?: string }>
  created_at: string
  updated_at: string
}): Goal {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description ?? null,
    tasks: (goal.tasks ?? []).map(task => ({
      id: task.id ?? crypto.randomUUID(),
      title: task.title,
      status: normalizeGoalTaskStatus(task.status),
    })),
    created_at: goal.created_at,
    updated_at: goal.updated_at,
  }
}

function Metas() {
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null)
  const [updatingGoalId, setUpdatingGoalId] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<GoalFormState>(EMPTY_FORM)

  const loadGoals = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.getGoals()
      const rows = Array.isArray(response.goals) ? response.goals.map(mapApiGoal) : []
      setGoals(sortGoalsByUpdated(rows))
    } catch (err: unknown) {
      devError('Error al cargar metas:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al cargar las metas. Por favor, intenta de nuevo.'
      )
      setError(errorMessage)
      showNotification(errorMessage, 'error')
      setGoals([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadGoals()
  }, [])

  const filteredGoals = useMemo(
    () => sortGoalsByUpdated(filterGoalsByQuery(goals, searchQuery)),
    [goals, searchQuery]
  )

  const stats = useMemo(() => summarizeGoalsStats(goals), [goals])

  const headerMeta = !isLoading && !error
    ? stats.total === 0
      ? 'Define metas personales con tareas'
      : `${stats.total} meta${stats.total !== 1 ? 's' : ''} · ${stats.pendingTasks} tarea${stats.pendingTasks !== 1 ? 's' : ''} pendiente${stats.pendingTasks !== 1 ? 's' : ''}`
    : undefined

  const openCreateModal = () => {
    setEditingGoalId(null)
    setFormData(EMPTY_FORM)
    setIsFormOpen(true)
    setIsMenuOpen(false)
  }

  const openEditModal = (goal: Goal) => {
    setEditingGoalId(goal.id)
    setFormData({
      title: goal.title,
      description: goal.description ?? '',
      tasks: goal.tasks.map(task => ({ id: task.id, title: task.title, status: task.status })),
      newTaskTitle: '',
    })
    setIsFormOpen(true)
  }

  const closeFormModal = () => {
    setIsFormOpen(false)
    setEditingGoalId(null)
    setFormData(EMPTY_FORM)
  }

  const handleAddTaskToForm = () => {
    const title = formData.newTaskTitle.trim()
    if (!title) {
      return
    }
    setFormData(current => ({
      ...current,
      tasks: [...current.tasks, { title, status: 'pending' }],
      newTaskTitle: '',
    }))
  }

  const handleRemoveTaskFromForm = (index: number) => {
    setFormData(current => ({
      ...current,
      tasks: current.tasks.filter((_, taskIndex) => taskIndex !== index),
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const title = formData.title.trim()
    if (!title) {
      showNotification('El título de la meta es obligatorio', 'error')
      return
    }

    const payload = {
      title,
      description: formData.description.trim() || null,
      tasks: formData.tasks.map(task => ({
        id: task.id,
        title: task.title.trim(),
        status: task.status,
      })),
    }

    try {
      setIsSaving(true)
      if (editingGoalId) {
        const response = await api.updateGoal(editingGoalId, payload)
        const updated = response.goal ? mapApiGoal(response.goal) : null
        if (updated) {
          setGoals(current => sortGoalsByUpdated(current.map(goal => (goal.id === updated.id ? updated : goal))))
        }
        showNotification('Meta actualizada', 'success')
      } else {
        const response = await api.createGoal(payload)
        const created = response.goal ? mapApiGoal(response.goal) : null
        if (created) {
          setGoals(current => sortGoalsByUpdated([created, ...current]))
          setExpandedGoalId(created.id)
        }
        showNotification('Meta creada', 'success')
      }
      closeFormModal()
    } catch (err: unknown) {
      devError('Error al guardar meta:', err)
      showNotification(
        getTranslatedErrorMessage(err, 'Error al guardar la meta. Por favor, intenta de nuevo.'),
        'error'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteGoal = async (goal: Goal) => {
    const accepted = await confirm({
      title: 'Eliminar meta',
      message: `¿Eliminar "${goal.title}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!accepted) {
      return
    }

    try {
      await api.deleteGoal(goal.id)
      setGoals(current => current.filter(item => item.id !== goal.id))
      if (expandedGoalId === goal.id) {
        setExpandedGoalId(null)
      }
      showNotification('Meta eliminada', 'success')
    } catch (err: unknown) {
      devError('Error al eliminar meta:', err)
      showNotification(
        getTranslatedErrorMessage(err, 'Error al eliminar la meta. Por favor, intenta de nuevo.'),
        'error'
      )
    }
  }

  const handleTaskStatusChange = async (goal: Goal, taskId: string, currentStatus: GoalTaskStatus) => {
    const nextStatus = cycleGoalTaskStatus(currentStatus)
    const updatedTasks = updateGoalTaskStatus(goal.tasks, taskId, nextStatus)

    setUpdatingGoalId(goal.id)
    setGoals(current =>
      current.map(item =>
        item.id === goal.id
          ? { ...item, tasks: updatedTasks, updated_at: new Date().toISOString() }
          : item
      )
    )

    try {
      const response = await api.updateGoal(goal.id, {
        tasks: updatedTasks.map((task: GoalTask) => ({
          id: task.id,
          title: task.title,
          status: task.status,
        })),
      })
      const updated = response.goal ? mapApiGoal(response.goal) : null
      if (updated) {
        setGoals(current => sortGoalsByUpdated(current.map(item => (item.id === updated.id ? updated : item))))
      }
    } catch (err: unknown) {
      devError('Error al actualizar tarea:', err)
      setGoals(current => current.map(item => (item.id === goal.id ? goal : item)))
      showNotification(
        getTranslatedErrorMessage(err, 'Error al actualizar la tarea. Por favor, intenta de nuevo.'),
        'error'
      )
    } finally {
      setUpdatingGoalId(null)
    }
  }

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide crud-page-content lifestyle-sub-content metas-content">
        <LifestyleSubHeader
          title="Metas"
          context="Objetivos"
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
                    onClick={() => {
                      setIsMenuOpen(false)
                      void loadGoals()
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

        <div className="app-row-start metas-toolbar">
          <div className="metas-search">
            <SearchIcon className="metas-search-icon" aria-hidden="true" />
            <input
              type="search"
              className="metas-search-input"
              placeholder="Buscar metas o tareas"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              aria-label="Buscar metas"
            />
          </div>
          <button
            type="button"
            className="btn-base btn-accent btn-submit btn-accent--lifestyle"
            onClick={openCreateModal}
          >
            <AddIcon fontSize="small" aria-hidden="true" />
            Nueva meta
          </button>
        </div>

        {isLoading ? (
          <ListSkeleton variant="summary-card" count={3} aria-label="Cargando metas" />
        ) : error ? (
          <div className="metas-empty-state">
            <p role="alert">{error}</p>
            <button type="button" className="btn-base btn-secondary btn-retry" onClick={() => void loadGoals()}>
              <RefreshIcon fontSize="small" aria-hidden="true" />
              Reintentar
            </button>
          </div>
        ) : filteredGoals.length === 0 ? (
          <div className="metas-empty-state">
            <FlagIcon className="metas-empty-icon" aria-hidden="true" />
            <p className="empty-text">
              {searchQuery ? 'No hay metas que coincidan con tu búsqueda' : 'Aún no tienes metas'}
            </p>
            <p className="empty-subtext">
              {searchQuery
                ? 'Prueba con otro término o crea una meta nueva.'
                : 'Crea una meta y agrega tareas para hacer seguimiento de tu progreso.'}
            </p>
            {!searchQuery ? (
              <button
                type="button"
                className="btn-base btn-accent btn-submit btn-accent--lifestyle empty-state-cta"
                onClick={openCreateModal}
              >
                <AddIcon fontSize="small" aria-hidden="true" />
                Crear primera meta
              </button>
            ) : null}
          </div>
        ) : (
          <div className="app-content-section metas-goal-list">
            {filteredGoals.map(goal => (
              <MetaGoalCard
                key={goal.id}
                goal={goal}
                isExpanded={expandedGoalId === goal.id}
                isUpdating={updatingGoalId === goal.id}
                onToggleExpand={() =>
                  setExpandedGoalId(current => (current === goal.id ? null : goal.id))
                }
                onEdit={() => openEditModal(goal)}
                onDelete={() => void handleDeleteGoal(goal)}
                onTaskStatusChange={(taskId, status) => void handleTaskStatusChange(goal, taskId, status)}
              />
            ))}
          </div>
        )}
      </div>

      {isFormOpen ? (
        <ModalOverlay onClose={closeFormModal}>
          <div className="modal-panel metas-modal" onClick={event => event.stopPropagation()}>
            <div className="metas-modal-header">
              <h2 className="modal-panel-title">
                {editingGoalId ? 'Editar meta' : 'Nueva meta'}
              </h2>
              <button
                type="button"
                className="modal-panel-close"
                onClick={closeFormModal}
                aria-label="Cerrar"
              >
                <CloseIcon aria-hidden="true" />
              </button>
            </div>

            <form className="metas-form" onSubmit={event => void handleSubmit(event)}>
              <div className="modal-panel__scroll metas-modal__body">
              <label className="metas-field">
                <span className="form-label-base">Título *</span>
                <input
                  type="text"
                  value={formData.title}
                  onChange={event => setFormData(current => ({ ...current, title: event.target.value }))}
                  placeholder="Ej: Correr un maratón"
                  required
                />
              </label>

              <label className="metas-field">
                <span className="form-label-base">Descripción</span>
                <textarea
                  value={formData.description}
                  onChange={event =>
                    setFormData(current => ({ ...current, description: event.target.value }))
                  }
                  placeholder="Contexto o motivación de la meta"
                  rows={3}
                />
              </label>

              <div className="metas-field">
                <span className="form-label-base">Tareas</span>
                <div className="metas-form-task-input">
                  <input
                    type="text"
                    value={formData.newTaskTitle}
                    onChange={event =>
                      setFormData(current => ({ ...current, newTaskTitle: event.target.value }))
                    }
                    placeholder="Nueva tarea"
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        handleAddTaskToForm()
                      }
                    }}
                  />
                  <button type="button" className="btn-base btn-secondary btn-sm" onClick={handleAddTaskToForm}>
                    <AddIcon fontSize="small" aria-hidden="true" />
                    Agregar
                  </button>
                </div>

                {formData.tasks.length > 0 ? (
                  <ul className="metas-form-task-list">
                    {formData.tasks.map((task, index) => (
                      <li key={`${task.title}-${index}`} className="metas-form-task-item">
                        <span>{task.title}</span>
                        <button
                          type="button"
                          className="btn-icon btn-icon--danger"
                          onClick={() => handleRemoveTaskFromForm(index)}
                          aria-label={`Quitar tarea ${task.title}`}
                        >
                          <CloseIcon fontSize="small" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="metas-form-hint">Puedes agregar tareas ahora o después.</p>
                )}
              </div>

              </div>

              <div className="modal-actions-base app-action-bar">
                <div className="app-action-bar__cluster">
                  <button type="button" className="btn-base btn-secondary" onClick={closeFormModal}>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-base btn-accent btn-submit btn-accent--lifestyle"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Guardando…' : editingGoalId ? 'Guardar cambios' : 'Crear meta'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </ModalOverlay>
      ) : null}
    </div>
  )
}

export default Metas
