import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '@/mocks/server'
import { api } from '@/shared/http/axios'
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
describe('REST discovery', () => {
  it('GET /nfts/:id retorna o detalhe', async () => {
    const list = await api.get('/nfts', { params: { page: 1, pageSize: 1 } })
    const id = list.data.items[0].id
    const { data } = await api.get(`/nfts/${id}`)
    expect(data.id).toBe(id)
    expect(Array.isArray(data.images)).toBe(true)
  })
  it('GET /nfts/:id inexistente → 404', async () => {
    await expect(api.get('/nfts/nao-existe')).rejects.toMatchObject({ response: { status: 404 } })
  })
  it('GET /nfts inclui facets', async () => {
    const { data } = await api.get('/nfts', { params: { page: 1, pageSize: 1 } })
    expect(data.facets).toBeDefined()
  })
  it('GET /favorites sem sessão → 401', async () => {
    await expect(api.get('/favorites')).rejects.toMatchObject({ response: { status: 401 } })
  })
  it('filtro multi-categoria faz round-trip via HTTP', async () => {
    const { data } = await api.get('/nfts', {
      params: { categories: ['Music', 'Gaming'], pageSize: 100 },
    })
    expect(data.items.length).toBeGreaterThan(0)
    expect(
      data.items.every((n: { category: string }) => ['Music', 'Gaming'].includes(n.category)),
    ).toBe(true)
  })
})
