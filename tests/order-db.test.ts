import { describe, it, expect, beforeEach } from 'vitest'
import { createDb, type MockDb } from '@/mocks/db/createDb'
import type { ApiErrorCode } from '@/contracts/errors'
import type { CreateOrderInput } from '@/contracts/order'

let db: MockDb
let userId: string

const expectCode = (fn: () => unknown, code: ApiErrorCode) => {
  try {
    fn()
  } catch (e) {
    expect((e as { code?: string }).code).toBe(code)
    return
  }
  throw new Error(`esperava code="${code}"`)
}

beforeEach(() => {
  db = createDb()
  userId = db.login({ email: 'ana.silva@greenmint.test', password: 'senha1234' }).user.id
  const nftId = db.listNfts({ page: 1, pageSize: 1 }).items[0].id
  db.addToCart(userId, nftId, 1)
})

const inputFor = (total: string, overrides: Partial<CreateOrderInput> = {}): CreateOrderInput => ({
  collector: { displayName: 'Ana', email: 'ana@x.com' },
  walletLabel: 'MetaMask',
  network: 'Ethereum',
  expectedTotalEth: total,
  ...overrides,
})

describe('db orders', () => {
  it('cria pedido pendente com snapshot e esvazia o carrinho', () => {
    const total = db.quoteCart(userId).totalEth
    const order = db.createOrder(userId, 'key-1', inputFor(total))
    expect(order.status).toBe('pending')
    expect(order.items.length).toBeGreaterThan(0)
    expect(order.items[0].name).toBeTruthy() // snapshot
    expect(db.getCart(userId)).toHaveLength(0)
  })

  it('idempotência: mesma chave + conteúdo recupera o mesmo pedido', () => {
    const total = db.quoteCart(userId).totalEth
    const a = db.createOrder(userId, 'key-2', inputFor(total))
    const b = db.createOrder(userId, 'key-2', inputFor(total))
    expect(b.id).toBe(a.id)
  })

  it('mesma chave + conteúdo diferente → conflito', () => {
    const total = db.quoteCart(userId).totalEth
    db.createOrder(userId, 'key-3', inputFor(total))
    expectCode(
      () => db.createOrder(userId, 'key-3', inputFor(total, { walletLabel: 'Outra' })),
      'conflict',
    )
  })

  it('revalidação: total divergente (cotação desatualizada) → conflito', () => {
    expectCode(() => db.createOrder(userId, 'key-4', inputFor('999.0')), 'conflict')
  })

  it('transição pendente → confirmado é terminal (idempotente)', () => {
    const total = db.quoteCart(userId).totalEth
    const order = db.createOrder(userId, 'key-5', inputFor(total))
    expect(db.transitionOrder(order.id, 'confirmed').order.status).toBe('confirmed')
    // terminal: não vira 'refused'
    expect(db.transitionOrder(order.id, 'refused').order.status).toBe('confirmed')
    expect(db.getOrder(userId, order.id).status).toBe('confirmed')
  })

  it('snapshot não muda se o catálogo mudar depois', () => {
    const nftId = db.getCart(userId)[0].nftId
    const total = db.quoteCart(userId).totalEth
    const order = db.createOrder(userId, 'key-6', inputFor(total))
    const priceAtPurchase = order.items[0].priceEth
    db.bumpNftVersion(nftId, { priceEth: '123.45' })
    expect(db.getOrder(userId, order.id).items[0].priceEth).toBe(priceAtPurchase)
  })
})
