import { useState, useCallback, useEffect, useMemo } from 'react'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import RefreshIcon from '@mui/icons-material/Refresh'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LockIcon from '@mui/icons-material/Lock'
import { useNotification } from '../contexts/NotificationContext'
import UtilidadesSubHeader from '../components/utilidades/UtilidadesSubHeader'
import GeneradorGuardarSecretoModal from '../components/generador/GeneradorGuardarSecretoModal'
import { api } from '../services/api'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import {
  calculatePasswordStrength,
  formatPasswordHistoryDate,
  generatePassword,
  hasSelectedCharset,
  maskPasswordPreview,
  type PasswordGeneratorOptions,
} from '../utils/generadorContrasenasUtils'
import { devError } from '../utils/debugTools'
import './AppPage.css'
import './GeneradorContrasenas.css'

interface PasswordHistory {
  password: string
  timestamp: number
}

const DEFAULT_OPTIONS: PasswordGeneratorOptions = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeAmbiguous: true,
}

type CharsetToggleKey =
  | 'includeUppercase'
  | 'includeLowercase'
  | 'includeNumbers'
  | 'includeSymbols'

const CHARSET_TOGGLES: { key: CharsetToggleKey; label: string; hint: string }[] = [
  { key: 'includeUppercase', label: 'Mayúsculas', hint: 'A-Z' },
  { key: 'includeLowercase', label: 'Minúsculas', hint: 'a-z' },
  { key: 'includeNumbers', label: 'Números', hint: '0-9' },
  { key: 'includeSymbols', label: 'Símbolos', hint: '!@#…' },
]

