import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from '@/routes/__root'
import { nftSearchSchema } from '@/features/discovery/useNftSearch'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Hero } from '@/components/home/Hero'
import { GenesisBanners } from '@/components/home/GenesisBanners'
import { MintingDiary } from '@/components/home/MintingDiary'
import { Discovery } from '@/features/discovery/Discovery'
import { SearchBox } from '@/features/discovery/SearchBox'
import { useNftEvents } from '@/features/realtime/useNftEvents'

/**
 * Roteamento code-based: a rota índice é criada a partir da rota raiz
 * (sem geração de arquivos/plugin). Ver src/app/router.tsx, que monta a
 * árvore com `rootRoute.addChildren([...])`.
 *
 * `validateSearch` usa o schema de busca da Descoberta (Task 5) para que
 * os search params da URL (`?q=`, `?categories=`, `?page=`, ...) sejam
 * validados/tipados pelo Router.
 *
 * Composição da tela de Início (Chunk 3): Header (com `SearchBox` no
 * slot de busca) + Hero + catálogo (`Discovery`, com filtros/ordenação/
 * paginação/estados e o NFT em destaque na coluna lateral) + editorial +
 * Footer.
 */
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: nftSearchSchema,
  component: IndexPage,
})

function IndexPage() {
  // Conecta ao canal de tempo real para que `nft.updated` reflita no
  // catálogo (cache `['nfts', ...]`) sem exigir refetch. A indicação
  // visual "em atualização" dos cards já existe via `isBackgroundUpdating`
  // em Discovery; aqui só garantimos que o cache seja mantido fresco.
  useNftEvents()

  return (
    <div className="flex min-h-screen flex-col bg-ink font-mono text-text-primary">
      <Header search={<SearchBox />} />
      <main className="flex-1">
        <Hero />
        <Discovery />
        <GenesisBanners />
        <MintingDiary />
      </main>
      <Footer />
    </div>
  )
}
