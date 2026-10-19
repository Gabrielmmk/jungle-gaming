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

## Política de sessão (Camada 1)

- **Token simulado:** `POST /auth/login` e `/auth/register` retornam `{ token, user }`.
  O token é guardado no localStorage (`greenmint:token`, `src/features/auth/tokenStore.ts`)
  e injetado pelo **request interceptor** do Axios como `Authorization: Bearer`. O MSW
  resolve `token → userId` pela tabela de sessões do `db` (fonte única). Senhas são
  **hasheadas** no `db` (djb2 — mock, nunca texto puro) e jamais retornadas pela API.
- **Recuperação no refresh:** `useSession` consulta `GET /session` no boot; 401 →
  deslogado (não erro fatal). As queries de sessão são compartilhadas com o guard.
- **Proteção de rotas:** `beforeLoad: requireAuth` (`src/features/auth/guard.ts`) usa
  `queryClient.ensureQueryData(sessionQueryOptions)` antes de decidir (evita race de
  redirect) e, sem sessão, redireciona para `/login?redirect=<destino>` — funciona em
  acesso direto e refresh. Aplicado a `/profile` e `/wallets` (checkout/pedidos nas
  próximas camadas).
- **Expiração durante a navegação:** o **response interceptor** do Axios, em 401 fora
  de `/auth/*` e `/session`, notifica handlers registrados; a app limpa a sessão e
  redireciona ao login preservando o destino. Não redireciona nos endpoints de auth
  (evita loop). Cenário `session-expired` simula isso de forma reproduzível.
- **Logout e troca de usuário (isolamento — eliminatório):** `logout`/novo login
  removem do cache as queries privadas (`session`/`favorites`/`profile`/`wallets`/
  `orders`) e **reconectam o socket** com o novo `userId` (o handler mock lê `?userId=`
  no handshake), liberando subscriptions da sessão anterior. Assim, eventos por usuário
  (`order.updated`) nunca vazam entre usuários.
- **Favoritos otimistas:** `toggleFavorite` atualiza o cache `['favorites']` em
  `onMutate`, faz **rollback** em `onError` e invalida em `onSettled` — a atualização
  otimista com rollback exigida pelo enunciado (§4).
- **Login híbrido:** rotas `/login` e `/register` (com `redirect`) e o mesmo formulário
  como **modal** (`AuthDialog`, Radix) quando disparado de um fluxo (ex.: favoritar).
  Social (Google/Facebook) e "Esqueceu a senha?" são coerentes, sem falso sucesso.

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

## Carrinho e cotação (Camada 3)

- **Estado do carrinho:** linhas `{ nftId, qty }` por **chave** = `userId` (logado)
  ou `guestId` (visitante). O cliente gera/persiste um `guestId` (`greenmint:guest`,
  `src/features/cart/guestStore.ts`) enviado em todo request como header
  `X-Guest-Id`; o servidor usa o `userId` da sessão quando existe e ignora o guest.
  Assim o carrinho **sobrevive a refresh** antes do login.
- **Merge ao autenticar:** no login/cadastro, `POST /cart/merge` mescla o carrinho do
  visitante no do usuário (somando quantidades, respeitando disponibilidade) e o
  `guestId` é descartado — preserva os itens do visitante ao autenticar.
- **Cotação (fonte da verdade dos valores):** `POST /cart/quote` retorna
  `{ items, subtotalEth, discountEth, networkFeeEth, totalEth, coupon }`, tudo em ETH
  como **string decimal** (big.js no db). A quantidade efetiva é limitada pela
  disponibilidade atual (edição esgotada durante a compra reduz a linha). Taxa de rede
  fixa (`0.016 ETH`) quando há itens.
- **Cupons:** `LAUNCH10` (-10%), `WELCOME5` (-5%) válidos; `EXPIRED` expirado;
  qualquer outro código → inválido. A cotação sinaliza `coupon.applied=false` com
  `reason: 'invalid' | 'expired'` (não é erro HTTP — a UI mostra a mensagem).
- **Disponibilidade por edição:** `addToCart`/`updateCartItem` fazem _clamp_ da
  quantidade ao `available` do NFT; `available === 0` → 409 (esgotada).
