// Cardápio visto pelo responsável: itens em cards agrupados por categoria,
// escolha de um item por categoria, resumo com total e botão de confirmar.
// O componente não fala com a API: quem confirma é a página (onConfirm).

import { useMemo, useState } from 'react';
import { formatCurrency } from '@/utils/format';
import type { ChildMenu, ChildMenuProduct } from '@/types/family';
import './ChildMenuView.css';

// O backend ainda não envia imagem do produto, então escolhemos um emoji
// pelo nome/categoria. Se não bater com nenhum, usa o prato padrão.
const ICONS: Array<[string[], string]> = [
  [['suco'], '🧃'],
  [['agua'], '💧'],
  [['refrigerante', 'refri'], '🥤'],
  [['bebida'], '🥤'],
  [['pipoca'], '🍿'],
  [['salada'], '🥗'],
  [['macarrao', 'massa'], '🍝'],
  [['pizza'], '🍕'],
  [['sanduiche', 'lanche', 'hamburguer'], '🥪'],
  [['bolo', 'doce', 'sobremesa'], '🍰'],
  [['fruta'], '🍎'],
  [['prato', 'almoco', 'marmita'], '🍱'],
  [['promocao'], '🏷️'],
];

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function iconFor(product: ChildMenuProduct): string {
  const text = normalize(`${product.name} ${product.category ?? ''}`);
  const found = ICONS.find(([keys]) => keys.some(k => text.includes(k)));
  return found ? found[1] : '🍽️';
}

/** O que o responsável escolheu, entregue para a página no onConfirm */
export interface MenuSelection {
  menuId: number;
  productIds: number[];
  total: number;
}

interface Props {
  menu: ChildMenu;
  onConfirm: (selection: MenuSelection) => void;
  /** true enquanto a página está enviando o agendamento */
  confirming?: boolean;
}

export default function ChildMenuView({ menu, onConfirm, confirming = false }: Props) {
  // categoria -> id do produto escolhido
  const [selected, setSelected] = useState<Record<string, number>>({});

  // Agrupa os produtos por categoria, mantendo a ordem em que aparecem
  const groups = useMemo(() => {
    const map = new Map<string, ChildMenuProduct[]>();
    menu.products.forEach(p => {
      const key = p.category?.trim() || 'Outros';
      map.set(key, [...(map.get(key) ?? []), p]);
    });
    return Array.from(map, ([category, products]) => ({ category, products }));
  }, [menu.products]);

  const chosen = groups.flatMap(g => {
    const product = g.products.find(p => p.id === selected[g.category]);
    return product ? [{ category: g.category, product }] : [];
  });
  const total = chosen.reduce((sum, c) => sum + c.product.price, 0);

  function choose(category: string, productId: number) {
    setSelected(prev => ({ ...prev, [category]: productId }));
  }

  function handleConfirm() {
    if (chosen.length === 0) return;
    onConfirm({
      menuId: menu.id,
      productIds: chosen.map(c => c.product.id),
      total,
    });
  }

  if (menu.products.length === 0) {
    return <p className="menu-empty">Este cardápio ainda não tem produtos.</p>;
  }

  return (
    <section className="cmv" aria-label={menu.name}>
      {groups.map(group => (
        <fieldset key={group.category} className="cmv-group">
          <legend className="cmv-group-label">
            {group.category} <span>({group.products.length})</span>
          </legend>

          {group.products.map(product => {
            const isSelected = selected[group.category] === product.id;
            return (
              <label
                key={product.id}
                className={`cmv-option${isSelected ? ' is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name={`menu-${menu.id}-${group.category}`}
                  checked={isSelected}
                  onChange={() => choose(group.category, product.id)}
                />
                <span className="cmv-radio" aria-hidden="true" />
                <span className="cmv-thumb" aria-hidden="true">{iconFor(product)}</span>
                <span className="cmv-info">
                  <span className="cmv-name">{product.name}</span>
                  <span className="cmv-price">{formatCurrency(product.price)}</span>
                </span>
              </label>
            );
          })}
        </fieldset>
      ))}

      <div className={`cmv-summary${chosen.length === 0 ? ' is-empty' : ''}`} aria-live="polite">
        {chosen.length === 0 ? (
          <p className="cmv-hint">Escolha ao menos um item para continuar.</p>
        ) : (
          <>
            {chosen.map(c => (
              <div key={c.category} className="cmv-row">
                <span>{c.category}</span>
                <strong>{c.product.name}</strong>
              </div>
            ))}
            <div className="cmv-row cmv-total">
              <span>Total</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
            <button type="button" className="cmv-clear" onClick={() => setSelected({})}>
              Limpar escolha
            </button>
          </>
        )}
      </div>

      <button
        type="button"
        className="cmv-confirm"
        onClick={handleConfirm}
        disabled={chosen.length === 0 || confirming}
      >
        {confirming ? 'Enviando…' : 'Confirmar agendamento'}
      </button>
    </section>
  );
}
