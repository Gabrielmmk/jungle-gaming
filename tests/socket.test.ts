import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { io } from 'socket.io-client'
import { server } from '@/mocks/server'
import { emitNftUpdated } from '@/mocks/socket/emitter'

// NOTA: server.listen() omite intencionalmente onUnhandledRequest:"error"
// (o handshake do socket.io/engine.io não deve derrubar o teste). NÃO unificar
// com a config do teste REST.
beforeAll(() => server.listen())
afterAll(() => server.close())

/**
 * RISCO TÉCNICO / FALLBACK:
 *
 * Sob node/jsdom (Vitest), o Engine.IO do socket.io-client usa o pacote `ws`,
 * não o `globalThis.WebSocket` que o interceptor do MSW substitui. Logo o
 * cliente real NÃO conecta ao handler mockado neste ambiente (connect timeout).
 *
 * Por isso este teste de integração com cliente real fica SKIPADO. A cobertura
 * do roteamento (incluindo o isolamento eliminatório por usuário) vive em
 * tests/emitter.test.ts com clientes fake.
 *
 * TODO(Camada 6 — Playwright): des-skipar / portar este teste. No browser
 * (Chromium) o socket.io-client usa WebSocket nativo e É interceptado pelo MSW,
 * então a conexão real funcionará.
 */
describe.skip('socket nft.updated (integração — adiado p/ Camada 6 Playwright)', () => {
  it('cliente recebe envelope versionado via socket.io-client', async () => {
    const socket = io('http://localhost/socket', { transports: ['websocket'] })
    const received = new Promise<{ resource: string; version: number }>((resolve) =>
      socket.on('nft.updated', resolve),
    )
    await new Promise<void>((r, reject) => {
      socket.on('connect', () => r())
      setTimeout(() => reject(new Error('socket connect timeout')), 4000)
    })
    emitNftUpdated({ id: 'evt-1', resource: 'nft:1', version: 2, payload: { id: '1', priceEth: '9.9' } })
    const evt = await received
    expect(evt.resource).toBe('nft:1')
    expect(evt.version).toBe(2)
    socket.close()
  })
})
