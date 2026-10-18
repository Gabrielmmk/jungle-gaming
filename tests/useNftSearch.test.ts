import { describe, it, expect } from 'vitest'
import { nextSearch, parseSearch } from '@/features/discovery/useNftSearch'

describe('useNftSearch - parseSearch/nextSearch (pure)', () => {
  it('mudar filtro reseta page para 1', () => {
    const cur = parseSearch({ page: 3, categories: ['Music'] })
    expect(nextSearch(cur, { categories: ['Gaming'] }).page).toBe(1)
  })

  it('mudar só a página preserva filtros e não reseta', () => {
    const cur = parseSearch({ page: 1, categories: ['Music'] })
    const nx = nextSearch(cur, { page: 2 })
    expect(nx.page).toBe(2)
    expect(nx.categories).toEqual(['Music'])
  })

  it('defaults: page=1, pageSize=12', () => {
    const s = parseSearch({})
    expect(s.page).toBe(1)
    expect(s.pageSize).toBe(12)
  })
})
