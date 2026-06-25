export interface PasswordGeneratorOptions {
  length: number
  includeUppercase: boolean
  includeLowercase: boolean
  includeNumbers: boolean
  includeSymbols: boolean
  excludeAmbiguous: boolean
}

export interface PasswordStrength {
  level: number
  label: string
  tone: 'weak' | 'fair' | 'strong' | 'very-strong'
}

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const NUMBERS = '0123456789'
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'
const AMBIGUOUS = '0O1lI'

function filterAmbiguous(charset: string, excludeAmbiguous: boolean): string {
  if (!excludeAmbiguous) {
    return charset
  }
  return charset
    .split('')
    .filter(char => !AMBIGUOUS.includes(char))
    .join('')
}

function pickRandom(charset: string): string {
  return charset[Math.floor(Math.random() * charset.length)] ?? ''
}

function shuffle(value: string): string {
  const chars = value.split('')
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

export function buildPasswordCharset(options: PasswordGeneratorOptions): string {
  let charset = ''
  if (options.includeUppercase) charset += UPPERCASE
  if (options.includeLowercase) charset += LOWERCASE
  if (options.includeNumbers) charset += NUMBERS
  if (options.includeSymbols) charset += SYMBOLS
  return filterAmbiguous(charset, options.excludeAmbiguous)
}

export function hasSelectedCharset(options: PasswordGeneratorOptions): boolean {
  return buildPasswordCharset(options).length > 0
}

export function generatePassword(options: PasswordGeneratorOptions): string | null {
  const charset = buildPasswordCharset(options)
  if (charset.length === 0) {
    return null
  }

  let generated = ''

  if (options.includeUppercase) {
    generated += pickRandom(filterAmbiguous(UPPERCASE, options.excludeAmbiguous))
  }
  if (options.includeLowercase) {
    generated += pickRandom(filterAmbiguous(LOWERCASE, options.excludeAmbiguous))
  }
  if (options.includeNumbers) {
    generated += pickRandom(filterAmbiguous(NUMBERS, options.excludeAmbiguous))
  }
  if (options.includeSymbols) {
    generated += pickRandom(SYMBOLS)
  }

  const charsetArray = charset.split('')
  while (generated.length < options.length) {
    generated += charsetArray[Math.floor(Math.random() * charsetArray.length)]
  }

  return shuffle(generated.slice(0, options.length))
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { level: 0, label: '', tone: 'weak' }
  }

  let strength = 0

  if (password.length >= 8) strength += 1
  if (password.length >= 12) strength += 1
  if (password.length >= 16) strength += 1
  if (password.length >= 20) strength += 1

  if (/[a-z]/.test(password)) strength += 1
  if (/[A-Z]/.test(password)) strength += 1
  if (/[0-9]/.test(password)) strength += 1
  if (/[^a-zA-Z0-9]/.test(password)) strength += 1

  const uniqueChars = new Set(password).size
  if (uniqueChars / password.length > 0.5) strength += 1

  if (strength <= 2) return { level: 1, label: 'Débil', tone: 'weak' }
  if (strength <= 4) return { level: 2, label: 'Media', tone: 'fair' }
  if (strength <= 6) return { level: 3, label: 'Fuerte', tone: 'strong' }
  return { level: 4, label: 'Muy fuerte', tone: 'very-strong' }
}

export function formatPasswordHistoryDate(timestamp: number, now = Date.now()): string {
  const date = new Date(timestamp)
  const diff = now - date.getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Hace ${days} d`
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export function maskPasswordPreview(password: string): string {
  if (password.length <= 4) {
    return '••••'
  }
  return `${password.slice(0, 4)}${'•'.repeat(Math.min(password.length - 4, 12))}`
}
