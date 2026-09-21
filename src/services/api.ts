import axios from 'axios'

/**
 * Instância central do Axios.
 *
 * Toda chamada à API passa por aqui, o que nos dá um único lugar para:
 * - definir a URL base (vem do .env, nunca fica "hardcoded" no código)
 * - anexar automaticamente o token JWT em toda requisição autenticada
 * - tratar globalmente erros de sessão expirada (401)
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor de REQUEST: roda antes de toda chamada.
// Lê o token salvo no localStorage e injeta no header Authorization.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cardapio:token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor de RESPONSE: roda depois de toda resposta (ou erro).
// Se a API responder 401 (token inválido/expirado), limpamos a sessão local.
// Quem decide o que fazer com isso (ex: redirecionar) é o AuthContext,
// que escuta esse evento customizado.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cardapio:token')
      window.dispatchEvent(new Event('cardapio:unauthorized'))
    }
    return Promise.reject(error)
  }
)

export default api
