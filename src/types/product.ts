// Tipos do módulo de produtos

export interface Product {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  categoryName: string;
}

// Payload para criar/atualizar um produto

export interface ProductPayload {
  name: string;
  price: number;
  categoryId: number;
}