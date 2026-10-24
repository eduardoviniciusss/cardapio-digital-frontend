// Serviço de produtos: CRUD com a API.

import api from '@/services/api';
import type { Product, ProductPayload } from '@/types/product';

/** Lista todos os produtos da escola do usuário logado */
export async function getProducts(): Promise<Product[]> {
  const response = await api.get<Product[]>('/products');
  return response.data;
}

/** Cria um novo produto */
export async function createProduct(data: ProductPayload): Promise<Product> {
  const response = await api.post<Product>('/products', data);
  return response.data;
}

/** Atualiza um produto existente */
export async function updateProduct(id: number, data: ProductPayload): Promise<void> {
  await api.put(`/products/${id}`, data);
}

/** Exclui um produto */
export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`);
}
