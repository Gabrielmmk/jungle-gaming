import { z } from 'zod'
import { nftSchema } from '@/contracts/nft'

/** Linha persistida do carrinho: referência ao NFT + quantidade inteira. */
export const cartLineSchema = z.object({
  nftId: z.string(),
  qty: z.number().int().min(1),
})
export type CartLine = z.infer<typeof cartLineSchema>

export const addToCartSchema = z.object({
  nftId: z.string(),
  qty: z.number().int().min(1).default(1),
})
export type AddToCartInput = z.infer<typeof addToCartSchema>

export const updateCartItemSchema = z.object({
  qty: z.number().int().min(1),
})

/** Item da cotação: NFT completo (preço/disponibilidade atuais) + total da linha. */
export const quoteItemSchema = z.object({
  nft: nftSchema,
  qty: z.number().int(),
  lineTotalEth: z.string(),
})
export type QuoteItem = z.infer<typeof quoteItemSchema>

export const couponStatusSchema = z.object({
  code: z.string(),
  applied: z.boolean(),
  /** Motivo quando não aplicado: inválido ou expirado. */
  reason: z.enum(['invalid', 'expired']).optional(),
  /** Percentual de desconto quando aplicado (ex.: 10 = 10%). */
  percentOff: z.number().optional(),
})
export type CouponStatus = z.infer<typeof couponStatusSchema>

/**
 * Cotação (fonte da verdade para finalizar): valores em ETH como strings
 * decimais, com precisão preservada (big.js no db). `coupon` é null quando
 * nenhum código foi enviado.
 */
export const quoteSchema = z.object({
  items: z.array(quoteItemSchema),
  subtotalEth: z.string(),
  discountEth: z.string(),
  networkFeeEth: z.string(),
  totalEth: z.string(),
  coupon: couponStatusSchema.nullable(),
})
export type Quote = z.infer<typeof quoteSchema>

export const quoteRequestSchema = z.object({
  coupon: z.string().optional(),
})
export type QuoteRequest = z.infer<typeof quoteRequestSchema>
