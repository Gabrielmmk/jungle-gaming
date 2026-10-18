import { setupWorker } from 'msw/browser'
import { handlers } from '@/mocks/rest/handlers'
import { socketHandler } from '@/mocks/socket/handlers'
import { db } from '@/mocks/db/instance'
import { emitNftUpdated } from '@/mocks/socket/emitter'
import { loadState } from '@/mocks/persistence/indexeddb'

export const worker = setupWorker(...handlers, socketHandler)

declare global {
  interface Window {
    __greenmint?: {
      emitNftUpdated: typeof emitNftUpdated
      resetScenario: typeof db.resetScenario
      db: typeof db
    }
  }
}

/**
 * Ativa a camada de mocks no browser: carrega (best-effort) o estado
 * persistido no IndexedDB para dentro do db singleton e inicia o
 * MSW worker. Pensado para ser chamado uma única vez, antes de montar a
 * app (ver main.tsx).
 *
 * Também expõe `window.__greenmint` com ganchos de dev/E2E
 * (emitNftUpdated, resetScenario, db) para permitir disparar eventos e
 * resetar o estado manualmente no console ou via Playwright (Camada 6),
 * sem depender de UI ainda inexistente.
 */
export async function enableMocks(): Promise<void> {
  if (typeof window === 'undefined') return

  // Best-effort: se não houver estado persistido (ou o schema estiver
  // desatualizado), o db mantém o seed com o qual já foi criado.
  try {
    const persisted = await loadState()
    if (persisted) {
      db.hydrate(persisted)
    }
  } catch {
    // Ignora falhas de IndexedDB (ex.: ambiente sem suporte) — segue com o seed.
  }

  await worker.start({ onUnhandledRequest: 'bypass' })

  window.__greenmint = { emitNftUpdated, resetScenario: db.resetScenario, db }
}
