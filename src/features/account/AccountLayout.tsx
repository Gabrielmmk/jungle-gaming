import { type ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { User, Wallet, Activity, Heart, Tag, Download, LifeBuoy, LogOut } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useAuthMutations } from '@/features/auth/useAuthMutations'

const NAV = [
  { to: '/profile', label: 'Dados do perfil', icon: User, enabled: true },
  { to: '/wallets', label: 'Carteiras', icon: Wallet, enabled: true },
  { to: null, label: 'Atividade', icon: Activity, enabled: false },
  { to: null, label: 'Lista de interesse', icon: Heart, enabled: false },
  { to: null, label: 'Ofertas', icon: Tag, enabled: false },
  { to: null, label: 'Arquivos baixados', icon: Download, enabled: false },
  { to: null, label: 'Suporte', icon: LifeBuoy, enabled: false },
] as const

/** Layout da área de conta: sidebar "Meu perfil" + conteúdo. Vira coluna no mobile. */
export function AccountLayout({ children }: { children: ReactNode }): ReactNode {
  const navigate = useNavigate()
  const { logout } = useAuthMutations()

  const onLogout = async () => {
    await logout.mutateAsync()
    navigate({ to: '/' })
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink font-mono text-text-primary">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 md:flex-row">
        <nav aria-label="Menu da conta" className="w-full shrink-0 md:w-64">
          <p className="mb-4 text-caption uppercase tracking-widest text-text-secondary">
            Meu perfil
          </p>
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.label}>
                {item.enabled && item.to ? (
                  <Link
                    to={item.to}
                    className="flex items-center gap-2 border-l-2 border-transparent px-3 py-2 text-body text-text-secondary hover:text-text-primary [&.active]:border-primary [&.active]:text-primary"
                    activeProps={{ className: 'active' }}
                  >
                    <item.icon className="h-4 w-4" aria-hidden /> {item.label}
                  </Link>
                ) : (
                  <span
                    className="flex cursor-not-allowed items-center gap-2 border-l-2 border-transparent px-3 py-2 text-body text-text-secondary/50"
                    title="Em breve"
                  >
                    <item.icon className="h-4 w-4" aria-hidden /> {item.label}
                  </span>
                )}
              </li>
            ))}
            <li className="mt-2 border-t border-border-soft pt-2">
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-2 border-l-2 border-transparent px-3 py-2 text-left text-body text-primary hover:text-text-accent"
              >
                <LogOut className="h-4 w-4" aria-hidden /> Sair
              </button>
            </li>
          </ul>
        </nav>
        <section className="min-w-0 flex-1">{children}</section>
      </main>
      <Footer />
    </div>
  )
}
