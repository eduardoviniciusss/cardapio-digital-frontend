// Serviço de cardápios: CRUD e vínculos com produtos.

import api from '@/services/api';
import type { Menu, MenuPayload, MenuProduct, MenuProductPayload } from '@/types/menu';

/** Lista todos os cardápios da escola */
export async function getMenus(): Promise<Menu[]> {
  const response = await api.get<Menu[]>('/menus');
  return response.data;
}

/** Cria um novo cardápio */
export async function createMenu(data: MenuPayload): Promise<Menu> {
  const response = await api.post<Menu>('/menus', data);
  return response.data;
}

/** Atualiza um cardápio existente */
export async function updateMenu(id: number, data: MenuPayload): Promise<void> {
  await api.put(`/menus/${id}`, data);
}

/** Exclui um cardápio */
export async function deleteMenu(id: number): Promise<void> {
  await api.delete(`/menus/${id}`);
}

/** Lista todos os vínculos cardápio-produto */
export async function getMenuProducts(): Promise<MenuProduct[]> {
  const response = await api.get<MenuProduct[]>('/menu-products');
  return response.data;
}

/** Vincula um produto a um cardápio */
export async function addMenuProduct(data: MenuProductPayload): Promise<MenuProduct> {
  const response = await api.post<MenuProduct>('/menu-products', data);
  return response.data;
}

/** Remove o vínculo de um produto com um cardápio */
export async function removeMenuProduct(menuId: number, productId: number): Promise<void> {
  await api.delete(`/menu-products/${menuId}/${productId}`);
}
