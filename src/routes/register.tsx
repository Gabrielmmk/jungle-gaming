import { createRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { Route as rootRoute } from '@/routes/__root'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AuthForm } from '@/features/auth/AuthForm'

const authSearchSchema = z.object({ redirect: z.string().optional() })

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  validateSearch: authSearchSchema,
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const { redirect } = Route.useSearch()
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <Header />
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <AuthForm defaultMode="register" onSuccess={() => navigate({ to: redirect ?? '/' })} />
      </main>
      <Footer />
    </div>
  )
}
