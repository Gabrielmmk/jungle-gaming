import { z } from 'zod'
import Big from 'big.js'
import {
  listNftsParamsSchema,
  type Facets,
  type ListNftsParams,
  type ListNftsResponse,
  type Nft,
} from '@/contracts/nft'
import type { ApiErrorCode } from '@/contracts/errors'
import { buildSeed } from '@/mocks/fixtures/seed'
import { saveState } from '@/mocks/persistence/indexeddb'
import type { DbState } from '@/mocks/db/types'

export interface MockDb {
  listNfts: (params: ListNftsParams) => ListNftsResponse
  getNft: (id: string) => Nft | undefined
  bumpNftVersion: (id: string, patch: Partial<Nft>) => Nft
  listFavorites: (userId: string | null) => string[]
  addFavorite: (userId: string | null, nftId: string) => void
  removeFavorite: (userId: string | null, nftId: string) => void
  persist: () => Promise<void>
  resetScenario: () => Promise<void>
  /** Substitui o estado em memória por um estado previamente persistido (ex.: IndexedDB). */
  hydrate: (nextState: DbState) => void
}

/**
 * Erro de domínio do db mockado. Carrega um `code` (ApiErrorCode) para que
 * a camada de handlers REST (fina, sem regra de negócio) traduza para o
 * status HTTP correto via HTTP_BY_CODE — sem acoplar o db a HTTP.
 */
export interface DbError extends Error {
  code: ApiErrorCode
}

export const apiError = (code: ApiErrorCode, message?: string): DbError => {
  const error = new Error(message ?? code) as DbError
  error.code = code
  return error
}

const matchesQuery = (nft: Nft, q: string): boolean => {
  const needle = q.toLowerCase()
  return nft.name.toLowerCase().includes(needle) || nft.collection.toLowerCase().includes(needle)
}

const computeFacets = (nfts: Nft[]): Facets => {
  const categories: Record<string, number> = {}
  const networks: Record<string, number> = {}
  for (const nft of nfts) {
    categories[nft.category] = (categories[nft.category] ?? 0) + 1
    networks[nft.network] = (networks[nft.network] ?? 0) + 1
  }
  return { categories, networks }
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

    // Legado: `category` único é tratado como um grupo `categories` de 1 item.
    const categories = params.categories ?? (params.category ? [params.category] : undefined)
    if (categories && categories.length > 0) {
      filtered = filtered.filter((nft) => categories.includes(nft.category))
    }

    if (params.networks && params.networks.length > 0) {
      filtered = filtered.filter((nft) => params.networks!.includes(nft.network))
    }

    if (params.minPrice) {
      const min = new Big(params.minPrice)
      filtered = filtered.filter((nft) => new Big(nft.priceEth).gte(min))
    }

    if (params.maxPrice) {
      const max = new Big(params.maxPrice)
      filtered = filtered.filter((nft) => new Big(nft.priceEth).lte(max))
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

    // Facets são globais (sobre todo o catálogo) — independem dos filtros
    // ativos, para que a UI mostre contagens estáveis ao lado de cada opção.
    const facets = computeFacets(state.nfts)

    return { items, total, page: params.page, pageSize: params.pageSize, facets }
  }

  const getNft = (id: string): Nft | undefined => state.nfts.find((nft) => nft.id === id)

  const requireUserId = (userId: string | null): string => {
    if (userId == null) {
      throw apiError('unauthorized', 'unauthorized: sessão necessária para favoritos')
    }
    return userId
  }

  const listFavorites = (userId: string | null): string[] => {
    const uid = requireUserId(userId)
    return state.favoritesByUser[uid] ?? []
  }

  const addFavorite = (userId: string | null, nftId: string): void => {
    const uid = requireUserId(userId)
    const current = state.favoritesByUser[uid] ?? []
    if (current.includes(nftId)) return
    state = {
      ...state,
      favoritesByUser: { ...state.favoritesByUser, [uid]: [...current, nftId] },
    }
  }

  const removeFavorite = (userId: string | null, nftId: string): void => {
    const uid = requireUserId(userId)
    const current = state.favoritesByUser[uid] ?? []
    state = {
      ...state,
      favoritesByUser: { ...state.favoritesByUser, [uid]: current.filter((id) => id !== nftId) },
    }
  }

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

  return {
    listNfts,
    getNft,
    bumpNftVersion,
    listFavorites,
    addFavorite,
    removeFavorite,
    persist,
    resetScenario,
    hydrate,
  }
}
