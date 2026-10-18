const STORAGE_KEY = 'greenmint:token'

let memoryToken: string | null = null

/** Persiste o token de sessão simulado no localStorage (fallback em memória). */
export const tokenStore = {
  get(): string | null {
    if (memoryToken) return memoryToken
    try {
      memoryToken = window.localStorage.getItem(STORAGE_KEY)
    } catch {
      /* ambiente sem localStorage */
    }
    return memoryToken
  },
  set(token: string): void {
    memoryToken = token
    try {
      window.localStorage.setItem(STORAGE_KEY, token)
    } catch {
      /* ignore */
    }
  },
  clear(): void {
    memoryToken = null
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  },
}
