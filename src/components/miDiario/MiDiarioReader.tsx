import {
  formatDiaryCardDay,
  formatDiaryCardMeta,
  formatDiaryCardMonth,
  formatDiaryCardWeekday,
  formatDiaryDateLong,
} from './miDiarioDisplayUtils'

interface MiDiarioReaderProps {
  entryDate: string
  content: string
}

function MiDiarioReader({ entryDate, content }: MiDiarioReaderProps) {
  return (
    <article className="midiario-reader">
      <header className="midiario-reader__masthead">
        <div className="midiario-reader__date-badge" aria-hidden="true">
          <span className="midiario-reader__day">{formatDiaryCardDay(entryDate)}</span>
          <span className="midiario-reader__month">{formatDiaryCardMonth(entryDate)}</span>
        </div>
        <div className="midiario-reader__masthead-copy">
          <p className="midiario-reader__weekday">{formatDiaryCardWeekday(entryDate)}</p>
          <p className="midiario-reader__date-long">{formatDiaryDateLong(entryDate)}</p>
          <p className="midiario-reader__meta">{formatDiaryCardMeta(entryDate, content)}</p>
        </div>
      </header>
      <div className="midiario-reader__paper">
        <p className="midiario-reader__content">{content}</p>
      </div>
    </article>
  )
}

export default MiDiarioReader
