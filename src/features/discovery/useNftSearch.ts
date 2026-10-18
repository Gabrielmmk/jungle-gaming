import { z } from 'zod'

/**
 * Schema do estado de busca/filtros da Descoberta, persistido na URL via
 * `validateSearch` da rota `/` (TanStack Router). Mantido aqui — e não em
 * `contracts/nft.ts` — porque é um contrato de UI/URL, não da API: os
 * campos de preço chegam como string (o que o usuário digita num input),
 * enquanto `listNftsParamsSchema` já espera os tipos que a API consome.
 */
export const nftSearchSchema = z.object({
  q: z.string().optional(),
  categories: z.array(z.string()).optional(),
  networks: z.array(z.string()).optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'recent']).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(60).default(12),
})

export type NftSearch = z.infer<typeof nftSearchSchema>

/**
 * Faz o parse de um valor bruto (ex.: search params da URL) aplicando os
 * defaults do schema. Função pura — sem acesso a router/URL.
 */
export function parseSearch(raw: unknown): NftSearch {
  return nftSearchSchema.parse(raw)
}

/**
 * Campos que representam "filtros" (em oposição a paginação). Qualquer
 * patch que toque um desses campos deve resetar `page` para 1, pois o
 * conjunto de resultados muda e a página atual pode deixar de existir.
 */
const FILTER_KEYS = ['q', 'categories', 'networks', 'minPrice', 'maxPrice', 'sort'] as const

/**
 * Deriva o próximo estado de busca a partir do atual + um patch parcial.
 * Se o patch tocar algum campo de filtro, `page` é resetado para 1. Se o
 * patch tocar somente `page`/`pageSize`, os demais campos são preservados
 * e `page` NÃO é resetado (permite navegação de paginação).
 */
export function nextSearch(current: NftSearch, patch: Partial<NftSearch>): NftSearch {
  const touchesFilter = FILTER_KEYS.some((key) => key in patch)

  const merged: NftSearch = {
    ...current,
    ...patch,
  }

  if (touchesFilter) {
    merged.page = 1
  }

  return merged
}
