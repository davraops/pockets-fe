interface MiDiarioCardSkeletonProps {
  count?: number
}

function MiDiarioCardSkeleton({ count = 3 }: MiDiarioCardSkeletonProps) {
  return (
    <div className="midiario-card-list" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="midiario-entry-card midiario-entry-card--skeleton">
          <div className="midiario-entry-card__date midiario-skeleton-block" />
          <div className="midiario-entry-card__body">
            <div className="midiario-skeleton-line midiario-skeleton-line--title" />
            <div className="midiario-skeleton-line midiario-skeleton-line--meta" />
            <div className="midiario-skeleton-line midiario-skeleton-line--excerpt" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default MiDiarioCardSkeleton
