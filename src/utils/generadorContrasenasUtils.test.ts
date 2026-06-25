import { describe, expect, it } from 'vitest'
import {
  buildPasswordCharset,
  calculatePasswordStrength,
  formatPasswordHistoryDate,
  generatePassword,
  hasSelectedCharset,
  maskPasswordPreview,
} from './generadorContrasenasUtils'

const defaultOptions = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeAmbiguous: true,
}

describe('generadorContrasenasUtils', () => {
  it('generatePassword returns null when charset is empty', () => {
    expect(
      generatePassword({
        ...defaultOptions,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
      })
    ).toBeNull()
  })

  it('generatePassword respects length and selected char types', () => {
    const password = generatePassword(defaultOptions)
    expect(password).not.toBeNull()
    expect(password).toHaveLength(16)
    expect(/[A-Z]/.test(password!)).toBe(true)
    expect(/[a-z]/.test(password!)).toBe(true)
    expect(/[0-9]/.test(password!)).toBe(true)
    expect(/[^a-zA-Z0-9]/.test(password!)).toBe(true)
  })

  it('buildPasswordCharset excludes ambiguous characters when enabled', () => {
    const charset = buildPasswordCharset(defaultOptions)
    expect(charset).not.toMatch(/[0O1lI]/)
  })

  it('hasSelectedCharset reflects options', () => {
    expect(hasSelectedCharset(defaultOptions)).toBe(true)
    expect(
      hasSelectedCharset({
        ...defaultOptions,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
      })
    ).toBe(false)
  })

  it('calculatePasswordStrength labels short passwords as weak', () => {
    expect(calculatePasswordStrength('abc')).toMatchObject({ label: 'Débil', tone: 'weak' })
  })

  it('formatPasswordHistoryDate returns relative labels', () => {
    const now = Date.parse('2026-06-23T12:00:00.000Z')
    expect(formatPasswordHistoryDate(now - 30_000, now)).toBe('Ahora')
    expect(formatPasswordHistoryDate(now - 5 * 60_000, now)).toBe('Hace 5 min')
  })

  it('maskPasswordPreview hides most characters', () => {
    expect(maskPasswordPreview('Ab12!xyz')).toBe('Ab12••••')
    expect(maskPasswordPreview('abc')).toBe('••••')
  })
})
