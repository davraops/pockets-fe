import type { ChartOptions } from 'chart.js'

const CHART_FONT =
  "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif"

function readCssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') {
    return fallback
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

export interface ChartThemeColors {
  dangerStroke: string
  dangerFill: string
  successStroke: string
  successFill: string
  warningStroke: string
  warningFill: string
  grid: string
  tick: string
  legend: string
  title: string
  tooltipBg: string
  tooltipTitle: string
  tooltipBody: string
  tooltipBorder: string
}

export function getChartThemeColors(): ChartThemeColors {
  return {
    dangerStroke: readCssVar('--chart-danger-stroke', 'rgba(255, 59, 48, 0.8)'),
    dangerFill: readCssVar('--chart-danger-fill', 'rgba(255, 59, 48, 0.1)'),
    successStroke: readCssVar('--chart-success-stroke', 'rgba(52, 199, 89, 0.8)'),
    successFill: readCssVar('--chart-success-fill', 'rgba(52, 199, 89, 0.1)'),
    warningStroke: readCssVar('--chart-warning-stroke', 'rgba(255, 149, 0, 0.8)'),
    warningFill: readCssVar('--chart-warning-fill', 'rgba(255, 149, 0, 0.1)'),
    grid: readCssVar('--chart-grid', 'rgba(255, 255, 255, 0.05)'),
    tick: readCssVar('--chart-tick', 'rgba(255, 255, 255, 0.7)'),
    legend: readCssVar('--chart-legend', 'rgba(255, 255, 255, 0.9)'),
    title: readCssVar('--chart-title', 'rgba(255, 255, 255, 0.95)'),
    tooltipBg: readCssVar('--chart-tooltip-bg', 'rgba(0, 0, 0, 0.8)'),
    tooltipTitle: readCssVar('--chart-tooltip-title', 'rgba(255, 255, 255, 0.9)'),
    tooltipBody: readCssVar('--chart-tooltip-body', 'rgba(255, 255, 255, 0.8)'),
    tooltipBorder: readCssVar('--chart-tooltip-border', 'rgba(255, 59, 48, 0.5)'),
  }
}

interface LineChartOptionsConfig {
  title?: string
  showTitle?: boolean
  tickFontSize?: number
  rotateXTicks?: boolean
  yTickFormatter?: (value: number) => string
  tooltipLabelFormatter?: (label: string, value: number) => string
}

export function buildLineChartOptions(config: LineChartOptionsConfig = {}): ChartOptions<'line'> {
  const colors = getChartThemeColors()
  const {
    title = '',
    showTitle = false,
    tickFontSize = 12,
    rotateXTicks = false,
    yTickFormatter = (value: number) => `${value}%`,
    tooltipLabelFormatter,
  } = config

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: colors.legend,
          font: { family: CHART_FONT, size: tickFontSize },
        },
      },
      title: {
        display: showTitle && Boolean(title),
        text: title,
        color: colors.title,
        font: { family: CHART_FONT, size: 18 },
      },
      tooltip: {
        backgroundColor: colors.tooltipBg,
        titleColor: colors.tooltipTitle,
        bodyColor: colors.tooltipBody,
        borderColor: colors.tooltipBorder,
        borderWidth: 1,
        callbacks: {
          label(context) {
            const datasetLabel = context.dataset.label || ''
            const value = context.parsed.y
            if (value === null || Number.isNaN(value)) {
              return datasetLabel
            }
            if (tooltipLabelFormatter) {
              return tooltipLabelFormatter(datasetLabel, value)
            }
            const prefix = datasetLabel ? `${datasetLabel}: ` : ''
            return `${prefix}${value.toFixed(2)}%`
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: colors.tick,
          font: { family: CHART_FONT, size: tickFontSize },
          maxRotation: rotateXTicks ? 45 : 0,
          minRotation: rotateXTicks ? 45 : 0,
        },
        grid: { color: colors.grid },
      },
      y: {
        ticks: {
          color: colors.tick,
          font: { family: CHART_FONT, size: tickFontSize },
          callback(value) {
            return yTickFormatter(Number(value))
          },
        },
        grid: { color: colors.grid },
      },
    },
  }
}
