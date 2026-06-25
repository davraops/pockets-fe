import { useState, useEffect, useRef, useCallback } from 'react'
import CrudSummaryStrip from '../components/crud/CrudSummaryStrip'
import AddIcon from '@mui/icons-material/Add'
import CardMembershipIcon from '@mui/icons-material/CardMembership'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { api } from '../services/api'
import { devError, devWarn, isDebugToolsEnabled, isDestructiveDebugEnabled } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import ModalOverlay from '../components/ModalOverlay'
import ListSkeleton from '../components/ListSkeleton'
import FinanzasSubHeader from '../components/finanzas/FinanzasSubHeader'
import './Subscripciones.css'

// Interfaz que coincide con la respuesta de la API (campos en inglés)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface SubscriptionAPI {
  id: string
  name: string
  price: number
  cut_date: string
  card_id: string
  is_family: boolean
  card: {
    id: string
    card_name: string
    bank_account_id: string
    last_4_digits: string
    expiration_date: string
    bank_account: {
      id: string
      account_name: string
      bank: string
    }
  }
  created_at: string
  updated_at: string
}

// Interfaz para uso interno del componente
interface Subscription {
  id: string
  nombre: string
  precio: number
  fechaCorte: string
  tarjetaId: string
  esFamiliar: boolean
  nombreTarjeta: string
  ultimos4Digitos: string
  banco: string
  nombreCuenta: string
}

interface Card {
  id: string
  nombre: string
  ultimos4Digitos: string
  banco: string
  nombreCuenta: string
}

