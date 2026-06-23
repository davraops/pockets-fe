import { useState, useMemo, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useTheme } from '../contexts/ThemeContext'
import { buildLineChartOptions, getChartThemeColors } from '../utils/chartTheme'
import './AppPage.css'
import './Inflacion.css'

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Datos históricos de inflación anual de Colombia (DANE)
const annualInflationData: Array<{ year: number; value: number }> = [
  { year: 1946, value: 99.31 },
  { year: 1947, value: 88.3 },
  { year: 1948, value: 66.0 },
  { year: 1949, value: 66.7 },
  { year: 1950, value: 20.5 },
  { year: 1951, value: 8.9 },
  { year: 1952, value: 2.3 },
  { year: 1953, value: 7.3 },
  { year: 1954, value: 8.8 },
  { year: 1955, value: 1.72 },
  { year: 1956, value: 8.47 },
  { year: 1957, value: 18.75 },
  { year: 1958, value: 9.21 },
  { year: 1959, value: 20.23 },
  { year: 1960, value: 6.74 },
  { year: 1961, value: 6.32 },
  { year: 1962, value: 6.93 },
  { year: 1963, value: 32.41 },
  { year: 1964, value: 8.39 },
  { year: 1965, value: 14.84 },
  { year: 1966, value: 12.92 },
  { year: 1967, value: 7.9 },
  { year: 1968, value: 6.46 },
  { year: 1969, value: 8.9 },
  { year: 1970, value: 7.06 },
  { year: 1971, value: 12.84 },
  { year: 1972, value: 13.53 },
  { year: 1973, value: 22.49 },
  { year: 1974, value: 25.0 },
  { year: 1975, value: 17.52 },
  { year: 1976, value: 25.6 },
  { year: 1977, value: 27.45 },
  { year: 1978, value: 19.75 },
  { year: 1979, value: 28.81 },
  { year: 1980, value: 25.96 },
  { year: 1981, value: 26.36 },
  { year: 1982, value: 24.03 },
  { year: 1983, value: 16.62 },
  { year: 1984, value: 18.28 },
  { year: 1985, value: 22.45 },
  { year: 1986, value: 20.95 },
  { year: 1987, value: 24.02 },
  { year: 1988, value: 28.12 },
  { year: 1989, value: 26.12 },
  { year: 1990, value: 32.36 },
  { year: 1991, value: 26.82 },
  { year: 1992, value: 25.13 },
  { year: 1993, value: 22.6 },
  { year: 1994, value: 22.6 },
  { year: 1995, value: 19.46 },
  { year: 1996, value: 21.63 },
  { year: 1997, value: 17.68 },
  { year: 1998, value: 16.7 },
  { year: 1999, value: 9.23 },
  { year: 2000, value: 8.75 },
  { year: 2001, value: 7.65 },
  { year: 2002, value: 6.99 },
  { year: 2003, value: 6.49 },
  { year: 2004, value: 5.5 },
  { year: 2005, value: 4.85 },
  { year: 2006, value: 4.48 },
  { year: 2007, value: 5.69 },
  { year: 2008, value: 7.67 },
  { year: 2009, value: 2.0 },
  { year: 2010, value: 3.17 },
  { year: 2011, value: 3.73 },
  { year: 2012, value: 2.44 },
  { year: 2013, value: 1.94 },
  { year: 2014, value: 3.66 },
  { year: 2015, value: 6.77 },
  { year: 2016, value: 5.75 },
  { year: 2017, value: 4.09 },
  { year: 2018, value: 3.18 },
  { year: 2019, value: 3.8 },
  { year: 2020, value: 1.61 },
  { year: 2021, value: 5.62 },
  { year: 2022, value: 13.12 },
  { year: 2023, value: 9.28 },
  { year: 2024, value: 6.12 },
  { year: 2025, value: 5.1 },
]

// Datos históricos de salario mínimo en Colombia
interface MinimumWageData {
  year: number
  exchangeRate: number
  dailyWage: number
  monthlyWage: number
  annualVariation: number
  inflation: number
  usdEquivalent: number
  cop2020Equivalent: number
  transportAllowance: number
  totalWithTransport: number
}

