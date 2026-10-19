import { ArrowRight } from 'lucide-react'
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
    <>
      {/* Card compacto (mobile): o Figma usa uma composição própria aqui —
          cartão com gradiente, copy mais curta e a ilustração também
          visível (diferente do desktop, que esconde a imagem em telas
          pequenas) — em vez de só colapsar o layout desktop. */}
      <section className="px-4 pt-4 md:hidden">
        <div className="relative overflow-hidden rounded-2xl border border-border-soft bg-gradient-to-br from-surface-dark via-surface-dark to-ink p-5">
          <p className="text-caption text-text-secondary">Bem-vindo à Kurio</p>
          <h1 className="mt-2 max-w-[70%] text-[22px] font-bold uppercase leading-tight tracking-wide text-text-primary">
            Seja dono da cultura digital
          </h1>
          <p className="mt-2 max-w-[65%] text-caption text-text-secondary">
            Descubra NFTs selecionados de criadores do mundo todo.
          </p>
          <button
            type="button"
            onClick={scrollToCatalog}
            className="mt-3 flex items-center gap-1.5 text-caption font-bold uppercase tracking-wide text-primary"
          >
            Explorar
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </button>

          <div className="pointer-events-none absolute -right-4 top-4 h-32 w-32">
            <img
              src="/mock-assets/Image-2.png"
              alt=""
              aria-hidden="true"
              className="absolute right-4 top-6 size-20 rounded-2xl border border-border-soft object-cover"
            />
            <img
              src="/mock-assets/Image.png"
              alt="Destaque da coleção GreenMint"
              className="absolute right-0 top-0 size-28 rounded-2xl border border-border-soft object-cover"
            />
          </div>

          <div className="mt-6 flex justify-center gap-2" aria-hidden="true">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="h-1.5 w-1.5 rounded-full bg-text-secondary/40" />
            <span className="h-1.5 w-1.5 rounded-full bg-text-secondary/40" />
          </div>
        </div>
      </section>

      <section className="hidden border-b border-border bg-gradient-to-b from-surface-dark to-ink md:block">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-20">
          <div className="flex flex-col items-start gap-6 text-left">
            <p className="text-caption uppercase tracking-[0.2em] text-text-accent">
              GreenMint Marketplace
            </p>
            <h1 className="text-display font-semibold leading-tight text-text-primary">
              SEJA DONO DO FUTURO DA ARTE DIGITAL
            </h1>
            <p className="max-w-xl text-body-lg text-text-secondary">
              Descubra, colecione e negocie NFTs únicos de artistas e criadores de todo o mundo,
              com curadoria e transparência em cada cunhagem.
            </p>
            <Button variant="default" size="lg" onClick={scrollToCatalog}>
              EXPLORAR
            </Button>
            <div className="flex gap-2 pt-2" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="h-2 w-2 rounded-full bg-text-secondary/40" />
              <span className="h-2 w-2 rounded-full bg-text-secondary/40" />
            </div>
          </div>
          <div className="justify-self-end">
            <img
              src="/mock-assets/Image.png"
              alt="Destaque da coleção GreenMint"
              className="aspect-square w-full max-w-[420px] rounded-2xl border border-border-soft object-cover"
            />
          </div>
        </div>
      </section>
    </>
  )
}

export { CATALOG_ANCHOR_ID }
