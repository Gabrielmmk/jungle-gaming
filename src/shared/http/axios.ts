import axios from 'axios'

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
