import type { Nft } from '@/contracts/nft'
import type { DbState, User, UserAuth } from '@/mocks/db/types'
import { hashPassword } from '@/mocks/db/hash'

export const SCHEMA_VERSION = 3

/** Credenciais fictícias dos usuários semeados (documentadas no README). */
export const SEED_CREDENTIALS = [
  { id: 'user-1', email: 'ana.silva@greenmint.test', password: 'senha1234' },
  { id: 'user-2', email: 'bruno.costa@greenmint.test', password: 'senha1234' },
] as const

const USERS: User[] = [
  {
    id: 'user-1',
    email: 'ana.silva@greenmint.test',
    username: 'ana.silva',
    displayName: 'Ana Silva',
    walletNickname: 'Ana Wallet',
  },
  {
    id: 'user-2',
    email: 'bruno.costa@greenmint.test',
    username: 'bruno.costa',
    displayName: 'Bruno Costa',
    walletNickname: 'Bruno Wallet',
  },
]

const USERS_AUTH: Record<string, UserAuth> = Object.fromEntries(
  SEED_CREDENTIALS.map((c) => [c.id, { passwordHash: hashPassword(c.password) }]),
)

const CATEGORIES = [
  'Digital Art',
  'Photography',
  'Music',
  '3D Art',
  'Collectibles',
  'Generative',
  'Gaming',
  'Memberships',
] as const

const NETWORKS = ['Ethereum', 'Polygon', 'Solana'] as const
const FORMATS = ['PNG', 'MP4', 'GLB', 'JPG', 'GIF'] as const
const EDITION_TOTALS = [8, 16, 50, 100] as const

interface NftSeedSpec {
  name: string
  collection: string
  category: (typeof CATEGORIES)[number]
  priceEth: string
  available: number
}

