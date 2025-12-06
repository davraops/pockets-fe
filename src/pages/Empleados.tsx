import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PersonIcon from '@mui/icons-material/Person'
import WorkIcon from '@mui/icons-material/Work'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import HomeIcon from '@mui/icons-material/Home'
import ContactEmergencyIcon from '@mui/icons-material/ContactEmergency'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import EventBusyIcon from '@mui/icons-material/EventBusy'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import './Empleados.css'

interface Employee {
  id: string
  name: string
  data: {
    identification?: string
    position?: string
    salary?: number
    contractType?: string
    startDate?: string
    department?: string
    email?: string
    phone?: string
    address?: string
    emergencyContact?: {
      name?: string
      phone?: string
      relationship?: string
    }
    vacationDaysAvailable?: number
    vacations?: Array<{
      startDate: string
      endDate: string
      days: number
      notes?: string
    }>
    permissions?: Array<{
      date: string
      reason: string
      hours?: number
      notes?: string
    }>
    delays?: Array<{
      date: string
      minutes: number
      reason?: string
      notes?: string
    }>
  }
  created_at?: string
  updated_at?: string
}

interface EmployeeRecord {
  id: string
  name: string
  data: Employee['data']
  created_at: string
  updated_at: string
}

function Empleados() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [formData, setFormData] = useState({
    name: '',
    identification: '',
    position: '',
    salary: '',
    contractType: '',
    startDate: '',
    department: '',
    email: '',
    phone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [records, setRecords] = useState<EmployeeRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isDebugLoading, setIsDebugLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Estados para el formulario de vacaciones/permisos/retrasos
  const [vacationForm, setVacationForm] = useState({
    startDate: '',
    endDate: '',
    notes: '',
  })
  const [permissionForm, setPermissionForm] = useState({
    date: '',
    reason: '',
    hours: '',
    notes: '',
  })
  const [delayForm, setDelayForm] = useState({
    date: '',
    minutes: '',
    reason: '',
    notes: '',
  })
  const [vacationDaysAvailable, setVacationDaysAvailable] = useState('')

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.getEmployees()
      if (response.employees && Array.isArray(response.employees)) {
        setRecords(response.employees)
        
        // Mapear cada empleado individual a la lista
        const mappedEmployees: Employee[] = response.employees.map((record: EmployeeRecord) => ({
          id: record.id,
          name: record.name,
          data: record.data,
          created_at: record.created_at,
          updated_at: record.updated_at,
        }))
        setEmployees(mappedEmployees)
      } else {
        setRecords([])
        setEmployees([])
      }
    } catch (err: any) {
      console.error('Error al cargar empleados:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al cargar empleados. Por favor, intenta de nuevo.'
      )
      setError(errorMessage)
      setRecords([])
      setEmployees([])
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      showNotification('El nombre completo es requerido', 'error')
      return
    }

    if (!formData.identification.trim()) {
      showNotification('El documento de identidad es requerido', 'error')
      return
    }

    try {
      setIsSaving(true)

      const employeeData = {
        name: formData.name.trim(),
        data: {
          identification: formData.identification.trim(),
          position: formData.position.trim() || undefined,
          salary: formData.salary ? parseFloat(formData.salary) : undefined,
          contractType: formData.contractType.trim() || undefined,
          startDate: formData.startDate || undefined,
          department: formData.department.trim() || undefined,
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          address: formData.address.trim() || undefined,
          emergencyContact:
            formData.emergencyContactName.trim() ||
            formData.emergencyContactPhone.trim() ||
            formData.emergencyContactRelationship.trim()
              ? {
                  name: formData.emergencyContactName.trim() || undefined,
                  phone: formData.emergencyContactPhone.trim() || undefined,
                  relationship: formData.emergencyContactRelationship.trim() || undefined,
                }
              : undefined,
        },
      }

      if (editingId) {
        // Editar empleado existente
        await api.updateEmployee(editingId, employeeData)
        showNotification('Empleado actualizado exitosamente', 'success')
        setEditingId(null)
      } else {
        // Agregar nuevo empleado
        await api.createEmployee(employeeData)
        showNotification('Empleado agregado exitosamente', 'success')
      }

      // Recargar empleados desde la API
      await loadRecords()

      // Limpiar formulario y cerrar modal
      setFormData({
        name: '',
        identification: '',
        position: '',
        salary: '',
        contractType: '',
        startDate: '',
        department: '',
        email: '',
        phone: '',
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelationship: '',
      })
      setShowFormModal(false)
    } catch (err: any) {
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

  const handleEdit = (employee: Employee) => {
    setFormData({
      name: employee.name,
      identification: employee.data.identification || '',
      position: employee.data.position || '',
      salary: employee.data.salary ? employee.data.salary.toString() : '',
      contractType: employee.data.contractType || '',
      startDate: employee.data.startDate || '',
      department: employee.data.department || '',
      email: employee.data.email || '',
      phone: employee.data.phone || '',
      address: employee.data.address || '',
      emergencyContactName: employee.data.emergencyContact?.name || '',
      emergencyContactPhone: employee.data.emergencyContact?.phone || '',
      emergencyContactRelationship: employee.data.emergencyContact?.relationship || '',
    })
    setEditingId(employee.id)
    setShowFormModal(true)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({
      name: '',
      identification: '',
      position: '',
      salary: '',
      contractType: '',
      startDate: '',
      department: '',
      email: '',
      phone: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: '',
    })
    setShowFormModal(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el empleado "${name}"?`)) {
      return
    }

    try {
      await api.deleteEmployee(id)
      showNotification('Empleado eliminado exitosamente', 'success')
      await loadRecords()
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar el empleado. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }


  return (
    <div className="app-page-container">
      <div className="app-page-content empleados-content">
        {/* Toolbar */}
        <div className="empleados-toolbar">
          <button
            className="empleados-toolbar-button"
            onClick={() => navigate('/registros')}
            aria-label="Volver"
            type="button"
          >
            <ArrowBackIcon className="empleados-toolbar-icon" />
          </button>
          <div className="empleados-toolbar-menu-container" ref={menuRef}>
            <button
              className="empleados-toolbar-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Opciones"
              aria-expanded={isMenuOpen}
              type="button"
            >
              <MoreVertIcon className="empleados-toolbar-icon" />
            </button>
            {isMenuOpen && (
              <div className="empleados-menu">
                <button
                  className="empleados-menu-item"
                  onClick={() => {
                    setIsMenuOpen(false)
                    setShowFormModal(true)
                  }}
                  type="button"
                >
                  <AddIcon className="empleados-menu-icon" />
                  <span>Agregar Empleado</span>
                </button>
                {process.env.NODE_ENV === 'development' && (
                  <button
                    className="empleados-menu-item"
                    onClick={() => {
                      setIsMenuOpen(false)
                      setIsDebugModalOpen(true)
                    }}
                    type="button"
                  >
                    <span>🐛 Debug</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <h1 className="empleados-page-title">Empleados</h1>
        <p className="empleados-page-subtitle">
          Gestiona la información de tus empleados: salario, tipo de contrato, fecha de contratación y más
        </p>

        {/* Estado de carga */}
        {isLoading ? (
          <div className="empleados-empty-state">
            <p className="empty-state-text">Cargando empleados...</p>
          </div>
        ) : error ? (
          <div className="empleados-empty-state">
            <p className="empty-state-text">{error}</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="empleados-empty-state">
            <p className="empty-state-text">No hay empleados agregados</p>
            <p className="empty-state-subtext">Agrega tu primer empleado usando el botón del menú</p>
          </div>
        ) : (
          <div className="empleados-list-section">
            <h2 className="empleados-section-title">
              Empleados ({employees.length})
            </h2>
            <div className="empleados-list">
              {employees.map(employee => (
                <div 
                  key={employee.id} 
                  className="empleados-item"
                  onClick={() => {
                    setSelectedEmployee(employee)
                    setShowDetailModal(true)
                    setVacationDaysAvailable(employee.data.vacationDaysAvailable?.toString() || '')
                  }}
                >
                  <div className="empleados-item-content">
                    <div className="empleados-item-header">
                      <h3 className="empleados-item-name">{employee.name}</h3>
                      {employee.data.salary && (
                        <span className="empleados-item-salary">
                          ${employee.data.salary.toLocaleString('es-CO')}
                        </span>
                      )}
                    </div>
                    <div className="empleados-item-meta">
                      {employee.data.identification && (
                        <>
                          <span className="empleados-item-meta-item">
                            <strong>ID:</strong> {employee.data.identification}
                          </span>
                        </>
                      )}
                      {employee.data.position && (
                        <>
                          {employee.data.identification && <span className="empleados-item-separator">•</span>}
                          <span className="empleados-item-meta-item">
                            <WorkIcon className="empleados-item-meta-icon" />
                            {employee.data.position}
                          </span>
                        </>
                      )}
                      {employee.data.department && (
                        <>
                          <span className="empleados-item-separator">•</span>
                          <span className="empleados-item-meta-item">
                            {employee.data.department}
                          </span>
                        </>
                      )}
                      {employee.data.contractType && (
                        <>
                          <span className="empleados-item-separator">•</span>
                          <span className="empleados-item-meta-item">
                            {employee.data.contractType}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="empleados-item-details">
                      {employee.data.email && (
                        <div className="empleados-item-detail">
                          <EmailIcon className="empleados-item-detail-icon" />
                          <span>{employee.data.email}</span>
                        </div>
                      )}
                      {employee.data.phone && (
                        <div className="empleados-item-detail">
                          <PhoneIcon className="empleados-item-detail-icon" />
                          <span>{employee.data.phone}</span>
                        </div>
                      )}
                      {employee.data.startDate && (
                        <div className="empleados-item-detail">
                          <CalendarTodayIcon className="empleados-item-detail-icon" />
                          <span>Contratado: {new Date(employee.data.startDate).toLocaleDateString('es-CO')}</span>
                        </div>
                      )}
                      {employee.data.vacationDaysAvailable !== undefined && employee.data.vacationDaysAvailable !== null && (
                        <div className="empleados-item-detail">
                          <EventAvailableIcon className="empleados-item-detail-icon" />
                          <span>{employee.data.vacationDaysAvailable} días de vacaciones disponibles</span>
                        </div>
                      )}
                    </div>
                    <div className="empleados-item-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(employee)}
                        className="empleados-item-action-button"
                        aria-label="Editar empleado"
                        type="button"
                      >
                        <EditIcon className="empleados-item-action-icon" />
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id, employee.name)}
                        className="empleados-item-action-button empleados-item-action-button-danger"
                        aria-label="Eliminar empleado"
                        type="button"
                      >
                        <DeleteIcon className="empleados-item-action-icon" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal de Formulario */}
        {showFormModal && (
          <div className="empleados-modal-overlay" onClick={() => handleCancelEdit()}>
            <div className="empleados-modal empleados-modal-large" onClick={e => e.stopPropagation()}>
              <div className="empleados-modal-header">
                <h2 className="empleados-modal-title">
                  {editingId ? 'Editar Empleado' : 'Agregar Empleado'}
                </h2>
                <button
                  className="empleados-modal-close"
                  onClick={() => handleCancelEdit()}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="empleados-modal-content">
                <form onSubmit={handleSubmit} className="empleados-form">
            <div className="empleados-form-group">
              <label htmlFor="name" className="empleados-form-label">
                <PersonIcon className="empleados-label-icon" />
                Nombre Completo *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="empleados-form-input"
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>

            <div className="empleados-form-row">
              <div className="empleados-form-group">
                <label htmlFor="identification" className="empleados-form-label">
                  Documento de Identidad *
                </label>
                <input
                  type="text"
                  id="identification"
                  name="identification"
                  value={formData.identification}
                  onChange={handleChange}
                  className="empleados-form-input"
                  placeholder="Ej: 1234567890"
                  required
                />
              </div>

              <div className="empleados-form-group">
                <label htmlFor="contractType" className="empleados-form-label">
                  Tipo de Contrato
                </label>
                <select
                  id="contractType"
                  name="contractType"
                  value={formData.contractType}
                  onChange={handleChange}
                  className="empleados-form-input"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Indefinido">Indefinido</option>
                  <option value="Término Fijo">Término Fijo</option>
                  <option value="Término Fijo a Prueba">Término Fijo a Prueba</option>
                  <option value="Obra o Labor">Obra o Labor</option>
                  <option value="Prestación de Servicios">Prestación de Servicios</option>
                  <option value="Aprendizaje">Aprendizaje</option>
                </select>
              </div>
            </div>

            <div className="empleados-form-row">
              <div className="empleados-form-group">
                <label htmlFor="startDate" className="empleados-form-label">
                  Fecha de Contratación
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="empleados-form-input"
                />
              </div>

              <div className="empleados-form-group">
                <label htmlFor="salary" className="empleados-form-label">
                  <AttachMoneyIcon className="empleados-label-icon" />
                  Salario
                </label>
                <input
                  type="number"
                  id="salary"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  className="empleados-form-input"
                  placeholder="0"
                  min="0"
                  step="1000"
                />
              </div>
            </div>

            <div className="empleados-form-row">
              <div className="empleados-form-group">
                <label htmlFor="position" className="empleados-form-label">
                  <WorkIcon className="empleados-label-icon" />
                  Cargo/Posición
                </label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="empleados-form-input"
                  placeholder="Ej: Desarrollador Senior"
                />
              </div>

              <div className="empleados-form-group">
                <label htmlFor="department" className="empleados-form-label">
                  Departamento
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="empleados-form-input"
                  placeholder="Ej: Tecnología"
                />
              </div>
            </div>

            <div className="empleados-form-row">
              <div className="empleados-form-group">
                <label htmlFor="email" className="empleados-form-label">
                  <EmailIcon className="empleados-label-icon" />
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="empleados-form-input"
                  placeholder="ejemplo@empresa.com"
                />
              </div>

              <div className="empleados-form-group">
                <label htmlFor="phone" className="empleados-form-label">
                  <PhoneIcon className="empleados-label-icon" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="empleados-form-input"
                  placeholder="+57 300 123 4567"
                />
              </div>
            </div>

            <div className="empleados-form-group">
              <label htmlFor="address" className="empleados-form-label">
                <HomeIcon className="empleados-label-icon" />
                Dirección
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="empleados-form-input"
                placeholder="Ej: Calle 123 #45-67"
              />
            </div>

            <div className="empleados-form-section-divider">
              <h3 className="empleados-form-subsection-title">
                <ContactEmergencyIcon className="empleados-label-icon" />
                Contacto de Emergencia
              </h3>
            </div>

            <div className="empleados-form-row">
              <div className="empleados-form-group">
                <label htmlFor="emergencyContactName" className="empleados-form-label">
                  Nombre
                </label>
                <input
                  type="text"
                  id="emergencyContactName"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  className="empleados-form-input"
                  placeholder="Ej: María Pérez"
                />
              </div>

              <div className="empleados-form-group">
                <label htmlFor="emergencyContactPhone" className="empleados-form-label">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="emergencyContactPhone"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  className="empleados-form-input"
                  placeholder="+57 300 987 6543"
                />
              </div>

              <div className="empleados-form-group">
                <label htmlFor="emergencyContactRelationship" className="empleados-form-label">
                  Relación
                </label>
                <input
                  type="text"
                  id="emergencyContactRelationship"
                  name="emergencyContactRelationship"
                  value={formData.emergencyContactRelationship}
                  onChange={handleChange}
                  className="empleados-form-input"
                  placeholder="Ej: Esposa, Padre, etc."
                />
              </div>
            </div>

                  <div className="empleados-form-actions">
                    <button
                      type="button"
                      className="empleados-form-button empleados-form-button-secondary"
                      onClick={handleCancelEdit}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="empleados-form-button empleados-form-button-primary"
                    >
                      {editingId ? 'Actualizar' : 'Agregar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Detalle */}
        {showDetailModal && selectedEmployee && (
          <div className="empleados-modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="empleados-modal empleados-modal-large" onClick={e => e.stopPropagation()}>
              <div className="empleados-modal-header">
                <h2 className="empleados-modal-title">Detalle del Empleado</h2>
                <button
                  className="empleados-modal-close"
                  onClick={() => setShowDetailModal(false)}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="empleados-modal-content">
                {/* Información Básica */}
                <div className="empleados-detail-section">
                  <h3 className="empleados-detail-section-title">Información Básica</h3>
                  <div className="empleados-detail-grid">
                    <div className="empleados-detail-item">
                      <span className="empleados-detail-label">Nombre:</span>
                      <span className="empleados-detail-value">{selectedEmployee.name}</span>
                    </div>
                    {selectedEmployee.data.identification && (
                      <div className="empleados-detail-item">
                        <span className="empleados-detail-label">Documento:</span>
                        <span className="empleados-detail-value">{selectedEmployee.data.identification}</span>
                      </div>
                    )}
                    {selectedEmployee.data.position && (
                      <div className="empleados-detail-item">
                        <span className="empleados-detail-label">Cargo:</span>
                        <span className="empleados-detail-value">{selectedEmployee.data.position}</span>
                      </div>
                    )}
                    {selectedEmployee.data.department && (
                      <div className="empleados-detail-item">
                        <span className="empleados-detail-label">Departamento:</span>
                        <span className="empleados-detail-value">{selectedEmployee.data.department}</span>
                      </div>
                    )}
                    {selectedEmployee.data.contractType && (
                      <div className="empleados-detail-item">
                        <span className="empleados-detail-label">Tipo de Contrato:</span>
                        <span className="empleados-detail-value">{selectedEmployee.data.contractType}</span>
                      </div>
                    )}
                    {selectedEmployee.data.salary && (
                      <div className="empleados-detail-item">
                        <span className="empleados-detail-label">Salario:</span>
                        <span className="empleados-detail-value">
                          ${selectedEmployee.data.salary.toLocaleString('es-CO')}
                        </span>
                      </div>
                    )}
                    {selectedEmployee.data.startDate && (
                      <div className="empleados-detail-item">
                        <span className="empleados-detail-label">Fecha de Contratación:</span>
                        <span className="empleados-detail-value">
                          {new Date(selectedEmployee.data.startDate).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                    )}
                    {selectedEmployee.data.email && (
                      <div className="empleados-detail-item">
                        <span className="empleados-detail-label">Email:</span>
                        <span className="empleados-detail-value">{selectedEmployee.data.email}</span>
                      </div>
                    )}
                    {selectedEmployee.data.phone && (
                      <div className="empleados-detail-item">
                        <span className="empleados-detail-label">Teléfono:</span>
                        <span className="empleados-detail-value">{selectedEmployee.data.phone}</span>
                      </div>
                    )}
                    {selectedEmployee.data.address && (
                      <div className="empleados-detail-item">
                        <span className="empleados-detail-label">Dirección:</span>
                        <span className="empleados-detail-value">{selectedEmployee.data.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vacaciones Disponibles */}
                <div className="empleados-detail-section">
                  <h3 className="empleados-detail-section-title">
                    <EventAvailableIcon className="empleados-detail-section-icon" />
                    Vacaciones Disponibles
                  </h3>
                  <div className="empleados-detail-form-group">
                    <label className="empleados-form-label">
                      Días Disponibles
                    </label>
                    <input
                      type="number"
                      value={vacationDaysAvailable}
                      onChange={(e) => setVacationDaysAvailable(e.target.value)}
                      className="empleados-form-input"
                      min="0"
                      placeholder="0"
                    />
                    <button
                      type="button"
                      className="empleados-form-button empleados-form-button-primary"
                      onClick={async () => {
                        try {
                          await api.updateEmployee(selectedEmployee.id, {
                            data: {
                              ...selectedEmployee.data,
                              vacationDaysAvailable: vacationDaysAvailable ? parseInt(vacationDaysAvailable) : undefined,
                            },
                          })
                          showNotification('Vacaciones disponibles actualizadas', 'success')
                          await loadRecords()
                          const updated = employees.find(e => e.id === selectedEmployee.id)
                          if (updated) {
                            setSelectedEmployee(updated)
                            setVacationDaysAvailable(updated.data.vacationDaysAvailable?.toString() || '')
                          }
                        } catch (err: any) {
                          const errorMessage = getTranslatedErrorMessage(
                            err,
                            'Error al actualizar vacaciones. Por favor, intenta de nuevo.'
                          )
                          showNotification(errorMessage, 'error')
                        }
                      }}
                    >
                      Guardar
                    </button>
                  </div>
                </div>

                {/* Vacaciones Tomadas */}
                <div className="empleados-detail-section">
                  <h3 className="empleados-detail-section-title">
                    <EventAvailableIcon className="empleados-detail-section-icon" />
                    Vacaciones Tomadas
                  </h3>
                  <div className="empleados-detail-form-group">
                    <div className="empleados-form-row">
                      <div className="empleados-form-group">
                        <label className="empleados-form-label">Fecha Inicio</label>
                        <input
                          type="date"
                          value={vacationForm.startDate}
                          onChange={(e) => setVacationForm(prev => ({ ...prev, startDate: e.target.value }))}
                          className="empleados-form-input"
                        />
                      </div>
                      <div className="empleados-form-group">
                        <label className="empleados-form-label">Fecha Fin</label>
                        <input
                          type="date"
                          value={vacationForm.endDate}
                          onChange={(e) => setVacationForm(prev => ({ ...prev, endDate: e.target.value }))}
                          className="empleados-form-input"
                        />
                      </div>
                    </div>
                    <div className="empleados-form-group">
                      <label className="empleados-form-label">Notas</label>
                      <input
                        type="text"
                        value={vacationForm.notes}
                        onChange={(e) => setVacationForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="empleados-form-input"
                        placeholder="Notas opcionales"
                      />
                    </div>
                    <button
                      type="button"
                      className="empleados-form-button empleados-form-button-primary"
                      onClick={async () => {
                        if (!vacationForm.startDate || !vacationForm.endDate) {
                          showNotification('Debes ingresar fecha de inicio y fin', 'error')
                          return
                        }
                        try {
                          const start = new Date(vacationForm.startDate)
                          const end = new Date(vacationForm.endDate)
                          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                          
                          const vacations = selectedEmployee.data.vacations || []
                          const newVacations = [...vacations, {
                            startDate: vacationForm.startDate,
                            endDate: vacationForm.endDate,
                            days,
                            notes: vacationForm.notes || undefined,
                          }]

                          await api.updateEmployee(selectedEmployee.id, {
                            data: {
                              ...selectedEmployee.data,
                              vacations: newVacations,
                              vacationDaysAvailable: (selectedEmployee.data.vacationDaysAvailable || 0) - days,
                            },
                          })
                          showNotification('Vacaciones registradas exitosamente', 'success')
                          setVacationForm({ startDate: '', endDate: '', notes: '' })
                          await loadRecords()
                          const updated = employees.find(e => e.id === selectedEmployee.id)
                          if (updated) {
                            setSelectedEmployee(updated)
                            setVacationDaysAvailable(updated.data.vacationDaysAvailable?.toString() || '')
                          }
                        } catch (err: any) {
                          const errorMessage = getTranslatedErrorMessage(
                            err,
                            'Error al registrar vacaciones. Por favor, intenta de nuevo.'
                          )
                          showNotification(errorMessage, 'error')
                        }
                      }}
                    >
                      Agregar Vacaciones
                    </button>
                  </div>
                  {selectedEmployee.data.vacations && selectedEmployee.data.vacations.length > 0 && (
                    <div className="empleados-detail-list">
                      {selectedEmployee.data.vacations.map((vacation, index) => (
                        <div key={index} className="empleados-detail-list-item">
                          <div className="empleados-detail-list-item-content">
                            <CalendarTodayIcon className="empleados-detail-list-item-icon" />
                            <div>
                              <span className="empleados-detail-list-item-date">
                                {new Date(vacation.startDate).toLocaleDateString('es-CO')} - {new Date(vacation.endDate).toLocaleDateString('es-CO')}
                              </span>
                              <span className="empleados-detail-list-item-days">{vacation.days} días</span>
                              {vacation.notes && (
                                <span className="empleados-detail-list-item-notes">{vacation.notes}</span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="empleados-detail-list-item-delete"
                            onClick={async () => {
                              try {
                                const vacations = selectedEmployee.data.vacations || []
                                const updatedVacations = vacations.filter((_, i) => i !== index)
                                const daysToRestore = vacation.days

                                await api.updateEmployee(selectedEmployee.id, {
                                  data: {
                                    ...selectedEmployee.data,
                                    vacations: updatedVacations,
                                    vacationDaysAvailable: (selectedEmployee.data.vacationDaysAvailable || 0) + daysToRestore,
                                  },
                                })
                                showNotification('Vacaciones eliminadas', 'success')
                                await loadRecords()
                                const updated = employees.find(e => e.id === selectedEmployee.id)
                                if (updated) {
                                  setSelectedEmployee(updated)
                                  setVacationDaysAvailable(updated.data.vacationDaysAvailable?.toString() || '')
                                }
                              } catch (err: any) {
                                const errorMessage = getTranslatedErrorMessage(
                                  err,
                                  'Error al eliminar vacaciones. Por favor, intenta de nuevo.'
                                )
                                showNotification(errorMessage, 'error')
                              }
                            }}
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Permisos */}
                <div className="empleados-detail-section">
                  <h3 className="empleados-detail-section-title">
                    <EventBusyIcon className="empleados-detail-section-icon" />
                    Permisos
                  </h3>
                  <div className="empleados-detail-form-group">
                    <div className="empleados-form-row">
                      <div className="empleados-form-group">
                        <label className="empleados-form-label">Fecha</label>
                        <input
                          type="date"
                          value={permissionForm.date}
                          onChange={(e) => setPermissionForm(prev => ({ ...prev, date: e.target.value }))}
                          className="empleados-form-input"
                        />
                      </div>
                      <div className="empleados-form-group">
                        <label className="empleados-form-label">Horas</label>
                        <input
                          type="number"
                          value={permissionForm.hours}
                          onChange={(e) => setPermissionForm(prev => ({ ...prev, hours: e.target.value }))}
                          className="empleados-form-input"
                          min="0"
                          step="0.5"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="empleados-form-group">
                      <label className="empleados-form-label">Razón</label>
                      <input
                        type="text"
                        value={permissionForm.reason}
                        onChange={(e) => setPermissionForm(prev => ({ ...prev, reason: e.target.value }))}
                        className="empleados-form-input"
                        placeholder="Razón del permiso"
                      />
                    </div>
                    <div className="empleados-form-group">
                      <label className="empleados-form-label">Notas</label>
                      <input
                        type="text"
                        value={permissionForm.notes}
                        onChange={(e) => setPermissionForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="empleados-form-input"
                        placeholder="Notas opcionales"
                      />
                    </div>
                    <button
                      type="button"
                      className="empleados-form-button empleados-form-button-primary"
                      onClick={async () => {
                        if (!permissionForm.date || !permissionForm.reason) {
                          showNotification('Debes ingresar fecha y razón', 'error')
                          return
                        }
                        try {
                          const permissions = selectedEmployee.data.permissions || []
                          const newPermissions = [...permissions, {
                            date: permissionForm.date,
                            reason: permissionForm.reason,
                            hours: permissionForm.hours ? parseFloat(permissionForm.hours) : undefined,
                            notes: permissionForm.notes || undefined,
                          }]

                          await api.updateEmployee(selectedEmployee.id, {
                            data: {
                              ...selectedEmployee.data,
                              permissions: newPermissions,
                            },
                          })
                          showNotification('Permiso registrado exitosamente', 'success')
                          setPermissionForm({ date: '', reason: '', hours: '', notes: '' })
                          await loadRecords()
                          const updated = employees.find(e => e.id === selectedEmployee.id)
                          if (updated) {
                            setSelectedEmployee(updated)
                          }
                        } catch (err: any) {
                          const errorMessage = getTranslatedErrorMessage(
                            err,
                            'Error al registrar permiso. Por favor, intenta de nuevo.'
                          )
                          showNotification(errorMessage, 'error')
                        }
                      }}
                    >
                      Agregar Permiso
                    </button>
                  </div>
                  {selectedEmployee.data.permissions && selectedEmployee.data.permissions.length > 0 && (
                    <div className="empleados-detail-list">
                      {selectedEmployee.data.permissions.map((permission, index) => (
                        <div key={index} className="empleados-detail-list-item">
                          <div className="empleados-detail-list-item-content">
                            <CalendarTodayIcon className="empleados-detail-list-item-icon" />
                            <div>
                              <span className="empleados-detail-list-item-date">
                                {new Date(permission.date).toLocaleDateString('es-CO')}
                              </span>
                              <span className="empleados-detail-list-item-reason">{permission.reason}</span>
                              {permission.hours && (
                                <span className="empleados-detail-list-item-hours">{permission.hours} horas</span>
                              )}
                              {permission.notes && (
                                <span className="empleados-detail-list-item-notes">{permission.notes}</span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="empleados-detail-list-item-delete"
                            onClick={async () => {
                              try {
                                const permissions = selectedEmployee.data.permissions || []
                                const updatedPermissions = permissions.filter((_, i) => i !== index)

                                await api.updateEmployee(selectedEmployee.id, {
                                  data: {
                                    ...selectedEmployee.data,
                                    permissions: updatedPermissions,
                                  },
                                })
                                showNotification('Permiso eliminado', 'success')
                                await loadRecords()
                                const updated = employees.find(e => e.id === selectedEmployee.id)
                                if (updated) {
                                  setSelectedEmployee(updated)
                                }
                              } catch (err: any) {
                                const errorMessage = getTranslatedErrorMessage(
                                  err,
                                  'Error al eliminar permiso. Por favor, intenta de nuevo.'
                                )
                                showNotification(errorMessage, 'error')
                              }
                            }}
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Retrasos */}
                <div className="empleados-detail-section">
                  <h3 className="empleados-detail-section-title">
                    <EventBusyIcon className="empleados-detail-section-icon" />
                    Retrasos
                  </h3>
                  <div className="empleados-detail-form-group">
                    <div className="empleados-form-row">
                      <div className="empleados-form-group">
                        <label className="empleados-form-label">Fecha</label>
                        <input
                          type="date"
                          value={delayForm.date}
                          onChange={(e) => setDelayForm(prev => ({ ...prev, date: e.target.value }))}
                          className="empleados-form-input"
                        />
                      </div>
                      <div className="empleados-form-group">
                        <label className="empleados-form-label">Minutos de Retraso</label>
                        <input
                          type="number"
                          value={delayForm.minutes}
                          onChange={(e) => setDelayForm(prev => ({ ...prev, minutes: e.target.value }))}
                          className="empleados-form-input"
                          min="1"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="empleados-form-group">
                      <label className="empleados-form-label">Razón (Opcional)</label>
                      <input
                        type="text"
                        value={delayForm.reason}
                        onChange={(e) => setDelayForm(prev => ({ ...prev, reason: e.target.value }))}
                        className="empleados-form-input"
                        placeholder="Razón del retraso"
                      />
                    </div>
                    <div className="empleados-form-group">
                      <label className="empleados-form-label">Notas</label>
                      <input
                        type="text"
                        value={delayForm.notes}
                        onChange={(e) => setDelayForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="empleados-form-input"
                        placeholder="Notas opcionales"
                      />
                    </div>
                    <button
                      type="button"
                      className="empleados-form-button empleados-form-button-primary"
                      onClick={async () => {
                        if (!delayForm.date || !delayForm.minutes) {
                          showNotification('Debes ingresar fecha y minutos de retraso', 'error')
                          return
                        }
                        try {
                          const delays = selectedEmployee.data.delays || []
                          const newDelays = [...delays, {
                            date: delayForm.date,
                            minutes: parseInt(delayForm.minutes),
                            reason: delayForm.reason || undefined,
                            notes: delayForm.notes || undefined,
                          }]

                          await api.updateEmployee(selectedEmployee.id, {
                            data: {
                              ...selectedEmployee.data,
                              delays: newDelays,
                            },
                          })
                          showNotification('Retraso registrado exitosamente', 'success')
                          setDelayForm({ date: '', minutes: '', reason: '', notes: '' })
                          await loadRecords()
                          const updated = employees.find(e => e.id === selectedEmployee.id)
                          if (updated) {
                            setSelectedEmployee(updated)
                          }
                        } catch (err: any) {
                          const errorMessage = getTranslatedErrorMessage(
                            err,
                            'Error al registrar retraso. Por favor, intenta de nuevo.'
                          )
                          showNotification(errorMessage, 'error')
                        }
                      }}
                    >
                      Agregar Retraso
                    </button>
                  </div>
                  {selectedEmployee.data.delays && selectedEmployee.data.delays.length > 0 && (
                    <div className="empleados-detail-list">
                      {selectedEmployee.data.delays.map((delay, index) => (
                        <div key={index} className="empleados-detail-list-item">
                          <div className="empleados-detail-list-item-content">
                            <CalendarTodayIcon className="empleados-detail-list-item-icon" />
                            <div>
                              <span className="empleados-detail-list-item-date">
                                {new Date(delay.date).toLocaleDateString('es-CO')}
                              </span>
                              <span className="empleados-detail-list-item-hours">{delay.minutes} minutos</span>
                              {delay.reason && (
                                <span className="empleados-detail-list-item-reason">{delay.reason}</span>
                              )}
                              {delay.notes && (
                                <span className="empleados-detail-list-item-notes">{delay.notes}</span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="empleados-detail-list-item-delete"
                            onClick={async () => {
                              try {
                                const delays = selectedEmployee.data.delays || []
                                const updatedDelays = delays.filter((_, i) => i !== index)

                                await api.updateEmployee(selectedEmployee.id, {
                                  data: {
                                    ...selectedEmployee.data,
                                    delays: updatedDelays,
                                  },
                                })
                                showNotification('Retraso eliminado', 'success')
                                await loadRecords()
                                const updated = employees.find(e => e.id === selectedEmployee.id)
                                if (updated) {
                                  setSelectedEmployee(updated)
                                }
                              } catch (err: any) {
                                const errorMessage = getTranslatedErrorMessage(
                                  err,
                                  'Error al eliminar retraso. Por favor, intenta de nuevo.'
                                )
                                showNotification(errorMessage, 'error')
                              }
                            }}
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Debug */}
        {isDebugModalOpen && (
          <div className="empleados-modal-overlay" onClick={() => setIsDebugModalOpen(false)}>
            <div className="empleados-modal" onClick={e => e.stopPropagation()}>
              <div className="empleados-modal-header">
                <h2 className="empleados-modal-title">🐛 Debug - Empleados</h2>
                <button
                  className="empleados-modal-close"
                  onClick={() => setIsDebugModalOpen(false)}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="empleados-modal-content">
                <div className="debug-options">
                  <button
                    className="debug-option-button create-demo"
                    onClick={async () => {
                      try {
                        setIsDebugLoading(true)
                        const demoEmployees = [
                          {
                            name: 'Juan Pérez',
                            data: {
                              identification: '1234567890',
                              position: 'Desarrollador Senior',
                              salary: 5000000,
                              contractType: 'Tiempo Completo',
                              startDate: '2023-01-15',
                              department: 'Tecnología',
                              email: 'juan.perez@empresa.com',
                              phone: '+57 300 123 4567',
                              address: 'Calle 123 #45-67, Bogotá',
                              emergencyContact: {
                                name: 'María Pérez',
                                phone: '+57 300 987 6543',
                                relationship: 'Esposa',
                              },
                              vacationDaysAvailable: 8,
                              vacations: [
                                {
                                  startDate: '2024-01-15',
                                  endDate: '2024-01-19',
                                  days: 5,
                                  notes: 'Vacaciones de inicio de año',
                                },
                                {
                                  startDate: '2024-06-10',
                                  endDate: '2024-06-12',
                                  days: 3,
                                  notes: 'Puente festivo',
                                },
                              ],
                              permissions: [
                                {
                                  date: '2024-02-14',
                                  reason: 'Cita médica',
                                  hours: 2,
                                  notes: 'Control de rutina',
                                },
                                {
                                  date: '2024-03-20',
                                  reason: 'Trámite personal',
                                  hours: 4,
                                },
                              ],
                            },
                          },
                          {
                            name: 'Ana García',
                            data: {
                              identification: '0987654321',
                              position: 'Diseñadora UX',
                              salary: 4500000,
                              contractType: 'Tiempo Completo',
                              startDate: '2023-03-20',
                              department: 'Diseño',
                              email: 'ana.garcia@empresa.com',
                              phone: '+57 300 555 1234',
                              address: 'Carrera 78 #12-34, Medellín',
                              emergencyContact: {
                                name: 'Carlos García',
                                phone: '+57 300 555 5678',
                                relationship: 'Hermano',
                              },
                              vacationDaysAvailable: 12,
                              vacations: [
                                {
                                  startDate: '2024-07-01',
                                  endDate: '2024-07-10',
                                  days: 10,
                                  notes: 'Vacaciones de verano',
                                },
                              ],
                              permissions: [
                                {
                                  date: '2024-04-15',
                                  reason: 'Cita odontológica',
                                  hours: 3,
                                },
                                {
                                  date: '2024-05-20',
                                  reason: 'Asunto familiar',
                                  hours: 1.5,
                                  notes: 'Reunión escolar',
                                },
                                {
                                  date: '2024-08-10',
                                  reason: 'Trámite bancario',
                                  hours: 2,
                                },
                              ],
                            },
                          },
                          {
                            name: 'Luis Rodríguez',
                            data: {
                              identification: '1122334455',
                              position: 'Gerente de Proyectos',
                              salary: 6000000,
                              contractType: 'Tiempo Completo',
                              startDate: '2022-11-10',
                              department: 'Operaciones',
                              email: 'luis.rodriguez@empresa.com',
                              phone: '+57 300 777 8888',
                              address: 'Avenida 56 #78-90, Cali',
                              emergencyContact: {
                                name: 'Laura Rodríguez',
                                phone: '+57 300 777 9999',
                                relationship: 'Madre',
                              },
                              vacationDaysAvailable: 15,
                              vacations: [
                                {
                                  startDate: '2024-12-20',
                                  endDate: '2024-12-31',
                                  days: 12,
                                  notes: 'Vacaciones de fin de año',
                                },
                              ],
                              permissions: [
                                {
                                  date: '2024-01-10',
                                  reason: 'Reunión médica',
                                  hours: 4,
                                  notes: 'Especialista',
                                },
                              ],
                            },
                          },
                        ]

                        // Guardar cada empleado en la API
                        for (const emp of demoEmployees) {
                          await api.createEmployee({
                            name: emp.name,
                            data: emp.data,
                          })
                        }

                        showNotification(`${demoEmployees.length} empleados demo creados exitosamente`, 'success')
                        await loadRecords()
                        setIsDebugModalOpen(false)
                      } catch (err: any) {
                        const errorMessage = getTranslatedErrorMessage(
                          err,
                          'Error al crear los empleados demo. Por favor, intenta de nuevo.'
                        )
                        showNotification(errorMessage, 'error')
                      } finally {
                        setIsDebugLoading(false)
                      }
                    }}
                    disabled={isDebugLoading}
                    type="button"
                  >
                    <span className="debug-option-icon">📦</span>
                    <div className="debug-option-info">
                      <h3 className="debug-option-title">Crear Empleados Demo</h3>
                      <p className="debug-option-description">
                        Crea 3 empleados de ejemplo con diferentes configuraciones
                      </p>
                    </div>
                  </button>
                  <button
                    className="debug-option-button delete-all"
                    onClick={async () => {
                      if (
                        !window.confirm(
                          '¿Estás seguro de que quieres eliminar TODOS los registros de empleados? Esta acción es irreversible.'
                        )
                      ) {
                        return
                      }

                      try {
                        setIsDebugLoading(true)
                        await api.deleteAllEmployees()
                        showNotification('Todos los registros de empleados han sido eliminados', 'success')
                        await loadRecords()
                        setEmployees([])
                        setIsDebugModalOpen(false)
                      } catch (err: any) {
                        const errorMessage = getTranslatedErrorMessage(
                          err,
                          'Error al eliminar los registros. Por favor, intenta de nuevo.'
                        )
                        showNotification(errorMessage, 'error')
                      } finally {
                        setIsDebugLoading(false)
                      }
                    }}
                    disabled={isDebugLoading}
                    type="button"
                  >
                    <span className="debug-option-icon">🗑️</span>
                    <div className="debug-option-info">
                      <h3 className="debug-option-title">Eliminar Todos los Registros</h3>
                      <p className="debug-option-description">
                        Elimina todos los registros de empleados guardados (irreversible)
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default Empleados

