// Tela de Categorias: CRUD exclusivo da Cantina.
// O Administrador não acessa esta tela (rota restrita a Canteen).

import { useEffect, useState, type FormEvent } from 'react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/services/categoryService';
import { getMySchool } from '@/services/schoolService';
import { extractApiErrorMessage } from '@/services/authService';
import type { Category } from '@/types/category';
import './Categories.css';

type ViewState = 'loading' | 'no-school' | 'forbidden' | 'error' | 'ready';

export default function Categories() {
  const [view, setView] = useState<ViewState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [schoolId, setSchoolId] = useState<number | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [formName, setFormName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        // Obtém a escola da Cantina logada
        let sid: number;
        try {
          const school = await getMySchool();
          sid = school.id;
        } catch (err: unknown) {
          if (!active) return;
          const status = (err as { response?: { status?: number } }).response?.status;
          if (status === 404) {
            setView('no-school');
            return;
          }
          if (status === 403) {
            setView('forbidden');
            return;
          }
          throw err;
        }

        const cats = await getCategories();
        if (!active) return;
        setSchoolId(sid);
        setCategories(cats);
        setView('ready');
      } catch (err) {
        if (!active) return;
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 404) {
          setView('no-school');
          return;
        }
        setErrorMsg(extractApiErrorMessage(err, 'Erro ao carregar categorias.'));
        setView('error');
      }
    }
    load();
    return () => { active = false; };
  }, []);

  function resetForm() {
    setFormName('');
    setEditingId(null);
    setFormError('');
  }

  function startEdit(cat: Category) {
    setFormName(cat.name);
    setEditingId(cat.id);
    setFormError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Informe o nome da categoria.');
      return;
    }

    if (schoolId === null) {
      setFormError('Escola não encontrada. Não é possível salvar a categoria.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId === null) {
        const created = await createCategory({ name: formName.trim(), schoolId });
        setCategories(prev => [...prev, created]);
      } else {
        await updateCategory(editingId, { name: formName.trim(), schoolId });
        setCategories(prev =>
          prev.map(c => (c.id === editingId ? { ...c, name: formName.trim() } : c)),
        );
      }
      resetForm();
    } catch (err) {
      setFormError(extractApiErrorMessage(err, 'Erro ao salvar categoria.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) return;
    try {
      await deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      setFormError(extractApiErrorMessage(err, 'Erro ao excluir categoria.'));
    }
  }

  if (view === 'loading') return <p className="page-status">Carregando…</p>;
  if (view === 'forbidden') return <p className="page-status">Você não tem permissão para acessar esta página.</p>;
  if (view === 'error') return <p className="page-status" role="alert">{errorMsg}</p>;

  if (view === 'no-school') {
    return (
      <div className="categories-page">
        <h1>Categorias</h1>
        <p className="page-status">
          Sua conta ainda não está vinculada a uma escola. Peça a um Administrador para criar a escola e vincular à sua conta.
        </p>
      </div>
    );
  }

  return (
    <div className="categories-page">
      <h1>Categorias</h1>

      <div className="categories-layout">
        <form className="panel" onSubmit={handleSubmit} noValidate>
          <h2>{editingId ? 'Editar categoria' : 'Nova categoria'}</h2>

          {formError && <div className="form-alert" role="alert">{formError}</div>}

          <div className="field">
            <label htmlFor="cat-name">Nome</label>
            <input id="cat-name" value={formName} onChange={e => setFormName(e.target.value)} />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Salvando…' : editingId ? 'Salvar alterações' : 'Cadastrar categoria'}
            </button>
            {editingId !== null && (
              <button type="button" className="btn-secondary" onClick={resetForm}>Cancelar</button>
            )}
          </div>
        </form>

        <div className="panel">
          <h2>Categorias cadastradas ({categories.length})</h2>
          {categories.length === 0 ? (
            <p>Nenhuma categoria cadastrada.</p>
          ) : (
            <ul className="item-list">
              {categories.map(c => (
                <li key={c.id} className="item-row">
                  <span>{c.name}</span>
                  <div className="item-actions">
                    <button className="btn-link" onClick={() => startEdit(c)}>Editar</button>
                    <button className="btn-link btn-danger" onClick={() => handleDelete(c.id)}>Excluir</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}