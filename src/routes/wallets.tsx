import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from '@/routes/__root'
import { requireAuth } from '@/features/auth/guard'
import { AccountLayout } from '@/features/account/AccountLayout'
import { WalletsPanel } from '@/features/account/WalletsPanel'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/wallets',
  beforeLoad: requireAuth,
  component: WalletsPage,
})

function WalletsPage() {
  return (
    <AccountLayout>
      <WalletsPanel />
    </AccountLayout>
  )
}
