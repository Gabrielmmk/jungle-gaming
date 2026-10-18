import { get, set, del } from 'idb-keyval'
import { SCHEMA_VERSION } from '@/mocks/fixtures/seed'
import type { DbState } from '@/mocks/db/types'

const STORAGE_KEY = 'greenmint:mock-db'

/**
 * Carrega o estado persistido no IndexedDB. Se não houver estado salvo,
 * ou se o `schemaVersion` armazenado não corresponder à versão atual do
 * schema, o estado é tratado como inexistente (invalidado) e `undefined`
 * é retornado — chamadores devem então recorrer ao seed.
 */
export const loadState = async (): Promise<DbState | undefined> => {
  const stored = await get<DbState>(STORAGE_KEY)
  if (!stored) return undefined
  if (stored.schemaVersion !== SCHEMA_VERSION) return undefined
  return stored
}

export const saveState = async (state: DbState): Promise<void> => {
  await set(STORAGE_KEY, state)
}

export const resetState = async (): Promise<void> => {
  await del(STORAGE_KEY)
}