const minimumWageData: MinimumWageData[] = [
  {
    year: 1950,
    exchangeRate: 1.96,
    dailyWage: 2,
    monthlyWage: 90,
    annualVariation: 0,
    inflation: 20.5,
    usdEquivalent: 45.92,
    cop2020Equivalent: 317553,
    transportAllowance: 0,
    totalWithTransport: 90,
  },
  {
    year: 1960,
    exchangeRate: 6.7,
    dailyWage: 6.6,
    monthlyWage: 198,
    annualVariation: 27.4,
    inflation: 7.35,
    usdEquivalent: 29.55,
    cop2020Equivalent: 507142,
    transportAllowance: 0,
    totalWithTransport: 198,
  },
  {
    year: 1970,
    exchangeRate: 18.44,
    dailyWage: 17.3,
    monthlyWage: 519,
    annualVariation: 0,
    inflation: 6.58,
    usdEquivalent: 28.15,
    cop2020Equivalent: 418935,
    transportAllowance: 0,
    totalWithTransport: 519,
  },
  {
    year: 1980,
    exchangeRate: 47.28,
    dailyWage: 150,
    monthlyWage: 4500,
    annualVariation: 30.4,
    inflation: 25.85,
    usdEquivalent: 95.18,
    cop2020Equivalent: 657887,
    transportAllowance: 0,
    totalWithTransport: 4500,
  },
  {
    year: 1984,
    exchangeRate: 100.82,
    dailyWage: 376.6,
    monthlyWage: 11298,
    annualVariation: 0,
    inflation: 18.28,
    usdEquivalent: 112.06,
    cop2020Equivalent: 710746,
    transportAllowance: 0,
    totalWithTransport: 11298,
  },
  {
    year: 1985,
    exchangeRate: 142.31,
    dailyWage: 451.92,
    monthlyWage: 13558,
    annualVariation: 20,
    inflation: 22.45,
    usdEquivalent: 95.27,
    cop2020Equivalent: 721702,
    transportAllowance: 0,
    totalWithTransport: 13558,
  },
  {
    year: 1986,
    exchangeRate: 194.26,
    dailyWage: 560.38,
    monthlyWage: 16811,
    annualVariation: 24,
    inflation: 20.95,
    usdEquivalent: 86.54,
    cop2020Equivalent: 730117,
    transportAllowance: 0,
    totalWithTransport: 16811,
  },
  {
    year: 1987,
    exchangeRate: 242.61,
    dailyWage: 683.66,
    monthlyWage: 20510,
    annualVariation: 22,
    inflation: 24.02,
    usdEquivalent: 84.54,
    cop2020Equivalent: 739214,
    transportAllowance: 0,
    totalWithTransport: 20510,
  },
  {
    year: 1988,
    exchangeRate: 299.17,
    dailyWage: 854.58,
    monthlyWage: 25637,
    annualVariation: 25,
    inflation: 28.12,
    usdEquivalent: 85.69,
    cop2020Equivalent: 745412,
    transportAllowance: 0,
    totalWithTransport: 25637,
  },
  {
    year: 1989,
    exchangeRate: 382.57,
    dailyWage: 1085.32,
    monthlyWage: 32560,
    annualVariation: 27,
    inflation: 26.12,
    usdEquivalent: 85.11,
    cop2020Equivalent: 736324,
    transportAllowance: 3063,
    totalWithTransport: 35623,
  },
  {
    year: 1990,
    exchangeRate: 507.21,
    dailyWage: 1367.5,
    monthlyWage: 41025,
    annualVariation: 26,
    inflation: 32.36,
    usdEquivalent: 80.88,
    cop2020Equivalent: 736746,
    transportAllowance: 3798,
    totalWithTransport: 44823,
  },
  {
    year: 1991,
    exchangeRate: 605.41,
    dailyWage: 1724,
    monthlyWage: 51720,
    annualVariation: 26.07,
    inflation: 26.82,
    usdEquivalent: 85.43,
    cop2020Equivalent: 701769,
    transportAllowance: 4787,
    totalWithTransport: 56507,
  },
  {
    year: 1992,
    exchangeRate: 685.18,
    dailyWage: 2173,
    monthlyWage: 65190,
    annualVariation: 26.04,
    inflation: 25.14,
    usdEquivalent: 95.14,
    cop2020Equivalent: 697600,
    transportAllowance: 6033,
    totalWithTransport: 71223,
  },
  {
    year: 1993,
    exchangeRate: 771.16,
    dailyWage: 2717,
    monthlyWage: 81510,
    annualVariation: 25.03,
    inflation: 22.61,
    usdEquivalent: 105.7,
    cop2020Equivalent: 696930,
    transportAllowance: 7542,
    totalWithTransport: 89052,
  },
  {
    year: 1994,
    exchangeRate: 817.8,
    dailyWage: 3290,
    monthlyWage: 98700,
    annualVariation: 21.09,
    inflation: 22.6,
    usdEquivalent: 120.69,
    cop2020Equivalent: 688049,
    transportAllowance: 8705,
    totalWithTransport: 107405,
  },
  {
    year: 1995,
    exchangeRate: 909.25,
    dailyWage: 3964.47,
    monthlyWage: 118394,
    annualVariation: 20.5,
    inflation: 19.47,
    usdEquivalent: 130.8,
    cop2020Equivalent: 673386,
    transportAllowance: 10815,
    totalWithTransport: 129209,
  },
  {
    year: 1996,
    exchangeRate: 996.26,
    dailyWage: 4737.5,
    monthlyWage: 142125,
    annualVariation: 19.5,
    inflation: 21.64,
    usdEquivalent: 142.65,
    cop2020Equivalent: 676723,
    transportAllowance: 13567,
    totalWithTransport: 155692,
  },
  {
    year: 1997,
    exchangeRate: 1146.46,
    dailyWage: 5733.5,
    monthlyWage: 172005,
    annualVariation: 21.02,
    inflation: 17.68,
    usdEquivalent: 149.64,
    cop2020Equivalent: 673232,
    transportAllowance: 17250,
    totalWithTransport: 189255,
  },
  {
    year: 1998,
    exchangeRate: 1417.85,
    dailyWage: 6794.2,
    monthlyWage: 203825,
    annualVariation: 18.5,
    inflation: 16.7,
    usdEquivalent: 143.76,
    cop2020Equivalent: 677892,
    transportAllowance: 20700,
    totalWithTransport: 224525,
  },
  {
    year: 1999,
    exchangeRate: 1707.94,
    dailyWage: 7882,
    monthlyWage: 236460,
    annualVariation: 16.01,
    inflation: 9.23,
    usdEquivalent: 138.43,
    cop2020Equivalent: 673930,
    transportAllowance: 24012,
    totalWithTransport: 260472,
  },
  {
    year: 2000,
    exchangeRate: 2051.48,
    dailyWage: 8670,
    monthlyWage: 260100,
    annualVariation: 10,
    inflation: 8.75,
    usdEquivalent: 126.79,
    cop2020Equivalent: 678521,
    transportAllowance: 26413,
    totalWithTransport: 286513,
  },
  {
    year: 2001,
    exchangeRate: 2260.18,
    dailyWage: 9533.33,
    monthlyWage: 286000,
    annualVariation: 9.96,
    inflation: 7.76,
    usdEquivalent: 126.54,
    cop2020Equivalent: 686082,
    transportAllowance: 30000,
    totalWithTransport: 316000,
  },
  {
    year: 2002,
    exchangeRate: 2577.99,
    dailyWage: 10300,
    monthlyWage: 309000,
    annualVariation: 8.04,
    inflation: 6.99,
    usdEquivalent: 119.86,
    cop2020Equivalent: 688583,
    transportAllowance: 34000,
    totalWithTransport: 343000,
  },
  {
    year: 2003,
    exchangeRate: 2821.5,
    dailyWage: 11066.67,
    monthlyWage: 332000,
    annualVariation: 7.44,
    inflation: 6.49,
    usdEquivalent: 117.67,
    cop2020Equivalent: 691444,
    transportAllowance: 37500,
    totalWithTransport: 369500,
  },
  {
    year: 2004,
    exchangeRate: 2583.75,
    dailyWage: 11933.33,
    monthlyWage: 358000,
    annualVariation: 7.83,
    inflation: 5.5,
    usdEquivalent: 138.56,
    cop2020Equivalent: 700214,
    transportAllowance: 41600,
    totalWithTransport: 399600,
  },
  {
    year: 2005,
    exchangeRate: 2336.99,
    dailyWage: 12716.67,
    monthlyWage: 381500,
    annualVariation: 6.56,
    inflation: 4.85,
    usdEquivalent: 163.24,
    cop2020Equivalent: 707263,
    transportAllowance: 44500,
    totalWithTransport: 426000,
  },
  {
    year: 2006,
    exchangeRate: 2261.51,
    dailyWage: 13600,
    monthlyWage: 408000,
    annualVariation: 6.95,
    inflation: 4.48,
    usdEquivalent: 180.41,
    cop2020Equivalent: 721471,
    transportAllowance: 47700,
    totalWithTransport: 455700,
  },
  {
    year: 2007,
    exchangeRate: 2126.78,
    dailyWage: 14456.67,
    monthlyWage: 433700,
    annualVariation: 6.3,
    inflation: 5.69,
    usdEquivalent: 203.92,
    cop2020Equivalent: 734029,
    transportAllowance: 50800,
    totalWithTransport: 484500,
  },
  {
    year: 2008,
    exchangeRate: 2129.14,
    dailyWage: 15383.33,
    monthlyWage: 461500,
    annualVariation: 6.41,
    inflation: 7.67,
    usdEquivalent: 216.75,
    cop2020Equivalent: 739026,
    transportAllowance: 55000,
    totalWithTransport: 516500,
  },
  {
    year: 2009,
    exchangeRate: 2044.23,
    dailyWage: 16563.33,
    monthlyWage: 496900,
    annualVariation: 7.67,
    inflation: 2.0,
    usdEquivalent: 243.07,
    cop2020Equivalent: 738942,
    transportAllowance: 59300,
    totalWithTransport: 556200,
  },
  {
    year: 2010,
    exchangeRate: 1900.5,
    dailyWage: 17166.66,
    monthlyWage: 515000,
    annualVariation: 3.64,
    inflation: 3.17,
    usdEquivalent: 270.98,
    cop2020Equivalent: 750906,
    transportAllowance: 61500,
    totalWithTransport: 576500,
  },
  {
    year: 2011,
    exchangeRate: 1848.17,
    dailyWage: 17853.33,
    monthlyWage: 535600,
    annualVariation: 4,
    inflation: 3.73,
    usdEquivalent: 289.8,
    cop2020Equivalent: 756810,
    transportAllowance: 63600,
    totalWithTransport: 599200,
  },
  {
    year: 2012,
    exchangeRate: 1798.23,
    dailyWage: 18890,
    monthlyWage: 566700,
    annualVariation: 5.8,
    inflation: 2.44,
    usdEquivalent: 315.14,
    cop2020Equivalent: 772062,
    transportAllowance: 67800,
    totalWithTransport: 634500,
  },
  {
    year: 2013,
    exchangeRate: 1869,
    dailyWage: 19633.33,
    monthlyWage: 589500,
    annualVariation: 4.02,
    inflation: 1.94,
    usdEquivalent: 315,
    cop2020Equivalent: 783320,
    transportAllowance: 70500,
    totalWithTransport: 659500,
  },
  {
    year: 2014,
    exchangeRate: 2000,
    dailyWage: 20534,
    monthlyWage: 616000,
    annualVariation: 4.5,
    inflation: 3.66,
    usdEquivalent: 308,
    cop2020Equivalent: 803680,
    transportAllowance: 72000,
    totalWithTransport: 688000,
  },
  {
    year: 2015,
    exchangeRate: 2743,
    dailyWage: 21478,
    monthlyWage: 644350,
    annualVariation: 4.6,
    inflation: 6.77,
    usdEquivalent: 235,
    cop2020Equivalent: 811004,
    transportAllowance: 74000,
    totalWithTransport: 718350,
  },
  {
    year: 2016,
    exchangeRate: 3051,
    dailyWage: 22966,
    monthlyWage: 689455,
    annualVariation: 7,
    inflation: 5.75,
    usdEquivalent: 226,
    cop2020Equivalent: 812781,
    transportAllowance: 77700,
    totalWithTransport: 767155,
  },
  {
    year: 2017,
    exchangeRate: 2930,
    dailyWage: 24590.56,
    monthlyWage: 737717,
    annualVariation: 7,
    inflation: 4.09,
    usdEquivalent: 251,
    cop2020Equivalent: 822414,
    transportAllowance: 83140,
    totalWithTransport: 820857,
  },
  {
    year: 2018,
    exchangeRate: 3001,
    dailyWage: 26041,
    monthlyWage: 781242,
    annualVariation: 5.9,
    inflation: 3.18,
    usdEquivalent: 262,
    cop2020Equivalent: 836785,
    transportAllowance: 88211,
    totalWithTransport: 869453,
  },
  {
    year: 2019,
    exchangeRate: 3281,
    dailyWage: 27603,
    monthlyWage: 828116,
    annualVariation: 6,
    inflation: 3.8,
    usdEquivalent: 252,
    cop2020Equivalent: 859584,
    transportAllowance: 97032,
    totalWithTransport: 925148,
  },
  {
    year: 2020,
    exchangeRate: 3258,
    dailyWage: 29260,
    monthlyWage: 877803,
    annualVariation: 6,
    inflation: 1.61,
    usdEquivalent: 239,
    cop2020Equivalent: 877803,
    transportAllowance: 102854,
    totalWithTransport: 980657,
  },
  {
    year: 2021,
    exchangeRate: 3487,
    dailyWage: 30284,
    monthlyWage: 908526,
    annualVariation: 3.5,
    inflation: 3.47,
    usdEquivalent: 260,
    cop2020Equivalent: 0,
    transportAllowance: 106454,
    totalWithTransport: 1014980,
  },
  {
    year: 2022,
    exchangeRate: 4099,
    dailyWage: 33333,
    monthlyWage: 1000000,
    annualVariation: 10.07,
    inflation: 12.53,
    usdEquivalent: 242.93,
    cop2020Equivalent: 0,
    transportAllowance: 117172,
    totalWithTransport: 1117172,
  },
  {
    year: 2023,
    exchangeRate: 4000,
    dailyWage: 38666,
    monthlyWage: 1160000,
    annualVariation: 16,
    inflation: 13.12,
    usdEquivalent: 290,
    cop2020Equivalent: 0,
    transportAllowance: 140606,
    totalWithTransport: 1300606,
  },
  {
    year: 2024,
    exchangeRate: 3875,
    dailyWage: 43333,
    monthlyWage: 1300000,
    annualVariation: 12.07,
    inflation: 5.2,
    usdEquivalent: 335,
    cop2020Equivalent: 0,
    transportAllowance: 162000,
    totalWithTransport: 1462000,
  },
  {
    year: 2025,
    exchangeRate: 4121,
    dailyWage: 46800,
    monthlyWage: 1423500,
    annualVariation: 9.54,
    inflation: 5.1,
    usdEquivalent: 345.42,
    cop2020Equivalent: 0,
    transportAllowance: 200000,
    totalWithTransport: 1623500,
  },
]