function Subscripciones() {
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    fechaCorte: '',
    tarjetaId: '',
    esFamiliar: false,
  })
  const [formErrors, setFormErrors] = useState({
    nombre: '',
    precio: '',
    fechaCorte: '',
    tarjetaId: '',
  })

  // Mapear subscripción de API a formato interno
  const mapSubscriptionFromAPI = (apiSub: any): Subscription => {
    // Manejar diferentes estructuras de respuesta de la API
    const card = apiSub.card || {}
    const bankAccount = card.bank_account || {}

    return {
      id: apiSub.id,
      nombre: apiSub.name,
      precio: apiSub.price,
      fechaCorte: apiSub.cut_date,
      tarjetaId: apiSub.card_id,
      esFamiliar: apiSub.is_family || false,
      nombreTarjeta: card.card_name || card.nombre_tarjeta || 'Tarjeta desconocida',
      ultimos4Digitos: card.last_4_digits || '0000',
      banco: bankAccount.bank || card.issuing_bank || 'Banco desconocido',
      nombreCuenta: bankAccount.account_name || 'Cuenta desconocida',
    }
  }

  // Cargar tarjetas de débito desde la API (para el selector)
  useEffect(() => {
    const loadCards = async () => {
      try {
        const response = await api.getCards()
        if (response.cards && Array.isArray(response.cards)) {
          const mappedCards: Card[] = response.cards.map((card: any) => ({
            id: card.id,
            nombre: card.card_name,
            ultimos4Digitos: card.last_4_digits,
            banco: card.bank_account.bank,
            nombreCuenta: card.bank_account.account_name,
          }))
          setCards(mappedCards)
        }
      } catch (err) {
        devError('Error al cargar tarjetas:', err)
      }
    }

    loadCards()
  }, [])

  // Cargar subscripciones desde la API
  const reloadSubscriptions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.getSubscriptions()

      if (response.subscriptions && Array.isArray(response.subscriptions)) {
        const mappedSubscriptions = response.subscriptions.map(mapSubscriptionFromAPI)
        setSubscriptions(mappedSubscriptions)
      } else {
        devWarn('Respuesta inesperada de getSubscriptions:', response)
        setSubscriptions([])
      }
    } catch (err: any) {
      devError('Error al cargar subscripciones:', err)
      devError('Detalles del error:', err.data || err.message)
      setError('Error al cargar las subscripciones. Por favor, intenta de nuevo.')
      setSubscriptions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    reloadSubscriptions()
  }, [reloadSubscriptions])

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
    if (cards.length === 0) {
      showNotification(
        'No hay tarjetas de débito disponibles. Por favor, crea al menos una tarjeta primero.',
        'warning'
      )
      return
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      nombre: '',
      precio: '',
      fechaCorte: '',
      tarjetaId: '',
      esFamiliar: false,
    })
    setFormErrors({
      nombre: '',
      precio: '',
      fechaCorte: '',
      tarjetaId: '',
    })
  }

  const handleOpenDetailModal = (subscription: Subscription) => {
    setSelectedSubscription(subscription)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
    setFormData({
      nombre: subscription.nombre,
      precio: subscription.precio.toString(),
      fechaCorte: subscription.fechaCorte,
      tarjetaId: subscription.tarjetaId,
      esFamiliar: subscription.esFamiliar,
    })
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedSubscription(null)
    setIsEditMode(false)
    setFormData({
      nombre: '',
      precio: '',
      fechaCorte: '',
      tarjetaId: '',
      esFamiliar: false,
    })
    setFormErrors({
      nombre: '',
      precio: '',
      fechaCorte: '',
      tarjetaId: '',
    })
  }

  const handleEditClick = () => {
    setIsEditMode(true)
  }

  const handleDeleteClick = async () => {
    if (
      selectedSubscription &&
      (await confirm({ message: `¿Estás seguro de que quieres eliminar la subscripción "${selectedSubscription.nombre}"?`, variant: 'danger' }))
    ) {
      try {
        await api.deleteSubscription(selectedSubscription.id)
        // Recargar subscripciones después de eliminar
        const response = await api.getSubscriptions()
        if (response.subscriptions && Array.isArray(response.subscriptions)) {
          const mappedSubscriptions = response.subscriptions.map(mapSubscriptionFromAPI)
          setSubscriptions(mappedSubscriptions)
        }
        // Disparar evento para actualizar otros componentes
        window.dispatchEvent(new Event('subscriptionsUpdated'))
        handleCloseDetailModal()
      } catch (err: any) {
        devError('Error al eliminar subscripción:', err)
        const errorMessage = getTranslatedErrorMessage(err, 'Error al eliminar la subscripción. Por favor, intenta de nuevo.')
        showNotification(errorMessage, 'error')
      }
    }
  }

  const validateForm = async (): Promise<boolean> => {
    const errors = {
      nombre: '',
      precio: '',
      fechaCorte: '',
      tarjetaId: '',
    }
    let isValid = true

    // Validar nombre
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido'
      isValid = false
    }

    // Validar precio
    if (!formData.precio.trim()) {
      errors.precio = 'El precio es requerido'
      isValid = false
    } else {
      const precioNum = parseFloat(formData.precio)
      if (isNaN(precioNum) || precioNum <= 0) {
        errors.precio = 'El precio debe ser un número positivo'
        isValid = false
      }
    }

    // Validar fecha de corte
    if (!formData.fechaCorte) {
      errors.fechaCorte = 'La fecha de corte es requerida'
      isValid = false
    } else {
      const fechaCorte = new Date(formData.fechaCorte)
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      if (isNaN(fechaCorte.getTime())) {
        errors.fechaCorte = 'Fecha inválida'
        isValid = false
      }
    }

    // Validar tarjeta
    if (!formData.tarjetaId.trim()) {
      errors.tarjetaId = 'La tarjeta es requerida'
      isValid = false
    }

    // Validar nombre único - primero verificar contra el estado local
    const nombreNormalizado = formData.nombre.toLowerCase().trim()
    if (nombreNormalizado) {
      const nombreExistsLocal = subscriptions.some(
        (sub: Subscription) =>
          sub.nombre.toLowerCase() === nombreNormalizado &&
          (!isEditMode || sub.id !== selectedSubscription?.id)
      )
      if (nombreExistsLocal) {
        errors.nombre = 'Este nombre ya está en uso'
        isValid = false
      }
    }

    // Validar contra la API para asegurarse de tener datos actualizados
    if (isValid && nombreNormalizado) {
      try {
        const allSubscriptions = await api.getSubscriptions()
        if (allSubscriptions.subscriptions && Array.isArray(allSubscriptions.subscriptions)) {
          const nombreExists = allSubscriptions.subscriptions.some(
            (sub: any) =>
              sub.name.toLowerCase() === nombreNormalizado &&
              (!isEditMode || sub.id !== selectedSubscription?.id)
          )
          if (nombreExists) {
            errors.nombre = 'Este nombre ya está en uso'
            isValid = false
          }
        }
      } catch (err) {
        devError('Error al validar contra la API:', err)
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

    // Validación adicional antes de enviar
    if (
      !formData.nombre.trim() ||
      !formData.precio.trim() ||
      !formData.fechaCorte ||
      !formData.tarjetaId.trim()
    ) {
      showNotification('Por favor completa todos los campos requeridos', 'warning')
      return
    }

    const precioNum = parseFloat(formData.precio)
    if (isNaN(precioNum) || precioNum <= 0) {
      showNotification('El precio debe ser un número positivo', 'warning')
      return
    }

    try {
      const subscriptionData = {
        name: formData.nombre.trim(),
        price: precioNum,
        cut_date: formData.fechaCorte,
        card_id: formData.tarjetaId.trim(),
        is_family: formData.esFamiliar,
      }

      if (isEditMode && selectedSubscription) {
        // Editar subscripción existente
        await api.updateSubscription(selectedSubscription.id, subscriptionData)

        // Recargar subscripciones después de actualizar
        const response = await api.getSubscriptions()
        if (response.subscriptions && Array.isArray(response.subscriptions)) {
          const mappedSubscriptions = response.subscriptions.map(mapSubscriptionFromAPI)
          setSubscriptions(mappedSubscriptions)
        }
        // Disparar evento para actualizar otros componentes
        window.dispatchEvent(new Event('subscriptionsUpdated'))
        handleCloseDetailModal()
      } else {
        // Agregar nueva subscripción
        await api.createSubscription(subscriptionData)

        // Recargar subscripciones después de crear
        const response = await api.getSubscriptions()
        if (response.subscriptions && Array.isArray(response.subscriptions)) {
          const mappedSubscriptions = response.subscriptions.map(mapSubscriptionFromAPI)
          setSubscriptions(mappedSubscriptions)
        }
        // Disparar evento para actualizar otros componentes
        window.dispatchEvent(new Event('subscriptionsUpdated'))
        handleCloseModal()
      }
    } catch (err: any) {
      devError('Error al guardar subscripción:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al guardar la subscripción. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData({
        ...formData,
        [name]: checked,
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }

    // Limpiar errores cuando el usuario empiece a escribir
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Calcular highlights - HIG: Relevant Information
  const calculateHighlights = () => {
    const totalSubscripciones = subscriptions.length
    const totalMensual = subscriptions.reduce((total, sub) => total + sub.precio, 0)
    const subscripcionesFamiliares = subscriptions.filter(sub => sub.esFamiliar).length
    const subscripcionesIndividuales = subscriptions.filter(sub => !sub.esFamiliar).length

    return {
      totalSubscripciones,
      totalMensual,
      subscripcionesFamiliares,
      subscripcionesIndividuales,
    }
  }

  const formatCardNumber = (digits: string) => {
    return `•••• •••• •••• ${digits}`
  }

  // Función de debug para crear subscripciones de prueba
  const handleDebugCreateSubscriptions = async () => {
    if (!isDebugToolsEnabled()) return
    if (cards.length === 0) {
      showNotification(
        'No hay tarjetas de débito disponibles. Crea al menos una tarjeta primero.',
        'warning'
      )
      return
    }

    const testSubscriptions = [
      {
        name: 'Netflix',
        price: 15900,
        cut_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        card_id: cards[0].id,
        is_family: false,
      },
      {
        name: 'Spotify Premium',
        price: 16900,
        cut_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        card_id: cards[0].id,
        is_family: true,
      },
      {
        name: 'Amazon Prime',
        price: 29900,
        cut_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        card_id: cards.length > 1 ? cards[1].id : cards[0].id,
        is_family: false,
      },
    ]

    try {
      setIsLoading(true)
      for (const sub of testSubscriptions) {
        await api.createSubscription(sub)
      }
      // Recargar subscripciones después de crear todas
      const response = await api.getSubscriptions()
      if (response.subscriptions && Array.isArray(response.subscriptions)) {
        const mappedSubscriptions = response.subscriptions.map(mapSubscriptionFromAPI)
        setSubscriptions(mappedSubscriptions)
      }
      // Disparar evento para actualizar otros componentes
      window.dispatchEvent(new Event('subscriptionsUpdated'))
      setIsDebugModalOpen(false)
      showNotification(`${testSubscriptions.length} subscripciones de prueba creadas exitosamente`, 'success')
    } catch (err: any) {
      devError('Error al crear subscripciones de prueba:', err)
      const errorMessage = getTranslatedErrorMessage(err, 'Error al crear las subscripciones de prueba. Por favor, intenta de nuevo.')
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Función de debug para borrar todas las subscripciones
  const handleDeleteAllSubscriptions = async () => {
    if (!isDestructiveDebugEnabled()) return
    if (
      (await confirm({ message: '¿Estás seguro de que quieres eliminar TODAS las subscripciones? Esta acción es IRREVERSIBLE.', variant: 'danger' }))
    ) {
      try {
        setIsLoading(true)
        await api.deleteAllSubscriptions()
        // Recargar subscripciones después de borrar todas
        const response = await api.getSubscriptions()
        if (response.subscriptions && Array.isArray(response.subscriptions)) {
          const mappedSubscriptions = response.subscriptions.map(mapSubscriptionFromAPI)
          setSubscriptions(mappedSubscriptions)
        }
        // Disparar evento para actualizar otros componentes
        window.dispatchEvent(new Event('subscriptionsUpdated'))
        setIsDebugModalOpen(false)
        showNotification('Todas las subscripciones han sido eliminadas exitosamente', 'success')
      } catch (err: any) {
        devError('Error al eliminar todas las subscripciones:', err)
        const errorMessage = getTranslatedErrorMessage(err, 'Error al eliminar las subscripciones. Por favor, intenta de nuevo.')
        showNotification(errorMessage, 'error')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const highlights = calculateHighlights()

  return (
    <>
      <div className="app-page-container">
        <div className="app-page-content app-page-content-wide crud-page-content subscripciones-content finanzas-sub-content">
          {isLoading ? (
            <>
              <FinanzasSubHeader title="Subscripciones" context="Recurrentes" />
              <div className="glass-group">
                <ListSkeleton variant="inset-row" count={5} aria-label="Cargando subscripciones" />
              </div>
            </>
          ) : error ? (
            <>
              <FinanzasSubHeader title="Subscripciones" context="Recurrentes" />
              <div className="loader-container">
                <div className="loader finanzas-stats-error-panel">
                  <p className="loader-text loader-text--error" role="alert">
                    {error}
                  </p>
                  <button
                    type="button"
                    className="btn-base btn-secondary finanzas-stats-retry-button"
                    onClick={() => void reloadSubscriptions()}
                    aria-label="Reintentar cargar subscripciones"
                  >
                    <span>Reintentar</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <FinanzasSubHeader
                title="Subscripciones"
                context="Recurrentes"
                meta={`${subscriptions.length} activa${subscriptions.length !== 1 ? 's' : ''}`}
                toolbarActions={
                  isDebugToolsEnabled() ? (
                    <div className="finanzas-sub-menu-container" ref={menuRef}>
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
                        <div className="finanzas-sub-menu">
                          <button
                            type="button"
                            className="finanzas-sub-menu-item"
                            onClick={() => {
                              setIsDebugModalOpen(true)
                              setIsMenuOpen(false)
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

              {/* Resumen de subscripciones */}
              <CrudSummaryStrip
                ariaLabel="Resumen de subscripciones"
                items={[
                  { label: 'Total', value: highlights.totalSubscripciones, tone: 'info' },
                  {
                    label: 'Total mensual',
                    value: formatPrice(highlights.totalMensual),
                    tone: 'expense',
                    emphasis: true,
                  },
                  { label: 'Familiares', value: highlights.subscripcionesFamiliares, tone: 'info' },
                  {
                    label: 'Individuales',
                    value: highlights.subscripcionesIndividuales,
                    tone: 'available',
                  },
                ]}
              />

              <button
                type="button"
                className="btn-base btn-accent btn-block btn-submit crud-primary-cta"
                onClick={handleOpenModal}
                aria-label="Agregar subscripción"
              >
                <AddIcon aria-hidden={true} />
                Agregar subscripción
              </button>

              {subscriptions.length === 0 ? (
                <div className="empty-state">
                  <CardMembershipIcon className="empty-state-icon" />
                  <p className="empty-text">No hay subscripciones agregadas</p>
                  <p className="empty-subtext">Usa el botón de arriba para agregar la primera</p>
                </div>
              ) : (
                <div className="crud-card-list">
                  {subscriptions.map(subscription => (
                      <button
                        key={subscription.id}
                        className="crud-card-row crud-card-row--subscription"
                        onClick={() => handleOpenDetailModal(subscription)}
                        type="button"
                        aria-label={`Ver detalles de ${subscription.nombre}`}
                      >
                        <div className="crud-row-content">
                          <div className="crud-row-main">
                            <span className="crud-row-title">{subscription.nombre}</span>
                            <span className="crud-row-subtitle">
                              {subscription.nombreTarjeta} •{' '}
                              {formatCardNumber(subscription.ultimos4Digitos)}
                            </span>
                          </div>
                          <div className="crud-row-secondary">
                            <span className="crud-row-value crud-row-value--sm">
                              {formatPrice(subscription.precio)}
                            </span>
                            <span className="crud-row-meta crud-row-meta--sm">
                              Corte: {formatDate(subscription.fechaCorte)}
                            </span>
                            {subscription.esFamiliar && (
                              <span className="crud-row-tag crud-row-tag--chip">👨‍👩‍👧‍👦 Familiar</span>
                            )}
                          </div>
                        </div>
                        <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
                      </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal para agregar subscripción */}
      {isModalOpen && (
        <ModalOverlay onClose={handleCloseModal} className="modal-overlay">
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" id="modal-title-nueva-subscripci-n">Nueva Subscripción</h2>
              <button className="modal-close" onClick={handleCloseModal} aria-label="Cerrar modal">×</button>
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
                  placeholder="Ej: Netflix"
                  className={formErrors.nombre ? 'input-error' : ''}
                />
                {formErrors.nombre && <span className="error-message">{formErrors.nombre}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="precio">Precio (COP)</label>
                <input
                  type="number"
                  id="precio"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={formErrors.precio ? 'input-error' : ''}
                />
                {formErrors.precio && <span className="error-message">{formErrors.precio}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="fechaCorte">Fecha de Corte</label>
                <input
                  type="date"
                  id="fechaCorte"
                  name="fechaCorte"
                  value={formData.fechaCorte}
                  onChange={handleChange}
                  required
                  className={formErrors.fechaCorte ? 'input-error' : ''}
                />
                {formErrors.fechaCorte && (
                  <span className="error-message">{formErrors.fechaCorte}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="tarjetaId">Tarjeta de Débito</label>
                <select
                  id="tarjetaId"
                  name="tarjetaId"
                  value={formData.tarjetaId}
                  onChange={handleChange}
                  required
                  className={formErrors.tarjetaId ? 'input-error form-select' : 'form-select'}
                >
                  <option value="">Selecciona una tarjeta</option>
                  {cards.map(card => (
                    <option key={card.id} value={card.id}>
                      {card.nombre} - {formatCardNumber(card.ultimos4Digitos)}
                    </option>
                  ))}
                </select>
                {formErrors.tarjetaId && (
                  <span className="error-message">{formErrors.tarjetaId}</span>
                )}
                <p className="form-hint funny-hint">
                  💡 Solo un idiota pagaría una subscripción con una tarjeta de crédito
                </p>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="esFamiliar"
                    checked={formData.esFamiliar}
                    onChange={handleChange}
                  />
                  <span>Es subscripción familiar</span>
                </label>
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
        </ModalOverlay>
      )}

      {/* Modal de detalles */}
      {isDetailModalOpen && selectedSubscription && (
        <ModalOverlay onClose={handleCloseDetailModal} className="modal-overlay">
          <div
            className="modal-content detail-modal"
            onClick={e => e.stopPropagation()}
            style={{ '--subscription-color': '#AF52DE' } as React.CSSProperties}
          >
            <div className="modal-header">
              <h2 className="modal-title" id="modal-title-detalles-de-la-subscripci-n">Detalles de la Subscripción</h2>
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
                      <h3 className="detail-name">{selectedSubscription.nombre}</h3>
                      <p className="detail-bank">
                        {selectedSubscription.nombreTarjeta} -{' '}
                        {formatCardNumber(selectedSubscription.ultimos4Digitos)}
                      </p>
                    </div>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Precio:</span>
                    <span className="detail-value">{formatPrice(selectedSubscription.precio)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Fecha de Corte:</span>
                    <span className="detail-value">
                      {formatDate(selectedSubscription.fechaCorte)}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Tarjeta:</span>
                    <span className="detail-value">{selectedSubscription.nombreTarjeta}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Banco:</span>
                    <span className="detail-value">{selectedSubscription.banco}</span>
                  </div>

                  {selectedSubscription.esFamiliar && (
                    <div className="detail-row">
                      <span className="detail-label">Tipo:</span>
                      <span className="detail-value">👨‍👩‍👧‍👦 Familiar</span>
                    </div>
                  )}
                </div>

                <div className="detail-actions">
                  <button
                    className="detail-button edit"
                    onClick={handleEditClick}
                    type="button"
                    aria-label="Editar subscripción"
                  >
                    <EditIcon aria-hidden="true" />
                    <span>Editar Subscripción</span>
                  </button>
                  <button
                    className="detail-button delete"
                    onClick={handleDeleteClick}
                    type="button"
                    aria-label="Eliminar subscripción"
                  >
                    <DeleteIcon aria-hidden="true" />
                    <span>Eliminar Subscripción</span>
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
                    placeholder="Ej: Netflix"
                    className={formErrors.nombre ? 'input-error' : ''}
                  />
                  {formErrors.nombre && <span className="error-message">{formErrors.nombre}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="edit-precio">Precio (COP)</label>
                  <input
                    type="number"
                    id="edit-precio"
                    name="precio"
                    value={formData.precio}
                    onChange={handleChange}
                    required
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className={formErrors.precio ? 'input-error' : ''}
                  />
                  {formErrors.precio && <span className="error-message">{formErrors.precio}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="edit-fechaCorte">Fecha de Corte</label>
                  <input
                    type="date"
                    id="edit-fechaCorte"
                    name="fechaCorte"
                    value={formData.fechaCorte}
                    onChange={handleChange}
                    required
                    className={formErrors.fechaCorte ? 'input-error' : ''}
                  />
                  {formErrors.fechaCorte && (
                    <span className="error-message">{formErrors.fechaCorte}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="edit-tarjetaId">Tarjeta de Débito</label>
                  <select
                    id="edit-tarjetaId"
                    name="tarjetaId"
                    value={formData.tarjetaId}
                    onChange={handleChange}
                    required
                    className="form-select disabled-input"
                    disabled
                  >
                    <option value="">Selecciona una tarjeta</option>
                    {cards.map(card => (
                      <option key={card.id} value={card.id}>
                        {card.nombre} - {formatCardNumber(card.ultimos4Digitos)}
                      </option>
                    ))}
                  </select>
                  <p className="form-hint">La tarjeta no se puede modificar</p>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="esFamiliar"
                      checked={formData.esFamiliar}
                      onChange={handleChange}
                    />
                    <span>Es subscripción familiar</span>
                  </label>
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
        </ModalOverlay>
      )}

      {/* Modal de Debug */}
      {isDebugModalOpen && isDebugToolsEnabled() && (
        <ModalOverlay onClose={() => setIsDebugModalOpen(false)} className="modal-overlay">
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" id="modal-title-debug-subscripciones">Debug - Subscripciones</h2>
              <button className="modal-close" onClick={() => setIsDebugModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-panel-content">
              <div className="debug-options">
                <button
                  className="debug-option-button create-demo"
                  onClick={handleDebugCreateSubscriptions}
                  disabled={isLoading}
                >
                  <span className="debug-option-icon">📦</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Crear Subscripciones Demo</h3>
                    <p className="debug-option-description">
                      Crea 3 subscripciones de ejemplo para pruebas
                    </p>
                  </div>
                </button>
                <button
                  className="debug-option-button delete-all"
                  onClick={handleDeleteAllSubscriptions}
                  disabled={isLoading}
                >
                  <span className="debug-option-icon">🗑️</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Eliminar Todas las Subscripciones</h3>
                    <p className="debug-option-description">
                      ⚠️ PELIGROSO: Elimina todas las subscripciones (IRREVERSIBLE)
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
        </ModalOverlay>
      )}
    </>
  )
}

export default Subscripciones