- **Tempo real:** ao receber `nft.updated` (preço/disponibilidade), `useNftEvents`
  invalida `['quote']` → o resumo do carrinho recalcula a partir do novo estado do
  catálogo enquanto o carrinho está aberto.
- **Checkout:** rota `/checkout` já é **privada** (`requireAuth`) — acessar sem sessão
  cai no login preservando o destino; a tela de pagamento é a Camada 4.

## Checkout, pedidos e confirmação (Camada 4)

- **Pedido idempotente:** `POST /api/orders` exige o header **`Idempotency-Key`**. A
  mesma chave + mesmo conteúdo recupera o **mesmo** pedido; mesma chave + conteúdo
  diferente → **409 conflito**. O cliente (`useCheckout`) gera uma chave estável por
  tentativa e a **reutiliza no retry** de timeout — sem criar compra duplicada.
- **Revalidação antes de confirmar:** a cotação atual (pós eventos de preço/
  disponibilidade) é a referência. O pedido envia `expectedTotalEth` (o total
  revisado); se divergir, o servidor recusa (409 "cotação desatualizada") e a tela
  **exige nova confirmação** (revalida e gera nova chave de idempotência).
- **Estados do pedido:** criado como `pending`; transita assíncronamente para
  `confirmed` (ou `refused` no cenário `payment-refused`), emitindo **`order.updated`**
  apenas para o usuário dono (roteamento por usuário no emitter). A tela de
  confirmação (`/order/$id`) escuta o evento e também faz `GET /orders/:id` —
  **recuperável após refresh/reconexão**; pedidos confirmados/recusados são terminais.
- **Prevenção de duplicatas:** botão desabilitado enquanto pendente + idempotência.
- **Timeout + recuperação:** cenário `order-timeout` — o pedido é criado na primeira
  tentativa mas a resposta demora além do timeout do cliente; o retry com a mesma
  chave recupera o pedido (sem duplicar). O delay/agendamento só ocorrem na primeira
  tentativa (a recuperação idempotente responde rápido).
- **Recibo como snapshot:** os itens do pedido são congelados no momento da compra
  (nome/imagem/preço/subtotal); alterações posteriores no catálogo **não** mudam o
  recibo. Referência de transação (`txHash`) e link de explorador são **simulados**.
- **Pós-compra:** a disponibilidade das edições compradas é decrementada e o carrinho
  do usuário é esvaziado (remove os itens comprados).
- **Carteira e rede:** seleção de carteira cadastrada ou provedor (MetaMask/Coinbase)
  com **simulação de conexão/recusa/desconexão** (cenário `wallet-refused` recusa a
  conexão). Social/provedores reais estão fora de escopo.
- **Cenários novos:** `payment-refused`, `order-timeout`, `wallet-refused`.

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

- **Paleta, tipografia e composição** seguem os tokens extraídos do Figma — sem
  desvios relevantes.
- **Assets de arte dos NFTs:** os arquivos de imagem ficam em `public/mock-assets/`
  e são referenciados pelo seed (`src/mocks/fixtures/seed.ts`), ciclados de forma
  determinística entre os NFTs (cada NFT recebe uma arte de base; a galeria combina
  variações do mesmo conjunto). Para trocar/ampliar o conjunto, basta adicionar
  arquivos à pasta e ajustar a lista `NFT_IMAGES` no seed. O hero da Início usa uma
  dessas imagens à direita (layout de 2 colunas, fiel ao Figma).
- **Carteiras:** o formulário do Figma tem campos adicionais presentacionais (nome
  do perfil, código de indicação, ENS secundário). A tela implementa os campos
  **funcionais** (apelido, endereço, rede) em layout de 2 colunas equivalente;
  campos puramente decorativos foram omitidos (YAGNI) — não há requisito funcional
  para eles.

## Regressão visual (Playwright, §9)

Baselines versionadas em `e2e/visual.spec.ts-snapshots/` para Início, Detalhe,
Carrinho e Pagamento, nos projetos **desktop (1440)** e **mobile (390)**. As
**imagens são mascaradas** nas capturas (`mask: [page.locator('img')]`): a regressão
foca em layout, estrutura, espaçamento, cores e tipografia — os binários de arte não
entram nas baselines. Dados determinísticos vêm do seed. Para regenerar após mudanças
intencionais de UI: `pnpm test:e2e:update`.
