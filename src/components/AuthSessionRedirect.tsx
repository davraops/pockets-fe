import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Redirects to login when the API clears the session after a 401.
 */
function AuthSessionRedirect() {
  const navigate = useNavigate()
  const location = useLocation()
  const locationRef = useRef(location)

  locationRef.current = location

  useEffect(() => {
    const handleUnauthorized = () => {
      const current = locationRef.current
      if (current.pathname === '/login') {
        return
      }
      navigate('/login', { state: { from: current }, replace: true })
    }

    window.addEventListener('pockets:auth-unauthorized', handleUnauthorized)
    return () => window.removeEventListener('pockets:auth-unauthorized', handleUnauthorized)
  }, [navigate])

  return null
}

export default AuthSessionRedirect
