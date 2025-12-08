import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import NotificationsIcon from '@mui/icons-material/Notifications'
import ThemeToggle from './ThemeToggle'
import { api } from '../services/api'
import './StatusBar.css'

const routeTitles: Record<string, string> = {
  '/finanzas': 'Finanzas',
  '/finanzas/cuentas': 'Cuentas',
  '/finanzas/presupuestos': 'Presupuestos',
  '/finanzas/diseñador-presupuestos': 'Diseñador de Presupuestos',
  '/finanzas/listas-mercado': 'Listas de Mercado',
  '/finanzas/crypto-vendors': 'Vendedores de Cripto',
  '/finanzas/transacciones': 'Transacciones',
  '/finanzas/deudas': 'Deudas',
  '/finanzas/tarjetas-debito': 'Tarjetas Débito',
  '/finanzas/subscripciones': 'Subscripciones',
  '/finanzas/tarjetas-credito': 'Tarjetas Crédito',
  '/finanzas/proyectos': 'Proyectos',
  '/finanzas/me-deben': 'Me Deben',
  '/registros': 'Utilidades',
  '/registros/cuadernos': 'Cuadernos',
  '/registros/secretos': 'Secretos',
  '/registros/generador-contrasenas': 'Generador de Contraseñas',
  '/registros/calculadora': 'Calculadora',
  '/registros/archivos': 'Archivos',
  '/registros/empleados': 'Empleados',
  '/registros/vehiculos': 'Vehículos',
  '/registros/patrimonio': 'Patrimonio',
  '/tiempo': 'Lifestyle',
  '/tiempo/fechas': 'Fechas',
  '/tiempo/rutinas': 'Rutinas',
  '/tiempo/mi-dia': 'Mi Día',
  '/tiempo/mi-diario': 'Mi Diario',
  '/notificaciones': 'Notificaciones',
  '/justicia': 'Justicia',
  '/justicia/procesos': 'Procesos',
  '/trabajo': 'Trabajo',
  '/trabajo/contratos': 'Contratos',
  '/trabajo/actividades': 'Actividades',
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
  const [unreadCount, setUnreadCount] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()
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

  // Cargar notificaciones no leídas
  useEffect(() => {
    const loadUnreadNotifications = async () => {
      try {
        const response = await api.getNotifications()
        // Usar unread_count de la respuesta (total de no leídas del usuario)
        if (response.unread_count !== undefined) {
          setUnreadCount(response.unread_count)
        } else if (response.notifications && Array.isArray(response.notifications)) {
          // Fallback: calcular localmente si unread_count no está disponible
          setUnreadCount(response.notifications.filter((n: any) => !n.is_read).length)
        } else {
          setUnreadCount(0)
        }
      } catch (err) {
        // Silenciar errores, no es crítico si falla
        setUnreadCount(0)
      }
    }

    loadUnreadNotifications()
    // Actualizar cada 30 segundos
    const interval = setInterval(loadUnreadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
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
        <button
          className={`status-bar-notification-button ${!isHome ? 'status-bar-notification-mobile-hide' : ''}`}
          onClick={() => navigate('/notificaciones')}
          aria-label={`Notificaciones${unreadCount > 0 ? `. ${unreadCount} no leídas` : ''}`}
          type="button"
        >
          <NotificationsIcon className="status-bar-notification-icon" />
          {unreadCount > 0 && (
            <span
              className="status-bar-notification-badge"
              aria-label={`${unreadCount} notificaciones no leídas`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
        <div className="status-bar-theme-wrapper">
          <ThemeToggle />
        </div>
        <span className="status-bar-time">{formatTime(time)}</span>
      </div>
    </div>
  )
}

export default StatusBar
