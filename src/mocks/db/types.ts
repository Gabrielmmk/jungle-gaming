import type { Nft } from '@/contracts/nft'
import type { User } from '@/contracts/auth'
import type { Wallet } from '@/contracts/wallet'

export type { User, Wallet }

/** Credenciais do usuário (senha hasheada — nunca em claro). */
export interface UserAuth {
  passwordHash: string
}

export interface CartItem {
  nftId: string
  qty: number
}

export interface Cart {
  userId: string
  items: CartItem[]
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
  carts: Record<string, Cart>
  orders: Record<string, Order[]>
  favoritesByUser: Record<string, string[]>
  walletsByUser: Record<string, Wallet[]>
}
