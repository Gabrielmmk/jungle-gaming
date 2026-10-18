import { http, HttpResponse, type StrictRequest, type DefaultBodyType } from 'msw'
import { listNftsParamsSchema, type ListNftsParams } from '@/contracts/nft'
import { HTTP_BY_CODE, type ApiError, type ApiErrorCode } from '@/contracts/errors'
import { registerSchema, loginSchema } from '@/contracts/auth'
import { profileUpdateSchema, passwordChangeSchema, avatarSchema } from '@/contracts/profile'
import { walletInputSchema } from '@/contracts/wallet'
import { addToCartSchema, updateCartItemSchema, quoteRequestSchema } from '@/contracts/cart'
import { createOrderSchema } from '@/contracts/order'
import { ZodError, type ZodType } from 'zod'
import { db } from '@/mocks/db/instance'
import { apiError, type DbError } from '@/mocks/db/createDb'
import { emitOrderUpdated } from '@/mocks/socket/emitter'
import { applyLatency, getScenario, maybeFault } from '@/mocks/scenarios/scenarios'

/** Delay (ms) antes do pedido transitar de pendente → confirmado/recusado. */
const ORDER_SETTLE_MS = 900

/**
 * Resolve o usuário atual pelo header Authorization: Bearer <token>,
 * consultando as sessões do db. Null = sem sessão (rota responderá 401
 * quando o db exigir usuário).
 */
const bearer = (request: StrictRequest<DefaultBodyType>): string | null => {
  const auth = request.headers.get('Authorization') ?? ''
  return auth.startsWith('Bearer ') ? auth.slice(7) : null
}

const currentUser = (request: StrictRequest<DefaultBodyType>): string | null =>
  db.resolveUserId(bearer(request))

/**
 * Chave do carrinho: userId quando há sessão, senão o guestId enviado no
 * header `X-Guest-Id` (o visitante gera e persiste um id no cliente). Assim o
 * carrinho sobrevive a refresh antes do login e pode ser mesclado ao logar.
 */
const cartKey = (request: StrictRequest<DefaultBodyType>): string => {
  const userId = currentUser(request)
  if (userId) return userId
  return request.headers.get('X-Guest-Id') ?? 'guest-anon'
}

const hasCode = (error: unknown): error is DbError =>
  typeof error === 'object' && error !== null && 'code' in error

/** Valida o corpo com um schema zod; lança apiError('validation') em falha. */
const parseBody = async <T>(
  request: StrictRequest<DefaultBodyType>,
  schema: ZodType<T>,
): Promise<T> => {
  const body = await request.json().catch(() => ({}))
  try {
    return schema.parse(body)
  } catch (error) {
    if (error instanceof ZodError) {
      const fields: Record<string, string> = {}
      for (const issue of error.issues) {
        const key = issue.path.join('.')
        if (key) fields[key] = issue.message
      }
      const err = apiError('validation', 'Dados inválidos')
      ;(err as DbError & { fields?: Record<string, string> }).fields = fields
      throw err
    }
    throw error
  }
}

/**
 * Lê arrays via `getAll` (categories/networks) e escalares via `get`,
 * reconstruindo o objeto que `listNftsParamsSchema.parse` espera. Necessário
 * porque `Object.fromEntries(url.searchParams.entries())` perde repetições
 * de chave (ex.: categories=Music&categories=Gaming vira um único valor).
 */
const parseListParams = (url: URL): ListNftsParams => {
  const raw: Record<string, unknown> = {}

  const categories = url.searchParams.getAll('categories')
  const networks = url.searchParams.getAll('networks')

  for (const [key, value] of url.searchParams.entries()) {
    if (key === 'categories' || key === 'networks') continue
    raw[key] = value
  }

  if (categories.length > 0) raw.categories = categories
  if (networks.length > 0) raw.networks = networks

  // Clampa pageSize ao teto do contrato em vez de rejeitar: clientes que
  // pedem uma página "grande" para capturar todos os resultados de um
  // filtro (ex.: pageSize=100) recebem o máximo permitido (60) em vez de
  // um erro de validação — pageSize é conveniência de paginação, não um
  // campo de segurança.
  const rawPageSize = raw.pageSize
  if (typeof rawPageSize === 'string') {
    const parsed = Number(rawPageSize)
    if (Number.isFinite(parsed) && parsed > 60) {
      raw.pageSize = '60'
    }
  }

  return listNftsParamsSchema.parse(raw)
}

const errorResponse = (code: ApiErrorCode, message: string): Response => {
  const body: ApiError = { code, message }
  return HttpResponse.json(body, { status: HTTP_BY_CODE[code] })
}

/** Traduz um erro de domínio (DbError) em resposta HTTP, preservando `fields`. */
const dbErrorResponse = (error: unknown): Response => {
  if (hasCode(error)) {
    const fields = (error as DbError & { fields?: Record<string, string> }).fields
    const body: ApiError = {
      code: error.code,
      message: error.message,
      ...(fields ? { fields } : {}),
    }
    return HttpResponse.json(body, { status: HTTP_BY_CODE[error.code] })
  }
  throw error
}

