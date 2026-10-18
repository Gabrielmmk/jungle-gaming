import { z } from 'zod'

export const WALLET_NETWORKS = ['Ethereum', 'Polygon', 'Solana'] as const

export const walletSchema = z.object({
  id: z.string(),
  label: z.string(),
  address: z.string(),
  network: z.enum(WALLET_NETWORKS),
})
export type Wallet = z.infer<typeof walletSchema>

export const walletInputSchema = z.object({
  label: z.string().min(1, 'Informe um apelido para a carteira'),
  address: z
    .string()
    .min(1, 'Informe o endereço da carteira')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Endereço inválido (esperado 0x + 40 hex)'),
  network: z.enum(WALLET_NETWORKS),
})
export type WalletInput = z.infer<typeof walletInputSchema>
