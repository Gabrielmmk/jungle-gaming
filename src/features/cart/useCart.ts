import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/http/axios'
import { quoteSchema, cartLineSchema, type Quote } from '@/contracts/cart'
import { z } from 'zod'

const cartLinesSchema = z.array(cartLineSchema)

const fetchCart = async () => {
  const { data } = await api.get('/cart')
  return cartLinesSchema.parse(data)
}

const fetchQuote = async (coupon: string | null): Promise<Quote> => {
  const { data } = await api.post('/cart/quote', coupon ? { coupon } : {})
  return quoteSchema.parse(data)
}

/**
 * Estado do carrinho: linhas persistidas (`['cart']`) + cotação derivada
 * (`['quote', coupon]`, fonte da verdade dos valores). Mutations invalidam
 * ambas. O cupom é estado local que entra na queryKey da cotação.
 */
export function useCart() {
  const queryClient = useQueryClient()
  const [coupon, setCoupon] = useState<string | null>(null)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['cart'] })
    queryClient.invalidateQueries({ queryKey: ['quote'] })
  }

  const cartQuery = useQuery({ queryKey: ['cart'], queryFn: fetchCart })
  const quoteQuery = useQuery({ queryKey: ['quote', coupon], queryFn: () => fetchQuote(coupon) })

  const add = useMutation({
    mutationFn: (vars: { nftId: string; qty?: number }) =>
      api.post('/cart', { nftId: vars.nftId, qty: vars.qty ?? 1 }),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: (vars: { nftId: string; qty: number }) =>
      api.patch(`/cart/${vars.nftId}`, { qty: vars.qty }),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (nftId: string) => api.delete(`/cart/${nftId}`),
    onSuccess: invalidate,
  })

  const lines = cartQuery.data ?? []
  const count = lines.reduce((sum, l) => sum + l.qty, 0)

  return {
    lines,
    count,
    quote: quoteQuery.data,
    isLoading: cartQuery.isLoading || quoteQuery.isLoading,
    isError: cartQuery.isError || quoteQuery.isError,
    refetch: () => {
      cartQuery.refetch()
      quoteQuery.refetch()
    },
    coupon,
    applyCoupon: (code: string) => setCoupon(code),
    removeCoupon: () => setCoupon(null),
    add,
    update,
    remove,
  }
}
