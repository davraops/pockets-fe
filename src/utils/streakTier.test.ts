import { describe, expect, it } from 'vitest'
import {
  formatStreakTierTitle,
  getStreakTier,
  getStreakTierClassName,
  getStreakTierLabel,
} from './streakTier'

describe('streakTier', () => {
  it('maps streak counts to tiers', () => {
    expect(getStreakTier(0)).toBe('none')
    expect(getStreakTier(1)).toBe('spark')
    expect(getStreakTier(2)).toBe('spark')
    expect(getStreakTier(3)).toBe('warm')
    expect(getStreakTier(6)).toBe('warm')
    expect(getStreakTier(7)).toBe('hot')
    expect(getStreakTier(13)).toBe('hot')
    expect(getStreakTier(14)).toBe('blaze')
    expect(getStreakTier(29)).toBe('blaze')
    expect(getStreakTier(30)).toBe('legend')
    expect(getStreakTier(100)).toBe('legend')
  })

  it('builds tier class names and labels', () => {
    expect(getStreakTierClassName(8)).toBe('streak-tier streak-tier--hot')
    expect(getStreakTierLabel('hot')).toBe('En fuego')
    expect(formatStreakTierTitle(8, '8 días')).toBe('En fuego · 8 días')
  })
})
