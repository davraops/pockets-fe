import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import PersonIcon from '@mui/icons-material/Person'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { api } from '../services/api'
import './AppPage.css'
import './MeDeben.css'

// Interfaz que coincide con la respuesta de la API (campos en inglés)
interface DebtorAPI {
  id: string
  debtor_name: string
  concept: string
  value: number
  total_paid: number
  created_at: string
  updated_at: string
}

// Interfaz para uso interno del componente
interface Debtor {
  id: string
  nombreDeudor: string
  concepto: string
  valor: number
  totalPagado: number
}

function MeDeben() {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null)
  const [debtors, setDebtors] = useState<Debtor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nombreDeudor: '',
    concepto: '',
    valor: '',
    totalPagado: ''
  })
  const [formErrors, setFormErrors] = useState({
    nombreDeudor: '',
    concepto: '',
    valor: '',
    totalPagado: ''
  })

  // Mapear deudor de API a formato interno
  const mapDebtorFromAPI = (apiDebtor: DebtorAPI): Debtor => {
    return {
      id: apiDebtor.id,
      nombreDeudor: apiDebtor.debtor_name,
      concepto: apiDebtor.concept,
      valor: apiDebtor.value,
      totalPagado: apiDebtor.total_paid
    }
  }

  // Función para recargar deudores
  const reloadDebtors = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.getDebtors()
      if (response.debtors && Array.isArray(response.debtors)) {
        const mappedDebtors = response.debtors.map(mapDebtorFromAPI)
        // Ordenar por fecha de creación (más recientes primero)
        mappedDebtors.sort((a: Debtor, b: Debtor) => {
          return 0 // La API ya ordena por created_at descendente
        })
        setDebtors(mappedDebtors)
      } else {
        setDebtors([])
      }
    } catch (err: any) {
      console.error('Error al cargar deudores:', err)
      setError('Frontend says: Error al cargar los deudores. Por favor, intenta de nuevo.')
      setDebtors([])
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar deudores desde la API
  useEffect(() => {
    reloadDebtors()
  }, [])

  // Escuchar eventos de actualización de deudores desde transacciones
  useEffect(() => {
    const handleDebtorsUpdated = () => {
      console.log('Evento debtorsUpdated recibido, recargando deudores...')
      reloadDebtors()
    }

    window.addEventListener('debtorsUpdated', handleDebtorsUpdated)
    return () => {
      window.removeEventListener('debtorsUpdated', handleDebtorsUpdated)
    }
  }, [])

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      nombreDeudor: '',
      concepto: '',
      valor: '',
      totalPagado: ''
    })
    setFormErrors({
      nombreDeudor: '',
      concepto: '',
      valor: '',
      totalPagado: ''
    })
  }

  const handleOpenDetailModal = (debtor: Debtor) => {
    setSelectedDebtor(debtor)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
    setFormData({
      nombreDeudor: debtor.nombreDeudor,
      concepto: debtor.concepto,
      valor: debtor.valor.toString(),
      totalPagado: debtor.totalPagado.toString()
    })
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedDebtor(null)
    setIsEditMode(false)
    setFormData({
      nombreDeudor: '',
      concepto: '',
      valor: '',
      totalPagado: ''
    })
    setFormErrors({
      nombreDeudor: '',
      concepto: '',
      valor: '',
      totalPagado: ''
    })
  }

  const handleEditClick = () => {
    if (!selectedDebtor) return
    setIsEditMode(true)
  }

  const validateForm = async (): Promise<boolean> => {
    const errors = {
      nombreDeudor: '',
      concepto: '',
      valor: '',
      totalPagado: ''
    }
    let isValid = true

    // Validar nombre deudor
    if (!formData.nombreDeudor.trim()) {
      errors.nombreDeudor = 'El nombre del deudor es requerido'
      isValid = false
    }

    // Validar concepto
    if (!formData.concepto.trim()) {
      errors.concepto = 'El concepto es requerido'
      isValid = false
    }

    // Validar valor
    const valor = parseFloat(formData.valor)
    if (isNaN(valor) || valor <= 0) {
      errors.valor = 'El valor debe ser mayor a 0'
      isValid = false
    }

    // Validar total pagado solo en modo creación (no en edición)
    if (!isEditMode) {
      const totalPagado = parseFloat(formData.totalPagado || '0')
      if (isNaN(totalPagado) || totalPagado < 0) {
        errors.totalPagado = 'El total pagado debe ser mayor o igual a 0'
        isValid = false
      }

      if (totalPagado > valor) {
        errors.totalPagado = 'El total pagado no puede ser mayor al valor total'
        isValid = false
      }
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const isValid = await validateForm()
    if (!isValid) {
      return
    }

    try {
      if (isEditMode && selectedDebtor) {
        // Editar deudor existente (sin actualizar total_paid, solo se actualiza desde transacciones)
        await api.updateDebtor(selectedDebtor.id, {
          debtor_name: formData.nombreDeudor.trim(),
          concept: formData.concepto.trim(),
          value: parseFloat(formData.valor)
          // total_paid no se actualiza desde aquí, solo desde transacciones
        })
        
        await reloadDebtors()
        handleCloseDetailModal()
      } else {
        // Agregar nuevo deudor
        await api.createDebtor({
          debtor_name: formData.nombreDeudor.trim(),
          concept: formData.concepto.trim(),
          value: parseFloat(formData.valor),
          total_paid: parseFloat(formData.totalPagado || '0')
        })

        await reloadDebtors()
        handleCloseModal()
      }
    } catch (err: any) {
      console.error('Error al guardar deudor:', err)
      const errorMessage = err.data?.error
        ? `Backend says: ${err.data.error}`
        : 'Frontend says: Error al guardar el deudor. Por favor, intenta de nuevo.'
      alert(errorMessage)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target
    const value = target.value
    
    setFormData({
      ...formData,
      [target.name]: value
    })
    // Limpiar errores cuando el usuario empiece a escribir
    if (formErrors[target.name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [target.name]: ''
      })
    }
  }

  const handleDeleteClick = async () => {
    if (!selectedDebtor) return

    if (window.confirm(`¿Estás seguro de que quieres eliminar el deudor "${selectedDebtor.nombreDeudor}"?`)) {
      try {
        await api.deleteDebtor(selectedDebtor.id)
        await reloadDebtors()
        handleCloseDetailModal()
      } catch (err: any) {
        console.error('Error al eliminar deudor:', err)
        alert('Frontend says: Error al eliminar el deudor. Por favor, intenta de nuevo.')
      }
    }
  }

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(balance)
  }

  // Función para obtener un color único basado en el nombre del deudor
  const getDebtorColor = (nombre: string): string => {
    const greenColors = [
      '#34C759', // Verde iOS
      '#30D158', // Verde claro
      '#32D74B', // Verde brillante
      '#40E0D0', // Turquesa
      '#00C7BE', // Verde azulado
      '#5AC8FA', // Azul claro
      '#64D2FF', // Azul cielo
      '#0A84FF', // Azul iOS
      '#007AFF', // Azul estándar
      '#5856D6', // Púrpura azulado
      '#AF52DE', // Púrpura
      '#FF2D55'  // Rosa
    ]
    let hash = 0
    for (let i = 0; i < nombre.length; i++) {
      hash = nombre.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % greenColors.length
    return greenColors[index]
  }

  // Calcular porcentaje pagado
  const calculatePaidPercentage = (valor: number, totalPagado: number): number => {
    if (valor === 0) return 0
    return (totalPagado / valor) * 100
  }

  // Calcular monto pendiente
  const calculatePending = (valor: number, totalPagado: number): number => {
    return Math.max(0, valor - totalPagado)
  }

  // Función de debug para crear deudores de prueba
  const handleCreateDemoDebtors = async () => {
    const testDebtors = [
      {
        debtor_name: 'Juan Pérez',
        concept: 'Préstamo personal para emergencia médica',
        value: 500000,
        total_paid: 150000
      },
      {
        debtor_name: 'María García',
        concept: 'Dinero prestado para compra de electrodomésticos',
        value: 1200000,
        total_paid: 400000
      },
      {
        debtor_name: 'Carlos Rodríguez',
        concept: 'Préstamo para reparación de vehículo',
        value: 800000,
        total_paid: 0
      },
      {
        debtor_name: 'Ana Martínez',
        concept: 'Dinero prestado para pago de matrícula universitaria',
        value: 2500000,
        total_paid: 1800000
      },
      {
        debtor_name: 'Luis Fernández',
        concept: 'Préstamo para compra de materiales de construcción',
        value: 3000000,
        total_paid: 3000000
      },
      {
        debtor_name: 'Sofía López',
        concept: 'Dinero prestado para viaje de vacaciones',
        value: 1500000,
        total_paid: 750000
      },
      {
        debtor_name: 'Diego Torres',
        concept: 'Préstamo para pago de servicios públicos',
        value: 600000,
        total_paid: 300000
      },
      {
        debtor_name: 'Laura Sánchez',
        concept: 'Dinero prestado para compra de ropa y accesorios',
        value: 900000,
        total_paid: 900000
      }
    ]

    try {
      setIsLoading(true)
      for (const debtor of testDebtors) {
        await api.createDebtor(debtor)
      }
      await reloadDebtors()
      setIsDebugModalOpen(false)
      alert('8 deudores de prueba creados exitosamente')
    } catch (err: any) {
      console.error('Error al crear deudores de prueba:', err)
      alert('Backend says: ' + (err.data?.error || 'Error desconocido'))
    } finally {
      setIsLoading(false)
    }
  }

  // Función para eliminar todos los deudores
  const handleDeleteAllDebtors = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar TODOS los deudores? Esta acción es IRREVERSIBLE.')) {
      try {
        setIsLoading(true)
        await api.deleteAllDebtors()
        await reloadDebtors()
        setIsDebugModalOpen(false)
        alert('Todos los deudores han sido eliminados exitosamente')
      } catch (err: any) {
        console.error('Error al eliminar todos los deudores:', err)
        alert('Backend says: ' + (err.data?.error || 'Error desconocido'))
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <>
      <div className="app-page-container">
        <div className="app-page-content me-deben-content">
          {isLoading ? (
            <div className="loader-container">
              <div className="loader">
                <div className="loader-spinner"></div>
                <p className="loader-text">Cargando deudores...</p>
              </div>
            </div>
          ) : error ? (
            <div className="loader-container">
              <div className="loader">
                <p className="loader-text" style={{ color: 'rgba(255, 59, 48, 0.9)' }}>{error}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="me-deben-header">
                <button className="add-debtor-button" onClick={handleOpenModal}>
                  <AddIcon />
                  <span>Agregar Deudor</span>
                </button>
                {api.isTestUser() && (
                  <button className="debug-button" onClick={() => setIsDebugModalOpen(true)} title="Debug: Opciones de desarrollo">
                    🐛 Debug
                  </button>
                )}
              </div>

              {debtors.length === 0 ? (
                <div className="empty-state">
                  <PersonIcon className="empty-icon" />
                  <p className="empty-text">No hay deudores registrados</p>
                  <p className="empty-subtext">Agrega tu primer deudor</p>
                </div>
              ) : (
                <div className="debtors-grid">
                  {debtors.map((debtor) => {
                    const debtorColor = getDebtorColor(debtor.nombreDeudor)
                    const paidPercentage = calculatePaidPercentage(debtor.valor, debtor.totalPagado)
                    const pending = calculatePending(debtor.valor, debtor.totalPagado)
                    const isFullyPaid = pending === 0
                    
                    return (
                      <div 
                        key={debtor.id} 
                        className={`debtor-card ${isFullyPaid ? 'debtor-paid-off' : ''}`}
                        onClick={() => handleOpenDetailModal(debtor)}
                        style={{ '--debtor-color': debtorColor } as React.CSSProperties}
                      >
                        <div className="debtor-card-content">
                          <div className="debtor-card-left">
                            <div className="debtor-icon" style={{ backgroundColor: debtorColor }}>
                              <PersonIcon />
                            </div>
                            <div className="debtor-info">
                              <h3 className="debtor-name">{debtor.nombreDeudor}</h3>
                              <p className="debtor-concept">{debtor.concepto}</p>
                            </div>
                          </div>
                          <div className="debtor-card-right">
                            <div className="debtor-main-amount">
                              <span className="debtor-main-label">Pendiente</span>
                              <span className="debtor-main-value">{formatBalance(pending)}</span>
                            </div>
                            <div className="debtor-secondary-info">
                              <div className="debtor-secondary-item">
                                <span className="debtor-secondary-label">Total</span>
                                <span className="debtor-secondary-value">{formatBalance(debtor.valor)}</span>
                              </div>
                              <div className="debtor-secondary-item">
                                <span className="debtor-secondary-label">Pagado</span>
                                <span className="debtor-secondary-value">{formatBalance(debtor.totalPagado)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="debtor-progress-container">
                          <div className="debtor-progress-bar">
                            <div 
                              className="debtor-progress-fill" 
                              style={{ 
                                width: `${Math.min(paidPercentage, 100)}%`,
                                backgroundColor: debtorColor
                              }}
                            ></div>
                          </div>
                          <span className="debtor-progress-text">{paidPercentage.toFixed(1)}% pagado</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Botón de volver */}
              <div className="back-button-container">
                <button className="back-button" onClick={() => navigate('/finanzas')}>
                  <ArrowBackIcon />
                  <span>Volver a Finanzas</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal para agregar deudor */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nuevo Deudor</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="nombreDeudor">Nombre del Deudor *</label>
                <input
                  type="text"
                  id="nombreDeudor"
                  name="nombreDeudor"
                  value={formData.nombreDeudor}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Juan Pérez"
                  className={formErrors.nombreDeudor ? 'input-error' : ''}
                />
                {formErrors.nombreDeudor && (
                  <span className="error-message">{formErrors.nombreDeudor}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="concepto">Concepto *</label>
                <textarea
                  id="concepto"
                  name="concepto"
                  value={formData.concepto}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Préstamo personal"
                  rows={3}
                  className={formErrors.concepto ? 'input-error' : ''}
                />
                {formErrors.concepto && (
                  <span className="error-message">{formErrors.concepto}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="valor">Valor Total (COP) *</label>
                <input
                  type="number"
                  id="valor"
                  name="valor"
                  value={formData.valor}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0.01"
                  placeholder="0"
                  className={formErrors.valor ? 'input-error' : ''}
                />
                {formErrors.valor && (
                  <span className="error-message">{formErrors.valor}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="totalPagado">Total Pagado (COP)</label>
                <input
                  type="number"
                  id="totalPagado"
                  name="totalPagado"
                  value={formData.totalPagado}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0"
                  className={formErrors.totalPagado ? 'input-error' : ''}
                />
                {formErrors.totalPagado && (
                  <span className="error-message">{formErrors.totalPagado}</span>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="modal-button cancel" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="modal-button submit">
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de detalles */}
      {isDetailModalOpen && selectedDebtor && (
        <div className="modal-overlay" onClick={handleCloseDetailModal}>
          <div 
            className="modal-content detail-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{ '--debtor-color': getDebtorColor(selectedDebtor.nombreDeudor) } as React.CSSProperties}
          >
            <div className="modal-header">
              <h2 className="modal-title">Detalles del Deudor</h2>
              <button className="modal-close" onClick={handleCloseDetailModal}>×</button>
            </div>
            
            {!isEditMode ? (
              <>
                <div className="detail-content">
                  <div className="detail-section">
                    <div className="detail-icon-large" style={{ backgroundColor: getDebtorColor(selectedDebtor.nombreDeudor) }}>
                      <PersonIcon />
                    </div>
                    <div className="detail-info">
                      <h3 className="detail-name">{selectedDebtor.nombreDeudor}</h3>
                      <p className="detail-bank">{selectedDebtor.concepto}</p>
                    </div>
                  </div>

                  <div className="debtor-detail-progress">
                    <div className="debtor-detail-progress-bar">
                      <div 
                        className="debtor-detail-progress-fill" 
                        style={{ 
                          width: `${Math.min(calculatePaidPercentage(selectedDebtor.valor, selectedDebtor.totalPagado), 100)}%`,
                          backgroundColor: getDebtorColor(selectedDebtor.nombreDeudor)
                        }}
                      ></div>
                    </div>
                    <span className="debtor-detail-progress-text">{calculatePaidPercentage(selectedDebtor.valor, selectedDebtor.totalPagado).toFixed(1)}% pagado</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Valor Total:</span>
                    <span className="detail-value">{formatBalance(selectedDebtor.valor)}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Total Pagado:</span>
                    <span className="detail-value remaining">{formatBalance(selectedDebtor.totalPagado)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Pendiente:</span>
                    <span className="detail-value spent">{formatBalance(calculatePending(selectedDebtor.valor, selectedDebtor.totalPagado))}</span>
                  </div>
                </div>

                <div className="detail-actions">
                  <button className="detail-button edit" onClick={handleEditClick}>
                    <EditIcon />
                    <span>Editar Deudor</span>
                  </button>
                  <button className="detail-button delete" onClick={handleDeleteClick}>
                    <DeleteIcon />
                    <span>Eliminar Deudor</span>
                  </button>
                </div>
              </>
            ) : (
              <form className="modal-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="edit-nombreDeudor">Nombre del Deudor *</label>
                  <input
                    type="text"
                    id="edit-nombreDeudor"
                    name="nombreDeudor"
                    value={formData.nombreDeudor}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Juan Pérez"
                    className={formErrors.nombreDeudor ? 'input-error' : ''}
                  />
                  {formErrors.nombreDeudor && (
                    <span className="error-message">{formErrors.nombreDeudor}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="edit-concepto">Concepto *</label>
                  <textarea
                    id="edit-concepto"
                    name="concepto"
                    value={formData.concepto}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Préstamo personal"
                    rows={3}
                    className={formErrors.concepto ? 'input-error' : ''}
                  />
                  {formErrors.concepto && (
                    <span className="error-message">{formErrors.concepto}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="edit-valor">Valor Total (COP) *</label>
                  <input
                    type="number"
                    id="edit-valor"
                    name="valor"
                    value={formData.valor}
                    onChange={handleChange}
                    required
                    step="0.01"
                    min="0.01"
                    placeholder="0"
                    className={formErrors.valor ? 'input-error' : ''}
                  />
                  {formErrors.valor && (
                    <span className="error-message">{formErrors.valor}</span>
                  )}
                </div>
                <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', backgroundColor: 'rgba(0, 122, 255, 0.1)', border: '1px solid rgba(0, 122, 255, 0.3)', borderRadius: '8px', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                  <strong>💡 Nota:</strong> El total pagado solo se puede actualizar desde el registro de transacciones.
                </div>
                <div className="modal-actions">
                  <button type="button" className="modal-button cancel" onClick={() => setIsEditMode(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="modal-button submit">
                    Guardar Cambios
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal de Debug */}
      {isDebugModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDebugModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Debug - Me Deben</h2>
              <button className="modal-close" onClick={() => setIsDebugModalOpen(false)}>×</button>
            </div>
            <div className="debug-modal-content">
              <div className="debug-options">
                <button
                  className="debug-option-button create-demo"
                  onClick={handleCreateDemoDebtors}
                  disabled={isLoading}
                >
                  <span className="debug-option-icon">📦</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Crear Deudores Demo</h3>
                    <p className="debug-option-description">Crea 8 deudores de ejemplo para pruebas</p>
                  </div>
                </button>
                <button
                  className="debug-option-button delete-all"
                  onClick={handleDeleteAllDebtors}
                  disabled={isLoading}
                >
                  <span className="debug-option-icon">🗑️</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Eliminar Todos los Deudores</h3>
                    <p className="debug-option-description">⚠️ PELIGROSO: Elimina todos los deudores (IRREVERSIBLE)</p>
                  </div>
                </button>
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-button cancel"
                onClick={() => setIsDebugModalOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default MeDeben

