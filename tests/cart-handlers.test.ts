import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '@/mocks/server'
import { api } from '@/shared/http/axios'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('REST cart', () => {
  it('visitante adiciona item (via X-Guest-Id) e cota total', async () => {
    const nftId = (await api.get('/nfts', { params: { pageSize: 1 } })).data.items[0].id
    await api.post('/cart', { nftId, qty: 1 })
    const cart = await api.get('/cart')
    expect(cart.data.find((l: { nftId: string }) => l.nftId === nftId)).toBeTruthy()

    const quote = await api.post('/cart/quote', {})
    expect(Number(quote.data.totalEth)).toBeGreaterThan(0)
    expect(quote.data.networkFeeEth).toBe('0.016')
  })

  it('cupom válido desconta; inválido é sinalizado', async () => {
    const nftId = (await api.get('/nfts', { params: { pageSize: 1 } })).data.items[0].id
    await api.post('/cart', { nftId, qty: 1 })

    const ok = await api.post('/cart/quote', { coupon: 'LAUNCH10' })
    expect(ok.data.coupon.applied).toBe(true)
    expect(Number(ok.data.discountEth)).toBeGreaterThan(0)

    const bad = await api.post('/cart/quote', { coupon: 'NOPE' })
    expect(bad.data.coupon).toMatchObject({ applied: false, reason: 'invalid' })
  })
})
