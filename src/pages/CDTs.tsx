import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import './CDTs.css'

// Interfaz que coincide con la respuesta de la API (campos en inglés)
interface CDTAPI {
  id: string
  name: string
  value: number
  rate: number
  withdrawal_date: string
  duration?: number | null
  issuer?: string | null
  created_at: string
  updated_at: string
}

// Interfaz para uso interno del componente
interface CDT {
  id: string
  nombre: string
  valor: number
  tasa: number
  fechaRetiro: string
  duracion?: number | null
  emisor?: string | null
  created_at?: string
}

function CDTs() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedCDT, setSelectedCDT] = useState<CDT | null>(null)
  const [cdts, setCDTs] = useState<CDT[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    valor: '',
    tasa: '',
    fechaRetiro: '',
    duracion: '',
    emisor: '',
  })
  const [formErrors, setFormErrors] = useState({
    nombre: '',
    valor: '',
    tasa: '',
    fechaRetiro: '',
    duracion: '',
  })

  // Mapear CDT de API a formato interno
  const mapCDTFromAPI = (apiCDT: CDTAPI): CDT => {
    return {
      id: apiCDT.id,
      nombre: apiCDT.name,
      valor: apiCDT.value,
      tasa: apiCDT.rate,
      fechaRetiro: apiCDT.withdrawal_date,
      duracion: apiCDT.duration !== undefined && apiCDT.duration !== null ? apiCDT.duration : null,
      emisor:
        apiCDT.issuer !== undefined && apiCDT.issuer !== null && apiCDT.issuer.trim() !== ''
          ? apiCDT.issuer.trim()
          : null,
      created_at: apiCDT.created_at,
    }
  }

  // Cargar CDTs desde la API
  useEffect(() => {
    const loadCDTs = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await api.getCDTs()
        console.log('API Response:', response)
        if (response.cdts && Array.isArray(response.cdts)) {
          console.log('CDTs from API:', response.cdts)
          const mappedCDTs = response.cdts.map(mapCDTFromAPI)
          console.log('Mapped CDTs:', mappedCDTs)
          setCDTs(mappedCDTs)
        } else {
          setCDTs([])
        }
      } catch (err: any) {
        console.error('Error al cargar CDTs:', err)
        setError('Error al cargar los CDTs. Por favor, intenta de nuevo.')
        setCDTs([])
      } finally {
        setIsLoading(false)
      }
    }

    loadCDTs()
  }, [])

  // Cerrar menú al hacer clic fuera - HIG: Clear Feedback
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isMenuOpen && !target.closest('.cdts-toolbar-menu-container')) {
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
      nombre: '',
      valor: '',
      tasa: '',
      fechaRetiro: '',
      duracion: '',
      emisor: '',
    })
    setFormErrors({
      nombre: '',
      valor: '',
      tasa: '',
      fechaRetiro: '',
      duracion: '',
    })
    setIsEditMode(false)
  }

  const handleOpenDetailModal = (cdt: CDT) => {
    setSelectedCDT(cdt)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
    setFormData({
      nombre: cdt.nombre,
      valor: cdt.valor.toString(),
      tasa: cdt.tasa.toString(),
      fechaRetiro: cdt.fechaRetiro,
      duracion: cdt.duracion?.toString() || '',
      emisor: cdt.emisor || '',
    })
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedCDT(null)
    setIsEditMode(false)
    setFormData({
      nombre: '',
      valor: '',
      tasa: '',
      fechaRetiro: '',
      duracion: '',
      emisor: '',
    })
    setFormErrors({
      nombre: '',
      valor: '',
      tasa: '',
      fechaRetiro: '',
      duracion: '',
    })
  }

  const handleEditClick = () => {
    setIsEditMode(true)
  }

  const handleDeleteClick = async () => {
    if (selectedCDT && window.confirm('¿Estás seguro de que quieres eliminar este CDT?')) {
      try {
        await api.deleteCDT(selectedCDT.id)
        const response = await api.getCDTs()
        if (response.cdts && Array.isArray(response.cdts)) {
          const mappedCDTs = response.cdts.map(mapCDTFromAPI)
          setCDTs(mappedCDTs)
        }
        handleCloseDetailModal()
        showNotification('CDT eliminado exitosamente', 'success')
      } catch (err: any) {
        console.error('Error al eliminar CDT:', err)
        const errorMessage = getTranslatedErrorMessage(
          err,
          'Error al eliminar el CDT. Por favor, intenta de nuevo.'
        )
        showNotification(errorMessage, 'error')
      }
    }
  }

  const validateForm = async (): Promise<boolean> => {
    const errors = {
      nombre: '',
      valor: '',
      tasa: '',
      fechaRetiro: '',
      duracion: '',
    }
    let isValid = true

    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido'
      isValid = false
    }

    const valor = parseFloat(formData.valor)
    if (!formData.valor || isNaN(valor) || valor <= 0) {
      errors.valor = 'El valor debe ser un número positivo'
      isValid = false
    }

    const tasa = parseFloat(formData.tasa)
    if (!formData.tasa || isNaN(tasa) || tasa < 0) {
      errors.tasa = 'La tasa debe ser un número no negativo'
      isValid = false
    }

    if (!formData.fechaRetiro) {
      errors.fechaRetiro = 'La fecha de retiro es requerida'
      isValid = false
    } else {
      const fechaRetiro = new Date(formData.fechaRetiro)
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      if (fechaRetiro < hoy) {
        errors.fechaRetiro = 'La fecha de retiro no puede ser en el pasado'
        isValid = false
      }
    }

    if (formData.duracion && formData.duracion.trim() !== '') {
      const duracion = parseInt(formData.duracion)
      if (isNaN(duracion) || duracion <= 0) {
        errors.duracion = 'La duración debe ser un número entero positivo'
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
      if (isEditMode && selectedCDT) {
        // Editar CDT existente
        const updateData: any = {
          name: formData.nombre.trim(),
          value: parseFloat(formData.valor),
          rate: parseFloat(formData.tasa),
          withdrawal_date: formData.fechaRetiro,
        }
        // Enviar duration como número o null explícitamente
        if (formData.duracion && formData.duracion.trim() !== '') {
          updateData.duration = parseInt(formData.duracion)
        } else {
          updateData.duration = null
        }
        // Enviar issuer como string o null explícitamente
        if (formData.emisor && formData.emisor.trim() !== '') {
          updateData.issuer = formData.emisor.trim()
        } else {
          updateData.issuer = null
        }
        await api.updateCDT(selectedCDT.id, updateData)

        const response = await api.getCDTs()
        if (response.cdts && Array.isArray(response.cdts)) {
          const mappedCDTs = response.cdts.map(mapCDTFromAPI)
          setCDTs(mappedCDTs)
        }
        handleCloseDetailModal()
        showNotification('CDT actualizado exitosamente', 'success')
      } else {
        // Agregar nuevo CDT
        const createData: any = {
          name: formData.nombre.trim(),
          value: parseFloat(formData.valor),
          rate: parseFloat(formData.tasa),
          withdrawal_date: formData.fechaRetiro,
        }
        if (formData.duracion && formData.duracion.trim() !== '') {
          createData.duration = parseInt(formData.duracion)
        }
        if (formData.emisor && formData.emisor.trim() !== '') {
          createData.issuer = formData.emisor.trim()
        }
        await api.createCDT(createData)

        const response = await api.getCDTs()
        if (response.cdts && Array.isArray(response.cdts)) {
          const mappedCDTs = response.cdts.map(mapCDTFromAPI)
          setCDTs(mappedCDTs)
        }
        handleCloseModal()
        showNotification('CDT creado exitosamente', 'success')
      }
    } catch (err: any) {
      console.error('Error al guardar CDT:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al guardar el CDT. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Calcular progreso del CDT (0-100%)
  const calculateProgress = (cdt: CDT): number => {
    if (!cdt.duracion) return 0

    // Usar created_at si está disponible, sino calcular desde la fecha de retiro hacia atrás
    let startDate: Date
    if (cdt.created_at) {
      startDate = new Date(cdt.created_at)
    } else {
      // Si no hay created_at, calcular desde la fecha de retiro menos la duración
      const withdrawalDate = new Date(cdt.fechaRetiro)
      startDate = new Date(withdrawalDate)
      startDate.setDate(startDate.getDate() - cdt.duracion)
    }

    const today = new Date()
    const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const progress = Math.min(100, Math.max(0, (daysElapsed / cdt.duracion) * 100))
    return Math.round(progress)
  }

  // Calcular ganancia ajustada por inflación
  // Usando una tasa de inflación promedio del 5% anual (promedio histórico reciente de Colombia)
  const calculateInflationAdjustedGain = (cdt: CDT): number => {
    if (!cdt.created_at || !cdt.duracion) return 0

    const createdDate = new Date(cdt.created_at)
    const today = new Date()
    const daysElapsed = Math.floor(
      (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Si aún no ha pasado tiempo, retornar 0
    if (daysElapsed <= 0) return 0

    const yearsElapsed = daysElapsed / 365

    // Ganancia nominal hasta ahora (interés simple proporcional al tiempo transcurrido)
    // La tasa es anual, así que calculamos la proporción del año
    const nominalGain = (cdt.valor * cdt.tasa * yearsElapsed) / 100

    // Pérdida por inflación (asumiendo 5% anual promedio, compuesto)
    const inflationRate = 5.0 // Tasa de inflación promedio anual
    const inflationLoss = cdt.valor * (Math.pow(1 + inflationRate / 100, yearsElapsed) - 1)

    // Ganancia real ajustada por inflación
    const realGain = nominalGain - inflationLoss

    return realGain
  }

  const handleDebugCreateCDTs = async () => {
    try {
      setIsLoading(true)
      const demoCDTs = [
        {
          name: 'CDT Banco Popular Anual',
          value: 10000000,
          rate: 8.5,
          withdrawal_date: '2025-12-31',
          duration: 365,
          issuer: 'Banco Popular',
        },
        {
          name: 'CDT Banco Nacional 6 Meses',
          value: 5000000,
          rate: 7.2,
          withdrawal_date: '2025-06-30',
          duration: 180,
          issuer: 'Banco Nacional',
        },
        {
          name: 'CDT TRI Trimestral',
          value: 15000000,
          rate: 9.0,
          withdrawal_date: '2026-01-15',
          duration: 90,
          issuer: 'TRI',
        },
        {
          name: 'CDT Banco de Bogotá 9 Meses',
          value: 8000000,
          rate: 7.8,
          withdrawal_date: '2025-09-15',
          duration: 270,
          issuer: 'Banco de Bogotá',
        },
        {
          name: 'CDT Corto Plazo Mensual',
          value: 3000000,
          rate: 6.5,
          withdrawal_date: '2025-03-31',
          duration: 30,
          issuer: 'Banco Popular',
        },
        {
          name: 'CDT Bancolombia 60 Días',
          value: 12000000,
          rate: 7.5,
          withdrawal_date: '2025-04-30',
          duration: 60,
          issuer: 'Bancolombia',
        },
        {
          name: 'CDT Davivienda Semestral',
          value: 6000000,
          rate: 8.0,
          withdrawal_date: '2025-07-15',
          duration: 180,
          issuer: 'Davivienda',
        },
        {
          name: 'CDT BBVA 120 Días',
          value: 7000000,
          rate: 7.3,
          withdrawal_date: '2025-05-20',
          duration: 120,
          issuer: 'BBVA',
        },
      ]

      for (const cdt of demoCDTs) {
        await api.createCDT(cdt)
      }

      const response = await api.getCDTs()
      if (response.cdts && Array.isArray(response.cdts)) {
        const mappedCDTs = response.cdts.map(mapCDTFromAPI)
        setCDTs(mappedCDTs)
      }
      setIsDebugModalOpen(false)
      showNotification('CDTs demo creados exitosamente', 'success')
    } catch (err: any) {
      console.error('Error al crear CDTs demo:', err)
      const errorMessage =
        err.data?.error ||
        err.data?.message ||
        'Error al crear los CDTs demo. Por favor, intenta de nuevo.'
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAllCDTs = async () => {
    if (
      window.confirm(
        '¿Estás seguro de que quieres eliminar TODOS los CDTs? Esta acción es irreversible.'
      )
    ) {
      try {
        setIsLoading(true)
        await api.deleteAllCDTs()
        setCDTs([])
        setIsDebugModalOpen(false)
        showNotification('Todos los CDTs han sido eliminados', 'success')
      } catch (err: any) {
        console.error('Error al eliminar todos los CDTs:', err)
        const errorMessage =
          err.data?.error ||
          err.data?.message ||
          'Error al eliminar los CDTs. Por favor, intenta de nuevo.'
        showNotification(errorMessage, 'error')
      } finally {
        setIsLoading(false)
      }
    }
  }

  if (isLoading && cdts.length === 0) {
    return (
      <div className="app-page-container">
        <div className="app-page-content">
          <div className="loading-container">
            <p>Cargando CDTs...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="app-page-container">
        <div className="app-page-content cdts-content">
          {/* Toolbar */}
          <div className="cdts-toolbar">
            <button
              className="cdts-toolbar-button"
              onClick={() => navigate('/finanzas')}
              aria-label="Volver a Finanzas"
              type="button"
            >
              <ArrowBackIcon className="cdts-toolbar-icon" />
            </button>
            <div className="cdts-toolbar-menu-container" ref={menuRef}>
              <button
                className="cdts-toolbar-button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Opciones"
                aria-expanded={isMenuOpen}
                type="button"
              >
                <MoreVertIcon className="cdts-toolbar-icon" />
              </button>
              {isMenuOpen && (
                <div className="cdts-menu">
                  <button
                    className="cdts-menu-item"
                    onClick={() => {
                      setIsMenuOpen(false)
                      handleOpenModal()
                    }}
                    type="button"
                  >
                    <AddIcon className="cdts-menu-icon" />
                    <span>Agregar CDT</span>
                  </button>
                  {api.isTestUser() && (
                    <button
                      className="cdts-menu-item"
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

          <h1 className="cdts-page-title">CDTs</h1>
          <p className="cdts-page-subtitle">Certificados de Depósito a Término</p>

          {/* Lista de CDTs */}
          <div className="cdts-list">
            {cdts.length === 0 ? (
              <div className="cdts-empty">
                <AccountBalanceWalletIcon className="cdts-empty-icon" />
                <p className="cdts-empty-text">No hay CDTs registrados</p>
                <button className="cdts-empty-button" onClick={handleOpenModal} type="button">
                  <AddIcon />
                  <span>Agregar</span>
                </button>
              </div>
            ) : (
              <div className="cdts-group">
                {cdts.map(cdt => (
                  <button
                    key={cdt.id}
                    className="cdts-row"
                    onClick={() => handleOpenDetailModal(cdt)}
                    type="button"
                  >
                    <div className="cdts-row-content">
                      <div className="cdts-row-header">
                        <h3 className="cdts-row-title">{cdt.nombre}</h3>
                        <ChevronRightIcon className="cdts-row-chevron" aria-hidden="true" />
                      </div>
                      <p className="cdts-row-subtitle">
                        {formatCurrency(cdt.valor)} • {cdt.tasa}% anual
                        {cdt.emisor && ` • ${cdt.emisor}`}
                        {cdt.duracion && ` • ${cdt.duracion} días`}
                      </p>
                      {cdt.duracion && (
                        <div className="cdts-progress-container">
                          <div className="cdts-progress-bar">
                            <div
                              className="cdts-progress-fill"
                              style={{ width: `${calculateProgress(cdt)}%` }}
                            />
                          </div>
                          <span className="cdts-progress-text">
                            {calculateProgress(cdt)}% completado
                          </span>
                        </div>
                      )}
                      <div className="cdts-row-info">
                        <p className="cdts-row-date">Retiro: {formatDate(cdt.fechaRetiro)}</p>
                        {cdt.created_at && (
                          <p className="cdts-row-gain">
                            Ganancia real: {formatCurrency(calculateInflationAdjustedGain(cdt))}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botón flotante para agregar */}
          {cdts.length > 0 && (
            <button
              className="cdts-fab"
              onClick={handleOpenModal}
              aria-label="Agregar CDT"
              type="button"
            >
              <AddIcon />
            </button>
          )}
        </div>
      </div>

      {/* Modal para crear/editar CDT */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nuevo CDT</h2>
              <button
                className="modal-close"
                onClick={handleCloseModal}
                aria-label="Cerrar modal"
                type="button"
              >
                ×
              </button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="nombre" className="form-label">
                  Nombre
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className={`form-input ${formErrors.nombre ? 'input-error' : ''}`}
                  placeholder="Ej: CDT Banco Popular"
                  required
                />
                {formErrors.nombre && (
                  <span className="error-message" role="alert">
                    {formErrors.nombre}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="valor" className="form-label">
                  Valor (COP)
                </label>
                <input
                  type="number"
                  id="valor"
                  name="valor"
                  value={formData.valor}
                  onChange={handleChange}
                  className={`form-input ${formErrors.valor ? 'input-error' : ''}`}
                  placeholder="10000000"
                  min="0"
                  step="1000"
                  required
                />
                {formErrors.valor && (
                  <span className="error-message" role="alert">
                    {formErrors.valor}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="tasa" className="form-label">
                  Tasa de Interés (% anual)
                </label>
                <input
                  type="number"
                  id="tasa"
                  name="tasa"
                  value={formData.tasa}
                  onChange={handleChange}
                  className={`form-input ${formErrors.tasa ? 'input-error' : ''}`}
                  placeholder="8.5"
                  min="0"
                  step="0.1"
                  required
                />
                {formErrors.tasa && (
                  <span className="error-message" role="alert">
                    {formErrors.tasa}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="fechaRetiro" className="form-label">
                  Fecha de Retiro
                </label>
                <input
                  type="date"
                  id="fechaRetiro"
                  name="fechaRetiro"
                  value={formData.fechaRetiro}
                  onChange={handleChange}
                  className={`form-input ${formErrors.fechaRetiro ? 'input-error' : ''}`}
                  required
                />
                {formErrors.fechaRetiro && (
                  <span className="error-message" role="alert">
                    {formErrors.fechaRetiro}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="duracion" className="form-label">
                  Duración (días) - Opcional
                </label>
                <input
                  type="number"
                  id="duracion"
                  name="duracion"
                  value={formData.duracion}
                  onChange={handleChange}
                  className={`form-input ${formErrors.duracion ? 'input-error' : ''}`}
                  placeholder="Ej: 30, 90, 180, 365"
                  min="1"
                  step="1"
                />
                {formErrors.duracion && (
                  <span className="error-message" role="alert">
                    {formErrors.duracion}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="emisor" className="form-label">
                  Emisor - Opcional
                </label>
                <input
                  type="text"
                  id="emisor"
                  name="emisor"
                  value={formData.emisor}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ej: Banco Popular, TRI, Banco de Bogotá"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-button secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="modal-button primary" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalle */}
      {isDetailModalOpen && selectedCDT && !isEditMode && (
        <div className="modal-overlay" onClick={handleCloseDetailModal}>
          <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedCDT.nombre}</h2>
              <button
                className="modal-close"
                onClick={handleCloseDetailModal}
                aria-label="Cerrar modal"
                type="button"
              >
                ×
              </button>
            </div>

            <div className="detail-content">
              <div className="detail-section">
                <div className="detail-info">
                  <h3 className="detail-name">{selectedCDT.nombre}</h3>
                </div>
              </div>

              <div className="detail-row">
                <span className="detail-label">Valor</span>
                <span className="detail-value">{formatCurrency(selectedCDT.valor)}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Tasa de Interés</span>
                <span className="detail-value">{selectedCDT.tasa}% anual</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Fecha de Retiro</span>
                <span className="detail-value">{formatDate(selectedCDT.fechaRetiro)}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Duración</span>
                <span className="detail-value">
                  {selectedCDT.duracion ? `${selectedCDT.duracion} días` : 'No especificada'}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Emisor</span>
                <span className="detail-value">{selectedCDT.emisor || 'No especificado'}</span>
              </div>
            </div>

            <div className="detail-actions">
              <button
                type="button"
                className="detail-action-button"
                onClick={handleEditClick}
                aria-label="Editar CDT"
              >
                <EditIcon />
                <span>Editar</span>
              </button>
              <button
                type="button"
                className="detail-action-button danger"
                onClick={handleDeleteClick}
                aria-label="Eliminar CDT"
              >
                <DeleteIcon />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {isDetailModalOpen && selectedCDT && isEditMode && (
        <div className="modal-overlay edit-modal-overlay" onClick={handleCloseDetailModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Editar CDT</h2>
              <button
                className="modal-close"
                onClick={handleCloseDetailModal}
                aria-label="Cerrar modal"
                type="button"
              >
                ×
              </button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="edit-nombre" className="form-label">
                  Nombre
                </label>
                <input
                  type="text"
                  id="edit-nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className={`form-input ${formErrors.nombre ? 'input-error' : ''}`}
                  placeholder="Ej: CDT Banco Popular"
                  required
                />
                {formErrors.nombre && (
                  <span className="error-message" role="alert">
                    {formErrors.nombre}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="edit-valor" className="form-label">
                  Valor (COP)
                </label>
                <input
                  type="number"
                  id="edit-valor"
                  name="valor"
                  value={formData.valor}
                  onChange={handleChange}
                  className={`form-input ${formErrors.valor ? 'input-error' : ''}`}
                  placeholder="10000000"
                  min="0"
                  step="1000"
                  required
                />
                {formErrors.valor && (
                  <span className="error-message" role="alert">
                    {formErrors.valor}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="edit-tasa" className="form-label">
                  Tasa de Interés (% anual)
                </label>
                <input
                  type="number"
                  id="edit-tasa"
                  name="tasa"
                  value={formData.tasa}
                  onChange={handleChange}
                  className={`form-input ${formErrors.tasa ? 'input-error' : ''}`}
                  placeholder="8.5"
                  min="0"
                  step="0.1"
                  required
                />
                {formErrors.tasa && (
                  <span className="error-message" role="alert">
                    {formErrors.tasa}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="edit-fechaRetiro" className="form-label">
                  Fecha de Retiro
                </label>
                <input
                  type="date"
                  id="edit-fechaRetiro"
                  name="fechaRetiro"
                  value={formData.fechaRetiro}
                  onChange={handleChange}
                  className={`form-input ${formErrors.fechaRetiro ? 'input-error' : ''}`}
                  required
                />
                {formErrors.fechaRetiro && (
                  <span className="error-message" role="alert">
                    {formErrors.fechaRetiro}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="edit-duracion" className="form-label">
                  Duración (días) - Opcional
                </label>
                <input
                  type="number"
                  id="edit-duracion"
                  name="duracion"
                  value={formData.duracion}
                  onChange={handleChange}
                  className={`form-input ${formErrors.duracion ? 'input-error' : ''}`}
                  placeholder="Ej: 30, 90, 180, 365"
                  min="1"
                  step="1"
                />
                {formErrors.duracion && (
                  <span className="error-message" role="alert">
                    {formErrors.duracion}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="edit-emisor" className="form-label">
                  Emisor - Opcional
                </label>
                <input
                  type="text"
                  id="edit-emisor"
                  name="emisor"
                  value={formData.emisor}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ej: Banco Popular, TRI, Banco de Bogotá"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-button secondary"
                  onClick={handleCloseDetailModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="modal-button primary" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Debug */}
      {isDebugModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDebugModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Debug - CDTs</h2>
              <button
                className="modal-close"
                onClick={() => setIsDebugModalOpen(false)}
                aria-label="Cerrar modal"
                type="button"
              >
                ×
              </button>
            </div>
            <div className="debug-modal-content">
              <div className="debug-options">
                <button
                  className="debug-option-button create-demo"
                  onClick={handleDebugCreateCDTs}
                  disabled={isLoading}
                  type="button"
                >
                  <span className="debug-option-icon">📦</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Crear CDTs Demo</h3>
                    <p className="debug-option-description">
                      Crea 8 CDTs de ejemplo con duración y emisor variados para pruebas
                    </p>
                  </div>
                </button>
                <button
                  className="debug-option-button delete-all"
                  onClick={handleDeleteAllCDTs}
                  disabled={isLoading}
                  type="button"
                >
                  <span className="debug-option-icon">🗑️</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Eliminar Todos los CDTs</h3>
                    <p className="debug-option-description">
                      ⚠️ PELIGROSO: Elimina todos los CDTs (IRREVERSIBLE)
                    </p>
                  </div>
                </button>
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-button secondary"
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

export default CDTs
