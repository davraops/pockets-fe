import { useState, useEffect, useCallback, useRef } from 'react'
import BackspaceIcon from '@mui/icons-material/Backspace'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckIcon from '@mui/icons-material/Check'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { useNotification } from '../contexts/NotificationContext'
import UtilidadesSubHeader from '../components/utilidades/UtilidadesSubHeader'
import './AppPage.css'
import './Calculadora.css'
import { devError } from '../utils/debugTools'
import {
  addCalculadoraHistoryEntry,
  clearCalculadoraHistory,
  loadCalculadoraHistory,
  type CalculadoraHistoryEntry,
} from '../utils/calculadoraHistory'

function formatDisplay(value: string): string {
  if (value.length > 12) {
    const num = parseFloat(value)
    if (isNaN(num)) return value
    if (Math.abs(num) >= 1e12) {
      return num.toExponential(6)
    }
    return num.toPrecision(12).replace(/\.?0+$/, '')
  }
  return value
}

function formatHistoryTime(timestamp: number): string {
  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

function Calculadora() {
  const { showNotification } = useNotification()
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [waitingForNewValue, setWaitingForNewValue] = useState(false)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<CalculadoraHistoryEntry[]>([])
  const calculatorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHistory(loadCalculadoraHistory())
  }, [])

  const inputNumber = useCallback(
    (num: string) => {
      if (waitingForNewValue) {
        setWaitingForNewValue(false)
        setDisplay(num)
        return
      }
      setDisplay(current => (current === '0' ? num : current + num))
    },
    [waitingForNewValue]
  )

  const inputDecimal = useCallback(() => {
    if (waitingForNewValue) {
      setWaitingForNewValue(false)
      setDisplay('0.')
      return
    }
    setDisplay(current => (current.indexOf('.') === -1 ? `${current}.` : current))
  }, [waitingForNewValue])

  const clear = useCallback(() => {
    setDisplay('0')
    setPreviousValue(null)
    setOperation(null)
    setWaitingForNewValue(false)
  }, [])

  const backspace = useCallback(() => {
    setDisplay(current => {
      if (current.length > 1) {
        return current.slice(0, -1)
      }
      return '0'
    })
  }, [])

  const toggleSign = useCallback(() => {
    setDisplay(current => {
      const value = parseFloat(current)
      if (Number.isNaN(value) || value === 0) {
        return current
      }
      return String(value * -1)
    })
  }, [])

  const applyPercent = useCallback(() => {
    setDisplay(current => {
      const value = parseFloat(current)
      if (Number.isNaN(value)) {
        return current
      }
      return String(value / 100)
    })
  }, [])

  const tryCalculate = useCallback(
    (firstValue: number, secondValue: number, currentOperation: string): number | null => {
      if (currentOperation === '÷' && secondValue === 0) {
        showNotification('No se puede dividir entre cero', 'warning')
        return null
      }

      switch (currentOperation) {
        case '+':
          return firstValue + secondValue
        case '-':
          return firstValue - secondValue
        case '×':
          return firstValue * secondValue
        case '÷':
          return firstValue / secondValue
        default:
          return secondValue
      }
    },
    [showNotification]
  )

  const recordHistory = useCallback(
    (firstValue: number, secondValue: number, currentOperation: string, result: number) => {
      const entry: CalculadoraHistoryEntry = {
        expression: `${formatDisplay(String(firstValue))} ${currentOperation} ${formatDisplay(String(secondValue))} = ${formatDisplay(String(result))}`,
        result: formatDisplay(String(result)),
        timestamp: Date.now(),
      }
      setHistory(addCalculadoraHistoryEntry(entry))
    },
    []
  )

  const performOperation = useCallback(
    (nextOperation: string) => {
      const inputValue = parseFloat(display)

      if (previousValue === null) {
        setPreviousValue(inputValue)
      } else if (operation) {
        const newValue = tryCalculate(previousValue, inputValue, operation)
        if (newValue === null) {
          return
        }

        setDisplay(String(newValue))
        setPreviousValue(newValue)
      }

      setWaitingForNewValue(true)
      setOperation(nextOperation)
    },
    [display, operation, previousValue, tryCalculate]
  )

  const handleEquals = useCallback(() => {
    const inputValue = parseFloat(display)

    if (previousValue !== null && operation) {
      const newValue = tryCalculate(previousValue, inputValue, operation)
      if (newValue === null) {
        return
      }
      recordHistory(previousValue, inputValue, operation, newValue)
      setDisplay(String(newValue))
      setPreviousValue(null)
      setOperation(null)
      setWaitingForNewValue(true)
    }
  }, [display, operation, previousValue, recordHistory, tryCalculate])

  const applyHistoryResult = useCallback((result: string) => {
    setDisplay(result)
    setPreviousValue(null)
    setOperation(null)
    setWaitingForNewValue(true)
  }, [])

  const handleClearHistory = useCallback(() => {
    clearCalculadoraHistory()
    setHistory([])
    showNotification('Historial borrado', 'success')
  }, [showNotification])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return
      }

      if (/^\d$/.test(event.key)) {
        event.preventDefault()
        inputNumber(event.key)
        return
      }

      switch (event.key) {
        case '.':
        case ',':
          event.preventDefault()
          inputDecimal()
          break
        case '+':
          event.preventDefault()
          performOperation('+')
          break
        case '-':
          event.preventDefault()
          performOperation('-')
          break
        case '*':
          event.preventDefault()
          performOperation('×')
          break
        case '/':
          event.preventDefault()
          performOperation('÷')
          break
        case 'Enter':
        case '=':
          event.preventDefault()
          handleEquals()
          break
        case 'Escape':
          event.preventDefault()
          clear()
          break
        case 'Backspace':
          event.preventDefault()
          backspace()
          break
        case '%':
          event.preventDefault()
          applyPercent()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    applyPercent,
    backspace,
    clear,
    handleEquals,
    inputDecimal,
    inputNumber,
    performOperation,
  ])

  const copyToClipboard = async (value?: string) => {
    try {
      const valueToCopy = value ?? formatDisplay(display)
      await navigator.clipboard.writeText(valueToCopy)
      setCopied(true)
      showNotification('Número copiado al portapapeles', 'success')
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (err) {
      devError('Error al copiar:', err)
      showNotification('Error al copiar al portapapeles', 'error')
    }
  }

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide calculadora-content utilidades-sub-content">
        <UtilidadesSubHeader
          title="Calculadora"
          context="Rápida"
          meta="Teclado numérico, atajos e historial local"
        />

        <div className="utilidades-tool-workspace utilidades-tool-workspace--split">
          <div className="utilidades-tool-main utilidades-tool-main--narrow">
            <div className="calculadora-container" ref={calculatorRef} tabIndex={-1}>
              <div className="calculadora-display">
                <div className="calculadora-display-content">
                  <div className="calculadora-display-value">{formatDisplay(display)}</div>
                  <button
                    className="calculadora-copy-button"
                    onClick={() => copyToClipboard()}
                    aria-label="Copiar número"
                    type="button"
                    title="Copiar al portapapeles"
                  >
                    {copied ? (
                      <CheckIcon className="calculadora-copy-icon" />
                    ) : (
                      <ContentCopyIcon className="calculadora-copy-icon" />
                    )}
                  </button>
                </div>
              </div>

              <div className="calculadora-shortcuts">
                <button
                  type="button"
                  className="calculadora-shortcut-button"
                  onClick={toggleSign}
                  aria-label="Cambiar signo"
                >
                  ±
                </button>
                <button
                  type="button"
                  className="calculadora-shortcut-button"
                  onClick={applyPercent}
                  aria-label="Porcentaje"
                >
                  %
                </button>
              </div>

              <div className="calculadora-buttons">
                <button
                  className="calculadora-button calculadora-button-function"
                  onClick={clear}
                  type="button"
                  aria-label="Limpiar"
                >
                  C
                </button>
                <button
                  className="calculadora-button calculadora-button-function"
                  onClick={backspace}
                  type="button"
                  aria-label="Borrar"
                >
                  <BackspaceIcon className="calculadora-button-icon" />
                </button>
                <button
                  className="calculadora-button calculadora-button-operator"
                  onClick={() => performOperation('÷')}
                  type="button"
                  aria-label="Dividir"
                >
                  ÷
                </button>
                <button
                  className="calculadora-button calculadora-button-operator"
                  onClick={() => performOperation('×')}
                  type="button"
                  aria-label="Multiplicar"
                >
                  ×
                </button>

                <button
                  className="calculadora-button calculadora-button-number"
                  onClick={() => inputNumber('7')}
                  type="button"
                >
                  7
                </button>
                <button
                  className="calculadora-button calculadora-button-number"
                  onClick={() => inputNumber('8')}
                  type="button"
                >
                  8
                </button>
                <button
                  className="calculadora-button calculadora-button-number"
                  onClick={() => inputNumber('9')}
                  type="button"
                >
                  9
                </button>
                <button
                  className="calculadora-button calculadora-button-operator"
                  onClick={() => performOperation('-')}
                  type="button"
                  aria-label="Restar"
                >
                  −
                </button>

                <button
                  className="calculadora-button calculadora-button-number"
                  onClick={() => inputNumber('4')}
                  type="button"
                >
                  4
                </button>
                <button
                  className="calculadora-button calculadora-button-number"
                  onClick={() => inputNumber('5')}
                  type="button"
                >
                  5
                </button>
                <button
                  className="calculadora-button calculadora-button-number"
                  onClick={() => inputNumber('6')}
                  type="button"
                >
                  6
                </button>
                <button
                  className="calculadora-button calculadora-button-operator"
                  onClick={() => performOperation('+')}
                  type="button"
                  aria-label="Sumar"
                >
                  +
                </button>

                <button
                  className="calculadora-button calculadora-button-number"
                  onClick={() => inputNumber('1')}
                  type="button"
                >
                  1
                </button>
                <button
                  className="calculadora-button calculadora-button-number"
                  onClick={() => inputNumber('2')}
                  type="button"
                >
                  2
                </button>
                <button
                  className="calculadora-button calculadora-button-number"
                  onClick={() => inputNumber('3')}
                  type="button"
                >
                  3
                </button>
                <button
                  className="calculadora-button calculadora-button-equals"
                  onClick={handleEquals}
                  type="button"
                  aria-label="Igual"
                >
                  =
                </button>

                <button
                  className="calculadora-button calculadora-button-number calculadora-button-zero"
                  onClick={() => inputNumber('0')}
                  type="button"
                >
                  0
                </button>
                <button
                  className="calculadora-button calculadora-button-number"
                  onClick={inputDecimal}
                  type="button"
                  aria-label="Punto decimal"
                >
                  .
                </button>
              </div>
            </div>

            <p className="utilidades-tool-hint">
              Atajos: números, + − × ÷, Enter (=), Backspace, Escape (limpiar)
            </p>
          </div>

          <aside className="utilidades-tool-aside">
            <div className="calculadora-history">
              <div className="calculadora-history-header">
                <h2 className="calculadora-history-title">Historial</h2>
                {history.length > 0 && (
                  <button
                    type="button"
                    className="calculadora-history-clear"
                    onClick={handleClearHistory}
                    aria-label="Borrar historial"
                    title="Borrar historial"
                  >
                    <DeleteOutlineIcon className="calculadora-history-clear-icon" />
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <p className="calculadora-history-empty">
                  Las operaciones completadas con = aparecerán aquí.
                </p>
              ) : (
                <ul className="calculadora-history-list">
                  {history.map((entry, index) => (
                    <li key={`${entry.timestamp}-${index}`} className="calculadora-history-item">
                      <button
                        type="button"
                        className="calculadora-history-use"
                        onClick={() => applyHistoryResult(entry.result)}
                        title="Usar resultado"
                      >
                        <span className="calculadora-history-expression">{entry.expression}</span>
                        <span className="calculadora-history-date">
                          {formatHistoryTime(entry.timestamp)}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="calculadora-history-copy"
                        onClick={() => copyToClipboard(entry.result)}
                        aria-label={`Copiar ${entry.result}`}
                        title="Copiar resultado"
                      >
                        <ContentCopyIcon className="calculadora-history-copy-icon" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default Calculadora
