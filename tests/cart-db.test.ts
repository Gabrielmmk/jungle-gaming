import { describe, it, expect, beforeEach } from 'vitest'
import Big from 'big.js'
import { createDb, type MockDb } from '@/mocks/db/createDb'

let db: MockDb
let nftId: string
let price: string
let available: number

beforeEach(() => {
  db = createDb()
  const first = db.listNfts({ page: 1, pageSize: 1 }).items[0]
  nftId = first.id
  price = first.priceEth
  available = first.available
})

describe('db cart', () => {
  it('adiciona item e cota subtotal/taxa/total com precisão', () => {
    db.addToCart('k', nftId, 2)
    const q = db.quoteCart('k')
    const qty = q.items[0].qty // pode ser limitado pela disponibilidade
    expect(q.items).toHaveLength(1)
    expect(q.subtotalEth).toBe(new Big(price).times(qty).toString())
    expect(q.networkFeeEth).toBe('0.016')
    expect(q.totalEth).toBe(new Big(price).times(qty).plus('0.016').toString())
  })

  it('respeita a disponibilidade da edição (clamp)', () => {
    db.addToCart('k', nftId, available + 5)
    expect(db.getCart('k')[0].qty).toBe(available)
  })

  it('cupom válido aplica desconto; inválido e expirado são rejeitados', () => {
    db.addToCart('k', nftId, 1)
    const ok = db.quoteCart('k', 'LAUNCH10')
    expect(ok.coupon?.applied).toBe(true)
    expect(ok.discountEth).toBe(new Big(price).times(10).div(100).toString())

    const invalid = db.quoteCart('k', 'NOPE')
    expect(invalid.coupon).toMatchObject({ applied: false, reason: 'invalid' })
    expect(invalid.discountEth).toBe('0')

    const expired = db.quoteCart('k', 'EXPIRED')
    expect(expired.coupon).toMatchObject({ applied: false, reason: 'expired' })
  })

  it('remove item e atualiza quantidade', () => {
    db.addToCart('k', nftId, 1)
    db.updateCartItem('k', nftId, 3)
    expect(db.getCart('k')[0].qty).toBe(Math.min(3, available))
    db.removeCartItem('k', nftId)
    expect(db.getCart('k')).toHaveLength(0)
  })

  it('mescla carrinho de visitante no do usuário', () => {
    db.addToCart('guest-1', nftId, 1)
    db.mergeCart('guest-1', 'user-1')
    expect(db.getCart('user-1').find((l) => l.nftId === nftId)?.qty).toBe(1)
    expect(db.getCart('guest-1')).toHaveLength(0)
  })
})
