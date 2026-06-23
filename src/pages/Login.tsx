import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import ThemeToggle from '../components/ThemeToggle'
import { api } from '../services/api'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import { devError } from '../utils/debugTools'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [formErrors, setFormErrors] = useState({
    username: '',
    password: '',
    general: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (api.isAuthenticated()) {
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'
      navigate(from, { replace: true })
      return
    }
    usernameRef.current?.focus()
  }, [navigate, location])

  useEffect(() => {
    if (formErrors.general) {
      errorRef.current?.focus()
    }
  }, [formErrors.general])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
        general: '',
      })
    }
  }

  const handleFieldFocus = (fieldName: string, target: HTMLInputElement) => {
    setFocusedField(fieldName)
    if (window.matchMedia('(max-width: 768px)').matches) {
      queueMicrotask(() => {
        target.scrollIntoView({ block: 'center', behavior: 'smooth' })
      })
    }
  }

  const handleBlur = () => {
    setFocusedField(null)
  }

  const focusFirstInvalidField = (errors: { username: string; password: string }) => {
    if (errors.username) {
      usernameRef.current?.focus()
    } else if (errors.password) {
      passwordRef.current?.focus()
    }
  }

  const validateForm = (): boolean => {
    const errors = {
      username: '',
      password: '',
      general: '',
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
    if (!isValid) {
      queueMicrotask(() => focusFirstInvalidField(errors))
    }
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
        const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'
        navigate(from, { replace: true })
      } else {
        setFormErrors({
          username: '',
          password: '',
          general: 'Error al iniciar sesión. Por favor, intenta de nuevo.',
        })
      }
    } catch (err: unknown) {
      devError('Error al iniciar sesión:', err)
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al iniciar sesión. Por favor, verifica tus credenciales.'
      )

      setFormErrors({
        username: '',
        password: '',
        general: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const wrapperClass = (field: string, hasError: boolean) =>
    [
      'form-input-wrapper',
      field === 'password' ? 'password-input-wrapper' : '',
      focusedField === field ? 'is-focused' : '',
      hasError ? 'is-error' : '',
    ]
      .filter(Boolean)
      .join(' ')

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <header className="auth-card-header">
          <h1 className="auth-card-title">
            <span className="auth-card-title-brand">Pockets</span>
            <span className="auth-card-title-sep" aria-hidden="true">
              —
            </span>
            Iniciar sesión
          </h1>
        </header>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {formErrors.general && (
            <div
              ref={errorRef}
              className="form-alert-banner"
              role="alert"
              aria-live="polite"
              tabIndex={-1}
            >
              {formErrors.general}
            </div>
          )}

          <div className="form-group-base">
            <label htmlFor="username" className="form-label-base form-label-base--comfortable">
              Usuario
            </label>
            <div className={wrapperClass('username', !!formErrors.username)}>
              <input
                ref={usernameRef}
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onFocus={e => handleFieldFocus('username', e.currentTarget)}
                onBlur={handleBlur}
                required
                className={`form-input-base form-input-base--comfortable${formErrors.username ? ' input-error' : ''}`}
                disabled={isLoading}
                autoComplete="username"
                aria-invalid={!!formErrors.username}
                aria-describedby={formErrors.username ? 'username-error' : undefined}
                onInvalid={e => {
                  e.preventDefault()
                  const target = e.target as HTMLInputElement
                  if (target.validity.valueMissing) {
                    setFormErrors(prev => ({
                      ...prev,
                      username: 'El usuario es requerido',
                    }))
                  }
                }}
              />
            </div>
            {formErrors.username && (
              <span className="error-message error-message--comfortable" id="username-error" role="alert">
                {formErrors.username}
              </span>
            )}
          </div>

          <div className="form-group-base">
            <label htmlFor="password" className="form-label-base form-label-base--comfortable">
              Contraseña
            </label>
            <div className={wrapperClass('password', !!formErrors.password)}>
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={e => handleFieldFocus('password', e.currentTarget)}
                onBlur={handleBlur}
                required
                className={`form-input-base form-input-base--comfortable${formErrors.password ? ' input-error' : ''}`}
                disabled={isLoading}
                autoComplete="current-password"
                aria-invalid={!!formErrors.password}
                aria-describedby={formErrors.password ? 'password-error' : undefined}
                onInvalid={e => {
                  e.preventDefault()
                  const target = e.target as HTMLInputElement
                  if (target.validity.valueMissing) {
                    setFormErrors(prev => ({
                      ...prev,
                      password: 'La contraseña es requerida',
                    }))
                  }
                }}
              />
              <button
                type="button"
                className="password-toggle-button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <VisibilityOffIcon className="password-toggle-icon" />
                ) : (
                  <VisibilityIcon className="password-toggle-icon" />
                )}
              </button>
            </div>
            {formErrors.password && (
              <span className="error-message error-message--comfortable" id="password-error" role="alert">
                {formErrors.password}
              </span>
            )}
          </div>

          <p className="auth-support-note">
            ¿Problemas para entrar? Las cuentas son asignadas por el administrador.
          </p>

          <button
            type="submit"
            className="btn-base btn-accent btn-block btn-submit"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <span className="btn-spinner" aria-hidden="true"></span>
                <span>Iniciando sesión...</span>
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>

        <footer className="auth-card-footer">
          <ThemeToggle />
        </footer>
      </div>
    </div>
  )
}

export default Login
