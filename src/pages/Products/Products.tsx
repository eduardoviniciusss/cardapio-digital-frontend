// Tela de Produtos: CRUD exclusivo da Cantina.
// Lista os produtos da escola, organizados por categoria.

import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/services/productService';
import { getCategories } from '@/services/categoryService';
import { extractApiErrorMessage } from '@/services/authService';
import { formatCurrency } from '@/utils/format';
import type { Product } from '@/types/product';
import type { Category } from '@/types/category';
import './Products.css';

type ViewState = 'loading' | 'no-school' | 'forbidden' | 'error' | 'ready';

export default function Products() {
  const [view, setView] = useState<ViewState>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Campos do formulário
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<number | ''>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Carrega produtos e categorias ao montar
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [prods, cats] = await Promise.all([getProducts(), getCategories()]);
        if (!active) return;
        setProducts(prods);
        setCategories(cats);
        setView('ready');
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
        setErrorMsg(extractApiErrorMessage(err, 'Erro ao carregar produtos.'));
        setView('error');
      }
    }
    load();
    return () => { active = false; };
  }, []);

  // Ordena produtos por nome da categoria e depois por nome do produto
  const sortedProducts = [...products].sort((a, b) => {
    const catCmp = a.categoryName.localeCompare(b.categoryName, 'pt-BR');
    if (catCmp !== 0) return catCmp;
    return a.name.localeCompare(b.name, 'pt-BR');
  });

  function resetForm() {
    setFormName('');
    setFormPrice('');
    setFormCategoryId('');
    setEditingId(null);
    setFormError('');
  }

  function startEdit(product: Product) {
    setFormName(product.name);
    // Exibe o preço com vírgula para o usuário brasileiro
    setFormPrice(product.price.toFixed(2).replace('.', ','));
    setFormCategoryId(product.categoryId);
    setEditingId(product.id);
    setFormError('');
  }

  /** Converte o texto de preço (aceita vírgula ou ponto) para number */
  function parsePrice(text: string): number {
    const normalized = text.trim().replace(',', '.');
    return Math.round(parseFloat(normalized) * 100) / 100;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Informe o nome do produto.');
      return;
    }

    const price = parsePrice(formPrice);
    if (isNaN(price) || price <= 0) {
      setFormError('O preço deve ser maior que zero.');
      return;
    }

    if (formCategoryId === '') {
      setFormError('Selecione uma categoria.');
      return;
    }

    const payload = {
      name: formName.trim(),
      price,
      categoryId: Number(formCategoryId),
    };

    setSubmitting(true);
    try {
      if (editingId === null) {
        // Cria novo produto
        const created = await createProduct(payload);
        setProducts(prev => [...prev, created]);
      } else {
        // Atualiza produto existente
        await updateProduct(editingId, payload);
        // Atualiza o produto na lista local
        const cat = categories.find(c => c.id === payload.categoryId);
        setProducts(prev =>
        prev.map(p =>
        p.id === editingId
        ? {
          ...p,
          name: payload.name,
          price: payload.price,
          categoryId: payload.categoryId,
          categoryName: cat ? cat.name : p.categoryName,
        }
      : p,
  ),
);
      }
      resetForm();
    } catch (err) {
      setFormError(extractApiErrorMessage(err, 'Erro ao salvar produto.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      setFormError(extractApiErrorMessage(err, 'Erro ao excluir produto.'));
    }
  }

  // --- Renderização ---
  if (view === 'loading') return <p className="page-status">Carregando…</p>;
  if (view === 'forbidden') return <p className="page-status">Você não tem permissão para acessar esta página.</p>;
  if (view === 'error') return <p className="page-status" role="alert">{errorMsg}</p>;

  if (view === 'no-school') {
    return (
      <div className="products-page">
        <h1>Produtos</h1>
        <p className="page-status">
          Sua conta ainda não está vinculada a uma escola. Peça a um Administrador para criar a escola e vincular à sua conta.
        </p>
      </div>
    );
  }

  // Verifica se há categorias cadastradas
  const hasCategories = categories.length > 0;

  return (
    <div className="products-page">
      <h1>Produtos</h1>

      {!hasCategories && (
        <div className="info-alert" role="alert">
          Você precisa cadastrar pelo menos uma categoria antes de adicionar produtos.
          {' '}<Link to="/categorias">Ir para Categorias</Link>
        </div>
      )}

      <div className="products-layout">
        {/* Formulário — só aparece se houver categorias */}
        {hasCategories && (
          <form className="panel" onSubmit={handleSubmit} noValidate>
            <h2>{editingId ? 'Editar produto' : 'Novo produto'}</h2>

            {formError && <div className="form-alert" role="alert">{formError}</div>}

            <div className="field">
              <label htmlFor="prod-name">Nome</label>
              <input
                id="prod-name"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                aria-invalid={!!formError && !formName.trim()}
              />
            </div>

            <div className="field">
              <label htmlFor="prod-price">Preço (R$)</label>
              <input
                id="prod-price"
                inputMode="decimal"
                value={formPrice}
                onChange={e => setFormPrice(e.target.value)}
                placeholder="0,00"
                aria-invalid={!!formError && (isNaN(parsePrice(formPrice)) || parsePrice(formPrice) <= 0)}
              />
            </div>

            <div className="field">
              <label htmlFor="prod-category">Categoria</label>
              <select
                id="prod-category"
                value={formCategoryId}
                onChange={e => setFormCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
                aria-invalid={!!formError && formCategoryId === ''}
              >
                <option value="">Selecione…</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Salvando…' : editingId ? 'Salvar alterações' : 'Cadastrar produto'}
              </button>
              {editingId !== null && (
                <button type="button" className="btn-secondary" onClick={resetForm}>Cancelar</button>
              )}
            </div>
          </form>
        )}

        {/* Lista de produtos */}
        <div className="panel">
          <h2>Produtos cadastrados ({products.length})</h2>
          {formError && !hasCategories && <div className="form-alert" role="alert">{formError}</div>}
          {products.length === 0 ? (
            <p>Nenhum produto cadastrado.</p>
          ) : (
            <ul className="item-list">
              {sortedProducts.map(p => (
                <li key={p.id} className="item-row">
                  <div>
                    <strong>{p.name}</strong>
                    <span className="item-detail">{p.categoryName}</span>
                    <span className="item-detail item-price">{formatCurrency(p.price)}</span>
                  </div>
                  <div className="item-actions">
                    <button className="btn-link" onClick={() => startEdit(p)}>Editar</button>
                    <button className="btn-link btn-danger" onClick={() => handleDelete(p.id)}>Excluir</button>
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
