import { AxiosError } from 'axios'
import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '@/context/AuthContext'
import { schoolService } from '@/services/schoolService'
import { extractApiErrorMessage } from '@/services/authService'
import { UserRole } from '@/types/auth'
import { SHIFT_OPTIONS, type CanteenOption, type School, type ShiftName } from '@/types/school'
import './Schools.css'

export function Schools() {
  const { user } = useAuth()

  if (user?.role === UserRole.Administrator) {
    return <AdminSchools />
  }
  return <MySchool />
}

/* ------------------------------------------------------------------ */
/* Visão da Cantina: só a própria escola, sem poder criar nem editar. */
/* ------------------------------------------------------------------ */

type MyViewState = 'loading' | 'no-school' | 'has-school' | 'forbidden' | 'error'

function MySchool() {
  const [viewState, setViewState] = useState<MyViewState>('loading')
  const [school, setSchool] = useState<School | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setViewState('loading')
      try {
        const data = await schoolService.getMine()
        if (data) {
          setSchool(data)
          setViewState('has-school')
        } else {
          setViewState('no-school')
        }
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 403) {
          setViewState('forbidden')
        } else {
          setErrorMessage(extractApiErrorMessage(error, 'Não foi possível carregar sua escola.'))
          setViewState('error')
        }
      }
    }
    load()
  }, [])

  if (viewState === 'loading') return <p className="schools-list__hint">Carregando…</p>

  return (
    <div className="schools-page">
      <div className="schools-page__header">
        <h1>Minha escola</h1>
        <p>Dados cadastrados pelo Administrador. Só ele pode alterá-los.</p>
      </div>

      {viewState === 'forbidden' && (
        <div className="form-alert" role="alert">
          Seu papel de usuário não tem permissão para visualizar os dados da escola.
        </div>
      )}

      {viewState === 'error' && <div className="form-alert" role="alert">{errorMessage}</div>}

      {viewState === 'no-school' && (
        <div className="form-alert" role="alert">
          Nenhuma escola foi vinculada à sua conta ainda. Peça a um Administrador para cadastrá-la.
        </div>
      )}

      {viewState === 'has-school' && school && (
        <div className="schools-list">
          <h2>Dados da escola</h2>
          <ul className="schools-list__items">
            <li>
              <strong>{school.name}</strong>
              <span>{school.address}</span>
              <span>{school.phone}</span>
              <span>{school.shifts.map((s) => SHIFT_OPTIONS.find((o) => o.value === s)?.label ?? s).join(', ')}</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Visão do Administrador: lista todas as escolas, cria e edita.      */
/* ------------------------------------------------------------------ */

interface FormErrors {
  name?: string
  address?: string
  phone?: string
  shifts?: string
  canteenUserId?: string
}

type AdminViewState = 'loading' | 'ready' | 'error'

function AdminSchools() {
  const [viewState, setViewState] = useState<AdminViewState>('loading')
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null)
  const [schools, setSchools] = useState<School[]>([])
  const [availableCanteens, setAvailableCanteens] = useState<CanteenOption[]>([])

  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [shifts, setShifts] = useState<ShiftName[]>([])
  const [canteenUserId, setCanteenUserId] = useState<number | ''>('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function load() {
    setViewState('loading')
    setLoadErrorMessage(null)
    try {
      const [schoolList, canteens] = await Promise.all([
        schoolService.listAll(),
        schoolService.availableCanteens(),
      ])
      setSchools(schoolList)
      setAvailableCanteens(canteens)
      setViewState('ready')
    } catch (error) {
      setLoadErrorMessage(extractApiErrorMessage(error, 'Não foi possível carregar as escolas.'))
      setViewState('error')
    }
  }

  useEffect(() => {
    load()
  }, [])

  function resetForm() {
    setEditingId(null)
    setName('')
    setAddress('')
    setPhone('')
    setShifts([])
    setCanteenUserId('')
    setErrors({})
    setApiError(null)
  }

  function startEditing(school: School) {
    setEditingId(school.id)
    setName(school.name)
    setAddress(school.address)
    setPhone(school.phone)
    setShifts(school.shifts)
    setCanteenUserId('')
    setErrors({})
    setApiError(null)
  }

  function toggleShift(value: ShiftName) {
    setShifts((prev) => (prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]))
  }

  function validate(): boolean {
    const nextErrors: FormErrors = {}
    if (!name.trim()) nextErrors.name = 'Informe o nome da escola.'
    if (!address.trim()) nextErrors.address = 'Informe o endereço da escola.'
    if (!phone.trim()) nextErrors.phone = 'Informe o telefone da escola.'
    if (shifts.length === 0) nextErrors.shifts = 'Selecione pelo menos um turno.'
    if (!editingId && !canteenUserId) nextErrors.canteenUserId = 'Escolha qual Cantina é a dona desta escola.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setApiError(null)
    if (!validate()) return

    setIsSubmitting(true)
    try {
      if (editingId) {
        const updated = await schoolService.update(editingId, {
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim(),
          shifts,
        })
        setSchools((prev) => prev.map((s) => (s.id === editingId ? { ...s, ...updated } : s)))
        resetForm()
      } else {
        const created = await schoolService.create({
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim(),
          shifts,
          canteenUserId: Number(canteenUserId),
        })
        setSchools((prev) => [...prev, created])
        setAvailableCanteens((prev) => prev.filter((c) => c.id !== Number(canteenUserId)))
        resetForm()
      }
    } catch (error) {
      setApiError(extractApiErrorMessage(error, 'Não foi possível salvar a escola.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(school: School) {
    if (!window.confirm(`Excluir a escola "${school.name}"? Essa ação não pode ser desfeita.`)) return
    try {
      await schoolService.remove(school.id)
      setSchools((prev) => prev.filter((s) => s.id !== school.id))
      if (school.canteenUserId) {
        setAvailableCanteens((prev) => [
          ...prev,
          { id: school.canteenUserId!, name: school.canteenName ?? '', email: '' },
        ])
      }
      if (editingId === school.id) resetForm()
    } catch (error) {
      setApiError(extractApiErrorMessage(error, 'Não foi possível excluir a escola.'))
    }
  }

  if (viewState === 'loading') return <p className="schools-list__hint">Carregando…</p>

  return (
    <div className="schools-page">
      <div className="schools-page__header">
        <h1>Escolas</h1>
        <p>Cada escola pertence a uma Cantina. Cadastre e gerencie todas aqui.</p>
      </div>

      {viewState === 'error' && <div className="form-alert" role="alert">{loadErrorMessage}</div>}

      {viewState === 'ready' && (
        <div className="schools-page__grid">
          <form className="schools-form" onSubmit={handleSubmit} noValidate>
            <h2>{editingId ? 'Editar escola' : 'Nova escola'}</h2>

            {apiError && <div className="form-alert" role="alert">{apiError}</div>}

            {!editingId && availableCanteens.length === 0 && (
              <div className="form-alert" role="alert">
                Todas as Cantinas já têm uma escola vinculada. Cadastre um novo usuário com papel
                Cantina antes de criar outra escola.
              </div>
            )}

            {!editingId && availableCanteens.length > 0 && (
              <div className="field">
                <label htmlFor="canteen">Cantina dona da escola</label>
                <select
                  id="canteen"
                  value={canteenUserId}
                  onChange={(e) => setCanteenUserId(e.target.value ? Number(e.target.value) : '')}
                  aria-invalid={Boolean(errors.canteenUserId)}
                >
                  <option value="">Selecione…</option>
                  {availableCanteens.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
                {errors.canteenUserId && <p className="field__error">{errors.canteenUserId}</p>}
              </div>
            )}

            {(editingId || availableCanteens.length > 0) && (
              <>
                <div className="field">
                  <label htmlFor="school-name">Nome</label>
                  <input id="school-name" type="text" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={Boolean(errors.name)} />
                  {errors.name && <p className="field__error">{errors.name}</p>}
                </div>

                <div className="field">
                  <label htmlFor="school-address">Endereço</label>
                  <input id="school-address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} aria-invalid={Boolean(errors.address)} />
                  {errors.address && <p className="field__error">{errors.address}</p>}
                </div>

                <div className="field">
                  <label htmlFor="school-phone">Telefone</label>
                  <input id="school-phone" type="tel" placeholder="(11) 91234-5678" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={Boolean(errors.phone)} />
                  {errors.phone && <p className="field__error">{errors.phone}</p>}
                </div>

                <div className="field">
                  <label>Turnos</label>
                  <div className="shifts-options">
                    {SHIFT_OPTIONS.map((option) => (
                      <label key={option.value} className="shifts-options__item">
                        <input type="checkbox" checked={shifts.includes(option.value)} onChange={() => toggleShift(option.value)} />
                        {option.label}
                      </label>
                    ))}
                  </div>
                  {errors.shifts && <p className="field__error">{errors.shifts}</p>}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando…' : editingId ? 'Salvar alterações' : 'Cadastrar escola'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ background: 'transparent', color: 'var(--color-forest)', border: '1.5px solid var(--color-parchment-dark)' }}
                      onClick={resetForm}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </>
            )}
          </form>

          <div className="schools-list">
            <h2>Escolas cadastradas</h2>
            {schools.length === 0 && <p className="schools-list__hint">Nenhuma escola cadastrada ainda.</p>}
            {schools.length > 0 && (
              <ul className="schools-list__items">
                {schools.map((school) => (
                  <li key={school.id}>
                    <strong>{school.name}</strong>
                    <span>{school.address}</span>
                    <span>{school.phone}</span>
                    <span>{school.shifts.map((s) => SHIFT_OPTIONS.find((o) => o.value === s)?.label ?? s).join(', ')}</span>
                    <span>Cantina: {school.canteenName ?? '—'}</span>
                    <div style={{ display: 'flex', gap: '0.9rem', marginTop: '0.5rem' }}>
                      <button type="button" className="link-btn" onClick={() => startEditing(school)}>Editar</button>
                      <button type="button" className="link-btn link-btn--danger" onClick={() => handleDelete(school)}>Excluir</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}