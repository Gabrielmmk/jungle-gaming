import type { EventEnvelope } from '@/contracts/events'
import { EVENTS } from '@/contracts/events'

/**
 * Abstração mínima de um "socket" conectado. Propositalmente só exige o que
 * o emitter precisa — `emit(event, data)` e um `userId` opcional — para que a
 * lógica de roteamento seja testável com um fake (ver tests/emitter.test.ts)
 * sem depender de um socket.io-client real.
 *
 * Em produção/no browser o handle é `io.client` do `@mswjs/socket.io-binding`
 * (ver socket/handlers.ts), cuja assinatura `emit(event, ...data)` é
 * compatível com este contrato.
 */
export interface EmitterClient {
  userId?: string
  emit(event: string, data: unknown): void
}

interface RegisteredClient {
  client: EmitterClient
  userId?: string
}

/**
 * Registro de módulo (singleton) das conexões ativas. O binding NÃO expõe
 * rooms/namespaces do socket.io, então o roteamento por usuário é feito
 * manualmente aqui: cada handle guarda o `userId` associado na conexão.
 */
const clients = new Set<RegisteredClient>()

function findEntry(client: EmitterClient): RegisteredClient | undefined {
  for (const entry of clients) {
    if (entry.client === client) {
      return entry
    }
  }
  return undefined
}

/**
 * Registra uma conexão. O `userId` explícito tem precedência sobre o
 * `client.userId` (o handler lê o userId do handshake e o passa aqui).
 */
export function registerClient(client: EmitterClient, userId?: string): void {
  const existing = findEntry(client)
  const resolvedUserId = userId ?? client.userId
  if (existing) {
    existing.userId = resolvedUserId
    return
  }
  clients.add({ client, userId: resolvedUserId })
}

/** Remove uma conexão do registro (chamado no disconnect). */
export function unregisterClient(client: EmitterClient): void {
  const existing = findEntry(client)
  if (existing) {
    clients.delete(existing)
  }
}

/**
 * BROADCAST para todas as conexões. Mudanças de catálogo/NFT são globais,
 * logo todos os clientes conectados devem receber o evento.
 */
export function emitNftUpdated(envelope: EventEnvelope): void {
  for (const entry of clients) {
    entry.client.emit(EVENTS.nftUpdated, envelope)
  }
}

/**
 * Roteia o evento APENAS para as conexões do `userId` alvo. Requisito
 * ELIMINATÓRIO: eventos de um usuário jamais podem chegar a outro, portanto
 * filtramos estritamente por `entry.userId === userId`.
 */
export function emitOrderUpdated(envelope: EventEnvelope, userId: string): void {
  for (const entry of clients) {
    if (entry.userId === userId) {
      entry.client.emit(EVENTS.orderUpdated, envelope)
    }
  }
}

/** Utilitário de teste/reset: limpa o registro de conexões. */
export function clearClients(): void {
  clients.clear()
}
