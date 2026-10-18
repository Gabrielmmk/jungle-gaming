# Arquitetura — GreenMint NFT Marketplace

Documento vivo. Reflete o estado atual (Camada 0 — Fundação & Mock Backend) e cresce
a cada camada entregue.

## Visão geral

SPA React servida estaticamente. **Nenhum backend real**: toda a simulação (REST e
tempo real) acontece na camada de rede via MSW, de forma que componentes, hooks e o
cliente Axios não contêm respostas fictícias nem caminhos de negócio alternativos.

```
UI (features/routes) → hooks TanStack Query → Axios → [rede]
   ↑                                                     │
   │                                           MSW intercepta (REST)
   │                                                     ↓
   │                                          mocks/rest (adapter fino)
   │                                                     ↓
   └── socket.io-client ← mocks/socket (emitter) ← mocks/db (store + REGRAS)
                             (adapter fino)              ↑
                                              mocks/persistence (IndexedDB)
```

### Princípio central: store única + adapters finos

- **`src/mocks/db`** concentra TODO o estado e as regras de negócio. É a fonte única
  da verdade (`src/mocks/db/instance.ts` é o singleton compartilhado por REST e
  Socket.IO, garantindo que ambos observem o mesmo estado).
- **`src/mocks/rest`** e **`src/mocks/socket`** são adapters finos: só traduzem
  transporte ↔ métodos do db. Nenhuma regra de negócio vive neles.
- Consequência: uma mudança de dados reflete de forma coerente tanto em REST quanto
  em eventos de tempo real.

## Estrutura de pastas

```
src/
  app/        providers (QueryClient + RouterProvider), router code-based
  contracts/  tipos + schemas zod (fonte da verdade) — errors, events, eth, nft
  shared/     axios (instância única), queryClient, eth/money (big.js)
  mocks/
    db/         createDb (store + regras) + instance (singleton) + types
    fixtures/   seed determinístico (44 NFTs, 2 usuários, SCHEMA_VERSION)
    persistence/ IndexedDB (idb-keyval) load/save/reset com invalidação por schema
    scenarios/  registry de cenários (latência/falhas) configurável e determinístico
    rest/       handlers MSW (adapter)
    socket/     emitter (roteamento por usuário) + handlers (binding Socket.IO)
    browser.ts  setupWorker (REST + WS) + enableMocks() + window.__greenmint
    server.ts   setupServer (node) para testes
  features/   hooks por domínio (discovery, nft-detail, favorites, realtime: useNftEvents)
  routes/     telas (code-based router)
```

## Contratos REST

Definidos em `src/contracts` (tipos + schemas zod, reusados por db, adapters e UI).
Erros padronizados (`contracts/errors.ts`):

| Código       | HTTP | Uso                                                 |
| ------------ | ---- | --------------------------------------------------- |
| validation   | 422  | campos inválidos (detalhes por campo)               |
| unauthorized | 401  | sessão inválida/expirada                            |
| forbidden    | 403  | sem permissão                                       |
| not_found    | 404  | recurso inexistente                                 |
| conflict     | 409  | disponibilidade / idempotência / cadastro duplicado |
| transient    | 503  | falha transitória simulada                          |

Recurso implementado nesta camada: `GET /api/nfts` (listagem com
busca/filtros/ordenação/paginação), com a resposta validada por
`listNftsResponseSchema`. Os demais recursos (sessão, favoritos, carrinho, cotação,
pedidos, perfil, carteiras) têm os tipos definidos e são implementados nas camadas
seguintes.

### Valores em ETH

ETH trafega sempre como **string decimal** (tipo nominal `EthAmount`). A aritmética
usa **big.js** (`src/shared/eth/money.ts`, `Big.DP = 18`); nunca `number`.
Quantidades são inteiras.

## Tempo real (Socket.IO) e suas limitações no ambiente de mocks

Transporte: **socket.io-client** contra um binding `@mswjs/socket.io-binding` sobre
o `WebSocketInterceptor` do MSW. Limitações conhecidas e decisões (requisito do
enunciado — "documente o transporte e suas limitações"):

1. **A interceptação de WebSocket do MSW NÃO passa pelo Service Worker** — faz patch
   de `globalThis.WebSocket` no runtime da página. Funciona no build de demo e no
   Chromium do Playwright.
2. **`transports: ['websocket']` é obrigatório.** O socket.io-client por padrão
   começa com HTTP long-polling e só depois faz upgrade para WebSocket; o binding só
   intercepta WebSocket. Por isso o cliente é configurado para pular o polling.
3. **Sem rooms/namespaces/broadcasting nativos** no binding → o roteamento por
   usuário é feito na nossa camada (`src/mocks/socket/emitter.ts`): `emitNftUpdated`
   faz broadcast (catálogo é global); `emitOrderUpdated(envelope, userId)` entrega
   somente aos sockets do usuário-alvo. Isolamento por usuário é um requisito
   eliminatório e é coberto por teste unitário (`tests/emitter.test.ts`).
