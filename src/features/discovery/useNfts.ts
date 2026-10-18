import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query'
import { api } from '@/shared/http/axios'
import { listNftsResponseSchema, type ListNftsResponse } from '@/contracts/nft'
import type { NftSearch } from '@/features/discovery/useNftSearch'

/**
 * Normaliza a busca para uma chave de query estável: ordena arrays
 * (`categories`/`networks`) e remove chaves `undefined`/vazias. Sem isso,
 * duas renderizações com o mesmo conjunto de filtros poderiam gerar
 * arrays com identidades diferentes (mesma ordem lógica, nova referência)
 * e invalidar o cache do React Query sem necessidade — o que também
 * prejudica o comportamento de `keepPreviousData` e o "latest wins" em
 * requisições fora de ordem.
 */
function normalizeKey(search: NftSearch): Record<string, unknown> {
  const normalized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(search)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      if (value.length === 0) continue
      normalized[key] = [...value].sort()
      continue
    }
    if (value === '') continue
    normalized[key] = value
  }

  return normalized
}

interface UseNftsResult {
  items: ListNftsResponse['items']
  total: number
  page: number
  pageSize: number
  facets: ListNftsResponse['facets']
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  refetch: UseQueryResult<ListNftsResponse, Error>['refetch']
}

/**
 * Busca a listagem de NFTs via REST mockado, validando a resposta com Zod
 * antes de devolvê-la tipada. A queryKey usa `normalizeKey(search)` para
 * manter identidade estável entre renders com os mesmos filtros, e
 * `placeholderData: keepPreviousData` evita "piscar" a lista ao trocar de
 * página/filtro (mantém os dados anteriores visíveis até a nova resposta
 * chegar).
 */
export function useNfts(search: NftSearch): UseNftsResult {
  const query = useQuery({
    queryKey: ['nfts', normalizeKey(search)],
    queryFn: async () => {
      const { data } = await api.get('/nfts', { params: search })
      return listNftsResponseSchema.parse(data)
    },
    placeholderData: keepPreviousData,
  })

  return {
    items: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? search.page,
    pageSize: query.data?.pageSize ?? search.pageSize,
    facets: query.data?.facets ?? { categories: {}, networks: {} },
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    refetch: query.refetch,
  }
}
