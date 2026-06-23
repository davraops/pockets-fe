import { useState, useEffect, useCallback, useRef } from 'react'
import { backToHubLabel } from '../constants/hubLabels'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import BackspaceIcon from '@mui/icons-material/Backspace'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckIcon from '@mui/icons-material/Check'
import { useNotification } from '../contexts/NotificationContext'
import './AppPage.css'
import './Calculadora.css'
import { devError } from '../utils/debugTools'

function Calculadora() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [waitingForNewValue, setWaitingForNewValue] = useState(false)
  const [copied, setCopied] = useState(false)
  const calculatorRef = useRef<HTMLDivElement>(null)

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
      setDisplay(String(newValue))
      setPreviousValue(null)
      setOperation(null)
      setWaitingForNewValue(true)
    }
  }, [display, operation, previousValue, tryCalculate])

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

  const formatDisplay = (value: string): string => {
    // Limitar a 12 caracteres para que quepa en la pantalla
    if (value.length > 12) {
      const num = parseFloat(value)
      if (isNaN(num)) return value
      // Usar notación científica si es muy grande
      if (Math.abs(num) >= 1e12) {
        return num.toExponential(6)
      }
      // Truncar decimales si es necesario
      return num.toPrecision(12).replace(/\.?0+$/, '')
    }
    return value
  }

  const copyToClipboard = async () => {
    try {
      const valueToCopy = formatDisplay(display)
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
      <div className="app-page-content calculadora-content">
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

        <h1 className="app-page-title">Calculadora</h1>

        {/* Calculadora */}
        <div className="calculadora-container" ref={calculatorRef} tabIndex={-1}>
        {/* Display */}
        <div className="calculadora-display">
          <div className="calculadora-display-content">
            <div className="calculadora-display-value">{formatDisplay(display)}</div>
            <button
              className="calculadora-copy-button"
              onClick={copyToClipboard}
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

          {/* Botones */}
          <div className="calculadora-buttons">
            {/* Fila 1 */}
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

            {/* Fila 2 */}
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

            {/* Fila 3 */}
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

            {/* Fila 4 */}
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

            {/* Fila 5 */}
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
      </div>
    </div>
  )
}

export default Calculadora

