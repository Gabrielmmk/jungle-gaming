import { Link } from '@tanstack/react-router'

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
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
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

      <div className="border-t border-border-soft px-6 py-4 text-center text-tiny text-text-secondary">
        © {year} GreenMint. Todos os direitos reservados.
      </div>
    </footer>
  )
}
