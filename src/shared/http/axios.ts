import axios, { AxiosError } from 'axios'
import { tokenStore } from '@/features/auth/tokenStore'
import { guestStore } from '@/features/cart/guestStore'

/**
 * Resolve a baseURL da API de forma segura tanto no browser (Vite) quanto
 * em Node/Vitest, onde `import.meta.env` pode não existir.
 */
const resolveBaseUrl = (): string => {
  try {
    return import.meta.env?.VITE_API_URL ?? '/api'
  } catch {
    return '/api'
  }
}

// `indexes: null` faz arrays serializarem como chaves repetidas sem
// colchetes (ex.: categories=Music&categories=Gaming), formato que o
// helper parseListParams dos handlers mock lê via searchParams.getAll(...).
export const api = axios.create({
  baseURL: resolveBaseUrl(),
  paramsSerializer: { indexes: null },
})

// Request interceptor: injeta Authorization: Bearer <token> quando há sessão.
api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  // Identidade de visitante para o carrinho (guest) — sempre enviada; o
  // servidor usa userId quando há sessão e ignora o guest nesse caso.
  try {
    config.headers.set('X-Guest-Id', guestStore.get())
  } catch {
    /* sem window (SSR/teste) */
  }
  return config
})

// Handlers de "sessão inválida" (401). A UI registra a limpeza/redirect; o
// módulo axios não conhece o router — mantém o acoplamento invertido.
type UnauthorizedHandler = () => void
const unauthorizedHandlers = new Set<UnauthorizedHandler>()

export const registerUnauthorizedHandler = (handler: UnauthorizedHandler): (() => void) => {
  unauthorizedHandlers.add(handler)
  return () => unauthorizedHandlers.delete(handler)
}

/** URLs onde um 401 é esperado (fluxo de auth) e NÃO deve disparar logout/redirect. */
const isAuthEndpoint = (url: string | undefined): boolean =>
  !!url && (/\/auth\//.test(url) || /\/session$/.test(url))

// Response interceptor: em 401 fora dos endpoints de auth, notifica os
// handlers registrados (expiração de sessão). Sempre propaga o erro.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !isAuthEndpoint(error.config?.url)) {
      for (const handler of unauthorizedHandlers) handler()
    }
    return Promise.reject(error)
  },
)
