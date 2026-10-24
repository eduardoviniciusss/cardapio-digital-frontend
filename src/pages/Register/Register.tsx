// Tela de Cadastro: cria conta de Administrador, Cantina ou Responsável.
// Usa o mesmo visual da tela de Login (classes em auth-layout.css).

import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { extractApiErrorMessage, register } from '@/services/authService'
import '@/pages/auth-layout.css'

interface FormErrors {
  name?: string
  email?: string
  password?: string
}

// Texto de ajuda sob o seletor de papel (a chave é o número enviado à API)
const ROLE_HELP: Record<number, string> = {
  1: 'O Administrador gerencia as escolas e vincula cada uma a uma Cantina.',
  2: 'Depois do cadastro, um Administrador precisa vincular você a uma escola.',
  3: 'Depois de entrar, complete seu cadastro em "Meus filhos".',
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function Register() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(2)
  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Validação no cliente: devolve true se está tudo certo
  function validate(): boolean {
    const next: FormErrors = {}

    if (!name.trim()) next.name = 'Informe seu nome.'

    if (!email.trim()) {
      next.email = 'Informe seu e-mail.'
    } else if (!validateEmail(email.trim())) {
      next.email = 'Informe um e-mail válido.'
    }

    if (!password) next.password = 'Informe uma senha.'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setApiError(null)

    if (!validate()) return

    setSubmitting(true)
    try {
      await register({ name: name.trim(), email: email.trim(), password, role })
      navigate('/login', { replace: true })
    } catch (err) {
      setApiError(extractApiErrorMessage(err, 'Não foi possível criar a conta. Tente novamente.'))
    } finally {
      setSubmitting(false)
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
          <p className="auth-form__eyebrow">Comece agora</p>
          <h2 className="auth-form__title">Criar conta</h2>
          <p className="auth-form__hint">
            Já tem conta? <Link to="/login">Entrar</Link>
          </p>

          {apiError && (
            <div className="form-alert" role="alert">
              {apiError}
            </div>
          )}

          <div className="field">
            <label htmlFor="reg-name">Nome</label>
            <input
              id="reg-name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'reg-name-error' : undefined}
            />
            {errors.name && (
              <p className="field__error" id="reg-name-error" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="reg-email">E-mail</label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'reg-email-error' : undefined}
            />
            {errors.email && (
              <p className="field__error" id="reg-email-error" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="reg-password">Senha</label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'reg-password-error' : undefined}
            />
            {errors.password && (
              <p className="field__error" id="reg-password-error" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="reg-role">Papel</label>
            <select
              id="reg-role"
              value={role}
              onChange={(e) => setRole(Number(e.target.value))}
              aria-describedby="reg-role-help"
            >
              <option value={1}>Administrador</option>
              <option value={2}>Cantina</option>
              <option value={3}>Responsável</option>
            </select>
            <p className="field__help" id="reg-role-help">
              {ROLE_HELP[role]}
            </p>
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Cadastrando…' : 'Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
