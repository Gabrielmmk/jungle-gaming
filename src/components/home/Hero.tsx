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
    <section className="border-b border-border bg-gradient-to-b from-surface-dark to-ink">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-20">
        <div className="flex flex-col items-start gap-6 text-left">
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
        <div className="hidden justify-self-end md:block">
          <img
            src="/mock-assets/Image.png"
            alt="Destaque da coleção GreenMint"
            className="aspect-square w-full max-w-[420px] rounded-2xl border border-border-soft object-cover"
          />
        </div>
      </div>
    </section>
  )
}

export { CATALOG_ANCHOR_ID }
