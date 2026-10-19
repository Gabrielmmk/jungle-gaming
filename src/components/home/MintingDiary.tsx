interface DiaryEntry {
  tag: string
  title: string
  excerpt: string
}

const ENTRIES: DiaryEntry[] = [
  {
    tag: 'Curadoria',
    title: 'Como escolhemos os artistas em destaque',
    excerpt:
      'Um olhar sobre o processo de curadoria do GreenMint e os critérios que guiam cada coleção aprovada.',
  },
  {
    tag: 'Comunidade',
    title: 'Bastidores da cunhagem da Jungle Primates',
    excerpt:
      'A série de maior sucesso da plataforma ganha um novo capítulo — entenda a jornada por trás da arte.',
  },
  {
    tag: 'Mercado',
    title: 'Tendências de preço em NFTs de música',
    excerpt:
      'Uma análise de como colecionáveis sonoros vêm ganhando espaço entre os investidores da rede.',
  },
  {
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
              className="flex flex-col gap-3 rounded-lg border border-border-soft bg-surface-card p-6"
            >
              <span className="text-caption uppercase tracking-wide text-text-accent">
                {entry.tag}
              </span>
              <h3 className="text-body-lg font-medium text-text-primary">{entry.title}</h3>
              <p className="text-body text-text-secondary">{entry.excerpt}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
