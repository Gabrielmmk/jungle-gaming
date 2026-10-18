import type { Nft } from '@/contracts/nft'
import type { User } from '@/contracts/auth'
import type { Wallet } from '@/contracts/wallet'
import type { CartLine } from '@/contracts/cart'
import type { Order } from '@/contracts/order'

export type { User, Wallet, CartLine, Order }

/** Credenciais do usuário (senha hasheada — nunca em claro). */
export interface UserAuth {
  passwordHash: string
}

/** Pedido armazenado + metadados internos (dono + versão para order.updated). */
export interface StoredOrder {
  order: Order
  userId: string
  version: number
  /** Assinatura do conteúdo: reusar a chave de idempotência com conteúdo
   * diferente gera conflito; igual recupera o mesmo pedido. */
  sig: string
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
  /** Pedidos indexados por id (snapshot + dono + versão). */
  ordersById: Record<string, StoredOrder>
  /** Chave de idempotência → orderId (mesma tentativa recupera o mesmo pedido). */
  idempotencyKeys: Record<string, string>
  favoritesByUser: Record<string, string[]>
  walletsByUser: Record<string, Wallet[]>
}
