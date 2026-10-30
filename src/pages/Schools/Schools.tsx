// Tela de Escolas: CRUD para o Administrador (que também cria a conta da Cantina), visualização para a Cantina.

import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getAllSchools,
  getMySchool,
  createSchool,
  updateSchool,
  deleteSchool,
} from '@/services/schoolService';
import { extractApiErrorMessage } from '@/services/authService';
import type { School } from '@/types/school';
import PasswordInput from '@/components/PasswordInput';
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
  const [mySchool, setMySchool] = useState<School | null>(null);

  // --- formulário ---
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formShifts, setFormShifts] = useState<string[]>([]);

  // Conta da Cantina (criada junto com a escola)
  const [formCanteenName, setFormCanteenName] = useState('');
  const [formCanteenEmail, setFormCanteenEmail] = useState('');
  const [formCanteenPassword, setFormCanteenPassword] = useState('');

  // Aviso exibido ao Admin após criar a escola (código para os pais + login da cantina)
  const [createdInfo, setCreatedInfo] = useState<{
    code: string;
    email: string;
  } | null>(null);

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
          const s = await getAllSchools();
          if (!active) return;
          setSchools(s);
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
    setFormCanteenName('');
    setFormCanteenEmail('');
    setFormCanteenPassword('');
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
      // Criando nova escola (junto com a conta da Cantina)
      if (!formCanteenName.trim() || !formCanteenEmail.trim() || !formCanteenPassword) {
        setFormError('Informe nome, e-mail e senha da cantina.');
        return;
      }
      if (formCanteenPassword.length < 6) {
        setFormError('A senha da cantina deve ter pelo menos 6 caracteres.');
        return;
      }

      setSubmitting(true);
      try {
        const created = await createSchool({
          name: formName.trim(),
          address: formAddress.trim(),
          phone: formPhone.trim(),
          shifts: formShifts,
          canteenName: formCanteenName.trim(),
          canteenEmail: formCanteenEmail.trim(),
          canteenPassword: formCanteenPassword,
        });
        setSchools(prev => [...prev, created]);
        setCreatedInfo({ code: created.code ?? '', email: formCanteenEmail.trim() });
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
          <p><strong>Código da escola:</strong> {mySchool.code}</p>
          <p className="form-hint">Informe este código aos pais para cadastrarem os filhos.</p>
          <button type="button" className="btn-secondary" onClick={startEditMine}>Editar escola</button>
        </div>
      </div>
    );
  }

  // Administrador — CRUD
  return (
    <div className="schools-page">
      <h1>Escolas</h1>

      {/* Aviso para o admin anotar o código */}
      {createdInfo && (
        <div className="form-success" role="status">
          Escola criada! Código para os pais: <strong>{createdInfo.code}</strong>.
          Login da cantina: <strong>{createdInfo.email}</strong>.
        </div>
      )}

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
            <>
              <h3>Conta da cantina</h3>

              <div className="field">
                <label htmlFor="canteen-name">Nome do responsável pela cantina</label>
                <input id="canteen-name" value={formCanteenName} onChange={e => setFormCanteenName(e.target.value)} />
              </div>

              <div className="field">
                <label htmlFor="canteen-email">E-mail de login</label>
                <input id="canteen-email" type="email" autoComplete="off"
                  value={formCanteenEmail} onChange={e => setFormCanteenEmail(e.target.value)} />
              </div>

              <div className="field">
                <label htmlFor="canteen-password">Senha</label>
                <PasswordInput id="canteen-password" autoComplete="new-password"
                  value={formCanteenPassword} onChange={e => setFormCanteenPassword(e.target.value)} />
              </div>
            </>
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
                    <span className="item-detail">🔑 Código: <strong>{s.code}</strong></span>
                    <span className="item-detail">🍽️ {s.canteenName} ({s.canteenEmail})</span>
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