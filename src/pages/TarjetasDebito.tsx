import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import PaymentIcon from '@mui/icons-material/Payment'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CardMembershipIcon from '@mui/icons-material/CardMembership'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { api } from '../services/api'
import { isDebugToolsEnabled } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import FinanzasSubHeader from '../components/finanzas/FinanzasSubHeader'
import './AppPage.css'
import './TarjetasDebito.css'

// Interfaz que coincide con la respuesta de la API (campos en inglés)
interface CardAPI {
  id: string
  card_name: string
  bank_account_id: string
  bank_account: {
    id: string
    account_name: string
    bank: string
    currency?: string
  }
  last_4_digits: string
  expiration_date: string
  is_virtual: boolean
  created_at: string
  updated_at: string
}

// Interfaz para uso interno del componente
interface Card {
  id: string
  nombre: string
  cuentaId: string
  banco: string
  nombreCuenta: string
  ultimos4Digitos: string
  fechaVencimiento: string
  esVirtual: boolean
}

interface BankAccount {
  id: string
  nombre: string
  banco: string
  currency: string
  balance: number
}

function TarjetasDebito() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [affectedSubscriptions, setAffectedSubscriptions] = useState<any[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    cuentaId: '',
    ultimos4Digitos: '',
    fechaVencimiento: '',
    esVirtual: false,
  })
  const [formErrors, setFormErrors] = useState({
    nombre: '',
    cuentaId: '',
    ultimos4Digitos: '',
    fechaVencimiento: '',
  })

  // Mapear tarjeta de API a formato interno
  const mapCardFromAPI = (apiCard: CardAPI): Card => {
    return {
      id: apiCard.id,
      nombre: apiCard.card_name,
      cuentaId: apiCard.bank_account_id,
      banco: apiCard.bank_account.bank,
      nombreCuenta: apiCard.bank_account.account_name,
      ultimos4Digitos: apiCard.last_4_digits,
      fechaVencimiento: apiCard.expiration_date,
      esVirtual: apiCard.is_virtual || false,
    }
  }

  // Cargar cuentas bancarias desde la API (solo para el selector del formulario)
  useEffect(() => {
    const loadBankAccounts = async () => {
      try {
        const response = await api.getBankAccounts()
        if (response.accounts && Array.isArray(response.accounts)) {
          const mappedAccounts: BankAccount[] = response.accounts.map((acc: any) => ({
            id: acc.id,
            nombre: acc.account_name,
            banco: acc.bank,
            currency: acc.currency || 'COP',
            balance: parseFloat(acc.balance?.original?.amount || acc.balance?.amount || 0),
          }))
          setBankAccounts(mappedAccounts)
        }
      } catch (err) {
        console.error('Error al cargar cuentas:', err)
      }
    }

    loadBankAccounts()
  }, [])

  // Cargar tarjetas desde la API
  useEffect(() => {
    const loadCards = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await api.getCards()
        if (response.cards && Array.isArray(response.cards)) {
          const mappedCards = response.cards.map(mapCardFromAPI)
          setCards(mappedCards)
        } else {
          setCards([])
        }
      } catch (err: any) {
        console.error('Error al cargar tarjetas:', err)
        setError('Frontend says: Error al cargar las tarjetas. Por favor, intenta de nuevo.')
        setCards([])
      } finally {
        setIsLoading(false)
      }
    }

    loadCards()
  }, [])

  // Cargar subscripciones desde la API
  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        const response = await api.getSubscriptions()
        if (response.subscriptions && Array.isArray(response.subscriptions)) {
          setSubscriptions(response.subscriptions)
        } else {
          setSubscriptions([])
        }
      } catch (err) {
        console.error('Error al cargar subscripciones:', err)
        setSubscriptions([])
      }
    }

    loadSubscriptions()

    // Escuchar eventos de actualización de subscripciones
    const handleSubscriptionsUpdate = () => {
      loadSubscriptions()
    }

    window.addEventListener('subscriptionsUpdated', handleSubscriptionsUpdate)

    return () => {
      window.removeEventListener('subscriptionsUpdated', handleSubscriptionsUpdate)
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
    if (bankAccounts.length === 0) {
      alert(
        'Frontend says: No hay cuentas bancarias disponibles. Por favor, crea al menos una cuenta primero.'
      )
      return
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      nombre: '',
      cuentaId: '',
      ultimos4Digitos: '',
      fechaVencimiento: '',
      esVirtual: false,
    })
    setFormErrors({
      nombre: '',
      cuentaId: '',
      ultimos4Digitos: '',
      fechaVencimiento: '',
    })
  }

  const formatBalance = (balance: number, currency: string = 'COP') => {
    const locale = currency === 'EUR' ? 'es-ES' : currency === 'USD' ? 'en-US' : 'es-CO'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(balance)
  }

  const handleOpenDetailModal = (card: Card) => {
    setSelectedCard(card)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
    // Convertir fecha de YYYY-MM-DD a YYYY-MM si viene con día
    const fechaVencimiento = card.fechaVencimiento.includes('-')
      ? card.fechaVencimiento.slice(0, 7)
      : card.fechaVencimiento
    setFormData({
      nombre: card.nombre,
      cuentaId: card.cuentaId,
      ultimos4Digitos: card.ultimos4Digitos,
      fechaVencimiento: fechaVencimiento,
      esVirtual: card.esVirtual,
    })
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setIsDeleteConfirmModalOpen(false)
    setSelectedCard(null)
    setIsEditMode(false)
    setAffectedSubscriptions([])
    setFormData({
      nombre: '',
      cuentaId: '',
      ultimos4Digitos: '',
      fechaVencimiento: '',
      esVirtual: false,
    })
    setFormErrors({
      nombre: '',
      cuentaId: '',
      ultimos4Digitos: '',
      fechaVencimiento: '',
    })
  }

  const handleEditClick = () => {
    setIsEditMode(true)
  }

  const handleDeleteClick = async () => {
    if (!selectedCard) return

    // Verificar si la tarjeta tiene subscripciones asociadas
    const cardSubscriptions = subscriptions.filter(sub => sub.card_id === selectedCard.id)

    if (cardSubscriptions.length > 0) {
      // Si tiene subscripciones, mostrar modal de confirmación
      setAffectedSubscriptions(cardSubscriptions)
      setIsDeleteConfirmModalOpen(true)
    } else {
      // Si no tiene subscripciones, proceder con eliminación normal
      if (
        window.confirm(`¿Estás seguro de que quieres eliminar la tarjeta "${selectedCard.nombre}"?`)
      ) {
        await performDeleteCard()
      }
    }
  }

  const performDeleteCard = async () => {
    if (!selectedCard) return

    try {
      setIsLoading(true)

      // Primero eliminar todas las subscripciones asociadas
      const cardSubscriptions = subscriptions.filter(sub => sub.card_id === selectedCard.id)
      if (cardSubscriptions.length > 0) {
        for (const sub of cardSubscriptions) {
          try {
            await api.deleteSubscription(sub.id)
          } catch (err) {
            console.error(`Error al eliminar subscripción ${sub.id}:`, err)
          }
        }
        // Disparar evento para actualizar otros componentes
        window.dispatchEvent(new Event('subscriptionsUpdated'))
      }

      // Luego eliminar la tarjeta
      await api.deleteCard(selectedCard.id)

      // Recargar tarjetas después de eliminar
      const response = await api.getCards()
      if (response.cards && Array.isArray(response.cards)) {
        const mappedCards = response.cards.map(mapCardFromAPI)
        setCards(mappedCards)
      }

      // Disparar evento para actualizar otros componentes
      window.dispatchEvent(new Event('cardsUpdated'))

      setIsDeleteConfirmModalOpen(false)
      handleCloseDetailModal()

      // Mostrar mensaje recordatorio si se eliminaron subscripciones
      if (cardSubscriptions.length > 0) {
        showNotification(
          `Tarjeta eliminada exitosamente. ⚠️ IMPORTANTE: Se eliminaron ${cardSubscriptions.length} subscripción(es) asociada(s). Tendrás que volver a registrarlas si las necesitas.`,
          'success'
        )
      }
    } catch (err: any) {
      console.error('Error al eliminar tarjeta:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar la tarjeta. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = async (): Promise<boolean> => {
    const errors = {
      nombre: '',
      cuentaId: '',
      ultimos4Digitos: '',
      fechaVencimiento: '',
    }
    let isValid = true

    // Validar nombre
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido'
      isValid = false
    }

    // Validar cuenta
    if (!formData.cuentaId.trim()) {
      errors.cuentaId = 'La cuenta es requerida'
      isValid = false
    }

    // Validar últimos 4 dígitos
    if (!formData.ultimos4Digitos.trim()) {
      errors.ultimos4Digitos = 'Los últimos 4 dígitos son requeridos'
      isValid = false
    } else if (!/^\d{4}$/.test(formData.ultimos4Digitos.trim())) {
      errors.ultimos4Digitos = 'Debe ser exactamente 4 dígitos'
      isValid = false
    }

    // Validar fecha de vencimiento (puede venir en formato MM/YYYY o YYYY-MM)
    if (!formData.fechaVencimiento) {
      errors.fechaVencimiento = 'La fecha de vencimiento es requerida'
      isValid = false
    } else {
      let year: string | undefined
      let month: string | undefined

      // Si viene en formato MM/YYYY, convertir a YYYY-MM
      if (formData.fechaVencimiento.includes('/')) {
        const [m, y] = formData.fechaVencimiento.split('/')
        if (!m || !y || m.length !== 2 || y.length !== 4) {
          errors.fechaVencimiento = 'Formato inválido. Use MM/YYYY'
          isValid = false
        } else {
          month = m
          year = y
        }
      } else if (formData.fechaVencimiento.includes('-')) {
        // Si viene en formato YYYY-MM
        const parts = formData.fechaVencimiento.split('-')
        year = parts[0]
        month = parts[1]
      } else {
        errors.fechaVencimiento = 'Formato inválido. Use MM/YYYY'
        isValid = false
      }

      if (year && month) {
        const monthNum = parseInt(month)
        if (monthNum < 1 || monthNum > 12) {
          errors.fechaVencimiento = 'El mes debe estar entre 01 y 12'
          isValid = false
        } else {
          const expirationDate = new Date(parseInt(year), monthNum - 1, 1)
          const today = new Date()
          today.setDate(1) // Primer día del mes actual para comparar solo mes/año
          today.setHours(0, 0, 0, 0)
          if (expirationDate < today) {
            errors.fechaVencimiento = 'La fecha de vencimiento no puede ser en el pasado'
            isValid = false
          }
        }
      }
    }

    // Validar nombre único - primero verificar contra el estado local (más rápido)
    const nombreNormalizado = formData.nombre.toLowerCase().trim()
    if (nombreNormalizado) {
      const nombreExistsLocal = cards.some(
        card =>
          card.nombre.toLowerCase() === nombreNormalizado &&
          (!isEditMode || card.id !== selectedCard?.id)
      )
      if (nombreExistsLocal) {
        errors.nombre = 'Este nombre ya está en uso'
        isValid = false
      }
    }

    // Validar últimos 4 dígitos únicos contra el estado local
    const ultimos4DigitosTrim = formData.ultimos4Digitos.trim()
    if (ultimos4DigitosTrim && /^\d{4}$/.test(ultimos4DigitosTrim)) {
      const digitsExistsLocal = cards.some(
        card =>
          card.ultimos4Digitos === ultimos4DigitosTrim &&
          (!isEditMode || card.id !== selectedCard?.id)
      )
      if (digitsExistsLocal) {
        errors.ultimos4Digitos = 'Esta combinación de dígitos ya está en uso'
        isValid = false
      }
    }

    // Validar contra la API para asegurarse de tener datos actualizados
    // Solo si no hay errores locales para evitar llamadas innecesarias
    if (isValid && nombreNormalizado) {
      try {
        const allCards = await api.getCards()
        if (allCards.cards && Array.isArray(allCards.cards)) {
          const nombreExists = allCards.cards.some(
            card =>
              card.card_name.toLowerCase() === nombreNormalizado &&
              (!isEditMode || card.id !== selectedCard?.id)
          )
          if (nombreExists) {
            errors.nombre = 'Este nombre ya está en uso'
            isValid = false
          }

          // Validar últimos 4 dígitos únicos contra la API
          if (ultimos4DigitosTrim && /^\d{4}$/.test(ultimos4DigitosTrim)) {
            const digitsExists = allCards.cards.some(
              card =>
                card.last_4_digits === ultimos4DigitosTrim &&
                (!isEditMode || card.id !== selectedCard?.id)
            )
            if (digitsExists) {
              errors.ultimos4Digitos = 'Esta combinación de dígitos ya está en uso'
              isValid = false
            }
          }
        }
      } catch (err) {
        console.error('Error al validar contra la API:', err)
        // Si falla la validación contra la API pero ya validamos localmente,
        // continuamos con la validación local como fallback
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
      !formData.cuentaId ||
      !formData.ultimos4Digitos.trim() ||
      !formData.fechaVencimiento
    ) {
      showNotification('Por favor completa todos los campos requeridos', 'warning')
      return
    }

    // Asegurar que últimos 4 dígitos tengan exactamente 4 dígitos
    const ultimos4Digitos = formData.ultimos4Digitos.trim()
    if (!/^\d{4}$/.test(ultimos4Digitos)) {
      showNotification('Los últimos 4 dígitos deben ser exactamente 4 números', 'warning')
      return
    }

    try {
      // Convertir formato MM/YYYY o YYYY-MM a YYYY-MM-DD (primer día del mes)
      let expirationDate = ''

      if (formData.fechaVencimiento.includes('/')) {
        // Si viene en formato MM/YYYY
        const [month, year] = formData.fechaVencimiento.split('/')
        if (month && year && month.length === 2 && year.length === 4) {
          expirationDate = `${year}-${month}-01`
        } else {
          showNotification('Formato de fecha inválido. Use MM/YYYY (ej: 12/2025)', 'warning')
          return
        }
      } else if (formData.fechaVencimiento.includes('-')) {
        // Si viene en formato YYYY-MM o YYYY-MM-DD
        const parts = formData.fechaVencimiento.split('-')
        if (parts.length === 2) {
          // YYYY-MM, agregar -01
          expirationDate = `${formData.fechaVencimiento}-01`
        } else if (parts.length === 3) {
          // Ya está en formato YYYY-MM-DD
          expirationDate = formData.fechaVencimiento
        } else {
          showNotification('Formato de fecha inválido', 'warning')
          return
        }
      } else {
        alert('Frontend says: Formato de fecha inválido. Use MM/YYYY (ej: 12/2025)')
        return
      }

      // Validar que expirationDate tenga el formato correcto
      if (!/^\d{4}-\d{2}-\d{2}$/.test(expirationDate)) {
        showNotification('Error al formatear la fecha. Por favor, intenta de nuevo.', 'error')
        return
      }

      const cardData = {
        card_name: formData.nombre.trim(),
        bank_account_id: formData.cuentaId.trim(),
        last_4_digits: ultimos4Digitos,
        expiration_date: expirationDate,
        is_virtual: formData.esVirtual,
      }

      console.log('Enviando datos de tarjeta:', cardData)

      if (isEditMode && selectedCard) {
        // Editar tarjeta existente
        await api.updateCard(selectedCard.id, cardData)

        // Recargar tarjetas después de actualizar
        const response = await api.getCards()
        if (response.cards && Array.isArray(response.cards)) {
          const mappedCards = response.cards.map(mapCardFromAPI)
          setCards(mappedCards)
        }
        // Disparar evento para actualizar otros componentes
        window.dispatchEvent(new Event('cardsUpdated'))
        handleCloseDetailModal()
      } else {
        // Agregar nueva tarjeta
        await api.createCard(cardData)

        // Recargar tarjetas después de crear
        const response = await api.getCards()
        if (response.cards && Array.isArray(response.cards)) {
          const mappedCards = response.cards.map(mapCardFromAPI)
          setCards(mappedCards)
        }
        // Disparar evento para actualizar otros componentes
        window.dispatchEvent(new Event('cardsUpdated'))
        handleCloseModal()
      }
    } catch (err: any) {
      console.error('Error al guardar tarjeta:', err)
      console.error('Datos enviados:', {
        card_name: formData.nombre.trim(),
        bank_account_id: formData.cuentaId,
        last_4_digits: formData.ultimos4Digitos.trim(),
        expiration_date: formData.fechaVencimiento,
      })
      const errorMessage =
        err.data?.error || err.message
          ? `Backend says: ${err.data?.error || err.message}`
          : 'Frontend says: Error al guardar la tarjeta. Por favor, intenta de nuevo.'
      alert(errorMessage)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    // Manejar checkbox
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked,
      })
      return
    }

    // Limitar últimos 4 dígitos a solo números y máximo 4 caracteres
    if (name === 'ultimos4Digitos') {
      const numericValue = value.replace(/\D/g, '').slice(0, 4)
      setFormData({
        ...formData,
        [name]: numericValue,
      })
    } else if (name === 'fechaVencimiento') {
      // Manejar formato MM/YYYY
      let formattedValue = value.replace(/\D/g, '') // Solo números

      // Limitar a 6 dígitos (MMYYYY)
      formattedValue = formattedValue.slice(0, 6)

      // Agregar slash después del mes
      if (formattedValue.length > 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2)
      }

      // Convertir MM/YYYY a YYYY-MM para almacenar
      if (formattedValue.length === 7 && formattedValue.includes('/')) {
        const [month, year] = formattedValue.split('/')
        if (month && year && month.length === 2 && year.length === 4) {
          const yyyyMM = `${year}-${month}`
          setFormData({
            ...formData,
            [name]: yyyyMM,
          })
        } else {
          // Si no está completo, guardar como está para mostrar
          setFormData({
            ...formData,
            [name]: formattedValue,
          })
        }
      } else {
        setFormData({
          ...formData,
          [name]: formattedValue,
        })
      }
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

  // Función para convertir YYYY-MM a MM/YYYY para mostrar
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return ''
    // Si viene en formato YYYY-MM o YYYY-MM-DD
    if (dateString.includes('-')) {
      const parts = dateString.split('-')
      if (parts.length >= 2) {
        const year = parts[0]
        const month = parts[1]
        return `${month}/${year}`
      }
    }
    // Si ya está en formato MM/YYYY, devolverlo tal cual
    if (dateString.includes('/')) {
      return dateString
    }
    return dateString
  }

  // Lista de bancos para referencia (no se usa actualmente)
  // const bancos = [
  //   'Bancolombia',
  //   'Davivienda',
  //   'Banco de Bogota',
  //   'GNB Sudameris',
  //   'Citibank',
  //   'Banco Agrario',
  //   'Banco de Occidente',
  //   'BBVA',
  //   'BTG Pactual',
  //   'Mundo Mujer',
  //   'Banco Caja Social',
  //   'ITAU',
  //   'Falabella',
  //   'Santander',
  //   'Bancamia',
  //   'JP Morgan Chase',
  //   'Mi Banco',
  //   'W',
  //   'Banco Popular',
  //   'Finandina',
  //   'Coopcentral',
  //   'Union',
  //   'Serfinanza',
  //   'Scotiabank',
  //   'Colpatria',
  //   'Bancoomeva',
  //   'Pichincha',
  //   'Av Villas',
  //   'Nequi',
  //   'Daviplata',
  //   'Movii',
  //   'Nu',
  //   'TPaga',
  //   'Tuya Pay',
  //   'Dale!',
  //   'Rappi',
  //   'Leal',
  //   'Bold',
  //   'Littio',
  //   'Uala',
  //   'Lulo Bank',
  //   'Coink',
  //   'Iris Neofinanciera',
  //   'Mercadopago',
  //   'PayU',
  //   'Deel',
  //   'Dolar App',
  //   'Wise USD',
  //   'Wise EUR',
  //   'Payoneer USD',
  //   'Payoneer EUR',
  //   'Paypal'
  // ]

  // Colores para cada banco (mismo que en Cuentas)
  const bancoColors: Record<string, string> = {
    Bancolombia: '#E2001A',
    Davivienda: '#FF6B00',
    'Banco de Bogota': '#0033A0',
    'GNB Sudameris': '#00A859',
    Citibank: '#0066CC',
    'Banco Agrario': '#00A859',
    'Banco de Occidente': '#FF6B00',
    BBVA: '#004481',
    'BTG Pactual': '#000000',
    'Mundo Mujer': '#E91E63',
    'Banco Caja Social': '#0066CC',
    ITAU: '#FF6B00',
    Falabella: '#FF6B00',
    Santander: '#EC0000',
    Bancamia: '#00A859',
    'JP Morgan Chase': '#0066CC',
    'Mi Banco': '#0066CC',
    W: '#000000',
    'Banco Popular': '#0066CC',
    Finandina: '#0066CC',
    Coopcentral: '#0066CC',
    Union: '#0066CC',
    Serfinanza: '#0066CC',
    Scotiabank: '#E2001A',
    Colpatria: '#0066CC',
    Bancoomeva: '#0066CC',
    Pichincha: '#0066CC',
    'Av Villas': '#0066CC',
    Nequi: '#00A859',
    Daviplata: '#0066CC',
    Movii: '#0066CC',
    Nu: '#8B5CF6',
    TPaga: '#0066CC',
    'Tuya Pay': '#0066CC',
    'Dale!': '#FF6B00',
    Rappi: '#00A859',
    Leal: '#0066CC',
    Bold: '#000000',
    Littio: '#0066CC',
    Uala: '#0066CC',
    'Lulo Bank': '#0066CC',
    Coink: '#0066CC',
    'Iris Neofinanciera': '#0066CC',
    Mercadopago: '#009EE3',
    PayU: '#00A859',
    Deel: '#0066CC',
    'Dolar App': '#00A859',
    'Wise USD': '#00B9FF',
    'Wise EUR': '#00B9FF',
    'Payoneer USD': '#FF6900',
    'Payoneer EUR': '#FF6900',
    Paypal: '#003087',
  }

  const getBancoColor = (banco: string): string => {
    return bancoColors[banco] || '#5856D6'
  }

  const formatDate = (dateString: string) => {
    // Si viene en formato YYYY-MM-DD, extraer solo YYYY-MM
    const dateOnly = dateString.split('T')[0] // Remover hora si existe
    const [year, month] = dateOnly.split('-')
    return `${month}/${year}`
  }

  const formatCardNumber = (digits: string) => {
    return `•••• •••• •••• ${digits}`
  }

  // Contar subscripciones por tarjeta
  const getSubscriptionCountForCard = (cardId: string): number => {
    return subscriptions.filter(sub => sub.card_id === cardId).length
  }

  // Calcular highlights - HIG: Relevant Information
  const calculateHighlights = () => {
    const totalTarjetas = cards.length
    const tarjetasFisicas = cards.filter(card => !card.esVirtual).length
    const tarjetasVirtuales = cards.filter(card => card.esVirtual).length
    const tarjetasConSubscripciones = cards.filter(
      card => getSubscriptionCountForCard(card.id) > 0
    ).length

    return {
      totalTarjetas,
      tarjetasFisicas,
      tarjetasVirtuales,
      tarjetasConSubscripciones,
    }
  }

  // Función de debug para crear tarjetas de prueba
  const handleDebugCreateCards = async () => {
    if (bankAccounts.length === 0) {
      alert('No hay cuentas bancarias disponibles. Crea al menos una cuenta primero.')
      return
    }

    const testCards = bankAccounts
      .slice(0, Math.min(5, bankAccounts.length))
      .map((account, index) => ({
        card_name: `Tarjeta Débito ${account.nombre}`,
        bank_account_id: account.id,
        last_4_digits: String(1000 + index).padStart(4, '0'),
        expiration_date: new Date(Date.now() + 365 * (index + 1) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        is_virtual: index % 2 === 0, // Alternar entre virtual y física para las tarjetas de prueba
      }))

    try {
      setIsLoading(true)
      for (const card of testCards) {
        await api.createCard(card)
      }
      // Recargar tarjetas después de crear todas
      const response = await api.getCards()
      if (response.cards && Array.isArray(response.cards)) {
        const mappedCards = response.cards.map(mapCardFromAPI)
        setCards(mappedCards)
      }
      // Disparar evento para actualizar otros componentes
      window.dispatchEvent(new Event('cardsUpdated'))
      setIsDebugModalOpen(false)
      showNotification(`${testCards.length} tarjetas de prueba creadas exitosamente`, 'success')
    } catch (err: any) {
      console.error('Error al crear tarjetas de prueba:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al crear las tarjetas de prueba. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Función de debug para borrar todas las tarjetas
  const handleDeleteAllCards = async () => {
    if (
      window.confirm(
        '¿Estás seguro de que quieres eliminar TODAS las tarjetas? Esta acción es IRREVERSIBLE.'
      )
    ) {
      try {
        setIsLoading(true)
        await api.deleteAllCards()
        // Recargar tarjetas después de borrar todas
        const response = await api.getCards()
        if (response.cards && Array.isArray(response.cards)) {
          const mappedCards = response.cards.map(mapCardFromAPI)
          setCards(mappedCards)
        }
        // Disparar evento para actualizar otros componentes
        window.dispatchEvent(new Event('cardsUpdated'))
        setIsDebugModalOpen(false)
        showNotification('Todas las tarjetas han sido eliminadas exitosamente', 'success')
      } catch (err: any) {
        console.error('Error al eliminar todas las tarjetas:', err)
        const errorMessage = getTranslatedErrorMessage(
          err,
          'Error al eliminar las tarjetas. Por favor, intenta de nuevo.'
        )
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
        <div className="app-page-content app-page-content-wide tarjetas-debito-content finanzas-sub-content">
          {isLoading ? (
            <div className="loader-container">
              <div className="loader">
                <div className="loader-spinner"></div>
                <p className="loader-text">Cargando tarjetas...</p>
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
              <FinanzasSubHeader
                title="Tarjetas de débito"
                context="Pagos"
                meta={`${cards.length} tarjeta${cards.length !== 1 ? 's' : ''}`}
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

              <div
                className="crud-summary-strip"
                role="region"
                aria-label="Resumen de tarjetas de débito"
              >
                <div className="crud-summary-strip-item">
                  <span className="crud-summary-strip-label">Total</span>
                  <span className="crud-summary-strip-value crud-summary-strip-value--info">
                    {highlights.totalTarjetas}
                  </span>
                </div>
                <div className="crud-summary-strip-separator" aria-hidden="true" />
                <div className="crud-summary-strip-item">
                  <span className="crud-summary-strip-label">Físicas</span>
                  <span className="crud-summary-strip-value">{highlights.tarjetasFisicas}</span>
                </div>
                <div className="crud-summary-strip-separator" aria-hidden="true" />
                <div className="crud-summary-strip-item">
                  <span className="crud-summary-strip-label">Virtuales</span>
                  <span className="crud-summary-strip-value">{highlights.tarjetasVirtuales}</span>
                </div>
                <div className="crud-summary-strip-separator" aria-hidden="true" />
                <div className="crud-summary-strip-item">
                  <span className="crud-summary-strip-label">Con subscripciones</span>
                  <span className="crud-summary-strip-value crud-summary-strip-value--available">
                    {highlights.tarjetasConSubscripciones}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="btn-base btn-accent btn-block btn-submit crud-primary-cta"
                onClick={handleOpenModal}
                aria-label="Agregar tarjeta de débito"
              >
                <AddIcon aria-hidden="true" />
                Agregar tarjeta
              </button>

              {cards.length === 0 ? (
                <div className="empty-state">
                  <PaymentIcon className="empty-icon" />
                  <p className="empty-text">No hay tarjetas agregadas</p>
                  <p className="empty-subtext">Usa el botón de arriba para agregar la primera</p>
                </div>
              ) : (
                <div className="crud-card-list">
                  {cards.map(card => {
                    const bancoColor = getBancoColor(card.banco)
                    const subscriptionCount = getSubscriptionCountForCard(card.id)
                    return (
                      <button
                        key={card.id}
                        type="button"
                        className="crud-card-row crud-card-row--debit-card"
                        onClick={() => handleOpenDetailModal(card)}
                        aria-label={`Ver detalles de ${card.nombre}`}
                        style={{ '--row-accent': bancoColor } as React.CSSProperties}
                      >
                        <div className="crud-row-content">
                          <div className="crud-row-main">
                            <span className="crud-row-title">{card.nombre}</span>
                            <span className="crud-row-subtitle">
                              {card.nombreCuenta} · {card.banco}
                            </span>
                          </div>
                          <div className="crud-row-secondary">
                            <span className="crud-row-meta">{formatCardNumber(card.ultimos4Digitos)}</span>
                            <span className="crud-row-meta">{card.esVirtual ? 'Virtual' : 'Física'}</span>
                            {subscriptionCount > 0 && (
                              <span className="crud-row-meta">
                                {subscriptionCount} subscripción
                                {subscriptionCount !== 1 ? 'es' : ''}
                              </span>
                            )}
                            <span className="crud-row-meta">
                              Vence {formatDate(card.fechaVencimiento)}
                            </span>
                          </div>
                        </div>
                        <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal para agregar tarjeta */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nueva Tarjeta de Débito</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group-base">
                <label htmlFor="nombre" className="form-label-base">Nombre</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Tarjeta Débito Principal"
                  className={`form-input-base ${formErrors.nombre ? 'input-error' : ''}`}
                />
                {formErrors.nombre && <span className="error-message">{formErrors.nombre}</span>}
              </div>
              <div className="form-group-base">
                <label htmlFor="cuentaId" className="form-label-base">Cuenta Bancaria</label>
                <select
                  id="cuentaId"
                  name="cuentaId"
                  value={formData.cuentaId}
                  onChange={handleChange}
                  required
                  className={`form-input-base ${`form-select-base ${formErrors.cuentaId ? 'input-error' : ''}`}`}
                >
                  <option value="">Selecciona una cuenta</option>
                  {bankAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.nombre} - {account.banco} -{' '}
                      {formatBalance(account.balance, account.currency)}
                    </option>
                  ))}
                </select>
                {formErrors.cuentaId && (
                  <span className="error-message">{formErrors.cuentaId}</span>
                )}
              </div>
              <div className="form-group-base">
                <label htmlFor="ultimos4Digitos" className="form-label-base">Últimos 4 Dígitos</label>
                <input
                  type="text"
                  id="ultimos4Digitos"
                  name="ultimos4Digitos"
                  value={formData.ultimos4Digitos}
                  onChange={handleChange}
                  required
                  maxLength={4}
                  placeholder="1234"
                  className={`form-input-base ${formErrors.ultimos4Digitos ? 'input-error' : ''}`}
                />
                {formErrors.ultimos4Digitos && (
                  <span className="error-message">{formErrors.ultimos4Digitos}</span>
                )}
              </div>
              <div className="form-group-base">
                <label htmlFor="fechaVencimiento" className="form-label-base">Fecha de Vencimiento (Mes/Año)</label>
                <input
                  type="text"
                  id="fechaVencimiento"
                  name="fechaVencimiento"
                  value={formatDateForInput(formData.fechaVencimiento)}
                  onChange={handleChange}
                  required
                  maxLength={7}
                  placeholder="MM/YYYY"
                  className={`form-input-base ${formErrors.fechaVencimiento ? 'input-error' : ''}`}
                />
                {formErrors.fechaVencimiento && (
                  <span className="error-message">{formErrors.fechaVencimiento}</span>
                )}
              </div>
              <div className="form-group-base">
                <label htmlFor="esVirtual" className="checkbox-label">
                  <input
                    type="checkbox"
                    id="esVirtual"
                    name="esVirtual"
                    checked={formData.esVirtual}
                    onChange={handleChange}
                  />
                  <span>{formData.esVirtual ? 'Tarjeta virtual' : 'Tarjeta física'}</span>
                </label>
                <p className="form-hint">
                  {formData.esVirtual
                    ? 'Marcada como tarjeta virtual. Desmarca para cambiarla a física.'
                    : 'Marcada como tarjeta física. Marca para cambiarla a virtual.'}
                </p>
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
      {isDetailModalOpen && selectedCard && (
        <div className="modal-overlay" onClick={handleCloseDetailModal}>
          <div
            className="modal-content detail-modal"
            onClick={e => e.stopPropagation()}
            style={{ '--banco-color': getBancoColor(selectedCard.banco) } as React.CSSProperties}
          >
            <div className="modal-header">
              <h2 className="modal-title">Detalles de la Tarjeta</h2>
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
                      <h3 className="detail-name">{selectedCard.nombre}</h3>
                      <p className="detail-bank">
                        {selectedCard.nombreCuenta} - {selectedCard.banco}
                      </p>
                    </div>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Cuenta Bancaria:</span>
                    <span className="detail-value">{selectedCard.nombreCuenta}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Banco:</span>
                    <span className="detail-value">{selectedCard.banco}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Número de Tarjeta:</span>
                    <span className="detail-value">
                      {formatCardNumber(selectedCard.ultimos4Digitos)}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Fecha de Vencimiento:</span>
                    <span className="detail-value">
                      {formatDate(selectedCard.fechaVencimiento)}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Tipo:</span>
                    <span
                      className={`detail-value ${selectedCard.esVirtual ? 'virtual' : 'fisica'}`}
                    >
                      {selectedCard.esVirtual ? 'Virtual' : 'Física'}
                    </span>
                  </div>
                </div>

                <div className="detail-actions">
                  <button
                    className="detail-button edit"
                    onClick={handleEditClick}
                    type="button"
                    aria-label="Editar tarjeta"
                  >
                    <EditIcon aria-hidden="true" />
                    <span>Editar Tarjeta</span>
                  </button>
                  <button
                    className="detail-button delete"
                    onClick={handleDeleteClick}
                    type="button"
                    aria-label="Eliminar tarjeta"
                  >
                    <DeleteIcon aria-hidden="true" />
                    <span>Eliminar Tarjeta</span>
                  </button>
                </div>
              </>
            ) : (
              <form className="modal-form" onSubmit={handleSubmit}>
                <div className="form-group-base">
                  <label htmlFor="edit-nombre" className="form-label-base">Nombre</label>
                  <input
                    type="text"
                    id="edit-nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Tarjeta Débito Principal"
                    className={`form-input-base ${formErrors.nombre ? 'input-error' : ''}`}
                  />
                  {formErrors.nombre && <span className="error-message">{formErrors.nombre}</span>}
                </div>
                <div className="form-group-base">
                  <label htmlFor="edit-cuentaId" className="form-label-base">Cuenta Bancaria</label>
                  <select
                    id="edit-cuentaId"
                    name="cuentaId"
                    value={formData.cuentaId}
                    onChange={handleChange}
                    required
                    className="form-select-base disabled-input"
                    disabled
                  >
                    <option value="">Selecciona una cuenta</option>
                    {bankAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.nombre} - {account.banco} -{' '}
                        {formatBalance(account.balance, account.currency)}
                      </option>
                    ))}
                  </select>
                  <p className="form-hint">La cuenta no se puede modificar</p>
                </div>
                <div className="form-group-base">
                  <label htmlFor="edit-ultimos4Digitos" className="form-label-base">Últimos 4 Dígitos</label>
                  <input
                    type="text"
                    id="edit-ultimos4Digitos"
                    name="ultimos4Digitos"
                    value={formData.ultimos4Digitos}
                    onChange={handleChange}
                    required
                    maxLength={4}
                    placeholder="1234"
                    className={`form-input-base ${formErrors.ultimos4Digitos ? 'input-error' : ''}`}
                  />
                  {formErrors.ultimos4Digitos && (
                    <span className="error-message">{formErrors.ultimos4Digitos}</span>
                  )}
                </div>
                <div className="form-group-base">
                  <label htmlFor="edit-fechaVencimiento" className="form-label-base">Fecha de Vencimiento (Mes/Año)</label>
                  <input
                    type="text"
                    id="edit-fechaVencimiento"
                    name="fechaVencimiento"
                    value={formatDateForInput(formData.fechaVencimiento)}
                    onChange={handleChange}
                    required
                    maxLength={7}
                    placeholder="MM/YYYY"
                    className={`form-input-base ${formErrors.fechaVencimiento ? 'input-error' : ''}`}
                  />
                  {formErrors.fechaVencimiento && (
                    <span className="error-message">{formErrors.fechaVencimiento}</span>
                  )}
                </div>
                <div className="form-group-base">
                  <label htmlFor="edit-esVirtual" className="checkbox-label">
                    <input
                      type="checkbox"
                      id="edit-esVirtual"
                      name="esVirtual"
                      checked={formData.esVirtual}
                      onChange={handleChange}
                    />
                    <span>{formData.esVirtual ? 'Tarjeta virtual' : 'Tarjeta física'}</span>
                  </label>
                  <p className="form-hint">
                    {formData.esVirtual
                      ? 'Marcada como tarjeta virtual. Desmarca para cambiarla a física.'
                      : 'Marcada como tarjeta física. Marca para cambiarla a virtual.'}
                  </p>
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

      {/* Modal de confirmación de eliminación con subscripciones */}
      {isDeleteConfirmModalOpen && selectedCard && (
        <div className="modal-overlay" onClick={() => setIsDeleteConfirmModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">⚠️ Advertencia: Eliminar Tarjeta</h2>
              <button className="modal-close" onClick={() => setIsDeleteConfirmModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="delete-warning-content">
              <p className="warning-text">
                Esta tarjeta tiene <strong>{affectedSubscriptions.length} subscripción(es)</strong>{' '}
                asociada(s) que también serán eliminadas.
              </p>

              <div className="affected-subscriptions-list">
                <h3 className="subscriptions-list-title">Subscripciones que serán eliminadas:</h3>
                <ul className="subscriptions-list">
                  {affectedSubscriptions.map(sub => (
                    <li key={sub.id} className="subscription-list-item">
                      <CardMembershipIcon className="subscription-list-icon" />
                      <div className="subscription-list-info">
                        <span className="subscription-list-name">{sub.name || sub.nombre}</span>
                        <span className="subscription-list-price">
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0,
                          }).format(sub.price || 0)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="warning-reminder">
                <p className="reminder-text">
                  ⚠️ <strong>IMPORTANTE:</strong> Si eliminas esta tarjeta, tendrás que volver a
                  registrar estas subscripciones manualmente si las necesitas.
                </p>
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-button cancel"
                onClick={() => setIsDeleteConfirmModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="modal-button delete-confirm"
                onClick={performDeleteCard}
                disabled={isLoading}
              >
                {isLoading ? 'Eliminando...' : 'Eliminar Tarjeta y Subscripciones'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Debug */}
      {isDebugModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDebugModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Debug - Tarjetas Débito</h2>
              <button className="modal-close" onClick={() => setIsDebugModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="debug-modal-content">
              <div className="debug-options">
                <button
                  className="debug-option-button create-demo"
                  onClick={handleDebugCreateCards}
                  disabled={isLoading}
                >
                  <span className="debug-option-icon">📦</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Crear Tarjetas Demo</h3>
                    <p className="debug-option-description">
                      Crea hasta 5 tarjetas de ejemplo para pruebas. Se alternarán entre virtuales y
                      físicas automáticamente.
                    </p>
                  </div>
                </button>
                <button
                  className="debug-option-button delete-all"
                  onClick={handleDeleteAllCards}
                  disabled={isLoading}
                >
                  <span className="debug-option-icon">🗑️</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Eliminar Todas las Tarjetas</h3>
                    <p className="debug-option-description">
                      ⚠️ PELIGROSO: Elimina todas las tarjetas (IRREVERSIBLE)
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

export default TarjetasDebito
