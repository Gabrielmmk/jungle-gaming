import { ArrowRight } from 'lucide-react'

interface Banner {
  image: string
  title: string
  text: string
}

const BANNERS: Banner[] = [
  {
    image: '/mock-assets/Image-1.png',
    title: 'Lançamentos gênesis de edição limitada',
    text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
  },
  {
    image: '/mock-assets/Image-3.png',
    title: 'Arte digital selecionada e muito mais',
    text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a rede.',
  },
]

/**
 * Faixa com dois banners editoriais da Início (estáticos). A ação
 * "Explorar" é presentacional (conteúdo editorial fora do escopo); não
 * finge sucesso funcional.
 */
export function GenesisBanners() {
  return (
    <section className="px-6 py-8">
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2">
        {BANNERS.map((banner) => (
          <div
            key={banner.title}
            className="flex items-center gap-5 rounded-lg border border-border bg-surface-card p-5"
          >
            <img src={banner.image} alt="" className="h-24 w-24 shrink-0 rounded-md object-cover" />
            <div className="flex min-w-0 flex-col gap-2">
              <h3 className="text-body-lg font-medium text-text-primary">{banner.title}</h3>
              <p className="text-caption text-text-secondary">{banner.text}</p>
              <button
                type="button"
                className="mt-1 inline-flex items-center gap-1 self-start rounded-md bg-primary px-3 py-1.5 text-caption text-ink"
              >
                Explorar <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
