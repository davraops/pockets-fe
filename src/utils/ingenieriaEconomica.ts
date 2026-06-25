export type IngenieriaEconomicaFuncion =
  | 'vp'
  | 'vf'
  | 'pva'
  | 'fva'
  | 'ap'
  | 'af'
  | 'tasaEfectiva'
  | 'van'
  | 'tir'
  | 'pg'
  | 'fg'
  | 'tablas'

export type IngenieriaInputTipo = 'monto' | 'flujos' | 'tabla' | 'tasaEfectiva'

export interface IngenieriaEconomicaFuncionMeta {
  id: IngenieriaEconomicaFuncion
  categoria: string
  label: string
  shortLabel: string
  montoLabel: string
  montoHint: string
  formula: string
  explicacion: string
  inputTipo: IngenieriaInputTipo
}

export interface FactorTablaRow {
  simbolo: string
  nombre: string
  valor: number
  explicacion: string
}

export interface IngenieriaEconomicaInput {
  funcion: IngenieriaEconomicaFuncion
  monto: number
  /** Tasa por periodo en porcentaje (ej. 12 = 12%) */
  tasaPorPeriodo: number
  /** Número de periodos n (o m para tasa efectiva) */
  periodos: number
  flujos?: number[]
}

export interface IngenieriaEconomicaResult {
  value: number
  expression: string
  label: string
  interpretacion?: string
  tabla?: FactorTablaRow[]
}

