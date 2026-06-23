import '../App.css'
import './AppPage.css'
import './Ajustes.css'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import BadgeIcon from '@mui/icons-material/Badge'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import PersonIcon from '@mui/icons-material/Person'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../contexts/ThemeContext'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { api } from '../services/api'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import {
  fetchUserDisplayName,
  getDisplayNameFallback,
  saveUserDisplayName,
} from '../utils/userDisplayName'
import {
  fetchUserJudicialDocument,
  formatJudicialDocumentInput,
  getCachedJudicialDocument,
  saveUserJudicialDocument,
} from '../utils/userJudicialIdentity'

function Ajustes() {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const [displayName, setDisplayName] = useState('')
  const [judicialDocument, setJudicialDocument] = useState('')
  const [accountUsername] = useState(() => api.getCurrentUsername() ?? '')
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSavingName, setIsSavingName] = useState(false)
  const [isSavingDocument, setIsSavingDocument] = useState(false)
  const [isDeletingTransactions, setIsDeletingTransactions] = useState(false)
  const [isResettingAccounts, setIsResettingAccounts] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadProfile = async () => {
      setIsLoadingProfile(true)
      try {
        const [name, document] = await Promise.all([
          fetchUserDisplayName(),
          fetchUserJudicialDocument(),
        ])
        if (!cancelled) {
          setDisplayName(name ?? getDisplayNameFallback() ?? '')
          setJudicialDocument(document ?? getCachedJudicialDocument() ?? '')
        }
      } finally {
        if (!cancelled) {
          setIsLoadingProfile(false)
        }
      }
    }

    void loadProfile()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSaveName = async () => {
    const trimmed = displayName.trim()
    if (!trimmed) {
      showNotification('Escribe un nombre para guardar', 'warning')
      return
    }

    try {
      setIsSavingName(true)
      const saved = await saveUserDisplayName(trimmed)
      setDisplayName(saved)
      showNotification('Nombre actualizado correctamente', 'success')
    } catch (err: unknown) {
      console.error('Error al guardar nombre:', err)
      showNotification(
        getTranslatedErrorMessage(err, 'No se pudo guardar el nombre. Intenta de nuevo.'),
        'error'
      )
    } finally {
      setIsSavingName(false)
    }
  }

  const handleSaveJudicialDocument = async () => {
    const normalized = formatJudicialDocumentInput(judicialDocument)

    try {
      setIsSavingDocument(true)
      const saved = await saveUserJudicialDocument(normalized)
      setJudicialDocument(saved ?? '')
      showNotification('Documento guardado correctamente', 'success')
    } catch (err: unknown) {
      console.error('Error al guardar documento:', err)
      showNotification(
        getTranslatedErrorMessage(err, 'No se pudo guardar el documento. Intenta de nuevo.'),
        'error'
      )
    } finally {
      setIsSavingDocument(false)
    }
  }

  const handleDeleteTransactions = async () => {
    const confirmed = await confirm({
      title: 'Borrar todas las transacciones',
      message:
        'Se eliminará todo el historial de transacciones. Los saldos de las cuentas no se modificarán. Esta acción es irreversible.',
      variant: 'danger',
      confirmLabel: 'Borrar todas',
      cancelLabel: 'Cancelar',
    })
    if (!confirmed) {
      return
    }

    try {
      setIsDeletingTransactions(true)
      await api.deleteAllTransactions()
      showNotification('Todas las transacciones fueron eliminadas', 'success')
    } catch (err: unknown) {
      console.error('Error al eliminar transacciones:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'No se pudieron eliminar las transacciones. Intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsDeletingTransactions(false)
    }
  }

  const handleResetAccounts = async () => {
    const confirmed = await confirm({
      title: 'Reiniciar cuentas bancarias',
      message:
        'Se pondrán todos los saldos en cero. Las cuentas no se eliminarán, pero perderás el balance actual de cada una. Esta acción no se puede deshacer.',
      variant: 'danger',
      confirmLabel: 'Reiniciar saldos',
      cancelLabel: 'Cancelar',
    })
    if (!confirmed) {
      return
    }

    try {
      setIsResettingAccounts(true)
      const response = await api.getBankAccounts()
      const accounts = response.accounts ?? []
      await Promise.all(
        accounts.map((account: { id: string }) =>
          api.updateBankAccount(account.id, { balance: 0 })
        )
      )
      showNotification('Saldos de cuentas reiniciados correctamente', 'success')
    } catch (err: unknown) {
      console.error('Error al reiniciar cuentas:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'No se pudieron reiniciar las cuentas. Intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsResettingAccounts(false)
    }
  }

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide crud-page-content">
        <div className="app-toolbar">
          <button
            className="app-toolbar-button"
            onClick={() => navigate('/')}
            aria-label="Volver"
            type="button"
          >
            <ArrowBackIcon className="app-toolbar-icon" />
          </button>
        </div>

        <h1 className="app-page-title">Ajustes</h1>

        <div className="crud-summary-strip" role="region" aria-label="Resumen de ajustes">
          <div className="crud-summary-strip-item">
            <span className="crud-summary-strip-label">Nombre</span>
            <span className="crud-summary-strip-value crud-summary-strip-value--info">
              {isLoadingProfile ? '…' : displayName.trim() || '—'}
            </span>
          </div>
          <div className="crud-summary-strip-separator" aria-hidden="true" />
          <div className="crud-summary-strip-item">
            <span className="crud-summary-strip-label">Tema</span>
            <span className="crud-summary-strip-value">
              {isDarkMode ? 'Oscuro' : 'Claro'}
            </span>
          </div>
          <div className="crud-summary-strip-separator" aria-hidden="true" />
          <div className="crud-summary-strip-item">
            <span className="crud-summary-strip-label">Cuenta</span>
            <span className="crud-summary-strip-value">
              {accountUsername || '—'}
            </span>
          </div>
        </div>

        <div className="crud-hub-list">
          <div className="crud-hub-section">
            <div className="crud-hub-section-header">Perfil</div>
            <div className="glass-group">
              <div className="ajustes-profile-zone">
                <div className="ajustes-profile-header">
                  <div
                    className="crud-hub-row-icon"
                    style={{ backgroundColor: '#007AFF' }}
                    aria-hidden="true"
                  >
                    <PersonIcon />
                  </div>
                  <div className="crud-row-content">
                    <span className="crud-row-title">Tu nombre</span>
                    <span className="crud-row-subtitle">
                      {accountUsername
                        ? `Cuenta: ${accountUsername}`
                        : 'Así te saludaremos en Pockets'}
                    </span>
                  </div>
                </div>
                <label className="form-label-base" htmlFor="ajustes-display-name">
                  Nombre para mostrar
                </label>
                <input
                  id="ajustes-display-name"
                  className="form-input-base"
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Ej. Rafael"
                  disabled={isLoadingProfile || isSavingName}
                  autoComplete="name"
                  maxLength={80}
                />
                <button
                  className="btn-base btn-accent btn-block btn-submit"
                  type="button"
                  onClick={() => void handleSaveName()}
                  disabled={isLoadingProfile || isSavingName || !displayName.trim()}
                  aria-busy={isSavingName}
                >
                  {isSavingName ? 'Guardando…' : 'Guardar nombre'}
                </button>
              </div>
            </div>
          </div>

          <div className="crud-hub-section">
            <div className="crud-hub-section-header">Justicia</div>
            <div className="glass-group">
              <div className="ajustes-profile-zone">
                <div className="ajustes-profile-header">
                  <div
                    className="crud-hub-row-icon"
                    style={{ backgroundColor: '#5856D6' }}
                    aria-hidden="true"
                  >
                    <BadgeIcon />
                  </div>
                  <div className="crud-row-content">
                    <span className="crud-row-title">Documento de identidad</span>
                    <span className="crud-row-subtitle">
                      Se usa para consultar tus procesos judiciales por cédula
                    </span>
                  </div>
                </div>
                <label className="form-label-base" htmlFor="ajustes-judicial-document">
                  Número de cédula
                </label>
                <input
                  id="ajustes-judicial-document"
                  className="form-input-base"
                  type="text"
                  inputMode="numeric"
                  value={judicialDocument}
                  onChange={e => setJudicialDocument(formatJudicialDocumentInput(e.target.value))}
                  placeholder="Ej. 1234567890"
                  disabled={isLoadingProfile || isSavingDocument}
                  autoComplete="off"
                  maxLength={12}
                />
                <button
                  className="btn-base btn-accent btn-block btn-submit"
                  type="button"
                  onClick={() => void handleSaveJudicialDocument()}
                  disabled={isLoadingProfile || isSavingDocument}
                  aria-busy={isSavingDocument}
                >
                  {isSavingDocument ? 'Guardando…' : 'Guardar documento'}
                </button>
              </div>
            </div>
          </div>

          <div className="crud-hub-section">
            <div className="crud-hub-section-header">Apariencia</div>
            <div className="glass-group">
              <div className="ajustes-static-row">
                <div
                  className="crud-hub-row-icon"
                  style={{ backgroundColor: '#5856D6' }}
                  aria-hidden="true"
                >
                  <DarkModeIcon />
                </div>
                <div className="crud-row-content">
                  <span className="crud-row-title">Tema</span>
                  <span className="crud-row-subtitle">
                    {isDarkMode ? 'Modo oscuro' : 'Modo claro'}
                  </span>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>

          <div className="crud-hub-section">
            <div className="crud-hub-section-header">Finanzas</div>
            <div className="glass-group">
              <div className="ajustes-danger-zone">
                <div className="ajustes-danger-info">
                  <div
                    className="crud-hub-row-icon"
                    style={{ backgroundColor: '#FF9500' }}
                    aria-hidden="true"
                  >
                    <SwapHorizIcon />
                  </div>
                  <div className="crud-row-content">
                    <span className="crud-row-title">Borrar todas las transacciones</span>
                    <span className="crud-row-subtitle">
                      Elimina el historial completo sin cambiar los saldos de las cuentas
                    </span>
                  </div>
                </div>
                <button
                  className="btn-base btn-block btn-submit ajustes-danger-button"
                  type="button"
                  onClick={handleDeleteTransactions}
                  disabled={isDeletingTransactions || isResettingAccounts}
                  aria-busy={isDeletingTransactions}
                >
                  {isDeletingTransactions ? 'Borrando…' : 'Borrar todas las transacciones'}
                </button>
              </div>
              <div className="ajustes-danger-divider" />
              <div className="ajustes-danger-zone">
                <div className="ajustes-danger-info">
                  <div
                    className="crud-hub-row-icon"
                    style={{ backgroundColor: '#34C759' }}
                    aria-hidden="true"
                  >
                    <AccountBalanceWalletIcon />
                  </div>
                  <div className="crud-row-content">
                    <span className="crud-row-title">Reiniciar cuentas bancarias</span>
                    <span className="crud-row-subtitle">
                      Pone todos los saldos en cero sin eliminar las cuentas
                    </span>
                  </div>
                </div>
                <button
                  className="btn-base btn-block btn-submit ajustes-danger-button"
                  type="button"
                  onClick={handleResetAccounts}
                  disabled={isDeletingTransactions || isResettingAccounts}
                  aria-busy={isResettingAccounts}
                >
                  {isResettingAccounts ? 'Reiniciando…' : 'Reiniciar cuentas'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Ajustes
