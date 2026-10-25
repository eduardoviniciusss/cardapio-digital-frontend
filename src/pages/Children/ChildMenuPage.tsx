// Tela "Escolher lanche" (rota /filhos/:childId/cardapio).
// O responsável escolhe a data e os itens do cardápio de um filho
// e confirma o agendamento. A lista de filhos fica em MyChildren.tsx.

import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getChildren, getChildMenus } from '@/services/childService';
import { createOrder } from '@/services/orderService';
import { extractApiErrorMessage } from '@/services/authService';
import { formatDate, dateInputToUtcIso, todayInputValue } from '@/utils/format';
import type { Child, ChildMenu } from '@/types/family';
import ChildMenuView, { type MenuSelection } from './ChildMenuView';
import './ChildMenuPage.css';

type ViewState = 'loading' | 'error' | 'needs-registration' | 'ready';

export default function ChildMenuPage() {
  const { childId } = useParams<{ childId: string }>();
  const id = Number(childId);

  const [view, setView] = useState<ViewState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [child, setChild] = useState<Child | null>(null);
  const [menus, setMenus] = useState<ChildMenu[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const [date, setDate] = useState(todayInputValue());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  // Muda depois de confirmar para limpar a escolha do cardápio
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [children, childMenus] = await Promise.all([getChildren(), getChildMenus(id)]);
        if (!active) return;

        const found = children.find(c => c.id === id);
        if (!found) {
          setErrorMsg('Filho não encontrado.');
          setView('error');
          return;
        }
        setChild(found);
        setMenus(childMenus);
        setActiveMenuId(childMenus[0]?.id ?? null);
        setView('ready');
      } catch (err: unknown) {
        if (!active) return;
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 404) {
          // Responsável sem cadastro completo: a tela de filhos cuida disso
          setView('needs-registration');
          return;
        }
        setErrorMsg(extractApiErrorMessage(err, 'Erro ao carregar o cardápio.'));
        setView('error');
      }
    }

    if (Number.isNaN(id)) {
      setErrorMsg('Filho inválido.');
      setView('error');
    } else {
      load();
    }
    return () => { active = false; };
  }, [id]);

  async function handleConfirm(selection: MenuSelection) {
    setSubmitError('');
    setSubmitSuccess('');

    if (!date) {
      setSubmitError('Informe a data do agendamento.');
      window.scrollTo({ top: 0 });
      return;
    }

    setSubmitting(true);
    try {
      const isoDate = dateInputToUtcIso(date);
      await createOrder({
        childId: id,
        menuId: selection.menuId,
        date: isoDate,
        productIds: selection.productIds,
      });
      setSubmitSuccess(`Agendamento confirmado para ${formatDate(isoDate)}.`);
      setResetKey(k => k + 1);
    } catch (err) {
      setSubmitError(extractApiErrorMessage(err, 'Erro ao confirmar agendamento.'));
    } finally {
      setSubmitting(false);
      window.scrollTo({ top: 0 });
    }
  }

  if (view === 'loading') return <p className="page-status">Carregando…</p>;
  if (view === 'needs-registration') return <Navigate to="/filhos" replace />;
  if (view === 'error') {
    return (
      <div className="menu-page">
        <Link to="/filhos" className="back-link">← Meus filhos</Link>
        <p className="page-status" role="alert">{errorMsg}</p>
      </div>
    );
  }

  const activeMenu = menus.find(m => m.id === activeMenuId) ?? null;

  return (
    <div className="menu-page">
      <Link to="/filhos" className="back-link">← Meus filhos</Link>

      <h1>Escolher lanche</h1>
      <p className="menu-page-for">
        Escolhendo lanche para <strong>{child?.name}</strong>
        {child && <span className="chip">{child.school.name}</span>}
      </p>

      {submitError && <div className="form-alert" role="alert">{submitError}</div>}
      {submitSuccess && (
        <div className="form-success" role="status">
          {submitSuccess} <Link to="/meus-pedidos">Ver meus pedidos</Link>
        </div>
      )}

      <div className="panel">
        <div className="field menu-page-date">
          <label htmlFor="order-date">Data do agendamento</label>
          <input
            id="order-date"
            type="date"
            value={date}
            min={todayInputValue()}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        {menus.length === 0 && (
          <p className="menu-empty">Nenhum cardápio disponível para esta escola.</p>
        )}

        {/* Se a escola tiver mais de um cardápio, o responsável escolhe qual ver */}
        {menus.length > 1 && (
          <div className="menu-page-tabs" role="group" aria-label="Cardápios">
            {menus.map(m => (
              <button
                key={m.id}
                type="button"
                className={`menu-page-tab${m.id === activeMenuId ? ' is-active' : ''}`}
                aria-pressed={m.id === activeMenuId}
                onClick={() => setActiveMenuId(m.id)}
              >
                {m.name}
              </button>
            ))}
          </div>
        )}

        {activeMenu && (
          <>
            <h2 className="menu-page-title">{activeMenu.name}</h2>
            <ChildMenuView
              key={`${activeMenu.id}-${resetKey}`}
              menu={activeMenu}
              onConfirm={handleConfirm}
              confirming={submitting}
            />
          </>
        )}
      </div>
    </div>
  );
}
