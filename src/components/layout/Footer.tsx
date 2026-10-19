import { Link } from '@tanstack/react-router'
import { ShieldCheck, Star, Bell, ArrowRight } from 'lucide-react'

const HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    icon: Star,
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    icon: Bell,
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

const COMPATIBLE_WALLETS = ['MetaMask', 'WalletConnect', 'Coinbase']

interface FooterColumn {
  title: string
  links: Array<{ label: string; to?: '/'; comingSoon?: boolean }>
}

const COLUMNS: FooterColumn[] = [
  {
    title: 'Mercado',
    links: [
      { label: 'Início', to: '/' },
      { label: 'Coleções', comingSoon: true },
      { label: 'Criadores', comingSoon: true },
    ],
  },
  {
    title: 'Recursos',
    links: [
      { label: 'Diário da Cunhagem', comingSoon: true },
      { label: 'Aprenda', comingSoon: true },
      { label: 'Ajuda', comingSoon: true },
    ],
  },
  {
    title: 'Comunidade',
    links: [
      { label: 'Discord', comingSoon: true },
      { label: 'X / Twitter', comingSoon: true },
      { label: 'Blog', comingSoon: true },
    ],
  },
]

/**
 * Links fora do escopo desta camada são marcados "em breve" em vez de
 * apontar para uma rota inexistente ou simular uma ação — mesma política
 * do Header (ver `ComingSoonLink`), para não fingir sucesso.
 */
function FooterLink({ label, to, comingSoon }: FooterColumn['links'][number]) {
  if (comingSoon || !to) {
    return (
      <span aria-disabled="true" className="cursor-not-allowed text-caption text-text-secondary/50">
        {label} <span className="text-tiny uppercase tracking-wide">em breve</span>
      </span>
    )
  }

  return (
    <Link to={to} className="text-caption text-text-secondary hover:text-text-accent">
      {label}
    </Link>
  )
}

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-ink">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1fr_1fr_1fr_1.2fr]">
        {HIGHLIGHTS.map((item) => (
          <div key={item.title} className="flex flex-col gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
              <item.icon className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-body font-medium text-text-primary">{item.title}</p>
            <p className="text-caption text-text-secondary">{item.text}</p>
          </div>
        ))}
        <div className="flex flex-col gap-3">
          <p className="text-body font-medium text-text-primary">
            Antecipe-se ao próximo lançamento
          </p>
          <form
            className="flex gap-2"
            onSubmit={(e) => e.preventDefault()}
            aria-label="Inscrição na newsletter"
          >
            <label htmlFor="newsletter" className="sr-only">
              Seu e-mail
            </label>
            <input
              id="newsletter"
              type="email"
              placeholder="Digite seu e-mail…"
              className="min-w-0 flex-1 rounded-md border border-border-soft bg-ink px-3 py-2 text-caption text-text-primary placeholder:text-text-secondary/60 focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-caption text-ink"
            >
              Enviar <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </form>
          <p className="text-caption text-text-secondary">
            Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 border-t border-border-soft px-6 py-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <p className="text-body-lg font-semibold text-text-primary">GreenMint</p>
          <p className="mt-2 text-caption text-text-secondary">
            O mercado de NFTs para arte digital, música e coleções raras.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <p className="text-caption font-medium uppercase tracking-wide text-text-primary">
              {column.title}
            </p>
            <nav aria-label={column.title} className="flex flex-col gap-2">
              {column.links.map((link) => (
                <FooterLink key={link.label} {...link} />
              ))}
            </nav>
          </div>
        ))}
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-border-soft px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-caption text-text-secondary">Carteiras compatíveis</span>
        <div className="flex flex-wrap gap-2">
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

      <div className="border-t border-border-soft px-6 py-4 text-center text-tiny text-text-secondary">
        © {year} GreenMint. Todos os direitos reservados.
      </div>
    </footer>
  )
}
