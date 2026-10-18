import { describe, it, expect, beforeEach } from 'vitest'
import { createDb, type MockDb } from '@/mocks/db/createDb'
let db: MockDb
beforeEach(() => {
  db = createDb()
})
describe('db discovery', () => {
  it('filtra por múltiplas categorias (OR) e por rede (AND entre grupos)', () => {
    const cats = ['Music', 'Gaming']
    const res = db.listNfts({ categories: cats, networks: ['Ethereum'], page: 1, pageSize: 100 })
    expect(res.items.every((n) => cats.includes(n.category) && n.network === 'Ethereum')).toBe(true)
  })
  it('filtra por faixa de preço (inclusive) via big.js', () => {
    const res = db.listNfts({ minPrice: '1', maxPrice: '3', page: 1, pageSize: 100 })
    expect(res.items.every((n) => Number(n.priceEth) >= 1 && Number(n.priceEth) <= 3)).toBe(true)
  })
  it('facets globais (independe dos filtros)', () => {
    const a = db.listNfts({ page: 1, pageSize: 1 })
    const b = db.listNfts({ categories: ['Music'], page: 1, pageSize: 1 })
    expect(b.facets).toEqual(a.facets)
    expect(Object.values(a.facets.categories).reduce((s, n) => s + n, 0)).toBeGreaterThan(0)
  })
  it('getNft devolve o NFT completo', () => {
    const id = db.listNfts({ page: 1, pageSize: 1 }).items[0].id
    const nft = db.getNft(id)!
    expect(nft.images.length).toBeGreaterThan(0)
    expect(nft.editionTotal).toBeGreaterThanOrEqual(nft.editionMinted)
  })
  it('favoritos sem sessão lançam unauthorized', () => {
    expect(() => db.listFavorites(null)).toThrowError(/unauthorized/)
    expect(() => db.addFavorite(null, '1')).toThrowError(/unauthorized/)
  })
})
