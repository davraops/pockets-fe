/**
 * Traduce mensajes de error del backend (en inglés) al español
 */
export function translateError(errorMessage: string | undefined | null): string {
  if (!errorMessage) {
    return 'Ha ocurrido un error. Por favor, intenta de nuevo.'
  }

  const message = errorMessage.toLowerCase().trim()

  // Traducciones comunes de errores del backend
  const translations: Record<string, string> = {
    // Errores de autenticación
    'invalid password': 'Contraseña incorrecta',
    'invalid credentials': 'Credenciales incorrectas',
    unauthorized: 'No autorizado. Por favor, inicia sesión nuevamente.',
    forbidden: 'No tienes permiso para realizar esta acción.',
    'token expired': 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    'token invalid': 'Token inválido. Por favor, inicia sesión nuevamente.',

    // Errores de recursos
    'not found': 'Recurso no encontrado.',
    'secret not found': 'Secreto no encontrado.',
    'note not found': 'Nota no encontrada.',
    'cdt not found': 'CDT no encontrado.',
    'wallet not found': 'Billetera no encontrada.',
    'account not found': 'Cuenta no encontrada.',
    'transaction not found': 'Transacción no encontrada.',
    'debt not found': 'Deuda no encontrada.',
    'credit card not found': 'Tarjeta de crédito no encontrada.',
    'debit card not found': 'Tarjeta de débito no encontrada.',
    'subscription not found': 'Suscripción no encontrada.',
    'project not found': 'Proyecto no encontrado.',
    'budget not found': 'Presupuesto no encontrado.',

    // Errores de validación
    'bad request': 'Solicitud inválida. Por favor, verifica los datos ingresados.',
    'validation error': 'Error de validación. Por favor, verifica los datos ingresados.',
    'invalid input': 'Datos inválidos. Por favor, verifica la información ingresada.',
    'required field': 'Campo requerido faltante.',
    'invalid format': 'Formato inválido. Por favor, verifica el formato de los datos.',

    // Errores de servidor
    'internal server error': 'Error interno del servidor. Por favor, intenta más tarde.',
    'server error': 'Error del servidor. Por favor, intenta más tarde.',
    'service unavailable': 'Servicio no disponible. Por favor, intenta más tarde.',

    // Errores de conexión
    'connection error': 'Error de conexión. Por favor, verifica tu conexión a internet.',
    'network error': 'Error de red. Por favor, verifica tu conexión a internet.',
    timeout: 'Tiempo de espera agotado. Por favor, intenta de nuevo.',

    // Errores específicos de secretos
    'password required': 'Contraseña requerida para desencriptar el secreto.',
    'incorrect password': 'Contraseña incorrecta.',
    'secret value not found': 'No se pudo obtener el valor del secreto.',
    'secret access denied': 'Acceso denegado al secreto.',

    // Errores genéricos
    error: 'Ha ocurrido un error. Por favor, intenta de nuevo.',
    'unknown error': 'Error desconocido. Por favor, intenta de nuevo.',
    'error desconocido': 'Error desconocido. Por favor, intenta de nuevo.',
    'something went wrong': 'Algo salió mal. Por favor, intenta de nuevo.',
  }

  // Buscar traducción exacta
  if (translations[message]) {
    return translations[message]
  }

  // Buscar traducción parcial (contiene)
  for (const [key, translation] of Object.entries(translations)) {
    if (message.includes(key)) {
      return translation
    }
  }

  // Si no hay traducción, devolver el mensaje original
  // pero intentar capitalizar la primera letra
  return errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1)
}

/**
 * Extrae y traduce el mensaje de error de un objeto de error de la API
 */
export function getTranslatedErrorMessage(err: any, fallback: string): string {
  const errorMessage = err?.data?.error || err?.data?.message || err?.message || fallback
  return translateError(errorMessage)
}
