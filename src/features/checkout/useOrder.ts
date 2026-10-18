import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/http/axios'
import { orderSchema } from '@/contracts/order'
import { useOrderEvents } from '@/features/checkout/useOrderEvents'

/**
 * Consulta um pedido e assina seus eventos de tempo real. O pedido é
 * recuperável após refresh/reconexão (GET /orders/:id devolve o estado
 * atual) e transita de pendente → confirmado/recusado via order.updated.
 */
export function useOrder(orderId: string) {
  useOrderEvents(orderId)
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => orderSchema.parse((await api.get(`/orders/${orderId}`)).data),
    // Enquanto pendente, o estado terminal chega por socket; um refetch
    // periódico serve de rede de segurança caso o evento se perca.
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 2000 : false),
  })
}
