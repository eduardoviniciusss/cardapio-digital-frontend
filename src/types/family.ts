// Tipos do módulo de responsável e filhos

import type { School } from '@/types/school';

// Dados do responsável
export interface Parent {
  id: number;
  name: string;
  cpf: string;
  phone: string;
  userId: number;
}

// Payload para completar o cadastro de responsável
export interface ParentPayload {
  name: string;
  cpf: string;
  phone: string;
}

// Filho cadastrado
export interface Child {
  id: number;
  name: string;
  birthDate: string;
  phone: string;
  parentId: number;
  parent: Parent;
  schoolId: number;
  school: School;
}

// Payload para cadastrar um filho
export interface ChildPayload {
  name: string;
  birthDate: string;
  phone: string;
  schoolCode: string;
}


// Cardápio com produtos (resposta de GET /children/{id}/menus)
export interface ChildMenu {
  id: number;
  name: string;
  products: ChildMenuProduct[];
}

export interface ChildMenuProduct {
  id: number;
  name: string;
  price: number;
  category: string;
}
