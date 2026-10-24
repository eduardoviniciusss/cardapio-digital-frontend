// Tipos do módulo de escolas

// Escola completa (retornada pelo endpoint do administrador)
export interface School {
  id: number;
  name: string;
  address: string;
  phone: string;
  shifts: string[];
  canteenUserId?: number;
  canteenName?: string;
}

// Cantina disponível (sem escola vinculada)
export interface AvailableCanteen {
  id: number;
  name: string;
  email: string;
}

// Dados enviados para criar uma escola
export interface CreateSchoolRequest {
  name: string;
  address: string;
  phone: string;
  shifts: string[];
  canteenUserId: number;
}

// Dados enviados para atualizar uma escola
export interface UpdateSchoolRequest {
  name: string;
  address: string;
  phone: string;
  shifts: string[];
}

// Opção de escola para o select do responsável
export interface SchoolOption {
  id: number;
  name: string;
  address: string;
}