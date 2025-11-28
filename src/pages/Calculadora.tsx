import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import BackspaceIcon from '@mui/icons-material/Backspace'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckIcon from '@mui/icons-material/Check'
import { useNotification } from '../contexts/NotificationContext'
import './AppPage.css'
import './Calculadora.css'

function Calculadora() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [waitingForNewValue, setWaitingForNewValue] = useState(false)
  const [copied, setCopied] = useState(false)

  const inputNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num)
      setWaitingForNewValue(false)
    } else {
      setDisplay(display === '0' ? num : display + num)
    }
  }

  const inputDecimal = () => {
    if (waitingForNewValue) {
      setDisplay('0.')
      setWaitingForNewValue(false)
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.')
    }
  }

  const clear = () => {
    setDisplay('0')
    setPreviousValue(null)
    setOperation(null)
    setWaitingForNewValue(false)
  }

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1))
    } else {
      setDisplay('0')
    }
  }

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(inputValue)
    } else if (operation) {
      const currentValue = previousValue || 0
      const newValue = calculate(currentValue, inputValue, operation)

      setDisplay(String(newValue))
      setPreviousValue(newValue)
    }

    setWaitingForNewValue(true)
    setOperation(nextOperation)
  }

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue
      case '-':
        return firstValue - secondValue
      case '×':
        return firstValue * secondValue
      case '÷':
        return secondValue !== 0 ? firstValue / secondValue : 0
      default:
        return secondValue
    }
  }

  const handleEquals = () => {
    const inputValue = parseFloat(display)

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation)
      setDisplay(String(newValue))
      setPreviousValue(null)
      setOperation(null)
      setWaitingForNewValue(true)
    }
  }

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
      console.error('Error al copiar:', err)
      showNotification('Error al copiar al portapapeles', 'error')
    }
  }

  return (
    <div className="app-page-container">
      <div className="app-page-content calculadora-content">
        {/* Toolbar */}
        <div className="calculadora-toolbar">
          <button
            className="calculadora-toolbar-button"
            onClick={() => navigate('/registros')}
            aria-label="Volver"
            type="button"
          >
            <ArrowBackIcon className="calculadora-toolbar-icon" />
          </button>
        </div>

        <h1 className="calculadora-page-title">Calculadora</h1>

        {/* Calculadora */}
        <div className="calculadora-container">
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

