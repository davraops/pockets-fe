import CreateIcon from '@mui/icons-material/Create'
import type { DiaryEntryCardModel } from './MiDiarioEntryCard'

interface MiDiarioTodayPanelProps {
  todayEntry: DiaryEntryCardModel | null
  streakMessage: string
  onWriteToday: () => void
  onOpenEntry: (entry: DiaryEntryCardModel) => void
}

function MiDiarioTodayPanel({
  todayEntry,
  streakMessage,
  onWriteToday,
  onOpenEntry,
}: MiDiarioTodayPanelProps) {
  if (todayEntry) {
    return (
      <section className="midiario-today-panel" aria-label="Entrada de hoy">
        <div className="midiario-today-panel__header">
          <span className="midiario-today-panel__eyebrow">Entrada de hoy</span>
          <p className="midiario-today-panel__message">{streakMessage}</p>
        </div>
        <button
          type="button"
          className="midiario-today-panel__entry"
          onClick={() => onOpenEntry(todayEntry)}
        >
          <span className="midiario-today-panel__entry-label">Continuar leyendo</span>
          <span className="midiario-today-panel__entry-title">
            {todayEntry.content.trim().split('\n').find(line => line.trim())?.trim() ||
              'Entrada de hoy'}
          </span>
        </button>
      </section>
    )
  }

  return (
    <section className="midiario-today-panel midiario-today-panel--prompt" aria-label="Escribir hoy">
      <div className="midiario-today-panel__prompt-copy">
        <CreateIcon className="midiario-today-panel__prompt-icon" aria-hidden="true" />
        <div>
          <h2 className="midiario-today-panel__prompt-title">¿Cómo va tu día?</h2>
          <p className="midiario-today-panel__message">{streakMessage}</p>
        </div>
      </div>
      <button
        type="button"
        className="btn-base btn-accent midiario-today-panel__cta"
        onClick={onWriteToday}
      >
        Escribir ahora
      </button>
    </section>
  )
}

export default MiDiarioTodayPanel
