import { AxiosError } from 'axios'
import { useEffect, useState, type FormEvent } from 'react'
import { schoolService } from '@/services/schoolService'
import { categoryService } from '@/services/categoryService'
import { extractApiErrorMessage } from '@/services/authService'
import type { Category } from '@/types/category'
import './Categories.css'

type ViewState = 'loading' | 'no-school' | 'ready' | 'forbidden' | 'error'

export function Categories() {
  const [viewState, setViewState] = useState<ViewState>('loading')
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null)
  const [schoolId, setSchoolId] = useState<number | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [rowError, setRowError] = useState<string | null>(null)

  async function load() {
    setViewState('loading')
    setLoadErrorMessage(null)
    try {
      const school = await schoolService.getMine()
      if (!school) {
        setViewState('no-school')
        return
      }
      setSchoolId(school.id)

      const data = await categoryService.list()
      setCategories(data)
      setViewState('ready')
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 403) {
        setViewState('forbidden')
      } else if (error instanceof AxiosError && error.response?.status === 404) {
        setViewState('no-school')
      } else {
        setLoadErrorMessage(extractApiErrorMessage(error, 'Não foi possível carregar as categorias.'))
        setViewState('error')
      }
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setApiError(null)

    if (!name.trim()) {
      setNameError('Informe o nome da categoria.')
      return
    }
    setNameError(null)

    if (!schoolId) return

    setIsSubmitting(true)
    try {
      const created = await categoryService.create({ name: name.trim(), schoolId })
      setCategories((prev) => [...prev, created])
      setName('')
    } catch (error) {
      setApiError(extractApiErrorMessage(error, 'Não foi possível cadastrar a categoria.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  function startEditing(category: Category) {
    setEditingId(category.id)
    setEditingName(category.name)
    setRowError(null)
  }

  function cancelEditing() {
    setEditingId(null)
    setEditingName('')
    setRowError(null)
  }

  async function saveEditing(category: Category) {
    if (!editingName.trim()) {
      setRowError('O nome não pode ficar vazio.')
      return
    }
    if (!schoolId) return

    try {
      const updated = await categoryService.update(category.id, {
        name: editingName.trim(),
        schoolId,
      })
      setCategories((prev) => prev.map((c) => (c.id === category.id ? updated : c)))
      cancelEditing()
    } catch (error) {
      setRowError(extractApiErrorMessage(error, 'Não foi possível salvar a alteração.'))
    }
  }

  async function handleDelete(category: Category) {
    if (!window.confirm(`Excluir a categoria "${category.name}"? Essa ação não pode ser desfeita.`)) {
      return
    }
    try {
      await categoryService.remove(category.id)
      setCategories((prev) => prev.filter((c) => c.id !== category.id))
    } catch (error) {
      setApiError(extractApiErrorMessage(error, 'Não foi possível excluir a categoria.'))
    }
  }

  if (viewState === 'loading') {
    return <p className="schools-list__hint">Carregando…</p>
  }

  return (
    <div className="categories-page">
      <div className="schools-page__header">
        <h1>Categorias</h1>
        <p>Organize os produtos da sua escola em categorias.</p>
      </div>

      {viewState === 'no-school' && (
        <div className="form-alert" role="alert">
          Você precisa cadastrar a escola antes de criar categorias. Acesse "Escolas" no menu para
          cadastrar.
        </div>
      )}

      {viewState === 'forbidden' && (
        <div className="form-alert" role="alert">
          Seu papel de usuário não tem permissão para gerenciar categorias (o backend exige o papel
          "Canteen").
        </div>
      )}

      {viewState === 'error' && (
        <div className="form-alert" role="alert">
          {loadErrorMessage}
        </div>
      )}

      {viewState === 'ready' && (
        <div className="categories-page__grid">
          <form className="schools-form" onSubmit={handleCreate} noValidate>
            <h2>Nova categoria</h2>

            {apiError && (
              <div className="form-alert" role="alert">
                {apiError}
              </div>
            )}

            <div className="field">
              <label htmlFor="category-name">Nome</label>
              <input
                id="category-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={Boolean(nameError)}
              />
              {nameError && <p className="field__error">{nameError}</p>}
            </div>

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando…' : 'Cadastrar categoria'}
            </button>
          </form>

          <div className="schools-list">
            <h2>Categorias cadastradas</h2>

            {categories.length === 0 && (
              <p className="schools-list__hint">Nenhuma categoria cadastrada ainda.</p>
            )}

            {categories.length > 0 && (
              <ul className="categories-list">
                {categories.map((category) => (
                  <li key={category.id} className="categories-list__item">
                    {editingId === category.id ? (
                      <div className="categories-list__edit-row">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          autoFocus
                        />
                        <div className="categories-list__actions">
                          <button type="button" className="link-btn" onClick={() => saveEditing(category)}>
                            Salvar
                          </button>
                          <button type="button" className="link-btn link-btn--muted" onClick={cancelEditing}>
                            Cancelar
                          </button>
                        </div>
                        {rowError && <p className="field__error">{rowError}</p>}
                      </div>
                    ) : (
                      <div className="categories-list__view-row">
                        <span>{category.name}</span>
                        <div className="categories-list__actions">
                          <button type="button" className="link-btn" onClick={() => startEditing(category)}>
                            Editar
                          </button>
                          <button
                            type="button"
                            className="link-btn link-btn--danger"
                            onClick={() => handleDelete(category)}
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    )}
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