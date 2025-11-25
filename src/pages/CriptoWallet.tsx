import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SyncIcon from '@mui/icons-material/Sync'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import './CriptoWallet.css'

interface Wallet {
  id: string
  wallet_name: string
  crypto_name: string
  address: string
  created_at: string
  updated_at: string
}

function CriptoWallet() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [walletFormData, setWalletFormData] = useState({
    wallet_name: '',
    crypto_name: '',
    address: '',
  })
  const [formErrors, setFormErrors] = useState({
    wallet_name: '',
    crypto_name: '',
    address: '',
  })

  // Cargar wallets desde la API
  useEffect(() => {
    const loadWallets = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await api.getWallets()
        if (response.wallets && Array.isArray(response.wallets)) {
          setWallets(response.wallets)
        } else {
          setWallets([])
        }
      } catch (err: any) {
        console.error('Error al cargar wallets:', err)
        // Si es un error 500, puede ser que el endpoint no esté implementado aún
        // En ese caso, simplemente mostramos lista vacía sin error
        if (err.response?.status === 500) {
          console.warn(
            'Endpoint de wallets devuelve 500. Puede que no esté implementado aún en el backend.'
          )
          setWallets([])
          // No mostramos error al usuario si es 500, solo lista vacía
        } else {
          const errorMessage =
            err.data?.error ||
            err.data?.message ||
            'Error al cargar las wallets. Por favor, intenta de nuevo.'
          setError(errorMessage)
          setWallets([])
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadWallets()
  }, [])

  const handleOpenWalletModal = () => {
    setIsWalletModalOpen(true)
    setIsEditMode(false)
    setWalletFormData({
      wallet_name: '',
      crypto_name: '',
      address: '',
    })
    setFormErrors({
      wallet_name: '',
      crypto_name: '',
      address: '',
    })
  }

  const handleCloseWalletModal = () => {
    setIsWalletModalOpen(false)
    setWalletFormData({
      wallet_name: '',
      crypto_name: '',
      address: '',
    })
    setFormErrors({
      wallet_name: '',
      crypto_name: '',
      address: '',
    })
  }

  const handleOpenDetailModal = (wallet: Wallet) => {
    setSelectedWallet(wallet)
    setIsDetailModalOpen(true)
    setIsEditMode(false)
    setWalletFormData({
      wallet_name: wallet.wallet_name,
      crypto_name: wallet.crypto_name,
      address: wallet.address,
    })
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedWallet(null)
    setIsEditMode(false)
  }

  const handleWalletChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setWalletFormData({
      ...walletFormData,
      [e.target.name]: e.target.value,
    })
    if (formErrors[e.target.name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [e.target.name]: '',
      })
    }
  }

  const validateWalletForm = (): boolean => {
    const errors = {
      wallet_name: '',
      crypto_name: '',
      address: '',
    }
    let isValid = true

    if (!walletFormData.wallet_name.trim()) {
      errors.wallet_name = 'El nombre de la wallet es requerido'
      isValid = false
    }

    if (!walletFormData.crypto_name.trim()) {
      errors.crypto_name = 'El nombre de la criptomoneda es requerido'
      isValid = false
    }

    if (!walletFormData.address.trim()) {
      errors.address = 'La dirección de la wallet es requerida'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleWalletSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateWalletForm()) {
      return
    }

    setIsLoading(true)
    try {
      if (isEditMode && selectedWallet) {
        await api.updateWallet(selectedWallet.id, {
          wallet_name: walletFormData.wallet_name.trim(),
          crypto_name: walletFormData.crypto_name.trim(),
          address: walletFormData.address.trim(),
        })
      } else {
        await api.createWallet({
          wallet_name: walletFormData.wallet_name.trim(),
          crypto_name: walletFormData.crypto_name.trim(),
          address: walletFormData.address.trim(),
        })
      }

      // Recargar wallets
      const response = await api.getWallets()
      if (response.wallets && Array.isArray(response.wallets)) {
        setWallets(response.wallets)
      }

      handleCloseWalletModal()
      if (isDetailModalOpen) {
        handleCloseDetailModal()
      }
    } catch (err: any) {
      console.error('Error al guardar wallet:', err)
      const errorMessage =
        err.data?.error ||
        err.data?.message ||
        'Error al guardar la wallet. Por favor, intenta de nuevo.'
      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditClick = () => {
    setIsEditMode(true)
    const walletToEdit = selectedWallet

    setIsDetailModalOpen(false)

    setTimeout(() => {
      if (walletToEdit) {
        setSelectedWallet(walletToEdit)
        setWalletFormData({
          wallet_name: walletToEdit.wallet_name,
          crypto_name: walletToEdit.crypto_name,
          address: walletToEdit.address,
        })
        setIsWalletModalOpen(true)
      }
    }, 100)
  }

  const handleDeleteClick = async () => {
    if (!selectedWallet) return

    if (
      !window.confirm(
        `¿Estás seguro de que deseas eliminar la wallet "${selectedWallet.wallet_name}"?`
      )
    ) {
      return
    }

    setIsLoading(true)
    try {
      await api.deleteWallet(selectedWallet.id)
      const response = await api.getWallets()
      if (response.wallets && Array.isArray(response.wallets)) {
        setWallets(response.wallets)
      }
      handleCloseDetailModal()
    } catch (err: any) {
      console.error('Error al eliminar:', err)
      const errorMessage =
        err.data?.error || err.data?.message || 'Error al eliminar. Por favor, intenta de nuevo.'
      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Función de debug para crear wallets de prueba
  const handleDebugCreateWallets = async () => {
    const testWallets = [
      {
        wallet_name: 'Bitcoin Wallet Principal',
        crypto_name: 'Bitcoin',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      },
      {
        wallet_name: 'Ethereum Wallet',
        crypto_name: 'Ethereum',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      },
      {
        wallet_name: 'QRL Wallet',
        crypto_name: 'QRL',
        address: 'Q010500b3b0c5c8c5c8c5c8c5c8c5c8c5c8c5c8c5c8c5c8c5c8c5c8c5c8c5c8c5',
      },
      {
        wallet_name: 'Bitcoin Wallet Secundaria',
        crypto_name: 'Bitcoin',
        address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
      },
      {
        wallet_name: 'Ethereum Wallet DeFi',
        crypto_name: 'Ethereum',
        address: '0x8ba1f109551bD432803012645Hac136c22C335',
      },
    ]

    try {
      setIsLoading(true)
      for (const wallet of testWallets) {
        await api.createWallet(wallet)
      }
      // Recargar wallets después de crear todas
      const response = await api.getWallets()
      if (response.wallets && Array.isArray(response.wallets)) {
        setWallets(response.wallets)
      }
      setIsDebugModalOpen(false)
      showNotification('5 wallets de prueba creadas exitosamente', 'success')
    } catch (err: any) {
      console.error('Error al crear wallets de prueba:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al crear las wallets de prueba. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Función de debug para borrar todas las wallets
  const handleDeleteAllWallets = async () => {
    if (
      window.confirm(
        '¿Estás seguro de que quieres eliminar TODAS las wallets? Esta acción es IRREVERSIBLE.'
      )
    ) {
      try {
        setIsLoading(true)
        await api.deleteAllWallets()
        // Recargar wallets después de borrar todas
        const response = await api.getWallets()
        if (response.wallets && Array.isArray(response.wallets)) {
          setWallets(response.wallets)
        }
        setIsDebugModalOpen(false)
        showNotification('Todas las wallets han sido eliminadas exitosamente', 'success')
      } catch (err: any) {
        console.error('Error al eliminar todas las wallets:', err)
        const errorMessage = getTranslatedErrorMessage(
          err,
          'Error al eliminar las wallets. Por favor, intenta de nuevo.'
        )
        showNotification(errorMessage, 'error')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <>
      <div className="app-page-container">
        <div className="app-page-content cripto-wallet-content">
          {isLoading && wallets.length === 0 ? (
            <div className="loader-container">
              <div className="loader">
                <div className="loader-spinner"></div>
                <p className="loader-text">Cargando wallets...</p>
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
              {/* Toolbar - HIG: Navigation */}
              <div className="cripto-wallet-toolbar">
                <button
                  className="cripto-wallet-toolbar-button"
                  onClick={() => navigate('/finanzas')}
                  aria-label="Volver a Finanzas"
                  type="button"
                >
                  <ArrowBackIcon className="cripto-wallet-toolbar-icon" />
                </button>
                <div className="cripto-wallet-toolbar-menu-container">
                  <button
                    className="cripto-wallet-toolbar-button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Opciones"
                    aria-expanded={isMenuOpen}
                    type="button"
                  >
                    <MoreVertIcon className="cripto-wallet-toolbar-icon" />
                  </button>
                  {isMenuOpen && (
                    <div className="cripto-wallet-menu">
                      <button
                        className="cripto-wallet-menu-item"
                        onClick={() => {
                          setIsMenuOpen(false)
                          handleOpenWalletModal()
                        }}
                        type="button"
                      >
                        <AddIcon className="cripto-wallet-menu-icon" />
                        <span>Agregar Wallet</span>
                      </button>
                      {api.isTestUser() && (
                        <button
                          className="cripto-wallet-menu-item"
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

              {/* Encabezado de Sección - HIG: Clear Navigation */}
              <h1 className="cripto-wallet-page-title">Cripto Wallet</h1>

              {/* Lista de Wallets */}
              <div className="cripto-wallet-list">
                {wallets.length === 0 ? (
                  <div className="cripto-wallet-empty">
                    <AccountBalanceWalletIcon className="cripto-wallet-empty-icon" />
                    <p className="cripto-wallet-empty-text">No hay wallets registradas</p>
                    <button
                      className="cripto-wallet-empty-button"
                      onClick={handleOpenWalletModal}
                      type="button"
                    >
                      <AddIcon />
                      <span>Agregar Wallet</span>
                    </button>
                  </div>
                ) : (
                  wallets.map(wallet => (
                    <button
                      key={wallet.id}
                      className="cripto-wallet-row"
                      onClick={() => handleOpenDetailModal(wallet)}
                      type="button"
                    >
                      <div className="cripto-wallet-row-content">
                        <div className="cripto-wallet-row-header">
                          <h3 className="cripto-wallet-row-title">{wallet.wallet_name}</h3>
                          <ChevronRightIcon
                            className="cripto-wallet-row-chevron"
                            aria-hidden="true"
                          />
                        </div>
                        <p className="cripto-wallet-row-subtitle">{wallet.crypto_name}</p>
                        <p className="cripto-wallet-row-address">{wallet.address}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal para Wallet */}
      {isWalletModalOpen && (
        <div className="modal-overlay edit-modal-overlay" onClick={handleCloseWalletModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{isEditMode ? 'Editar Wallet' : 'Nueva Wallet'}</h2>
              <button
                className="modal-close"
                onClick={handleCloseWalletModal}
                aria-label="Cerrar modal"
                type="button"
              >
                ×
              </button>
            </div>
            <form className="modal-form" onSubmit={handleWalletSubmit}>
              <div className="form-group">
                <label htmlFor="wallet_name" className="form-label">
                  Nombre de la Wallet
                </label>
                <input
                  type="text"
                  id="wallet_name"
                  name="wallet_name"
                  value={walletFormData.wallet_name}
                  onChange={handleWalletChange}
                  className={formErrors.wallet_name ? 'input-error' : ''}
                  placeholder="Ej: Mi Wallet Bitcoin"
                  required
                />
                {formErrors.wallet_name && (
                  <span className="error-message" role="alert">
                    {formErrors.wallet_name}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="crypto_name" className="form-label">
                  Criptomoneda
                </label>
                <input
                  type="text"
                  id="crypto_name"
                  name="crypto_name"
                  value={walletFormData.crypto_name}
                  onChange={handleWalletChange}
                  className={formErrors.crypto_name ? 'input-error' : ''}
                  placeholder="Ej: Bitcoin, Ethereum, QRL"
                  required
                />
                {formErrors.crypto_name && (
                  <span className="error-message" role="alert">
                    {formErrors.crypto_name}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="address" className="form-label">
                  Dirección de la Wallet
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={walletFormData.address}
                  onChange={handleWalletChange}
                  className={formErrors.address ? 'input-error' : ''}
                  placeholder="Ej: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                  required
                />
                {formErrors.address && (
                  <span className="error-message" role="alert">
                    {formErrors.address}
                  </span>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-button secondary"
                  onClick={handleCloseWalletModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="modal-button primary" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalle */}
      {isDetailModalOpen && selectedWallet && (
        <div className="modal-overlay" onClick={handleCloseDetailModal}>
          <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedWallet.wallet_name}</h2>
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
                  <h3 className="detail-name">{selectedWallet.wallet_name}</h3>
                  <p className="detail-bank">{selectedWallet.crypto_name}</p>
                </div>
              </div>

              <div className="detail-row">
                <span className="detail-label">Dirección</span>
                <span className="detail-value">{selectedWallet.address}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Creada</span>
                <span className="detail-value">{formatDate(selectedWallet.created_at)}</span>
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
                <span>Editar Wallet</span>
              </button>
              <button
                className="detail-button delete"
                onClick={handleDeleteClick}
                aria-label="Eliminar"
                type="button"
              >
                <DeleteIcon />
                <span>Eliminar Wallet</span>
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
              <h2 className="modal-title">Debug - Wallets</h2>
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
                  onClick={handleDebugCreateWallets}
                  disabled={isLoading}
                  type="button"
                >
                  <span className="debug-option-icon">📦</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Crear Wallets Demo</h3>
                    <p className="debug-option-description">
                      Crea 5 wallets de ejemplo para pruebas
                    </p>
                  </div>
                </button>
                <button
                  className="debug-option-button delete-all"
                  onClick={handleDeleteAllWallets}
                  disabled={isLoading}
                  type="button"
                >
                  <span className="debug-option-icon">🗑️</span>
                  <div className="debug-option-info">
                    <h3 className="debug-option-title">Eliminar Todas las Wallets</h3>
                    <p className="debug-option-description">
                      ⚠️ PELIGROSO: Elimina todas las wallets (IRREVERSIBLE)
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

export default CriptoWallet
