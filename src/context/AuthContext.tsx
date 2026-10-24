// Contexto de autenticação: fornece user, login, logout e loading.
// Ao fazer login, salva o nome do usuário em localStorage porque o token JWT não contém o nome.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthContextType, User } from '@/types/auth';
import * as authService from '@/services/authService';

const AuthContext = createContext<AuthContextType | null>(null);

/** Decodifica o payload de um JWT (parte entre os dois pontos) */
function decodeToken(token: string): Record<string, unknown> {
  const payload = token.split('.')[1];
  return JSON.parse(atob(payload));
}

/** Monta o objeto User a partir dos claims do token + nome salvo em localStorage */
function userFromToken(token: string): User {
  const claims = decodeToken(token);
  const savedName = localStorage.getItem('cardapio:name');
  return {
    id: Number(claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']),
    // O token não tem o nome; usamos o nome salvo no localStorage ou o e-mail como fallback
    name: savedName || String(claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']),
    email: String(claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']),
    role: String(claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Ao montar, tenta restaurar a sessão a partir do token salvo
  useEffect(() => {
    const token = localStorage.getItem('cardapio:token');
    if (token) {
      try {
        setUser(userFromToken(token));
      } catch {
        localStorage.removeItem('cardapio:token');
        localStorage.removeItem('cardapio:name');
      }
    }
    setLoading(false);
  }, []);

  // Escuta o evento de sessão expirada (401)
  useEffect(() => {
    const handler = () => {
      localStorage.removeItem('cardapio:name');
      setUser(null);
    };
    window.addEventListener('cardapio:unauthorized', handler);
    return () => window.removeEventListener('cardapio:unauthorized', handler);
  }, []);

  async function login(email: string, password: string) {
    const response = await authService.login({ email, password });
    localStorage.setItem('cardapio:token', response.token);

    // Salva o nome do usuário no localStorage (o token não contém essa informação)
    if (response.user?.name) {
      localStorage.setItem('cardapio:name', response.user.name);
    }

    setUser(userFromToken(response.token));
  }

  function logout() {
    localStorage.removeItem('cardapio:token');
    localStorage.removeItem('cardapio:name');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fora do AuthProvider');
  return ctx;
}