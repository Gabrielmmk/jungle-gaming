import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import type { EventEnvelope } from '@/contracts/events'
import { EVENTS } from '@/contracts/events'
import type { ListNftsResponse, Nft } from '@/contracts/nft'

/**
 * URL do endpoint de socket.io mockado. DEVE casar exatamente com o
 * `ws.link(...)` usado em src/mocks/socket/handlers.ts — o MSW intercepta
 * por essa URL independentemente da origem real da página.
 */
const SOCKET_URL = 'ws://localhost/socket'

interface NftUpdatedPayload extends Partial<Nft> {
  id: string
}

const isNftUpdatedEnvelope = (
  envelope: EventEnvelope<unknown>,
): envelope is EventEnvelope<NftUpdatedPayload> => {
  const payload = envelope.payload
  return typeof payload === 'object' && payload !== null && typeof (payload as { id?: unknown }).id === 'string'
}

/**
 * Mantém uma conexão socket.io única e escuta `nft.updated`, aplicando as
 * atualizações recebidas diretamente no cache do React Query — sem exigir
 * refetch. Projetada para tolerar eventos duplicados/fora de ordem: a
 * atualização só é aplicada se `envelope.version` for ESTRITAMENTE maior
 * que a `version` já presente no cache para aquele NFT (nunca regride).
 *
 * No-ops com segurança em SSR/testes (sem `window`) e não lança caso o
 * socket não consiga conectar — a app continua funcional só com REST.
 */
export function useNftEvents(): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const socket = io(SOCKET_URL, { transports: ['websocket'] })

    const applyUpdate = (envelope: EventEnvelope<unknown>): void => {
      if (!isNftUpdatedEnvelope(envelope)) return
      const { payload } = envelope

      // Varre todas as queries de listagem de NFTs já cacheadas (uma por
      // combinação de params) e atualiza somente o item cujo id bate,
      // respeitando a regra de versão (nunca regredir).
      const queries = queryClient.getQueriesData<ListNftsResponse>({ queryKey: ['nfts'] })
      for (const [queryKey, data] of queries) {
        if (!data) continue

        let changed = false
        const items = data.items.map((nft) => {
          if (nft.id !== payload.id) return nft
          if (envelope.version <= nft.version) return nft
          changed = true
          return { ...nft, ...payload, version: envelope.version }
        })

        if (changed) {
          queryClient.setQueryData<ListNftsResponse>(queryKey, { ...data, items })
        }
      }
    }

    socket.on(EVENTS.nftUpdated, applyUpdate)

    return () => {
      socket.off(EVENTS.nftUpdated, applyUpdate)
      socket.close()
    }
  }, [queryClient])
}
