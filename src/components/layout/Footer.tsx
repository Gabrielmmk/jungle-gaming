import { Link } from '@tanstack/react-router'

const HIGHLIGHTS = [
  {
    badge: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    badge: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    badge: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

const COMPATIBLE_WALLETS = ['MetaMask', 'WalletConnect', 'Coinbase']

const SOCIALS = [
  { glyph: 'f', label: 'Facebook' },
  { glyph: 'IG', label: 'Instagram' },
  { glyph: 'X', label: 'Twitter' },
  { glyph: 'in', label: 'LinkedIn' },
  { glyph: '▶', label: 'YouTube' },
]

interface FooterColumn {
  title: string
  links: Array<{ label: string; to?: '/' | '/profile' }>
}

const COLUMNS: FooterColumn[] = [
  {
    title: 'Meu perfil',
    links: [
      { label: 'Meu perfil', to: '/profile' },
      { label: 'Minha coleção' },
      { label: 'Atividade' },
      { label: 'Estúdio do criador' },
      { label: 'Lista de interesse' },
    ],
  },
  {
    title: 'Central de ajuda',
    links: [
      { label: 'Central de ajuda' },
      { label: 'Como comprar NFTs' },
      { label: 'Carteira e segurança' },
      { label: 'Política do mercado' },
      { label: 'Denunciar item' },
    ],
  },
  {
    title: 'Coleções',
    links: [
      { label: 'Arte digital', to: '/' },
      { label: 'Fotografia', to: '/' },
      { label: 'Música', to: '/' },
      { label: 'Arte 3D', to: '/' },
      { label: 'Utilidade', to: '/' },
    ],
  },
]

/**
 * Itens do footer. Os que têm destino real viram `Link`; os demais são
 * seções fora do escopo — renderizados como texto estilizado (não fingem
 * sucesso nem apontam para rotas inexistentes).
 */
function FooterItem({ label, to }: FooterColumn['links'][number]) {
  if (to) {
    return (
      <Link to={to} className="text-caption text-text-secondary hover:text-text-accent">
        {label}
      </Link>
    )
  }
  return <span className="text-caption text-text-secondary/70">{label}</span>
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-ink font-mono">
      {/* Faixa de destaques + newsletter */}
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1fr_1fr_1fr_1.2fr]">
        {HIGHLIGHTS.map((item, i) => (
          <div
            key={item.title}
            className={`flex flex-col gap-3 ${i > 0 ? 'lg:border-l lg:border-border-soft lg:pl-8' : ''}`}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-body-lg font-semibold text-ink">
              {item.badge}
            </span>
            <p className="text-body font-semibold text-text-primary">{item.title}</p>
            <p className="max-w-[26ch] text-caption leading-relaxed text-text-secondary">
              {item.text}
            </p>
          </div>
        ))}
        <div className="flex flex-col gap-3 lg:border-l lg:border-border-soft lg:pl-8">
          <p className="text-body font-semibold text-text-primary">
            Antecipe-se ao próximo lançamento
          </p>
          <form
            className="flex"
            onSubmit={(e) => e.preventDefault()}
            aria-label="Inscrição na newsletter"
          >
            <label htmlFor="newsletter" className="sr-only">
              Assinar novidades
            </label>
            <input
              id="newsletter"
              type="email"
              placeholder="digite seu e-mail..."
              className="min-w-0 flex-1 rounded-l-md border border-border-soft bg-ink px-3 py-2 text-caption text-text-primary placeholder:text-text-secondary/60 focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-r-md border border-l-0 border-border-soft bg-surface-dark px-4 py-2 text-caption text-primary hover:text-text-accent"
            >
              Enviar
            </button>
          </form>
          <p className="max-w-[34ch] text-caption leading-relaxed text-text-secondary">
            Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
          </p>
        </div>
      </div>

      {/* Faixa da marca */}
      <div className="bg-surface-dark">
        <div className="mx-auto grid max-w-7xl grid-cols-2 items-center gap-4 px-6 py-6 text-caption md:grid-cols-4">
          <p className="font-semibold tracking-wide text-text-primary">GreenMint</p>
          <p className="text-text-secondary">Feito para colecionadores, criadores e cultura</p>
          <p className="text-text-secondary">contato@email.com</p>
          <p className="text-text-secondary">+55 11 4002 8922</p>
        </div>
      </div>

      {/* Colunas de links + redes sociais */}
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
        {COLUMNS.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <p className="text-body font-semibold text-text-primary">{column.title}</p>
            <nav aria-label={column.title} className="flex flex-col gap-2">
              {column.links.map((link) => (
                <FooterItem key={link.label} {...link} />
              ))}
            </nav>
          </div>
        ))}

        <div className="flex flex-col gap-4">
          <p className="text-body font-semibold text-text-primary">Redes sociais</p>
          <div className="flex gap-2">
            {SOCIALS.map((s) => (
              <span
                key={s.label}
                aria-label={s.label}
                title={s.label}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border-soft text-caption font-semibold text-primary"
              >
                {s.glyph}
              </span>
            ))}
          </div>
          <p className="mt-2 text-body font-semibold text-text-primary">Carteiras compatíveis</p>
          <div className="flex flex-wrap gap-1.5">
            {COMPATIBLE_WALLETS.map((wallet) => (
              <span
                key={wallet}
                className="rounded border border-border-soft px-2 py-1 text-tiny uppercase tracking-wide text-text-secondary"
              >
                {wallet}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border-soft px-6 py-5 text-center text-caption text-text-secondary">
        © {new Date().getFullYear()} GreenMint. Propriedade digital para todos.
      </div>
    </footer>
  )
}
