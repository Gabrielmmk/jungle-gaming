# GreenMint — NFT Marketplace

Marketplace de NFTs (desafio frontend) em React + TypeScript, com dados totalmente
simulados (REST + tempo real) na camada de rede. Estética **GreenMint** (dark/earthy,
tipografia monoespaçada), fiel ao Figma.

> **Status:** Concluídos os fluxos de Fundação & Mock Backend, Descoberta
> (Início + Detalhes), Sessão & Conta, Carrinho e **Checkout/Confirmação** (pedido
> idempotente, revalidação, estados pendente/confirmado/recusado, recibo snapshot).
> Pendentes: Testes E2E (Playwright), Performance (Lighthouse) e Deploy — além do
> passe de fidelidade visual. Veja `ARCHITECTURE.md` para a arquitetura.

**Cupons de teste (carrinho):** `LAUNCH10` (-10%) e `WELCOME5` (-5%) válidos;
`EXPIRED` (expirado) e qualquer outro código são rejeitados com mensagem.

## Stack

| Responsabilidade         | Tecnologia                          |
| ------------------------ | ----------------------------------- |
| Interface / Linguagem    | React 18 + TypeScript               |
| Build                    | Vite (SPA)                          |
| Roteamento               | TanStack Router (code-based)        |
| Estado remoto            | TanStack Query                      |
| HTTP                     | Axios                               |
| Estilização              | Tailwind CSS + shadcn/ui            |
| Mocking REST + WebSocket | MSW v2 + `@mswjs/socket.io-binding` |
| Tempo real               | socket.io-client                    |
| Precisão de ETH          | big.js (strings decimais)           |
| Testes unitários         | Vitest                              |
| Gerenciador de pacotes   | pnpm                                |

## Pré-requisitos

- Node.js (o projeto foi desenvolvido com Node 20; algumas devDeps estão pinadas
  para compatibilidade com Node 20 — ver notas em `ARCHITECTURE.md`).
- pnpm.

## Setup

```bash
pnpm install
cp .env.example .env   # (o .env já vem versionado com defaults de dev)
pnpm dev
```

A aplicação sobe em `http://localhost:5173` com os mocks ativos.

## Variáveis de ambiente

| Variável            | Default | Descrição                                                             |
| ------------------- | ------- | --------------------------------------------------------------------- |
| `VITE_ENABLE_MOCKS` | `true`  | Ativa o mock backend (MSW REST + Socket.IO). Obrigatório para a demo. |
| `VITE_API_URL`      | `/api`  | Base URL do Axios (interceptada pelo MSW).                            |
| `VITE_SCENARIO`     | `happy` | Cenário de mock padrão (ver abaixo).                                  |

## Comandos

| Comando                         | Ação                      |
| ------------------------------- | ------------------------- |
| `pnpm dev`                      | Desenvolvimento com mocks |
| `pnpm build`                    | Build de produção         |
| `pnpm preview`                  | Preview do build          |
| `pnpm typecheck`                | Checagem de tipos (`tsc`) |
| `pnpm lint`                     | ESLint                    |
| `pnpm format:check`             | Prettier (check)          |
| `pnpm test` / `pnpm test --run` | Testes Vitest             |

## Mock backend: cenários e reset

Toda a simulação vive na camada de rede (MSW). O estado é coerente entre catálogo,
carrinho, favoritos, perfil, carteiras e pedidos, e persiste em IndexedDB para
sobreviver a refresh.

**Selecionar um cenário** (precedência: query param → localStorage → env → `happy`):

- Via URL: `http://localhost:5173/?scenario=slow`
- Via console: `localStorage.setItem('greenmint:scenario', 'transient')`
- Via env: `VITE_SCENARIO=slow`

Cenários disponíveis: `happy` (padrão, sem latência/erro), `slow`, `variable`
(latência variável), `transient` (503), `unauthorized` (401), `offline`,
`session-expired` (sessão expira → 401 em rotas privadas), `register-conflict`
(cadastro retorna 409), `validation-error`, `payment-refused` (pedido recusado),
`order-timeout` (timeout na criação do pedido, recuperado por idempotência) e
`wallet-refused` (conexão de carteira recusada no checkout).

Para reproduzir o fluxo "preço muda durante o checkout": com o checkout aberto,
dispare no console `window.__greenmint.emitNftUpdated({...})` alterando o preço de um
NFT do carrinho — ao confirmar, o servidor recusa com "cotação desatualizada" e a tela
exige nova confirmação.

**Reset do cenário** (restaura integralmente o seed conhecido): no console do
navegador, com mocks ativos:

```js
await window.__greenmint.resetScenario()
```

## Reproduzir fluxos de tempo real (dev)

Com mocks ativos, o objeto `window.__greenmint` expõe gatilhos para exercitar os
eventos deterministicamente (o mesmo mecanismo que os testes E2E usarão):

```js
// atualizar preço de um NFT (precisa version > a versão em cache para aplicar)
window.__greenmint.emitNftUpdated({
  id: 'evt-1', resource: 'nft:<id>', version: <versaoAtual + 1>,
  payload: { id: '<id>', priceEth: '99.9' }
})
```

A interface reflete a alteração sem regredir em eventos antigos/duplicados.

## Credenciais fictícias

Dois usuários de teste são semeados no mock backend (ver `src/mocks/fixtures/seed.ts`).
Use-os em **Entrar** (`/login` ou o modal de login):

| E-mail                       | Senha       |
| ---------------------------- | ----------- |
| `ana.silva@greenmint.test`   | `senha1234` |
| `bruno.costa@greenmint.test` | `senha1234` |

Também é possível **criar conta** (aba "Criar conta"). Senhas nunca são armazenadas
em texto claro (hash no mock). Logout e troca de usuário limpam os dados privados em
cache e reconectam o socket com a nova identidade.

## Documentação

- `ARCHITECTURE.md` — arquitetura, contratos, política de sessão/cache, transporte
  de tempo real e suas limitações, e decisões/desvios.
