# Camada 0 — Fundação & Mock Backend — Design

**Data:** 2026-10-18
**Projeto:** NFT Marketplace (Desafio Frontend)
**Status:** Spec para aprovação
**Escopo:** Sub-projeto 0 de 8 da decomposição do desafio.

---

## 1. Contexto e objetivo

O desafio pede um NFT Marketplace completo em React + TypeScript, avaliado por
fidelidade visual, fluxos, integração/estado, tempo real, mocking, testes,
acessibilidade e performance. A stack é obrigatória (React, TS, TanStack Router,
TanStack Query, Axios, REST, Socket.IO, Tailwind, shadcn/ui, MSW, Playwright,
Lighthouse).

O projeto foi decomposto em 8 sub-projetos. **Esta spec cobre apenas a Camada 0**,
que é pré-requisito de todas as outras:

- Camada 0 — **Fundação & Mock Backend** (esta spec)
- Camada 1 — Sessão & Conta
- Camada 2 — Descoberta (Início + Detalhe)
- Camada 3 — Carrinho
- Camada 4 — Checkout & Confirmação
- Camada 5 — Tempo Real
- Camada 6 — Testes Playwright
- Camada 7 — Performance & Deploy

Tempo real, testes e acessibilidade são transversais: cada camada entrega seus
próprios listeners, testes e requisitos de a11y.

**Objetivo da Camada 0:** estabelecer o esqueleto do projeto e um "mock backend"
coerente e stateful (REST + Socket.IO) sobre o qual todas as features seguintes
são construídas, exercitando a stack obrigatória ponta-a-ponta.

### Decisões já tomadas (contexto)

- Build: **Vite + React (SPA)** com TanStack Router (não Next/TanStack Start).
- Gerenciador de pacotes: **pnpm**.
- Deploy: **Vercel** (SPA com rewrites para acesso direto/refresh de rotas).
- Modelo do mock backend: **store central in-memory + adapters finos** para REST
  e Socket.IO (decisão de arquitetura central).
- Acesso ao Figma: via **Figma MCP** (link pendente no momento da escrita; a
  extração de tokens é um passo disparado ao receber o link).

---

## 2. Risco técnico resolvido: mock de Socket.IO sobre MSW

Pesquisa confirmou a viabilidade e as limitações de `@mswjs/socket.io-binding`:

- É um wrapper sobre o `WebSocketInterceptor` do MSW que faz encode/decode do
  protocolo Socket.IO e expõe uma API tipo servidor (`io.client.on/emit`).
- **A interceptação de WebSocket do MSW NÃO passa pelo Service Worker** — faz
  patch de `globalThis.WebSocket` no runtime da página. Funciona no build de demo
  e no Chromium do Playwright (socket.io-client usa WebSocket nativo no browser).
- **O socket.io-client deve ser configurado com `transports: ['websocket']`** para
  pular o HTTP long-polling inicial (que o binding não intercepta).
- O binding **não** tem rooms/namespaces/broadcasting nativos — o roteamento por
  usuário é modelado na nossa camada.

Essas limitações serão documentadas no `ARCHITECTURE.md` (requisito do enunciado:
"documente o transporte utilizado e suas limitações no ambiente de mocks").

Fontes: https://github.com/mswjs/socket.io-binding ,
https://mswjs.io/docs/websocket/ , https://mswjs.io/blog/enter-websockets/

---

## 3. Arquitetura

### 3.1 Estrutura de pastas

```
src/
  app/          # router, providers (QueryClient, theme), bootstrap da aplicação
  contracts/    # tipos + schemas (zod) do contrato REST/eventos — fonte da verdade
  mocks/
    db/         # store central in-memory + regras de negócio (o "servidor")
    rest/       # handlers MSW (adapters finos sobre db)
    socket/     # emitter Socket.IO (adapter sobre db) + binding
    scenarios/  # cenários configuráveis (latência, 4xx/5xx, timeouts, fora de ordem)
    fixtures/   # seeds determinísticos (2 usuários, catálogo p/ filtros/paginação)
    persistence/# IndexedDB load/save + reset
  shared/       # instância axios, hooks query base, primitives shadcn, utils ETH
  features/     # (vazio por ora; preenchido nas camadas seguintes)
  routes/       # TanStack Router
```

### 3.2 Fluxo de dados

