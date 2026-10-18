import { http, HttpResponse } from 'msw'
import { listNftsParamsSchema } from '@/contracts/nft'
import { HTTP_BY_CODE, type ApiError } from '@/contracts/errors'
import { createDb } from '@/mocks/db/createDb'
import { buildSeed } from '@/mocks/fixtures/seed'
import { applyLatency, getScenario, maybeFault } from '@/mocks/scenarios/scenarios'

/**
 * Instância única do db compartilhada por todos os handlers REST (e,
 * futuramente, pela camada de sockets). Para a Camada 0 um singleton de
 * módulo é suficiente — cada processo de teste/app recebe sua própria
 * instância isolada ao importar este módulo.
 */
const db = createDb(buildSeed())

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
      const body: ApiError = { code: fault.code, message: `Cenário "${scenario}" simulou uma falha.` }
      return HttpResponse.json(body, { status: HTTP_BY_CODE[fault.code] })
    }

    const url = new URL(request.url)
    const rawParams = Object.fromEntries(url.searchParams.entries())
    const params = listNftsParamsSchema.parse(rawParams)

    const listResponse = db.listNfts(params)
    return HttpResponse.json(listResponse)
  }),
]