export const INGENIERIA_ECONOMICA_FUNCIONES: IngenieriaEconomicaFuncionMeta[] = [
  {
    id: 'vp',
    categoria: 'Interés compuesto',
    label: 'Valor presente (VP)',
    shortLabel: 'VP',
    montoLabel: 'Valor futuro (VF)',
    montoHint: 'Monto único a traer a hoy',
    formula: 'VP = VF / (1 + i)^n',
    explicacion:
      'Responde: “¿cuánto vale hoy un pago futuro?” Usa la misma tasa i y periodos n que el flujo. Ejemplo: recibir $1.000 en 3 años al 10% anual equivale hoy a $751,31.',
    inputTipo: 'monto',
  },
  {
    id: 'vf',
    categoria: 'Interés compuesto',
    label: 'Valor futuro (VF)',
    shortLabel: 'VF',
    montoLabel: 'Valor presente (VP)',
    montoHint: 'Monto único a capitalizar',
    formula: 'VF = VP · (1 + i)^n',
    explicacion:
      'Responde: “¿cuánto tendré si dejo crecer un monto hoy?” Es interés compuesto sobre un solo desembolso. Ejemplo: $1.000 hoy al 10% anual por 3 años → $1.331.',
    inputTipo: 'monto',
  },
  {
    id: 'pva',
    categoria: 'Anualidades',
    label: 'Valor presente de anualidad (P/A)',
    shortLabel: 'VP anualidad',
    montoLabel: 'Pago periódico (A)',
    montoHint: 'Cuota uniforme por periodo',
    formula: 'PVA = A · [(1 − (1 + i)^−n) / i]',
    explicacion:
      'Trae a hoy una serie de pagos iguales (A) al final de cada periodo. Sirve para valorar arriendos, cuotas fijas o ingresos uniformes.',
    inputTipo: 'monto',
  },
  {
    id: 'fva',
    categoria: 'Anualidades',
    label: 'Valor futuro de anualidad (F/A)',
    shortLabel: 'VF anualidad',
    montoLabel: 'Pago periódico (A)',
    montoHint: 'Cuota uniforme por periodo',
    formula: 'FVA = A · [((1 + i)^n − 1) / i]',
    explicacion:
      'Acumula al final del horizonte una serie de aportes iguales. Útil para metas de ahorro con aportes periódicos fijos.',
    inputTipo: 'monto',
  },
  {
    id: 'ap',
    categoria: 'Anualidades',
    label: 'Recuperación de capital (A/P)',
    shortLabel: 'A/P',
    montoLabel: 'Valor presente (P)',
    montoHint: 'Préstamo o inversión inicial',
    formula: 'A = P · [i(1 + i)^n / ((1 + i)^n − 1)]',
    explicacion:
      'Calcula la cuota fija que amortiza un préstamo P en n periodos a tasa i. Cada cuota incluye interés y abono a capital.',
    inputTipo: 'monto',
  },
  {
    id: 'af',
    categoria: 'Anualidades',
    label: 'Fondo de amortización (A/F)',
    shortLabel: 'A/F',
    montoLabel: 'Valor futuro (F)',
    montoHint: 'Meta acumulada al final',
    formula: 'A = F · [i / ((1 + i)^n − 1)]',
    explicacion:
      'Cuánto ahorrar cada periodo para llegar a una meta F. Los intereses ayudan: la cuota A es menor que F/n.',
    inputTipo: 'monto',
  },
  {
    id: 'van',
    categoria: 'Evaluación de proyectos',
    label: 'Valor actual neto (VAN)',
    shortLabel: 'VAN',
    montoLabel: 'Flujos de caja',
    montoHint: 'Separados por coma. Periodo 0 = hoy',
    formula: 'VAN = Σ Ft / (1 + i)^t',
    explicacion:
      'Suma todos los flujos traídos a hoy con la tasa i (costo de oportunidad). Convención: periodo 0 es el desembolso inicial (negativo). VAN > 0 → el proyecto crea valor; VAN < 0 → destruye valor a esa tasa.',
    inputTipo: 'flujos',
  },
  {
    id: 'tir',
    categoria: 'Evaluación de proyectos',
    label: 'Tasa interna de retorno (TIR)',
    shortLabel: 'TIR',
    montoLabel: 'Flujos de caja',
    montoHint: 'Separados por coma. Debe haber signos opuestos',
    formula: 'VAN(TIR) = 0',
    explicacion:
      'Es la tasa donde el VAN se anula. Si TIR > costo de oportunidad, el proyecto suele ser aceptable. Requiere al menos un flujo positivo y uno negativo. Se calcula por iteración numérica.',
    inputTipo: 'flujos',
  },
  {
    id: 'pg',
    categoria: 'Gradientes',
    label: 'Valor presente gradiente (P/G)',
    shortLabel: 'P/G',
    montoLabel: 'Incremento por periodo (G)',
    montoHint: 'Serie: G, 2G, 3G… al final de cada periodo',
    formula: 'VP = G · (P/G, i, n)',
    explicacion:
      'Para pagos que crecen en cantidad fija G cada periodo (1.er pago = G, 2.º = 2G, etc.). Común en contratos con escalamiento lineal de costos o ingresos.',
    inputTipo: 'monto',
  },
  {
    id: 'fg',
    categoria: 'Gradientes',
    label: 'Valor futuro gradiente (F/G)',
    shortLabel: 'F/G',
    montoLabel: 'Incremento por periodo (G)',
    montoHint: 'Serie: G, 2G, 3G… al final de cada periodo',
    formula: 'VF = G · (F/G, i, n)',
    explicacion:
      'Acumula al periodo n una serie con crecimiento aritmético G por periodo. Es el equivalente futuro del gradiente, no el valor presente.',
    inputTipo: 'monto',
  },
  {
    id: 'tablas',
    categoria: 'Referencia',
    label: 'Tabla de factores de interés',
    shortLabel: 'Factores',
    montoLabel: 'No aplica',
    montoHint: 'Solo necesitas tasa i y periodos n',
    formula: '(P/F), (F/P), (P/A), (A/P), (F/A), (A/F), (P/G), (F/G)',
    explicacion:
      'Genera los factores estándar de ingeniería económica para la tasa y el horizonte dados. Úsalos para convertir entre P (presente), F (futuro), A (anualidad) y G (gradiente) sin repetir fórmulas.',
    inputTipo: 'tabla',
  },
  {
    id: 'tasaEfectiva',
    categoria: 'Interés compuesto',
    label: 'Tasa efectiva por periodo',
    shortLabel: 'i efectiva',
    montoLabel: 'Tasa nominal por subperiodo (%)',
    montoHint: 'Ej: 2% trimestral con 4 periodos/año',
    formula: 'i_ef = (1 + i_nom)^m − 1',
    explicacion:
      'Convierte una tasa nominal por subperiodo en tasa efectiva del periodo completo. Ejemplo: 2% trimestral capitalizado → (1,02)^4 − 1 ≈ 8,24% efectiva anual.',
    inputTipo: 'tasaEfectiva',
  },
]

