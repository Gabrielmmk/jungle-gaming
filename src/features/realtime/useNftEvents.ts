import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import type { EventEnvelope } from '@/contracts/events'
import { EVENTS } from '@/contracts/events'
import type { ListNftsResponse, Nft } from '@/contracts/nft'
import { useSession } from '@/features/auth/useSession'

/**
 * URL do endpoint de socket.io mockado. DEVE casar exatamente com o
 * `ws.link(...)` usado em src/mocks/socket/handlers.ts — o MSW intercepta
 * por essa URL independentemente da origem real da página.
 */
const SOCKET_URL = 'ws://localhost/socket'

export interface NftUpdatedPayload extends Partial<Nft> {
  id: string
}

const isNftUpdatedEnvelope = (
  envelope: EventEnvelope<unknown>,
): envelope is EventEnvelope<NftUpdatedPayload> => {
  const payload = envelope.payload
  return (
    typeof payload === 'object' &&
    payload !== null &&
    typeof (payload as { id?: unknown }).id === 'string'
  )
}

/**
 * Decide se um envelope `nft.updated` deve ser aplicado a um NFT já em
 * cache, e retorna o resultado — função pura, sem acesso a cache/React
 * Query, para poder ser testada isoladamente da conexão de socket.
 *
 * Regra: só aplica se `envelope.version` for ESTRITAMENTE maior que a
 * `version` do NFT em cache (nunca regride; versão igual ou menor é
 * ignorada). Se o `id` do payload não bater com o do NFT em cache, ou se a
 * versão não avançar, retorna o mesmo `cachedNft` (referência inalterada),
 * o que permite ao chamador detectar "nada mudou" por `===`.
 */
export function applyNftUpdate(cachedNft: Nft, envelope: EventEnvelope<NftUpdatedPayload>): Nft {
  const { payload } = envelope
  if (cachedNft.id !== payload.id) return cachedNft
  if (envelope.version <= cachedNft.version) return cachedNft
  return { ...cachedNft, ...payload, version: envelope.version }
}

export interface UseNftEventsOptions {
  /**
   * Chamado de forma síncrona (dentro do handler do socket) sempre que um
   * evento `nft.updated` é efetivamente aplicado (ou seja, passou a regra de
   * versão) a ALGUM NFT presente no cache — lista e/ou detalhe. Pensado para
   * que uma rota monte um indicador acessível ("preço atualizado") sem
   * precisar de uma segunda conexão de socket; o próprio `useNftEvents` é a
   * única fonte da verdade sobre a conexão.
   */
  onApplied?: (nft: Nft) => void
}

/**
 * Mantém uma conexão socket.io única e escuta `nft.updated`, aplicando as
 * atualizações recebidas diretamente no cache do React Query — sem exigir
 * refetch. Atualiza tanto as queries de listagem (`['nfts', ...]`) quanto o
 * cache de detalhe (`['nft', id]`) do(s) NFT(s) afetados, para que catálogo e
 * tela de detalhe reflitam o mesmo evento independentemente de qual estiver
 * montada.
 *
 * Projetada para tolerar eventos duplicados/fora de ordem: a atualização só
 * é aplicada se `envelope.version` for ESTRITAMENTE maior que a `version`
 * já presente no cache para aquele NFT (nunca regride).
 *
 * No-ops com segurança em SSR/testes (sem `window`) e não lança caso o
 * socket não consiga conectar — a app continua funcional só com REST.
 */
export function useNftEvents(options: UseNftEventsOptions = {}): void {
  const queryClient = useQueryClient()
  // A conexão carrega o userId da sessão (o handler mock lê `?userId=` no
  // handshake) para que eventos por usuário (ex.: order.updated) sejam
  // roteados corretamente. Ao trocar de usuário/deslogar, o userId muda e o
  // efeito reconecta — liberando a subscription anterior.
  const { user } = useSession()
  const userId = user?.id ?? 'anon'

  // Guarda a versão mais recente do callback em um ref, lido de dentro do
  // handler do socket — evita precisar incluir `onApplied` nas deps do
  // efeito de conexão (o que forçaria reconectar o socket a cada re-render
  // do consumidor só porque ele passou uma nova função inline). A escrita
  // no ref acontece em um efeito próprio (nunca durante a renderização).
  const onAppliedRef = useRef(options.onApplied)
  useEffect(() => {
    onAppliedRef.current = options.onApplied
  }, [options.onApplied])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const socket = io(SOCKET_URL, { transports: ['websocket'], query: { userId } })

    const applyUpdate = (envelope: EventEnvelope<unknown>): void => {
      if (!isNftUpdatedEnvelope(envelope)) return
      const { payload } = envelope

      let applied: Nft | undefined

      // Varre todas as queries de listagem de NFTs já cacheadas (uma por
      // combinação de params) e atualiza somente o item cujo id bate,
      // respeitando a regra de versão (nunca regredir).
      const listQueries = queryClient.getQueriesData<ListNftsResponse>({ queryKey: ['nfts'] })
      for (const [queryKey, data] of listQueries) {
        if (!data) continue

        let changed = false
        const items = data.items.map((nft) => {
          const next = applyNftUpdate(nft, envelope)
          if (next === nft) return nft
          changed = true
          applied = next
          return next
        })

        if (changed) {
          queryClient.setQueryData<ListNftsResponse>(queryKey, { ...data, items })
        }
      }

      // Cache de detalhe (`['nft', id]`) — mesmo evento, mesma regra de
      // versão, para a tela de detalhe refletir sem precisar de refetch.
      const detailQueries = queryClient.getQueriesData<Nft>({ queryKey: ['nft', payload.id] })
      for (const [queryKey, nft] of detailQueries) {
        if (!nft) continue
        const next = applyNftUpdate(nft, envelope)
        if (next === nft) continue
        applied = next
        queryClient.setQueryData<Nft>(queryKey, next)
      }

      if (applied) {
        onAppliedRef.current?.(applied)
      }
    }

    socket.on(EVENTS.nftUpdated, applyUpdate)

    return () => {
      socket.off(EVENTS.nftUpdated, applyUpdate)
      socket.close()
    }
  }, [queryClient, userId])
}