4. **Sob Node/Vitest o binding não intercepta socket.io-client** (o Engine.IO usa o
   pacote `ws`, que não passa por `globalThis.WebSocket`). Por isso o teste de
   integração com o cliente real está `describe.skip` em `tests/socket.test.ts` e
   será portado para o Playwright na Camada 6 (navegador real = WebSocket nativo,
   interceptável). O roteamento continua coberto por teste unitário.

### Envelope de evento e idempotência de eventos

Eventos carregam `{ id, resource, version, payload }`. O cliente tolera duplicatas e
eventos antigos: `useNftEvents` só aplica um evento quando `envelope.version` é
**estritamente maior** que a versão em cache — nunca regride nem reaplica efeitos.
A partir da Camada 2, essa regra é aplicada tanto ao(s) cache(s) de listagem
(`['nfts', ...]`) quanto ao cache de detalhe (`['nft', id]`), já que o hook é
montado tanto na Início quanto no detalhe (ver seção "Descoberta (Camada 2)").
Listeners e o socket são liberados no unmount, em cada rota que monta o hook.

## Estratégia de cache (TanStack Query)

Defaults em `src/shared/query/queryClient.ts`:

- `staleTime: 30s` — reduz refetches redundantes mantendo frescor razoável.
- `retry: 1` — uma tentativa extra para falhas transitórias, sem amplificar
  tempestades de erro.
- `refetchOnWindowFocus: false` — evita refetch agressivo ao focar a janela.

queryKeys incluem os parâmetros da consulta (ex.: `["nfts", params]`) para
isolamento por parâmetros. Invalidação/atualização coerente após mutations e eventos
é refinada nas camadas que introduzem mutations.

## Reconciliação REST ↔ Socket.IO

O db é a fonte única: mutações REST e eventos de tempo real operam sobre o mesmo
estado (`db` singleton). Após reconexão, os recursos ativos devem ser reconciliados
via REST (implementado junto com os fluxos que mantêm subscriptions — camadas 3–5).
O dedupe por versão garante que a ordem de chegada de eventos não corrompa o estado.

## Persistência e reset

O estado do mock persiste em IndexedDB (`idb-keyval`) com uma `SCHEMA_VERSION`; se a
versão de schema mudar, o estado antigo é invalidado. `resetScenario()` reconstrói
integralmente a partir do seed determinístico (inclusive versões de recursos).

## Cenários e injeção de falhas

`src/mocks/scenarios/scenarios.ts` seleciona o cenário ativo (query → localStorage →
env → `happy`) e expõe `applyLatency`/`maybeFault` usados pelos adapters. Cenários
são determinísticos e reproduzíveis. O padrão `happy` (sem latência/erro) é o usado
pelo build de demo e pela auditoria Lighthouse.

## Política de sessão

Autenticação, sessão recuperável, expiração e troca de usuário são entregues na
Camada 1. O isolamento de dados por usuário já está previsto no db (partes por
usuário) e no emitter (roteamento por usuário).

## Descoberta (Camada 2)

Tela de Início (`/`) e detalhe (`/nft/:id`), com o catálogo, filtros, busca,
ordenação, paginação, favoritos (gated) e atualização em tempo real.

### Rotas e estado na URL

`src/features/discovery/useNftSearch.ts` é a única fonte de verdade dos
parâmetros de busca (`q`, `categories`, `networks`, `minPrice`, `maxPrice`,
`sort`, `page`) — vivem nos search params da rota `/` (`nftSearchSchema`,
validados pelo TanStack Router), não em `useState` local. Isso dá
back/forward do navegador, URLs compartilháveis e refresh preservando o
filtro. Qualquer mudança de filtro/busca/ordenação reseta `page` para `1`
(evita cair numa página inexistente depois de reduzir o total de
resultados); mudar só `page` não afeta os demais parâmetros.

### Facets globais

`GET /api/nfts` devolve `facets` (contagens por categoria/rede) calculadas
sobre o catálogo **inteiro**, não sobre o resultado já filtrado — os
checkboxes de filtro mostram sempre quantos itens existem em cada
categoria/rede no universo completo, para que o usuário veja o que pode
ainda ser combinado em vez de só o que resta depois do filtro atual.

### Favoritos gated (401 → prompt de login)

`useFavorites` (`src/features/favorites/`) distingue usuário autenticado de
anônimo. Sem sessão, `toggleFavorite` **não** chama a API (evitaria um 401
silencioso ou, peior, fingir que salvou): liga um prompt local
(`showLoginPrompt`) convidando para login, renderizado por quem usa o hook
(`FavoriteButton`). Persistência real do favorito (por usuário, via API) é
entregue na Camada 1 (sessão); aqui o botão já está pronto para o fluxo
autenticado, só falta o backend de sessão real.

