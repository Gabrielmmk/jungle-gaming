import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { api } from '@/shared/http/axios'
import { listNftsResponseSchema, type ListNftsParams, type ListNftsResponse } from '@/contracts/nft'

/**
 * Busca a listagem de NFTs via REST mockado e valida a resposta com Zod
 * antes de devolvê-la tipada. `params` entra na queryKey para que cada
 * combinação de filtros/paginação tenha seu próprio cache isolado.
 */
export function useNfts(params: ListNftsParams): UseQueryResult<ListNftsResponse, Error> {
  return useQuery({
    queryKey: ['nfts', params],
    queryFn: async () => {
      const { data } = await api.get('/nfts', { params })
      return listNftsResponseSchema.parse(data)
    },
  })
}
