// Serviço de autenticação: login e cadastro.

import api from '@/services/api';
import type { LoginRequest, LoginResponse, RegisterRequest } from '@/types/auth';
import { AxiosError } from 'axios';

/** Faz login e devolve token + dados do usuário */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/login', data);
  return response.data;
}

/** Registra um novo usuário. O backend responde com texto simples. */
export async function register(data: RegisterRequest): Promise<string> {
  const response = await api.post<string>('/users', data);
  return response.data;
}

/**
 * Mapa de tradução: mensagens do backend (em inglês) → mensagens amigáveis (em português).
 * A comparação é feita após normalizar (minúsculas, sem ponto final).
 */
const TRANSLATION_MAP: Record<string, string> = {
  'name is required': 'Informe o nome.',
  'email is required': 'Informe o e-mail.',
  'password is required': 'Informe a senha.',
  'invalid user role': 'Papel de usuário inválido.',
  'email already registered': 'Este e-mail já está cadastrado.',
  'user not found': 'E-mail não cadastrado.',
  'incorrect password': 'Senha incorreta.',
  'school not found': 'Escola não encontrada. Verifique se há uma escola vinculada à sua conta.',
  'all fields are required': 'Preencha todos os campos.',
  'provide at least one shift': 'Selecione pelo menos um turno.',
  'the cantina user provided does not exist': 'A Cantina escolhida não existe.',
  'the user provided doesn\'t have the canteen role': 'O usuário escolhido não tem o papel de Cantina.',
  'this cantina user already has a school linked': 'Esta Cantina já possui uma escola vinculada.',
  'category not found': 'Categoria não encontrada.',
  'price must be greater than zero': 'O preço deve ser maior que zero.',
  'product not found': 'Produto não encontrado.',
  'menu not found': 'Cardápio não encontrado.',
  'this product is already in the menu': 'Este produto já está no cardápio.',
  'product already exists in menu': 'Este produto já está no cardápio.',
  'product belongs to another school': 'Este produto pertence a outra escola.',
  'link not found': 'Vínculo não encontrado.',
  'cpf is required': 'Informe o CPF.',
  'phone is required': 'Informe o telefone.',
  'this user already has a parent registration': 'Você já completou o cadastro de responsável.',
  'parent not found': 'Cadastro de responsável não encontrado.',
  'child not found': 'Filho não encontrado.',
  'invalid school': 'Escolha uma escola válida.',
  'birth date is required': 'Informe a data de nascimento.',
  'this child is already registered at this school': 'Este filho já está cadastrado nesta escola.',
  'this child is already linked to another school and cannot be registered again':
    'Este filho já está vinculado a outra escola e não pode ser cadastrado de novo.',
};

/** Normaliza uma mensagem para comparação: minúsculas, sem ponto final, sem espaços extras */
function normalize(msg: string): string {
  return msg.trim().toLowerCase().replace(/\.\s*$/, '');
}

/** Traduz uma mensagem do backend usando o mapa. Retorna null se não encontrar. */
function translateMessage(msg: string): string | null {
  const key = normalize(msg);

  // Busca direta no mapa
  if (TRANSLATION_MAP[key]) return TRANSLATION_MAP[key];

  // Violação de unicidade do Postgres
  if (key.includes('duplicate key value violates unique constraint')) {
    return 'Este cadastro já existe e não pode ser duplicado.';
  }

  return null;
}

/** Verifica se o texto parece ser um stack trace ou mensagem técnica */
function isStackTrace(text: string): boolean {
  return (
    text.length > 300 ||
    text.includes('Exception') ||
    text.includes('StackTrace') ||
    text.includes(' at System.') ||
    text.includes(' at Microsoft.') ||
    text.includes(' at Npgsql.')
  );
}

/**
 * Extrai uma mensagem amigável de um erro da API.
 * - Traduz mensagens conhecidas do backend para português.
 * - Nunca exibe stack traces ao usuário.
 * - Trata erros de rede (backend desligado).
 */
export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    // Sem resposta do servidor (rede fora, backend desligado)
    if (!error.response) {
      return 'Não foi possível conectar à API (se estiver testando localmente, confirme que o backend está rodando; se for o Render, ele pode estar "dormindo", então aguarde alguns segundos).';
    }

    const { status, data } = error.response;

    // Mensagens por status HTTP
    if (status === 401) return 'Sua sessão expirou. Entre novamente.';
    if (status === 403) return 'Você não tem permissão para realizar esta ação.';
    if (status === 500) {
      // Tenta traduzir a mensagem do 500, mas se for stack trace usa o fallback genérico
      if (typeof data === 'string' && !isStackTrace(data)) {
        const translated = translateMessage(data);
        if (translated) return translated;
      }
      return 'Ocorreu um erro inesperado no servidor. Tente novamente em instantes.';
    }

    // ProblemDetails com campo errors
    if (data && typeof data === 'object' && 'errors' in data) {
      const pd = data as { errors: Record<string, string[]> };
      const msgs = Object.values(pd.errors).flat();
      if (msgs.length > 0) {
        // Traduz cada mensagem individualmente
        const translated = msgs.map(m => translateMessage(m) ?? m);
        return translated.join(' ');
      }
    }

    // Texto simples
    if (typeof data === 'string' && data.length > 0) {
      // Filtra stack traces
      if (isStackTrace(data)) {
        return fallback;
      }
      // Tenta traduzir
      const translated = translateMessage(data);
      if (translated) return translated;
      return data;
    }
  }
  return fallback;
}