### COMPRAR "em breve" sem falso sucesso

O carrinho é escopo da Camada 3. Em vez de simular um "adicionado ao
carrinho" (sucesso fictício que o usuário acreditaria), o botão "Comprar"
na tela de detalhe (`src/routes/nft.$id.tsx`) exibe um aviso honesto —
"Carrinho de compras em breve. Essa ação ainda não está disponível." — via
`role="status"`, sem persistir nada e sem navegar para um fluxo
inexistente. Mesmo princípio em outros pontos da UI fora do escopo desta
camada (links "Criadores"/"Aprenda" no header, "Ver tudo" do Diário da
Cunhagem): marcados com `aria-disabled` + rótulo "em breve" em vez de
apontar para uma rota 404 ou fingir uma ação.

### Tempo real no catálogo e no detalhe (`nft.updated`)

`useNftEvents` (`src/features/realtime/useNftEvents.ts`, movido de
`features/nfts/` nesta camada) é montado tanto na Início quanto no
detalhe — cada rota mantém sua própria conexão socket.io (aberta/fechada no
mount/unmount), e o evento `nft.updated` é aplicado em **ambos** os caches
do React Query que possam estar afetados:

- todas as queries de listagem já cacheadas (`['nfts', ...]`, uma por
  combinação de parâmetros);
- o cache de detalhe do NFT afetado (`['nft', id]`), se existir.

A regra de dedupe por versão (`envelope.version` estritamente maior que a
`version` em cache) é aplicada identicamente nos dois casos — um evento
atrasado ou duplicado nunca regride nenhum dos dois caches. Quando uma
atualização é efetivamente aplicada, o hook invoca `onApplied(nft)`
(lido de um `ref` atualizado em efeito próprio, para não forçar reconectar o
socket a cada re-render do consumidor com uma função inline nova). A tela
de detalhe usa esse callback para acender um indicador acessível
(`UpdatedBadge`, `src/components/feedback/UpdatedBadge.tsx`) perto do
preço — ícone + texto dentro de um `role="status"` (`aria-live="polite"`
implícito, nunca só cor), que se limpa sozinho após alguns segundos.

### Decisões e ajustes de acessibilidade/assets nesta camada

- **Movimento sempre `motion-safe:`**: além do shimmer do skeleton (já
  gated desde a Camada 0), o hover-zoom do `NftCard`
  (`motion-safe:group-hover:scale-105`) e a barra de "atualizando em
  segundo plano" do catálogo (`motion-safe:animate-pulse`) agora também
  respeitam `prefers-reduced-motion` — nenhuma animação roda fora desse
  guard.
- **Nada depende só de cor**: disponibilidade do card (ícone
  `PackageCheck`/`PackageX` + texto), favorito (`aria-pressed` + ícone
  preenchido + rótulo), edição esgotada (rótulo textual, não só opacidade)
  e o novo badge de atualização em tempo real (ícone + texto) seguem o
  mesmo princípio.
- **Filtros móveis**: o drawer de filtros (`Sheet`, Radix Dialog) já
  herda focus trap, fechar no Escape e retorno de foco ao disparador —
  reaproveitado em vez de reimplementado.
- Sem desvios de asset relevantes vs. Figma nesta camada — as imagens do
  catálogo usam o seed determinístico de mocks (Camada 0); nenhuma troca de
  fonte/ícone/paleta foi necessária além do que já estava documentado na
  Camada 0.

## Decisões e pins de ambiente

- **MSW v2** (não v3): o `@mswjs/socket.io-binding` só suporta o range de peer da v2.
- **jsdom** pinado para compatibilidade com Node 20 (jsdom 30 exige Node ≥ 22.19).
- **shadcn/ui** com componentes escritos à mão seguindo o padrão oficial
  (`clsx` + `tailwind-merge` + `cva` + `@radix-ui/react-slot`), porque o CLI puxou um
  preset incompatível com Tailwind v3.
- **Tailwind v3** (compatível com shadcn), tokens mapeados para CSS vars.
- **Roboto Mono** self-hosted (`public/fonts/`, licença OFL) para evitar request
  externo (ajuda Best Practices/Performance).

## Desvios em relação ao Figma

Nenhum desvio relevante na Camada 0 (a página de prova de catálogo é mínima e será
substituída pela tela de Início na Camada 2). Na Camada 2 (Descoberta), nenhum
desvio relevante de asset/paleta/tipografia foi necessário — ver detalhes de a11y
e decisões específicas da camada na seção "Descoberta (Camada 2)" acima. Desvios e
substituições de asset futuros serão registrados aqui conforme as telas forem
implementadas.
