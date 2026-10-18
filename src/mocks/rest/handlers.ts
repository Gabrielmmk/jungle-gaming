import { http, HttpResponse } from 'msw'
import { listNftsParamsSchema, type ListNftsParams } from '@/contracts/nft'
import { HTTP_BY_CODE, type ApiError, type ApiErrorCode } from '@/contracts/errors'
import { db } from '@/mocks/db/instance'
import type { DbError } from '@/mocks/db/createDb'
import { applyLatency, getScenario, maybeFault } from '@/mocks/scenarios/scenarios'

/**
 * Nenhuma sessão real existe nesta camada mock — favoritos ficam gated
 * atrás de `unauthorized` (db) até a camada de auth ser introduzida.
 */
const currentUserId: string | null = null

const hasCode = (error: unknown): error is DbError =>
  typeof error === 'object' && error !== null && 'code' in error

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

  http.get('*/api/favorites', async () => {
    const scenario = getScenario()
    await applyLatency(scenario)

    try {
      const favorites = db.listFavorites(currentUserId)
      return HttpResponse.json(favorites)
    } catch (error) {
      if (hasCode(error)) return errorResponse(error.code, error.message)
      throw error
    }
  }),

  http.post('*/api/favorites/:id', async ({ params }) => {
    const scenario = getScenario()
    await applyLatency(scenario)

    try {
      db.addFavorite(currentUserId, params.id as string)
      return HttpResponse.json({ ok: true })
    } catch (error) {
      if (hasCode(error)) return errorResponse(error.code, error.message)
      throw error
    }
  }),

  http.delete('*/api/favorites/:id', async ({ params }) => {
    const scenario = getScenario()
    await applyLatency(scenario)

    try {
      db.removeFavorite(currentUserId, params.id as string)
      return HttpResponse.json({ ok: true })
    } catch (error) {
      if (hasCode(error)) return errorResponse(error.code, error.message)
      throw error
    }
  }),
]
