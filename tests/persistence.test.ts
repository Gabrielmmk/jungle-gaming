import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { createDb, type MockDb } from '@/mocks/db/createDb'
import { loadState, resetState } from '@/mocks/persistence/indexeddb'
import { buildSeed } from '@/mocks/fixtures/seed'

let db: MockDb

beforeEach(async () => {
  await resetState()
  db = createDb()
})

describe('persistência IndexedDB', () => {
  it('persist() salva o estado mutado e loadState() faz round-trip', async () => {
    const id = db.listNfts({ page: 1, pageSize: 1 }).items[0].id
    db.bumpNftVersion(id, { priceEth: '9.9' })

    await db.persist()

    const loaded = await loadState()
    expect(loaded).toBeDefined()
    const persistedNft = loaded!.nfts.find((n) => n.id === id)
    expect(persistedNft?.version).toBe(2)
    expect(persistedNft?.priceEth).toBe('9.9')
  })

  it('resetScenario() reconstrói a partir do seed e persiste', async () => {
    const id = db.listNfts({ page: 1, pageSize: 1 }).items[0].id
    db.bumpNftVersion(id, { priceEth: '9.9' })
    await db.persist()

    await db.resetScenario()

    const afterReset = db.getNft(id)!
    expect(afterReset.version).toBe(1)

    const seed = buildSeed()
    const all = db.listNfts({ page: 1, pageSize: 100 })
    expect(all.total).toBe(seed.nfts.length)

    const loaded = await loadState()
    expect(loaded).toBeDefined()
    const persistedNft = loaded!.nfts.find((n) => n.id === id)
    expect(persistedNft?.version).toBe(1)
  })
})
