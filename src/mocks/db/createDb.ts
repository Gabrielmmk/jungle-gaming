import { z } from 'zod'
import Big from 'big.js'
import {
  listNftsParamsSchema,
  type Facets,
  type ListNftsParams,
  type ListNftsResponse,
  type Nft,
} from '@/contracts/nft'
import type { ApiErrorCode } from '@/contracts/errors'
import type { User, RegisterInput, LoginInput, AuthResponse } from '@/contracts/auth'
import type { ProfileUpdateInput } from '@/contracts/profile'
import { AVATAR_MAX_BYTES } from '@/contracts/profile'
import type { Wallet, WalletInput } from '@/contracts/wallet'
import type { CartLine, Quote, CouponStatus } from '@/contracts/cart'
import type { Order, OrderStatus, CreateOrderInput } from '@/contracts/order'
import { buildSeed } from '@/mocks/fixtures/seed'
import { hashPassword } from '@/mocks/db/hash'
import { saveState } from '@/mocks/persistence/indexeddb'
import type { DbState, StoredOrder } from '@/mocks/db/types'

export interface MockDb {
  listNfts: (params: ListNftsParams) => ListNftsResponse
  getNft: (id: string) => Nft | undefined
  bumpNftVersion: (id: string, patch: Partial<Nft>) => Nft
  listFavorites: (userId: string | null) => string[]
  addFavorite: (userId: string | null, nftId: string) => void
  removeFavorite: (userId: string | null, nftId: string) => void
  // Auth / sessão
  register: (input: RegisterInput) => AuthResponse
  login: (input: LoginInput) => AuthResponse
  getSession: (token: string | null) => User | undefined
  resolveUserId: (token: string | null) => string | null
  logout: (token: string | null) => void
  // Conta
  getProfile: (userId: string | null) => User
  updateProfile: (userId: string | null, patch: ProfileUpdateInput) => User
  changePassword: (userId: string | null, currentPassword: string, newPassword: string) => void
  setAvatar: (userId: string | null, avatarUrl: string | null) => User
  listWallets: (userId: string | null) => Wallet[]
  addWallet: (userId: string | null, input: WalletInput) => Wallet
  updateWallet: (userId: string | null, walletId: string, input: WalletInput) => Wallet
  // Carrinho (chave = userId logado ou guestId visitante)
  getCart: (key: string) => CartLine[]
  addToCart: (key: string, nftId: string, qty: number) => CartLine[]
  updateCartItem: (key: string, nftId: string, qty: number) => CartLine[]
  removeCartItem: (key: string, nftId: string) => CartLine[]
  mergeCart: (fromKey: string, toKey: string) => void
  quoteCart: (key: string, coupon?: string) => Quote
  // Pedidos (idempotentes; estado pendente → confirmado/recusado)
  createOrder: (userId: string | null, idempotencyKey: string, input: CreateOrderInput) => Order
  getOrder: (userId: string | null, orderId: string) => Order
  transitionOrder: (orderId: string, status: OrderStatus) => StoredOrder
  persist: () => Promise<void>
  resetScenario: () => Promise<void>
  /** Substitui o estado em memória por um estado previamente persistido (ex.: IndexedDB). */
  hydrate: (nextState: DbState) => void
  /** Apenas para testes: inspeção do estado interno. */
  __debugState: () => DbState
}

/**
 * Erro de domínio do db mockado. Carrega um `code` (ApiErrorCode) para que
 * a camada de handlers REST (fina, sem regra de negócio) traduza para o
 * status HTTP correto via HTTP_BY_CODE — sem acoplar o db a HTTP.
 */
export interface DbError extends Error {
  code: ApiErrorCode
}

export const apiError = (code: ApiErrorCode, message?: string): DbError => {
  const error = new Error(message ?? code) as DbError
  error.code = code
  return error
}

const matchesQuery = (nft: Nft, q: string): boolean => {
  const needle = q.toLowerCase()
  return nft.name.toLowerCase().includes(needle) || nft.collection.toLowerCase().includes(needle)
}

const computeFacets = (nfts: Nft[]): Facets => {
  const categories: Record<string, number> = {}
  const networks: Record<string, number> = {}
  for (const nft of nfts) {
    categories[nft.category] = (categories[nft.category] ?? 0) + 1
    networks[nft.network] = (networks[nft.network] ?? 0) + 1
  }
  return { categories, networks }
}