// Dados fixos (sem Math.random) para garantir determinismo entre execuções.
const NFT_SPECS: NftSeedSpec[] = [
  {
    name: 'Golden Gorilla #001',
    collection: 'Jungle Primates',
    category: 'Digital Art',
    priceEth: '1.250000000000000000',
    available: 1,
  },
  {
    name: 'Golden Gorilla #002',
    collection: 'Jungle Primates',
    category: 'Digital Art',
    priceEth: '1.300000000000000000',
    available: 1,
  },
  {
    name: 'Golden Gorilla #003',
    collection: 'Jungle Primates',
    category: 'Digital Art',
    priceEth: '1.180000000000000000',
    available: 2,
  },
  {
    name: 'Silverback Sovereign #014',
    collection: 'Canopy Kings',
    category: 'Digital Art',
    priceEth: '4.500000000000000000',
    available: 1,
  },
  {
    name: 'Silverback Sovereign #015',
    collection: 'Canopy Kings',
    category: 'Digital Art',
    priceEth: '4.750000000000000000',
    available: 1,
  },
  {
    name: 'Crowned Chimp #022',
    collection: 'Canopy Kings',
    category: '3D Art',
    priceEth: '3.900000000000000000',
    available: 1,
  },
  {
    name: 'Banana Baron #101',
    collection: 'Banana Republic DAO',
    category: 'Memberships',
    priceEth: '0.450000000000000000',
    available: 10,
  },
  {
    name: 'Banana Baron #102',
    collection: 'Banana Republic DAO',
    category: 'Memberships',
    priceEth: '0.450000000000000000',
    available: 8,
  },
  {
    name: 'Peel Pass #103',
    collection: 'Banana Republic DAO',
    category: 'Memberships',
    priceEth: '0.320000000000000000',
    available: 25,
  },
  {
    name: 'Peel Pass #104',
    collection: 'Banana Republic DAO',
    category: 'Memberships',
    priceEth: '0.320000000000000000',
    available: 20,
  },
  {
    name: 'Mystic Mangabey #201',
    collection: 'Mystic Mangabeys',
    category: 'Collectibles',
    priceEth: '2.100000000000000000',
    available: 3,
  },
  {
    name: 'Mystic Mangabey #202',
    collection: 'Mystic Mangabeys',
    category: 'Collectibles',
    priceEth: '2.050000000000000000',
    available: 3,
  },
  {
    name: 'Mystic Mangabey #203',
    collection: 'Mystic Mangabeys',
    category: 'Collectibles',
    priceEth: '2.200000000000000000',
    available: 2,
  },
  {
    name: 'Mystic Mangabey #204',
    collection: 'Mystic Mangabeys',
    category: 'Collectibles',
    priceEth: '1.950000000000000000',
    available: 4,
  },
  {
    name: 'Rare Rainforest Relic #301',
    collection: 'Mystic Mangabeys',
    category: 'Collectibles',
    priceEth: '6.800000000000000000',
    available: 1,
  },
  {
    name: 'Canopy Field Recording #401',
    collection: 'Forest Frequencies',
    category: 'Music',
    priceEth: '0.750000000000000000',
    available: 5,
  },
  {
    name: 'Canopy Field Recording #402',
    collection: 'Forest Frequencies',
    category: 'Music',
    priceEth: '0.750000000000000000',
    available: 5,
  },
  {
    name: 'Howler Harmony #403',
    collection: 'Forest Frequencies',
    category: 'Music',
    priceEth: '0.880000000000000000',
    available: 6,
  },
  {
    name: 'Howler Harmony #404',
    collection: 'Forest Frequencies',
    category: 'Music',
    priceEth: '0.880000000000000000',
    available: 6,
  },
  {
    name: 'Drumline of the Troop #405',
    collection: 'Forest Frequencies',
    category: 'Music',
    priceEth: '1.050000000000000000',
    available: 3,
  },
  {
    name: 'Misty Canopy Dawn #501',
    collection: 'Jungle Primates',
    category: 'Photography',
    priceEth: '0.600000000000000000',
    available: 7,
  },
  {
    name: 'Misty Canopy Dawn #502',
    collection: 'Jungle Primates',
    category: 'Photography',
    priceEth: '0.600000000000000000',
    available: 7,
  },
  {
    name: 'Troop at Dusk #503',
    collection: 'Jungle Primates',
    category: 'Photography',
    priceEth: '0.720000000000000000',
    available: 4,
  },
  {
    name: 'Troop at Dusk #504',
    collection: 'Jungle Primates',
    category: 'Photography',
    priceEth: '0.720000000000000000',
    available: 4,
  },
  {
    name: 'Baby Gorilla First Steps #505',
    collection: 'Canopy Kings',
    category: 'Photography',
    priceEth: '1.400000000000000000',
    available: 2,
  },
  {
    name: 'Vine Access Pass #601',
    collection: 'Vine Utility Club',
    category: 'Memberships',
    priceEth: '0.150000000000000000',
    available: 50,
  },
  {
    name: 'Vine Access Pass #602',
    collection: 'Vine Utility Club',
    category: 'Memberships',
    priceEth: '0.150000000000000000',
    available: 45,
  },
  {
    name: 'Canopy Climber Badge #603',
    collection: 'Vine Utility Club',
    category: 'Gaming',
    priceEth: '0.220000000000000000',
    available: 30,
  },
  {
    name: 'Canopy Climber Badge #604',
    collection: 'Vine Utility Club',
    category: 'Gaming',
    priceEth: '0.220000000000000000',
    available: 30,
  },
  {
    name: 'Treehouse Deed #605',
    collection: 'Vine Utility Club',
    category: 'Memberships',
    priceEth: '0.980000000000000000',
    available: 5,
  },
  {
    name: 'Orangutan Oracle #701',
    collection: 'Mystic Mangabeys',
    category: 'Generative',
    priceEth: '5.200000000000000000',
    available: 1,
  },
  {
    name: 'Orangutan Oracle #702',
    collection: 'Mystic Mangabeys',
    category: 'Generative',
    priceEth: '5.400000000000000000',
    available: 1,
  },
  {
    name: 'Lemur Lagoon #703',
    collection: 'Canopy Kings',
    category: '3D Art',
    priceEth: '2.750000000000000000',
    available: 2,
  },
  {
    name: 'Lemur Lagoon #704',
    collection: 'Canopy Kings',
    category: '3D Art',
    priceEth: '2.750000000000000000',
    available: 2,
  },
  {
    name: 'Gibbon Glide #801',
    collection: 'Jungle Primates',
    category: 'Collectibles',
    priceEth: '0.990000000000000000',
    available: 8,
  },
  {
    name: 'Gibbon Glide #802',
    collection: 'Jungle Primates',
    category: 'Collectibles',
    priceEth: '0.990000000000000000',
    available: 8,
  },
  {
    name: 'Macaque Mosaic #803',
    collection: 'Jungle Primates',
    category: 'Collectibles',
    priceEth: '1.650000000000000000',
    available: 3,
  },
  {
    name: 'Macaque Mosaic #804',
    collection: 'Jungle Primates',
    category: 'Collectibles',
    priceEth: '1.650000000000000000',
    available: 3,
  },
  {
    name: 'Spider Monkey Sonata #901',
    collection: 'Forest Frequencies',
    category: 'Music',
    priceEth: '1.120000000000000000',
    available: 4,
  },
  {
    name: 'Spider Monkey Sonata #902',
    collection: 'Forest Frequencies',
    category: 'Music',
    priceEth: '1.120000000000000000',
    available: 4,
  },
  {
    name: 'Tamarin Twilight Shot #903',
    collection: 'Jungle Primates',
    category: 'Photography',
    priceEth: '0.540000000000000000',
    available: 9,
  },
  {
    name: 'Baboon Ballad #904',
    collection: 'Forest Frequencies',
    category: 'Music',
    priceEth: '0.660000000000000000',
    available: 6,
  },
  {
    name: 'Marmoset Membership #905',
    collection: 'Vine Utility Club',
    category: 'Memberships',
    priceEth: '0.380000000000000000',
    available: 15,
  },
  {
    name: 'Capuchin Chronicle #906',
    collection: 'Mystic Mangabeys',
    category: 'Collectibles',
    priceEth: '2.950000000000000000',
    available: 2,
  },
]

