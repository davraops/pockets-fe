import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import CalculateIcon from '@mui/icons-material/Calculate'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import RestoreIcon from '@mui/icons-material/Restore'
import ArchiveIcon from '@mui/icons-material/Archive'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { api } from '../services/api'
import './AppPage.css'
import './Presupuestos.css'

// Interfaz que coincide con la respuesta de la API
interface BudgetAPI {
  id: string
  name: string
  max_amount: number
  total_spent: number
  remaining: number
  is_over_budget: boolean
  percentage_used: number
  status?: 'active' | 'deleted'
  periodicity?: 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'
  created_at: string
  updated_at: string
}

// Interfaz para uso interno del componente
interface Budget {
  id: string
  nombre: string
  montoMaximo: number
  totalGastado: number
  restante: number
  sobrePresupuesto: boolean
  porcentajeUsado: number
  periodicidad: 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'
}

function Presupuestos() {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeletedBudgetsModalOpen, setIsDeletedBudgetsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [deletedBudgets, setDeletedBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDeleted, setIsLoadingDeleted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projectBudgetIds, setProjectBudgetIds] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState({
    nombre: '',
    montoMaximo: '',
    periodicidad: 'mensual' as 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'
  })
  const [formErrors, setFormErrors] = useState({
    nombre: '',
    montoMaximo: ''
  })

  // Mapear presupuesto de API a formato interno
  const mapBudgetFromAPI = (apiBudget: BudgetAPI): Budget => {
    const periodicidad = apiBudget.periodicity || 'mensual'
    const months = getMonthsFromPeriodicity(periodicidad)
    // El API almacena el valor mensual, pero mostramos el total del período
    const montoTotalPeriodo = apiBudget.max_amount * months
    
    return {
      id: apiBudget.id,
      nombre: apiBudget.name,
      montoMaximo: montoTotalPeriodo, // Mostrar el total del período
      totalGastado: apiBudget.total_spent,
      restante: apiBudget.remaining,
      sobrePresupuesto: apiBudget.is_over_budget,
      porcentajeUsado: apiBudget.percentage_used,
      periodicidad: periodicidad
    }
  }

  // Cargar proyectos para identificar presupuestos asociados
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await api.getProjects()
        if (response.projects && Array.isArray(response.projects)) {
          // Crear un Set con los budget_ids de los proyectos activos
          const budgetIds = new Set<string>()
          response.projects.forEach((project: any) => {
            if (project.budget_id) {
              budgetIds.add(project.budget_id)
            }
          })
          setProjectBudgetIds(budgetIds)
        }
      } catch (err: any) {
        console.error('Error al cargar proyectos:', err)
        // No mostrar error al usuario, solo continuar sin la información de proyectos
      }
    }

    loadProjects()
  }, [])

  // Función para recargar presupuestos
  const reloadBudgets = async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('Recargando presupuestos...')
      const response = await api.getBudgets()
      console.log('Respuesta de presupuestos:', response)
      if (response.budgets && Array.isArray(response.budgets)) {
        const mappedBudgets = response.budgets.map(mapBudgetFromAPI)
        console.log('Presupuestos mapeados:', mappedBudgets)
        setBudgets(mappedBudgets)
      } else {
        setBudgets([])
      }
    } catch (err: any) {
      console.error('Error al cargar presupuestos:', err)
      setError('Frontend says: Error al cargar los presupuestos. Por favor, intenta de nuevo.')
      setBudgets([])
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar presupuestos desde la API
  useEffect(() => {
    reloadBudgets()
  }, [])

  // Escuchar eventos de actualización de presupuestos desde otras páginas
  useEffect(() => {
    const handleBudgetsUpdated = (event: Event) => {
      console.log('Evento budgetsUpdated recibido, recargando presupuestos...', event)
      console.log('Timestamp del evento:', new Date().toISOString())
      reloadBudgets()
    }

    console.log('Registrando listener para budgetsUpdated en Presupuestos')
    window.addEventListener('budgetsUpdated', handleBudgetsUpdated)

    return () => {
      console.log('Removiendo listener para budgetsUpdated en Presupuestos')
      window.removeEventListener('budgetsUpdated', handleBudgetsUpdated)
    }
  }, [reloadBudgets])

  // Función para verificar si un presupuesto está asociado a un proyecto
  const isBudgetAssociatedWithProject = (budgetId: string): boolean => {
    return projectBudgetIds.has(budgetId)
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      nombre: '',
      montoMaximo: '',
      periodicidad: 'mensual'
    })
    setFormErrors({
      nombre: '',
      montoMaximo: ''
    })
  }

  const handleOpenDetailModal = (budget: Budget) => {
    setSelectedBudget(budget)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
    setFormData({
      nombre: budget.nombre,
      montoMaximo: budget.montoMaximo.toString(),
      periodicidad: budget.periodicidad
    })
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setIsDeleteModalOpen(false)
    setSelectedBudget(null)
    setIsEditMode(false)
    setFormData({
      nombre: '',
      montoMaximo: '',
      periodicidad: 'mensual'
    })
    setFormErrors({
      nombre: '',
      montoMaximo: ''
    })
  }

  const handleEditClick = () => {
    setIsEditMode(true)
  }

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true)
  }

  const handleSoftDelete = async () => {
    if (!selectedBudget) return
    
    if (window.confirm('¿Estás seguro de que quieres eliminar este presupuesto? (Soft Delete - Se puede restaurar)')) {
      try {
        await api.deleteBudget(selectedBudget.id)
        await reloadBudgets()
        setIsDeleteModalOpen(false)
        handleCloseDetailModal()
        alert('Presupuesto eliminado (soft delete). Puedes restaurarlo más tarde.')
      } catch (err: any) {
        console.error('Error al eliminar presupuesto:', err)
        alert('Frontend says: Error al eliminar el presupuesto. Por favor, intenta de nuevo.')
      }
    }
  }

  const handleHardDelete = async () => {
    if (!selectedBudget) return
    
    const confirmMessage = `⚠️ ADVERTENCIA CRÍTICA ⚠️\n\n` +
      `Estás a punto de realizar un HARD DELETE. Esta acción es IRREVERSIBLE y eliminará:\n` +
      `- El presupuesto "${selectedBudget.nombre}"\n` +
      `- TODAS las transacciones asociadas a este presupuesto\n` +
      `- Los balances de las cuentas se actualizarán automáticamente\n\n` +
      `¿Estás ABSOLUTAMENTE seguro de que quieres continuar?\n\n` +
      `Escribe "ELIMINAR" para confirmar:`
    
    const userInput = window.prompt(confirmMessage)
    
    if (userInput === 'ELIMINAR') {
      try {
        setIsLoading(true)
        const response = await api.hardDeleteBudget(selectedBudget.id)
        await reloadBudgets()
        setIsDeleteModalOpen(false)
        handleCloseDetailModal()
        const deletedCount = response.deleted_transactions_count || 0
        alert(`Presupuesto eliminado permanentemente.\n${deletedCount} transacción(es) asociada(s) también fueron eliminadas.`)
      } catch (err: any) {
        console.error('Error al eliminar presupuesto:', err)
        alert('Backend says: ' + (err.data?.error || 'Error desconocido'))
      } finally {
        setIsLoading(false)
      }
    } else if (userInput !== null) {
      alert('Frontend says: Confirmación incorrecta. La eliminación fue cancelada.')
    }
  }

  const validateForm = async (): Promise<boolean> => {
    const errors = {
      nombre: '',
      montoMaximo: ''
    }
    let isValid = true

    // Validar nombre único
    try {
      const allBudgets = await api.getBudgets()
      if (allBudgets.budgets && Array.isArray(allBudgets.budgets)) {
        const nombreExists = allBudgets.budgets.some((b: any) => 
          b.name.toLowerCase() === formData.nombre.toLowerCase().trim() &&
          (!isEditMode || b.id !== selectedBudget?.id)
        )
        if (nombreExists) {
          errors.nombre = 'Este nombre ya está en uso'
          isValid = false
        }
      }
    } catch (err) {
      console.error('Error al validar:', err)
      // Continuar con la validación local como fallback
      const nombreExists = budgets.some(b => 
        b.nombre.toLowerCase() === formData.nombre.toLowerCase().trim() &&
        (!isEditMode || b.id !== selectedBudget?.id)
      )
      if (nombreExists) {
        errors.nombre = 'Este nombre ya está en uso'
        isValid = false
      }
    }

    // Validar monto máximo
    const monto = parseFloat(formData.montoMaximo)
    if (isNaN(monto) || monto <= 0) {
      errors.montoMaximo = 'El monto máximo debe ser mayor a 0'
      isValid = false
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
      const montoMaximo = parseFloat(formData.montoMaximo)
      // Dividir el monto entre los meses según la periodicidad antes de enviarlo
      const months = getMonthsFromPeriodicity(formData.periodicidad)
      const montoMensual = montoMaximo / months

      if (isEditMode && selectedBudget) {
        // Editar presupuesto existente
        await api.updateBudget(selectedBudget.id, {
          name: formData.nombre.trim(),
          max_amount: montoMensual,
          periodicity: formData.periodicidad
        })
        
        // Recargar presupuestos después de actualizar
        const response = await api.getBudgets()
        if (response.budgets && Array.isArray(response.budgets)) {
          const mappedBudgets = response.budgets.map(mapBudgetFromAPI)
          setBudgets(mappedBudgets)
        }
        handleCloseDetailModal()
      } else {
        // Agregar nuevo presupuesto
        await api.createBudget({
          name: formData.nombre.trim(),
          max_amount: montoMensual,
          periodicity: formData.periodicidad
        })

        // Recargar presupuestos después de crear
        const response = await api.getBudgets()
        if (response.budgets && Array.isArray(response.budgets)) {
          const mappedBudgets = response.budgets.map(mapBudgetFromAPI)
          setBudgets(mappedBudgets)
        }
        handleCloseModal()
      }
    } catch (err: any) {
      console.error('Error al guardar presupuesto:', err)
      const errorMessage = err.data?.error 
        ? `Backend says: ${err.data.error}` 
        : 'Frontend says: Error al guardar el presupuesto. Por favor, intenta de nuevo.'
      alert(errorMessage)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Limpiar errores cuando el usuario empiece a escribir
    if (formErrors[e.target.name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [e.target.name]: ''
      })
    }
  }

  // Función para obtener el número de meses según la periodicidad
  const getMonthsFromPeriodicity = (periodicidad: string): number => {
    const monthsMap: Record<string, number> = {
      'mensual': 1,
      'bimestral': 2,
      'trimestral': 3,
      'semestral': 6,
      'anual': 12
    }
    return monthsMap[periodicidad] || 1
  }

  // Función para calcular el valor mensual equivalente
  const calculateMonthlyAmount = (montoMaximo: number, periodicidad: string): number => {
    const months = getMonthsFromPeriodicity(periodicidad)
    return montoMaximo / months
  }

  // Función para obtener el label de periodicidad
  const getPeriodicityLabel = (periodicidad: string): string => {
    const labels: Record<string, string> = {
      'mensual': 'Mensual',
      'bimestral': 'Bimestral',
      'trimestral': 'Trimestral',
      'semestral': 'Semestral',
      'anual': 'Anual'
    }
    return labels[periodicidad] || 'Mensual'
  }

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(balance)
  }

  // Paleta de 32 colores para presupuestos
  const budgetColorPalette = [
    '#34C759', // Verde
    '#007AFF', // Azul
    '#FF9500', // Naranja
    '#FF3B30', // Rojo
    '#AF52DE', // Púrpura
    '#FF2D55', // Rosa
    '#5AC8FA', // Azul claro
    '#FFCC00', // Amarillo
    '#32D74B', // Verde claro
    '#0A84FF', // Azul oscuro
    '#FF6B35', // Naranja rojizo
    '#FF375F', // Rojo claro
    '#BF5AF2', // Púrpura claro
    '#FF6482', // Rosa claro
    '#64D2FF', // Azul cielo
    '#FFD60A', // Amarillo dorado
    '#30D158', // Verde esmeralda
    '#0071E3', // Azul marino
    '#FF8C00', // Naranja oscuro
    '#FF453A', // Rojo coral
    '#9D4EDD', // Púrpura oscuro
    '#FF1744', // Rojo intenso
    '#00C7BE', // Turquesa
    '#FFB800', // Amarillo oscuro
    '#00D9FF', // Cian
    '#5856D6', // Índigo
    '#FF9500', // Naranja
    '#FF3B30', // Rojo
    '#FF6B9D', // Rosa salmón
    '#C7CE00', // Lima
    '#FF9500', // Naranja
    '#00E676'  // Verde neón
  ]

  // Función para obtener un color único basado en el ID del presupuesto
  const getBudgetColorFromPalette = (budgetId: string): string => {
    // Convertir el ID a un número usando hash simple
    let hash = 0
    for (let i = 0; i < budgetId.length; i++) {
      hash = budgetId.charCodeAt(i) + ((hash << 5) - hash)
    }
    // Usar el hash para seleccionar un color de la paleta
    const index = Math.abs(hash) % budgetColorPalette.length
    return budgetColorPalette[index]
  }

  // Función para obtener el color de la barra de progreso basado en el porcentaje
  const getProgressColor = (percentage: number, isOver: boolean): string => {
    if (isOver) return '#FF3B30' // Rojo si está sobre presupuesto
    if (percentage >= 80) return '#FF9500' // Naranja si está cerca del límite
    if (percentage >= 50) return '#FFCC00' // Amarillo si está a la mitad
    return '#34C759' // Verde si está bien
  }

  // Función combinada para obtener el color del presupuesto (mantiene compatibilidad)
  const getBudgetColor = (percentage: number, isOver: boolean, budgetId?: string): string => {
    // Si se proporciona un ID, usar la paleta de colores
    if (budgetId) {
      return getBudgetColorFromPalette(budgetId)
    }
    // Fallback al comportamiento anterior
    return getProgressColor(percentage, isOver)
  }

  // Calcular el total de todos los presupuestos
  const calculateTotalBudgets = (): number => {
    return budgets.reduce((total, budget) => {
      return total + budget.montoMaximo
    }, 0)
  }

  // Calcular el total gastado
  const calculateTotalSpent = (): number => {
    return budgets.reduce((total, budget) => {
      return total + budget.totalGastado
    }, 0)
  }

  // Cargar presupuestos eliminados
  const loadDeletedBudgets = async () => {
    setIsLoadingDeleted(true)
    try {
      const response = await api.getBudgets(null, true)
      if (response.budgets && Array.isArray(response.budgets)) {
        // Filtrar solo los eliminados
        const deleted = response.budgets
          .filter((budget: BudgetAPI) => budget.status === 'deleted')
          .map(mapBudgetFromAPI)
        setDeletedBudgets(deleted)
      } else {
        setDeletedBudgets([])
      }
    } catch (err: any) {
      console.error('Error al cargar presupuestos eliminados:', err)
      setDeletedBudgets([])
    } finally {
      setIsLoadingDeleted(false)
    }
  }

  // Abrir modal de presupuestos eliminados
  const handleOpenDeletedBudgetsModal = async () => {
    setIsDeletedBudgetsModalOpen(true)
    await loadDeletedBudgets()
  }

  // Restaurar presupuesto
  const handleRestoreBudget = async (budgetId: string) => {
    if (window.confirm('¿Estás seguro de que quieres restaurar este presupuesto?')) {
      try {
        await api.restoreBudget(budgetId)
        await reloadBudgets()
        await loadDeletedBudgets()
        alert('Presupuesto restaurado exitosamente')
      } catch (err: any) {
        console.error('Error al restaurar presupuesto:', err)
        alert('Backend says: ' + (err.data?.error || 'Error desconocido'))
      }
    }
  }

  // Función para crear presupuestos demo
  const handleCreateDemoBudgets = async () => {
    const demoBudgets = [
      { name: 'Compras Mensuales', max_amount: 500000 },
      { name: 'Entretenimiento', max_amount: 200000 },
      { name: 'Transporte', max_amount: 300000 },
      { name: 'Comida', max_amount: 800000 },
      { name: 'Servicios', max_amount: 400000 },
      { name: 'Ropa', max_amount: 250000 },
      { name: 'Salud', max_amount: 150000 },
      { name: 'Educación', max_amount: 600000 }
    ]

    try {
      setIsLoading(true)
      for (const budget of demoBudgets) {
        await api.createBudget(budget)
      }
      await reloadBudgets()
      setIsDebugModalOpen(false)
      alert('Presupuestos demo creados exitosamente')
    } catch (err: any) {
      console.error('Error al crear presupuestos demo:', err)
      alert('Backend says: ' + (err.data?.error || 'Error desconocido'))
    } finally {
      setIsLoading(false)
    }
  }

  // Función para eliminar todos los presupuestos (soft delete)
  const handleDeleteAllBudgets = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar TODOS los presupuestos? (Soft Delete - Se pueden restaurar)')) {
      try {
        setIsLoading(true)
        await api.deleteAllBudgets()
        await reloadBudgets()
        setIsDebugModalOpen(false)
        alert('Todos los presupuestos han sido eliminados (soft delete). Puedes restaurarlos más tarde.')
      } catch (err: any) {
        console.error('Error al eliminar todos los presupuestos:', err)
        alert('Backend says: ' + (err.data?.error || 'Error desconocido'))
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Función para hard delete de todos los presupuestos
  const handleHardDeleteAllBudgets = async () => {
    const confirmMessage = `⚠️ ADVERTENCIA CRÍTICA ⚠️\n\n` +
      `Estás a punto de realizar un HARD DELETE de TODOS los presupuestos. Esta acción es IRREVERSIBLE y eliminará:\n` +
      `- TODOS los presupuestos\n` +
      `- TODAS las transacciones asociadas a presupuestos\n` +
      `- Los balances de las cuentas se actualizarán automáticamente\n\n` +
      `¿Estás ABSOLUTAMENTE seguro de que quieres continuar?\n\n` +
      `Escribe "ELIMINAR TODO" para confirmar:`
    
    const userInput = window.prompt(confirmMessage)
    
    if (userInput === 'ELIMINAR TODO') {
      try {
        setIsLoading(true)
        await api.hardDeleteAllBudgets()
        await reloadBudgets()
        setIsDebugModalOpen(false)
        alert('Todos los presupuestos y sus transacciones asociadas han sido eliminados permanentemente.')
      } catch (err: any) {
        console.error('Error al eliminar todos los presupuestos:', err)
        alert('Backend says: ' + (err.data?.error || 'Error desconocido'))
      } finally {
        setIsLoading(false)
      }
    } else if (userInput !== null) {
      alert('Frontend says: Confirmación incorrecta. La eliminación fue cancelada.')
    }
  }

  return (
    <>
      <div className="app-page-container">
        <div className="app-page-content presupuestos-content">
          {isLoading ? (
            <div className="loader-container">
              <div className="loader">
                <div className="loader-spinner"></div>
                <p className="loader-text">Cargando presupuestos...</p>
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
              {/* Resumen de presupuestos */}
              <div className="budgets-summary-block">
                <div className="summary-item">
                  <span className="summary-label">Total Presupuestado</span>
                  <span className="summary-value">{formatBalance(calculateTotalBudgets())}</span>
                </div>
                <div className="summary-separator"></div>
                <div className="summary-item">
                  <span className="summary-label">Total Gastado</span>
                  <span className="summary-value">{formatBalance(calculateTotalSpent())}</span>
                </div>
                <div className="summary-separator"></div>
                <div className="summary-item">
                  <span className="summary-label">Disponible</span>
                  <span className="summary-value available">{formatBalance(calculateTotalBudgets() - calculateTotalSpent())}</span>
                </div>
              </div>

              <div className="presupuestos-header">
                <button className="add-budget-button" onClick={handleOpenModal}>
                  <AddIcon />
                  <span>Agregar Presupuesto</span>
                </button>
                {api.isTestUser() && (
                  <button className="debug-button" onClick={() => setIsDebugModalOpen(true)} title="Debug: Opciones de desarrollo">
                    🐛 Debug
                  </button>
                )}
              </div>

              {budgets.length === 0 ? (
                <>
                  <div className="empty-state">
                    <CalculateIcon className="empty-icon" />
                    <p className="empty-text">No hay presupuestos agregados</p>
                    <p className="empty-subtext">Agrega tu primer presupuesto</p>
                  </div>
                  <div className="deleted-budgets-button-container">
                    <button className="view-deleted-button" onClick={handleOpenDeletedBudgetsModal}>
                      <ArchiveIcon />
                      <span>Ver Presupuestos Eliminados</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="budgets-grid">
                    {budgets.map((budget) => {
                      const budgetColor = getBudgetColor(budget.porcentajeUsado, budget.sobrePresupuesto, budget.id)
                      const progressColor = getProgressColor(budget.porcentajeUsado, budget.sobrePresupuesto)
                      return (
                        <div 
                          key={budget.id} 
                          className="budget-card" 
                          onClick={() => handleOpenDetailModal(budget)}
                          style={{ '--budget-color': budgetColor } as React.CSSProperties}
                        >
                          <div className="budget-card-header">
                            <div className="budget-icon" style={{ backgroundColor: budgetColor }}>
                              <CalculateIcon />
                            </div>
                            <div className="budget-info">
                              <h3 className="budget-name">{budget.nombre}</h3>
                              <p className="budget-status">
                                {budget.sobrePresupuesto ? 'Sobre presupuesto' : `${budget.porcentajeUsado.toFixed(1)}% usado`}
                              </p>
                              <p className="budget-periodicity">
                                {getPeriodicityLabel(budget.periodicidad)}
                                {budget.periodicidad !== 'mensual' && (
                                  <span className="budget-monthly-equivalent">
                                    {' '}• {formatBalance(calculateMonthlyAmount(budget.montoMaximo, budget.periodicidad))}/mes
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="budget-card-body">
                          <div className="budget-progress-bar">
                            <div 
                              className="budget-progress-fill" 
                              style={{ 
                                width: `${Math.min(budget.porcentajeUsado, 100)}%`,
                                backgroundColor: progressColor
                              }}
                            ></div>
                          </div>
                            <div className="budget-amounts">
                              <div className="budget-amount-item">
                                <span className="budget-amount-label">
                                  {isBudgetAssociatedWithProject(budget.id) ? 'Ahorrado' : 'Gastado'}
                                </span>
                                <span className="budget-amount-value spent">{formatBalance(budget.totalGastado)}</span>
                              </div>
                              <div className="budget-amount-item">
                                <span className="budget-amount-label">Restante</span>
                                <span className="budget-amount-value remaining">{formatBalance(budget.restante)}</span>
                              </div>
                            </div>
                            <div className="budget-max">
                              <span className="budget-max-label">Máximo ({getPeriodicityLabel(budget.periodicidad)})</span>
                              <span className="budget-max-value">{formatBalance(budget.montoMaximo)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="deleted-budgets-button-container">
                    <button className="view-deleted-button" onClick={handleOpenDeletedBudgetsModal}>
                      <ArchiveIcon />
                      <span>Ver Presupuestos Eliminados</span>
                    </button>
                  </div>
                </>
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

      {/* Modal para agregar presupuesto */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nuevo Presupuesto</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="nombre">Nombre</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Compras Mensuales"
                  className={formErrors.nombre ? 'input-error' : ''}
                />
                {formErrors.nombre && (
                  <span className="error-message">{formErrors.nombre}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="periodicidad">Periodicidad</label>
                <select
                  id="periodicidad"
                  name="periodicidad"
                  value={formData.periodicidad}
                  onChange={handleChange}
                  required
                  className="form-select"
                >
                  <option value="mensual">Mensual</option>
                  <option value="bimestral">Bimestral (2 meses)</option>
                  <option value="trimestral">Trimestral (3 meses)</option>
                  <option value="semestral">Semestral (6 meses)</option>
                  <option value="anual">Anual (12 meses)</option>
                </select>
                <p className="form-hint">
                  El monto se dividirá entre los meses del período. Ejemplo: Bimestral de 1,000,000 = 500,000/mes
                </p>
              </div>
              <div className="form-group">
                <label htmlFor="montoMaximo">Monto Máximo</label>
                <input
                  type="number"
                  id="montoMaximo"
                  name="montoMaximo"
                  value={formData.montoMaximo}
                  onChange={handleChange}
                  required
                  step="1"
                  min="1"
                  placeholder="0"
                  className={formErrors.montoMaximo ? 'input-error' : ''}
                />
                {formData.montoMaximo && !formErrors.montoMaximo && formData.periodicidad !== 'mensual' && (
                  <p className="form-hint monthly-preview">
                    Equivale a <strong>{formatBalance(calculateMonthlyAmount(parseFloat(formData.montoMaximo) || 0, formData.periodicidad))}</strong> por mes
                  </p>
                )}
                {formErrors.montoMaximo && (
                  <span className="error-message">{formErrors.montoMaximo}</span>
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
      {isDetailModalOpen && selectedBudget && (
        <div className="modal-overlay" onClick={handleCloseDetailModal}>
          <div 
            className="modal-content detail-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{ '--budget-color': getBudgetColor(selectedBudget.porcentajeUsado, selectedBudget.sobrePresupuesto, selectedBudget.id) } as React.CSSProperties}
          >
            <div className="modal-header">
              <h2 className="modal-title">Detalles del Presupuesto</h2>
              <button className="modal-close" onClick={handleCloseDetailModal}>×</button>
            </div>
            
            {!isEditMode ? (
              <>
                <div className="detail-content">
                  <div className="detail-section">
                    <div className="detail-icon-large" style={{ backgroundColor: getBudgetColor(selectedBudget.porcentajeUsado, selectedBudget.sobrePresupuesto, selectedBudget.id) }}>
                      <CalculateIcon />
                    </div>
                    <div className="detail-info">
                      <h3 className="detail-name">{selectedBudget.nombre}</h3>
                      <p className="detail-bank">
                        {selectedBudget.sobrePresupuesto ? 'Sobre presupuesto' : `${selectedBudget.porcentajeUsado.toFixed(1)}% usado`}
                      </p>
                      <p className="detail-periodicity">
                        {getPeriodicityLabel(selectedBudget.periodicidad)}
                        {selectedBudget.periodicidad !== 'mensual' && (
                          <span className="detail-monthly-equivalent">
                            {' '}• {formatBalance(calculateMonthlyAmount(selectedBudget.montoMaximo, selectedBudget.periodicidad))}/mes
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="budget-detail-progress">
                    <div className="budget-detail-progress-bar">
                      <div 
                        className="budget-detail-progress-fill" 
                        style={{ 
                          width: `${Math.min(selectedBudget.porcentajeUsado, 100)}%`,
                          backgroundColor: getProgressColor(selectedBudget.porcentajeUsado, selectedBudget.sobrePresupuesto)
                        }}
                      ></div>
                    </div>
                    <span className="budget-detail-progress-text">{selectedBudget.porcentajeUsado.toFixed(1)}%</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Periodicidad:</span>
                    <span className="detail-value">{getPeriodicityLabel(selectedBudget.periodicidad)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Monto Máximo ({getPeriodicityLabel(selectedBudget.periodicidad)}):</span>
                    <span className="detail-value">{formatBalance(selectedBudget.montoMaximo)}</span>
                  </div>
                  {selectedBudget.periodicidad !== 'mensual' && (
                    <div className="detail-row">
                      <span className="detail-label">Equivalente Mensual:</span>
                      <span className="detail-value monthly-equivalent">{formatBalance(calculateMonthlyAmount(selectedBudget.montoMaximo, selectedBudget.periodicidad))}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">
                      {selectedBudget && isBudgetAssociatedWithProject(selectedBudget.id) ? 'Total Ahorrado:' : 'Total Gastado:'}
                    </span>
                    <span className="detail-value spent">{formatBalance(selectedBudget.totalGastado)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Restante:</span>
                    <span className="detail-value remaining">{formatBalance(selectedBudget.restante)}</span>
                  </div>
                </div>

                <div className="detail-actions">
                  <button className="detail-button edit" onClick={handleEditClick}>
                    <EditIcon />
                    <span>Editar Presupuesto</span>
                  </button>
                  <button className="detail-button delete" onClick={handleDeleteClick}>
                    <DeleteIcon />
                    <span>Eliminar Presupuesto</span>
                  </button>
                </div>
              </>
            ) : (
              <form className="modal-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="edit-nombre">Nombre</label>
                  <input
                    type="text"
                    id="edit-nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Compras Mensuales"
                    className={formErrors.nombre ? 'input-error' : ''}
                  />
                  {formErrors.nombre && (
                    <span className="error-message">{formErrors.nombre}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="edit-periodicidad">Periodicidad</label>
                  <select
                    id="edit-periodicidad"
                    name="periodicidad"
                    value={formData.periodicidad}
                    onChange={handleChange}
                    required
                    className="form-select"
                  >
                    <option value="mensual">Mensual</option>
                    <option value="bimestral">Bimestral (2 meses)</option>
                    <option value="trimestral">Trimestral (3 meses)</option>
                    <option value="semestral">Semestral (6 meses)</option>
                    <option value="anual">Anual (12 meses)</option>
                  </select>
                  <p className="form-hint">
                    El monto se dividirá entre los meses del período. Ejemplo: Bimestral de 1,000,000 = 500,000/mes
                  </p>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-montoMaximo">Monto Máximo</label>
                  <input
                    type="number"
                    id="edit-montoMaximo"
                    name="montoMaximo"
                    value={formData.montoMaximo}
                    onChange={handleChange}
                    required
                    step="1"
                    min="1"
                    placeholder="0"
                    className={formErrors.montoMaximo ? 'input-error' : ''}
                  />
                  {formData.montoMaximo && !formErrors.montoMaximo && formData.periodicidad !== 'mensual' && (
                    <p className="form-hint monthly-preview">
                      Equivale a <strong>{formatBalance(calculateMonthlyAmount(parseFloat(formData.montoMaximo) || 0, formData.periodicidad))}</strong> por mes
                    </p>
                  )}
                  {formErrors.montoMaximo && (
                    <span className="error-message">{formErrors.montoMaximo}</span>
                  )}
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
              <h2 className="modal-title">Debug - Presupuestos</h2>
              <button className="modal-close" onClick={() => setIsDebugModalOpen(false)}>×</button>
            </div>
            <div className="debug-modal-content">
              <div className="debug-options">
                <button 
                  className="debug-option-button create-demo"
                  onClick={handleCreateDemoBudgets}
                  disabled={isLoading}
                >
                  <span className="debug-option-icon">📦</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Crear Presupuestos Demo</h3>
                    <p className="debug-option-description">Crea 8 presupuestos de ejemplo para pruebas</p>
                  </div>
                </button>
                <button 
                  className="debug-option-button delete-all"
                  onClick={handleDeleteAllBudgets}
                  disabled={isLoading}
                >
                  <span className="debug-option-icon">🗑️</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Eliminar Todos los Presupuestos (Soft Delete)</h3>
                    <p className="debug-option-description">Elimina todos los presupuestos (se pueden restaurar)</p>
                  </div>
                </button>
                <button 
                  className="debug-option-button delete-all hard-delete"
                  onClick={handleHardDeleteAllBudgets}
                  disabled={isLoading}
                >
                  <span className="debug-option-icon">⚠️</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Hard Delete - Eliminar Todo Permanentemente</h3>
                    <p className="debug-option-description">⚠️ PELIGROSO: Elimina todos los presupuestos y sus transacciones (IRREVERSIBLE)</p>
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

      {/* Modal de confirmación de eliminación */}
      {isDeleteModalOpen && selectedBudget && (
        <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Eliminar Presupuesto</h2>
              <button className="modal-close" onClick={() => setIsDeleteModalOpen(false)}>×</button>
            </div>
            <div className="delete-modal-content">
              <p className="delete-modal-text">
                Selecciona el tipo de eliminación para el presupuesto <strong>"{selectedBudget.nombre}"</strong>:
              </p>
              <div className="delete-options">
                <button 
                  className="delete-option-button soft-delete"
                  onClick={handleSoftDelete}
                  disabled={isLoading}
                >
                  <span className="delete-option-icon">🗑️</span>
                  <div className="delete-option-info">
                    <h3 className="delete-option-title">Soft Delete</h3>
                    <p className="delete-option-description">
                      Marca el presupuesto como eliminado pero mantiene los datos y transacciones. Se puede restaurar más tarde.
                    </p>
                  </div>
                </button>
                <button 
                  className="delete-option-button hard-delete"
                  onClick={handleHardDelete}
                  disabled={isLoading}
                >
                  <span className="delete-option-icon">⚠️</span>
                  <div className="delete-option-info">
                    <h3 className="delete-option-title">Hard Delete</h3>
                    <p className="delete-option-description">
                      <strong>⚠️ PELIGROSO:</strong> Elimina permanentemente el presupuesto y TODAS sus transacciones asociadas. Esta acción es IRREVERSIBLE y requiere ajuste manual en los balances.
                    </p>
                  </div>
                </button>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="modal-button cancel" 
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de presupuestos eliminados */}
      {isDeletedBudgetsModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDeletedBudgetsModalOpen(false)}>
          <div className="modal-content deleted-budgets-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Presupuestos Eliminados</h2>
              <button className="modal-close" onClick={() => setIsDeletedBudgetsModalOpen(false)}>×</button>
            </div>
            <div className="deleted-budgets-content">
              {isLoadingDeleted ? (
                <div className="loader-container">
                  <div className="loader">
                    <div className="loader-spinner"></div>
                    <p className="loader-text">Cargando presupuestos eliminados...</p>
                  </div>
                </div>
              ) : deletedBudgets.length === 0 ? (
                <div className="empty-state">
                  <ArchiveIcon className="empty-icon" />
                  <p className="empty-text">No hay presupuestos eliminados</p>
                  <p className="empty-subtext">Los presupuestos eliminados aparecerán aquí</p>
                </div>
              ) : (
                <div className="deleted-budgets-list">
                  {deletedBudgets.map((budget) => {
                    const budgetColor = getBudgetColor(budget.porcentajeUsado, budget.sobrePresupuesto, budget.id)
                    return (
                      <div 
                        key={budget.id} 
                        className="deleted-budget-item"
                        style={{ '--budget-color': budgetColor } as React.CSSProperties}
                      >
                        <div className="deleted-budget-info">
                          <div className="deleted-budget-icon" style={{ backgroundColor: budgetColor }}>
                            <CalculateIcon />
                          </div>
                          <div className="deleted-budget-details">
                            <h3 className="deleted-budget-name">{budget.nombre}</h3>
                            <div className="deleted-budget-metrics">
                              <span className="deleted-budget-metric">
                                Máximo: {formatBalance(budget.montoMaximo)}
                              </span>
                              <span className="deleted-budget-separator">•</span>
                              <span className="deleted-budget-metric">
                                {isBudgetAssociatedWithProject(budget.id) ? 'Ahorrado' : 'Gastado'}: {formatBalance(budget.totalGastado)}
                              </span>
                              <span className="deleted-budget-separator">•</span>
                              <span className="deleted-budget-metric">
                                {budget.porcentajeUsado.toFixed(1)}% usado
                              </span>
                            </div>
                          </div>
                        </div>
                        <button 
                          className="restore-budget-button"
                          onClick={() => handleRestoreBudget(budget.id)}
                          title="Restaurar presupuesto"
                        >
                          <RestoreIcon />
                          <span>Restaurar</span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="modal-button cancel" 
                onClick={() => setIsDeletedBudgetsModalOpen(false)}
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

export default Presupuestos