// O schema público (listNftsParamsSchema) limita pageSize a 60 — é a
// validação de borda para a futura camada de API (REST/sockets). O db
// em si é uma camada de domínio interna e aceita qualquer pageSize >= 1,
// sem impor o teto de transporte.
const internalPageSizeSchema = z.coerce.number().int().min(1).default(12)

/**
 * Cria o "banco" mockado em memória. Todas as leituras (listNfts, getNft)
 * são síncronas e puras — operam sobre o estado mantido no closure.
 */
export const createDb = (initialState?: DbState): MockDb => {
  let state: DbState = initialState ?? buildSeed()

  const listNfts = (rawParams: ListNftsParams): ListNftsResponse => {
    const { pageSize: rawPageSize, ...rest } = rawParams
    const base = listNftsParamsSchema.omit({ pageSize: true }).parse(rest)
    const pageSize = internalPageSizeSchema.parse(rawPageSize)
    const params = { ...base, pageSize }

    let filtered = state.nfts.slice()

    if (params.q) {
      filtered = filtered.filter((nft) => matchesQuery(nft, params.q!))
    }

    // Legado: `category` único é tratado como um grupo `categories` de 1 item.
    const categories = params.categories ?? (params.category ? [params.category] : undefined)
    if (categories && categories.length > 0) {
      filtered = filtered.filter((nft) => categories.includes(nft.category))
    }

    if (params.networks && params.networks.length > 0) {
      filtered = filtered.filter((nft) => params.networks!.includes(nft.network))
    }

    if (params.minPrice) {
      const min = new Big(params.minPrice)
      filtered = filtered.filter((nft) => new Big(nft.priceEth).gte(min))
    }

    if (params.maxPrice) {
      const max = new Big(params.maxPrice)
      filtered = filtered.filter((nft) => new Big(nft.priceEth).lte(max))
    }

    if (params.sort === 'price_asc') {
      filtered = filtered.sort((a, b) => new Big(a.priceEth).cmp(new Big(b.priceEth)))
    } else if (params.sort === 'price_desc') {
      filtered = filtered.sort((a, b) => new Big(b.priceEth).cmp(new Big(a.priceEth)))
    } else if (params.sort === 'recent') {
      filtered = filtered.slice().reverse()
    }

    const total = filtered.length
    const start = (params.page - 1) * params.pageSize
    const items = filtered.slice(start, start + params.pageSize)

    // Facets são globais (sobre todo o catálogo) — independem dos filtros
    // ativos, para que a UI mostre contagens estáveis ao lado de cada opção.
    const facets = computeFacets(state.nfts)

    return { items, total, page: params.page, pageSize: params.pageSize, facets }
  }

  const getNft = (id: string): Nft | undefined => state.nfts.find((nft) => nft.id === id)

  const requireUserId = (userId: string | null): string => {
    if (userId == null) {
      throw apiError('unauthorized', 'unauthorized: sessão necessária para favoritos')
    }
    return userId
  }

  const listFavorites = (userId: string | null): string[] => {
    const uid = requireUserId(userId)
    return state.favoritesByUser[uid] ?? []
  }

  const addFavorite = (userId: string | null, nftId: string): void => {
    const uid = requireUserId(userId)
    const current = state.favoritesByUser[uid] ?? []
    if (current.includes(nftId)) return
    state = {
      ...state,
      favoritesByUser: { ...state.favoritesByUser, [uid]: [...current, nftId] },
    }
  }

  const removeFavorite = (userId: string | null, nftId: string): void => {
    const uid = requireUserId(userId)
    const current = state.favoritesByUser[uid] ?? []
    state = {
      ...state,
      favoritesByUser: { ...state.favoritesByUser, [uid]: current.filter((id) => id !== nftId) },
    }
  }

  // --- Auth / sessão ---------------------------------------------------

  const newToken = (): string =>
    globalThis.crypto?.randomUUID?.() ?? `tok_${Math.random().toString(36).slice(2)}${Date.now()}`

  /** Token com userId embutido (prefixo antes de `~`) + parte aleatória. */
  const makeToken = (userId: string): string => `${userId}~${newToken()}`

  /** Tokens revogados por logout (em memória; o cliente também descarta o seu). */
  const revoked = new Set<string>()

  const findUserById = (userId: string): User | undefined =>
    state.users.find((u) => u.id === userId)

  const requireSessionUser = (userId: string | null): User => {
    if (userId == null) throw apiError('unauthorized', 'unauthorized: sessão necessária')
    const user = findUserById(userId)
    if (!user) throw apiError('unauthorized', 'unauthorized: usuário inexistente')
    return user
  }

  const register = (input: RegisterInput): AuthResponse => {
    const email = input.email.toLowerCase()
    if (state.users.some((u) => u.email.toLowerCase() === email)) {
      throw apiError('conflict', 'E-mail já cadastrado')
    }
    if (state.users.some((u) => u.username.toLowerCase() === input.username.toLowerCase())) {
      throw apiError('conflict', 'Nome de usuário já em uso')
    }
    const user: User = {
      id: `user-${state.users.length + 1}-${newToken().slice(0, 8)}`,
      email: input.email,
      username: input.username,
      displayName: input.displayName,
    }
    const token = makeToken(user.id)
    state = {
      ...state,
      users: [...state.users, user],
      usersAuth: { ...state.usersAuth, [user.id]: { passwordHash: hashPassword(input.password) } },
      sessions: { ...state.sessions, [token]: user.id },
      favoritesByUser: { ...state.favoritesByUser, [user.id]: [] },
      walletsByUser: { ...state.walletsByUser, [user.id]: [] },
    }
    return { token, user }
  }

  const login = (input: LoginInput): AuthResponse => {
    const user = state.users.find((u) => u.email.toLowerCase() === input.email.toLowerCase())
    const auth = user ? state.usersAuth[user.id] : undefined
    if (!user || !auth || auth.passwordHash !== hashPassword(input.password)) {
      throw apiError('unauthorized', 'E-mail ou senha inválidos')
    }
    const token = makeToken(user.id)
    state = { ...state, sessions: { ...state.sessions, [token]: user.id } }
    return { token, user }
  }

  /**
   * Token "stateless": embute o userId para que a sessão seja recuperável a
   * partir do token sozinho (sem depender do estado persistido), evitando
   * corridas com a persistência assíncrona no refresh. O userId só é aceito
   * se o usuário existir (usuários semeados sempre existem).
   */
  const resolveUserId = (token: string | null): string | null => {
    if (!token || revoked.has(token)) return null
    const embedded = token.includes('~') ? token.split('~')[0] : null
    const uid = embedded ?? state.sessions[token] ?? null
    return uid && findUserById(uid) ? uid : null
  }

  const getSession = (token: string | null): User | undefined => {
    const userId = resolveUserId(token)
    return userId ? findUserById(userId) : undefined
  }

  const logout = (token: string | null): void => {
    if (!token) return
    revoked.add(token)
    const { [token]: _removed, ...rest } = state.sessions
    void _removed
    state = { ...state, sessions: rest }
  }

  // --- Conta -----------------------------------------------------------

  const getProfile = (userId: string | null): User => requireSessionUser(userId)

  const updateProfile = (userId: string | null, patch: ProfileUpdateInput): User => {
    const user = requireSessionUser(userId)
    const emailTaken = state.users.some(
      (u) => u.id !== user.id && u.email.toLowerCase() === patch.email.toLowerCase(),
    )
    if (emailTaken) throw apiError('conflict', 'E-mail já cadastrado')
    const usernameTaken = state.users.some(
      (u) => u.id !== user.id && u.username.toLowerCase() === patch.username.toLowerCase(),
    )
    if (usernameTaken) throw apiError('conflict', 'Nome de usuário já em uso')
    const updated: User = { ...user, ...patch }
    state = { ...state, users: state.users.map((u) => (u.id === user.id ? updated : u)) }
    return updated
  }

  const changePassword = (
    userId: string | null,
    currentPassword: string,
    newPassword: string,
  ): void => {
    const user = requireSessionUser(userId)
    const auth = state.usersAuth[user.id]
    if (!auth || auth.passwordHash !== hashPassword(currentPassword)) {
      throw apiError('validation', 'Senha atual incorreta')
    }
    if (newPassword.length < 8) {
      throw apiError('validation', 'A nova senha deve ter ao menos 8 caracteres')
    }
    state = {
      ...state,
      usersAuth: { ...state.usersAuth, [user.id]: { passwordHash: hashPassword(newPassword) } },
    }
  }

  const setAvatar = (userId: string | null, avatarUrl: string | null): User => {
    const user = requireSessionUser(userId)
    if (avatarUrl && avatarUrl.length > AVATAR_MAX_BYTES) {
      throw apiError('validation', 'Imagem muito grande (máx. 256 KB)')
    }
    const updated: User = { ...user, avatarUrl: avatarUrl ?? undefined }
    state = { ...state, users: state.users.map((u) => (u.id === user.id ? updated : u)) }
    return updated
  }

  const listWallets = (userId: string | null): Wallet[] => {
    const user = requireSessionUser(userId)
    return state.walletsByUser[user.id] ?? []
  }

  const addWallet = (userId: string | null, input: WalletInput): Wallet => {
    const user = requireSessionUser(userId)
    const current = state.walletsByUser[user.id] ?? []
    if (current.some((w) => w.address.toLowerCase() === input.address.toLowerCase())) {
      throw apiError('conflict', 'Carteira com este endereço já cadastrada')
    }
    const wallet: Wallet = { id: `wallet-${newToken().slice(0, 8)}`, ...input }
    state = {
      ...state,
      walletsByUser: { ...state.walletsByUser, [user.id]: [...current, wallet] },
    }
    return wallet
  }

  const updateWallet = (userId: string | null, walletId: string, input: WalletInput): Wallet => {
    const user = requireSessionUser(userId)
    const current = state.walletsByUser[user.id] ?? []
    const index = current.findIndex((w) => w.id === walletId)
    if (index === -1) throw apiError('not_found', 'Carteira não encontrada')
    const duplicate = current.some(
      (w) => w.id !== walletId && w.address.toLowerCase() === input.address.toLowerCase(),
    )
    if (duplicate) throw apiError('conflict', 'Carteira com este endereço já cadastrada')
    const updated: Wallet = { ...current[index], ...input }
    state = {
      ...state,
      walletsByUser: {
        ...state.walletsByUser,
        [user.id]: current.map((w, i) => (i === index ? updated : w)),
      },
    }
    return updated
  }

  // --- Carrinho / cotação ----------------------------------------------

  /** Cupons simulados. `LAUNCH10`/`WELCOME5` válidos; `EXPIRED` expirado. */
  const COUPONS: Record<string, { percentOff: number; expired?: boolean }> = {
    LAUNCH10: { percentOff: 10 },
    WELCOME5: { percentOff: 5 },
    EXPIRED: { percentOff: 20, expired: true },
  }
  const NETWORK_FEE_ETH = '0.016'

  const getCart = (key: string): CartLine[] => state.cartsByKey[key] ?? []

  const setCart = (key: string, lines: CartLine[]): CartLine[] => {
    state = { ...state, cartsByKey: { ...state.cartsByKey, [key]: lines } }
    return lines
  }

  /** Quantidade máxima comprável de um NFT (disponibilidade da edição). */
  const maxQtyFor = (nftId: string): number => getNft(nftId)?.available ?? 0

  const addToCart = (key: string, nftId: string, qty: number): CartLine[] => {
    const nft = getNft(nftId)
    if (!nft) throw apiError('not_found', 'NFT não encontrado')
    const max = nft.available
    if (max <= 0) throw apiError('conflict', 'Edição esgotada')
    const current = getCart(key)
    const existing = current.find((l) => l.nftId === nftId)
    const nextQty = Math.min((existing?.qty ?? 0) + qty, max)
    const lines = existing
      ? current.map((l) => (l.nftId === nftId ? { ...l, qty: nextQty } : l))
      : [...current, { nftId, qty: Math.min(qty, max) }]
    return setCart(key, lines)
  }

  const updateCartItem = (key: string, nftId: string, qty: number): CartLine[] => {
    const max = maxQtyFor(nftId)
    if (max <= 0) throw apiError('conflict', 'Edição esgotada')
    const clamped = Math.max(1, Math.min(qty, max))
    const lines = getCart(key).map((l) => (l.nftId === nftId ? { ...l, qty: clamped } : l))
    return setCart(key, lines)
  }

  const removeCartItem = (key: string, nftId: string): CartLine[] =>
    setCart(
      key,
      getCart(key).filter((l) => l.nftId !== nftId),
    )

  /** Mescla o carrinho de `fromKey` em `toKey` (visitante → autenticado). */
  const mergeCart = (fromKey: string, toKey: string): void => {
    const from = getCart(fromKey)
    if (from.length === 0) return
    const to = getCart(toKey)
    const merged = [...to]
    for (const line of from) {
      const existing = merged.find((l) => l.nftId === line.nftId)
      const max = maxQtyFor(line.nftId)
      if (existing) {
        existing.qty = Math.min(existing.qty + line.qty, max)
      } else if (max > 0) {
        merged.push({ nftId: line.nftId, qty: Math.min(line.qty, max) })
      }
    }
    const { [fromKey]: _dropped, ...restCarts } = state.cartsByKey
    void _dropped
    state = { ...state, cartsByKey: { ...restCarts, [toKey]: merged } }
  }

  const resolveCoupon = (code?: string): CouponStatus | null => {
    if (!code) return null
    const normalized = code.trim().toUpperCase()
    const found = COUPONS[normalized]
    if (!found) return { code: normalized, applied: false, reason: 'invalid' }
    if (found.expired) return { code: normalized, applied: false, reason: 'expired' }
    return { code: normalized, applied: true, percentOff: found.percentOff }
  }

  const quoteCart = (key: string, coupon?: string): Quote => {
    const lines = getCart(key)
    const items = lines.flatMap((line) => {
      const nft = getNft(line.nftId)
      if (!nft) return []
      // Disponibilidade pode ter mudado (edição esgotada durante a compra):
      // a cotação reflete o estado atual, limitando a quantidade efetiva.
      const qty = Math.min(line.qty, nft.available)
      const lineTotalEth = new Big(nft.priceEth).times(qty).toString()
      return [{ nft, qty, lineTotalEth }]
    })

    const subtotal = items.reduce((acc, it) => acc.plus(it.lineTotalEth), new Big(0))
    const couponStatus = resolveCoupon(coupon)
    const discount =
      couponStatus?.applied && couponStatus.percentOff
        ? subtotal.times(couponStatus.percentOff).div(100)
        : new Big(0)
    const networkFee = items.length > 0 ? new Big(NETWORK_FEE_ETH) : new Big(0)
    const total = subtotal.minus(discount).plus(networkFee)

    return {
      items,
      subtotalEth: subtotal.toString(),
      discountEth: discount.toString(),
      networkFeeEth: networkFee.toString(),
      totalEth: total.toString(),
      coupon: couponStatus,
    }
  }

  // --- Pedidos ---------------------------------------------------------

  const orderSig = (input: CreateOrderInput): string =>
    JSON.stringify({
      collector: input.collector,
      wallet: input.walletLabel,
      network: input.network,
      coupon: input.coupon ?? null,
      total: input.expectedTotalEth,
    })

  const randomHex = (len: number): string => {
    let out = ''
    for (let i = 0; i < len; i++) out += Math.floor(Math.random() * 16).toString(16)
    return out
  }

  const createOrder = (
    userId: string | null,
    idempotencyKey: string,
    input: CreateOrderInput,
  ): Order => {
    const uid = requireSessionUser(userId).id
    const sig = orderSig(input)

    // Idempotência: mesma chave + mesmo conteúdo recupera o mesmo pedido;
    // mesma chave + conteúdo diferente é conflito.
    const existingId = state.idempotencyKeys[idempotencyKey]
    if (existingId) {
      const stored = state.ordersById[existingId]
      if (stored && stored.sig === sig) return stored.order
      throw apiError('conflict', 'Chave de idempotência reutilizada com conteúdo diferente')
    }

    // Revalidação: a cotação atual (pós eventos de preço/disponibilidade) é
    // a referência. Se o total divergir do revisado pelo usuário, recusa —
    // o checkout exige nova confirmação.
    const quote = quoteCart(uid, input.coupon)
    if (quote.items.length === 0) throw apiError('conflict', 'Carrinho vazio')
    if (quote.totalEth !== input.expectedTotalEth) {
      throw apiError('conflict', 'Cotação desatualizada — revise os valores')
    }

    const order: Order = {
      id: `order-${randomHex(8)}`,
      status: 'pending',
      txHash: `0x${randomHex(40)}`,
      createdAt: new Date().toISOString(),
      collector: input.collector,
      walletLabel: input.walletLabel,
      network: input.network,
      items: quote.items.map((it) => ({
        nftId: it.nft.id,
        name: it.nft.name,
        image: it.nft.image,
        collection: it.nft.collection,
        qty: it.qty,
        priceEth: it.nft.priceEth,
        lineTotalEth: it.lineTotalEth,
      })),
      subtotalEth: quote.subtotalEth,
      discountEth: quote.discountEth,
      networkFeeEth: quote.networkFeeEth,
      totalEth: quote.totalEth,
      coupon: quote.coupon,
    }

    // Decrementa disponibilidade do catálogo (reserva a edição comprada) e
    // esvazia o carrinho do usuário (remove os itens comprados).
    const purchased = new Map(order.items.map((it) => [it.nftId, it.qty]))
    const nfts = state.nfts.map((nft) => {
      const qty = purchased.get(nft.id)
      return qty
        ? { ...nft, available: Math.max(0, nft.available - qty), version: nft.version + 1 }
        : nft
    })

    const stored: StoredOrder = { order, userId: uid, version: 1, sig }
    state = {
      ...state,
      nfts,
      ordersById: { ...state.ordersById, [order.id]: stored },
      idempotencyKeys: { ...state.idempotencyKeys, [idempotencyKey]: order.id },
      cartsByKey: { ...state.cartsByKey, [uid]: [] },
    }
    return order
  }

  const getOrder = (userId: string | null, orderId: string): Order => {
    const uid = requireSessionUser(userId).id
    const stored = state.ordersById[orderId]
    if (!stored) throw apiError('not_found', 'Pedido não encontrado')
    if (stored.userId !== uid) throw apiError('forbidden', 'Pedido de outro usuário')
    return stored.order
  }

  /** Transita um pedido para confirmado/recusado. Pedidos terminais não mudam. */
  const transitionOrder = (orderId: string, status: OrderStatus): StoredOrder => {
    const stored = state.ordersById[orderId]
    if (!stored) throw apiError('not_found', 'Pedido não encontrado')
    if (stored.order.status !== 'pending') return stored // terminal: idempotente
    const next: StoredOrder = {
      ...stored,
      order: { ...stored.order, status },
      version: stored.version + 1,
    }
    state = { ...state, ordersById: { ...state.ordersById, [orderId]: next } }
    return next
  }

  const bumpNftVersion = (id: string, patch: Partial<Nft>): Nft => {
    const index = state.nfts.findIndex((nft) => nft.id === id)
    if (index === -1) {
      throw new Error(`NFT não encontrado: ${id}`)
    }
    const current = state.nfts[index]
    const updated: Nft = { ...current, ...patch, version: current.version + 1 }
    state = { ...state, nfts: state.nfts.map((nft, i) => (i === index ? updated : nft)) }
    return updated
  }

  // A persistência é assíncrona e isolada em persist()/resetScenario();
  // as leituras (listNfts/getNft) permanecem síncronas e puras.
  const persist = async (): Promise<void> => {
    await saveState(state)
  }

  const resetScenario = async (): Promise<void> => {
    state = buildSeed()
    await saveState(state)
  }

  const hydrate = (nextState: DbState): void => {
    state = nextState
  }

  /**
   * Envolve um método que MUTA o estado para auto-persistir no IndexedDB
   * (best-effort, fire-and-forget) após a mutação — assim carrinho, sessão,
   * perfil, carteiras e pedidos sobrevivem a refresh sem o chamador precisar
   * invocar `persist()` manualmente. Métodos de leitura não são envolvidos.
   */
  const withPersist = <A extends unknown[], R>(fn: (...args: A) => R): ((...args: A) => R) => {
    return (...args: A): R => {
      const result = fn(...args)
      // Ambientes sem IndexedDB (ex.: testes node sem fake-indexeddb) não
      // devem falhar por causa da persistência best-effort.
      void Promise.resolve(saveState(state)).catch(() => {})
      return result
    }
  }

  return {
    listNfts,
    getNft,
    bumpNftVersion: withPersist(bumpNftVersion),
    listFavorites,
    addFavorite: withPersist(addFavorite),
    removeFavorite: withPersist(removeFavorite),
    register: withPersist(register),
    login: withPersist(login),
    getSession,
    resolveUserId,
    logout: withPersist(logout),
    getProfile,
    updateProfile: withPersist(updateProfile),
    changePassword: withPersist(changePassword),
    setAvatar: withPersist(setAvatar),
    listWallets,
    addWallet: withPersist(addWallet),
    updateWallet: withPersist(updateWallet),
    getCart,
    addToCart: withPersist(addToCart),
    updateCartItem: withPersist(updateCartItem),
    removeCartItem: withPersist(removeCartItem),
    mergeCart: withPersist(mergeCart),
    quoteCart,
    createOrder: withPersist(createOrder),
    getOrder,
    transitionOrder: withPersist(transitionOrder),
    persist,
    resetScenario,
    hydrate,
    __debugState: () => state,
  }
}
