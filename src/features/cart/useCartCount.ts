import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from '@/shared/http/axios'
import { cartLineSchema } from '@/contracts/cart'

const cartLinesSchema = z.array(cartLineSchema)

/** Contagem de itens do carrinho para o badge do Header (sem cotação). */
export function useCartCount(): number {
  const { data } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => cartLinesSchema.parse((await api.get('/cart')).data),
  })
  return (data ?? []).reduce((sum, l) => sum + l.qty, 0)
}
