import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { api } from '@/shared/http/axios'
import { nftSchema, type Nft } from '@/contracts/nft'

interface UseNftResult {
  nft: Nft | undefined
  isLoading: boolean
  isError: boolean
  /**
   * `true` quando o erro é especificamente um 404 (NFT inexistente) — a
   * página usa isso para renderizar um estado "não encontrado" dedicado em
   * vez do `ErrorState` genérico (que é reservado para falhas reais, ex.:
   * cenário `transient`).
   */
  notFound: boolean
  refetch: UseQueryResult<Nft, Error>['refetch']
}

/**
 * Busca o detalhe de um NFT por `id`, validando a resposta com Zod antes de
 * devolvê-la tipada. Distingue 404 (NFT não existe) de outros erros via
 * `error.response.status`, para que a página possa diferenciar "não
 * encontrado" de "falha ao carregar".
 */
export function useNft(id: string): UseNftResult {
  const query = useQuery({
    queryKey: ['nft', id],
    queryFn: async () => {
      const { data } = await api.get(`/nfts/${id}`)
      return nftSchema.parse(data)
    },
  })

  const notFound = isAxiosError(query.error) && query.error.response?.status === 404

  return {
    nft: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    notFound,
    refetch: query.refetch,
  }
}
