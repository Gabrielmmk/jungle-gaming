import { createRoute, Link, useNavigate } from '@tanstack/react-router'
import { Loader2, Mail, XCircle } from 'lucide-react'
import { Route as rootRoute } from '@/routes/__root'
import { requireAuth } from '@/features/auth/guard'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ErrorState } from '@/components/feedback/ErrorState'
import { formatEth } from '@/shared/eth/money'
import { useOrder } from '@/features/checkout/useOrder'
import type { Order } from '@/contracts/order'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/order/$id',
  beforeLoad: requireAuth,
  component: OrderPage,
})

function OrderPage() {
  const { id } = Route.useParams()
  const { data: order, isLoading, isError, refetch } = useOrder(id)

  return (
    <div className="flex min-h-screen flex-col bg-ink font-mono text-text-primary">
      <Header />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16">
        {isLoading && <Pending />}
        {isError && (
          <ErrorState
            title="Pedido não encontrado"
            description="Não foi possível carregar este pedido."
            onRetry={refetch}
          />
        )}
        {order && order.status === 'pending' && <Pending />}
        {order && order.status === 'refused' && <Refused />}
        {order && order.status === 'confirmed' && <Receipt order={order} />}
      </main>
      <Footer />
    </div>
  )
}

function Pending() {
  return (
    <div role="status" className="flex flex-col items-center gap-4 text-center">
      <Loader2
        className="h-10 w-10 animate-spin text-primary motion-reduce:animate-none"
        aria-hidden
      />
      <h1 className="text-heading">Processando pagamento…</h1>
      <p className="text-body text-text-secondary">
        Aguarde a confirmação da transação. Você pode atualizar a página sem perder o pedido.
      </p>
    </div>
  )
}

function Refused() {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 text-center">
      <XCircle className="h-10 w-10 text-red-400" aria-hidden />
      <h1 className="text-heading">Pagamento recusado</h1>
      <p className="text-body text-text-secondary">
        A transação não foi aprovada. Revise os dados e tente novamente.
      </p>
      <Button asChild>
        <Link to="/checkout">Voltar ao pagamento</Link>
      </Button>
    </div>
  )
}

const EXPLORER_BASE: Record<string, string> = {
  Ethereum: 'https://etherscan.io/tx/',
  Polygon: 'https://polygonscan.com/tx/',
  Solana: 'https://solscan.io/tx/',
}

function Receipt({ order }: { order: Order }) {
  const navigate = useNavigate()
  const explorer = `${EXPLORER_BASE[order.network] ?? EXPLORER_BASE.Ethereum}${order.txHash}`
  return (
    // Dialog sempre aberto nesta rota (o recibo é a própria tela de
    // confirmação); fechar no "×" navega de volta ao catálogo em vez de
    // deixar um diálogo vazio.
    <Dialog open onOpenChange={(open) => !open && navigate({ to: '/mercado' })}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden p-0">
        <div className="flex flex-col items-center gap-2 px-6 pb-5 pt-8 text-center">
          <div className="relative flex size-14 items-center justify-center">
            <Mail className="size-14 text-primary" strokeWidth={1.25} aria-hidden />
            <span className="absolute inset-0 flex flex-col items-center justify-center text-[7px] font-bold uppercase leading-tight tracking-wide text-primary">
              <span>Thank</span>
              <span>You</span>
            </span>
          </div>
          <DialogTitle className="sr-only">Pedido confirmado</DialogTitle>
          <p className="text-body text-text-secondary">Seus NFTs agora estão na sua carteira.</p>
        </div>

        <div className="border-t border-primary/50" />

        <dl className="flex flex-wrap items-start justify-center gap-x-6 gap-y-3 px-6 py-4 text-caption">
          <Meta label="ID da transação" value={`${order.txHash.slice(0, 6)}...${order.txHash.slice(-4)}`} divider />
          <Meta label="Data" value={new Date(order.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} divider />
          <Meta label="Total" value={formatEth(order.totalEth)} divider />
          <Meta label="Carteira" value={order.walletLabel} />
        </dl>

        <div className="flex flex-col gap-3 border-t border-border-soft px-6 py-5">
          <h2 className="text-body font-bold text-text-primary">Detalhes da transação</h2>

          <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 text-caption text-text-secondary">
            <span>NFTs</span>
            <span>Edições</span>
            <span className="text-right">Subtotal</span>
          </div>

          <ul className="flex flex-col gap-3">
            {order.items.map((it) => (
              <li key={it.nftId} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6">
                <div className="flex min-w-0 items-center gap-3">
                  <img src={it.image} alt="" className="size-10 shrink-0 rounded-md object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-body font-bold text-text-primary">{it.name}</p>
                    <p className="text-caption text-text-secondary">
                      ID do token: {it.name.match(/#\d+/)?.[0] ?? it.nftId}
                    </p>
                  </div>
                </div>
                <span className="text-caption text-text-secondary">(x{it.qty})</span>
                <span className="text-right text-body font-bold text-text-accent">
                  {formatEth(it.lineTotalEth)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="ml-auto flex flex-col gap-1 text-body">
            {Number(order.discountEth) > 0 && (
              <div className="flex justify-between gap-6">
                <dt className="text-text-secondary">Desconto</dt>
                <dd className="text-text-accent">- {formatEth(order.discountEth)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-6">
              <dt className="text-text-secondary">Taxa de rede</dt>
              <dd className="text-text-primary">{formatEth(order.networkFeeEth)}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="font-bold text-text-primary">Total</dt>
              <dd className="font-bold text-primary">{formatEth(order.totalEth)}</dd>
            </div>
          </dl>
        </div>

        <p className="px-6 text-center text-caption text-text-secondary">
          Transação confirmada na {order.network}. A propriedade foi transferida para sua carteira
          conectada e registrada na rede.
        </p>

        <div className="flex justify-center px-6 pb-8 pt-5">
          <Button asChild>
            {/* Explorador simulado — link externo coerente (abre em nova aba). */}
            <a href={explorer} target="_blank" rel="noopener noreferrer">
              Ver no Etherscan
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Meta({ label, value, divider }: { label: string; value: string; divider?: boolean }) {
  return (
    <div className={`flex items-start gap-6 ${divider ? 'border-r border-border-soft pr-6' : ''}`}>
      <div>
        <dt className="font-bold text-text-primary">{label}</dt>
        <dd className="truncate text-text-secondary">{value}</dd>
      </div>
    </div>
  )
}
