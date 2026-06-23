import { useState, useCallback, useEffect } from 'react'
import { backToHubLabel } from '../constants/hubLabels'
import { sectionColor } from '../constants/sectionColors'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import RefreshIcon from '@mui/icons-material/Refresh'
import LockIcon from '@mui/icons-material/Lock'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useNotification } from '../contexts/NotificationContext'
import './AppPage.css'
import './GeneradorContrasenas.css'
import { devError } from '../utils/debugTools'

interface PasswordHistory {
  password: string
  timestamp: number
}

function GeneradorContrasenas() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [password, setPassword] = useState<string>('')
  const [length, setLength] = useState<number>(16)
  const [includeUppercase, setIncludeUppercase] = useState<boolean>(true)
  const [includeLowercase, setIncludeLowercase] = useState<boolean>(true)
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true)
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true)
  const [excludeAmbiguous, setExcludeAmbiguous] = useState<boolean>(true)
  const [copied, setCopied] = useState<boolean>(false)
  const [history, setHistory] = useState<PasswordHistory[]>([])

  // Caracteres disponibles
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  const ambiguous = '0O1lI'

  // Generar contraseña
  const generatePassword = useCallback(() => {
    let charset = ''

    if (includeUppercase) charset += uppercase
    if (includeLowercase) charset += lowercase
    if (includeNumbers) charset += numbers
    if (includeSymbols) charset += symbols

    if (excludeAmbiguous && charset.length > 0) {
      charset = charset
        .split('')
        .filter(char => !ambiguous.includes(char))
        .join('')
    }

    if (charset.length === 0) {
      showNotification('Debes seleccionar al menos un tipo de carácter', 'warning')
      return
    }

    let generatedPassword = ''
    const charsetArray = charset.split('')

    // Asegurar que al menos un carácter de cada tipo seleccionado esté presente
    if (includeUppercase) {
      const upperChars = uppercase
        .split('')
        .filter(c => !excludeAmbiguous || !ambiguous.includes(c))
      if (upperChars.length > 0) {
        generatedPassword += upperChars[Math.floor(Math.random() * upperChars.length)]
      }
    }
    if (includeLowercase) {
      const lowerChars = lowercase
        .split('')
        .filter(c => !excludeAmbiguous || !ambiguous.includes(c))
      if (lowerChars.length > 0) {
        generatedPassword += lowerChars[Math.floor(Math.random() * lowerChars.length)]
      }
    }
    if (includeNumbers) {
      const numChars = numbers.split('').filter(c => !excludeAmbiguous || !ambiguous.includes(c))
      if (numChars.length > 0) {
        generatedPassword += numChars[Math.floor(Math.random() * numChars.length)]
      }
    }
    if (includeSymbols) {
      generatedPassword += symbols[Math.floor(Math.random() * symbols.length)]
    }

    // Completar el resto de la contraseña
    for (let i = generatedPassword.length; i < length; i++) {
      generatedPassword += charsetArray[Math.floor(Math.random() * charsetArray.length)]
    }

    // Mezclar los caracteres
    generatedPassword = generatedPassword
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('')

    setPassword(generatedPassword)
    setCopied(false)

    // Agregar al historial
    const newHistory: PasswordHistory = {
      password: generatedPassword,
      timestamp: Date.now(),
    }
    setHistory(prev => [newHistory, ...prev.slice(0, 9)]) // Mantener solo las últimas 10
  }, [
    length,
    includeUppercase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
    excludeAmbiguous,
    showNotification,
  ])

  // Calcular fortaleza de la contraseña
  const calculateStrength = (pwd: string): { level: number; label: string; color: string } => {
    if (!pwd) return { level: 0, label: '', color: 'transparent' }

    let strength = 0

    // Longitud
    if (pwd.length >= 8) strength += 1
    if (pwd.length >= 12) strength += 1
    if (pwd.length >= 16) strength += 1
    if (pwd.length >= 20) strength += 1

    // Variedad de caracteres
    if (/[a-z]/.test(pwd)) strength += 1
    if (/[A-Z]/.test(pwd)) strength += 1
    if (/[0-9]/.test(pwd)) strength += 1
    if (/[^a-zA-Z0-9]/.test(pwd)) strength += 1

    // Complejidad adicional
    const uniqueChars = new Set(pwd).size
    if (uniqueChars / pwd.length > 0.5) strength += 1

    if (strength <= 2) return { level: 1, label: 'Débil', color: sectionColor.danger }
    if (strength <= 4) return { level: 2, label: 'Media', color: sectionColor.lifestyle }
    if (strength <= 6) return { level: 3, label: 'Fuerte', color: sectionColor.yellow }
    return { level: 4, label: 'Muy Fuerte', color: sectionColor.success }
  }

  const strength = calculateStrength(password)

  // Copiar al portapapeles
  const copyToClipboard = async () => {
    if (!password) {
      showNotification('No hay contraseña para copiar', 'warning')
      return
    }

    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      showNotification('Contraseña copiada al portapapeles', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      devError('Error al copiar:', err)
      showNotification('Error al copiar la contraseña', 'error')
    }
  }

  // Formatear fecha del historial
  const formatHistoryDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Hace un momento'
    if (minutes < 60) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
    const days = Math.floor(hours / 24)
    if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // Generar contraseña automáticamente al cargar
  useEffect(() => {
    generatePassword()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide crud-page-content generador-contrasenas-content">
        {/* Toolbar */}
        <div className="app-toolbar">
          <button
            className="app-toolbar-button"
            onClick={() => navigate('/registros')}
            aria-label={backToHubLabel('registros')}
            type="button"
          >
            <ArrowBackIcon className="app-toolbar-icon" />
          </button>
        </div>

        <h1 className="app-page-title">Generador de Contraseñas</h1>

        {/* Generador de Contraseñas */}
        <div className="password-generator">
          {/* Contraseña Generada */}
          <div className="password-display">
            <div className="password-output">
              <input
                type="text"
                value={password}
                readOnly
                className="password-input"
                placeholder="Tu contraseña aparecerá aquí"
                aria-label="Contraseña generada"
              />
              <div className="password-actions">
                <button
                  className="password-action-button"
                  onClick={copyToClipboard}
                  aria-label="Copiar contraseña"
                  type="button"
                  disabled={!password}
                >
                  {copied ? (
                    <CheckCircleIcon className="password-action-icon" />
                  ) : (
                    <ContentCopyIcon className="password-action-icon" />
                  )}
                </button>
                <button
                  className="password-action-button"
                  onClick={generatePassword}
                  aria-label="Generar nueva contraseña"
                  type="button"
                >
                  <RefreshIcon className="password-action-icon" />
                </button>
              </div>
            </div>

            {/* Indicador de Fortaleza */}
            {password && (
              <div className="password-strength">
                <div className="password-strength-label">
                  <LockIcon className="password-strength-icon" />
                  <span>Fortaleza: {strength.label}</span>
                </div>
                <div className="password-strength-bar">
                  <div
                    className="password-strength-fill"
                    style={{
                      width: `${(strength.level / 4) * 100}%`,
                      backgroundColor: strength.color,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Configuración */}
          <div className="password-settings">
            <h3 className="password-settings-title">Configuración</h3>

            {/* Longitud */}
            <div className="password-setting-group">
              <div className="password-setting-header">
                <label htmlFor="length" className="password-setting-label">
                  Longitud: {length} caracteres
                </label>
                <span className="password-setting-value">{length}</span>
              </div>
              <input
                type="range"
                id="length"
                min="4"
                max="64"
                value={length}
                onChange={e => setLength(parseInt(e.target.value))}
                className="password-range-input"
              />
              <div className="password-range-labels">
                <span>4</span>
                <span>64</span>
              </div>
            </div>

            {/* Opciones de Caracteres */}
            <div className="password-options">
              <label className="password-option">
                <input
                  type="checkbox"
                  checked={includeUppercase}
                  onChange={e => setIncludeUppercase(e.target.checked)}
                  className="password-checkbox"
                />
                <span className="password-option-label">Mayúsculas (A-Z)</span>
              </label>

              <label className="password-option">
                <input
                  type="checkbox"
                  checked={includeLowercase}
                  onChange={e => setIncludeLowercase(e.target.checked)}
                  className="password-checkbox"
                />
                <span className="password-option-label">Minúsculas (a-z)</span>
              </label>

              <label className="password-option">
                <input
                  type="checkbox"
                  checked={includeNumbers}
                  onChange={e => setIncludeNumbers(e.target.checked)}
                  className="password-checkbox"
                />
                <span className="password-option-label">Números (0-9)</span>
              </label>

              <label className="password-option">
                <input
                  type="checkbox"
                  checked={includeSymbols}
                  onChange={e => setIncludeSymbols(e.target.checked)}
                  className="password-checkbox"
                />
                <span className="password-option-label">Símbolos (!@#$%...)</span>
              </label>

              <label className="password-option">
                <input
                  type="checkbox"
                  checked={excludeAmbiguous}
                  onChange={e => setExcludeAmbiguous(e.target.checked)}
                  className="password-checkbox"
                />
                <span className="password-option-label">
                  Excluir caracteres ambiguos (0, O, l, 1, I)
                </span>
              </label>
            </div>

            {/* Botón Generar */}
            <button
              className="password-generate-button"
              onClick={generatePassword}
              type="button"
              disabled={
                !includeUppercase && !includeLowercase && !includeNumbers && !includeSymbols
              }
            >
              <RefreshIcon className="password-generate-icon" />
              <span>Generar Contraseña</span>
            </button>
          </div>

          {/* Historial */}
          {history.length > 0 && (
            <div className="password-history">
              <h3 className="password-history-title">Historial</h3>
              <div className="password-history-list">
                {history.map((item, index) => (
                  <div key={index} className="password-history-item">
                    <div className="password-history-content">
                      <code className="password-history-password">{item.password}</code>
                      <span className="password-history-date">
                        {formatHistoryDate(item.timestamp)}
                      </span>
                    </div>
                    <button
                      className="password-history-copy"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(item.password)
                          showNotification('Contraseña copiada', 'success')
                        } catch (err) {
                          showNotification('Error al copiar', 'error')
                        }
                      }}
                      aria-label="Copiar contraseña del historial"
                      type="button"
                    >
                      <ContentCopyIcon className="password-history-copy-icon" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GeneradorContrasenas
