import type { RoutineFrequencyFilter } from './routineTypes'
import { formatRoutineFrequency } from './routineDisplayUtils'

export const ROUTINE_FREQUENCY_FILTERS: Array<{
  value: RoutineFrequencyFilter
  label: string
}> = [
  { value: 'all', label: 'Todas' },
  { value: 'daily', label: formatRoutineFrequency('daily') },
  { value: 'weekly', label: formatRoutineFrequency('weekly') },
  { value: 'monthly', label: formatRoutineFrequency('monthly') },
]

interface RutinaFrequencyFiltersProps {
  value: RoutineFrequencyFilter
  counts: Record<RoutineFrequencyFilter, number>
  onChange: (value: RoutineFrequencyFilter) => void
}

function RutinaFrequencyFilters({ value, counts, onChange }: RutinaFrequencyFiltersProps) {
  return (
    <div className="rutina-frequency-filters" role="tablist" aria-label="Filtrar por frecuencia">
      {ROUTINE_FREQUENCY_FILTERS.map(filter => {
        const count = counts[filter.value]
        if (filter.value !== 'all' && count === 0) {
          return null
        }

        return (
          <button
            key={filter.value}
            type="button"
            role="tab"
            className={`rutina-frequency-filter${value === filter.value ? ' rutina-frequency-filter--active' : ''}`}
            aria-selected={value === filter.value}
            onClick={() => onChange(filter.value)}
          >
            {filter.label}
            <span className="rutina-frequency-filter__count">{count}</span>
          </button>
        )
      })}
    </div>
  )
}

export default RutinaFrequencyFilters
