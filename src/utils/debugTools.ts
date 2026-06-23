import { api } from '../services/api'

/**
 * Menús y acciones de debug (demo data, utilidades de prueba).
 *
 * - Producción: solo el usuario `testuser`
 * - Desarrollo: habilitado por defecto; desactivar con `VITE_DEBUG_TOOLS=false`
 */
export function isDebugToolsEnabled(): boolean {
  if (import.meta.env.PROD) {
    return api.isTestUser()
  }
  if (import.meta.env.VITE_DEBUG_TOOLS === 'false') {
    return false
  }
  return true
}

/**
 * Acciones destructivas de debug (delete-all).
 * Solo permitidas en desarrollo local — nunca en builds de producción.
 */
export function isDestructiveDebugEnabled(): boolean {
  return import.meta.env.DEV
}

/** Guard para handlers de debug no destructivos. */
export function canRunDebugAction(): boolean {
  return isDebugToolsEnabled()
}

/** Guard para handlers delete-all y similares. */
export function canRunDestructiveDebugAction(): boolean {
  return isDestructiveDebugEnabled()
}

/** Logs de desarrollo — no-op en producción. */
export function devLog(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.log(...args)
  }
}

/** Warnings de desarrollo — no-op en producción. */
export function devWarn(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.warn(...args)
  }
}

/** Errores de desarrollo — no-op en producción. */
export function devError(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.error(...args)
  }
}
