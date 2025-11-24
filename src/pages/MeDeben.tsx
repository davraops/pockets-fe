import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import PersonIcon from '@mui/icons-material/Person'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
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
  fechaCreacion: string
}

function MeDeben() {
  const navigate = useNavigate()
  const { showError, showSuccess } = useNotification()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null)
  const [debtors, setDebtors] = useState<Debtor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    nombreDeudor: '',
    concepto: '',
    valor: '',
    totalPagado: '',
  })
  const [formErrors, setFormErrors] = useState({
    nombreDeudor: '',
    concepto: '',
    valor: '',
    totalPagado: '',
  })

  // Mapear deudor de API a formato interno
  const mapDebtorFromAPI = (apiDebtor: DebtorAPI): Debtor => {
    return {
      id: apiDebtor.id,
      nombreDeudor: apiDebtor.debtor_name,
      concepto: apiDebtor.concept,
      valor: apiDebtor.value,
      totalPagado: apiDebtor.total_paid,
      fechaCreacion: apiDebtor.created_at,
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
        // Ordenar por monto pendiente (de mayor a menor)
        mappedDebtors.sort((a: Debtor, b: Debtor) => {
          const pendingA = calculatePending(a.valor, a.totalPagado)
          const pendingB = calculatePending(b.valor, b.totalPagado)
          return pendingB - pendingA // Mayor pendiente primero
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

  // Cerrar menú al hacer clic fuera - HIG: Clear Feedback
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

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      nombreDeudor: '',
      concepto: '',
      valor: '',
      totalPagado: '',
    })
    setFormErrors({
      nombreDeudor: '',
      concepto: '',
      valor: '',
      totalPagado: '',
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
      totalPagado: debtor.totalPagado.toString(),
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
      totalPagado: '',
    })
    setFormErrors({
      nombreDeudor: '',
      concepto: '',
      valor: '',
      totalPagado: '',
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
      totalPagado: '',
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
          value: parseFloat(formData.valor),
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
          total_paid: parseFloat(formData.totalPagado || '0'),
        })

        await reloadDebtors()
        handleCloseModal()
        showSuccess('Deudor creado exitosamente')
      }
    } catch (err: any) {
      console.error('Error al guardar deudor:', err)
      const errorMessage = err.data?.error
        ? err.data.error
        : 'Error al guardar el deudor. Por favor, intenta de nuevo.'
      showError(errorMessage)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target
    const value = target.value

    setFormData({
      ...formData,
      [target.name]: value,
    })
    // Limpiar errores cuando el usuario empiece a escribir
    if (formErrors[target.name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [target.name]: '',
      })
    }
  }

  const handleDeleteClick = async () => {
    if (!selectedDebtor) return

    if (
      window.confirm(
        `¿Estás seguro de que quieres eliminar el deudor "${selectedDebtor.nombreDeudor}"?`
      )
    ) {
      try {
        await api.deleteDebtor(selectedDebtor.id)
        await reloadDebtors()
        handleCloseDetailModal()
        showSuccess('Deudor eliminado exitosamente')
      } catch (err: any) {
        console.error('Error al eliminar deudor:', err)
        showError('Error al eliminar el deudor. Por favor, intenta de nuevo.')
      }
    }
  }

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
      '#FF2D55', // Rosa
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

  // Calcular tiempo que llevan debiendo - HIG: Relevant Information
  const calculateTimeOwing = (fechaCreacion: string): string => {
    const now = new Date()
    const created = new Date(fechaCreacion)
    const diffMs = now.getTime() - created.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays < 1) {
      return 'Hoy'
    } else if (diffDays === 1) {
      return 'Hace 1 día'
    } else if (diffDays < 30) {
      return `Hace ${diffDays} días`
    } else if (diffDays < 60) {
      const months = Math.floor(diffDays / 30)
      return `Hace ${months} mes${months !== 1 ? 'es' : ''}`
    } else {
      const months = Math.floor(diffDays / 30)
      if (months < 12) {
        return `Hace ${months} mes${months !== 1 ? 'es' : ''}`
      } else {
        const years = Math.floor(months / 12)
        const remainingMonths = months % 12
        if (remainingMonths === 0) {
          return `Hace ${years} año${years !== 1 ? 's' : ''}`
        } else {
          return `Hace ${years} año${years !== 1 ? 's' : ''} y ${remainingMonths} mes${remainingMonths !== 1 ? 'es' : ''}`
        }
      }
    }
  }

  // Calcular highlights - HIG: Relevant Information
  const calculateHighlights = () => {
    const totalDeudores = debtors.length
    const totalPendiente = debtors.reduce(
      (total, debtor) => total + calculatePending(debtor.valor, debtor.totalPagado),
      0
    )
    const totalPagado = debtors.reduce((total, debtor) => total + debtor.totalPagado, 0)
    const deudoresCompletos = debtors.filter(
      debtor => calculatePending(debtor.valor, debtor.totalPagado) === 0
    ).length
    const deudoresPendientes = debtors.filter(
      debtor => calculatePending(debtor.valor, debtor.totalPagado) > 0
    ).length

    return {
      totalDeudores,
      totalPendiente,
      totalPagado,
      deudoresCompletos,
      deudoresPendientes,
    }
  }

  // Función de debug para crear deudores de prueba
  const handleCreateDemoDebtors = async () => {
    const testDebtors = [
      {
        debtor_name: 'Juan Pérez',
        concept: 'Préstamo personal para emergencia médica',
        value: 500000,
        total_paid: 150000,
      },
      {
        debtor_name: 'María García',
        concept: 'Dinero prestado para compra de electrodomésticos',
        value: 1200000,
        total_paid: 400000,
      },
      {
        debtor_name: 'Carlos Rodríguez',
        concept: 'Préstamo para reparación de vehículo',
        value: 800000,
        total_paid: 0,
      },
      {
        debtor_name: 'Ana Martínez',
        concept: 'Dinero prestado para pago de matrícula universitaria',
        value: 2500000,
        total_paid: 1800000,
      },
      {
        debtor_name: 'Luis Fernández',
        concept: 'Préstamo para compra de materiales de construcción',
        value: 3000000,
        total_paid: 3000000,
      },
      {
        debtor_name: 'Sofía López',
        concept: 'Dinero prestado para viaje de vacaciones',
        value: 1500000,
        total_paid: 750000,
      },
      {
        debtor_name: 'Diego Torres',
        concept: 'Préstamo para pago de servicios públicos',
        value: 600000,
        total_paid: 300000,
      },
      {
        debtor_name: 'Laura Sánchez',
        concept: 'Dinero prestado para compra de ropa y accesorios',
        value: 900000,
        total_paid: 900000,
      },
    ]

    try {
      setIsLoading(true)
      for (const debtor of testDebtors) {
        await api.createDebtor(debtor)
      }
      await reloadDebtors()
      setIsDebugModalOpen(false)
      showSuccess('8 deudores de prueba creados exitosamente')
    } catch (err: any) {
      console.error('Error al crear deudores de prueba:', err)
      showError(err.data?.error || 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  // Función para eliminar todos los deudores
  const handleDeleteAllDebtors = async () => {
    if (
      window.confirm(
        '¿Estás seguro de que quieres eliminar TODOS los deudores? Esta acción es IRREVERSIBLE.'
      )
    ) {
      try {
        setIsLoading(true)
        await api.deleteAllDebtors()
        await reloadDebtors()
        setIsDebugModalOpen(false)
        showSuccess('Todos los deudores han sido eliminados exitosamente')
      } catch (err: any) {
        console.error('Error al eliminar todos los deudores:', err)
        showError(err.data?.error || 'Error desconocido')
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
                <p className="loader-text" style={{ color: 'rgba(255, 59, 48, 0.9)' }}>
                  {error}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Toolbar - HIG: Clear Navigation */}
              <div className="me-deben-toolbar">
                <button
                  className="me-deben-toolbar-button"
                  onClick={() => navigate('/finanzas')}
                  aria-label="Volver a Finanzas"
                  type="button"
                >
                  <ArrowBackIcon className="me-deben-toolbar-icon" />
                </button>
                <div className="me-deben-toolbar-menu-container" ref={menuRef}>
                  <button
                    className="me-deben-toolbar-button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Opciones"
                    aria-expanded={isMenuOpen}
                    type="button"
                  >
                    <MoreVertIcon className="me-deben-toolbar-icon" />
                  </button>
                  {isMenuOpen && (
                    <div className="me-deben-menu">
                      <button
                        className="me-deben-menu-item"
                        onClick={() => {
                          handleOpenModal()
                          setIsMenuOpen(false)
                        }}
                        type="button"
                      >
                        <AddIcon className="me-deben-menu-icon" />
                        Agregar Deudor
                      </button>
                      {api.isTestUser() && (
                        <button
                          className="me-deben-menu-item"
                          onClick={() => {
                            setIsDebugModalOpen(true)
                            setIsMenuOpen(false)
                          }}
                          type="button"
                        >
                          <span className="me-deben-menu-icon">🐛</span>
                          Debug
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Page Title - HIG: Clear Orientation */}
              <h1 className="me-deben-page-title">Me Deben</h1>

              {/* Highlights - HIG: Relevant Information */}
              {debtors.length > 0 &&
                (() => {
                  const highlights = calculateHighlights()
                  return (
                    <div className="me-deben-summary-block">
                      <div className="summary-item">
                        <span className="summary-label">Total Deudores</span>
                        <span className="summary-value">{highlights.totalDeudores}</span>
                      </div>
                      <div className="summary-separator"></div>
                      <div className="summary-item">
                        <span className="summary-label">Pendiente</span>
                        <span className="summary-value">
                          {formatBalance(highlights.totalPendiente)}
                        </span>
                      </div>
                      <div className="summary-separator"></div>
                      <div className="summary-item">
                        <span className="summary-label">Pagado</span>
                        <span className="summary-value">
                          {formatBalance(highlights.totalPagado)}
                        </span>
                      </div>
                      <div className="summary-separator"></div>
                      <div className="summary-item">
                        <span className="summary-label">Pendientes</span>
                        <span className="summary-value">{highlights.deudoresPendientes}</span>
                      </div>
                      <div className="summary-separator"></div>
                      <div className="summary-item">
                        <span className="summary-label">Completos</span>
                        <span className="summary-value">{highlights.deudoresCompletos}</span>
                      </div>
                    </div>
                  )
                })()}

              {debtors.length === 0 ? (
                <div className="empty-state">
                  <PersonIcon className="empty-icon" />
                  <p className="empty-text">No hay deudores registrados</p>
                  <p className="empty-subtext">Agrega tu primer deudor</p>
                </div>
              ) : (
                <div className="me-deben-list">
                  {debtors.map(debtor => {
                    const debtorColor = getDebtorColor(debtor.nombreDeudor)
                    const paidPercentage = calculatePaidPercentage(debtor.valor, debtor.totalPagado)
                    const pending = calculatePending(debtor.valor, debtor.totalPagado)
                    const isFullyPaid = pending === 0
                    const timeOwing = calculateTimeOwing(debtor.fechaCreacion)

                    return (
                      <button
                        key={debtor.id}
                        className={`deudor-row ${isFullyPaid ? 'deudor-paid-off' : ''}`}
                        onClick={() => handleOpenDetailModal(debtor)}
                        type="button"
                        aria-label={`Ver detalles de ${debtor.nombreDeudor}`}
                      >
                        <div className="deudor-row-content">
                          <div className="deudor-row-main">
                            <span className="deudor-row-title">{debtor.nombreDeudor}</span>
                            <span className="deudor-row-subtitle">
                              {debtor.concepto} • {timeOwing}
                            </span>
                          </div>
                          <div className="deudor-row-secondary">
                            <span className="deudor-row-total">{formatBalance(debtor.valor)}</span>
                            <div className="deudor-row-bottom">
                              <span className="deudor-row-pending">
                                Pendiente: {formatBalance(pending)}
                              </span>
                              <div className="deudor-row-progress">
                                <div className="deudor-row-progress-bar">
                                  <div
                                    className="deudor-row-progress-fill"
                                    style={{
                                      width: `${Math.min(paidPercentage, 100)}%`,
                                      backgroundColor: isFullyPaid ? '#34C759' : debtorColor,
                                    }}
                                  />
                                </div>
                                <span className="deudor-row-progress-text">
                                  {paidPercentage.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <ChevronRightIcon className="deudor-row-chevron" aria-hidden="true" />
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal para agregar deudor */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nuevo Deudor</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
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
                {formErrors.valor && <span className="error-message">{formErrors.valor}</span>}
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
            onClick={e => e.stopPropagation()}
            style={
              {
                '--debtor-color': getDebtorColor(selectedDebtor.nombreDeudor),
              } as React.CSSProperties
            }
          >
            <div className="modal-header">
              <h2 className="modal-title">Detalles del Deudor</h2>
              <button
                className="modal-close"
                onClick={handleCloseDetailModal}
                aria-label="Cerrar modal"
                type="button"
              >
                ×
              </button>
            </div>

            {!isEditMode ? (
              <>
                <div className="detail-content">
                  <div className="detail-section">
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
                          backgroundColor: getDebtorColor(selectedDebtor.nombreDeudor),
                        }}
                      ></div>
                    </div>
                    <span className="debtor-detail-progress-text">
                      {calculatePaidPercentage(
                        selectedDebtor.valor,
                        selectedDebtor.totalPagado
                      ).toFixed(1)}
                      % pagado
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Valor Total:</span>
                    <span className="detail-value">{formatBalance(selectedDebtor.valor)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Total Pagado:</span>
                    <span className="detail-value remaining">
                      {formatBalance(selectedDebtor.totalPagado)}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Pendiente:</span>
                    <span className="detail-value spent">
                      {formatBalance(
                        calculatePending(selectedDebtor.valor, selectedDebtor.totalPagado)
                      )}
                    </span>
                  </div>
                </div>

                <div className="detail-actions">
                  <button
                    className="detail-button edit"
                    onClick={handleEditClick}
                    type="button"
                    aria-label="Editar deudor"
                  >
                    <EditIcon aria-hidden="true" />
                    <span>Editar Deudor</span>
                  </button>
                  <button
                    className="detail-button delete"
                    onClick={handleDeleteClick}
                    type="button"
                    aria-label="Eliminar deudor"
                  >
                    <DeleteIcon aria-hidden="true" />
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
                  {formErrors.valor && <span className="error-message">{formErrors.valor}</span>}
                </div>
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    backgroundColor: 'rgba(0, 122, 255, 0.1)',
                    border: '1px solid rgba(0, 122, 255, 0.3)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                  }}
                >
                  <strong>💡 Nota:</strong> El total pagado solo se puede actualizar desde el
                  registro de transacciones.
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-button cancel"
                    onClick={() => setIsEditMode(false)}
                  >
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
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Debug - Me Deben</h2>
              <button className="modal-close" onClick={() => setIsDebugModalOpen(false)}>
                ×
              </button>
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
                    <p className="debug-option-description">
                      Crea 8 deudores de ejemplo para pruebas
                    </p>
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
                    <p className="debug-option-description">
                      ⚠️ PELIGROSO: Elimina todos los deudores (IRREVERSIBLE)
                    </p>
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
