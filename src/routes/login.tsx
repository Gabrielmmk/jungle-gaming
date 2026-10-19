import { createRoute, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { Route as rootRoute } from '@/routes/__root'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AuthForm } from '@/features/auth/AuthForm'
import { useIsMobile } from '@/shared/responsive/useIsMobile'

const authSearchSchema = z.object({ redirect: z.string().optional() })

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: authSearchSchema,
  component: LoginPage,
})

function LoginPage() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const { redirect } = Route.useSearch()
  const onSuccess = () => navigate({ to: redirect ?? '/' })

  if (isMobile) {
    // Tela cheia dedicada: wordmark + formulário, sem o chrome padrão do
    // site (ver mesmo padrão em /nft/$id para a versão mobile).
    return (
      <div className="flex min-h-screen flex-col items-center bg-ink px-6 pb-12 pt-14">
        <p className="text-[28px] font-bold tracking-[0.15em] text-text-primary">KURIO</p>
        <div className="mt-16 w-full max-w-md">
          <AuthForm
            defaultMode="login"
            variant="page"
            onSuccess={onSuccess}
            footer={
              <p className="text-body text-text-secondary">
                Novo na Kurio?{' '}
                <Link
                  to="/register"
                  search={{ redirect }}
                  className="text-text-accent hover:underline"
                >
                  Crie uma conta
                </Link>
              </p>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <Header />
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <AuthForm defaultMode="login" onSuccess={onSuccess} />
      </main>
      <Footer />
    </div>
  )
}
