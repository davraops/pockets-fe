import { useState, useEffect } from 'react'
import ThemeToggle from './ThemeToggle'
import './Footer.css'

function Footer() {
  const [time, setTime] = useState(new Date())

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

  return (
    <footer className="app-footer">
      {/* Mobile: StatusBar content integrated */}
      <div className="footer-status-mobile">
        <div className="footer-status-center">
          <span className="footer-status-date">{formatDate(time)}</span>
          <span className="footer-status-separator">•</span>
          <span className="footer-status-time">{formatTime(time)}</span>
        </div>
        <div className="footer-status-theme">
          <ThemeToggle />
        </div>
      </div>

      {/* Footer text */}
      <p className="footer-text">
        pockets by <strong>Rafael Avella</strong> 2025
      </p>
    </footer>
  )
}

export default Footer
