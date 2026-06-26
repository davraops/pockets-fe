import { Fragment, type ReactNode } from 'react'
import ListSkeleton from '../ListSkeleton'

interface CrudListPanelProps<T> {
  items: T[]
  isLoading: boolean
  error: string | null
  onRetry: () => void
  retryAriaLabel: string
  loadingAriaLabel: string
  skeletonCount?: number
  emptyIcon: ReactNode
  emptyTitle: string
  emptySubtext: string
  getItemKey: (item: T) => string
  renderItem?: (item: T) => ReactNode
  renderBody?: () => ReactNode
  listOuterClassName?: string
  loadingListClassName?: string
}

function CrudListPanel<T>({
  items,
  isLoading,
  error,
  onRetry,
  retryAriaLabel,
  loadingAriaLabel,
  skeletonCount = 4,
  emptyIcon,
  emptyTitle,
  emptySubtext,
  getItemKey,
  renderItem,
  renderBody,
  listOuterClassName,
  loadingListClassName,
}: CrudListPanelProps<T>) {
  if (isLoading && items.length === 0) {
    return (
      <div className={loadingListClassName ?? 'glass-group'}>
        <ListSkeleton variant="inset-row" count={skeletonCount} aria-label={loadingAriaLabel} />
      </div>
    )
  }

  if (error && items.length === 0) {
    return (
      <div className="loader-container">
        <div className="loader finanzas-stats-error-panel">
          <p className="loader-text loader-text--error" role="alert">
            {error}
          </p>
          <button
            type="button"
            className="btn-base btn-secondary btn-retry"
            onClick={onRetry}
            aria-label={retryAriaLabel}
          >
            <span>Reintentar</span>
          </button>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="empty-state">
        {emptyIcon}
        <p className="empty-text">{emptyTitle}</p>
        <p className="empty-subtext">{emptySubtext}</p>
      </div>
    )
  }

  const listContent = renderBody ? (
    renderBody()
  ) : (
    <div className="glass-group">
      {items.map(item => (
        <Fragment key={getItemKey(item)}>{renderItem?.(item)}</Fragment>
      ))}
    </div>
  )

  return listOuterClassName ? (
    <div className={listOuterClassName}>{listContent}</div>
  ) : (
    listContent
  )
}

export default CrudListPanel
