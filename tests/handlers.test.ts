import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '@/mocks/server'
import { api } from '@/shared/http/axios'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('GET /api/nfts', () => {
  it('retorna itens paginados e reflete params', async () => {
    const { data } = await api.get('/nfts', { params: { page: 1, pageSize: 5 } })
    expect(data.items).toHaveLength(5)
    expect(data.page).toBe(1)
    expect(typeof data.total).toBe('number')
    expect(typeof data.items[0].priceEth).toBe('string')
  })

  it('resultado vazio para busca sem match', async () => {
    const { data } = await api.get('/nfts', { params: { q: 'zzz_nada' } })
    expect(data.total).toBe(0)
  })
})
