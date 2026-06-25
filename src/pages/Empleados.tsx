import { useState, useEffect, useRef, useMemo } from 'react'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PersonIcon from '@mui/icons-material/Person'
import SearchIcon from '@mui/icons-material/Search'
import { api } from '../services/api'
import CrudSummaryStrip from '../components/crud/CrudSummaryStrip'
import CrudListPanel from '../components/crud/CrudListPanel'
import EmpleadoFormModal from '../components/empleados/EmpleadoFormModal'
import EmpleadoDetailModal from '../components/empleados/EmpleadoDetailModal'
import EmpleadoDebugModal from '../components/empleados/EmpleadoDebugModal'
import EmpleadoCard from '../components/empleados/EmpleadoCard'
import {
  EMPTY_EMPLOYEE_FORM,
  EMPTY_EMPLOYEE_FORM_ERRORS,
  employeeToFormData,
  formDataToEmployeePayload,
  validateEmployeeForm,
  type EmployeeFormData,
  type EmployeeFormErrors,
} from '../components/empleados/employeeFormUtils'
import {
  calculateEmployeeHighlights,
  employeeSummaryItems,
  filterEmployeesByQuery,
  filterEmployeesWithDebt,
  sortEmployeesByDebtPriority,
} from '../components/empleados/employeeDisplayUtils'
import type { Employee } from '../components/empleados/employeeTypes'
import { mapEmployeeRecords } from '../components/empleados/employeeTypes'
import { devError, isDebugToolsEnabled } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import UtilidadesSubHeader from '../components/utilidades/UtilidadesSubHeader'
import './AppPage.css'
import './Empleados.css'

