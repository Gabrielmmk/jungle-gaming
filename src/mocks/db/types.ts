import type { Nft } from '@/contracts/nft'
import type { User } from '@/contracts/auth'
import type { Wallet } from '@/contracts/wallet'
import type { CartLine } from '@/contracts/cart'

export type { User, Wallet, CartLine }

/** Credenciais do usuário (senha hasheada — nunca em claro). */
export interface UserAuth {
  passwordHash: string
}

export interface OrderItem {
  nftId: string
  qty: number
  priceEth: string
}

export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  totalEth: string
  createdAt: string
}

/**
 * Estado global do "backend" mockado: catálogo compartilhado + estruturas
 * por usuário (favoritos/carteiras/perfil/pedidos) + sessões e credenciais.
 */
export interface DbState {
  schemaVersion: number
  users: User[]
  usersAuth: Record<string, UserAuth>
  sessions: Record<string, string>
  nfts: Nft[]
  /** Carrinho por chave = userId (logado) ou guestId (visitante). */
  cartsByKey: Record<string, CartLine[]>
  orders: Record<string, Order[]>
  favoritesByUser: Record<string, string[]>
  walletsByUser: Record<string, Wallet[]>
}
