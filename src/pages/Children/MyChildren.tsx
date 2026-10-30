// Tela "Meus filhos": cadastro de responsável e filhos (exclusivo do papel Parent).
// Ao abrir, verifica se o responsável já completou o cadastro.
// A escola do filho é informada pelo código que a Cantina repassa aos pais.
// A escolha do cardápio fica na tela própria ChildMenuPage (/filhos/:id/cardapio).

import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/auth';
import { getActingParent } from '@/services/acting';
import { getChildren, createChild } from '@/services/childService';
import { createParent } from '@/services/parentService';
import { extractApiErrorMessage } from '@/services/authService';
import { maskCpf, maskPhone, isValidCpf, isValidPhone, onlyDigits } from '@/utils/masks';
import { formatDate, dateInputToUtcIso, todayInputValue } from '@/utils/format';
import type { Child } from '@/types/family';
import './MyChildren.css';

// Possíveis estados da tela
type ViewState = 'loading' | 'needs-registration' | 'error' | 'ready';

export default function MyChildren() {
  const { user } = useAuth();

  // Estado principal
  const [view, setView] = useState<ViewState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [children, setChildren] = useState<Child[]>([]);

  // Formulário de cadastro do responsável
  // Se o Administrador está atuando como um responsável, o nome sugerido é o do responsável
  const [parentName, setParentName] = useState(
    (user?.role === UserRole.Administrator ? getActingParent()?.name : user?.name) ?? '',
  );
  const [parentCpf, setParentCpf] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentError, setParentError] = useState('');
  const [parentSubmitting, setParentSubmitting] = useState(false);

  // Formulário de cadastro de filho
  const [childName, setChildName] = useState('');
  const [childBirth, setChildBirth] = useState('');
  const [childPhone, setChildPhone] = useState('');
  const [childSchoolCode, setChildSchoolCode] = useState('');
  const [childError, setChildError] = useState('');
  const [childSuccess, setChildSuccess] = useState('');
  const [childSubmitting, setChildSubmitting] = useState(false);

  // Carrega filhos ao montar
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await getChildren();
        if (!active) return;
        setChildren(data);
        setView('ready');
      } catch (err: unknown) {
        if (!active) return;
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 404) {
          // Responsável não completou o cadastro
          setView('needs-registration');
          return;
        }
        setErrorMsg(extractApiErrorMessage(err, 'Erro ao carregar dados.'));
        setView('error');
      }
    }
    load();
    return () => { active = false; };
  }, []);

  // --- Cadastro do responsável ---
  async function handleParentSubmit(e: FormEvent) {
    e.preventDefault();
    setParentError('');

    if (!parentName.trim()) {
      setParentError('Informe o nome.');
      return;
    }
    if (!isValidCpf(parentCpf)) {
      setParentError('CPF inválido. Verifique os dígitos.');
      return;
    }
    if (!isValidPhone(parentPhone)) {
      setParentError('Telefone inválido. Informe 10 ou 11 dígitos.');
      return;
    }

    setParentSubmitting(true);
    try {
      await createParent({
        name: parentName.trim(),
        cpf: onlyDigits(parentCpf),
        phone: onlyDigits(parentPhone),
      });
      // Recarrega a página após completar o cadastro
      setView('loading');
      const data = await getChildren();
      setChildren(data);
      setView('ready');
    } catch (err) {
      setParentError(extractApiErrorMessage(err, 'Erro ao completar cadastro.'));
    } finally {
      setParentSubmitting(false);
    }
  }

  // --- Cadastro de filho ---
  async function handleChildSubmit(e: FormEvent) {
    e.preventDefault();
    setChildError('');
    setChildSuccess('');

    if (!childName.trim()) {
      setChildError('Informe o nome do filho.');
      return;
    }
    if (!childBirth) {
      setChildError('Informe a data de nascimento.');
      return;
    }
    if (!isValidPhone(childPhone)) {
      setChildError('Telefone inválido. Informe 10 ou 11 dígitos.');
      return;
    }
    if (!childSchoolCode.trim()) {
      setChildError('Informe o código da escola.');
      return;
    }

    setChildSubmitting(true);
    try {
      await createChild({
        name: childName.trim(),
        birthDate: dateInputToUtcIso(childBirth),
        phone: onlyDigits(childPhone),
        schoolCode: childSchoolCode.trim().toUpperCase(),
      });

      // Sucesso: limpa o formulário e recarrega a lista
      setChildSuccess('Filho cadastrado com sucesso!');
      setChildName('');
      setChildBirth('');
      setChildPhone('');
      setChildSchoolCode('');

      const data = await getChildren();
      setChildren(data);
    } catch (err) {
      setChildError(extractApiErrorMessage(err, 'Erro ao cadastrar filho.'));
    } finally {
      setChildSubmitting(false);
    }
  }

  // --- Renderização ---
  if (view === 'loading') return <p className="page-status">Carregando…</p>;
  if (view === 'error') return <p className="page-status" role="alert">{errorMsg}</p>;

  // Responsável ainda não completou o cadastro
  if (view === 'needs-registration') {
    return (
      <div className="children-page">
        <h1>Meus filhos</h1>
        <form className="panel parent-form" onSubmit={handleParentSubmit} noValidate>
          <h2>Complete seu cadastro</h2>
          <p className="form-hint">
            Para cadastrar seus filhos, primeiro precisamos de algumas informações suas.
          </p>

          {parentError && <div className="form-alert" role="alert">{parentError}</div>}

          <div className="field">
            <label htmlFor="parent-name">Nome</label>
            <input
              id="parent-name"
              value={parentName}
              onChange={e => setParentName(e.target.value)}
              aria-invalid={!!parentError && !parentName.trim()}
            />
          </div>

          <div className="field">
            <label htmlFor="parent-cpf">CPF</label>
            <input
              id="parent-cpf"
              value={parentCpf}
              onChange={e => setParentCpf(maskCpf(e.target.value))}
              placeholder="000.000.000-00"
              inputMode="numeric"
              maxLength={14}
              aria-invalid={!!parentError && !isValidCpf(parentCpf)}
            />
          </div>

          <div className="field">
            <label htmlFor="parent-phone">Telefone</label>
            <input
              id="parent-phone"
              value={parentPhone}
              onChange={e => setParentPhone(maskPhone(e.target.value))}
              placeholder="(00) 00000-0000"
              inputMode="tel"
              maxLength={15}
              aria-invalid={!!parentError && !isValidPhone(parentPhone)}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={parentSubmitting}>
              {parentSubmitting ? 'Salvando…' : 'Completar cadastro'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Tela principal: lista de filhos + formulário de cadastro
  return (
    <div className="children-page">
      <h1>Meus filhos</h1>

      {/* Formulário de cadastro de filho */}
      <form className="panel children-form" onSubmit={handleChildSubmit} noValidate>
        <h2>Cadastrar filho</h2>

        {childError && <div className="form-alert" role="alert">{childError}</div>}
        {childSuccess && <div className="form-success" role="alert">{childSuccess}</div>}

        <div className="children-form-grid">
          <div className="field">
            <label htmlFor="child-name">Nome</label>
            <input
              id="child-name"
              value={childName}
              onChange={e => setChildName(e.target.value)}
              aria-invalid={!!childError && !childName.trim()}
            />
          </div>

          <div className="field">
            <label htmlFor="child-birth">Data de nascimento</label>
            <input
              id="child-birth"
              type="date"
              value={childBirth}
              onChange={e => setChildBirth(e.target.value)}
              max={todayInputValue()}
              aria-invalid={!!childError && !childBirth}
            />
          </div>

          <div className="field">
            <label htmlFor="child-phone">Telefone</label>
            <input
              id="child-phone"
              value={childPhone}
              onChange={e => setChildPhone(maskPhone(e.target.value))}
              placeholder="(00) 00000-0000"
              inputMode="tel"
              maxLength={15}
              aria-invalid={!!childError && !isValidPhone(childPhone)}
            />
          </div>

          <div className="field">
            <label htmlFor="child-school-code">Código da escola</label>
            <input
              id="child-school-code"
              value={childSchoolCode}
              onChange={e => setChildSchoolCode(e.target.value.toUpperCase())}
              placeholder="Ex.: K7M2XQ4R"
              maxLength={12}
              autoComplete="off"
              aria-invalid={!!childError && !childSchoolCode.trim()}
            />
            <p className="field__help">Peça o código à escola do seu filho.</p>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={childSubmitting}>
            {childSubmitting ? 'Cadastrando…' : 'Cadastrar filho'}
          </button>
        </div>
      </form>

      {/* Lista de filhos */}
      <div className="panel">
        <h2>Filhos cadastrados ({children.length})</h2>

        {children.length === 0 ? (
          <p>Nenhum filho cadastrado ainda.</p>
        ) : (
          <ul className="item-list">
            {children.map(child => {
              return (
                <li key={child.id} className="child-card">
                  <div className="child-info">
                    <strong>{child.name}</strong>
                    <span className="item-detail">
                      Nascimento: {formatDate(child.birthDate)}
                    </span>
                    <span className="item-detail">
                      Telefone: {maskPhone(child.phone)}
                    </span>
                    <span className="item-detail">
                      Escola: {child.school.name} — {child.school.address}
                    </span>
                  </div>

                  <Link to={`/filhos/${child.id}/cardapio`} className="btn-secondary">
                    Ver cardápio
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}