function Inflacion() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [amount, setAmount] = useState<string>('1000000')
  const [years, setYears] = useState<string>('1')

  // Calcular tendencia usando regresión lineal simple (últimos 10 años)
  const calculateTrend = () => {
    const recentData = annualInflationData.slice(-10)
    const n = recentData.length

    if (n < 2) {
      const avgInflation =
        recentData.length > 0
          ? recentData.reduce((sum, d) => sum + d.value, 0) / recentData.length
          : 5.0
      return { slope: 0, intercept: avgInflation }
    }

    const x = recentData.map((_, i) => i)
    const y = recentData.map(d => d.value)

    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    return { slope, intercept }
  }

  // Predecir inflación futura basada en tendencia
  const predictInflation = (yearsAhead: number) => {
    const { slope, intercept } = calculateTrend()
    const recentDataLength = Math.min(10, annualInflationData.length)
    const predictedValue = intercept + slope * (recentDataLength + yearsAhead - 1)
    return Math.max(0, predictedValue)
  }

  // Calcular devaluación
  const calculateDevaluation = (initialAmount: number, yearsCount: number) => {
    let currentValue = initialAmount

    // Obtener los últimos N años de datos históricos
    const recentData = annualInflationData.slice(-yearsCount)

    if (recentData.length < yearsCount) {
      // Si no hay suficientes datos históricos, usar los disponibles y proyectar el resto
      recentData.forEach(data => {
        currentValue = currentValue / (1 + data.value / 100)
      })

      // Proyectar los años faltantes
      const remainingYears = yearsCount - recentData.length
      for (let i = 1; i <= remainingYears; i++) {
        const predictedInflation = predictInflation(i)
        currentValue = currentValue / (1 + predictedInflation / 100)
      }
    } else {
      // Usar datos históricos reales
      recentData.forEach(data => {
        currentValue = currentValue / (1 + data.value / 100)
      })
    }

    return {
      finalValue: currentValue,
      devaluation: initialAmount - currentValue,
      percentage: ((initialAmount - currentValue) / initialAmount) * 100,
    }
  }

  // Calcular resultados
  const devaluationResult = useMemo(() => {
    const amountNum = parseFloat(amount) || 0
    const yearsNum = parseInt(years) || 0

    if (amountNum <= 0 || yearsNum <= 0) {
      return null
    }

    return calculateDevaluation(amountNum, yearsNum)
  }, [amount, years])

  // Preparar datos para el gráfico (últimos 20 años + proyección)
  const chartData = useMemo(() => {
    const colors = getChartThemeColors()
    const labels: string[] = []
    const historicalValues: number[] = []
    const predictedValues: number[] = []

    // Mostrar solo los últimos 20 años para que el gráfico sea legible
    const recentYears = annualInflationData.slice(-20)

    // Datos históricos (últimos 20 años)
    recentYears.forEach(data => {
      labels.push(data.year.toString())
      historicalValues.push(data.value)
      predictedValues.push(NaN)
    })

    // Proyección futura (5 años)
    const { slope, intercept } = calculateTrend()
    const lastYear = annualInflationData[annualInflationData.length - 1].year
    const recentDataLength = Math.min(10, annualInflationData.length)
    for (let i = 1; i <= 5; i++) {
      const predicted = Math.max(0, intercept + slope * (recentDataLength + i - 1))
      labels.push((lastYear + i).toString())
      historicalValues.push(NaN)
      predictedValues.push(predicted)
    }

    return {
      labels,
      datasets: [
        {
          label: 'Inflación Anual Histórica (%)',
          data: historicalValues,
          borderColor: colors.dangerStroke,
          backgroundColor: colors.dangerFill,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: 'Proyección (Tendencia)',
          data: predictedValues,
          borderColor: colors.warningStroke,
          backgroundColor: colors.warningFill,
          fill: true,
          tension: 0.4,
          borderDash: [5, 5],
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    }
  }, [theme])

  const chartOptions = useMemo(
    () =>
      buildLineChartOptions({
        title: 'Inflación Anual (%) - La Calamidad',
        showTitle: true,
      }),
    [theme]
  )

  const salaryChartData = useMemo(() => {
    const colors = getChartThemeColors()
    return {
      labels: minimumWageData.map(d => d.year.toString()),
      datasets: [
        {
          label: 'Variación Salario Mínimo (%)',
          data: minimumWageData.map(d => d.annualVariation),
          borderColor: colors.successStroke,
          backgroundColor: colors.successFill,
          fill: true,
          tension: 0.4,
          yAxisID: 'y',
        },
        {
          label: 'Inflación Anual (%)',
          data: minimumWageData.map(d => d.inflation),
          borderColor: colors.dangerStroke,
          backgroundColor: colors.dangerFill,
          fill: true,
          tension: 0.4,
          yAxisID: 'y',
        },
      ],
    }
  }, [theme])

  const salaryChartOptions = useMemo(
    () =>
      buildLineChartOptions({
        tickFontSize: 10,
        rotateXTicks: true,
        yTickFormatter: value => `${value.toFixed(1)}%`,
      }),
    [theme]
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide crud-page-content inflacion-content">
        {/* Toolbar */}
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

        {/* Page Title */}
        <h1 className="app-page-title">Inflación</h1>
        <p className="inflacion-page-subtitle">
          Calculadora de devaluación y predictor de inflación
        </p>

        {/* Calculador de Devaluación */}
        <div className="inflacion-calculator">
          <h2 className="inflacion-section-title">Calculador de devaluación</h2>
          <div className="inflacion-calculator-inputs">
            <div className="inflacion-input-group">
              <label htmlFor="amount" className="inflacion-label">
                Monto inicial (COP)
              </label>
              <input
                type="number"
                id="amount"
                className="form-input-base"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="1000000"
                min="0"
                step="1000"
              />
            </div>
            <div className="inflacion-input-group">
              <label htmlFor="years" className="inflacion-label">
                Años
              </label>
              <input
                type="number"
                id="years"
                className="form-input-base"
                value={years}
                onChange={e => setYears(e.target.value)}
                placeholder="1"
                min="1"
                max="20"
              />
            </div>
          </div>

          {devaluationResult && (
            <div
              className="crud-summary-strip crud-summary-strip--danger"
              role="region"
              aria-label="Resultado de devaluación"
            >
              <div className="crud-summary-strip-item">
                <span className="crud-summary-strip-label">Valor inicial</span>
                <span className="crud-summary-strip-value crud-summary-strip-value--info">
                  {formatCurrency(parseFloat(amount))}
                </span>
              </div>
              <div className="crud-summary-strip-separator" aria-hidden="true" />
              <div className="crud-summary-strip-item">
                <span className="crud-summary-strip-label">
                  En {years} {years === '1' ? 'año' : 'años'}
                </span>
                <span className="crud-summary-strip-value crud-summary-strip-value--expense">
                  {formatCurrency(devaluationResult.finalValue)}
                </span>
              </div>
              <div className="crud-summary-strip-separator" aria-hidden="true" />
              <div className="crud-summary-strip-item crud-summary-strip-item--emphasis">
                <span className="crud-summary-strip-label">Pérdida</span>
                <span className="crud-summary-strip-value crud-summary-strip-value--expense">
                  {formatCurrency(devaluationResult.devaluation)} (
                  {devaluationResult.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Predictor de Inflación */}
        <div className="inflacion-predictor">
          <h2 className="inflacion-section-title">Predictor de inflación</h2>
          <p className="inflacion-predictor-description">
            Proyección basada en la tendencia histórica reciente:
          </p>
          <div
            className="crud-summary-strip"
            role="region"
            aria-label="Proyección de inflación"
          >
            {[1, 2, 3, 5].map((yearsAhead, index) => {
              const prediction = predictInflation(yearsAhead)
              return (
                <Fragment key={yearsAhead}>
                  {index > 0 && (
                    <div className="crud-summary-strip-separator" aria-hidden="true" />
                  )}
                  <div className="crud-summary-strip-item">
                    <span className="crud-summary-strip-label">
                      {yearsAhead === 1 ? '1 año' : `${yearsAhead} años`}
                    </span>
                    <span className="crud-summary-strip-value crud-summary-strip-value--expense">
                      {prediction.toFixed(1)}%
                    </span>
                  </div>
                </Fragment>
              )
            })}
          </div>
        </div>

        {/* Gráfico Histórico */}
        <div className="inflacion-chart-container">
          <div className="inflacion-chart-wrapper">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Mensaje editorial */}
        <div className="inflacion-warning">
          <div className="inflacion-warning-icon">
            <TrendingDownIcon />
          </div>
          <div className="inflacion-warning-content">
            <h2 className="inflacion-warning-title">El Monstruo de Jekyll Island</h2>
            <p className="inflacion-warning-text">
              &ldquo;La inflación es el impuesto más cruel, porque golpea a los que menos tienen. Es un
              robo silencioso que destruye el poder adquisitivo de tu dinero mientras duermes. El
              sistema bancario centralizado crea dinero de la nada, devaluando tu trabajo y tus
              ahorros día a día.&rdquo;
            </p>
            <p className="inflacion-warning-quote">
              &ldquo;No dejes que el monstruo te devore. Tu libertad financiera depende de tu capacidad
              para protegerte.&rdquo;
            </p>
          </div>
        </div>

        {/* Tips para combatir la inflación */}
        <div className="inflacion-tips">
          <h2 className="inflacion-section-title">Armas contra el monstruo</h2>
          <div className="inflacion-tips-grid">
            <div className="inflacion-tip-card">
              <div className="inflacion-tip-icon">💰</div>
              <h3 className="inflacion-tip-title">Invierte, No Ahorres</h3>
              <p className="inflacion-tip-description">
                El dinero bajo el colchón pierde valor cada día. Invierte en activos que se
                aprecien: acciones, bienes raíces, criptomonedas, o negocios propios.
              </p>
            </div>
            <div className="inflacion-tip-card">
              <div className="inflacion-tip-icon">🌍</div>
              <h3 className="inflacion-tip-title">Diversifica Geográficamente</h3>
              <p className="inflacion-tip-description">
                No pongas todos tus huevos en una canasta. Diversifica en diferentes monedas y
                países para protegerte de la devaluación local.
              </p>
            </div>
            <div className="inflacion-tip-card">
              <div className="inflacion-tip-icon">⚡</div>
              <h3 className="inflacion-tip-title">Activos Reales</h3>
              <p className="inflacion-tip-description">
                Prioriza activos tangibles: oro, plata, propiedades, o activos digitales escasos.
                Estos mantienen su valor cuando el dinero se devalúa.
              </p>
            </div>
            <div className="inflacion-tip-card">
              <div className="inflacion-tip-icon">📈</div>
              <h3 className="inflacion-tip-title">Educación Financiera</h3>
              <p className="inflacion-tip-description">
                Conoce cómo funciona el sistema. Lee sobre economía, finanzas y la historia del
                dinero. El conocimiento es tu mejor defensa.
              </p>
            </div>
            <div className="inflacion-tip-card">
              <div className="inflacion-tip-icon">🚫</div>
              <h3 className="inflacion-tip-title">Evita Deudas en Moneda Local</h3>
              <p className="inflacion-tip-description">
                Si debes, que sea en moneda estable o mejor aún, invierte en activos que se aprecien
                más rápido que la inflación.
              </p>
            </div>
            <div className="inflacion-tip-card">
              <div className="inflacion-tip-icon">💎</div>
              <h3 className="inflacion-tip-title">Bitcoin y Cripto</h3>
              <p className="inflacion-tip-description">
                Considera Bitcoin y otras criptomonedas como reserva de valor. Son escasas,
                descentralizadas y no pueden ser infladas por gobiernos.
              </p>
            </div>
            <div className="inflacion-tip-card">
              <div className="inflacion-tip-icon">🏠</div>
              <h3 className="inflacion-tip-title">Bienes Raíces</h3>
              <p className="inflacion-tip-description">
                Los inmuebles históricamente mantienen y aumentan su valor. Además, puedes generar
                ingresos pasivos con alquileres.
              </p>
            </div>
            <div className="inflacion-tip-card">
              <div className="inflacion-tip-icon">⚔️</div>
              <h3 className="inflacion-tip-title">Mantén el Combate</h3>
              <p className="inflacion-tip-description">
                La inflación es constante. Revisa y ajusta tu estrategia regularmente. No te
                relajes, el monstruo nunca duerme.
              </p>
            </div>
          </div>
        </div>

        {/* Sección Salario Mínimo */}
        <div className="inflacion-salary-section">
          <h2 className="inflacion-section-title">Salario Mínimo en Colombia</h2>
          <p className="inflacion-salary-description">
            La evolución del salario mínimo vs la inflación. ¿Realmente mantiene el poder
            adquisitivo?
          </p>

          {/* Estadísticas Recientes */}
          <div className="inflacion-salary-stats">
            {minimumWageData
              .filter(d => d.year >= 2020)
              .reverse()
              .map(data => {
                const annualInflation = annualInflationData.find(i => i.year === data.year)
                const realIncrease = annualInflation
                  ? data.annualVariation - annualInflation.value
                  : data.annualVariation
                return (
                  <div key={data.year} className="inflacion-salary-stat-card">
                    <div className="inflacion-salary-stat-year">{data.year}</div>
                    <div className="inflacion-salary-stat-amount">
                      {formatCurrency(data.totalWithTransport)}
                    </div>
                    <div className="inflacion-salary-stat-details">
                      <div className="inflacion-salary-stat-detail">
                        <span className="inflacion-salary-stat-label">Aumento:</span>
                        <span
                          className={`inflacion-salary-stat-value ${data.annualVariation > 0 ? 'positive' : 'negative'}`}
                        >
                          {data.annualVariation > 0 ? '+' : ''}
                          {data.annualVariation.toFixed(2)}%
                        </span>
                      </div>
                      <div className="inflacion-salary-stat-detail">
                        <span className="inflacion-salary-stat-label">Inflación:</span>
                        <span className="inflacion-salary-stat-value negative">
                          {annualInflation
                            ? annualInflation.value.toFixed(2)
                            : data.inflation.toFixed(2)}
                          %
                        </span>
                      </div>
                      <div className="inflacion-salary-stat-detail">
                        <span className="inflacion-salary-stat-label">Poder Adquisitivo Real:</span>
                        <span
                          className={`inflacion-salary-stat-value ${realIncrease > 0 ? 'positive' : 'negative'}`}
                        >
                          {realIncrease > 0 ? '+' : ''}
                          {realIncrease.toFixed(2)}%
                        </span>
                      </div>
                      <div className="inflacion-salary-stat-detail">
                        <span className="inflacion-salary-stat-label">Equivalencia USD:</span>
                        <span className="inflacion-salary-stat-value">
                          US${data.usdEquivalent.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>

          {/* Gráfico Comparativo Salario Mínimo vs Inflación */}
          <div className="inflacion-salary-chart-container">
            <h3 className="inflacion-subsection-title">
              Evolución del Salario Mínimo vs Inflación
            </h3>
            <div className="inflacion-salary-chart-wrapper">
              <Line data={salaryChartData} options={salaryChartOptions} />
            </div>
          </div>

          {/* Análisis de Poder Adquisitivo */}
          <div className="inflacion-purchasing-power">
            <h3 className="inflacion-subsection-title">Análisis de Poder Adquisitivo</h3>
            <div className="inflacion-purchasing-power-content">
              <p className="inflacion-analysis-text">
                El salario mínimo en Colombia ha aumentado nominalmente, pero cuando se compara con
                la inflación, el poder adquisitivo real ha tenido altibajos. En años donde el
                aumento del salario mínimo supera la inflación, los trabajadores ganan poder
                adquisitivo. Cuando la inflación supera el aumento salarial, pierden poder
                adquisitivo.
              </p>
              <div className="inflacion-purchasing-power-stats">
                <div className="inflacion-power-stat">
                  <div className="inflacion-power-stat-value">
                    {
                      minimumWageData.filter(d => {
                        const annualInflation = annualInflationData.find(i => i.year === d.year)
                        return annualInflation && d.annualVariation > annualInflation.value
                      }).length
                    }
                  </div>
                  <div className="inflacion-power-stat-label">
                    Años con ganancia de poder adquisitivo
                  </div>
                </div>
                <div className="inflacion-power-stat">
                  <div className="inflacion-power-stat-value">
                    {
                      minimumWageData.filter(d => {
                        const annualInflation = annualInflationData.find(i => i.year === d.year)
                        return annualInflation && d.annualVariation < annualInflation.value
                      }).length
                    }
                  </div>
                  <div className="inflacion-power-stat-label">
                    Años con pérdida de poder adquisitivo
                  </div>
                </div>
                <div className="inflacion-power-stat">
                  <div className="inflacion-power-stat-value">
                    {formatCurrency(
                      minimumWageData[minimumWageData.length - 1]?.totalWithTransport || 0
                    )}
                  </div>
                  <div className="inflacion-power-stat-label">Salario mínimo actual (2025)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Efecto del Salario Mínimo en la Economía */}
        <div className="inflacion-economics-section">
          <h2 className="inflacion-section-title">¿Quién Paga el Aumento del Salario Mínimo?</h2>
          <div className="inflacion-economics-content">
            <div className="inflacion-economics-warning">
              <div className="inflacion-economics-icon">⚠️</div>
              <div className="inflacion-economics-text">
                <p>
                  <strong>La realidad económica:</strong> Cuando el salario mínimo aumenta, los
                  costos de producción suben. Las empresas tienen dos opciones: reducir ganancias
                  (poco común) o trasladar los costos a los precios.
                </p>
                <p>
                  Este aumento de precios afecta a <strong>TODOS</strong> los consumidores,
                  incluyendo la clase media y alta que no se benefician directamente del aumento
                  salarial.
                </p>
              </div>
            </div>

            <div className="inflacion-economics-explanation">
              <h3 className="inflacion-subsection-title">El Efecto Cascada</h3>
              <div className="inflacion-economics-steps">
                <div className="inflacion-economics-step">
                  <div className="inflacion-economics-step-number">1</div>
                  <div className="inflacion-economics-step-content">
                    <h4>Gobierno aumenta salario mínimo</h4>
                    <p>
                      El salario mínimo sube, por ejemplo, 10%. Los trabajadores de salario mínimo
                      ganan más dinero.
                    </p>
                  </div>
                </div>
                <div className="inflacion-economics-step">
                  <div className="inflacion-economics-step-number">2</div>
                  <div className="inflacion-economics-step-content">
                    <h4>Empresas aumentan costos</h4>
                    <p>
                      Las empresas deben pagar más a sus empleados. Esto aumenta sus costos
                      operativos significativamente.
                    </p>
                  </div>
                </div>
                <div className="inflacion-economics-step">
                  <div className="inflacion-economics-step-number">3</div>
                  <div className="inflacion-economics-step-content">
                    <h4>Precios suben para todos</h4>
                    <p>
                      Para mantener márgenes de ganancia, las empresas suben los precios de sus
                      productos y servicios. Esto afecta a TODOS los consumidores.
                    </p>
                  </div>
                </div>
                <div className="inflacion-economics-step">
                  <div className="inflacion-economics-step-number">4</div>
                  <div className="inflacion-economics-step-content">
                    <h4>La clase media y alta pagan más</h4>
                    <p>
                      Quienes ganan más del salario mínimo no reciben aumento, pero pagan precios
                      más altos. Su poder adquisitivo disminuye.
                    </p>
                  </div>
                </div>
                <div className="inflacion-economics-step">
                  <div className="inflacion-economics-step-number">5</div>
                  <div className="inflacion-economics-step-content">
                    <h4>Espiral inflacionaria</h4>
                    <p>
                      Los trabajadores de clase media exigen aumentos para compensar. Esto genera
                      más inflación, y el ciclo se repite.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="inflacion-economics-conclusion">
              <h3 className="inflacion-subsection-title">La Paradoja</h3>
              <p className="inflacion-conclusion-text">
                El aumento del salario mínimo puede generar un efecto perverso: mientras intenta
                ayudar a los más vulnerables, termina generando inflación que afecta a toda la
                economía. Los trabajadores de salario mínimo pueden ver su poder adquisitivo
                mejorado temporalmente, pero si la inflación supera el aumento, todos pierden.
              </p>
              <p className="inflacion-conclusion-text">
                <strong>La solución real:</strong> No es aumentar salarios artificialmente, sino
                crear políticas que generen crecimiento económico real, productividad y competencia.
                Solo así se puede aumentar el poder adquisitivo sin generar inflación destructiva.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Inflacion
