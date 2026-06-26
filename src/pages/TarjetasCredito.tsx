import { useState, useEffect, useRef } from 'react'
import CrudSummaryStrip from '../components/crud/CrudSummaryStrip'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import WarningIcon from '@mui/icons-material/Warning'
import { api } from '../services/api'
import { isDebugToolsEnabled } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import { emitTransactionSyncEvents } from '../utils/transactionMutation'
import FinanzasSubHeader from '../components/finanzas/FinanzasSubHeader'
import CollapsibleAdviceBanner from '../components/CollapsibleAdviceBanner'
import './AppPage.css'
import './TarjetasCredito.css'

function buildCutDate(cutDayInput: string): string {
  if (cutDayInput.trim()) {
    const cutDay = parseInt(cutDayInput.trim(), 10)
    if (!isNaN(cutDay) && cutDay >= 1 && cutDay <= 31) {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(cutDay).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  }
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}-15`
}

function buildLinkedDebtPayload(params: {
  nombre: string
  banco: string
  cupoNum: number
  tasaNum: number
  cupoUsadoNum: number
  fechaCorte: string
}) {
  const baseAmount = params.cupoUsadoNum > 0 ? params.cupoUsadoNum : params.cupoNum
  return {
    value: params.cupoNum,
    currency: 'COP',
    concept: params.nombre.trim(),
    owed: params.cupoUsadoNum > 0 ? params.cupoUsadoNum : 0,
    interest_rate: params.tasaNum,
    cut_date: buildCutDate(params.fechaCorte),
    reference: `${params.banco.trim()} - ${params.nombre.trim()}`,
    minimum_payment: Math.round(baseAmount * 0.05),
  }
}

// Interfaz que coincide con la respuesta de la API (campos en inglés)
interface CreditCardAPI {
  id: string
  name: string
  bank: string
  credit_limit: number
  monthly_rate: number
  management_fee: number
  cut_date?: string
  used_credit?: number
  available_credit?: number
  benefits: string[]
  created_at: string
  updated_at: string
}

// Interfaz para uso interno del componente
interface CreditCard {
  id: string
  nombre: string
  banco: string
  cupo: number
  tasaMensual: number
  cuotaManejo: number
  fechaCorte?: string
  cupoUsado?: number
  cupoDisponible?: number
  beneficios: string[]
}

function TarjetasCredito() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isBenefitsModalOpen, setIsBenefitsModalOpen] = useState(false)
  const [allBenefits, setAllBenefits] = useState<{ benefit: string; cards: string[] }[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null)
  const [cards, setCards] = useState<CreditCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    banco: '',
    cupo: '',
    tasaMensual: '',
    cuotaManejo: '',
    fechaCorte: '',
    cupoUsado: '',
    beneficios: '',
  })
  const [formErrors, setFormErrors] = useState({
    nombre: '',
    banco: '',
    cupo: '',
    tasaMensual: '',
    cuotaManejo: '',
    fechaCorte: '',
    cupoUsado: '',
    beneficios: '',
  })

  // Mapear tarjeta de API a formato interno
  const mapCardFromAPI = (apiCard: CreditCardAPI): CreditCard => {
    return {
      id: apiCard.id,
      nombre: apiCard.name,
      banco: apiCard.bank,
      cupo: apiCard.credit_limit,
      tasaMensual: apiCard.monthly_rate,
      cuotaManejo: apiCard.management_fee || 0,
      fechaCorte: apiCard.cut_date || undefined,
      cupoUsado: apiCard.used_credit || 0,
      cupoDisponible: apiCard.available_credit || apiCard.credit_limit - (apiCard.used_credit || 0),
      beneficios: apiCard.benefits || [],
    }
  }

  // Cargar tarjetas desde la API
  useEffect(() => {
    const loadCards = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const cardsResponse = await api.getCreditCards()

        if (cardsResponse.credit_cards && Array.isArray(cardsResponse.credit_cards)) {
          const mappedCards = cardsResponse.credit_cards.map(card => mapCardFromAPI(card))
          setCards(mappedCards)
        } else {
          setCards([])
        }
      } catch (err: any) {
        console.error('Error al cargar tarjetas de crédito:', err)
        setError(
          'Frontend says: Error al cargar las tarjetas de crédito. Por favor, intenta de nuevo.'
        )
        setCards([])
      } finally {
        setIsLoading(false)
      }
    }

    loadCards()
  }, [])

  // Cerrar menú al hacer clic fuera - HIG: Clear Feedback
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(target)) {
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
      banco: '',
      cupo: '',
      tasaMensual: '',
      cuotaManejo: '',
      fechaCorte: '',
      cupoUsado: '',
      beneficios: '',
    })
    setFormErrors({
      nombre: '',
      banco: '',
      cupo: '',
      tasaMensual: '',
      cuotaManejo: '',
      fechaCorte: '',
      cupoUsado: '',
      beneficios: '',
    })
  }

  const handleOpenDetailModal = (card: CreditCard) => {
    setSelectedCard(card)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
    setFormData({
      nombre: card.nombre,
      banco: card.banco,
      cupo: card.cupo.toString(),
      tasaMensual: card.tasaMensual.toString(),
      cuotaManejo: card.cuotaManejo.toString(),
      fechaCorte: extractDayFromCutDate(card.fechaCorte),
      cupoUsado: (card.cupoUsado || 0).toString(),
      beneficios: card.beneficios.join(', '),
    })
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedCard(null)
    setIsEditMode(false)
    setFormData({
      nombre: '',
      banco: '',
      cupo: '',
      tasaMensual: '',
      cuotaManejo: '',
      fechaCorte: '',
      cupoUsado: '',
      beneficios: '',
    })
    setFormErrors({
      nombre: '',
      banco: '',
      cupo: '',
      tasaMensual: '',
      cuotaManejo: '',
      fechaCorte: '',
      cupoUsado: '',
      beneficios: '',
    })
  }

  const handleEditClick = () => {
    setIsEditMode(true)
  }

  const handleDeleteClick = async () => {
    if (!selectedCard) return

    // Buscar y eliminar la deuda asociada
    let associatedDebt = null
    try {
      const debtsResponse = await api.getDebts()
      if (debtsResponse.debts && Array.isArray(debtsResponse.debts)) {
        const debtToDelete = debtsResponse.debts.find(
          (d: any) => (d.concept || d.concepto) === selectedCard.nombre
        )
        if (debtToDelete) {
          associatedDebt = debtToDelete
          await api.deleteDebt(debtToDelete.id)
          console.log('Deuda asociada eliminada:', selectedCard.nombre)
        }
      }
    } catch (debtError: any) {
      console.error('Error al eliminar deuda asociada:', debtError)
      // Continuar con la eliminación de la tarjeta aunque falle la deuda
    }

    if (
      window.confirm(
        `¿Estás seguro de que quieres eliminar la tarjeta "${selectedCard.nombre}"?${associatedDebt ? ' La deuda asociada también será eliminada.' : ''}`
      )
    ) {
      try {
        await api.deleteCreditCard(selectedCard.id)
        // Recargar tarjetas después de eliminar
        const response = await api.getCreditCards()
        if (response.credit_cards && Array.isArray(response.credit_cards)) {
          const mappedCards = response.credit_cards.map(card => mapCardFromAPI(card))
          setCards(mappedCards)
        }
        handleCloseDetailModal()
      } catch (err: any) {
        console.error('Error al eliminar tarjeta:', err)
        const errorMessage = getTranslatedErrorMessage(
          err,
          'Error al eliminar la tarjeta. Por favor, intenta de nuevo.'
        )
        showNotification(errorMessage, 'error')
      }
    }
  }

  const validateForm = async (): Promise<boolean> => {
    const errors = {
      nombre: '',
      banco: '',
      cupo: '',
      tasaMensual: '',
      cuotaManejo: '',
      fechaCorte: '',
      cupoUsado: '',
      beneficios: '',
    }
    let isValid = true

    // Validar nombre
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido'
      isValid = false
    }

    // Validar banco
    if (!formData.banco.trim()) {
      errors.banco = 'El banco es requerido'
      isValid = false
    }

    // Validar cupo
    if (!formData.cupo.trim()) {
      errors.cupo = 'El cupo es requerido'
      isValid = false
    } else {
      const cupoNum = parseFloat(formData.cupo)
      if (isNaN(cupoNum) || cupoNum <= 0) {
        errors.cupo = 'El cupo debe ser un número positivo'
        isValid = false
      }
    }

    // Validar tasa mensual
    if (!formData.tasaMensual.trim()) {
      errors.tasaMensual = 'La tasa mensual es requerida'
      isValid = false
    } else {
      const tasaNum = parseFloat(formData.tasaMensual)
      if (isNaN(tasaNum) || tasaNum < 0) {
        errors.tasaMensual = 'La tasa mensual debe ser un número positivo'
        isValid = false
      }
    }

    // Validar cuota de manejo (opcional pero debe ser positivo si se ingresa)
    if (formData.cuotaManejo.trim()) {
      const cuotaNum = parseFloat(formData.cuotaManejo)
      if (isNaN(cuotaNum) || cuotaNum < 0) {
        errors.cuotaManejo = 'La cuota de manejo debe ser un número positivo'
        isValid = false
      }
    }

    // Validar cupo usado (opcional pero debe ser positivo y no exceder el cupo si se ingresa)
    if (formData.cupoUsado.trim()) {
      const cupoUsadoNum = parseFloat(formData.cupoUsado)
      if (isNaN(cupoUsadoNum) || cupoUsadoNum < 0) {
        errors.cupoUsado = 'El cupo usado debe ser un número positivo'
        isValid = false
      } else if (formData.cupo.trim()) {
        const cupoNum = parseFloat(formData.cupo)
        if (!isNaN(cupoNum) && cupoUsadoNum > cupoNum) {
          errors.cupoUsado = 'El cupo usado no puede exceder el cupo de crédito'
          isValid = false
        }
      }
    }

    // Validar nombre único - primero verificar contra el estado local
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

    // Validar contra la API para asegurarse de tener datos actualizados
    if (isValid && nombreNormalizado) {
      try {
        const allCards = await api.getCreditCards()
        if (allCards.credit_cards && Array.isArray(allCards.credit_cards)) {
          const nombreExists = allCards.credit_cards.some(
            card =>
              card.name.toLowerCase() === nombreNormalizado &&
              (!isEditMode || card.id !== selectedCard?.id)
          )
          if (nombreExists) {
            errors.nombre = 'Este nombre ya está en uso'
            isValid = false
          }
        }
      } catch (err) {
        console.error('Error al validar contra la API:', err)
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
      !formData.banco.trim() ||
      !formData.cupo.trim() ||
      !formData.tasaMensual.trim()
    ) {
      showNotification('Por favor completa todos los campos requeridos', 'warning')
      return
    }

    const cupoNum = parseFloat(formData.cupo)
    const tasaNum = parseFloat(formData.tasaMensual)
    const cuotaNum = formData.cuotaManejo.trim() ? parseFloat(formData.cuotaManejo) : 0
    const cupoUsadoNum = formData.cupoUsado.trim() ? parseFloat(formData.cupoUsado) : 0

    if (isNaN(cupoNum) || cupoNum <= 0) {
      showNotification('El cupo debe ser un número positivo', 'warning')
      return
    }

    if (isNaN(tasaNum) || tasaNum < 0) {
      showNotification('La tasa mensual debe ser un número positivo', 'warning')
      return
    }

    if (formData.cuotaManejo.trim() && (isNaN(cuotaNum) || cuotaNum < 0)) {
      showNotification('La cuota de manejo debe ser un número positivo', 'warning')
      return
    }

    if (formData.cupoUsado.trim() && (isNaN(cupoUsadoNum) || cupoUsadoNum < 0)) {
      showNotification('El cupo usado debe ser un número positivo', 'warning')
      return
    }

    if (cupoUsadoNum > cupoNum) {
      showNotification('El cupo usado no puede exceder el cupo de crédito', 'warning')
      return
    }

    try {
      // Procesar beneficios: convertir string separado por comas a array
      const beneficiosArray = formData.beneficios.trim()
        ? formData.beneficios
            .split(',')
            .map(b => b.trim())
            .filter(b => b.length > 0)
        : []

      const cardData: any = {
        name: formData.nombre.trim(),
        bank: formData.banco.trim(),
        credit_limit: cupoNum,
        monthly_rate: tasaNum,
      }

      // Solo agregar campos opcionales si tienen valor
      if (cuotaNum > 0) {
        cardData.management_fee = cuotaNum
      }

      if (formData.fechaCorte.trim()) {
        const cutDay = parseInt(formData.fechaCorte.trim())
        if (!isNaN(cutDay) && cutDay >= 1 && cutDay <= 31) {
          cardData.cut_date = buildCutDate(formData.fechaCorte)
        }
      }

      if (cupoUsadoNum > 0) {
        cardData.used_credit = cupoUsadoNum
      }

      if (beneficiosArray.length > 0) {
        cardData.benefits = beneficiosArray
      }

      console.log('Enviando datos de tarjeta de crédito:', cardData)

      if (isEditMode && selectedCard) {
        // Editar tarjeta existente
        await api.updateCreditCard(selectedCard.id, cardData)

        // Recargar tarjetas después de actualizar
        const response = await api.getCreditCards()
        if (response.credit_cards && Array.isArray(response.credit_cards)) {
          const mappedCards = response.credit_cards.map(card => mapCardFromAPI(card))
          setCards(mappedCards)
        }
        handleCloseDetailModal()
      } else {
        await api.createCreditCardWithDebt({
          ...cardData,
          create_linked_debt: true,
          debt: buildLinkedDebtPayload({
            nombre: formData.nombre,
            banco: formData.banco,
            cupoNum,
            tasaNum,
            cupoUsadoNum,
            fechaCorte: formData.fechaCorte,
          }),
        })

        const response = await api.getCreditCards()
        if (response.credit_cards && Array.isArray(response.credit_cards)) {
          const mappedCards = response.credit_cards.map(card => mapCardFromAPI(card))
          setCards(mappedCards)
        }
        emitTransactionSyncEvents()
        handleCloseModal()
      }
    } catch (err: any) {
      console.error('Error al guardar tarjeta:', err)
      const errorMessage =
        err.data?.error || err.message
          ? `Backend says: ${err.data?.error || err.message}`
          : 'Frontend says: Error al guardar la tarjeta. Por favor, intenta de nuevo.'
      alert(errorMessage)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target

    setFormData({
      ...formData,
      [name]: value,
    })

    // Limpiar errores cuando el usuario empiece a escribir
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      })
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  // Extraer el día de la fecha de corte para el formulario
  const extractDayFromCutDate = (cutDate: string | undefined): string => {
    if (!cutDate) return ''
    // Si viene en formato YYYY-MM-DD, extraer solo el día
    if (cutDate.includes('-')) {
      const parts = cutDate.split('-')
      if (parts.length >= 3) {
        const day = parseInt(parts[2])
        if (!isNaN(day) && day >= 1 && day <= 31) {
          return day.toString()
        }
      }
    }
    // Si es solo un número, devolverlo
    const day = parseInt(cutDate)
    if (!isNaN(day) && day >= 1 && day <= 31) {
      return day.toString()
    }
    return ''
  }

  const formatCutDate = (cutDate: string) => {
    if (!cutDate) return ''
    // Si viene en formato YYYY-MM-DD, extraer solo el día
    if (cutDate.includes('-')) {
      const parts = cutDate.split('-')
      if (parts.length >= 3) {
        const day = parseInt(parts[2])
        if (!isNaN(day) && day >= 1 && day <= 31) {
          return `Día ${day} de cada mes`
        }
      }
    }
    // Si es solo un número (día del mes), devolverlo con formato
    const day = parseInt(cutDate)
    if (!isNaN(day) && day >= 1 && day <= 31) {
      return `Día ${day} de cada mes`
    }
    return cutDate
  }

  // Calcular el total de cupo de crédito
  const calculateTotalCreditLimit = (): number => {
    return cards.reduce((total, card) => {
      return total + card.cupo
    }, 0)
  }

  // Calcular el total de cupo disponible
  const calculateTotalAvailableCredit = (): number => {
    return cards.reduce((total, card) => {
      const cupoDisponible =
        card.cupoDisponible !== undefined ? card.cupoDisponible : card.cupo - (card.cupoUsado || 0)
      return total + cupoDisponible
    }, 0)
  }

  // Función de debug para crear tarjetas de prueba
  const handleDebugCreateCards = async () => {
    const testCards = [
      {
        name: 'Visa Gold',
        bank: 'Bancolombia',
        credit_limit: 5000000,
        monthly_rate: 2.5,
        management_fee: 25000,
        cut_date: '2024-02-15',
        used_credit: 1500000,
        benefits: ['Millas', 'Cashback 2%', 'Seguro de viaje'],
      },
      {
        name: 'Mastercard Platinum',
        bank: 'Davivienda',
        credit_limit: 8000000,
        monthly_rate: 2.0,
        management_fee: 35000,
        cut_date: '2024-02-20',
        used_credit: 3200000,
        benefits: ['Millas', 'Lounge acceso', 'Seguro de viaje'],
      },
      {
        name: 'American Express',
        bank: 'Banco de Bogota',
        credit_limit: 10000000,
        monthly_rate: 1.8,
        management_fee: 50000,
        cut_date: '2024-02-25',
        used_credit: 0,
        benefits: ['Millas', 'Cashback 3%', 'Lounge acceso', 'Concierge'],
      },
      {
        name: 'Visa Clásica',
        bank: 'BBVA',
        credit_limit: 3000000,
        monthly_rate: 2.8,
        management_fee: 15000,
        cut_date: '2024-02-10',
        used_credit: 2400000,
        benefits: ['Cashback 1%'],
      },
      {
        name: 'Mastercard Black',
        bank: 'Santander',
        credit_limit: 15000000,
        monthly_rate: 1.5,
        management_fee: 60000,
        cut_date: '2024-02-28',
        used_credit: 7500000,
        benefits: ['Millas', 'Cashback 5%', 'Lounge acceso', 'Concierge', 'Seguro de viaje'],
      },
    ]

    try {
      setIsLoading(true)

      for (const card of testCards) {
        await api.createCreditCardWithDebt({
          name: card.name,
          bank: card.bank,
          credit_limit: card.credit_limit,
          monthly_rate: card.monthly_rate,
          management_fee: card.management_fee,
          cut_date: card.cut_date,
          used_credit: card.used_credit,
          benefits: card.benefits,
          create_linked_debt: true,
          debt: buildLinkedDebtPayload({
            nombre: card.name,
            banco: card.bank,
            cupoNum: card.credit_limit,
            tasaNum: card.monthly_rate,
            cupoUsadoNum: card.used_credit || 0,
            fechaCorte: card.cut_date?.split('-')[2] ?? '15',
          }),
        })
      }

      const response = await api.getCreditCards()
      if (response.credit_cards && Array.isArray(response.credit_cards)) {
        const mappedCards = response.credit_cards.map(card => mapCardFromAPI(card))
        setCards(mappedCards)
      }

      setIsDebugModalOpen(false)
      showNotification(
        `${testCards.length} tarjetas de crédito de prueba creadas exitosamente`,
        'success'
      )
      emitTransactionSyncEvents()
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

  // Función de debug para mostrar logs de tarjetas y deudas
  const handleDebugLogs = async () => {
    try {
      console.log('=== DEBUG: Información de Tarjetas y Deudas ===')

      // Cargar deudas
      const debtsResponse = await api.getDebts()
      console.log('📊 Respuesta completa de deudas:', debtsResponse)

      const debtsList: Array<{ concepto: string; adeudado: number }> = []
      if (debtsResponse.debts && Array.isArray(debtsResponse.debts)) {
        console.log(`📋 Total de deudas: ${debtsResponse.debts.length}`)
        debtsResponse.debts.forEach((debt: any, index: number) => {
          const concepto = debt.concept || debt.concepto
          const adeudado =
            debt.owed !== undefined ? debt.owed : debt.adeudado !== undefined ? debt.adeudado : 0
          debtsList.push({ concepto, adeudado })
          console.log(`  ${index + 1}. Deuda ID: ${debt.id}`)
          console.log(`     Concepto: "${concepto}"`)
          console.log(`     Adeudado: ${adeudado}`)
          console.log(`     Concept (raw): "${debt.concept}"`)
          console.log(`     Concepto (raw): "${debt.concepto}"`)
          console.log(`     Owed (raw): ${debt.owed}`)
          console.log(`     Adeudado (raw): ${debt.adeudado}`)
        })
      }

      // Cargar tarjetas
      const cardsResponse = await api.getCreditCards()
      console.log('💳 Respuesta completa de tarjetas:', cardsResponse)

      if (cardsResponse.credit_cards && Array.isArray(cardsResponse.credit_cards)) {
        console.log(`🔄 Total de tarjetas: ${cardsResponse.credit_cards.length}`)
        cardsResponse.credit_cards.forEach((card: any, index: number) => {
          console.log(`\n  ${index + 1}. Tarjeta ID: ${card.id}`)
          console.log(`     Nombre: "${card.name}"`)
          console.log(`     Nombre normalizado: "${card.name.trim().toLowerCase()}"`)

          // Buscar deuda asociada
          const cardNameNormalized = card.name.trim().toLowerCase()
          const associatedDebt = debtsList.find(d => {
            const debtConceptNormalized = d.concepto.trim().toLowerCase()
            return debtConceptNormalized === cardNameNormalized
          })

          if (associatedDebt) {
            console.log(`     ✅ Deuda encontrada:`)
            console.log(`        Concepto: "${associatedDebt.concepto}"`)
            console.log(`        Adeudado: ${associatedDebt.adeudado}`)
          } else {
            console.log(`     ❌ No se encontró deuda asociada`)
          }
        })
      }

      // Mostrar resumen en alert
      let alertMessage = '=== DEBUG: Información de Tarjetas y Deudas ===\n\n'
      alertMessage += `📊 Total de deudas: ${debtsList.length}\n`
      alertMessage += `💳 Total de tarjetas: ${cardsResponse.credit_cards?.length || 0}\n\n`

      alertMessage += '📋 DEUDAS:\n'
      debtsList.forEach((d, i) => {
        alertMessage += `${i + 1}. "${d.concepto}" - Adeudado: ${d.adeudado}\n`
      })

      alertMessage += '\n💳 TARJETAS:\n'
      if (cardsResponse.credit_cards && Array.isArray(cardsResponse.credit_cards)) {
        cardsResponse.credit_cards.forEach((card: any, i: number) => {
          const cardNameNormalized = card.name.trim().toLowerCase()
          const associatedDebt = debtsList.find(d => {
            const debtConceptNormalized = d.concepto.trim().toLowerCase()
            return debtConceptNormalized === cardNameNormalized
          })
          alertMessage += `${i + 1}. "${card.name}" - Deuda: ${associatedDebt ? `"${associatedDebt.concepto}" (${associatedDebt.adeudado})` : 'NO ENCONTRADA'}\n`
        })
      }

      alertMessage += '\n\nRevisa la consola (F12) para más detalles.'

      showNotification(alertMessage, 'info')
      console.log('=== FIN DEBUG ===')
    } catch (err: any) {
      console.error('Error en debug logs:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al obtener los logs de debug. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  // Función de debug para borrar todas las tarjetas
  const handleDeleteAllCards = async () => {
    if (
      window.confirm(
        '¿Estás seguro de que quieres eliminar TODAS las tarjetas de crédito? Esta acción es IRREVERSIBLE.'
      )
    ) {
      try {
        setIsLoading(true)
        await api.deleteAllCreditCards()
        // Recargar tarjetas después de borrar todas
        const response = await api.getCreditCards()
        if (response.credit_cards && Array.isArray(response.credit_cards)) {
          const mappedCards = response.credit_cards.map(card => mapCardFromAPI(card))
          setCards(mappedCards)
        }
        setIsDebugModalOpen(false)
        showNotification(
          'Todas las tarjetas de crédito han sido eliminadas exitosamente',
          'success'
        )
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

  const bancos = [
    'Bancolombia',
    'Davivienda',
    'Banco de Bogota',
    'GNB Sudameris',
    'Citibank',
    'Banco Agrario',
    'Banco de Occidente',
    'BBVA',
    'BTG Pactual',
    'Mundo Mujer',
    'Banco Caja Social',
    'ITAU',
    'Falabella',
    'Santander',
    'Bancamia',
    'JP Morgan Chase',
    'Mi Banco',
    'W',
    'Banco Popular',
    'Finandina',
    'Coopcentral',
    'Union',
    'Serfinanza',
    'Scotiabank',
    'Colpatria',
    'Bancoomeva',
    'Pichincha',
    'Av Villas',
    'Nequi',
    'Daviplata',
    'Movii',
    'Nu',
    'TPaga',
    'Tuya Pay',
    'Dale!',
    'Rappi',
    'Leal',
    'Bold',
    'Littio',
    'Uala',
    'Lulo Bank',
    'Coink',
    'Iris Neofinanciera',
    'Mercadopago',
    'PayU',
    'Deel',
    'Dolar App',
    'Wise USD',
    'Wise EUR',
    'Payoneer USD',
    'Payoneer EUR',
    'Paypal',
  ]

  // Colores para cada banco (mismo que en Cuentas y Tarjetas Débito)
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
    return bancoColors[banco] || '#FF2D55'
  }

  // Función para recopilar todos los beneficios de todas las tarjetas
  const handleShowAllBenefits = () => {
    const benefitsMap = new Map<string, string[]>()

    cards.forEach(card => {
      card.beneficios.forEach(benefit => {
        if (!benefitsMap.has(benefit)) {
          benefitsMap.set(benefit, [])
        }
        benefitsMap.get(benefit)!.push(card.nombre)
      })
    })

    const allBenefitsList = Array.from(benefitsMap.entries()).map(([benefit, cards]) => ({
      benefit,
      cards,
    }))

    setAllBenefits(allBenefitsList)
    setIsBenefitsModalOpen(true)
  }

  return (
    <>
      <div className="app-page-container">
        <div className="app-page-content app-page-content-wide tarjetas-credito-content finanzas-sub-content">
          {isLoading ? (
            <div className="loader-container">
              <div className="loader">
                <div className="loader-spinner"></div>
                <p className="loader-text">Cargando tarjetas de crédito...</p>
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
                title="Tarjetas de crédito"
                context="Cupo"
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

              <CrudSummaryStrip
                ariaLabel="Resumen de cupos"
                items={[
                  {
                    label: 'Cupo total',
                    value: formatPrice(calculateTotalCreditLimit()),
                    tone: 'info',
                  },
                  {
                    label: 'Disponible',
                    value: formatPrice(calculateTotalAvailableCredit()),
                    tone: 'available',
                  },
                ]}
              />

              <button
                type="button"
                className="btn-base btn-accent btn-block btn-submit crud-primary-cta"
                onClick={handleOpenModal}
                aria-label="Agregar tarjeta de crédito"
              >
                <AddIcon aria-hidden="true" />
                Agregar tarjeta
              </button>

              {cards.some(card => card.beneficios.length > 0) && (
                <button
                  type="button"
                  className="btn-base btn-secondary btn-block btn-submit"
                  onClick={handleShowAllBenefits}
                  aria-label="Ver todos los beneficios"
                >
                  Ver todos los beneficios
                </button>
              )}

              {/* Advertencia de Uso Responsable - HIG: Clear Feedback */}
              <CollapsibleAdviceBanner
                className="advice-banner--warning"
                title="Uso responsable de tarjetas de crédito"
                icon={<WarningIcon />}
              >
                <p className="advice-banner__text">
                  <strong>Uso responsable:</strong> Las tarjetas de crédito operan con tasas de
                  interés altas. Úsalas preferiblemente a una sola cuota o en compras sin
                  intereses. Recuerda que este es dinero prestado, úsalo con prudencia y
                  principalmente en emergencias. Aprovecha los beneficios y programas de
                  recompensas de tus tarjetas.
                </p>
              </CollapsibleAdviceBanner>

              {cards.length === 0 ? (
                <div className="empty-state">
                  <CreditCardIcon className="empty-icon" />
                  <p className="empty-text">No hay tarjetas de crédito agregadas</p>
                  <p className="empty-subtext">Usa el botón de arriba para agregar la primera</p>
                </div>
              ) : (
                <div className="crud-card-list">
                  {cards.map(card => {
                    const cardColor = '#FF2D55'
                    const usagePercentage =
                      card.cupoUsado !== undefined && card.cupo > 0
                        ? (card.cupoUsado / card.cupo) * 100
                        : 0
                    const cupoDisponible =
                      card.cupoDisponible !== undefined
                        ? card.cupoDisponible
                        : card.cupo - (card.cupoUsado || 0)
                    return (
                      <button
                        key={card.id}
                        type="button"
                        className="crud-card-row crud-card-row--credit"
                        onClick={() => handleOpenDetailModal(card)}
                        aria-label={`Ver detalles de tarjeta ${card.nombre} de ${card.banco}. Cupo disponible: ${formatPrice(cupoDisponible)}`}
                        style={{ '--row-accent': cardColor } as React.CSSProperties}
                      >
                        <div className="crud-row-content">
                          <div className="crud-row-main">
                            <span className="crud-row-title">{card.nombre}</span>
                            <span className="crud-row-value crud-row-value--highlight-success">{formatPrice(cupoDisponible)}</span>
                          </div>
                          <div className="crud-row-secondary">
                            <span className="crud-row-meta crud-row-meta--expense">{card.banco}</span>
                            {card.cupoUsado !== undefined && card.cupoUsado > 0 && (
                              <span className="crud-row-meta crud-row-meta--expense">
                                {usagePercentage.toFixed(1)}% usado
                              </span>
                            )}
                            {card.beneficios.length > 0 && (
                              <span className="crud-row-meta crud-row-meta--expense">
                                {card.beneficios.length} beneficio
                                {card.beneficios.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          {card.cupoUsado !== undefined && card.cupoUsado > 0 && (
                            <div className="crud-row-progress crud-row-progress--thin">
                              <div className="crud-row-progress-bar crud-row-progress-bar--thin crud-row-progress-bar--thin-muted">
                                <div
                                  className="crud-row-progress-fill"
                                  style={{
                                    width: `${Math.min(usagePercentage, 100)}%`,
                                    backgroundColor: cardColor,
                                  }}
                                />
                              </div>
                            </div>
                          )}
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
              <h2 className="modal-title">Nueva Tarjeta de Crédito</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <div className="credit-card-warning">
              <div className="warning-header">
                <span className="warning-icon">⚠️</span>
                <h3 className="warning-title">Usame con cuidado, págame rápido, soy veneno puro</h3>
              </div>
              <div className="warning-tips">
                <p className="warning-subtitle">
                  Consejos para usar tu tarjeta de crédito sabiamente:
                </p>
                <ul className="tips-list">
                  <li className="tip-item">
                    💳 <strong>Paga el total cada mes:</strong> Evita los intereses pagando el saldo
                    completo antes de la fecha de corte
                  </li>
                  <li className="tip-item">
                    📅 <strong>Nunca uses más del 30% del cupo:</strong> Mantén tu utilización baja
                    para mejorar tu score crediticio
                  </li>
                  <li className="tip-item">
                    ⏰ <strong>Paga a tiempo siempre:</strong> Los pagos tardíos generan intereses y
                    afectan tu historial
                  </li>
                  <li className="tip-item">
                    🎯 <strong>Úsala solo para emergencias o compras planificadas:</strong> No es
                    dinero extra, es dinero prestado
                  </li>
                  <li className="tip-item">
                    📊 <strong>Revisa tus estados de cuenta:</strong> Detecta cargos no autorizados
                    y controla tus gastos
                  </li>
                  <li className="tip-item">
                    🚫 <strong>No saques efectivo:</strong> Los avances de efectivo tienen intereses
                    altísimos desde el día 1
                  </li>
                </ul>
              </div>
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
                  placeholder="Ej: Visa Gold"
                  className={`form-input-base ${formErrors.nombre ? 'input-error' : ''}`}
                />
                {formErrors.nombre && <span className="error-message">{formErrors.nombre}</span>}
              </div>
              <div className="form-group-base">
                <label htmlFor="banco" className="form-label-base">Banco Emisor</label>
                <select
                  id="banco"
                  name="banco"
                  value={formData.banco}
                  onChange={handleChange}
                  required
                  className={`form-input-base ${`form-select-base ${formErrors.banco ? 'input-error' : ''}`}`}
                >
                  <option value="">Selecciona un banco</option>
                  {bancos.map(banco => (
                    <option key={banco} value={banco}>
                      {banco}
                    </option>
                  ))}
                </select>
                {formErrors.banco && <span className="error-message">{formErrors.banco}</span>}
              </div>
              <div className="form-group-base">
                <label htmlFor="cupo" className="form-label-base">Cupo de Crédito (COP)</label>
                <input
                  type="number"
                  id="cupo"
                  name="cupo"
                  value={formData.cupo}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={`form-input-base ${formErrors.cupo ? 'input-error' : ''}`}
                />
                {formErrors.cupo && <span className="error-message">{formErrors.cupo}</span>}
              </div>
              <div className="form-group-base">
                <label htmlFor="cupoUsado" className="form-label-base">Cupo Usado (COP) - Opcional</label>
                <input
                  type="number"
                  id="cupoUsado"
                  name="cupoUsado"
                  value={formData.cupoUsado}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={`form-input-base ${formErrors.cupoUsado ? 'input-error' : ''}`}
                />
                {formErrors.cupoUsado && (
                  <span className="error-message">{formErrors.cupoUsado}</span>
                )}
                <p className="form-hint">Monto del cupo que ya has utilizado</p>
              </div>
              <div className="form-group-base">
                <label htmlFor="tasaMensual" className="form-label-base">Tasa Mensual (%)</label>
                <input
                  type="number"
                  id="tasaMensual"
                  name="tasaMensual"
                  value={formData.tasaMensual}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={`form-input-base ${formErrors.tasaMensual ? 'input-error' : ''}`}
                />
                {formErrors.tasaMensual && (
                  <span className="error-message">{formErrors.tasaMensual}</span>
                )}
              </div>
              <div className="form-group-base">
                <label htmlFor="cuotaManejo" className="form-label-base">Cuota de Manejo (COP) - Opcional</label>
                <input
                  type="number"
                  id="cuotaManejo"
                  name="cuotaManejo"
                  value={formData.cuotaManejo}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={`form-input-base ${formErrors.cuotaManejo ? 'input-error' : ''}`}
                />
                {formErrors.cuotaManejo && (
                  <span className="error-message">{formErrors.cuotaManejo}</span>
                )}
              </div>
              <div className="form-group-base">
                <label htmlFor="fechaCorte" className="form-label-base">Día de Corte (1-31) - Opcional</label>
                <input
                  type="number"
                  id="fechaCorte"
                  name="fechaCorte"
                  value={formData.fechaCorte}
                  onChange={handleChange}
                  min="1"
                  max="31"
                  placeholder="Ej: 15"
                  className={`form-input-base ${formErrors.fechaCorte ? 'input-error' : ''}`}
                />
                {formErrors.fechaCorte && (
                  <span className="error-message">{formErrors.fechaCorte}</span>
                )}
                <p className="form-hint">
                  El día del mes en que se cierra tu período de facturación (ej: 15 = día 15 de cada
                  mes)
                </p>
              </div>
              <div className="form-group-base">
                <label htmlFor="beneficios" className="form-label-base">Beneficios - Opcional (separados por comas)</label>
                <textarea
                  id="beneficios"
                  name="beneficios"
                  value={formData.beneficios}
                  onChange={handleChange}
                  placeholder="Ej: Millas, Cashback 2%, Seguro de viaje"
                  rows={3}
                  className={`form-textarea-base ${`form-input-base ${formErrors.beneficios ? 'input-error' : ''}`}`}
                />
                {formErrors.beneficios && (
                  <span className="error-message">{formErrors.beneficios}</span>
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
                      <p className="detail-bank">{selectedCard.banco}</p>
                    </div>
                  </div>

                  {selectedCard.cupoUsado !== undefined && selectedCard.cupoUsado > 0 && (
                    <div className="detail-strip-progress">
                      <div className="detail-strip-progress-bar">
                        <div
                          className="detail-strip-progress-fill"
                          style={{
                            width: `${Math.min((selectedCard.cupoUsado / selectedCard.cupo) * 100, 100)}%`,
                            backgroundColor: '#FF2D55',
                          }}
                        />
                      </div>
                      <span className="detail-strip-progress-text">
                        {((selectedCard.cupoUsado / selectedCard.cupo) * 100).toFixed(1)}%
                        utilizado
                      </span>
                    </div>
                  )}

                  <div className="detail-row">
                    <span className="detail-label">Banco:</span>
                    <span className="detail-value">{selectedCard.banco}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Cupo de Crédito:</span>
                    <span className="detail-value">{formatPrice(selectedCard.cupo)}</span>
                  </div>

                  {selectedCard.cupoUsado !== undefined && selectedCard.cupoUsado > 0 && (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">Cupo Usado:</span>
                        <span className="detail-value">{formatPrice(selectedCard.cupoUsado)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Cupo Disponible:</span>
                        <span className="detail-value">
                          {formatPrice(
                            selectedCard.cupoDisponible ||
                              selectedCard.cupo - selectedCard.cupoUsado
                          )}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="detail-row">
                    <span className="detail-label">Tasa Mensual:</span>
                    <span className="detail-value">
                      {formatPercentage(selectedCard.tasaMensual)}
                    </span>
                  </div>

                  {selectedCard.cuotaManejo > 0 && (
                    <div className="detail-row">
                      <span className="detail-label">Cuota de Manejo:</span>
                      <span className="detail-value">{formatPrice(selectedCard.cuotaManejo)}</span>
                    </div>
                  )}

                  {selectedCard.fechaCorte && (
                    <div className="detail-row">
                      <span className="detail-label">Día de Corte:</span>
                      <span className="detail-value">{formatCutDate(selectedCard.fechaCorte)}</span>
                    </div>
                  )}

                  {selectedCard.beneficios.length > 0 && (
                    <div className="detail-row">
                      <span className="detail-label">Beneficios:</span>
                      <div className="detail-benefits">
                        {selectedCard.beneficios.map((benefit, index) => (
                          <span key={index} className="benefit-tag">
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
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
                    placeholder="Ej: Visa Gold"
                    className={`form-input-base ${formErrors.nombre ? 'input-error' : ''}`}
                  />
                  {formErrors.nombre && <span className="error-message">{formErrors.nombre}</span>}
                </div>
                <div className="form-group-base">
                  <label htmlFor="edit-banco" className="form-label-base">Banco Emisor</label>
                  <select
                    id="edit-banco"
                    name="banco"
                    value={formData.banco}
                    onChange={handleChange}
                    required
                    className="form-select-base disabled-input"
                    disabled
                  >
                    <option value="">Selecciona un banco</option>
                    {bancos.map(banco => (
                      <option key={banco} value={banco}>
                        {banco}
                      </option>
                    ))}
                  </select>
                  <p className="form-hint">El banco no se puede modificar</p>
                </div>
                <div className="form-group-base">
                  <label htmlFor="edit-cupo" className="form-label-base">Cupo de Crédito (COP)</label>
                  <input
                    type="number"
                    id="edit-cupo"
                    name="cupo"
                    value={formData.cupo}
                    onChange={handleChange}
                    required
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className={`form-input-base ${formErrors.cupo ? 'input-error' : ''}`}
                  />
                  {formErrors.cupo && <span className="error-message">{formErrors.cupo}</span>}
                </div>
                <div className="form-group-base">
                  <label htmlFor="edit-cupoUsado" className="form-label-base">Cupo Usado (COP) - Opcional</label>
                  <input
                    type="number"
                    id="edit-cupoUsado"
                    name="cupoUsado"
                    value={formData.cupoUsado}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className={`form-input-base ${formErrors.cupoUsado ? 'input-error' : ''}`}
                  />
                  {formErrors.cupoUsado && (
                    <span className="error-message">{formErrors.cupoUsado}</span>
                  )}
                  <p className="form-hint">Monto del cupo que ya has utilizado</p>
                </div>
                <div className="form-group-base">
                  <label htmlFor="edit-tasaMensual" className="form-label-base">Tasa Mensual (%)</label>
                  <input
                    type="number"
                    id="edit-tasaMensual"
                    name="tasaMensual"
                    value={formData.tasaMensual}
                    onChange={handleChange}
                    required
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className={`form-input-base ${formErrors.tasaMensual ? 'input-error' : ''}`}
                  />
                  {formErrors.tasaMensual && (
                    <span className="error-message">{formErrors.tasaMensual}</span>
                  )}
                </div>
                <div className="form-group-base">
                  <label htmlFor="edit-cuotaManejo" className="form-label-base">Cuota de Manejo (COP) - Opcional</label>
                  <input
                    type="number"
                    id="edit-cuotaManejo"
                    name="cuotaManejo"
                    value={formData.cuotaManejo}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className={`form-input-base ${formErrors.cuotaManejo ? 'input-error' : ''}`}
                  />
                  {formErrors.cuotaManejo && (
                    <span className="error-message">{formErrors.cuotaManejo}</span>
                  )}
                </div>
                <div className="form-group-base">
                  <label htmlFor="edit-fechaCorte" className="form-label-base">Día de Corte (1-31) - Opcional</label>
                  <input
                    type="number"
                    id="edit-fechaCorte"
                    name="fechaCorte"
                    value={formData.fechaCorte}
                    onChange={handleChange}
                    min="1"
                    max="31"
                    placeholder="Ej: 15"
                    className={`form-input-base ${formErrors.fechaCorte ? 'input-error' : ''}`}
                  />
                  {formErrors.fechaCorte && (
                    <span className="error-message">{formErrors.fechaCorte}</span>
                  )}
                  <p className="form-hint">
                    El día del mes en que se cierra tu período de facturación (ej: 15 = día 15 de
                    cada mes)
                  </p>
                </div>
                <div className="form-group-base">
                  <label htmlFor="edit-beneficios" className="form-label-base">
                    Beneficios - Opcional (separados por comas)
                  </label>
                  <textarea
                    id="edit-beneficios"
                    name="beneficios"
                    value={formData.beneficios}
                    onChange={handleChange}
                    placeholder="Ej: Millas, Cashback 2%, Seguro de viaje"
                    rows={3}
                    className={`form-textarea-base ${`form-input-base ${formErrors.beneficios ? 'input-error' : ''}`}`}
                  />
                  {formErrors.beneficios && (
                    <span className="error-message">{formErrors.beneficios}</span>
                  )}
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
              <h2 className="modal-title">Debug - Tarjetas de Crédito</h2>
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
                      Crea 5 tarjetas de crédito de ejemplo para pruebas
                    </p>
                  </div>
                </button>
                <button
                  className="debug-option-button debug-logs"
                  onClick={handleDebugLogs}
                  disabled={isLoading}
                >
                  <span className="debug-option-icon">🔍</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Mostrar Logs de Debug</h3>
                    <p className="debug-option-description">
                      Muestra información detallada de tarjetas y deudas en consola y alert
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
                      ⚠️ PELIGROSO: Elimina todas las tarjetas de crédito (IRREVERSIBLE)
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

      {/* Modal de Todos los Beneficios */}
      {isBenefitsModalOpen && (
        <div className="modal-overlay" onClick={() => setIsBenefitsModalOpen(false)}>
          <div className="modal-content benefits-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Todos los Beneficios Activos</h2>
              <button className="modal-close" onClick={() => setIsBenefitsModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="benefits-modal-content">
              {allBenefits.length === 0 ? (
                <p className="no-benefits-message">
                  No hay beneficios registrados en tus tarjetas.
                </p>
              ) : (
                <ul className="benefits-list-modal">
                  {allBenefits.map((item, index) => (
                    <li key={index} className="benefit-item-modal">
                      <span className="benefit-icon">✓</span>
                      <div className="benefit-content">
                        <span className="benefit-text">{item.benefit}</span>
                        <span className="benefit-cards">Tarjetas: {item.cards.join(', ')}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-button cancel"
                onClick={() => setIsBenefitsModalOpen(false)}
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

export default TarjetasCredito