```
UI (features) → hooks TanStack Query → axios (shared) → [rede]
   ↑                                                        │
   │                                              MSW intercepta
   │                                                        ↓
   │                                           mocks/rest (adapter)
   │                                                        ↓
   └──── socket.io-client ← mocks/socket ←─────────── mocks/db (store + regras)
                              (adapter)                      ↑
                                                   mocks/persistence (IndexedDB)
```

- Axios é instanciado **uma vez** em `shared/`; todas as queries/mutations passam
  por ele. MSW intercepta na camada de rede → axios não sabe que é mock.
- **Toda regra de negócio vive em `mocks/db/`.** Handlers REST e emitter Socket.IO
  são adapters finos que só traduzem transporte ↔ métodos do db. Isso garante que
  "mudanças nos dados simulados sejam refletidas tanto em REST quanto em eventos" e
  atende o eliminatório "componentes/hooks/axios sem respostas fictícias".

### 3.3 Contracts tipados (`contracts/`)

Cada recurso define, num módulo próprio, os tipos de request/response, schemas
`zod` para validação em runtime, e os tipos de erro padronizados. Recursos:
sessão/conta, nfts, favoritos, carrinho, cotação, pedidos, perfil, carteiras.

Tipos de erro padronizados (reaproveitados por db, handlers e UI):

| Erro            | HTTP | Uso |
|-----------------|------|-----|
| validation      | 422  | campos inválidos (com detalhes por campo) |
| unauthorized    | 401  | sessão inválida/expirada |
| forbidden       | 403  | sem permissão |
| not_found       | 404  | recurso inexistente |
| conflict        | 409  | disponibilidade / idempotência / cadastro duplicado |
| transient       | 503  | falha transitória simulada |

**ETH sempre como `string` decimal** (tipo nominal `EthAmount`). Aritmética via
lib de decimais (ex.: `big.js`/`dinero.js`) — **nunca `number`**. Quantidades são
inteiras. A cotação da API é a referência para finalizar o pedido.

### 3.4 Núcleo do mock backend (`mocks/db/`)

`createMockDb(seed)` cria um estado com partes **isoladas por usuário** (favoritos,
carrinho, pedidos, perfil, carteiras) e partes **globais** (catálogo). Expõe
métodos de negócio puros, por exemplo:

- `listNfts(params)` — busca/filtros/ordenação/paginação; reflete parâmetros.
- `getNft(id)` — detalhe; `not_found` quando inexistente.
- `addToCart / updateCartItem / removeCartItem` — respeita disponibilidade por edição.
- `applyCoupon / removeCoupon` — valida código inválido/expirado.
- `quote(cartId)` — subtotal, desconto, taxa de rede, total (strings decimais).
- `createOrder(idempotencyKey, payload)` — idempotente (ver 3.4.1).
- `getOrder(id)` — estado + recibo (snapshot).
- Perfil e carteiras: consulta/atualização.

Cada recurso versionável (nft, pedido) carrega um campo `version` monotônico.

#### 3.4.1 Idempotência de pedidos

- `createOrder` aceita uma **chave de idempotência**.
- Mesma chave + mesmo conteúdo → **recupera o mesmo pedido** (não cria outro).
- Mesma chave + conteúdo diferente → **conflito (409)**.
- Pedidos confirmados/recusados são **terminais**.
- Suporta o cenário de timeout pós-criação: o pedido é criado no db mesmo que a
  resposta "falhe" por timeout; o retry com a mesma chave recupera o pedido.

### 3.5 Adapter REST (`mocks/rest/`)

Handlers MSW que só traduzem HTTP ↔ métodos do db; **nenhuma regra aqui**. Cada
mutation que altera um recurso versionável dispara o evento correspondente no
emitter (3.6). Erros HTTP mapeados dos tipos de erro do contrato.

### 3.6 Adapter Socket.IO (`mocks/socket/`)

- Usa `@mswjs/socket.io-binding` sobre o `WebSocketInterceptor` do MSW.
- Cliente configurado com `transports: ['websocket']`.
- Eventos mínimos: `nft.updated`, `order.updated`.
- **Envelope de evento:** `{ id, resource, version, payload }` — identidade estável,
  recurso afetado e versão, para o cliente tolerar duplicatas e eventos antigos.
