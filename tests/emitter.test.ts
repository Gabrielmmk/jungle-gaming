import { describe, it, expect, beforeEach } from 'vitest'
import type { EventEnvelope } from '@/contracts/events'
import { EVENTS } from '@/contracts/events'
import {
  registerClient,
  unregisterClient,
  emitNftUpdated,
  emitOrderUpdated,
  type EmitterClient,
} from '@/mocks/socket/emitter'

/**
 * Cliente falso que apenas registra os eventos emitidos para ele.
 * O emitter só depende do contrato `{ emit(event, data), userId }`, o que
 * torna a lógica de roteamento testável sem um socket real (ver RISCO
 * TÉCNICO em socket/handlers.ts: o socket.io-client não é interceptado sob
 * node/jsdom).
 */
function createFakeClient(
  userId?: string,
): EmitterClient & { sent: Array<{ event: string; data: unknown }> } {
  const sent: Array<{ event: string; data: unknown }> = []
  return {
    userId,
    sent,
    emit(event: string, data: unknown) {
      sent.push({ event, data })
    },
  }
}

const nftEnvelope: EventEnvelope = {
  id: 'evt-1',
  resource: 'nft:1',
  version: 2,
  payload: { id: '1', priceEth: '9.9' },
}

const orderEnvelope: EventEnvelope = {
  id: 'evt-2',
  resource: 'order:7',
  version: 1,
  payload: { id: '7', status: 'filled' },
}

describe('socket emitter', () => {
  beforeEach(() => {
    // Garante registro limpo entre os testes (módulo é singleton).
    for (const client of [clientA1, clientA2, clientB]) {
      unregisterClient(client)
    }
  })

  let clientA1 = createFakeClient('userA')
  let clientA2 = createFakeClient('userA')
  let clientB = createFakeClient('userB')

  beforeEach(() => {
    clientA1 = createFakeClient('userA')
    clientA2 = createFakeClient('userA')
    clientB = createFakeClient('userB')
  })

  it('emitNftUpdated faz broadcast para TODOS os clientes registrados', () => {
    registerClient(clientA1, 'userA')
    registerClient(clientB, 'userB')

    emitNftUpdated(nftEnvelope)

    expect(clientA1.sent).toEqual([{ event: EVENTS.nftUpdated, data: nftEnvelope }])
    expect(clientB.sent).toEqual([{ event: EVENTS.nftUpdated, data: nftEnvelope }])
  })

  it('emitOrderUpdated entrega SOMENTE aos sockets do usuário alvo (isolamento eliminatório)', () => {
    registerClient(clientA1, 'userA')
    registerClient(clientA2, 'userA')
    registerClient(clientB, 'userB')

    emitOrderUpdated(orderEnvelope, 'userA')

    expect(clientA1.sent).toEqual([{ event: EVENTS.orderUpdated, data: orderEnvelope }])
    expect(clientA2.sent).toEqual([{ event: EVENTS.orderUpdated, data: orderEnvelope }])
    // userB NUNCA pode receber eventos de userA.
    expect(clientB.sent).toEqual([])
  })

  it('unregisterClient interrompe a entrega para aquele socket', () => {
    registerClient(clientA1, 'userA')
    unregisterClient(clientA1)

    emitNftUpdated(nftEnvelope)
    emitOrderUpdated(orderEnvelope, 'userA')

    expect(clientA1.sent).toEqual([])
  })

  it('registerClient aceita userId via argumento sobrescrevendo o do handle', () => {
    const anon = createFakeClient()
    registerClient(anon, 'userA')

    emitOrderUpdated(orderEnvelope, 'userA')

    expect(anon.sent).toEqual([{ event: EVENTS.orderUpdated, data: orderEnvelope }])
    unregisterClient(anon)
  })
})
