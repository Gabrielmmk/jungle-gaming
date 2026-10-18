import { describe, it, expect, beforeEach } from 'vitest'
import { createDb, type MockDb } from '@/mocks/db/createDb'

let db: MockDb
beforeEach(() => {
  db = createDb()
})

describe('db.listNfts', () => {
  it('filtra por categoria e reinicia paginação implícita', () => {
    const all = db.listNfts({ page: 1, pageSize: 100 })
    const cat = all.items[0].category
    const res = db.listNfts({ category: cat, page: 1, pageSize: 100 })
    expect(res.items.every((n) => n.category === cat)).toBe(true)
    expect(res.total).toBe(res.items.length)
  })

  it('ordena por preço asc', () => {
    const res = db.listNfts({ sort: 'price_asc', page: 1, pageSize: 100 })
    const prices = res.items.map((n) => Number(n.priceEth))
    expect([...prices].sort((a, b) => a - b)).toEqual(prices)
  })

  it('pagina', () => {
    const p1 = db.listNfts({ page: 1, pageSize: 5 })
    const p2 = db.listNfts({ page: 2, pageSize: 5 })
    expect(p1.items).toHaveLength(5)
    expect(p1.items[0].id).not.toBe(p2.items[0].id)
  })

  it('busca vazia retorna total 0', () => {
    const res = db.listNfts({ q: 'zzz_nao_existe_zzz', page: 1, pageSize: 5 })
    expect(res.total).toBe(0)
    expect(res.items).toHaveLength(0)
  })
})

describe('db.bumpNftVersion', () => {
  it('incrementa version e aplica patch', () => {
    const id = db.listNfts({ page: 1, pageSize: 1 }).items[0].id
    const before = db.getNft(id)!
    const after = db.bumpNftVersion(id, { priceEth: '9.9' })
    expect(after.version).toBe(before.version + 1)
    expect(after.priceEth).toBe('9.9')
  })

  it('getNft inexistente retorna undefined', () => {
    expect(db.getNft('nao-existe')).toBeUndefined()
  })
})
