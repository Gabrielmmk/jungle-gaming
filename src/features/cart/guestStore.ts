const STORAGE_KEY = 'greenmint:guest'

let memoryGuest: string | null = null

const generate = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `guest-${Math.random().toString(36).slice(2)}`

/**
 * Identidade de visitante para o carrinho antes do login. Persistida no
 * localStorage para o carrinho sobreviver a refresh; enviada no header
 * `X-Guest-Id` e usada no merge ao autenticar.
 */
export const guestStore = {
  get(): string {
    if (memoryGuest) return memoryGuest
    try {
      memoryGuest = window.localStorage.getItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    if (!memoryGuest) {
      memoryGuest = generate()
      try {
        window.localStorage.setItem(STORAGE_KEY, memoryGuest)
      } catch {
        /* ignore */
      }
    }
    return memoryGuest
  },
  clear(): void {
    memoryGuest = null
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  },
}
