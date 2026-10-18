import { z } from 'zod'
import Big from 'big.js'
import {
  listNftsParamsSchema,
  type ListNftsParams,
  type ListNftsResponse,
  type Nft,
} from '@/contracts/nft'
import { buildSeed } from '@/mocks/fixtures/seed'
import { saveState } from '@/mocks/persistence/indexeddb'
import type { DbState } from '@/mocks/db/types'

export interface MockDb {
  listNfts: (params: ListNftsParams) => ListNftsResponse
  getNft: (id: string) => Nft | undefined
  bumpNftVersion: (id: string, patch: Partial<Nft>) => Nft
  persist: () => Promise<void>
  resetScenario: () => Promise<void>
  /** Substitui o estado em memória por um estado previamente persistido (ex.: IndexedDB). */
  hydrate: (nextState: DbState) => void
}

const matchesQuery = (nft: Nft, q: string): boolean => {
  const needle = q.toLowerCase()
  return nft.name.toLowerCase().includes(needle) || nft.collection.toLowerCase().includes(needle)
}

// O schema público (listNftsParamsSchema) limita pageSize a 60 — é a
// validação de borda para a futura camada de API (REST/sockets). O db
// em si é uma camada de domínio interna e aceita qualquer pageSize >= 1,
// sem impor o teto de transporte.
const internalPageSizeSchema = z.coerce.number().int().min(1).default(12)

/**
 * Cria o "banco" mockado em memória. Todas as leituras (listNfts, getNft)
 * são síncronas e puras — operam sobre o estado mantido no closure.
 */
export const createDb = (initialState?: DbState): MockDb => {
  let state: DbState = initialState ?? buildSeed()

  const listNfts = (rawParams: ListNftsParams): ListNftsResponse => {
    const { pageSize: rawPageSize, ...rest } = rawParams
    const base = listNftsParamsSchema.omit({ pageSize: true }).parse(rest)
    const pageSize = internalPageSizeSchema.parse(rawPageSize)
    const params = { ...base, pageSize }

    let filtered = state.nfts.slice()

    if (params.q) {
      filtered = filtered.filter((nft) => matchesQuery(nft, params.q!))
    }

    if (params.category) {
      filtered = filtered.filter((nft) => nft.category === params.category)
    }

    if (params.sort === 'price_asc') {
      filtered = filtered.sort((a, b) => new Big(a.priceEth).cmp(new Big(b.priceEth)))
    } else if (params.sort === 'price_desc') {
      filtered = filtered.sort((a, b) => new Big(b.priceEth).cmp(new Big(a.priceEth)))
    } else if (params.sort === 'recent') {
      filtered = filtered.slice().reverse()
    }

    const total = filtered.length
    const start = (params.page - 1) * params.pageSize
    const items = filtered.slice(start, start + params.pageSize)

    return { items, total, page: params.page, pageSize: params.pageSize }
  }

  const getNft = (id: string): Nft | undefined => state.nfts.find((nft) => nft.id === id)

  const bumpNftVersion = (id: string, patch: Partial<Nft>): Nft => {
    const index = state.nfts.findIndex((nft) => nft.id === id)
    if (index === -1) {
      throw new Error(`NFT não encontrado: ${id}`)
    }
    const current = state.nfts[index]
    const updated: Nft = { ...current, ...patch, version: current.version + 1 }
    state = { ...state, nfts: state.nfts.map((nft, i) => (i === index ? updated : nft)) }
    return updated
  }

  // A persistência é assíncrona e isolada em persist()/resetScenario();
  // as leituras (listNfts/getNft) permanecem síncronas e puras.
  const persist = async (): Promise<void> => {
    await saveState(state)
  }

  const resetScenario = async (): Promise<void> => {
    state = buildSeed()
    await saveState(state)
  }

  const hydrate = (nextState: DbState): void => {
    state = nextState
  }

  return { listNfts, getNft, bumpNftVersion, persist, resetScenario, hydrate }
}
