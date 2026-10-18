import { Button } from '@/components/ui/button'

const CATALOG_ANCHOR_ID = 'catalogo'

/**
 * Hero estático da Início. O botão "EXPLORAR" rola até o catálogo
 * (ancorado por `CATALOG_ANCHOR_ID`, usado também em `Discovery`) em vez
 * de navegar — a página de Início já contém o catálogo abaixo do hero.
 */
export function Hero() {
  const scrollToCatalog = () => {
    document.getElementById(CATALOG_ANCHOR_ID)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="border-b border-border bg-gradient-to-b from-surface-dark to-ink px-6 py-20 text-center">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
        <p className="text-caption uppercase tracking-[0.2em] text-text-accent">
          GreenMint Marketplace
        </p>
        <h1 className="text-display font-semibold leading-tight text-text-primary">
          SEJA DONO DO FUTURO DA ARTE DIGITAL
        </h1>
        <p className="max-w-xl text-body-lg text-text-secondary">
          Descubra, colecione e negocie NFTs únicos de artistas e criadores de todo o mundo, com
          curadoria e transparência em cada cunhagem.
        </p>
        <Button variant="default" size="lg" onClick={scrollToCatalog}>
          EXPLORAR
        </Button>
      </div>
    </section>
  )
}

export { CATALOG_ANCHOR_ID }
