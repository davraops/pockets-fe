import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import './StatusBar.css'

const routeTitles: Record<string, string> = {
  '/finanzas': 'Finanzas',
  '/finanzas/cuentas': 'Cuentas',
  '/finanzas/presupuestos': 'Presupuestos',
  '/finanzas/transacciones': 'Transacciones',
  '/finanzas/deudas': 'Deudas',
  '/finanzas/tarjetas-debito': 'Tarjetas Débito',
  '/finanzas/subscripciones': 'Subscripciones',
  '/finanzas/tarjetas-credito': 'Tarjetas Crédito',
  '/finanzas/proyectos': 'Proyectos',
  '/blank-2': '',
  '/blank-3': '',
  '/blank-4': '',
  '/blank-5': '',
  '/blank-6': '',
  '/blank-7': '',
  '/blank-8': '',
  '/blank-9': '',
  '/blank-10': '',
  '/blank-11': '',
  '/blank-12': '',
}

function StatusBar() {
  const [time, setTime] = useState(new Date())
  const location = useLocation()
  const currentTitle = routeTitles[location.pathname] || ''

  // Actualizar el título del documento
  useEffect(() => {
    if (currentTitle && currentTitle.trim() !== '') {
      document.title = `Pockets - ${currentTitle}`
    } else if (location.pathname === '/') {
      document.title = 'Pockets'
    } else if (location.pathname === '/login') {
      document.title = 'Pockets - Iniciar Sesión'
    } else {
      document.title = 'Pockets'
    }
  }, [location.pathname, currentTitle])

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const isHome = location.pathname === '/'
  const isLogin = location.pathname === '/login'
  // Mostrar el título si no estamos en home y hay un título definido (no vacío)
  const hasTitle = currentTitle && currentTitle.trim() !== ''

  // No mostrar el StatusBar en la página de login
  if (isLogin) {
    return null
  }

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <span className="status-bar-date">{formatDate(time)}</span>
        {!isHome && hasTitle && (
          <>
            <span className="status-bar-separator">•</span>
            <span className="status-bar-title">{currentTitle}</span>
          </>
        )}
      </div>
      <div className="status-bar-right">
        <span className="status-bar-time">{formatTime(time)}</span>
      </div>
    </div>
  )
}

export default StatusBar

