import type { Nft } from '@/contracts/nft'

export interface User {
  id: string
  email: string
  name: string
}

export interface Favorite {
  userId: string
  nftId: string
  addedAt: string
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

export interface Profile {
  userId: string
  displayName: string
  avatar?: string
}

export interface Wallet {
  userId: string
  balanceEth: string
}

/**
 * Estado global do "backend" mockado: catálogo compartilhado + estruturas
 * por usuário. As estruturas por usuário ficam tipadas, porém minimamente
 * populadas por agora — chunks futuros preenchem o comportamento completo.
 */
export interface DbState {
  schemaVersion: number
  users: User[]
  nfts: Nft[]
  favorites: Favorite[]
  carts: Record<string, Cart>
  orders: Record<string, Order[]>
  profiles: Record<string, Profile>
  wallets: Record<string, Wallet>
  favoritesByUser: Record<string, string[]>
}