function Empleados() {
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [formData, setFormData] = useState<EmployeeFormData>(EMPTY_EMPLOYEE_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debtFilterOnly, setDebtFilterOnly] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const identificationRef = useRef<HTMLInputElement>(null)
  const [formErrors, setFormErrors] = useState<EmployeeFormErrors>(EMPTY_EMPLOYEE_FORM_ERRORS)

  useEffect(() => {
    void loadRecords()
  }, [])

  const loadRecords = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.getEmployees()
      if (response.employees && Array.isArray(response.employees)) {
        setEmployees(mapEmployeeRecords(response.employees))
      } else {
        setEmployees([])
      }
    } catch (err: unknown) {
      devError('Error al cargar empleados:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al cargar empleados. Por favor, intenta de nuevo.'
      )
      setError(errorMessage)
      setEmployees([])
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const syncEmployee = async (employeeId: string) => {
    const response = await api.getEmployees()
    if (response.employees && Array.isArray(response.employees)) {
      const mappedEmployees = mapEmployeeRecords(response.employees)
      setEmployees(mappedEmployees)
      const updated = mappedEmployees.find(employee => employee.id === employeeId)
      if (updated) {
        setSelectedEmployee(updated)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name as keyof EmployeeFormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData(EMPTY_EMPLOYEE_FORM)
    setFormErrors(EMPTY_EMPLOYEE_FORM_ERRORS)
    setShowFormModal(false)
  }

  const handleOpenCreateModal = () => {
    setEditingId(null)
    setFormData(EMPTY_EMPLOYEE_FORM)
    setFormErrors(EMPTY_EMPLOYEE_FORM_ERRORS)
    setShowFormModal(true)
  }

  const handleCancelForm = () => {
    const returnToDetail = editingId && selectedEmployee
    resetForm()
    if (returnToDetail) {
      setShowDetailModal(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { isValid, errors } = validateEmployeeForm(formData)
    setFormErrors(errors)
    if (!isValid) {
      queueMicrotask(() => {
        if (errors.name) {
          nameRef.current?.focus()
        } else if (errors.identification) {
          identificationRef.current?.focus()
        }
      })
      return
    }

    try {
      setIsSaving(true)
      const employeeData = formDataToEmployeePayload(formData)

      if (editingId) {
        const existing =
          employees.find(employee => employee.id === editingId) ?? selectedEmployee
        await api.updateEmployee(editingId, {
          name: employeeData.name,
          data: { ...existing?.data, ...employeeData.data },
        })
        showNotification('Empleado actualizado', 'success')
      } else {
        await api.createEmployee(employeeData)
        showNotification('Empleado agregado', 'success')
      }

      await loadRecords()
      resetForm()
      setShowDetailModal(false)
      setSelectedEmployee(null)
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        editingId
          ? 'Error al actualizar el empleado. Por favor, intenta de nuevo.'
          : 'Error al agregar el empleado. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditFromDetail = () => {
    if (!selectedEmployee) {
      return
    }
    setFormData(employeeToFormData(selectedEmployee))
    setEditingId(selectedEmployee.id)
    setShowDetailModal(false)
    setShowFormModal(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (
      !(await confirm({
        message: `¿Estás seguro de que quieres eliminar el empleado "${name}"?`,
        variant: 'danger',
      }))
    ) {
      return
    }

    try {
      setIsSaving(true)
      await api.deleteEmployee(id)
      showNotification('Empleado eliminado', 'success')
      await loadRecords()
      setShowDetailModal(false)
      setSelectedEmployee(null)
      resetForm()
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar el empleado. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const highlights = calculateEmployeeHighlights(employees)
  const hasSearch = searchQuery.trim().length > 0
  const filteredEmployees = useMemo(() => {
    let result = filterEmployeesByQuery(employees, searchQuery)
    if (debtFilterOnly) {
      result = filterEmployeesWithDebt(result)
    }
    return sortEmployeesByDebtPriority(result)
  }, [debtFilterOnly, employees, searchQuery])

  const openEmployeeDetail = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowDetailModal(true)
  }

  const handleCloseDetailModal = () => {
    setShowDetailModal(false)
    setSelectedEmployee(null)
  }

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide crud-page-content empleados-content utilidades-sub-content">
        <UtilidadesSubHeader
          title="Empleados"
          context="Personas"
          meta={
            !isLoading && !error
              ? hasSearch
                ? `${filteredEmployees.length} de ${employees.length} registrado${employees.length !== 1 ? 's' : ''}`
                : `${employees.length} registrado${employees.length !== 1 ? 's' : ''}`
              : undefined
          }
          toolbarActions={
            isDebugToolsEnabled() ? (
              <div className="utilidades-sub-menu-container" ref={menuRef}>
                <button
                  type="button"
                  className="app-toolbar-button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Opciones de depuración"
                  aria-expanded={isMenuOpen}
                >
                  <MoreVertIcon className="app-toolbar-icon" />
                </button>
                {isMenuOpen && (
                  <div className="utilidades-sub-menu">
                    <button
                      type="button"
                      className="utilidades-sub-menu-item"
                      onClick={() => {
                        setIsMenuOpen(false)
                        setIsDebugModalOpen(true)
                      }}
                    >
                      🐛 Debug
                    </button>
                  </div>
                )}
              </div>
            ) : null
          }
        />

        {!isLoading && !error && employees.length > 0 ? (
          <CrudSummaryStrip
            ariaLabel="Resumen de empleados"
            items={employeeSummaryItems(highlights)}
          />
        ) : null}

        <div
          className={`empleados-toolbar${!isLoading && !error && employees.length === 0 ? ' empleados-toolbar--solo-cta' : ''}`}
        >
          {!isLoading && !error && (employees.length > 0 || hasSearch) ? (
            <div className="empleados-toolbar-filters">
              <label className="empleados-search">
                <SearchIcon className="empleados-search-icon" aria-hidden="true" />
                <input
                  type="search"
                  className="empleados-search-input"
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder="Buscar por nombre, cargo, documento…"
                  aria-label="Buscar empleados"
                />
              </label>
              <button
                type="button"
                className={`empleados-filter-chip${debtFilterOnly ? ' empleados-filter-chip--active' : ''}`}
                onClick={() => setDebtFilterOnly(current => !current)}
                aria-pressed={debtFilterOnly}
              >
                Con deuda
              </button>
            </div>
          ) : null}
          <button
            type="button"
            className="btn-base btn-accent btn-submit crud-primary-cta empleados-toolbar-cta"
            onClick={handleOpenCreateModal}
            aria-label="Agregar empleado"
          >
            <AddIcon aria-hidden={true} />
            Agregar empleado
          </button>
        </div>

        <CrudListPanel
          items={filteredEmployees}
          isLoading={isLoading}
          error={error}
          onRetry={() => void loadRecords()}
          retryAriaLabel="Reintentar cargar empleados"
          loadingAriaLabel="Cargando empleados"
          skeletonCount={6}
          emptyIcon={<PersonIcon className="empty-state-icon" />}
          emptyTitle={
            debtFilterOnly && !hasSearch
              ? 'Nadie con deuda pendiente'
              : hasSearch || debtFilterOnly
                ? 'Sin coincidencias'
                : 'No hay empleados registrados'
          }
          emptySubtext={
            debtFilterOnly && !hasSearch
              ? 'Todos los empleados están al día'
              : hasSearch || debtFilterOnly
                ? 'Prueba con otro término o limpia los filtros'
                : 'Usa Agregar empleado para registrar el primero'
          }
          getItemKey={employee => employee.id}
          listOuterClassName="empleados-list"
          loadingListClassName="empleados-card-grid empleados-card-grid--loading"
          renderBody={() => (
            <div className="empleados-card-grid" role="list">
              {filteredEmployees.map(employee => (
                <EmpleadoCard
                  key={employee.id}
                  employee={employee}
                  onClick={() => openEmployeeDetail(employee)}
                />
              ))}
            </div>
          )}
        />

        {showFormModal && (
          <EmpleadoFormModal
            editingId={editingId}
            formData={formData}
            formErrors={formErrors}
            nameRef={nameRef}
            identificationRef={identificationRef}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onCancel={handleCancelForm}
          />
        )}

        {showDetailModal && selectedEmployee && !showFormModal && (
          <EmpleadoDetailModal
            employee={selectedEmployee}
            isBusy={isSaving}
            onClose={handleCloseDetailModal}
            onEdit={handleEditFromDetail}
            onDelete={() => void handleDelete(selectedEmployee.id, selectedEmployee.name)}
            onSync={syncEmployee}
          />
        )}

        {isDebugModalOpen && isDebugToolsEnabled() && (
          <EmpleadoDebugModal
            onClose={() => setIsDebugModalOpen(false)}
            onReload={loadRecords}
            onClearList={() => setEmployees([])}
          />
        )}
      </div>
    </div>
  )
}

export default Empleados
