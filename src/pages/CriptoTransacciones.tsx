import { useState, useEffect, useRef, useCallback } from 'react'
import CrudSummaryStrip from '../components/crud/CrudSummaryStrip'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SyncIcon from '@mui/icons-material/Sync'
import CurrencyBitcoinIcon from '@mui/icons-material/CurrencyBitcoin'
import CloseIcon from '@mui/icons-material/Close'
import { api } from '../services/api'
import { isDebugToolsEnabled } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import ListSkeleton from '../components/ListSkeleton'
import './AppPage.css'
import './CriptoTransacciones.css'

interface Wallet {
  id: string
  wallet_name: string
  crypto_name: string
  address: string
  created_at: string
  updated_at: string
}

interface Cryptocurrency {
  id: string
  crypto_name: string
  purchase_value: number
  purchase_date: string
  wallet_id: string
  units_purchased: number
  purchase_cost: number
  currency: string
  created_at: string
  updated_at: string
}

function CriptoTransacciones() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [isCryptoModalOpen, setIsCryptoModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [selectedCrypto, setSelectedCrypto] = useState<Cryptocurrency | null>(null)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [cryptocurrencies, setCryptocurrencies] = useState<Cryptocurrency[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cryptoFilter, setCryptoFilter] = useState<string>('all') // 'all', 'Bitcoin', 'Ethereum', 'QRL'
  const [exchangeRates, setExchangeRates] = useState<
    Array<{
      crypto_name: string
      value_in_usdt: number
      date: string
      updated_at: string
    }>
  >([])
  const [cryptoFormData, setCryptoFormData] = useState({
    crypto_name: '',
    purchase_value: '',
    purchase_date: '',
    wallet_id: '',
    units_purchased: '',
    purchase_cost: '',
    currency: 'USD',
  })
  const [formErrors, setFormErrors] = useState({
    crypto_name: '',
    purchase_value: '',
    purchase_date: '',
    wallet_id: '',
    units_purchased: '',
    purchase_cost: '',
  })

  // Cargar wallets desde la API (necesarias para el selector)
  useEffect(() => {
    const loadWallets = async () => {
      try {
        const response = await api.getWallets()
        if (response.wallets && Array.isArray(response.wallets)) {
          setWallets(response.wallets)
        } else {
          setWallets([])
        }
      } catch (err: any) {
        console.error('Error al cargar wallets:', err)
        if (err.response?.status === 500) {
          console.warn(
            'Endpoint de wallets devuelve 500. Puede que no esté implementado aún en el backend.'
          )
          setWallets([])
        } else {
          setWallets([])
        }
      }
    }

    loadWallets()
  }, [])

  // Cargar cryptocurrencies desde la API
  const loadCryptocurrencies = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.getCryptocurrencies()
      if (response.cryptocurrencies && Array.isArray(response.cryptocurrencies)) {
        setCryptocurrencies(response.cryptocurrencies)
      } else {
        setCryptocurrencies([])
      }
    } catch (err: any) {
      console.error('Error al cargar cryptocurrencies:', err)
      if (err.response?.status === 500) {
        console.warn(
          'Endpoint de cryptocurrencies devuelve 500. Puede que no esté implementado aún en el backend.'
        )
        setCryptocurrencies([])
      } else {
        const errorMessage =
          err.data?.error ||
          err.data?.message ||
          'Error al cargar las transacciones. Por favor, intenta de nuevo.'
        setError(errorMessage)
        setCryptocurrencies([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCryptocurrencies()
  }, [loadCryptocurrencies])

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

  // Cargar tasas de cambio de criptomonedas
  useEffect(() => {
    const loadExchangeRates = async () => {
      try {
        const response = await api.getCryptoExchangeRates()
        if (response.crypto_exchange_rates && Array.isArray(response.crypto_exchange_rates)) {
          setExchangeRates(
            response.crypto_exchange_rates.map((rate: any) => ({
              crypto_name: rate.crypto_name,
              value_in_usdt: rate.value_in_usdt,
              date: rate.date,
              updated_at: rate.updated_at,
            }))
          )
        } else {
          // Si no hay endpoint GET, intentar usar sync para obtener las tasas
          try {
            const syncResponse = await api.syncCryptoExchangeRates()
            if (
              syncResponse.crypto_exchange_rates &&
              Array.isArray(syncResponse.crypto_exchange_rates)
            ) {
              setExchangeRates(
                syncResponse.crypto_exchange_rates.map((rate: any) => ({
                  crypto_name: rate.crypto_name,
                  value_in_usdt: rate.value_in_usdt,
                  date: rate.date,
                  updated_at: rate.updated_at,
                }))
              )
            }
          } catch (syncErr) {
            console.warn('No se pudieron cargar las tasas de cambio:', syncErr)
            setExchangeRates([])
          }
        }
      } catch (err: any) {
        console.warn('Error al cargar tasas de cambio:', err)
        // Intentar usar sync como fallback
        try {
          const syncResponse = await api.syncCryptoExchangeRates()
          if (
            syncResponse.crypto_exchange_rates &&
            Array.isArray(syncResponse.crypto_exchange_rates)
          ) {
            setExchangeRates(
              syncResponse.crypto_exchange_rates.map((rate: any) => ({
                crypto_name: rate.crypto_name,
                value_in_usdt: rate.value_in_usdt,
                date: rate.date,
                updated_at: rate.updated_at,
              }))
            )
          }
        } catch (syncErr) {
          console.warn('No se pudieron cargar las tasas de cambio:', syncErr)
          setExchangeRates([])
        }
      }
    }

    loadExchangeRates()
  }, [])

  const handleOpenCryptoModal = () => {
    setIsCryptoModalOpen(true)
    setIsEditMode(false)
    setCryptoFormData({
      crypto_name: '',
      purchase_value: '',
      purchase_date: '',
      wallet_id: '',
      units_purchased: '',
      purchase_cost: '',
      currency: 'USD',
    })
    setFormErrors({
      crypto_name: '',
      purchase_value: '',
      purchase_date: '',
      wallet_id: '',
      units_purchased: '',
      purchase_cost: '',
    })
  }

  const handleCloseCryptoModal = () => {
    setIsCryptoModalOpen(false)
    setCryptoFormData({
      crypto_name: '',
      purchase_value: '',
      purchase_date: '',
      wallet_id: '',
      units_purchased: '',
      purchase_cost: '',
      currency: 'USD',
    })
    setFormErrors({
      crypto_name: '',
      purchase_value: '',
      purchase_date: '',
      wallet_id: '',
      units_purchased: '',
      purchase_cost: '',
    })
  }

  const handleOpenDetailModal = (crypto: Cryptocurrency) => {
    setSelectedCrypto(crypto)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
    setCryptoFormData({
      crypto_name: crypto.crypto_name,
      purchase_value: crypto.purchase_value.toString(),
      purchase_date: crypto.purchase_date.split('T')[0],
      wallet_id: crypto.wallet_id,
      units_purchased: crypto.units_purchased.toString(),
      purchase_cost: crypto.purchase_cost.toString(),
      currency: crypto.currency,
    })
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedCrypto(null)
    setIsEditMode(false)
  }

  const handleCryptoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const fieldName = e.target.name
    const fieldValue = e.target.value

    // Si cambia la criptomoneda, filtrar wallets y resetear wallet_id si no corresponde
    if (fieldName === 'crypto_name') {
      const selectedWallet = wallets.find(w => w.id === cryptoFormData.wallet_id)
      const newWalletId =
        selectedWallet && selectedWallet.crypto_name === fieldValue ? cryptoFormData.wallet_id : ''

      setCryptoFormData({
        ...cryptoFormData,
        crypto_name: fieldValue,
        wallet_id: newWalletId,
      })
    } else {
      setCryptoFormData({
        ...cryptoFormData,
        [fieldName]: fieldValue,
      })
    }

    if (formErrors[fieldName as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [fieldName]: '',
      })
    }
  }

  // Filtrar wallets basado en la criptomoneda seleccionada
  const getFilteredWallets = () => {
    if (!cryptoFormData.crypto_name) {
      return wallets
    }
    return wallets.filter(wallet => wallet.crypto_name === cryptoFormData.crypto_name)
  }

  // Filtrar transacciones por tipo de cripto
  const getFilteredCryptocurrencies = () => {
    if (cryptoFilter === 'all') {
      return cryptocurrencies
    }
    return cryptocurrencies.filter(crypto => crypto.crypto_name === cryptoFilter)
  }

  // Calcular balances por cripto
  const calculateCryptoBalances = () => {
    const balances: {
      [key: string]: {
        crypto_name: string
        totalUnits: number
        totalValueUSDT: number
        priceUSDT: number
        lastSyncDate: string | null
      }
    } = {}

    // Agrupar transacciones por cripto
    cryptocurrencies.forEach(crypto => {
      if (!balances[crypto.crypto_name]) {
        balances[crypto.crypto_name] = {
          crypto_name: crypto.crypto_name,
          totalUnits: 0,
          totalValueUSDT: 0,
          priceUSDT: 0,
          lastSyncDate: null,
        }
      }
      balances[crypto.crypto_name].totalUnits += crypto.units_purchased
    })

    // Calcular valores en USDT usando las tasas de cambio
    // Mapear nombres de cripto: Bitcoin -> BTC, Ethereum -> ETH, QRL -> QRL
    const cryptoNameMap: { [key: string]: string } = {
      Bitcoin: 'BTC',
      Ethereum: 'ETH',
      QRL: 'QRL',
    }

    Object.keys(balances).forEach(cryptoName => {
      const apiCryptoName = cryptoNameMap[cryptoName] || cryptoName
      const rate = exchangeRates.find(r => r.crypto_name === apiCryptoName)
      if (rate) {
        balances[cryptoName].priceUSDT = rate.value_in_usdt
        balances[cryptoName].totalValueUSDT = balances[cryptoName].totalUnits * rate.value_in_usdt
        balances[cryptoName].lastSyncDate = rate.updated_at || rate.date
      }
    })

    // Retornar solo los que tienen unidades > 0
    return Object.values(balances).filter(b => b.totalUnits > 0)
  }

  const validateCryptoForm = (): boolean => {
    const errors = {
      crypto_name: '',
      purchase_value: '',
      purchase_date: '',
      wallet_id: '',
      units_purchased: '',
      purchase_cost: '',
    }
    let isValid = true

    if (!cryptoFormData.crypto_name.trim()) {
      errors.crypto_name = 'El nombre de la criptomoneda es requerido'
      isValid = false
    }

    if (!cryptoFormData.purchase_value || parseFloat(cryptoFormData.purchase_value) <= 0) {
      errors.purchase_value = 'El precio unitario debe ser mayor a 0'
      isValid = false
    }

    if (!cryptoFormData.purchase_date) {
      errors.purchase_date = 'La fecha de compra es requerida'
      isValid = false
    }

    if (!cryptoFormData.wallet_id) {
      errors.wallet_id = 'Debes seleccionar una wallet'
      isValid = false
    }

    if (!cryptoFormData.units_purchased || parseFloat(cryptoFormData.units_purchased) <= 0) {
      errors.units_purchased = 'Las unidades compradas deben ser mayor a 0'
      isValid = false
    }

    if (!cryptoFormData.purchase_cost || parseFloat(cryptoFormData.purchase_cost) < 0) {
      errors.purchase_cost = 'Los fees y costos no pueden ser negativos'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleCryptoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateCryptoForm()) {
      return
    }

    setIsLoading(true)
    try {
      const cryptoData = {
        crypto_name: cryptoFormData.crypto_name.trim(),
        purchase_value: parseFloat(cryptoFormData.purchase_value),
        purchase_date: cryptoFormData.purchase_date,
        wallet_id: cryptoFormData.wallet_id,
        units_purchased: parseFloat(cryptoFormData.units_purchased),
        purchase_cost: parseFloat(cryptoFormData.purchase_cost),
        currency: cryptoFormData.currency,
      }

      if (isEditMode && selectedCrypto) {
        await api.updateCryptocurrency(selectedCrypto.id, cryptoData)
        showNotification('Transacción actualizada exitosamente', 'success')
      } else {
        await api.createCryptocurrency(cryptoData)
        showNotification('Transacción creada exitosamente', 'success')
      }

      // Recargar cryptocurrencies
      const response = await api.getCryptocurrencies()
      if (response.cryptocurrencies && Array.isArray(response.cryptocurrencies)) {
        setCryptocurrencies(response.cryptocurrencies)
      }

      handleCloseCryptoModal()
      if (isDetailModalOpen) {
        handleCloseDetailModal()
      }
    } catch (err: any) {
      console.error('Error al guardar transacción:', err)
      const errorMessage =
        err.data?.error ||
        err.data?.message ||
        'Error al guardar la transacción. Por favor, intenta de nuevo.'
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditClick = () => {
    setIsEditMode(true)
    const cryptoToEdit = selectedCrypto

    setIsDetailModalOpen(false)

    setTimeout(() => {
      if (cryptoToEdit) {
        setSelectedCrypto(cryptoToEdit)
        setCryptoFormData({
          crypto_name: cryptoToEdit.crypto_name,
          purchase_value: cryptoToEdit.purchase_value.toString(),
          purchase_date: cryptoToEdit.purchase_date.split('T')[0],
          wallet_id: cryptoToEdit.wallet_id,
          units_purchased: cryptoToEdit.units_purchased.toString(),
          purchase_cost: cryptoToEdit.purchase_cost.toString(),
          currency: cryptoToEdit.currency,
        })
        setIsCryptoModalOpen(true)
      }
    }, 100)
  }

  const handleDeleteClick = async () => {
    if (!selectedCrypto) return

    if (
      !window.confirm(
        `¿Estás seguro de que deseas eliminar la transacción de "${selectedCrypto.crypto_name}"?`
      )
    ) {
      return
    }

    setIsLoading(true)
    try {
      await api.deleteCryptocurrency(selectedCrypto.id)
      const response = await api.getCryptocurrencies()
      if (response.cryptocurrencies && Array.isArray(response.cryptocurrencies)) {
        setCryptocurrencies(response.cryptocurrencies)
      }
      showNotification('Transacción eliminada exitosamente', 'success')
      handleCloseDetailModal()
    } catch (err: any) {
      console.error('Error al eliminar:', err)
      const errorMessage =
        err.data?.error || err.data?.message || 'Error al eliminar. Por favor, intenta de nuevo.'
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Verificar si las tasas fueron actualizadas hoy
  const areRatesUpdatedToday = () => {
    if (exchangeRates.length === 0) return false

    const today = new Date()
    const todayString = today.toISOString().split('T')[0] // YYYY-MM-DD

    // Verificar que todas las tasas principales (BTC, ETH, QRL) estén actualizadas hoy
    const requiredCryptos = ['BTC', 'ETH', 'QRL']
    const ratesByCrypto: { [key: string]: boolean } = {}

    exchangeRates.forEach(rate => {
      if (rate.updated_at || rate.date) {
        const rateDateString = new Date(rate.updated_at || rate.date).toISOString().split('T')[0]
        ratesByCrypto[rate.crypto_name] = rateDateString === todayString
      }
    })

    // Verificar que todas las criptos requeridas estén actualizadas hoy
    return requiredCryptos.every(crypto => ratesByCrypto[crypto] === true)
  }

  const handleSyncExchangeRates = async () => {
    if (areRatesUpdatedToday()) {
      showNotification('Las tasas de cambio ya fueron actualizadas hoy. Intenta mañana.', 'info')
      return
    }

    setIsLoading(true)
    try {
      const response = await api.syncCryptoExchangeRates()
      // Actualizar las tasas después de sincronizar
      if (response.crypto_exchange_rates && Array.isArray(response.crypto_exchange_rates)) {
        setExchangeRates(
          response.crypto_exchange_rates.map((rate: any) => ({
            crypto_name: rate.crypto_name,
            value_in_usdt: rate.value_in_usdt,
            date: rate.date,
            updated_at: rate.updated_at,
          }))
        )
      }
      showNotification('Tasas de cambio sincronizadas exitosamente', 'success')
    } catch (err: any) {
      console.error('Error al sincronizar tasas de cambio:', err)
      const errorMessage =
        err.data?.error ||
        err.data?.message ||
        'Error al sincronizar las tasas de cambio. Por favor, intenta de nuevo.'
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Función de debug para crear transacciones de prueba
  const handleDebugCreateTransactions = async () => {
    if (wallets.length === 0) {
      showNotification(
        'Primero necesitas crear wallets. Ve a Cripto Wallet para crearlas.',
        'warning'
      )
      return
    }

    // Obtener una wallet de cada tipo
    const bitcoinWallet = wallets.find(w => w.crypto_name === 'Bitcoin')
    const ethereumWallet = wallets.find(w => w.crypto_name === 'Ethereum')
    const qrlWallet = wallets.find(w => w.crypto_name === 'QRL')

    const testTransactions = []

    if (bitcoinWallet) {
      testTransactions.push({
        crypto_name: 'Bitcoin',
        purchase_value: 45000.5,
        purchase_date: new Date().toISOString().split('T')[0],
        wallet_id: bitcoinWallet.id,
        units_purchased: 0.5,
        purchase_cost: 25.0, // Fees
        currency: 'USD',
      })
      testTransactions.push({
        crypto_name: 'Bitcoin',
        purchase_value: 48000.0,
        purchase_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Hace 7 días
        wallet_id: bitcoinWallet.id,
        units_purchased: 0.25,
        purchase_cost: 15.0,
        currency: 'USD',
      })
    }

    if (ethereumWallet) {
      testTransactions.push({
        crypto_name: 'Ethereum',
        purchase_value: 2800.0,
        purchase_date: new Date().toISOString().split('T')[0],
        wallet_id: ethereumWallet.id,
        units_purchased: 2.5,
        purchase_cost: 12.5, // Gas fees
        currency: 'USD',
      })
      testTransactions.push({
        crypto_name: 'Ethereum',
        purchase_value: 3000.0,
        purchase_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Hace 14 días
        wallet_id: ethereumWallet.id,
        units_purchased: 1.0,
        purchase_cost: 8.0,
        currency: 'USD',
      })
    }

    if (qrlWallet) {
      testTransactions.push({
        crypto_name: 'QRL',
        purchase_value: 1.75,
        purchase_date: new Date().toISOString().split('T')[0],
        wallet_id: qrlWallet.id,
        units_purchased: 1000.0,
        purchase_cost: 5.0,
        currency: 'USD',
      })
    }

    if (testTransactions.length === 0) {
      showNotification(
        'No hay wallets disponibles. Crea wallets en Cripto Wallet primero.',
        'warning'
      )
      return
    }

    try {
      setIsLoading(true)
      for (const transaction of testTransactions) {
        await api.createCryptocurrency(transaction)
      }
      // Recargar transacciones después de crear todas
      const response = await api.getCryptocurrencies()
      if (response.cryptocurrencies && Array.isArray(response.cryptocurrencies)) {
        setCryptocurrencies(response.cryptocurrencies)
      }
      setIsDebugModalOpen(false)
      showNotification(
        `${testTransactions.length} transacciones de prueba creadas exitosamente`,
        'success'
      )
    } catch (err: any) {
      console.error('Error al crear transacciones de prueba:', err)
      const errorMessage =
        err.data?.error ||
        err.data?.message ||
        'Error al crear transacciones de prueba. Por favor, intenta de nuevo.'
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Función de debug para eliminar todas las transacciones
  const handleDeleteAllTransactions = async () => {
    if (
      !window.confirm(
        '¿Estás seguro de que quieres eliminar TODAS las transacciones? Esta acción es IRREVERSIBLE.'
      )
    ) {
      return
    }

    try {
      setIsLoading(true)
      await api.deleteAllCryptocurrencies()
      // Recargar transacciones después de eliminar todas
      const response = await api.getCryptocurrencies()
      if (response.cryptocurrencies && Array.isArray(response.cryptocurrencies)) {
        setCryptocurrencies(response.cryptocurrencies)
      }
      setIsDebugModalOpen(false)
      showNotification('Todas las transacciones han sido eliminadas exitosamente', 'success')
    } catch (err: any) {
      console.error('Error al eliminar todas las transacciones:', err)
      const errorMessage =
        err.data?.error ||
        err.data?.message ||
        'Error al eliminar todas las transacciones. Por favor, intenta de nuevo.'
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const formatBalance = (balance: number, currency: string = 'USD') => {
    const locale = currency === 'EUR' ? 'es-ES' : currency === 'USD' ? 'en-US' : 'es-CO'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(balance)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getWalletName = (walletId: string) => {
    const wallet = wallets.find(w => w.id === walletId)
    return wallet ? wallet.wallet_name : 'Wallet desconocida'
  }

  const calculateHighlights = () => {
    const balances = calculateCryptoBalances()
    const totalValueUSDT = balances.reduce((sum, b) => sum + b.totalValueUSDT, 0)

    return {
      totalTransacciones: cryptocurrencies.length,
      totalValueUSDT,
      posiciones: balances.length,
      tasasActualizadas: areRatesUpdatedToday(),
    }
  }

  const highlights = calculateHighlights()

  return (
    <>
      <div className="app-page-container">
        <div className="app-page-content app-page-content-wide crud-page-content cripto-transacciones-content">
          {isLoading && cryptocurrencies.length === 0 ? (
            <>
              <div className="app-toolbar">
                <button
                  className="app-toolbar-button"
                  onClick={() => navigate('/finanzas')}
                  aria-label="Volver a Finanzas"
                  type="button"
                >
                  <ArrowBackIcon className="app-toolbar-icon" />
                </button>
              </div>
              <h1 className="app-page-title">Mi Cripto</h1>
              <div className="crud-crypto-list">
                <ListSkeleton variant="inset-row" count={5} aria-label="Cargando transacciones" />
              </div>
            </>
          ) : error && cryptocurrencies.length === 0 ? (
            <>
              <div className="app-toolbar">
                <button
                  className="app-toolbar-button"
                  onClick={() => navigate('/finanzas')}
                  aria-label="Volver a Finanzas"
                  type="button"
                >
                  <ArrowBackIcon className="app-toolbar-icon" />
                </button>
              </div>
              <h1 className="app-page-title">Mi Cripto</h1>
              <div className="loader-container">
                <div className="loader finanzas-stats-error-panel">
                  <p className="loader-text loader-text--error" role="alert">
                    {error}
                  </p>
                  <button
                    type="button"
                    className="btn-base btn-secondary btn-retry"
                    onClick={() => void loadCryptocurrencies()}
                    aria-label="Reintentar cargar transacciones"
                  >
                    <span>Reintentar</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="app-toolbar">
                <button
                  className="app-toolbar-button"
                  onClick={() => navigate('/finanzas')}
                  aria-label="Volver a Finanzas"
                  type="button"
                >
                  <ArrowBackIcon className="app-toolbar-icon" />
                </button>
                <button
                  className="app-toolbar-button"
                  onClick={() => void handleSyncExchangeRates()}
                  disabled={areRatesUpdatedToday() || isLoading}
                  aria-label="Sincronizar tasas de cambio"
                  type="button"
                >
                  <SyncIcon className="app-toolbar-icon" />
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
                              setIsDebugModalOpen(true)
                              setIsMenuOpen(false)
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

              <h1 className="app-page-title">Mi Cripto</h1>

              <CrudSummaryStrip
                ariaLabel="Resumen de posiciones cripto"
                items={[
                  {
                    label: 'Transacciones',
                    value: highlights.totalTransacciones,
                    tone: 'info',
                  },
                  {
                    label: 'Valor USDT',
                    value: formatBalance(highlights.totalValueUSDT, 'USD'),
                    tone: 'income',
                    emphasis: true,
                  },
                  { label: 'Posiciones', value: highlights.posiciones, tone: 'available' },
                  {
                    label: 'Tasas',
                    value: highlights.tasasActualizadas ? 'Hoy' : 'Pendiente',
                    tone: highlights.tasasActualizadas ? 'income' : 'expense',
                  },
                ]}
              />

              <button
                type="button"
                className="btn-base btn-accent btn-block btn-submit crud-primary-cta"
                onClick={handleOpenCryptoModal}
                aria-label="Agregar transacción"
              >
                <AddIcon aria-hidden={true} />
                Agregar transacción
              </button>

              <div className="cripto-transacciones-filter">
                <label htmlFor="crypto-filter" className="cripto-transacciones-filter-label">
                  Filtrar por:
                </label>
                <select
                  id="crypto-filter"
                  className="cripto-transacciones-filter-select"
                  value={cryptoFilter}
                  onChange={e => setCryptoFilter(e.target.value)}
                >
                  <option value="all">Todas</option>
                  <option value="Bitcoin">Bitcoin (BTC)</option>
                  <option value="Ethereum">Ethereum (ETH)</option>
                  <option value="QRL">QRL</option>
                </select>
              </div>

              {getFilteredCryptocurrencies().length === 0 ? (
                <div className="empty-state">
                  <CurrencyBitcoinIcon className="empty-state-icon" />
                  <p className="empty-text">
                    {cryptocurrencies.length === 0
                      ? 'No hay transacciones registradas'
                      : `No hay transacciones de ${cryptoFilter === 'all' ? 'ningún tipo' : cryptoFilter}`}
                  </p>
                  {cryptocurrencies.length === 0 && (
                    <p className="empty-subtext">Usa el botón de arriba para agregar la primera</p>
                  )}
                </div>
              ) : (
                <div className="crud-crypto-list">
                  {getFilteredCryptocurrencies().map(crypto => (
                    <button
                      key={crypto.id}
                      className="crud-crypto-row"
                      onClick={() => handleOpenDetailModal(crypto)}
                      type="button"
                      aria-label={`Ver detalles de ${crypto.crypto_name}`}
                    >
                      <div className="crud-row-content">
                        <div className="crud-row-header">
                          <span className="crud-row-title">{crypto.crypto_name}</span>
                          <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
                        </div>
                        <p className="crud-row-meta">
                          {getWalletName(crypto.wallet_id)} • {crypto.units_purchased} unidades
                        </p>
                        <p className="crud-row-meta">
                          {formatBalance(crypto.purchase_value, crypto.currency)}/unidad • Fees:{' '}
                          {formatBalance(crypto.purchase_cost, crypto.currency)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal para Cryptocurrency */}
      {isCryptoModalOpen && (
        <div className="modal-overlay edit-modal-overlay" onClick={handleCloseCryptoModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{isEditMode ? 'Editar' : 'Nueva'}</h2>
              <button
                className="modal-close"
                onClick={handleCloseCryptoModal}
                aria-label="Cerrar modal"
                type="button"
              >
                <CloseIcon />
              </button>
            </div>
            <form className="modal-form" onSubmit={handleCryptoSubmit}><div className="modal-panel__scroll">
              <div className="form-group-base">
                <label htmlFor="crypto_name" className="form-label-base">
                  Criptomoneda
                </label>
                <select
                  id="crypto_name"
                  name="crypto_name"
                  value={cryptoFormData.crypto_name}
                  onChange={handleCryptoChange}
                  className={`form-input-base ${formErrors.crypto_name ? 'input-error' : ''}`}
                  required
                >
                  <option value="">Selecciona una criptomoneda</option>
                  <option value="Bitcoin">Bitcoin (BTC)</option>
                  <option value="Ethereum">Ethereum (ETH)</option>
                  <option value="QRL">QRL</option>
                </select>
                {formErrors.crypto_name && (
                  <span className="error-message" role="alert">
                    {formErrors.crypto_name}
                  </span>
                )}
              </div>

              <div className="form-group-base">
                <label htmlFor="wallet_id" className="form-label-base">
                  Wallet
                </label>
                <select
                  id="wallet_id"
                  name="wallet_id"
                  value={cryptoFormData.wallet_id}
                  onChange={handleCryptoChange}
                  className={`form-input-base ${formErrors.wallet_id ? 'input-error' : ''}`}
                  required
                  disabled={!cryptoFormData.crypto_name}
                >
                  <option value="">
                    {cryptoFormData.crypto_name
                      ? 'Selecciona una wallet'
                      : 'Primero selecciona una criptomoneda'}
                  </option>
                  {getFilteredWallets().map(wallet => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.wallet_name} ({wallet.crypto_name})
                    </option>
                  ))}
                </select>
                {formErrors.wallet_id && (
                  <span className="error-message" role="alert">
                    {formErrors.wallet_id}
                  </span>
                )}
              </div>

              <div className="form-group-base">
                <label htmlFor="purchase_date" className="form-label-base">
                  Fecha de Compra
                </label>
                <input
                  type="date"
                  id="purchase_date"
                  name="purchase_date"
                  value={cryptoFormData.purchase_date}
                  onChange={handleCryptoChange}
                  className={`form-input-base ${formErrors.purchase_date ? 'input-error' : ''}`}
                  required
                />
                {formErrors.purchase_date && (
                  <span className="error-message" role="alert">
                    {formErrors.purchase_date}
                  </span>
                )}
              </div>

              <div className="form-group-base">
                <label htmlFor="units_purchased" className="form-label-base">
                  Unidades Compradas
                </label>
                <input
                  type="number"
                  id="units_purchased"
                  name="units_purchased"
                  value={cryptoFormData.units_purchased}
                  onChange={handleCryptoChange}
                  className={`form-input-base ${formErrors.units_purchased ? 'input-error' : ''}`}
                  placeholder="0.00000000"
                  step="0.00000001"
                  min="0.00000001"
                  required
                />
                {formErrors.units_purchased && (
                  <span className="error-message" role="alert">
                    {formErrors.units_purchased}
                  </span>
                )}
              </div>

              <div className="form-group-base">
                <label htmlFor="purchase_value" className="form-label-base">
                  Precio Unitario al Momento de Compra
                </label>
                <input
                  type="number"
                  id="purchase_value"
                  name="purchase_value"
                  value={cryptoFormData.purchase_value}
                  onChange={handleCryptoChange}
                  className={`form-input-base ${formErrors.purchase_value ? 'input-error' : ''}`}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                />
                {formErrors.purchase_value && (
                  <span className="error-message" role="alert">
                    {formErrors.purchase_value}
                  </span>
                )}
              </div>

              <div className="form-group-base">
                <label htmlFor="purchase_cost" className="form-label-base">
                  Fees y Costos (Gas, Comisiones, etc.)
                </label>
                <input
                  type="number"
                  id="purchase_cost"
                  name="purchase_cost"
                  value={cryptoFormData.purchase_cost}
                  onChange={handleCryptoChange}
                  className={`form-input-base ${formErrors.purchase_cost ? 'input-error' : ''}`}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
                {formErrors.purchase_cost && (
                  <span className="error-message" role="alert">
                    {formErrors.purchase_cost}
                  </span>
                )}
              </div>

              <div className="form-group-base">
                <label htmlFor="currency" className="form-label-base">
                  Moneda
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={cryptoFormData.currency}
                  onChange={handleCryptoChange}
                  required
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="COP">COP</option>
                </select>
              </div></div>

              <div className="modal-actions-base">
                <button type="submit" className="btn-base btn-accent btn-submit" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalle */}
      {isDetailModalOpen && selectedCrypto && (
        <div className="modal-overlay" onClick={handleCloseDetailModal}>
          <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedCrypto.crypto_name}</h2>
              <button
                className="modal-close"
                onClick={handleCloseDetailModal}
                aria-label="Cerrar modal"
                type="button"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="detail-content">
              <div className="detail-section">
                <div className="detail-info">
                  <h3 className="detail-name">{selectedCrypto.crypto_name}</h3>
                  <p className="detail-bank">{getWalletName(selectedCrypto.wallet_id)}</p>
                </div>
              </div>

              <div className="detail-row">
                <span className="detail-label">Unidades</span>
                <span className="detail-value">{selectedCrypto.units_purchased}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Precio Unitario</span>
                <span className="detail-value">
                  {formatBalance(selectedCrypto.purchase_value, selectedCrypto.currency)}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Fees y Costos</span>
                <span className="detail-value">
                  {formatBalance(selectedCrypto.purchase_cost, selectedCrypto.currency)}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Moneda</span>
                <span className="detail-value">{selectedCrypto.currency}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Fecha de Compra</span>
                <span className="detail-value">{formatDate(selectedCrypto.purchase_date)}</span>
              </div>
            </div>

            <div className="detail-actions">
              <button
                className="detail-button edit"
                onClick={handleEditClick}
                aria-label="Editar"
                type="button"
              >
                <EditIcon />
                <span>Editar</span>
              </button>
              <button
                className="detail-button delete"
                onClick={handleDeleteClick}
                aria-label="Eliminar"
                type="button"
              >
                <DeleteIcon />
                <span>Eliminar</span>
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
              <h2 className="modal-title">Debug - Transacciones</h2>
              <button
                className="modal-close"
                onClick={() => setIsDebugModalOpen(false)}
                aria-label="Cerrar modal"
                type="button"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="debug-modal-content">
              <div className="debug-options">
                <button
                  className="debug-option-button create-demo"
                  onClick={handleDebugCreateTransactions}
                  disabled={isLoading}
                  type="button"
                >
                  <span className="debug-option-icon">📦</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Crear Transacciones Demo</h3>
                    <p className="debug-option-description">
                      Crea transacciones de ejemplo para BTC, ETH y QRL (requiere wallets)
                    </p>
                  </div>
                </button>
                <button
                  className="debug-option-button delete-all"
                  onClick={handleDeleteAllTransactions}
                  disabled={isLoading}
                  type="button"
                >
                  <span className="debug-option-icon">🗑️</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Eliminar Todas las Transacciones</h3>
                    <p className="debug-option-description">
                      ⚠️ PELIGROSO: Elimina todas las transacciones (IRREVERSIBLE)
                    </p>
                  </div>
                </button>
              </div>
            </div>
            <div className="modal-actions-base">
              <button
                type="button"
                className="btn-base btn-secondary"
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

export default CriptoTransacciones
