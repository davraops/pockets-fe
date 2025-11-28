import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import FolderIcon from '@mui/icons-material/Folder'
import PersonIcon from '@mui/icons-material/Person'
import WorkIcon from '@mui/icons-material/Work'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import HomeIcon from '@mui/icons-material/Home'
import ContactEmergencyIcon from '@mui/icons-material/ContactEmergency'
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
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)
  const [showRecordsModal, setShowRecordsModal] = useState(false)
  const [listName, setListName] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    try {
      setIsLoadingRecords(true)
      const response = await api.getEmployees()
      if (response.employees && Array.isArray(response.employees)) {
        setRecords(response.employees)
      }
    } catch (err: any) {
      console.error('Error al cargar registros de empleados:', err)
    } finally {
      setIsLoadingRecords(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      showNotification('El nombre completo es requerido', 'error')
      return
    }

    if (!formData.identification.trim()) {
      showNotification('El documento de identidad es requerido', 'error')
      return
    }

    if (editingId) {
      // Editar empleado existente
      const updatedEmployee: Employee = {
        id: editingId,
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
      setEmployees(prev =>
        prev.map(emp => (emp.id === editingId ? updatedEmployee : emp))
      )
      setEditingId(null)
      showNotification('Empleado actualizado', 'success')
    } else {
      // Agregar nuevo empleado
      const newEmployee: Employee = {
        id: Date.now().toString(),
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
      setEmployees(prev => [...prev, newEmployee])
      showNotification('Empleado agregado', 'success')
    }

    // Limpiar formulario
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
  }

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este empleado?')) {
      setEmployees(prev => prev.filter(emp => emp.id !== id))
      showNotification('Empleado eliminado', 'success')
    }
  }

  const handleSaveClick = () => {
    if (employees.length === 0) {
      showNotification('Debes agregar al menos un empleado antes de guardar', 'error')
      return
    }
    setShowSaveModal(true)
  }

  const handleSaveRecord = async () => {
    if (!listName.trim()) {
      showNotification('El nombre de la lista es requerido', 'error')
      return
    }

    if (employees.length === 0) {
      showNotification('Debes agregar al menos un empleado antes de guardar', 'error')
      return
    }

    try {
      setIsSaving(true)

      // Guardar toda la lista de empleados en un solo registro
      const employeeListData = {
        name: listName.trim(),
        data: {
          employees: employees.map(emp => ({
            name: emp.name,
            data: emp.data,
          })),
          created_at: new Date().toISOString(),
        },
      }

      await api.createEmployee(employeeListData)

      showNotification('Lista de empleados guardada exitosamente', 'success')

      // Recargar lista de registros
      await loadRecords()

      // Cerrar modal y limpiar
      setShowSaveModal(false)
      setListName('')
      // Limpiar después de guardar (opcional)
      // setEmployees([])
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al guardar la lista. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLoadRecord = async (record: EmployeeRecord) => {
    try {
      const response = await api.getEmployees(record.id)
      if (response.employees && response.employees.length > 0) {
        const employeeRecord = response.employees[0]
        
        // Verificar si el registro tiene una lista de empleados
        if (employeeRecord.data && employeeRecord.data.employees && Array.isArray(employeeRecord.data.employees)) {
          // Cargar la lista completa de empleados
          const loadedEmployees: Employee[] = employeeRecord.data.employees.map((emp: any, index: number) => ({
            id: Date.now().toString() + index.toString(),
            name: emp.name || '',
            data: emp.data || {},
          }))
          setEmployees(loadedEmployees)
          setListName(employeeRecord.name)
        } else {
          // Formato antiguo: un solo empleado
          const loadedEmployee: Employee = {
            id: employeeRecord.id,
            name: employeeRecord.name,
            data: employeeRecord.data || {},
          }
          setEmployees([loadedEmployee])
          setListName(employeeRecord.name)
        }
        
        setShowRecordsModal(false)
        showNotification(`Lista "${record.name}" cargada`, 'success')
      } else {
        showNotification('El registro no tiene datos válidos', 'error')
      }
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al cargar el registro. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleDeleteRecord = async (recordId: string, recordName: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el registro "${recordName}"?`)) {
      return
    }

    try {
      await api.deleteEmployee(recordId)
      showNotification('Registro eliminado', 'success')
      await loadRecords()
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar el registro. Por favor, intenta de nuevo.'
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
          <button
            className="empleados-toolbar-button"
            onClick={() => {
              loadRecords()
              setShowRecordsModal(true)
            }}
            aria-label="Ver registros guardados"
            type="button"
          >
            <FolderIcon className="empleados-toolbar-icon" />
          </button>
        </div>

        <h1 className="empleados-page-title">Empleados</h1>
        <p className="empleados-page-subtitle">
          Gestiona la información de tus empleados: salario, tipo de contrato, fecha de contratación y más
        </p>

        {/* Formulario para agregar empleados */}
        <div className="empleados-form-section">
          <h2 className="empleados-section-title">
            {editingId ? 'Editar Empleado' : 'Agregar Empleado'}
          </h2>
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
              {editingId && (
                <button
                  type="button"
                  className="empleados-form-button empleados-form-button-secondary"
                  onClick={handleCancelEdit}
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="empleados-form-button empleados-form-button-primary"
              >
                {editingId ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </form>
        </div>

        {/* Lista de empleados */}
        {employees.length > 0 && (
          <div className="empleados-list-section">
            <div className="empleados-section-header">
              <h2 className="empleados-section-title">
                Empleados ({employees.length})
              </h2>
              <button
                className="empleados-save-button"
                onClick={handleSaveClick}
                disabled={isSaving}
                type="button"
              >
                <SaveIcon className="empleados-save-icon" />
                {isSaving ? 'Guardando...' : 'Guardar Lista'}
              </button>
            </div>
            <div className="empleados-list">
              {employees.map(employee => (
                <div key={employee.id} className="empleados-item">
                  <div className="empleados-item-content">
                    <div className="empleados-item-header">
                      <h3 className="empleados-item-name">{employee.name}</h3>
                      {employee.data.salary && (
                        <span className="empleados-item-salary">
                          ${employee.data.salary.toLocaleString('es-CO', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </span>
                      )}
                    </div>
                    <div className="empleados-item-meta">
                      {employee.data.identification && (
                        <>
                          <span className="empleados-item-meta-item">
                            <strong>Doc:</strong> {employee.data.identification}
                          </span>
                        </>
                      )}
                      {employee.data.contractType && (
                        <>
                          <span className="empleados-item-separator">•</span>
                          <span className="empleados-item-meta-item">
                            <strong>Contrato:</strong> {employee.data.contractType}
                          </span>
                        </>
                      )}
                      {employee.data.startDate && (
                        <>
                          <span className="empleados-item-separator">•</span>
                          <span className="empleados-item-meta-item">
                            <strong>Desde:</strong>{' '}
                            {new Date(employee.data.startDate).toLocaleDateString('es-CO')}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="empleados-item-details">
                      {employee.data.position && (
                        <div className="empleados-item-detail">
                          <WorkIcon className="empleados-item-detail-icon" />
                          <span>{employee.data.position}</span>
                        </div>
                      )}
                      {employee.data.department && (
                        <div className="empleados-item-detail">
                          <span>{employee.data.department}</span>
                        </div>
                      )}
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
                    </div>
                  </div>
                  <div className="empleados-item-actions">
                    <button
                      className="empleados-item-action-button"
                      onClick={() => handleEdit(employee)}
                      aria-label="Editar"
                      type="button"
                    >
                      <EditIcon />
                    </button>
                    <button
                      className="empleados-item-action-button empleados-item-action-button-delete"
                      onClick={() => handleDelete(employee.id)}
                      aria-label="Eliminar"
                      type="button"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal para guardar lista */}
        {showSaveModal && (
          <div className="empleados-modal-overlay" onClick={() => setShowSaveModal(false)}>
            <div className="empleados-modal" onClick={e => e.stopPropagation()}>
              <div className="empleados-modal-header">
                <h2 className="empleados-modal-title">Guardar Lista de Empleados</h2>
                <button
                  className="empleados-modal-close"
                  onClick={() => {
                    setShowSaveModal(false)
                    setListName('')
                  }}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="empleados-modal-content">
                <div className="empleados-form-group">
                  <label htmlFor="listName" className="empleados-form-label">
                    Nombre de la Lista *
                  </label>
                  <input
                    type="text"
                    id="listName"
                    name="listName"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    className="empleados-form-input"
                    placeholder="Ej: Empleados 2024, Personal de Oficina..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveRecord()
                      }
                    }}
                  />
                </div>
                <div className="empleados-form-actions">
                  <button
                    type="button"
                    className="empleados-form-button empleados-form-button-secondary"
                    onClick={() => {
                      setShowSaveModal(false)
                      setListName('')
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="empleados-form-button empleados-form-button-primary"
                    onClick={handleSaveRecord}
                    disabled={isSaving || !listName.trim()}
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de registros guardados */}
        {showRecordsModal && (
          <div className="empleados-modal-overlay" onClick={() => setShowRecordsModal(false)}>
            <div className="empleados-modal" onClick={e => e.stopPropagation()}>
              <div className="empleados-modal-header">
                <h2 className="empleados-modal-title">Registros Guardados</h2>
                <button
                  className="empleados-modal-close"
                  onClick={() => setShowRecordsModal(false)}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="empleados-modal-content">
                {isLoadingRecords ? (
                  <div className="empleados-modal-loading">Cargando...</div>
                ) : records.length === 0 ? (
                  <div className="empleados-modal-empty">No hay registros guardados</div>
                ) : (
                  <div className="empleados-records-list">
                    {records.map(record => (
                      <div key={record.id} className="empleados-record-item">
                        <div className="empleados-record-content">
                          <h3 className="empleados-record-name">{record.name}</h3>
                          <div className="empleados-record-meta">
                            {record.data && record.data.employees && Array.isArray(record.data.employees) ? (
                              <span>{record.data.employees.length} empleado{record.data.employees.length !== 1 ? 's' : ''}</span>
                            ) : (
                              <span>1 empleado</span>
                            )}
                          </div>
                          {record.created_at && (
                            <div className="empleados-record-date">
                              Creado:{' '}
                              {new Date(record.created_at).toLocaleDateString('es-CO')}
                            </div>
                          )}
                        </div>
                        <div className="empleados-record-actions">
                          <button
                            className="empleados-record-action-button"
                            onClick={() => handleLoadRecord(record)}
                            type="button"
                          >
                            Cargar
                          </button>
                          <button
                            className="empleados-record-action-button empleados-record-action-button-delete"
                            onClick={() => handleDeleteRecord(record.id, record.name)}
                            type="button"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Empleados

