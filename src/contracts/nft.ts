import { z } from 'zod'

export const nftSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string(),
  collection: z.string(),
  priceEth: z.string(),
  category: z.string(),
  available: z.number().int(),
  version: z.number().int(),
})
export type Nft = z.infer<typeof nftSchema>

export const listNftsParamsSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'recent']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(12),
})
export type ListNftsParams = z.infer<typeof listNftsParamsSchema>

export const listNftsResponseSchema = z.object({
  items: z.array(nftSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
})
export type ListNftsResponse = z.infer<typeof listNftsResponseSchema>
