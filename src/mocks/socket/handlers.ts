import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { registerClient, unregisterClient } from '@/mocks/socket/emitter'

/**
 * RISCO TÉCNICO (ler antes de alterar):
 *
 * - O interceptor de WebSocket do MSW substitui `globalThis.WebSocket`. Sob
 *   o browser (Chromium/Playwright — Camada 6) o socket.io-client usa o
 *   WebSocket nativo e É interceptado. Sob node/jsdom (Vitest) o Engine.IO do
 *   socket.io-client usa o pacote `ws` e NÃO passa por `globalThis.WebSocket`,
 *   então o cliente real pode não ser interceptado nos testes unitários.
 *   Por isso a cobertura de roteamento vive em tests/emitter.test.ts (fake
 *   client) e o teste de integração com cliente real fica adiado para a
 *   Camada 6 (ver tests/socket.test.ts).
 *
 * - O cliente DEVE conectar com `transports: ['websocket']`. O transporte de
 *   polling (HTTP long-polling) não é interceptado por este handler.
 *
 * - O binding (@mswjs/socket.io-binding) NÃO implementa rooms/namespaces do
 *   socket.io. O roteamento por usuário é manual, feito pelo emitter —
 *   registramos cada conexão com o `userId` lido do handshake.
 */

/**
 * Endpoint do socket.io mockado. O cliente (Camada 6/testes) conecta em
 * `http://localhost/socket` com `transports: ['websocket']`, o que o
 * socket.io-client traduz para `ws://localhost/socket/?EIO=4&transport=websocket`.
 * O wildcard de query garante o match independente dos parâmetros do Engine.IO.
 */
export const link = ws.link('ws://localhost/socket')

/**
 * Lê o `userId` do handshake. O socket.io envia `auth` no pacote de conexão
 * (`40{...}`), que não é trivialmente legível aqui; então, para o mock,
 * convencionamos passar o userId como query string na URL de conexão
 * (ex.: `io('http://localhost/socket?userId=userA')`).
 */
function readUserId(url: URL): string | undefined {
  return url.searchParams.get('userId') ?? undefined
}

export const socketHandler = link.addEventListener('connection', (connection) => {
  const io = toSocketIo(connection)
  const userId = readUserId(connection.client.url)

  // `io.client` satisfaz o contrato EmitterClient (`emit(event, ...data)`).
  registerClient(io.client, userId)

  // O socket.io-client envia o evento "disconnect" ao fechar; também
  // limpamos quando o transporte subjacente fecha.
  io.client.on('disconnect', () => {
    unregisterClient(io.client)
  })
  connection.client.addEventListener('close', () => {
    unregisterClient(io.client)
  })
})
