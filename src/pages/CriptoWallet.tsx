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
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import { api } from '../services/api'
import { isDebugToolsEnabled } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import ListSkeleton from '../components/ListSkeleton'
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
  const menuRef = useRef<HTMLDivElement>(null)
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

  const loadWallets = useCallback(async () => {
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
      if (err.response?.status === 500) {
        console.warn(
          'Endpoint de wallets devuelve 500. Puede que no esté implementado aún en el backend.'
        )
        setWallets([])
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
  }, [])

  useEffect(() => {
    void loadWallets()
  }, [loadWallets])

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

  const calculateHighlights = () => {
    const totalWallets = wallets.length
    const distinctCryptos = new Set(wallets.map(w => w.crypto_name)).size
    const bitcoinWallets = wallets.filter(w =>
      w.crypto_name.toLowerCase().includes('bitcoin')
    ).length
    const ethereumWallets = wallets.filter(w =>
      w.crypto_name.toLowerCase().includes('ethereum')
    ).length

    return { totalWallets, distinctCryptos, bitcoinWallets, ethereumWallets }
  }

  const highlights = calculateHighlights()

  return (
    <>
      <div className="app-page-container">
        <div className="app-page-content app-page-content-wide crud-page-content cripto-wallet-content">
          {isLoading && wallets.length === 0 ? (
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
              <h1 className="app-page-title">Cripto Wallet</h1>
              <div className="crud-crypto-list">
                <ListSkeleton variant="inset-row" count={4} aria-label="Cargando wallets" />
              </div>
            </>
          ) : error && wallets.length === 0 ? (
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
              <h1 className="app-page-title">Cripto Wallet</h1>
              <div className="loader-container">
                <div className="loader finanzas-stats-error-panel">
                  <p className="loader-text loader-text--error" role="alert">
                    {error}
                  </p>
                  <button
                    type="button"
                    className="btn-base btn-secondary finanzas-stats-retry-button"
                    onClick={() => void loadWallets()}
                    aria-label="Reintentar cargar wallets"
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

              <h1 className="app-page-title">Cripto Wallet</h1>

              <CrudSummaryStrip
                ariaLabel="Resumen de wallets"
                items={[
                  { label: 'Total', value: highlights.totalWallets, tone: 'info' },
                  { label: 'Criptos', value: highlights.distinctCryptos, tone: 'available' },
                  { label: 'Bitcoin', value: highlights.bitcoinWallets, tone: 'info' },
                  { label: 'Ethereum', value: highlights.ethereumWallets, tone: 'info' },
                ]}
              />

              <button
                type="button"
                className="btn-base btn-accent btn-block btn-submit crud-primary-cta"
                onClick={handleOpenWalletModal}
                aria-label="Agregar wallet"
              >
                <AddIcon aria-hidden={true} />
                Agregar wallet
              </button>

              {wallets.length === 0 ? (
                <div className="empty-state">
                  <AccountBalanceWalletIcon className="empty-state-icon" />
                  <p className="empty-text">No hay wallets registradas</p>
                  <p className="empty-subtext">Usa el botón de arriba para agregar la primera</p>
                </div>
              ) : (
                <div className="crud-crypto-list">
                  {wallets.map(wallet => (
                    <button
                      key={wallet.id}
                      className="crud-crypto-row"
                      onClick={() => handleOpenDetailModal(wallet)}
                      type="button"
                      aria-label={`Ver detalles de ${wallet.wallet_name}`}
                    >
                      <div className="crud-row-content">
                        <div className="crud-row-header">
                          <span className="crud-row-title">{wallet.wallet_name}</span>
                          <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
                        </div>
                        <p className="crud-row-meta">{wallet.crypto_name}</p>
                        <p className="crud-row-meta cripto-wallet-row-address">{wallet.address}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
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
              <div className="form-group-base">
                <label htmlFor="wallet_name" className="form-label-base">
                  Nombre de la Wallet
                </label>
                <input
                  type="text"
                  id="wallet_name"
                  name="wallet_name"
                  value={walletFormData.wallet_name}
                  onChange={handleWalletChange}
                  className={`form-input-base ${formErrors.wallet_name ? 'input-error' : ''}`}
                  placeholder="Ej: Mi Wallet Bitcoin"
                  required
                />
                {formErrors.wallet_name && (
                  <span className="error-message" role="alert">
                    {formErrors.wallet_name}
                  </span>
                )}
              </div>

              <div className="form-group-base">
                <label htmlFor="crypto_name" className="form-label-base">
                  Criptomoneda
                </label>
                <input
                  type="text"
                  id="crypto_name"
                  name="crypto_name"
                  value={walletFormData.crypto_name}
                  onChange={handleWalletChange}
                  className={`form-input-base ${formErrors.crypto_name ? 'input-error' : ''}`}
                  placeholder="Ej: Bitcoin, Ethereum, QRL"
                  required
                />
                {formErrors.crypto_name && (
                  <span className="error-message" role="alert">
                    {formErrors.crypto_name}
                  </span>
                )}
              </div>

              <div className="form-group-base">
                <label htmlFor="address" className="form-label-base">
                  Dirección de la Wallet
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={walletFormData.address}
                  onChange={handleWalletChange}
                  className={`form-input-base ${formErrors.address ? 'input-error' : ''}`}
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
