import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import {
  formatStreakTierTitle,
  getStreakTierClassName,
} from '../../utils/streakTier'

interface StreakTierBadgeProps {
  streak: number
  label: string
  compactLabel?: string | null
  variant?: 'badge' | 'value'
  className?: string
  showIcon?: boolean
}

function StreakTierBadge({
  streak,
  label,
  compactLabel = null,
  variant = 'badge',
  className = '',
  showIcon = true,
}: StreakTierBadgeProps) {
  const tierClass = getStreakTierClassName(streak, 'streak-tier')
  const displayLabel = variant === 'badge' ? (compactLabel ?? label) : label
  const title = formatStreakTierTitle(streak, label)

  if (streak <= 0 && variant === 'badge') {
    return (
      <span
        className={`${tierClass} streak-tier--${variant} streak-tier--none ${className}`.trim()}
        title={title}
      >
        {label}
      </span>
    )
  }

  return (
    <span
      className={`${tierClass} streak-tier--${variant} ${className}`.trim()}
      title={title}
    >
      {showIcon && variant === 'badge' ? (
        <LocalFireDepartmentIcon className="streak-tier__icon" aria-hidden="true" />
      ) : null}
      {displayLabel}
    </span>
  )
}

export default StreakTierBadge
