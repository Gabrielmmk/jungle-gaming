import { ArrowRight } from 'lucide-react'

interface DiaryEntry {
  image: string
  date: string
  readTime: string
  tag: string
  title: string
  excerpt: string
}

const ENTRIES: DiaryEntry[] = [
  {
    image: '/mock-assets/Image.png',
    date: '12 de setembro',
    readTime: '4 min',
    tag: 'Curadoria',
    title: 'Como escolhemos os artistas em destaque',
    excerpt:
      'Um olhar sobre o processo de curadoria do GreenMint e os critérios que guiam cada coleção aprovada.',
  },
  {
    image: '/mock-assets/Image-1.png',
    date: '10 de setembro',
    readTime: '6 min',
    tag: 'Comunidade',
    title: 'Bastidores da cunhagem da Jungle Primates',
    excerpt:
      'A série de maior sucesso da plataforma ganha um novo capítulo — entenda a jornada por trás da arte.',
  },
  {
    image: '/mock-assets/Image-2.png',
    date: '15 de setembro',
    readTime: '5 min',
    tag: 'Mercado',
    title: 'Tendências de preço em NFTs de música',
    excerpt:
      'Uma análise de como colecionáveis sonoros vêm ganhando espaço entre os investidores da rede.',
  },
  {
    image: '/mock-assets/Image-3.png',
    date: '15 de setembro',
    readTime: '3 min',
    tag: 'Guia',
    title: 'Como proteger sua carteira',
    excerpt:
      'Entenda custódia, procedência, direitos autorais e utilidade para colecionar com segurança.',
  },
]

/**
 * "Diário da Cunhagem" — cards editoriais estáticos, sem dados dinâmicos
 * (fora do escopo desta camada: não há CMS/API para posts ainda).
 */
export function MintingDiary() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="text-heading font-semibold text-text-primary">Diário da Cunhagem</h2>
          <span
            aria-disabled="true"
            className="cursor-not-allowed text-caption uppercase tracking-wide text-text-secondary/50"
          >
            Ver tudo <span className="text-tiny">em breve</span>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ENTRIES.map((entry) => (
            <article
              key={entry.title}
              className="flex flex-col gap-3 overflow-hidden rounded-lg border border-border-soft bg-surface-card"
            >
              <div className="aspect-[16/10] w-full overflow-hidden bg-surface-dark">
                <img src={entry.image} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col gap-3 p-6 pt-0">
                <p className="text-tiny uppercase tracking-wide text-text-secondary">
                  {entry.date} <span aria-hidden="true">·</span> Leitura de {entry.readTime}
                </p>
                <h3 className="text-body-lg font-medium text-text-primary">{entry.title}</h3>
                <p className="text-body text-text-secondary">{entry.excerpt}</p>
                <span className="inline-flex items-center gap-1 self-start text-caption font-medium uppercase tracking-wide text-text-accent">
                  Ler mais <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
