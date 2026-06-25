import { useMemo, useState } from 'react'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckIcon from '@mui/icons-material/Check'
import {
  calcularIngenieriaEconomica,
  formatIngenieriaNumber,
  formatIngenieriaPercent,
  getIngenieriaCategorias,
  getIngenieriaFuncionMeta,
  INGENIERIA_ECONOMICA_FUNCIONES,
  parseFlujosCaja,
  type FactorTablaRow,
  type IngenieriaEconomicaFuncion,
} from '../../utils/ingenieriaEconomica'

export interface CalculadoraIngenieriaHistoryPayload {
  title: string
  summary: string
  result: string
}

interface CalculadoraIngenieriaPanelProps {
  onResult: (payload: CalculadoraIngenieriaHistoryPayload) => void
  onCopy: (value: string) => void
}

function buildHistorySummary(
  funcion: IngenieriaEconomicaFuncion,
  shortLabel: string,
  expression: string,
  tasa: string
): string {
  if (funcion === 'van' || funcion === 'tir') {
    return `${shortLabel} @ ${tasa}%`
  }
  if (funcion === 'tablas') {
    return expression
  }
  if (expression.length > 72) {
    return `${shortLabel} · ${expression.slice(0, 72)}…`
  }
  return expression
}

function CalculadoraIngenieriaPanel({ onResult, onCopy }: CalculadoraIngenieriaPanelProps) {
  const [funcion, setFuncion] = useState<IngenieriaEconomicaFuncion>('vp')
  const [monto, setMonto] = useState('1000')
  const [flujos, setFlujos] = useState('-1000, 300, 400, 500, 600')
  const [tasa, setTasa] = useState('12')
  const [periodos, setPeriodos] = useState('12')
  const [resultValue, setResultValue] = useState<number | null>(null)
  const [resultExpression, setResultExpression] = useState<string | null>(null)
  const [interpretacion, setInterpretacion] = useState<string | null>(null)
  const [tabla, setTabla] = useState<FactorTablaRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const categorias = useMemo(() => getIngenieriaCategorias(), [])
  const meta = useMemo(() => getIngenieriaFuncionMeta(funcion), [funcion])
  const isTasaEfectiva = meta.inputTipo === 'tasaEfectiva'
  const isFlujos = meta.inputTipo === 'flujos'
  const isTabla = meta.inputTipo === 'tabla'
  const isTir = funcion === 'tir'
  const hasResult = Boolean(resultExpression)

  const formatResult = (value: number) => {
    if (isTir || isTasaEfectiva) {
      return formatIngenieriaPercent(value)
    }
    if (isTabla) {
      return 'Tabla generada'
    }
    return formatIngenieriaNumber(value)
  }

  const handleCalculate = () => {
    setError(null)
    setTabla(null)
    try {
      const parsedMonto = parseFloat(monto.replace(',', '.'))
      const parsedTasa = parseFloat(tasa.replace(',', '.'))
      const parsedPeriodos = parseFloat(periodos.replace(',', '.'))
      const parsedFlujos = isFlujos ? parseFlujosCaja(flujos) : undefined

      const result = calcularIngenieriaEconomica({
        funcion,
        monto: parsedMonto,
        tasaPorPeriodo: isTasaEfectiva ? parsedMonto : parsedTasa,
        periodos: parsedPeriodos,
        flujos: parsedFlujos,
      })

      const formattedResult = formatResult(result.value)

      setResultValue(result.value)
      setResultExpression(result.expression)
      setInterpretacion(result.interpretacion ?? null)
      setTabla(result.tabla ?? null)
      onResult({
        title: meta.shortLabel,
        summary: buildHistorySummary(funcion, meta.shortLabel, result.expression, tasa),
        result: formattedResult,
      })
    } catch (err) {
      setResultValue(null)
      setResultExpression(null)
      setInterpretacion(null)
      setTabla(null)
      setError(err instanceof Error ? err.message : 'No se pudo calcular')
    }
  }

  const handleCopy = () => {
    if (resultValue === null) {
      return
    }
    onCopy(formatResult(resultValue))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="calculadora-ingenieria-shell">
      <div className="calculadora-ingenieria-body">
        <div className="calculadora-ingenieria-controls">
          <label className="calculadora-ingenieria-field">
            <span className="calculadora-ingenieria-label">Función</span>
            <select
              className="calculadora-ingenieria-select"
              value={funcion}
              onChange={event => {
                setFuncion(event.target.value as IngenieriaEconomicaFuncion)
                setResultValue(null)
                setResultExpression(null)
                setInterpretacion(null)
                setTabla(null)
                setError(null)
              }}
            >
              {categorias.map(categoria => (
                <optgroup key={categoria} label={categoria}>
                  {INGENIERIA_ECONOMICA_FUNCIONES.filter(item => item.categoria === categoria).map(
                    item => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    )
                  )}
                </optgroup>
              ))}
            </select>
          </label>

          {isFlujos ? (
            <label className="calculadora-ingenieria-field">
              <span className="calculadora-ingenieria-label">{meta.montoLabel}</span>
              <textarea
                className="calculadora-ingenieria-textarea"
                value={flujos}
                onChange={event => setFlujos(event.target.value)}
                rows={3}
                placeholder="-1000, 300, 400, 500"
              />
            </label>
          ) : !isTabla ? (
            <label className="calculadora-ingenieria-field">
              <span className="calculadora-ingenieria-label">{meta.montoLabel}</span>
              <input
                className="calculadora-ingenieria-input"
                type="text"
                inputMode="decimal"
                value={monto}
                onChange={event => setMonto(event.target.value)}
                placeholder="0"
              />
            </label>
          ) : null}

          {!isTasaEfectiva ? (
            <div
              className={`calculadora-ingenieria-input-row${isFlujos ? ' calculadora-ingenieria-input-row--single' : ''}`}
            >
              <label className="calculadora-ingenieria-field">
                <span className="calculadora-ingenieria-label">
                  {isTir ? 'Tasa ref. (%)' : 'Tasa i (%)'}
                </span>
                <input
                  className="calculadora-ingenieria-input"
                  type="text"
                  inputMode="decimal"
                  value={tasa}
                  onChange={event => setTasa(event.target.value)}
                  placeholder="12"
                />
              </label>
              {!isFlujos ? (
                <label className="calculadora-ingenieria-field">
                  <span className="calculadora-ingenieria-label">Periodos n</span>
                  <input
                    className="calculadora-ingenieria-input"
                    type="text"
                    inputMode="numeric"
                    value={periodos}
                    onChange={event => setPeriodos(event.target.value)}
                    placeholder="12"
                  />
                </label>
              ) : null}
            </div>
          ) : (
            <label className="calculadora-ingenieria-field">
              <span className="calculadora-ingenieria-label">Periodos por año (m)</span>
              <input
                className="calculadora-ingenieria-input"
                type="text"
                inputMode="numeric"
                value={periodos}
                onChange={event => setPeriodos(event.target.value)}
                placeholder="4"
              />
            </label>
          )}

          <button type="button" className="calculadora-ingenieria-submit" onClick={handleCalculate}>
            Calcular
          </button>
          {error ? <p className="calculadora-ingenieria-error">{error}</p> : null}
        </div>

        <div className="calculadora-ingenieria-panel">
          <header className="calculadora-ingenieria-panel-head">
            <div>
              <p className="calculadora-ingenieria-kicker">{meta.categoria}</p>
              <h3 className="calculadora-ingenieria-panel-title">{meta.label}</h3>
            </div>
            <p className="calculadora-ingenieria-formula">{meta.formula}</p>
          </header>

          <p className="calculadora-ingenieria-guide">{meta.explicacion}</p>

          <div
            className={`calculadora-ingenieria-result-area${hasResult ? ' calculadora-ingenieria-result-area--filled' : ''}`}
            aria-live="polite"
          >
            {!hasResult ? (
              <p className="calculadora-ingenieria-result-placeholder">
                El resultado aparece aquí al calcular.
              </p>
            ) : (
              <>
                {!isTabla && resultValue !== null ? (
                  <div className="calculadora-ingenieria-result-top">
                    <p className="calculadora-ingenieria-result-value">{formatResult(resultValue)}</p>
                    <button
                      type="button"
                      className="calculadora-copy-button"
                      onClick={handleCopy}
                      aria-label="Copiar resultado"
                      title="Copiar resultado"
                    >
                      {copied ? (
                        <CheckIcon className="calculadora-copy-icon" />
                      ) : (
                        <ContentCopyIcon className="calculadora-copy-icon" />
                      )}
                    </button>
                  </div>
                ) : null}

                <p className="calculadora-ingenieria-result-detail">{resultExpression}</p>

                {interpretacion ? (
                  <p className="calculadora-ingenieria-interpretacion">{interpretacion}</p>
                ) : null}

                {tabla ? (
                  <div className="calculadora-ingenieria-tabla-wrap">
                    <table className="calculadora-ingenieria-tabla">
                      <thead>
                        <tr>
                          <th scope="col">Factor</th>
                          <th scope="col">Valor</th>
                          <th scope="col">Uso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tabla.map(row => (
                          <tr key={row.simbolo}>
                            <td className="calculadora-ingenieria-tabla-factor">
                              <span className="calculadora-ingenieria-tabla-simbolo">{row.simbolo}</span>
                              {row.nombre}
                            </td>
                            <td className="calculadora-ingenieria-tabla-valor">
                              {formatIngenieriaNumber(row.valor)}
                            </td>
                            <td className="calculadora-ingenieria-tabla-explicacion">{row.explicacion}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalculadoraIngenieriaPanel
