import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from '@/routes/__root'
import { requireAuth } from '@/features/auth/guard'
import { useSession } from '@/features/auth/useSession'
import { AccountLayout } from '@/features/account/AccountLayout'
import { ProfileForm } from '@/features/account/ProfileForm'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  beforeLoad: requireAuth,
  component: ProfilePage,
})

function ProfilePage() {
  const { user } = useSession()
  return <AccountLayout>{user && <ProfileForm user={user} />}</AccountLayout>
}
