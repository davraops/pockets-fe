import type { ReactNode } from 'react'
import type { CrudSummaryItem } from './crudSummaryTypes'

interface CrudSummaryStripProps {
  ariaLabel: string
  items: CrudSummaryItem[]
  stripClassName?: string
}

function CrudSummaryStrip({ ariaLabel, items, stripClassName }: CrudSummaryStripProps) {
  const nodes: ReactNode[] = []

  items.forEach((item, index) => {
    if (index > 0) {
      nodes.push(
        <div
          key={`${item.label}-separator`}
          className="crud-summary-strip-separator"
          aria-hidden="true"
        />
      )
    }

    nodes.push(
      <div
        key={item.label}
        className={`crud-summary-strip-item${item.emphasis ? ' crud-summary-strip-item--emphasis' : ''}`}
      >
        <span className="crud-summary-strip-label">{item.label}</span>
        <span
          className={`crud-summary-strip-value crud-summary-strip-value--${item.tone ?? 'info'}`}
        >
          {item.value}
        </span>
      </div>
    )
  })

  return (
    <div
      className={`crud-summary-strip${stripClassName ? ` ${stripClassName}` : ''}`}
      role="region"
      aria-label={ariaLabel}
    >
      {nodes}
    </div>
  )
}

export default CrudSummaryStrip
export type { CrudSummaryItem, CrudSummaryTone } from './crudSummaryTypes'
