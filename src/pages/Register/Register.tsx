import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService, extractApiErrorMessage } from '@/services/authService'
import { UserRole, roleLabels } from '@/types/auth'
import '../auth-layout.css'

interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function Register() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<UserRole>(UserRole.Parent)

  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  function validate(): boolean {
    const nextErrors: FormErrors = {}

    if (!name.trim()) {
      nextErrors.name = 'Informe seu nome.'
    }

    if (!email.trim()) {
      nextErrors.email = 'Informe seu e-mail.'
    } else if (!validateEmail(email)) {
      nextErrors.email = 'Informe um e-mail válido.'
    }

    if (!password) {
      nextErrors.password = 'Crie uma senha.'
    } else if (password.length < 6) {
      nextErrors.password = 'A senha precisa ter pelo menos 6 caracteres.'
    }

    if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'As senhas não coincidem.'
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
      await authService.register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 1200)
    } catch (error) {
      setApiError(extractApiErrorMessage(error, 'Não foi possível criar a conta. Tente novamente.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-screen">
      <aside className="auth-screen__brand">
        <span className="auth-screen__mark">Cardápio Digital</span>
        <div>
          <h1 className="auth-screen__headline">Comece em poucos minutos.</h1>
          <p className="auth-screen__subtext">
            Crie sua conta como administrador, cantina ou responsável para acompanhar o cardápio.
          </p>
        </div>
        <span />
      </aside>

      <div className="auth-screen__panel">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <p className="auth-form__eyebrow">Nova conta</p>
          <h2 className="auth-form__title">Criar cadastro</h2>
          <p className="auth-form__hint">
            Já tem conta? <Link to="/login">Entrar</Link>
          </p>

          {success && (
            <div className="form-alert" role="status" style={{ color: '#1f2e1c', background: 'rgba(31,46,28,0.08)', borderColor: 'rgba(31,46,28,0.25)' }}>
              Conta criada! Redirecionando para o login…
            </div>
          )}

          {apiError && (
            <div className="form-alert" role="alert">
              {apiError}
            </div>
          )}

          <div className="field">
            <label htmlFor="name">Nome completo</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && <p className="field__error">{errors.name}</p>}
          </div>

          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && <p className="field__error">{errors.email}</p>}
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(errors.password)}
              />
              {errors.password && <p className="field__error">{errors.password}</p>}
            </div>

            <div className="field">
              <label htmlFor="confirmPassword">Confirmar senha</label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={Boolean(errors.confirmPassword)}
              />
              {errors.confirmPassword && <p className="field__error">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div className="field">
            <label htmlFor="role">Você é</label>
            <select id="role" value={role} onChange={(e) => setRole(Number(e.target.value) as UserRole)}>
              {Object.values(UserRole)
                .filter((v): v is UserRole => typeof v === 'number')
                .map((roleValue) => (
                  <option key={roleValue} value={roleValue}>
                    {roleLabels[roleValue]}
                  </option>
                ))}
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Criando conta…' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  )
}