function pow1PlusI(i: number, n: number): number {
  return Math.pow(1 + i, n)
}

function annuityFactor(i: number, n: number): number {
  if (i === 0) {
    return n
  }
  const factor = pow1PlusI(i, n)
  return (factor - 1) / i
}

function presentWorthFactor(i: number, n: number): number {
  if (i === 0) {
    return n
  }
  return (1 - Math.pow(1 + i, -n)) / i
}

function capitalRecoveryFactor(i: number, n: number): number {
  if (i === 0) {
    return 1 / n
  }
  const factor = pow1PlusI(i, n)
  return (i * factor) / (factor - 1)
}

function sinkingFundFactor(i: number, n: number): number {
  if (i === 0) {
    return 1 / n
  }
  return i / (pow1PlusI(i, n) - 1)
}

/** Factor (P/G): VP de la serie G, 2G, …, nG */
export function gradientPresentFactor(i: number, n: number): number {
  if (n <= 0) {
    throw new Error('Los periodos deben ser mayores a 0')
  }
  if (Math.abs(i) < 1e-12) {
    return (n * (n + 1)) / 2
  }
  const factor = pow1PlusI(i, n)
  return (factor - 1 - n * i) / (i * i * factor)
}

/** Factor (F/G): VF en n de la serie G, 2G, …, nG */
export function gradientFutureFactor(i: number, n: number): number {
  if (n <= 0) {
    throw new Error('Los periodos deben ser mayores a 0')
  }
  if (Math.abs(i) < 1e-12) {
    return (n * (n + 1)) / 2
  }
  const factor = pow1PlusI(i, n)
  return (factor - 1 - n * i) / (i * i)
}

export function calcularVan(flujos: number[], tasaDecimal: number): number {
  return flujos.reduce((sum, flujo, periodo) => sum + flujo / pow1PlusI(tasaDecimal, periodo), 0)
}

export function calcularTir(flujos: number[]): number {
  if (flujos.length < 2) {
    throw new Error('Ingresa al menos dos flujos de caja')
  }

  const tienePositivo = flujos.some(f => f > 0)
  const tieneNegativo = flujos.some(f => f < 0)
  if (!tienePositivo || !tieneNegativo) {
    throw new Error('La TIR requiere flujos positivos y negativos (cambio de signo)')
  }

  let rate = 0.1
  for (let iter = 0; iter < 80; iter++) {
    const npv = calcularVan(flujos, rate)
    const derivada = flujos.reduce(
      (sum, flujo, periodo) => sum - periodo * flujo / pow1PlusI(rate, periodo + 1),
      0
    )

    if (Math.abs(npv) < 1e-8) {
      return rate
    }
    if (Math.abs(derivada) < 1e-12) {
      break
    }

    const next = rate - npv / derivada
    if (!Number.isFinite(next) || next <= -0.9999) {
      break
    }
    rate = next
  }

  let low = -0.9999
  let high = 1
  let npvLow = calcularVan(flujos, low)
  let npvHigh = calcularVan(flujos, high)

  while (npvLow * npvHigh > 0 && high < 100) {
    high *= 2
    npvHigh = calcularVan(flujos, high)
  }

  if (npvLow * npvHigh > 0) {
    throw new Error('No se encontró una TIR única para estos flujos')
  }

  for (let iter = 0; iter < 120; iter++) {
    const mid = (low + high) / 2
    const npvMid = calcularVan(flujos, mid)
    if (Math.abs(npvMid) < 1e-8) {
      return mid
    }
    if (npvLow * npvMid <= 0) {
      high = mid
      npvHigh = npvMid
    } else {
      low = mid
      npvLow = npvMid
    }
  }

  return (low + high) / 2
}

