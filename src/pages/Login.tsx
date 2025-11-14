import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import LockIcon from '@mui/icons-material/Lock'
import { api } from '../services/api'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [formErrors, setFormErrors] = useState({
    username: '',
    password: '',
    general: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  // Si ya está autenticado, redirigir al home o a la página de origen
  useEffect(() => {
    if (api.isAuthenticated()) {
      const from = (location.state as any)?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [navigate, location])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    // Limpiar errores cuando el usuario empiece a escribir
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
        general: ''
      })
    }
  }

  const validateForm = (): boolean => {
    const errors = {
      username: '',
      password: '',
      general: ''
    }
    let isValid = true

    if (!formData.username.trim()) {
      errors.username = 'El usuario es requerido'
      isValid = false
    }

    if (!formData.password) {
      errors.password = 'La contraseña es requerida'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setFormErrors({ username: '', password: '', general: '' })

    try {
      const result = await api.login(formData.username.trim(), formData.password)
      
      if (result.token) {
        // El token ya se guarda automáticamente en el servicio API
        // Redirigir al home o a la página de origen
        const from = (location.state as any)?.from?.pathname || '/'
        navigate(from, { replace: true })
      } else {
        setFormErrors({
          username: '',
          password: '',
          general: 'Error al iniciar sesión. Por favor, intenta de nuevo.'
        })
      }
    } catch (err: any) {
      console.error('Error al iniciar sesión:', err)
      let errorMessage = 'Error al iniciar sesión. Por favor, verifica tus credenciales.'
      
      // Traducir mensajes de error comunes
      if (err.data?.error) {
        const error = err.data.error.toLowerCase()
        if (error.includes('invalid') || error.includes('incorrect') || error.includes('wrong')) {
          errorMessage = 'Usuario o contraseña incorrectos'
        } else if (error.includes('not found') || error.includes('no existe')) {
          errorMessage = 'Usuario no encontrado'
        } else if (error.includes('unauthorized') || error.includes('no autorizado')) {
          errorMessage = 'Credenciales inválidas'
        } else {
          errorMessage = err.data.error
        }
      } else if (err.data?.message) {
        const message = err.data.message.toLowerCase()
        if (message.includes('invalid') || message.includes('incorrect') || message.includes('wrong')) {
          errorMessage = 'Usuario o contraseña incorrectos'
        } else if (message.includes('not found') || message.includes('no existe')) {
          errorMessage = 'Usuario no encontrado'
        } else if (message.includes('unauthorized') || message.includes('no autorizado')) {
          errorMessage = 'Credenciales inválidas'
        } else {
          errorMessage = err.data.message
        }
      }
      
      setFormErrors({
        username: '',
        password: '',
        general: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <LockIcon />
          </div>
          <h1 className="login-title">Iniciar Sesión</h1>
          <p className="login-subtitle">Ingresa tus credenciales para continuar</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {formErrors.general && (
            <div className="login-error-general">
              {formErrors.general}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Ingresa tu usuario"
              className={formErrors.username ? 'input-error' : ''}
              disabled={isLoading}
              autoComplete="username"
              onInvalid={(e) => {
                e.preventDefault()
                const target = e.target as HTMLInputElement
                if (target.validity.valueMissing) {
                  setFormErrors(prev => ({
                    ...prev,
                    username: 'El usuario es requerido'
                  }))
                }
              }}
            />
            {formErrors.username && (
              <span className="error-message">{formErrors.username}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Ingresa tu contraseña"
              className={formErrors.password ? 'input-error' : ''}
              disabled={isLoading}
              autoComplete="current-password"
              onInvalid={(e) => {
                e.preventDefault()
                const target = e.target as HTMLInputElement
                if (target.validity.valueMissing) {
                  setFormErrors(prev => ({
                    ...prev,
                    password: 'La contraseña es requerida'
                  }))
                }
              }}
            />
            {formErrors.password && (
              <span className="error-message">{formErrors.password}</span>
            )}
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login

