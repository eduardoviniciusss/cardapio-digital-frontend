// Tela "Meus pedidos" (rota /meus-pedidos): o responsável vê os lanches que
// agendou e pode cancelar os que ainda não passaram.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cancelOrder, getMyOrders } from '@/services/orderService';
import { extractApiErrorMessage } from '@/services/authService';
import { formatCurrency, todayInputValue } from '@/utils/format';
import type { Order } from '@/types/order';
import { formatOrderDate, orderDay } from './orderDate';
import './Orders.css';

type ViewState = 'loading' | 'error' | 'needs-registration' | 'ready';

export default function MyOrders() {
  const [view, setView] = useState<ViewState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);

  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await getMyOrders();
        if (!active) return;
        setOrders(data);
        setView('ready');
      } catch (err: unknown) {
        if (!active) return;
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 404) {
          // Responsável sem cadastro completo: ainda não tem pedidos
          setView('needs-registration');
          return;
        }
        setErrorMsg(extractApiErrorMessage(err, 'Erro ao carregar os pedidos.'));
        setView('error');
      }
    }
    load();
    return () => { active = false; };
  }, []);

  async function handleCancel(order: Order) {
    const when = formatOrderDate(order.date);
    if (!window.confirm(`Cancelar o lanche de ${order.childName} em ${when}?`)) return;

    setActionError('');
    setActionSuccess('');
    setCancellingId(order.id);
    try {
      await cancelOrder(order.id);
      setOrders(prev => prev.filter(o => o.id !== order.id));
      setActionSuccess(`Agendamento de ${when} cancelado.`);
    } catch (err) {
      setActionError(extractApiErrorMessage(err, 'Erro ao cancelar o agendamento.'));
    } finally {
      setCancellingId(null);
    }
  }

  if (view === 'loading') return <p className="page-status">Carregando…</p>;
  if (view === 'error') return <p className="page-status" role="alert">{errorMsg}</p>;

  if (view === 'needs-registration') {
    return (
      <div className="orders-page">
        <h1>Meus pedidos</h1>
        <div className="info-alert" role="status">
          Complete o cadastro de responsável para agendar lanches.{' '}
          <Link to="/filhos">Completar cadastro</Link>
        </div>
      </div>
    );
  }

  const today = todayInputValue();
  const upcoming = orders
    .filter(o => orderDay(o.date) >= today)
    .sort((a, b) => orderDay(a.date).localeCompare(orderDay(b.date)));
  const past = orders.filter(o => orderDay(o.date) < today);

  function renderCard(order: Order, canCancel: boolean) {
    return (
      <li key={order.id} className={`order-card${canCancel ? '' : ' is-past'}`}>
        <div className="order-card__head">
          <div className="order-card__who">
            <strong>{formatOrderDate(order.date)}</strong>
            <span className="order-chip">{order.childName}</span>
          </div>
          <strong className="order-card__total">{formatCurrency(order.total)}</strong>
        </div>
        <p className="order-card__menu">{order.menuName}</p>
        <ul className="order-card__items">
          {order.items.map(item => (
            <li key={item.productId}>
              <span>
                {item.name}
                <small>{item.category}</small>
              </span>
              <span>{formatCurrency(item.price)}</span>
            </li>
          ))}
        </ul>
        {canCancel && (
          <div className="order-card__actions">
            <button
              type="button"
              className="btn-link btn-danger"
              onClick={() => handleCancel(order)}
              disabled={cancellingId === order.id}
            >
              {cancellingId === order.id ? 'Cancelando…' : 'Cancelar agendamento'}
            </button>
          </div>
        )}
      </li>
    );
  }

  return (
    <div className="orders-page">
      <h1>Meus pedidos</h1>
      <p>
        <Link to="/filhos">Agendar um novo lanche →</Link>
      </p>

      {actionError && <div className="form-alert" role="alert">{actionError}</div>}
      {actionSuccess && <div className="form-success" role="status">{actionSuccess}</div>}

      {orders.length === 0 ? (
        <p className="page-status">Você ainda não agendou nenhum lanche.</p>
      ) : (
        <>
          <h2 className="orders-section-title">Próximos ({upcoming.length})</h2>
          {upcoming.length === 0 ? (
            <p>Nenhum lanche agendado para os próximos dias.</p>
          ) : (
            <ul className="orders-list">{upcoming.map(o => renderCard(o, true))}</ul>
          )}

          {past.length > 0 && (
            <>
              <h2 className="orders-section-title">Anteriores ({past.length})</h2>
              <ul className="orders-list">{past.map(o => renderCard(o, false))}</ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
