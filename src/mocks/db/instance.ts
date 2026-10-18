import { createDb } from '@/mocks/db/createDb'
import { buildSeed } from '@/mocks/fixtures/seed'

/**
 * Instância única do db compartilhada por TODA a camada mock: handlers REST
 * (src/mocks/rest/handlers.ts), emissão de eventos de socket e qualquer
 * ferramenta de dev/E2E (ver `enableMocks` em src/mocks/browser.ts). Extraído
 * para seu próprio módulo para que REST e sockets leiam/escrevam o mesmo
 * estado — sem isso, um `bumpNftVersion` feito por um caminho não seria
 * visto pelo outro. Cada processo de teste/app ainda recebe sua própria
 * instância isolada ao importar este módulo (não há estado compartilhado
 * entre processos).
 */
export const db = createDb(buildSeed())