- **Roteamento por usuário na nossa camada** (binding sem rooms): o emitter
  entrega apenas aos sockets do(s) usuário(s) relevante(s). Eventos de uma sessão
  anterior não podem atualizar dados de outro usuário.
- **Gatilho manual de cenário** (ex.: `scenario.emitNftPriceChange(id)`) para os
  testes dispararem eventos deterministicamente, sempre pelo cliente socket.io
  (nunca por setter/cache direto — isso é eliminatório).

### 3.7 Persistência & reset (`mocks/persistence/`)

- O db serializa em **IndexedDB** para sobreviver a refresh.
- Chave de versão de schema invalida estado antigo quando o formato muda.
- `resetScenario(name)` restaura **integralmente** um seed conhecido.

### 3.8 Cenários & injeção de falhas (`mocks/scenarios/`)

Camada configurável (via query param / env / painel dev) e **reproduzível**, que
injeta de forma determinística:

- sucesso e resultado vazio;
- latência fixa/variável e respostas fora de ordem;
- offline, timeouts, respostas 4xx/5xx;
- sessão expirada e acesso não autorizado;
- conflito de cadastro / validação de formulário;
- cupom inválido ou expirado;
- preço alterado / edição esgotada durante a compra;
- timeout após criação do pedido, recuperável por idempotência;
- pagamento confirmado e pagamento recusado.

### 3.9 Ativação & demo build

- MSW ligado por flag de ambiente (`VITE_ENABLE_MOCKS`), **incluído no build de
  demo** (Vercel). Worker REST via Service Worker; WS via patch de `WebSocket`.
- A aplicação publicada deve corresponder ao código e manter mocks + tempo real
  funcionando, com acesso direto e refresh de rotas.

### 3.10 Design tokens (`PENDENTE Figma`)

Ao receber o link do Figma: extrair cores/tipografia/spacing/radii/shadows via
Figma MCP → `tailwind.config` + CSS vars do tema shadcn; baixar assets
(imagens/ícones/fontes) para `public/`. Até lá, placeholders documentados. Qualquer
substituição de asset ou desvio será registrado no `ARCHITECTURE.md`.

---

## 4. Contratos tocados nesta camada

A Camada 0 **define os tipos** de todos os contratos (fonte da verdade), mas só
**implementa o suficiente** para provar a fundação ponta-a-ponta. Mínimo
implementado: `GET /nfts` (listagem) e um evento `nft.updated`. Os demais recursos
ganham tipos + stubs, implementados nas camadas seguintes.

---

## 5. Critério de pronto (Definition of Done)

1. App sobe com Vite + React + TS; TanStack Router, Query, axios, Tailwind,
   shadcn/ui configurados.
2. MSW ativo por flag, incluído no build de demo.
3. `GET /nfts` responde do db via axios + TanStack Query (estados loading/empty/
   error/success observáveis).
4. Um evento `nft.updated` chega ao cliente **via socket.io-client** (não setter
   direto), com envelope `{ id, resource, version, payload }`.
5. Persistência em IndexedDB sobrevive a refresh; `resetScenario` restaura seed.
6. Cenários de latência/erro selecionáveis e reproduzíveis.
7. `tsc` sem erros; lint limpo.

---

## 6. Fora de escopo (desta camada)

- Telas/fluxos de feature (descoberta, carrinho, checkout, conta) — camadas 1-4.
- Lógica completa de favoritos/carrinho/cotação/pedidos além dos stubs — camadas 2-4.
- Testes Playwright completos — Camada 6 (mas os ganchos de cenário/gatilho de
  evento são entregues aqui para os testes consumirem).
- Auditoria Lighthouse e deploy — Camada 7.
- Extração final de tokens do Figma — disparada ao receber o link.

---

## 7. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| WS do MSW não passa por SW; polling não interceptado | `transports:['websocket']`; patch de `WebSocket` documentado |
| Binding sem rooms → vazamento entre usuários (eliminatório) | roteamento por usuário na nossa camada do emitter |
| Estado inconsistente entre REST e eventos | store central única como fonte; adapters sem regra |
| Precisão de ETH | strings decimais + lib de decimais; proibido `number` |
| Estado persistido com schema antigo | chave de versão de schema no IndexedDB |
| Link do Figma ausente | tokens como passo disparável; plano B documentado como desvio |