// Garante em runtime que todas as categorias usadas pertencem ao conjunto suportado.
const assertKnownCategories = (specs: NftSeedSpec[]): void => {
  for (const spec of specs) {
    if (!CATEGORIES.includes(spec.category)) {
      throw new Error(`Categoria desconhecida no seed: ${spec.category}`)
    }
  }
}
assertKnownCategories(NFT_SPECS)

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/#/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const DESCRIPTIONS = [
  'Uma peça única capturada nas profundezas da selva digital, celebrando a biodiversidade através da arte generativa.',
  'Edição colecionável que homenageia a fauna tropical com detalhes meticulosos e cores vibrantes.',
  'Parte de uma série que explora a interseção entre tecnologia blockchain e conservação ambiental.',
  'Criação exclusiva que traduz sons e texturas da floresta em uma experiência visual imersiva.',
]

/**
 * Gera um endereço de contrato hexadecimal determinístico a partir do índice,
 * sem depender de fontes aleatórias — garante reprodutibilidade do seed.
 */
const deterministicContractAddress = (index: number): string => {
  const hex = (index + 1).toString(16).padStart(40, '0')
  return `0x${hex}`
}

const buildNfts = (): Nft[] =>
  NFT_SPECS.map((spec, index) => {
    const slug = slugify(spec.name)
    const network = NETWORKS[index % NETWORKS.length]
    const format = FORMATS[index % FORMATS.length]
    const editionTotal = EDITION_TOTALS[index % EDITION_TOTALS.length]
    const editionMinted = 1 + (index % editionTotal)
    const ratingAvg = Math.round((3.5 + ((index * 7) % 16) / 10) * 10) / 10
    const ratingCount = 4 + ((index * 13) % 96)
    const description = DESCRIPTIONS[index % DESCRIPTIONS.length]
    const baseImage = `/mock-assets/nfts/${slug}.png`
    const imageCount = 3 + (index % 3)
    const images = Array.from({ length: imageCount }, (_, i) =>
      i === 0 ? baseImage : `/mock-assets/nfts/${slug}-${i + 1}.png`,
    )

    return {
      id: `nft-${String(index + 1).padStart(3, '0')}-${slug}`,
      name: spec.name,
      image: baseImage,
      images,
      collection: spec.collection,
      priceEth: spec.priceEth,
      category: spec.category,
      network,
      available: spec.available,
      version: 1,
      description,
      editionMinted,
      editionTotal,
      ratingAvg,
      ratingCount,
      format,
      contractAddress: deterministicContractAddress(index),
      royaltiesPct: (2.5 + (index % 5)).toFixed(1),
      ...(index === 0 ? { featured: true } : {}),
    }
  })

/**
 * Constrói o estado inicial (seed) determinístico do "banco" mockado.
 * Não usa Math.random nem qualquer fonte não determinística — chamadas
 * repetidas produzem exatamente o mesmo resultado.
 */
export const buildSeed = (): DbState => ({
  schemaVersion: SCHEMA_VERSION,
  users: USERS.map((u) => ({ ...u })),
  usersAuth: { ...USERS_AUTH },
  sessions: {},
  nfts: buildNfts(),
  cartsByKey: {},
  orders: {},
  favoritesByUser: {},
  walletsByUser: {},
})
