export interface EventEnvelope<T = unknown> {
  id: string
  resource: string
  version: number
  payload: T
}

export const EVENTS = { nftUpdated: 'nft.updated', orderUpdated: 'order.updated' } as const
