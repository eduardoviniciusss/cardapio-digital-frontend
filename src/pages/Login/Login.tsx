import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { extractApiErrorMessage } from '@/services/authService'
import '../auth-layout.css'

interface FormErrors {
  email?: string
  password?: string
}

interface LocationState {
  from?: { pathname: string }
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validate(): boolean {
    const nextErrors: FormErrors = {}

    if (!email.trim()) {
      nextErrors.email = 'Informe seu e-mail.'
    } else if (!validateEmail(email)) {
      nextErrors.email = 'Informe um e-mail válido.'
    }

    if (!password) {
      nextErrors.password = 'Informe sua senha.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setApiError(null)

    if (!validate()) return

    setIsSubmitting(true)
    try {
      await login({ email: email.trim(), password })

      // Volta o usuário para a página que ele tentou acessar antes do
      // login (guardada pelo ProtectedRoute), ou para a home por padrão.
      const state = location.state as LocationState | null
      const redirectTo = state?.from?.pathname ?? '/'
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setApiError(extractApiErrorMessage(error, 'Não foi possível entrar. Tente novamente.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-screen">
      <aside className="auth-screen__brand">
        <span className="auth-screen__mark">Cardápio Digital</span>
        <div>
          <h1 className="auth-screen__headline">O cardápio da escola, sempre à mão.</h1>
          <p className="auth-screen__subtext">
            Cantina, direção e responsáveis acompanhando o mesmo cardápio, em tempo real.
          </p>
        </div>
        <span />
      </aside>

      <div className="auth-screen__panel">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <p className="auth-form__eyebrow">Bem-vindo de volta</p>
          <h2 className="auth-form__title">Entrar na conta</h2>
          <p className="auth-form__hint">
            Ainda não tem conta? <Link to="/cadastro">Cadastre-se</Link>
          </p>

          {apiError && (
            <div className="form-alert" role="alert">
              {apiError}
            </div>
          )}

          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p className="field__error" id="email-error">
                {errors.email}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && (
              <p className="field__error" id="password-error">
                {errors.password}
              </p>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