export function parseFlujosCaja(texto: string): number[] {
  const flujos = texto
    .split(/[,;\s]+/)
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => parseFloat(part.replace(',', '.')))

  if (flujos.length === 0) {
    throw new Error('Ingresa al menos un flujo de caja')
  }
  if (flujos.some(f => !Number.isFinite(f))) {
    throw new Error('Todos los flujos deben ser números válidos')
  }
  return flujos
}

export function generarTablaFactores(tasaPorPeriodo: number, periodos: number): FactorTablaRow[] {
  const i = tasaPorPeriodo / 100
  if (i <= -1) {
    throw new Error('La tasa por periodo debe ser mayor a −100%')
  }
  if (!Number.isFinite(periodos) || periodos <= 0) {
    throw new Error('Los periodos deben ser mayores a 0')
  }

  const pf = 1 / pow1PlusI(i, periodos)
  const fp = pow1PlusI(i, periodos)
  const pa = presentWorthFactor(i, periodos)
  const ap = capitalRecoveryFactor(i, periodos)
  const fa = annuityFactor(i, periodos)
  const af = sinkingFundFactor(i, periodos)
  const pg = gradientPresentFactor(i, periodos)
  const fg = gradientFutureFactor(i, periodos)

  return [
    {
      simbolo: '(P/F)',
      nombre: 'Valor presente de F',
      valor: pf,
      explicacion: 'Cuánto vale hoy $1 recibido en n periodos.',
    },
    {
      simbolo: '(F/P)',
      nombre: 'Valor futuro de P',
      valor: fp,
      explicacion: 'Cuánto crece $1 hoy en n periodos.',
    },
    {
      simbolo: '(P/A)',
      nombre: 'Valor presente de anualidad',
      valor: pa,
      explicacion: 'Valor hoy de $1 al final de cada periodo durante n.',
    },
    {
      simbolo: '(A/P)',
      nombre: 'Recuperación de capital',
      valor: ap,
      explicacion: 'Cuota fija que amortiza $1 hoy en n periodos.',
    },
    {
      simbolo: '(F/A)',
      nombre: 'Valor futuro de anualidad',
      valor: fa,
      explicacion: 'Acumulado al periodo n de aportes de $1.',
    },
    {
      simbolo: '(A/F)',
      nombre: 'Fondo de amortización',
      valor: af,
      explicacion: 'Aporte periódico para acumular $1 al final.',
    },
    {
      simbolo: '(P/G)',
      nombre: 'Valor presente de gradiente',
      valor: pg,
      explicacion: 'Valor hoy de la serie 1, 2, …, n (crece $1/periodo).',
    },
    {
      simbolo: '(F/G)',
      nombre: 'Valor futuro de gradiente',
      valor: fg,
      explicacion: 'Acumulado en n de la serie 1, 2, …, n.',
    },
  ]
}

function interpretarVan(value: number): string {
  if (value > 0) {
    return `VAN positivo (${formatIngenieriaNumber(value)}): a la tasa dada el proyecto genera valor neto.`
  }
  if (value < 0) {
    return `VAN negativo (${formatIngenieriaNumber(value)}): a la tasa dada el proyecto no se paga solo.`
  }
  return 'VAN = 0: el proyecto está en el límite de indiferencia a esa tasa.'
}

function interpretarTir(value: number, tasaReferencia: number): string {
  const tirPct = value * 100
  if (value > tasaReferencia / 100) {
    return `TIR ≈ ${formatIngenieriaPercent(value)} supera tu tasa de referencia (${tasaReferencia}%): rentabilidad esperada mayor al costo de oportunidad.`
  }
  if (value < tasaReferencia / 100) {
    return `TIR ≈ ${formatIngenieriaPercent(value)} está por debajo de ${tasaReferencia}%: el costo de capital podría no compensarse.`
  }
  return `TIR ≈ ${formatIngenieriaPercent(value)} coincide con la tasa de referencia.`
}

