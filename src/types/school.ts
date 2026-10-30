// Tipos do módulo de escolas

// Escola completa (retornada pela API)
export interface School {
  id: number;
  name: string;
  address: string;
  phone: string;
  shifts: string[];

  code?: string;

  canteenUserId?: number;
  canteenName?: string;
  canteenEmail?: string;
}

// Dados enviados para criar uma escola
export interface CreateSchoolRequest {
  name: string;
  address: string;
  phone: string;
  shifts: string[];

  canteenName: string;
  canteenEmail: string;
  canteenPassword: string;
}

// Dados enviados para atualizar uma escola
export interface UpdateSchoolRequest {
  name: string;
  address: string;
  phone: string;
  shifts: string[];
}