// Tela de Escolas: CRUD para o Administrador, visualização para a Cantina.

import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getAllSchools,
  getAvailableCanteens,
  getMySchool,
  createSchool,
  updateSchool,
  deleteSchool,
} from '@/services/schoolService';
import { extractApiErrorMessage } from '@/services/authService';
import type { AvailableCanteen, School } from '@/types/school';
import './Schools.css';

type ViewState = 'loading' | 'no-school' | 'forbidden' | 'error' | 'ready';

const SHIFT_OPTIONS = [
  { value: 'Morning', label: 'Manhã' },
  { value: 'Afternoon', label: 'Tarde' },
  { value: 'Evening', label: 'Noite' },
];

export default function Schools() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrator';

  // --- estado geral ---
  const [view, setView] = useState<ViewState>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  // --- dados ---
  const [schools, setSchools] = useState<School[]>([]);
  const [canteens, setCanteens] = useState<AvailableCanteen[]>([]);
  const [mySchool, setMySchool] = useState<School | null>(null);

  // --- formulário ---
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formShifts, setFormShifts] = useState<string[]>([]);
  const [formCanteen, setFormCanteen] = useState<number | ''>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingMine, setEditingMine] = useState(false); // Cantina editando a própria escola
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // --- carregamento ---
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        if (isAdmin) {
          const [s, c] = await Promise.all([getAllSchools(), getAvailableCanteens()]);
          if (!active) return;
          setSchools(s);
          setCanteens(c);
          setView('ready');
        } else {
          try {
            const s = await getMySchool();
            if (!active) return;
            setMySchool(s);
            setView('ready');
          } catch (err: unknown) {
            if (!active) return;
            const status = (err as { response?: { status?: number } }).response?.status;
            if (status === 404) {
              setView('no-school');
            } else if (status === 403) {
              setView('forbidden');
            } else {
              setErrorMsg(extractApiErrorMessage(err, 'Erro ao carregar escola.'));
              setView('error');
            }
          }
        }
      } catch (err) {
        if (!active) return;
        setErrorMsg(extractApiErrorMessage(err, 'Erro ao carregar escolas.'));
        setView('error');
      }
    }
    load();
    return () => { active = false; };
  }, [isAdmin]);

  // --- helpers ---
  function resetForm() {
    setFormName('');
    setFormAddress('');
    setFormPhone('');
    setFormShifts([]);
    setFormCanteen('');
    setEditingId(null);
    setFormError('');
  }

  function startEdit(school: School) {
    setFormName(school.name);
    setFormAddress(school.address);
    setFormPhone(school.phone);
    setFormShifts([...school.shifts]);
    setEditingId(school.id);
    setFormError('');
  }

  function toggleShift(value: string) {
    setFormShifts(prev =>
      prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value],
    );
  }

  // --- Cantina: editar a própria escola ---
  function startEditMine() {
    if (!mySchool) return;
    setFormName(mySchool.name);
    setFormAddress(mySchool.address);
    setFormPhone(mySchool.phone);
    setFormShifts([...mySchool.shifts]);
    setFormError('');
    setEditingMine(true);
  }

  function cancelEditMine() {
    setEditingMine(false);
    resetForm();
  }

  async function handleSubmitMine(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!mySchool) return;

    if (!formName.trim() || !formAddress.trim() || !formPhone.trim()) {
      setFormError('Preencha todos os campos.');
      return;
    }
    if (formShifts.length === 0) {
      setFormError('Selecione pelo menos um turno.');
      return;
    }

    const data = {
      name: formName.trim(),
      address: formAddress.trim(),
      phone: formPhone.trim(),
      shifts: formShifts,
    };

    setSubmitting(true);
    try {
      await updateSchool(mySchool.id, data);
      setMySchool({ ...mySchool, ...data });
      setEditingMine(false);
      resetForm();
    } catch (err) {
      setFormError(extractApiErrorMessage(err, 'Erro ao atualizar escola.'));
    } finally {
      setSubmitting(false);
    }
  }

  /** Rebusca a lista de Cantinas disponíveis na API */
  async function refreshCanteens() {
    try {
      const c = await getAvailableCanteens();
      setCanteens(c);
    } catch {
      // Se falhar, não é crítico; a lista pode ficar desatualizada temporariamente
    }
  }

  // --- submit ---
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!formName.trim() || !formAddress.trim() || !formPhone.trim()) {
      setFormError('Preencha todos os campos.');
      return;
    }
    if (formShifts.length === 0) {
      setFormError('Selecione pelo menos um turno.');
      return;
    }

    if (editingId === null) {
      // Criando nova escola
      if (formCanteen === '') {
        setFormError('Selecione a Cantina responsável.');
        return;
      }

      setSubmitting(true);
      try {
        const created = await createSchool({
          name: formName.trim(),
          address: formAddress.trim(),
          phone: formPhone.trim(),
          shifts: formShifts,
          canteenUserId: Number(formCanteen),
        });
        setSchools(prev => [...prev, created]);
        // Rebusca as Cantinas disponíveis após criar escola
        await refreshCanteens();
        resetForm();
      } catch (err) {
        setFormError(extractApiErrorMessage(err, 'Erro ao criar escola.'));
      } finally {
        setSubmitting(false);
      }
    } else {
      // Editando escola existente
      setSubmitting(true);
      try {
        await updateSchool(editingId, {
          name: formName.trim(),
          address: formAddress.trim(),
          phone: formPhone.trim(),
          shifts: formShifts,
        });
        setSchools(prev =>
          prev.map(s => (s.id === editingId ? { ...s, name: formName.trim(), address: formAddress.trim(), phone: formPhone.trim(), shifts: formShifts } : s)),
        );
        resetForm();
      } catch (err) {
        setFormError(extractApiErrorMessage(err, 'Erro ao atualizar escola.'));
      } finally {
        setSubmitting(false);
      }
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Tem certeza que deseja excluir esta escola?')) return;
    try {
      await deleteSchool(id);
      setSchools(prev => prev.filter(s => s.id !== id));
      if (editingId === id) resetForm();
      // Rebusca as Cantinas disponíveis após excluir escola
      await refreshCanteens();
    } catch (err) {
      setFormError(extractApiErrorMessage(err, 'Erro ao excluir escola.'));
    }
  }

  // --- render ---
  if (view === 'loading') return <p className="page-status">Carregando…</p>;
  if (view === 'forbidden') return <p className="page-status">Você não tem permissão para acessar esta página.</p>;
  if (view === 'error') return <p className="page-status" role="alert">{errorMsg}</p>;

  // Cantina sem escola
  if (!isAdmin && view === 'no-school') {
    return (
      <div className="schools-page">
        <h1>Minha escola</h1>
        <p className="page-status">Sua conta ainda não está vinculada a uma escola. Peça a um Administrador para criar a escola e vincular à sua conta.</p>
      </div>
    );
  }

  // Cantina — edição da própria escola
  if (!isAdmin && mySchool && editingMine) {
    return (
      <div className="schools-page">
        <h1>Minha escola</h1>
        <form className="panel" onSubmit={handleSubmitMine} noValidate>
          <h2>Editar escola</h2>

          {formError && <div className="form-alert" role="alert">{formError}</div>}

          <div className="field">
            <label htmlFor="my-school-name">Nome</label>
            <input id="my-school-name" value={formName} onChange={e => setFormName(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="my-school-address">Endereço</label>
            <input id="my-school-address" value={formAddress} onChange={e => setFormAddress(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="my-school-phone">Telefone</label>
            <input id="my-school-phone" value={formPhone} onChange={e => setFormPhone(e.target.value)} />
          </div>

          <fieldset className="field">
            <legend>Turnos</legend>
            {SHIFT_OPTIONS.map(opt => (
              <label key={opt.value} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formShifts.includes(opt.value)}
                  onChange={() => toggleShift(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </fieldset>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Salvando…' : 'Salvar alterações'}
            </button>
            <button type="button" className="btn-secondary" onClick={cancelEditMine}>Cancelar</button>
          </div>
        </form>
      </div>
    );
  }

  // Cantina — visualização
  if (!isAdmin && mySchool) {
    return (
      <div className="schools-page">
        <h1>Minha escola</h1>
        <div className="school-card">
          <h2>{mySchool.name}</h2>
          <p><strong>Endereço:</strong> {mySchool.address}</p>
          <p><strong>Telefone:</strong> {mySchool.phone}</p>
          <p><strong>Turnos:</strong> {mySchool.shifts.map(s => {
            const opt = SHIFT_OPTIONS.find(o => o.value === s);
            return opt ? opt.label : s;
          }).join(', ')}</p>
          <button type="button" className="btn-secondary" onClick={startEditMine}>Editar escola</button>
        </div>
      </div>
    );
  }

  // Administrador — CRUD
  return (
    <div className="schools-page">
      <h1>Escolas</h1>

      <div className="schools-layout">
        {/* Formulário */}
        <form className="panel" onSubmit={handleSubmit} noValidate>
          <h2>{editingId ? 'Editar escola' : 'Nova escola'}</h2>

          {formError && <div className="form-alert" role="alert">{formError}</div>}

          <div className="field">
            <label htmlFor="school-name">Nome</label>
            <input id="school-name" value={formName} onChange={e => setFormName(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="school-address">Endereço</label>
            <input id="school-address" value={formAddress} onChange={e => setFormAddress(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="school-phone">Telefone</label>
            <input id="school-phone" value={formPhone} onChange={e => setFormPhone(e.target.value)} />
          </div>

          <fieldset className="field">
            <legend>Turnos</legend>
            {SHIFT_OPTIONS.map(opt => (
              <label key={opt.value} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formShifts.includes(opt.value)}
                  onChange={() => toggleShift(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </fieldset>

          {editingId === null && (
            <div className="field">
              <label htmlFor="school-canteen">Cantina responsável</label>
              <select id="school-canteen" value={formCanteen} onChange={e => setFormCanteen(e.target.value === '' ? '' : Number(e.target.value))}>
                <option value="">Selecione…</option>
                {canteens.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Salvando…' : editingId ? 'Salvar alterações' : 'Cadastrar escola'}
            </button>
            {editingId !== null && (
              <button type="button" className="btn-secondary" onClick={resetForm}>Cancelar</button>
            )}
          </div>
        </form>

        {/* Lista */}
        <div className="panel">
          <h2>Escolas cadastradas ({schools.length})</h2>
          {schools.length === 0 ? (
            <p>Nenhuma escola cadastrada.</p>
          ) : (
            <ul className="item-list">
              {schools.map(s => (
                <li key={s.id} className="item-row">
                  <div>
                    <strong>{s.name}</strong>
                    <span className="item-detail">{s.address}</span>
                    <span className="item-detail">📞 {s.phone}</span>
                    <span className="item-detail">
                      Turnos: {s.shifts.map(sh => {
                        const opt = SHIFT_OPTIONS.find(o => o.value === sh);
                        return opt ? opt.label : sh;
                      }).join(', ')}
                    </span>
                    <span className="item-detail">🍽️ {s.canteenName}</span>
                  </div>
                  <div className="item-actions">
                    <button className="btn-link" onClick={() => startEdit(s)}>Editar</button>
                    <button className="btn-link btn-danger" onClick={() => handleDelete(s.id)}>Excluir</button>
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