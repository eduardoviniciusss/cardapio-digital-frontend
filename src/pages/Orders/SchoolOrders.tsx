// Tela "Pedidos" (rota /pedidos): a Cantina vê os lanches agendados pelos
// responsáveis para os alunos da escola, por dia, com o resumo do que preparar.

import { useEffect, useState } from 'react';
import { getSchoolOrders } from '@/services/orderService';
import { extractApiErrorMessage } from '@/services/authService';
import { formatCurrency, todayInputValue } from '@/utils/format';
import type { Order } from '@/types/order';
import './Orders.css';

type ViewState = 'loading' | 'error' | 'no-school' | 'ready';

export default function SchoolOrders() {
  const [date, setDate] = useState(todayInputValue());
  const [view, setView] = useState<ViewState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      setView('loading');
      try {
        const data = await getSchoolOrders(date || undefined);
        if (!active) return;
        setOrders(data);
        setView('ready');
      } catch (err: unknown) {
        if (!active) return;
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 404) {
          setView('no-school');
          return;
        }
        setErrorMsg(extractApiErrorMessage(err, 'Erro ao carregar os pedidos.'));
        setView('error');
      }
    }
    load();
    return () => { active = false; };
  }, [date]);

  if (view === 'error') return <p className="page-status" role="alert">{errorMsg}</p>;

  if (view === 'no-school') {
    return (
      <div className="orders-page">
        <h1>Pedidos</h1>
        <div className="info-alert" role="status">
          Sua conta ainda não está vinculada a uma escola. Peça a um Administrador para criar a
          escola e vincular à sua conta.
        </div>
      </div>
    );
  }

  // Quantas unidades de cada item preparar naquele dia
  const counts = new Map<string, { count: number; category: string }>();
  orders.forEach(o =>
    o.items.forEach(i => {
      const current = counts.get(i.name);
      counts.set(i.name, { count: (current?.count ?? 0) + 1, category: i.category });
    }),
  );
  const summary = Array.from(counts, ([name, v]) => ({ name, ...v })).sort((a, b) =>
    a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
  );
  const totalValue = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="orders-page">
      <h1>Pedidos</h1>

      <div className="orders-filter">
        <div className="field">
          <label htmlFor="orders-date">Dia</label>
          <input
            id="orders-date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
        <button type="button" className="btn-secondary" onClick={() => setDate(todayInputValue())}>
          Hoje
        </button>
        <button type="button" className="btn-secondary" onClick={() => setDate('')}>
          Todos os dias
        </button>
      </div>

      {view === 'loading' ? (
        <p className="page-status">Carregando…</p>
      ) : orders.length === 0 ? (
        <p className="page-status">
          {date ? 'Nenhum lanche agendado para este dia.' : 'Nenhum lanche agendado ainda.'}
        </p>
      ) : (
        <>
          {date && (
            <section className="orders-summary" aria-label="Resumo do dia">
              <h2>Resumo do dia ({orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'})</h2>
              <ul>
                {summary.map(s => (
                  <li key={s.name}>
                    <span>{s.name}</span>
                    <strong>{s.count}×</strong>
                  </li>
                ))}
              </ul>
              <p className="orders-summary__total">
                <span>Total dos pedidos</span>
                <span>{formatCurrency(totalValue)}</span>
              </p>
            </section>
          )}

          <ul className="orders-list">
            {orders.map(order => (
              <li key={order.id} className="order-card">
                <div className="order-card__head">
                  <div className="order-card__who">
                    <strong>{order.childName}</strong>
                    {!date && (
                      <span className="order-chip">
                        {new Date(`${order.date.slice(0, 10)}T00:00:00Z`).toLocaleDateString('pt-BR', {
                          timeZone: 'UTC',
                        })}
                      </span>
                    )}
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
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
