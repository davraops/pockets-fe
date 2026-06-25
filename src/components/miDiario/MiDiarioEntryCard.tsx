import BookIcon from '@mui/icons-material/Book'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import {
  formatDiaryCardDay,
  formatDiaryCardExcerpt,
  formatDiaryCardMeta,
  formatDiaryCardMonth,
  formatDiaryCardWeekday,
  formatDiaryListTitle,
  getDiaryEntryRecencyLabel,
} from './miDiarioDisplayUtils'

export interface DiaryEntryCardModel {
  id: string
  entry_date: string
  content: string
}

interface MiDiarioEntryCardProps {
  entry: DiaryEntryCardModel
  onClick: () => void
}

function MiDiarioEntryCard({ entry, onClick }: MiDiarioEntryCardProps) {
  const title = formatDiaryListTitle(entry.content, entry.entry_date)
  const excerpt = formatDiaryCardExcerpt(entry.content)
  const recency = getDiaryEntryRecencyLabel(entry.entry_date)

  return (
    <button
      type="button"
      className={['midiario-entry-card', recency ? 'midiario-entry-card--recent' : '']
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      aria-label={`Ver entrada del ${formatDiaryCardWeekday(entry.entry_date)} ${formatDiaryCardDay(entry.entry_date)} de ${formatDiaryCardMonth(entry.entry_date)}`}
    >
      <div className="midiario-entry-card__date" aria-hidden="true">
        <span className="midiario-entry-card__day">{formatDiaryCardDay(entry.entry_date)}</span>
        <span className="midiario-entry-card__month">{formatDiaryCardMonth(entry.entry_date)}</span>
      </div>

      <div className="midiario-entry-card__body">
        <div className="midiario-entry-card__top">
          <div className="midiario-entry-card__heading">
            <BookIcon className="midiario-entry-card__icon" aria-hidden="true" />
            <h3 className="midiario-entry-card__title">{title}</h3>
          </div>
          {recency ? <span className="midiario-entry-card__badge">{recency}</span> : null}
        </div>

        <p className="midiario-entry-card__meta">
          {formatDiaryCardMeta(entry.entry_date, entry.content)}
        </p>

        {excerpt ? <p className="midiario-entry-card__excerpt">{excerpt}</p> : null}
      </div>

      <ChevronRightIcon className="midiario-entry-card__chevron" aria-hidden="true" />
    </button>
  )
}

export default MiDiarioEntryCard