function GeneradorContrasenas() {
  const { showNotification } = useNotification()
  const [password, setPassword] = useState('')
  const [options, setOptions] = useState<PasswordGeneratorOptions>(DEFAULT_OPTIONS)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<PasswordHistory[]>([])
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [isSavingSecret, setIsSavingSecret] = useState(false)

  const strength = useMemo(() => calculatePasswordStrength(password), [password])
  const canGenerate = hasSelectedCharset(options)

  const runGenerate = useCallback(() => {
    const generated = generatePassword(options)
    if (!generated) {
      showNotification('Selecciona al menos un tipo de carácter', 'warning')
      return
    }

    setPassword(generated)
    setCopied(false)
    setHistory(prev => [{ password: generated, timestamp: Date.now() }, ...prev.slice(0, 9)])
  }, [options, showNotification])

  useEffect(() => {
    runGenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const copyToClipboard = async (value: string, message = 'Contraseña copiada al portapapeles') => {
    if (!value) {
      showNotification('No hay contraseña para copiar', 'warning')
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      showNotification(message, 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      devError('Error al copiar:', err)
      showNotification('Error al copiar la contraseña', 'error')
    }
  }

  const updateOption = <K extends keyof PasswordGeneratorOptions>(
    key: K,
    value: PasswordGeneratorOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

  const toggleCharset = (key: CharsetToggleKey) => {
    updateOption(key, !options[key])
  }

  const handleOpenSaveModal = () => {
    if (!password) {
      showNotification('Genera una contraseña antes de guardarla', 'warning')
      return
    }
    setIsSaveModalOpen(true)
  }

  const handleCloseSaveModal = () => {
    if (isSavingSecret) {
      return
    }
    setIsSaveModalOpen(false)
  }

  const handleSaveToSecrets = async (title: string) => {
    if (!password) {
      return
    }

    try {
      setIsSavingSecret(true)
      await api.createSecret({ title, value: password })
      setIsSaveModalOpen(false)
      showNotification('Contraseña guardada en Secretos', 'success')
    } catch (err: unknown) {
      devError('Error al guardar secreto:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al guardar en Secretos. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsSavingSecret(false)
    }
  }

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide crud-page-content generador-contrasenas-content utilidades-sub-content">
        <UtilidadesSubHeader
          title="Generador"
          context="Contraseñas"
          meta="Sesión local · no se envía al servidor"
        />

        <div className="generador-layout utilidades-tool-workspace utilidades-tool-workspace--centered">
          <article className="generador-shell">
            <header className="generador-shell-head">
              <p className="generador-kicker">Utilidades · Herramienta</p>
              <h2 className="generador-shell-title">Generador de contraseñas</h2>
            </header>

            <div className="generador-hero">
              <div className="generador-hero-display">
                <output
                  id="generador-password"
                  className="generador-hero-value"
                  aria-live="polite"
                  aria-label="Contraseña generada"
                >
                  {password || 'Pulsa Generar'}
                </output>
                <button
                  className="generador-hero-copy"
                  onClick={() => void copyToClipboard(password)}
                  aria-label="Copiar contraseña"
                  type="button"
                  disabled={!password}
                >
                  {copied ? (
                    <CheckCircleIcon className="generador-hero-copy-icon" aria-hidden />
                  ) : (
                    <ContentCopyIcon className="generador-hero-copy-icon" aria-hidden />
                  )}
                </button>
              </div>

              {password ? (
                <div className="generador-hero-meta">
                  <span className={`generador-strength-badge generador-strength-badge--${strength.tone}`}>
                    {strength.label}
                  </span>
                  <span className="generador-hero-length">{password.length} caracteres</span>
                  <div className="generador-strength-track" aria-hidden>
                    <div
                      className={`generador-strength-fill generador-strength-fill--${strength.tone}`}
                      style={{ width: `${(strength.level / 4) * 100}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <section className="generador-section" aria-labelledby="generador-length-heading">
              <div className="generador-section-head">
                <h3 id="generador-length-heading" className="generador-section-title">
                  Longitud
                </h3>
                <span className="generador-length-value">{options.length}</span>
              </div>
              <input
                type="range"
                id="generador-length"
                min="8"
                max="64"
                value={options.length}
                onChange={event => updateOption('length', parseInt(event.target.value, 10))}
                className="generador-range"
                aria-valuemin={8}
                aria-valuemax={64}
                aria-valuenow={options.length}
              />
              <div className="generador-range-labels">
                <span>8</span>
                <span>64</span>
              </div>
            </section>

            <section className="generador-section" aria-labelledby="generador-charset-heading">
              <h3 id="generador-charset-heading" className="generador-section-title">
                Caracteres
              </h3>
              <div className="generador-chips" role="group" aria-label="Tipos de carácter">
                {CHARSET_TOGGLES.map(({ key, label, hint }) => (
                  <button
                    key={key}
                    type="button"
                    className={`generador-chip${options[key] ? ' generador-chip--active' : ''}`}
                    onClick={() => toggleCharset(key)}
                    aria-pressed={options[key]}
                  >
                    <span className="generador-chip-label">{label}</span>
                    <span className="generador-chip-hint">{hint}</span>
                  </button>
                ))}
                <button
                  type="button"
                  className={`generador-chip generador-chip--wide${options.excludeAmbiguous ? ' generador-chip--active' : ''}`}
                  onClick={() => updateOption('excludeAmbiguous', !options.excludeAmbiguous)}
                  aria-pressed={options.excludeAmbiguous}
                >
                  <span className="generador-chip-label">Sin ambiguos</span>
                  <span className="generador-chip-hint">0, O, l, 1, I</span>
                </button>
              </div>
            </section>

            <div className="generador-actions">
              <button
                className="btn-base btn-accent generador-generate-btn"
                onClick={runGenerate}
                type="button"
                disabled={!canGenerate}
              >
                <RefreshIcon aria-hidden />
                Generar contraseña
              </button>
              <button
                className="btn-base btn-secondary generador-save-btn"
                onClick={handleOpenSaveModal}
                type="button"
                disabled={!password}
              >
                <LockIcon aria-hidden />
                <span>Guardar en Secretos</span>
              </button>
            </div>

            <section className="generador-history-section" aria-labelledby="generador-history-heading">
              <div className="generador-history-head">
                <h3 id="generador-history-heading" className="generador-history-title">
                  Historial
                </h3>
                <span className="generador-history-meta">
                  {history.length > 0 ? `${history.length} · máx. 10` : 'Vacío'}
                </span>
              </div>

              {history.length === 0 ? (
                <p className="generador-history-empty">
                  Las contraseñas generadas en esta sesión aparecerán aquí.
                </p>
              ) : (
                <ul className="generador-history-list">
                  {history.map((item, index) => (
                    <li key={`${item.timestamp}-${index}`} className="generador-history-item">
                      <button
                        type="button"
                        className="generador-history-use"
                        onClick={() => {
                          setPassword(item.password)
                          setCopied(false)
                        }}
                        title={item.password}
                      >
                        <code className="generador-history-preview">
                          {maskPasswordPreview(item.password)}
                        </code>
                        <span className="generador-history-date">
                          {formatPasswordHistoryDate(item.timestamp)}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="generador-history-copy"
                        onClick={() => void copyToClipboard(item.password, 'Contraseña copiada')}
                        aria-label="Copiar contraseña del historial"
                      >
                        <ContentCopyIcon className="generador-history-copy-icon" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </article>
        </div>
      </div>

      {isSaveModalOpen && password ? (
        <GeneradorGuardarSecretoModal
          password={password}
          isSaving={isSavingSecret}
          onClose={handleCloseSaveModal}
          onSave={title => void handleSaveToSecrets(title)}
        />
      ) : null}
    </div>
  )
}

export default GeneradorContrasenas
