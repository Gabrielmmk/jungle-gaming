import { useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { api } from '@/shared/http/axios'
import { orderSchema, type CreateOrderInput, type Order } from '@/contracts/order'

const newKey = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `idem-${Math.random().toString(36).slice(2)}`

const isTimeout = (e: unknown): boolean =>
  e instanceof AxiosError && (e.code === 'ECONNABORTED' || /timeout/i.test(e.message))

/**
 * Cria o pedido com uma chave de idempotência estável por tentativa. Um
 * timeout (ex.: cenário `order-timeout`) é recuperado com retry usando a
 * MESMA chave — o servidor devolve o mesmo pedido, sem duplicar a compra.
 * Após uma mudança de conteúdo (ex.: cotação desatualizada → 409), chame
 * `resetKey()` antes de reenviar para gerar uma nova chave.
 */
const postOrderWithRetry = async (
  key: string,
  input: CreateOrderInput,
  attempts = 3,
): Promise<Order> => {
  for (let i = 0; i < attempts; i++) {
    try {
      const { data } = await api.post('/orders', input, {
        headers: { 'Idempotency-Key': key },
        timeout: 2000,
      })
      return orderSchema.parse(data)
    } catch (e) {
      if (isTimeout(e) && i < attempts - 1) continue
      throw e
    }
  }
  throw new Error('Falha ao criar o pedido')
}

export function useCheckout() {
  const queryClient = useQueryClient()
  const keyRef = useRef<string>(newKey())

  const submit = useMutation({
    mutationFn: (input: CreateOrderInput) => postOrderWithRetry(keyRef.current, input),
    onSuccess: (order) => {
      queryClient.setQueryData(['order', order.id], order)
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['quote'] })
    },
  })

  return { submit, resetKey: () => (keyRef.current = newKey()) }
}
