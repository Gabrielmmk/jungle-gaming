import { createRoute, Link } from '@tanstack/react-router'
import { Loader2, MailCheck, XCircle } from 'lucide-react'
import { Route as rootRoute } from '@/routes/__root'
import { requireAuth } from '@/features/auth/guard'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
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
  const explorer = `${EXPLORER_BASE[order.network] ?? EXPLORER_BASE.Ethereum}${order.txHash}`
  return (
    <div className="w-full max-w-xl rounded-lg border border-border bg-surface-card p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <MailCheck className="h-10 w-10 text-primary" aria-hidden />
        <h1 className="text-heading">Obrigado!</h1>
        <p className="text-body text-text-secondary">Seus NFTs agora estão na sua carteira.</p>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 border-y border-border-soft py-4 text-caption md:grid-cols-4">
        <Meta label="ID da transação" value={`${order.txHash.slice(0, 10)}…`} />
        <Meta label="Data" value={new Date(order.createdAt).toLocaleDateString('pt-BR')} />
        <Meta label="Total" value={formatEth(order.totalEth)} />
        <Meta label="Carteira" value={order.walletLabel} />
      </dl>

      <h2 className="mt-5 text-body-lg">Detalhes da transação</h2>
      <ul className="mt-2 flex flex-col">
        {order.items.map((it) => (
          <li
            key={it.nftId}
            className="flex items-center justify-between border-b border-border-soft py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <img src={it.image} alt="" className="h-10 w-10 rounded-md object-cover" />
              <div className="min-w-0">
                <p className="truncate text-body text-text-primary">{it.name}</p>
                <p className="text-caption text-text-secondary">x{it.qty}</p>
              </div>
            </div>
            <span className="text-body text-primary">{formatEth(it.lineTotalEth)}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-3 flex flex-col gap-1.5 text-body">
        {Number(order.discountEth) > 0 && (
          <div className="flex justify-between">
            <dt className="text-text-secondary">Desconto</dt>
            <dd className="text-text-accent">- {formatEth(order.discountEth)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-text-secondary">Taxa de rede</dt>
          <dd className="text-text-primary">{formatEth(order.networkFeeEth)}</dd>
        </div>
        <div className="flex justify-between border-t border-border-soft pt-2">
          <dt className="text-body-lg">Total</dt>
          <dd className="text-body-lg text-primary">{formatEth(order.totalEth)}</dd>
        </div>
      </dl>

      <p className="mt-4 text-caption text-text-secondary">
        Transação confirmada na {order.network}. A propriedade foi transferida para sua carteira
        conectada e registrada na rede.
      </p>

      <Button asChild className="mt-4 w-full">
        {/* Explorador simulado — link externo coerente (abre em nova aba). */}
        <a href={explorer} target="_blank" rel="noopener noreferrer">
          Ver no explorador
        </a>
      </Button>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-text-secondary/70">{label}</dt>
      <dd className="truncate text-text-primary">{value}</dd>
    </div>
  )
}
