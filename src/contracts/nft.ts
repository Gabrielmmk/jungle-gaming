import { z } from 'zod'

export const nftSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string(),
  images: z.array(z.string()),
  collection: z.string(),
  priceEth: z.string(),
  category: z.string(),
  network: z.enum(['Ethereum', 'Polygon', 'Solana']),
  available: z.number().int(),
  version: z.number().int(),
  description: z.string(),
  editionMinted: z.number().int(),
  editionTotal: z.number().int(),
  ratingAvg: z.number(),
  ratingCount: z.number().int(),
  format: z.string(),
  contractAddress: z.string(),
  royaltiesPct: z.string(),
  featured: z.boolean().optional(),
})
export type Nft = z.infer<typeof nftSchema>

export const listNftsParamsSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  categories: z.array(z.string()).optional(),
  networks: z.array(z.string()).optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'recent']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(12),
})
export type ListNftsParams = z.infer<typeof listNftsParamsSchema>

export const facetsSchema = z.object({
  categories: z.record(z.string(), z.number()),
  networks: z.record(z.string(), z.number()),
})
export type Facets = z.infer<typeof facetsSchema>

export const listNftsResponseSchema = z.object({
  items: z.array(nftSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
  facets: facetsSchema,
})
export type ListNftsResponse = z.infer<typeof listNftsResponseSchema>
