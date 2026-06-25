import { useEffect, useMemo, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import {
  ACTIVITY_STATUS_LABELS,
  type ActivityStatus,
  type ClientActivity,
} from './activityTypes'
import {
  addManualTimeLog,
  computeActivityMetrics,
  formatDurationMinutes,
  getStatusDurations,
} from './activityMetricsUtils'

interface ActividadMetricsPanelProps {
  activity: ClientActivity
  onAddManualLog: (minutes: number, note?: string) => void
}

function ActividadMetricsPanel({ activity, onAddManualLog }: ActividadMetricsPanelProps) {
  const [manualMinutes, setManualMinutes] = useState('30')
  const [manualNote, setManualNote] = useState('')
  const [now, setNow] = useState(Date.now())

  const isTimerRunning = Boolean(activity.data.activeTimerStartedAt)

  useEffect(() => {
    const intervalMs = isTimerRunning ? 1000 : 30000
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [isTimerRunning])

  const metrics = useMemo(() => computeActivityMetrics(activity, now), [activity, now])
  const statusDurations = useMemo(
    () => getStatusDurations(activity.data, activity.created_at, now),
    [activity, activity.created_at, now]
  )

  const handleAddManual = () => {
    const minutes = Number.parseInt(manualMinutes, 10)
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return
    }
    onAddManualLog(minutes, manualNote)
    setManualNote('')
  }

  return (
    <section className="actividad-metrics-panel" aria-labelledby="actividad-metrics-heading">
      <h3 id="actividad-metrics-heading" className="actividad-metrics-title">
        Tiempos y métricas
      </h3>

      <div className="actividad-metrics-grid">
        <div className="actividad-metrics-stat">
          <span className="actividad-metrics-label">Tiempo trabajado</span>
          <span className="actividad-metrics-value">{formatDurationMinutes(metrics.loggedMinutes)}</span>
        </div>
        <div className="actividad-metrics-stat">
          <span className="actividad-metrics-label">Desde creación</span>
          <span className="actividad-metrics-value">{formatDurationMinutes(metrics.leadTimeMinutes)}</span>
        </div>
        <div className="actividad-metrics-stat">
          <span className="actividad-metrics-label">En estado actual</span>
          <span className="actividad-metrics-value">{formatDurationMinutes(metrics.inStatusMinutes)}</span>
        </div>
        <div className="actividad-metrics-stat">
          <span className="actividad-metrics-label">Cronómetro</span>
          <span className="actividad-metrics-value">
            {metrics.isTimerRunning ? 'En curso' : 'Detenido'}
          </span>
        </div>
      </div>

      {statusDurations.length > 0 && (
        <div className="actividad-metrics-breakdown">
          <h4 className="actividad-metrics-subtitle">Tiempo por estado</h4>
          <ul className="actividad-metrics-list">
            {statusDurations.map(row => (
              <li key={row.status}>
                <span>{ACTIVITY_STATUS_LABELS[row.status as ActivityStatus]}</span>
                <span>{formatDurationMinutes(row.minutes)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(activity.data.timeLogs ?? []).length > 0 && (
        <div className="actividad-metrics-breakdown">
          <h4 className="actividad-metrics-subtitle">Registros de tiempo</h4>
          <ul className="actividad-metrics-list">
            {[...(activity.data.timeLogs ?? [])]
              .slice()
              .reverse()
              .map(log => (
                <li key={log.id}>
                  <span>
                    {new Date(log.startedAt).toLocaleString('es-CO', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {log.note ? ` · ${log.note}` : ''}
                  </span>
                  <span>{formatDurationMinutes(log.minutes)}</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="actividad-metrics-manual">
        <h4 className="actividad-metrics-subtitle">Registrar tiempo manual</h4>
        <div className="actividad-metrics-manual-row">
          <input
            type="number"
            min={1}
            step={1}
            className="form-input-base"
            value={manualMinutes}
            onChange={event => setManualMinutes(event.target.value)}
            aria-label="Minutos trabajados"
          />
          <input
            type="text"
            className="form-input-base"
            value={manualNote}
            onChange={event => setManualNote(event.target.value)}
            placeholder="Nota opcional"
            aria-label="Nota del registro"
          />
          <button
            type="button"
            className="btn-base btn-secondary actividad-metrics-add-button"
            onClick={handleAddManual}
          >
            <AddIcon aria-hidden="true" />
            Añadir
          </button>
        </div>
      </div>
    </section>
  )
}

export default ActividadMetricsPanel
