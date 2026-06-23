import { useState, useEffect, useRef } from 'react'
import { backToHubLabel } from '../constants/hubLabels'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PersonIcon from '@mui/icons-material/Person'
import { api } from '../services/api'
import CrudSummaryStrip from '../components/crud/CrudSummaryStrip'
import CrudListPanel from '../components/crud/CrudListPanel'
import EmpleadoFormModal from '../components/empleados/EmpleadoFormModal'
import EmpleadoDetailModal from '../components/empleados/EmpleadoDetailModal'
import EmpleadoDebugModal from '../components/empleados/EmpleadoDebugModal'
import EmpleadoListRow from '../components/empleados/EmpleadoListRow'
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
} from '../components/empleados/employeeDisplayUtils'
import type { Employee } from '../components/empleados/employeeTypes'
import { mapEmployeeRecords } from '../components/empleados/employeeTypes'
import { devError, isDebugToolsEnabled } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import './Empleados.css'

function Empleados() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [formData, setFormData] = useState<EmployeeFormData>(EMPTY_EMPLOYEE_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
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
      const employeeData = formDataToEmployeePayload(formData)

      if (editingId) {
        await api.updateEmployee(editingId, employeeData)
        showNotification('Empleado actualizado exitosamente', 'success')
      } else {
        await api.createEmployee(employeeData)
        showNotification('Empleado agregado exitosamente', 'success')
      }

      await loadRecords()
      resetForm()
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        editingId
          ? 'Error al actualizar el empleado. Por favor, intenta de nuevo.'
          : 'Error al agregar el empleado. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleEdit = (employee: Employee) => {
    setFormData(employeeToFormData(employee))
    setEditingId(employee.id)
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
      await api.deleteEmployee(id)
      showNotification('Empleado eliminado exitosamente', 'success')
      await loadRecords()
    } catch (err: unknown) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar el empleado. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const highlights = calculateEmployeeHighlights(employees)

  const openEmployeeDetail = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowDetailModal(true)
  }

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide crud-page-content empleados-content">
        <div className="app-toolbar">
          <button
            className="app-toolbar-button"
            onClick={() => navigate('/registros')}
            aria-label={backToHubLabel('registros')}
            type="button"
          >
            <ArrowBackIcon className="app-toolbar-icon" />
          </button>
          <div className="app-toolbar-menu-container" ref={menuRef}>
            {isDebugToolsEnabled() && (
              <>
                <button
                  className="app-toolbar-button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Opciones de depuración"
                  aria-expanded={isMenuOpen}
                  type="button"
                >
                  <MoreVertIcon className="app-toolbar-icon" />
                </button>
                {isMenuOpen && (
                  <div className="crud-dropdown-menu">
                    <button
                      className="crud-dropdown-menu-item"
                      onClick={() => {
                        setIsMenuOpen(false)
                        setIsDebugModalOpen(true)
                      }}
                      type="button"
                    >
                      <span>🐛 Debug</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <h1 className="app-page-title">Empleados</h1>

        <CrudSummaryStrip
          ariaLabel="Resumen de empleados"
          items={employeeSummaryItems(highlights)}
        />

        <button
          type="button"
          className="btn-base btn-accent btn-block btn-submit crud-primary-cta"
          onClick={() => setShowFormModal(true)}
          aria-label="Agregar empleado"
        >
          <AddIcon aria-hidden={true} />
          Agregar empleado
        </button>

        <CrudListPanel
          items={employees}
          isLoading={isLoading}
          error={error}
          onRetry={() => void loadRecords()}
          retryAriaLabel="Reintentar cargar empleados"
          loadingAriaLabel="Cargando empleados"
          emptyIcon={<PersonIcon className="empty-state-icon" />}
          emptyTitle="No hay empleados agregados"
          emptySubtext="Usa el botón de arriba para agregar el primero"
          getItemKey={employee => employee.id}
          renderItem={employee => (
            <EmpleadoListRow
              employee={employee}
              onClick={() => openEmployeeDetail(employee)}
            />
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
            onCancel={resetForm}
          />
        )}

        {showDetailModal && selectedEmployee && (
          <EmpleadoDetailModal
            employee={selectedEmployee}
            onClose={() => setShowDetailModal(false)}
            onEdit={employee => {
              handleEdit(employee)
              setShowDetailModal(false)
            }}
            onDelete={handleDelete}
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