export function calcularIngenieriaEconomica(
  input: IngenieriaEconomicaInput
): IngenieriaEconomicaResult {
  const meta = getIngenieriaFuncionMeta(input.funcion)
  const { monto, tasaPorPeriodo, periodos, funcion, flujos } = input

  if (funcion === 'van' || funcion === 'tir') {
    if (!flujos || flujos.length === 0) {
      throw new Error('Ingresa los flujos de caja')
    }
    if (!Number.isFinite(tasaPorPeriodo)) {
      throw new Error('Ingresa una tasa válida')
    }
    const i = tasaPorPeriodo / 100
    if (i <= -1) {
      throw new Error('La tasa por periodo debe ser mayor a −100%')
    }

    if (funcion === 'van') {
      const value = calcularVan(flujos, i)
      const flujosTexto = flujos.map(f => formatIngenieriaNumber(f)).join(', ')
      return {
        value,
        label: meta.label,
        expression: `VAN(${flujosTexto}) @ ${tasaPorPeriodo}% = ${formatIngenieriaNumber(value)}`,
        interpretacion: interpretarVan(value),
      }
    }

    const value = calcularTir(flujos)
    const flujosTexto = flujos.map(f => formatIngenieriaNumber(f)).join(', ')
    return {
      value,
      label: meta.label,
      expression: `TIR(${flujosTexto}) ≈ ${formatIngenieriaPercent(value)}`,
      interpretacion: interpretarTir(value, tasaPorPeriodo),
    }
  }

  if (funcion === 'tablas') {
    const tabla = generarTablaFactores(tasaPorPeriodo, periodos)
    return {
      value: tabla[0]?.valor ?? 0,
      label: meta.label,
      expression: `Factores @ ${tasaPorPeriodo}%, n = ${periodos}`,
      interpretacion:
        'Multiplica cada factor por P, F, A o G según la conversión que necesites. Ejemplo: VP de $500/mes → 500 × (P/A).',
      tabla,
    }
  }

  if (!Number.isFinite(monto)) {
    throw new Error('Ingresa un monto válido')
  }

  if (funcion === 'tasaEfectiva') {
    if (!Number.isFinite(tasaPorPeriodo)) {
      throw new Error('Ingresa una tasa nominal válida')
    }
    if (!Number.isInteger(periodos) || periodos <= 0) {
      throw new Error('Los periodos por año deben ser un entero mayor a 0')
    }
    const iNom = tasaPorPeriodo / 100
    if (iNom <= -1) {
      throw new Error('La tasa nominal debe ser mayor a −100%')
    }
    const value = pow1PlusI(iNom, periodos) - 1
    return {
      value,
      label: meta.label,
      expression: `i_ef = (1 + ${tasaPorPeriodo}%)^${periodos} − 1 = ${formatIngenieriaPercent(value)}`,
      interpretacion: `Una tasa nominal de ${tasaPorPeriodo}% por subperiodo equivale a ${formatIngenieriaPercent(value)} efectiva por periodo completo.`,
    }
  }

  if (!Number.isFinite(tasaPorPeriodo)) {
    throw new Error('Ingresa una tasa válida')
  }
  if (!Number.isFinite(periodos) || periodos <= 0) {
    throw new Error('Los periodos deben ser mayores a 0')
  }

  const i = tasaPorPeriodo / 100
  if (i <= -1) {
    throw new Error('La tasa por periodo debe ser mayor a −100%')
  }

  let value: number
  let expression: string
  let interpretacion: string | undefined

  switch (funcion) {
    case 'vp': {
      value = monto / pow1PlusI(i, periodos)
      expression = `VP = ${formatIngenieriaNumber(monto)} / (1 + ${tasaPorPeriodo}%)^${periodos}`
      interpretacion = `Hoy necesitarías ${formatIngenieriaNumber(value)} para equivaler a ${formatIngenieriaNumber(monto)} en ${periodos} periodos.`
      break
    }
    case 'vf': {
      value = monto * pow1PlusI(i, periodos)
      expression = `VF = ${formatIngenieriaNumber(monto)} · (1 + ${tasaPorPeriodo}%)^${periodos}`
      interpretacion = `${formatIngenieriaNumber(monto)} hoy crecerían a ${formatIngenieriaNumber(value)} en ${periodos} periodos.`
      break
    }
    case 'pva': {
      value = monto * presentWorthFactor(i, periodos)
      expression = `PVA = ${formatIngenieriaNumber(monto)} · (P/A, ${tasaPorPeriodo}%, ${periodos})`
      interpretacion = `Una anualidad de ${formatIngenieriaNumber(monto)} vale hoy ${formatIngenieriaNumber(value)}.`
      break
    }
    case 'fva': {
      value = monto * annuityFactor(i, periodos)
      expression = `FVA = ${formatIngenieriaNumber(monto)} · (F/A, ${tasaPorPeriodo}%, ${periodos})`
      interpretacion = `Aportes de ${formatIngenieriaNumber(monto)} acumulan ${formatIngenieriaNumber(value)} al final.`
      break
    }
    case 'ap': {
      value = monto * capitalRecoveryFactor(i, periodos)
      expression = `A = ${formatIngenieriaNumber(monto)} · (A/P, ${tasaPorPeriodo}%, ${periodos})`
      interpretacion = `Para financiar ${formatIngenieriaNumber(monto)}, la cuota fija sería ${formatIngenieriaNumber(value)} por periodo.`
      break
    }
    case 'af': {
      value = monto * sinkingFundFactor(i, periodos)
      expression = `A = ${formatIngenieriaNumber(monto)} · (A/F, ${tasaPorPeriodo}%, ${periodos})`
      interpretacion = `Para acumular ${formatIngenieriaNumber(monto)}, ahorra ${formatIngenieriaNumber(value)} cada periodo.`
      break
    }
    case 'pg': {
      value = monto * gradientPresentFactor(i, periodos)
      expression = `VP = ${formatIngenieriaNumber(monto)} · (P/G, ${tasaPorPeriodo}%, ${periodos})`
      interpretacion = `Un gradiente de ${formatIngenieriaNumber(monto)}/periodo vale hoy ${formatIngenieriaNumber(value)} (serie G, 2G, …, nG).`
      break
    }
    case 'fg': {
      value = monto * gradientFutureFactor(i, periodos)
      expression = `VF = ${formatIngenieriaNumber(monto)} · (F/G, ${tasaPorPeriodo}%, ${periodos})`
      interpretacion = `El gradiente acumula ${formatIngenieriaNumber(value)} al periodo ${periodos}.`
      break
    }
    default:
      throw new Error('Función no reconocida')
  }

  return {
    value,
    label: meta.label,
    expression: `${expression} = ${formatIngenieriaNumber(value)}`,
    interpretacion,
  }
}

export function formatIngenieriaNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return '—'
  }
  if (Math.abs(value) >= 1e12 || (Math.abs(value) > 0 && Math.abs(value) < 1e-6)) {
    return value.toExponential(4)
  }
  return new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
  }).format(value)
}

export function formatIngenieriaPercent(decimalRate: number): string {
  if (!Number.isFinite(decimalRate)) {
    return '—'
  }
  return `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 4 }).format(decimalRate * 100)}%`
}

export function getIngenieriaFuncionMeta(id: IngenieriaEconomicaFuncion): IngenieriaEconomicaFuncionMeta {
  const meta = INGENIERIA_ECONOMICA_FUNCIONES.find(f => f.id === id)
  if (!meta) {
    throw new Error('Función no reconocida')
  }
  return meta
}

export function getIngenieriaCategorias(): string[] {
  return [...new Set(INGENIERIA_ECONOMICA_FUNCIONES.map(f => f.categoria))]
}
