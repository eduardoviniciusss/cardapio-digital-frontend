// Tela de Cardápios: CRUD de cardápios e gestão de vínculos com produtos.
// Exclusivo da Cantina.

import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { getMySchool } from '@/services/schoolService';
import {
  getMenus,
  createMenu,
  updateMenu,
  deleteMenu,
  getMenuProducts,
  addMenuProduct,
  removeMenuProduct,
} from '@/services/menuService';
import { getProducts } from '@/services/productService';
import { extractApiErrorMessage } from '@/services/authService';
import type { Menu, MenuProduct } from '@/types/menu';
import type { Product } from '@/types/product';
import './Menus.css';

type ViewState = 'loading' | 'no-school' | 'forbidden' | 'error' | 'ready';

export default function Menus() {
  const [view, setView] = useState<ViewState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [schoolId, setSchoolId] = useState<number | null>(null);

  const [menus, setMenus] = useState<Menu[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [links, setLinks] = useState<MenuProduct[]>([]);

  // Formulário do cardápio
  const [formName, setFormName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Alerta geral (erros nas operações de vínculo)
  const [alertMsg, setAlertMsg] = useState('');

  // Select de produto por cardápio (armazena a seleção temporária)
  const [addProductSelection, setAddProductSelection] = useState<Record<number, number | ''>>({});

  useEffect(() => {
    let active = true;

    async function load() {
      // 1. Obter a escola do usuário logado
      let sid: number;
      try {
        const school = await getMySchool();
        sid = school.id;
      } catch (err: unknown) {
        if (!active) return;
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 404) { setView('no-school'); return; }
        if (status === 403) { setView('forbidden'); return; }
        setErrorMsg(extractApiErrorMessage(err, 'Erro ao carregar escola.'));
        setView('error');
        return;
      }

      // 2. Carregar cardápios, produtos e vínculos em paralelo
      try {
        const [menuList, prodList, linkList] = await Promise.all([
          getMenus(),
          getProducts(),
          getMenuProducts(),
        ]);
        if (!active) return;

        // Filtra vínculos pelos ids dos cardápios carregados
        const menuIds = new Set(menuList.map(m => m.id));
        const filteredLinks = linkList.filter(l => menuIds.has(l.menuId));

        setSchoolId(sid);
        setMenus(menuList);
        setProducts(prodList);
        setLinks(filteredLinks);
        setView('ready');
      } catch (err: unknown) {
        if (!active) return;
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 404) { setView('no-school'); return; }
        setErrorMsg(extractApiErrorMessage(err, 'Erro ao carregar cardápios.'));
        setView('error');
      }
    }
    load();
    return () => { active = false; };
  }, []);

  // --- Helpers do formulário ---
  function resetForm() {
    setFormName('');
    setEditingId(null);
    setFormError('');
  }

  function startRename(menu: Menu) {
    setFormName(menu.name);
    setEditingId(menu.id);
    setFormError('');
  }

  // --- Submissão do cardápio ---
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Informe o nome do cardápio.');
      return;
    }
    if (schoolId === null) {
      setFormError('Escola não encontrada.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId === null) {
        // Criar novo cardápio
        const created = await createMenu({ name: formName.trim(), schoolId });
        setMenus(prev => [...prev, created]);
      } else {
        // Renomear cardápio existente
        await updateMenu(editingId, { name: formName.trim(), schoolId });
        setMenus(prev =>
          prev.map(m => (m.id === editingId ? { ...m, name: formName.trim() } : m)),
        );
      }
      resetForm();
    } catch (err) {
      setFormError(extractApiErrorMessage(err, 'Erro ao salvar cardápio.'));
    } finally {
      setSubmitting(false);
    }
  }

  // --- Excluir cardápio ---
  async function handleDeleteMenu(id: number) {
    if (!window.confirm('Tem certeza que deseja excluir este cardápio?')) return;
    try {
      await deleteMenu(id);
      setMenus(prev => prev.filter(m => m.id !== id));
      setLinks(prev => prev.filter(l => l.menuId !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      setAlertMsg(extractApiErrorMessage(err, 'Erro ao excluir cardápio.'));
    }
  }

  // --- Adicionar produto ao cardápio ---
  async function handleAddProduct(menuId: number) {
    const productId = addProductSelection[menuId];
    if (!productId) return;

    setAlertMsg('');
    try {
      const created = await addMenuProduct({ menuId, productId: Number(productId) });
      setLinks(prev => [...prev, created]);
      // Limpa a seleção
      setAddProductSelection(prev => ({ ...prev, [menuId]: '' }));
    } catch (err) {
      setAlertMsg(extractApiErrorMessage(err, 'Erro ao adicionar produto ao cardápio.'));
    }
  }

  // --- Remover produto do cardápio ---
  async function handleRemoveProduct(menuId: number, productId: number) {
    setAlertMsg('');
    try {
      await removeMenuProduct(menuId, productId);
      setLinks(prev => prev.filter(l => !(l.menuId === menuId && l.productId === productId)));
    } catch (err) {
      setAlertMsg(extractApiErrorMessage(err, 'Erro ao remover produto do cardápio.'));
    }
  }

  // --- Produtos disponíveis para um cardápio (que ainda não estão nele) ---
  function availableProducts(menuId: number): Product[] {
    const linkedIds = new Set(
      links.filter(l => l.menuId === menuId).map(l => l.productId),
    );
    return products.filter(p => !linkedIds.has(p.id));
  }

  // --- Renderização ---
  if (view === 'loading') return <p className="page-status">Carregando…</p>;
  if (view === 'forbidden') return <p className="page-status">Você não tem permissão para acessar esta página.</p>;
  if (view === 'error') return <p className="page-status" role="alert">{errorMsg}</p>;

  if (view === 'no-school') {
    return (
      <div className="menus-page">
        <h1>Cardápios</h1>
        <p className="page-status">
          Sua conta ainda não está vinculada a uma escola. Peça a um Administrador para criar a escola e vincular à sua conta.
        </p>
      </div>
    );
  }

  const hasProducts = products.length > 0;

  return (
    <div className="menus-page">
      <h1>Cardápios</h1>

      {/* Alerta geral */}
      {alertMsg && <div className="form-alert" role="alert">{alertMsg}</div>}

      {/* Aviso se não há produtos */}
      {!hasProducts && (
        <div className="info-alert" role="alert">
          Você precisa cadastrar pelo menos um produto antes de montar cardápios.
          {' '}<Link to="/produtos">Ir para Produtos</Link>
        </div>
      )}

      {/* Formulário de cardápio */}
      <form className="panel menus-form" onSubmit={handleSubmit} noValidate>
        <h2>{editingId ? 'Renomear cardápio' : 'Novo cardápio'}</h2>
        {formError && <div className="form-alert" role="alert">{formError}</div>}

        <div className="menus-form-row">
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="menu-name">Nome do cardápio</label>
            <input
              id="menu-name"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              aria-invalid={!!formError && !formName.trim()}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Salvando…' : editingId ? 'Salvar' : 'Criar cardápio'}
            </button>
            {editingId !== null && (
              <button type="button" className="btn-secondary" onClick={resetForm}>Cancelar</button>
            )}
          </div>
        </div>
      </form>

      {/* Lista de cardápios */}
      {menus.length === 0 ? (
        <p className="page-status">Nenhum cardápio cadastrado.</p>
      ) : (
        <div className="menus-grid">
          {menus.map(menu => {
            const menuLinks = links.filter(l => l.menuId === menu.id);
            const available = availableProducts(menu.id);
            const selectedProd = addProductSelection[menu.id] ?? '';

            return (
              <div key={menu.id} className="panel menu-card">
                <div className="menu-card-header">
                  <h3>{menu.name}</h3>
                  <div className="item-actions">
                    <button className="btn-link" onClick={() => startRename(menu)}>Renomear</button>
                    <button className="btn-link btn-danger" onClick={() => handleDeleteMenu(menu.id)}>Excluir</button>
                  </div>
                </div>

                {/* Chips dos produtos vinculados */}
                <div className="menu-chips">
                  {menuLinks.length === 0 ? (
                    <span className="menu-empty">Nenhum produto vinculado.</span>
                  ) : (
                    menuLinks.map(link => (
                      <span key={`${link.menuId}-${link.productId}`} className="chip">
                        {link.product} <small>({link.category})</small>
                        <button
                          className="chip-remove"
                          onClick={() => handleRemoveProduct(link.menuId, link.productId)}
                          aria-label={`Remover ${link.product}`}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Adicionar produto */}
                {hasProducts && available.length > 0 && (
                  <div className="menu-add-product">
                    <label htmlFor={`add-prod-${menu.id}`} className="sr-only">Adicionar produto</label>
                    <select
                      id={`add-prod-${menu.id}`}
                      value={selectedProd}
                      onChange={e =>
                        setAddProductSelection(prev => ({
                          ...prev,
                          [menu.id]: e.target.value === '' ? '' : Number(e.target.value),
                        }))
                      }
                    >
                      <option value="">Adicionar produto…</option>

                    {available.map(p => (
                    <option key={p.id} value={p.id}>
                    {p.name} ({p.categoryName})
                    </option>
                    ))}
                    </select>
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      disabled={selectedProd === ''}
                      onClick={() => handleAddProduct(menu.id)}
                    >
                      Adicionar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
