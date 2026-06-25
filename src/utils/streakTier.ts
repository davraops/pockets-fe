export type StreakTier = 'none' | 'spark' | 'warm' | 'hot' | 'blaze' | 'legend'

export function getStreakTier(streak: number): StreakTier {
  if (streak <= 0) {
    return 'none'
  }
  if (streak >= 30) {
    return 'legend'
  }
  if (streak >= 14) {
    return 'blaze'
  }
  if (streak >= 7) {
    return 'hot'
  }
  if (streak >= 3) {
    return 'warm'
  }
  return 'spark'
}

export function getStreakTierLabel(tier: StreakTier): string | null {
  switch (tier) {
    case 'spark':
      return 'Arrancando'
    case 'warm':
      return 'En marcha'
    case 'hot':
      return 'En fuego'
    case 'blaze':
      return 'Imparable'
    case 'legend':
      return 'Leyenda'
    default:
      return null
  }
}

export function getStreakTierClassName(streak: number, baseClass = 'streak-tier'): string {
  const tier = getStreakTier(streak)
  if (tier === 'none') {
    return `${baseClass} ${baseClass}--none`
  }
  return `${baseClass} ${baseClass}--${tier}`
}

export function formatStreakTierTitle(streak: number, streakLabel: string): string {
  const tierLabel = getStreakTierLabel(getStreakTier(streak))
  return tierLabel ? `${tierLabel} · ${streakLabel}` : streakLabel
}
