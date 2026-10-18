import { z } from 'zod'
import { couponStatusSchema } from '@/contracts/cart'

export const orderStatusSchema = z.enum(['pending', 'confirmed', 'refused'])
export type OrderStatus = z.infer<typeof orderStatusSchema>

/** Item do pedido como SNAPSHOT: valores congelados no momento da compra. */
export const orderItemSchema = z.object({
  nftId: z.string(),
  name: z.string(),
  image: z.string(),
  collection: z.string(),
  qty: z.number().int(),
  priceEth: z.string(),
  lineTotalEth: z.string(),
})
export type OrderItem = z.infer<typeof orderItemSchema>

export const collectorSchema = z.object({
  displayName: z.string().min(1, 'Informe o nome de exibição'),
  email: z.string().email('E-mail inválido'),
  note: z.string().optional(),
})
export type Collector = z.infer<typeof collectorSchema>

export const orderSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  txHash: z.string(),
  createdAt: z.string(),
  collector: collectorSchema,
  walletLabel: z.string(),
  network: z.string(),
  items: z.array(orderItemSchema),
  subtotalEth: z.string(),
  discountEth: z.string(),
  networkFeeEth: z.string(),
  totalEth: z.string(),
  coupon: couponStatusSchema.nullable(),
})
export type Order = z.infer<typeof orderSchema>

/**
 * Criação de pedido. `expectedTotalEth` é o total que o usuário revisou — o
 * servidor revalida contra a cotação atual e recusa (409) se divergir
 * (ex.: preço mudou via socket durante o checkout → exige nova confirmação).
 */
export const createOrderSchema = z.object({
  collector: collectorSchema,
  walletLabel: z.string().min(1, 'Selecione uma carteira'),
  network: z.string().min(1, 'Selecione uma rede'),
  coupon: z.string().optional(),
  expectedTotalEth: z.string(),
})
export type CreateOrderInput = z.infer<typeof createOrderSchema>
