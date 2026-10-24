// Tipos do módulo de cardápios

import type { School } from '@/types/school';

export interface Menu {
  id: number;
  name: string;
  school: School;
}

// Vínculo cardápio-produto (GET /menu-products)
export interface MenuProduct {
  menuId: number;
  menu: string;
  productId: number;
  product: string;
  category: string;
}

// Payload para criar/atualizar cardápio
export interface MenuPayload {
  name: string;
  schoolId: number;
}

// Payload para vincular produto ao cardápio
export interface MenuProductPayload {
  menuId: number;
  productId: number;
}
