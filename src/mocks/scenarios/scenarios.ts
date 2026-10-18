import type { ApiErrorCode } from '@/contracts/errors'

/**
 * Nomes de cenário suportados pela camada mock. "happy" é o default usado
 * pelo build de demo e pelo Lighthouse — sem latência, sem falhas.
 */
export const SCENARIO_NAMES = [
  'happy',
  'slow',
  'variable',
  'transient',
  'unauthorized',
  'offline',
] as const

export type ScenarioName = (typeof SCENARIO_NAMES)[number]

const DEFAULT_SCENARIO: ScenarioName = 'happy'

const STORAGE_KEY = 'greenmint:scenario'

const isScenarioName = (value: unknown): value is ScenarioName =>
  typeof value === 'string' && (SCENARIO_NAMES as readonly string[]).includes(value)

const readFromQuery = (): ScenarioName | undefined => {
  if (typeof window === 'undefined' || !window.location) return undefined
  try {
    const params = new URLSearchParams(window.location.search)
    const value = params.get('scenario')
    return isScenarioName(value) ? value : undefined
  } catch {
    return undefined
  }
}

const readFromLocalStorage = (): ScenarioName | undefined => {
  if (typeof window === 'undefined' || !window.localStorage) return undefined
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return isScenarioName(value) ? value : undefined
  } catch {
    return undefined
  }
}

const readFromEnvDefault = (): ScenarioName | undefined => {
  try {
    const value = import.meta.env?.VITE_SCENARIO
    return isScenarioName(value) ? value : undefined
  } catch {
    return undefined
  }
}

/**
 * Resolve o cenário ativo, respeitando a prioridade:
 * query param `?scenario=` > localStorage (`greenmint:scenario`) > env
 * (`VITE_SCENARIO`) > "happy". Todo acesso a `window`/`localStorage`/
 * `import.meta.env` é protegido para funcionar em Node/Vitest também.
 */
export const getScenario = (): ScenarioName =>
  readFromQuery() ?? readFromLocalStorage() ?? readFromEnvDefault() ?? DEFAULT_SCENARIO

/**
 * Permite que os testes sobrescrevam o delay real por um valor pequeno e
 * determinístico, evitando esperas de segundos na suíte. Não afeta o
 * comportamento de produção — só é lido quando definido.
 */
declare global {
  var __latencyMs: number | undefined
}

const LATENCY_MS_BY_SCENARIO: Record<ScenarioName, number> = {
  happy: 0,
  slow: 400,
  variable: 150, // base; variação determinística aplicada abaixo
  transient: 0,
  unauthorized: 0,
  offline: 0,
}

/**
 * "variable" soma um deslocamento determinístico (sem Math.random) ao
 * delay base, simulando variação de rede sem introduzir não-determinismo.
 */
const VARIABLE_JITTER_MS = 50

const resolveLatencyMs = (scenario: ScenarioName): number => {
  if (typeof globalThis.__latencyMs === 'number') return globalThis.__latencyMs

  if (scenario === 'variable') {
    return LATENCY_MS_BY_SCENARIO.variable + VARIABLE_JITTER_MS
  }
  return LATENCY_MS_BY_SCENARIO[scenario]
}

/**
 * Aguarda o delay configurado para o cenário. "happy" resolve
 * imediatamente (delay 0). Os delays de teste podem ser reduzidos via
 * `globalThis.__latencyMs`.
 */
export const applyLatency = async (scenario: ScenarioName): Promise<void> => {
  const ms = resolveLatencyMs(scenario)
  if (ms <= 0) return
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export interface ScenarioFault {
  code: ApiErrorCode
}

/**
 * Faltas injetadas por cenário, por recurso. Determinístico: o mesmo par
 * (cenário, recurso) sempre produz o mesmo resultado — sem aleatoriedade
 * não semeada.
 */
const FAULTS_BY_SCENARIO: Partial<Record<ScenarioName, ScenarioFault>> = {
  transient: { code: 'transient' },
  unauthorized: { code: 'unauthorized' },
  offline: { code: 'transient' },
}

/**
 * Retorna uma falta a ser simulada para o (cenário, recurso) informado,
 * ou `null` quando o cenário não injeta erro para esse recurso. `resource`
 * é recebido para permitir faltas específicas por recurso em cenários
 * futuros; os cenários atuais aplicam a mesma falta a qualquer recurso.
 */
export const maybeFault = (
  scenario: ScenarioName,
  /** Recebido para permitir faltas específicas por recurso em cenários futuros. */
  resource: string,
): ScenarioFault | null => {
  void resource
  return FAULTS_BY_SCENARIO[scenario] ?? null
}
