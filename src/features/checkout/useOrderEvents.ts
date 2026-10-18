import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { EVENTS, type EventEnvelope } from '@/contracts/events'
import { orderSchema, type Order } from '@/contracts/order'
import { useSession } from '@/features/auth/useSession'

const SOCKET_URL = 'ws://localhost/socket'

interface OrderUpdatedPayload {
  id: string
  status: Order['status']
}

/**
 * Escuta `order.updated` e atualiza o cache `['order', id]` do pedido
 * observado. O evento é roteado por usuário no servidor (emitOrderUpdated),
 * então eventos de outro usuário não chegam aqui. O socket conecta com o
 * `userId` da sessão; é liberado no unmount.
 */
export function useOrderEvents(orderId: string | undefined): void {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const userId = user?.id ?? 'anon'

  useEffect(() => {
    if (typeof window === 'undefined' || !orderId) return
    const socket = io(SOCKET_URL, { transports: ['websocket'], query: { userId } })

    const onOrderUpdated = (envelope: EventEnvelope<OrderUpdatedPayload>) => {
      if (envelope.payload?.id !== orderId) return
      const current = queryClient.getQueryData<Order>(['order', orderId])
      if (!current) {
        // Sem snapshot em cache ainda: busca o estado atual via REST
        // (reconciliação após reconexão/refresh).
        queryClient.invalidateQueries({ queryKey: ['order', orderId] })
        return
      }
      // Atualiza só o status (o recibo/snapshot vem do REST e não regride).
      const next = orderSchema.safeParse({ ...current, status: envelope.payload.status })
      if (next.success) queryClient.setQueryData(['order', orderId], next.data)
    }

    socket.on(EVENTS.orderUpdated, onOrderUpdated)
    return () => {
      socket.off(EVENTS.orderUpdated, onOrderUpdated)
      socket.close()
    }
  }, [queryClient, orderId, userId])
}
