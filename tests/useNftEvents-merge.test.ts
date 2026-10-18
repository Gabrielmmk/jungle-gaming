import { describe, it, expect } from 'vitest'
import { applyNftUpdate, type NftUpdatedPayload } from '@/features/realtime/useNftEvents'
import type { EventEnvelope } from '@/contracts/events'
import type { Nft } from '@/contracts/nft'

function makeNft(overrides: Partial<Nft> = {}): Nft {
  return {
    id: '1',
    name: 'Emerald Ape #842',
    image: '/a.png',
    images: ['/a.png', '/b.png'],
    collection: 'Kurio Apes',
    category: 'Collectibles',
    network: 'Ethereum',
    priceEth: '1.19',
    available: 16,
    version: 1,
    description: 'desc',
    editionMinted: 1,
    editionTotal: 16,
    ratingAvg: 4.6,
    ratingCount: 19,
    format: 'PNG',
    contractAddress: '0xabc',
    royaltiesPct: '5',
    ...overrides,
  }
}

function makeEnvelope(
  payload: NftUpdatedPayload,
  version: number,
): EventEnvelope<NftUpdatedPayload> {
  return { id: 'evt-1', resource: `nft:${payload.id}`, version, payload }
}

describe('applyNftUpdate', () => {
  it('aplica a atualização quando a versão do envelope é maior que a do cache', () => {
    const cached = makeNft({ version: 1, priceEth: '1.19', available: 16 })
    const envelope = makeEnvelope({ id: '1', priceEth: '9.90', available: 10 }, 2)

    const result = applyNftUpdate(cached, envelope)

    expect(result).not.toBe(cached)
    expect(result.priceEth).toBe('9.90')
    expect(result.available).toBe(10)
    expect(result.version).toBe(2)
  })

  it('ignora envelope com versão igual à do cache (no-op)', () => {
    const cached = makeNft({ version: 2, priceEth: '1.19', available: 16 })
    const envelope = makeEnvelope({ id: '1', priceEth: '9.90', available: 10 }, 2)

    const result = applyNftUpdate(cached, envelope)

    expect(result).toBe(cached)
    expect(result.priceEth).toBe('1.19')
    expect(result.available).toBe(16)
  })

  it('ignora envelope com versão menor que a do cache (nunca regride)', () => {
    const cached = makeNft({ version: 5, priceEth: '1.19', available: 16 })
    const envelope = makeEnvelope({ id: '1', priceEth: '0.01', available: 999 }, 3)

    const result = applyNftUpdate(cached, envelope)

    expect(result).toBe(cached)
    expect(result.priceEth).toBe('1.19')
    expect(result.available).toBe(16)
  })

  it('não altera o NFT em cache quando o id do payload não bate', () => {
    const cached = makeNft({ id: '1', version: 1 })
    const envelope = makeEnvelope({ id: '2', priceEth: '9.90' }, 99)

    const result = applyNftUpdate(cached, envelope)

    expect(result).toBe(cached)
    expect(result.id).toBe('1')
    expect(result.priceEth).toBe('1.19')
  })
})
