interface ListSkeletonProps {
  variant: 'inset-row' | 'hub-row' | 'summary-card'
  count?: number
  className?: string
  'aria-label'?: string
}

function SkeletonBlock({ className }: { className?: string }) {
  return <span className={`skeleton-block${className ? ` ${className}` : ''}`} />
}

function InsetRowSkeleton() {
  return (
    <div className="skeleton-item skeleton-inset-row">
      <div className="skeleton-inset-row-content">
        <div className="skeleton-inset-row-main">
          <SkeletonBlock className="skeleton-line skeleton-line-title" />
          <SkeletonBlock className="skeleton-line skeleton-line-balance" />
        </div>
        <SkeletonBlock className="skeleton-line skeleton-line-subtitle" />
      </div>
      <SkeletonBlock className="skeleton-chevron" />
    </div>
  )
}

function HubRowSkeleton() {
  return (
    <div className="skeleton-item skeleton-hub-row">
      <SkeletonBlock className="skeleton-icon" />
      <div className="skeleton-hub-row-text">
        <SkeletonBlock className="skeleton-line skeleton-line-title" />
        <SkeletonBlock className="skeleton-line skeleton-line-subtitle" />
      </div>
      <SkeletonBlock className="skeleton-chevron" />
    </div>
  )
}

function SummaryCardSkeleton() {
  return (
    <div className="skeleton-item skeleton-summary-card">
      <SkeletonBlock className="skeleton-icon skeleton-icon-lg" />
      <div className="skeleton-summary-card-text">
        <SkeletonBlock className="skeleton-line skeleton-line-label" />
        <SkeletonBlock className="skeleton-line skeleton-line-value" />
      </div>
    </div>
  )
}

const VARIANT_COMPONENTS = {
  'inset-row': InsetRowSkeleton,
  'hub-row': HubRowSkeleton,
  'summary-card': SummaryCardSkeleton,
} as const

function ListSkeleton({
  variant,
  count = 5,
  className,
  'aria-label': ariaLabel = 'Cargando contenido',
}: ListSkeletonProps) {
  const Item = VARIANT_COMPONENTS[variant]

  return (
    <div
      className={`skeleton-list skeleton-list-${variant}${className ? ` ${className}` : ''}`}
      aria-busy="true"
      aria-label={ariaLabel}
      role="status"
    >
      {Array.from({ length: count }, (_, index) => (
        <Item key={index} />
      ))}
    </div>
  )
}

export default ListSkeleton