/**
 * O handler é uma casca fina: parseia a requisição, delega ao db,
 * aplica a camada de cenários (latência/falta) e traduz o resultado para
 * HTTP. Nenhuma regra de negócio vive aqui.
 */
export const handlers = [
  http.get('*/api/nfts', async ({ request }) => {
    const scenario = getScenario()

    await applyLatency(scenario)

    const fault = maybeFault(scenario, 'nfts')
    if (fault) {
      return errorResponse(fault.code, `Cenário "${scenario}" simulou uma falha.`)
    }

    const url = new URL(request.url)
    const params = parseListParams(url)

    const listResponse = db.listNfts(params)
    return HttpResponse.json(listResponse)
  }),

  http.get('*/api/nfts/:id', async ({ params }) => {
    const scenario = getScenario()
    await applyLatency(scenario)

    const fault = maybeFault(scenario, 'nfts')
    if (fault) {
      return errorResponse(fault.code, `Cenário "${scenario}" simulou uma falha.`)
    }

    const id = params.id as string
    const nft = db.getNft(id)
    if (!nft) {
      return errorResponse('not_found', `NFT não encontrado: ${id}`)
    }
    return HttpResponse.json(nft)
  }),

  http.get('*/api/favorites', async ({ request }) => {
    await applyLatency(getScenario())
    try {
      return HttpResponse.json(db.listFavorites(currentUser(request)))
    } catch (error) {
      return dbErrorResponse(error)
    }
  }),

  http.post('*/api/favorites/:id', async ({ request, params }) => {
    await applyLatency(getScenario())
    try {
      db.addFavorite(currentUser(request), params.id as string)
      return HttpResponse.json({ ok: true })
    } catch (error) {
      return dbErrorResponse(error)
    }
  }),

  http.delete('*/api/favorites/:id', async ({ request, params }) => {
    await applyLatency(getScenario())
    try {
      db.removeFavorite(currentUser(request), params.id as string)
      return HttpResponse.json({ ok: true })
    } catch (error) {
      return dbErrorResponse(error)
    }
  }),

  // --- Auth / sessão ---------------------------------------------------

  http.post('*/api/auth/register', async ({ request }) => {
    await applyLatency(getScenario())
    try {
      if (getScenario() === 'register-conflict') {
        return errorResponse('conflict', 'E-mail já cadastrado')
      }
      const input = await parseBody(request, registerSchema)
      return HttpResponse.json(db.register(input))
    } catch (error) {
      return dbErrorResponse(error)
    }
  }),

  http.post('*/api/auth/login', async ({ request }) => {
    await applyLatency(getScenario())
    try {
      const input = await parseBody(request, loginSchema)
      return HttpResponse.json(db.login(input))
    } catch (error) {
      return dbErrorResponse(error)
    }
  }),

  http.get('*/api/session', async ({ request }) => {
    await applyLatency(getScenario())
    if (getScenario() === 'session-expired') {
      return errorResponse('unauthorized', 'Sessão expirada')
    }
    const user = db.getSession(bearer(request))
    if (!user) return errorResponse('unauthorized', 'Sessão inválida')
    return HttpResponse.json(user)
  }),

  http.post('*/api/auth/logout', async ({ request }) => {
    await applyLatency(getScenario())
    db.logout(bearer(request))
    return HttpResponse.json({ ok: true })
  }),

  // --- Perfil ----------------------------------------------------------

  http.get('*/api/profile', async ({ request }) => {
    await applyLatency(getScenario())
    try {
      if (getScenario() === 'session-expired')
        return errorResponse('unauthorized', 'Sessão expirada')
      return HttpResponse.json(db.getProfile(currentUser(request)))
    } catch (error) {
      return dbErrorResponse(error)
    }
  }),

  http.patch('*/api/profile', async ({ request }) => {
    await applyLatency(getScenario())
    try {
      const input = await parseBody(request, profileUpdateSchema)
      return HttpResponse.json(db.updateProfile(currentUser(request), input))
    } catch (error) {
      return dbErrorResponse(error)
    }
  }),

  http.put('*/api/profile/avatar', async ({ request }) => {
    await applyLatency(getScenario())
    try {
      const { avatarUrl } = await parseBody(request, avatarSchema)
      return HttpResponse.json(db.setAvatar(currentUser(request), avatarUrl))
    } catch (error) {
      return dbErrorResponse(error)
    }
  }),

  http.post('*/api/profile/password', async ({ request }) => {
    await applyLatency(getScenario())
    try {
      const input = await parseBody(request, passwordChangeSchema)
      db.changePassword(currentUser(request), input.currentPassword, input.newPassword)
      return HttpResponse.json({ ok: true })
    } catch (error) {
      return dbErrorResponse(error)
    }
  }),

  // --- Carteiras -------------------------------------------------------

  http.get('*/api/wallets', async ({ request }) => {
    await applyLatency(getScenario())
    try {
      return HttpResponse.json(db.listWallets(currentUser(request)))
    } catch (error) {
      return dbErrorResponse(error)
    }
  }),

  http.post('*/api/wallets', async ({ request }) => {
    await applyLatency(getScenario())
    try {
      const input = await parseBody(request, walletInputSchema)
      return HttpResponse.json(db.addWallet(currentUser(request), input))
    } catch (error) {
      return dbErrorResponse(error)
    }
  }),

  http.patch('*/api/wallets/:id', async ({ request, params }) => {
    await applyLatency(getScenario())
    try {
      const input = await parseBody(request, walletInputSchema)
      return HttpResponse.json(db.updateWallet(currentUser(request), params.id as string, input))
    } catch (error) {
      return dbErrorResponse(error)
    }
  }),

  // --- Carrinho --------------------------------------------------------

  http.get('*/api/cart', async ({ request }) => {
    await applyLatency(getScenario())
    return HttpResponse.json(db.getCart(cartKey(request)))
  }),

  http.post('*/api/cart', async ({ request }) => {
    await applyLatency(getScenario())
    try {
      const { nftId, qty } = await parseBody(request, addToCartSchema)
      return HttpResponse.json(db.addToCart(cartKey(request), nftId, qty))
    } catch (error) {
      return dbErrorResponse(error)
    }
  }),

  http.patch('*/api/cart/:nftId', async ({ request, params }) => {
    await applyLatency(getScenario())
    try {
      const { qty } = await parseBody(request, updateCartItemSchema)
      return HttpResponse.json(db.updateCartItem(cartKey(request), params.nftId as string, qty))
    } catch (error) {
      return dbErrorResponse(error)
    }
  }),

  http.delete('*/api/cart/:nftId', async ({ request, params }) => {
    await applyLatency(getScenario())
    return HttpResponse.json(db.removeCartItem(cartKey(request), params.nftId as string))
  }),

  http.post('*/api/cart/quote', async ({ request }) => {
    await applyLatency(getScenario())
    try {
      const { coupon } = await parseBody(request, quoteRequestSchema)
      return HttpResponse.json(db.quoteCart(cartKey(request), coupon))
    } catch (error) {
      return dbErrorResponse(error)
    }
  }),

  http.post('*/api/cart/merge', async ({ request }) => {
    await applyLatency(getScenario())
    const userId = currentUser(request)
    if (!userId) return errorResponse('unauthorized', 'Sessão necessária para mesclar carrinho')
    const guestId = request.headers.get('X-Guest-Id')
    if (guestId) db.mergeCart(guestId, userId)
    return HttpResponse.json(db.getCart(userId))
  }),

  // --- Pedidos ---------------------------------------------------------

  http.post('*/api/orders', async ({ request }) => {
    const scenario = getScenario()
    await applyLatency(scenario)
    const userId = currentUser(request)
    try {
      const idempotencyKey = request.headers.get('Idempotency-Key') ?? ''
      if (!idempotencyKey) return errorResponse('validation', 'Idempotency-Key ausente')
      const input = await parseBody(request, createOrderSchema)

      // Primeira tentativa desta chave? (A recuperação idempotente não deve
      // reagendar a transição nem reaplicar o delay de timeout.)
      const firstAttempt = !db.__debugState().idempotencyKeys[idempotencyKey]
      const order = db.createOrder(userId, idempotencyKey, input)

      // Transição assíncrona: pendente → confirmado (ou recusado no cenário
      // `payment-refused`), emitindo order.updated APENAS para o usuário dono.
      if (firstAttempt && order.status === 'pending' && userId) {
        setTimeout(() => {
          const next = scenario === 'payment-refused' ? 'refused' : 'confirmed'
          const stored = db.transitionOrder(order.id, next)
          emitOrderUpdated(
            {
              id: `evt-${order.id}-${stored.version}`,
              resource: `order:${order.id}`,
              version: stored.version,
              payload: { id: order.id, status: next },
            },
            userId,
          )
        }, ORDER_SETTLE_MS)
      }

      // Cenário de timeout: na PRIMEIRA tentativa o pedido é criado, mas a
      // resposta demora além do timeout do cliente — o retry com a MESMA
      // chave recupera o pedido (idempotência) e responde rápido, sem criar
      // outra compra.
      if (scenario === 'order-timeout' && firstAttempt) {
        await new Promise((resolve) => setTimeout(resolve, 4000))
      }

      return HttpResponse.json(order)
    } catch (error) {
      return dbErrorResponse(error)
    }
  }),

  http.get('*/api/orders/:id', async ({ request, params }) => {
    await applyLatency(getScenario())
    try {
      return HttpResponse.json(db.getOrder(currentUser(request), params.id as string))
    } catch (error) {
      return dbErrorResponse(error)
    }
  }),
]
