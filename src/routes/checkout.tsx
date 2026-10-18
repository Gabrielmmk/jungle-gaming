import { useState } from 'react'
import { createRoute, useNavigate, Link } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import { Route as rootRoute } from '@/routes/__root'
import { requireAuth } from '@/features/auth/guard'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/form/Field'
import { formatEth } from '@/shared/eth/money'
import { getScenario } from '@/mocks/scenarios/scenarios'
import { useSession } from '@/features/auth/useSession'
import { useCart } from '@/features/cart/useCart'
import { useWallets } from '@/features/account/useWallets'
import { useCheckout } from '@/features/checkout/useCheckout'
import { useNftEvents } from '@/features/realtime/useNftEvents'
import { WALLET_NETWORKS } from '@/contracts/wallet'
import { collectorSchema } from '@/contracts/order'
import { ZodError } from 'zod'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  beforeLoad: requireAuth,
  component: CheckoutPage,
})

const PROVIDERS = ['MetaMask', 'Coinbase Wallet'] as const

function CheckoutPage() {
  useNftEvents() // revalida a cotação se preço/disponibilidade mudarem durante o checkout
  const navigate = useNavigate()
  const { user } = useSession()
  const cart = useCart()
  const { data: wallets } = useWallets()
  const { submit, resetKey } = useCheckout()

  // A sessão já está carregada (requireAuth no beforeLoad), então o
  // colecionador é pré-preenchido na inicialização do estado — sem efeito.
  const [collector, setCollector] = useState(() => ({
    displayName: user?.displayName ?? '',
    email: user?.email ?? '',
    note: '',
  }))
  const [walletChoice, setWalletChoice] = useState<string>('')
  const [network, setNetwork] = useState<string>('Ethereum')
  const [connected, setConnected] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [staleNotice, setStaleNotice] = useState(false)

  const quote = cart.quote
  const empty = !quote || quote.items.length === 0
  const isProvider = (PROVIDERS as readonly string[]).includes(walletChoice)
  const savedWallet = wallets?.find((w) => w.label === walletChoice)

  const selectWallet = (label: string) => {
    setWalletChoice(label)
    setConnectError(null)
    const saved = wallets?.find((w) => w.label === label)
    if (saved) {
      setConnected(true)
      setNetwork(saved.network)
    } else {
      setConnected(false) // provider exige conectar
    }
  }

  const connectProvider = () => {
    if (getScenario() === 'wallet-refused') {
      setConnected(false)
      setConnectError('Conexão com a carteira recusada.')
      return
    }
    setConnected(true)
    setConnectError(null)
  }

  const confirm = async () => {
    setErrors({})
    setFormError(null)
    setStaleNotice(false)
    if (!walletChoice || !connected) {
      setFormError('Selecione e conecte uma carteira para continuar.')
      return
    }
    if (!quote) return
    let parsedCollector
    try {
      parsedCollector = collectorSchema.parse(collector)
    } catch (e) {
      if (e instanceof ZodError) {
        const f: Record<string, string> = {}
        e.issues.forEach((i) => {
          const k = i.path.join('.')
          if (k && !f[k]) f[k] = i.message
        })
        setErrors(f)
        return
      }
      throw e
    }

    try {
      const order = await submit.mutateAsync({
        collector: parsedCollector,
        walletLabel: walletChoice,
        network: savedWallet?.network ?? network,
        coupon: quote.coupon?.applied ? quote.coupon.code : undefined,
        expectedTotalEth: quote.totalEth,
      })
      navigate({ to: '/order/$id', params: { id: order.id } })
    } catch (e) {
      if (e instanceof AxiosError && e.response?.status === 409) {
        const msg = (e.response.data as { message?: string })?.message ?? ''
        if (/cotaç|desatualiz/i.test(msg)) {
          // Cotação mudou durante o checkout → revalida e exige nova confirmação.
          setStaleNotice(true)
          resetKey()
          cart.refetch()
          return
        }
        setFormError(msg || 'Não foi possível concluir o pedido.')
        return
      }
      setFormError('Não foi possível concluir o pedido. Tente novamente.')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink font-mono text-text-primary">
      <Header />
      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-6 py-10 lg:grid-cols-[1fr_380px]">
        <section aria-label="Dados do colecionador" className="flex flex-col gap-6">
          <nav aria-label="Trilha" className="text-caption text-text-secondary">
            <Link to="/cart" className="hover:text-text-accent">
              Carrinho
            </Link>{' '}
            / Pagamento
          </nav>
          <h1 className="text-heading">Perfil do colecionador</h1>
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Nome de exibição"
              name="displayName"
              value={collector.displayName}
              onChange={(v) => setCollector((c) => ({ ...c, displayName: v }))}
              error={errors.displayName}
              required
            />
            <Field
              label="E-mail"
              name="email"
              type="email"
              value={collector.email}
              onChange={(v) => setCollector((c) => ({ ...c, email: v }))}
              error={errors.email}
              required
            />
          </div>
          <Field
            label="Observação do colecionador (opcional)"
            name="note"
            value={collector.note}
            onChange={(v) => setCollector((c) => ({ ...c, note: v }))}
          />

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-body-lg text-text-primary">Carteira e rede</legend>
            {(wallets ?? []).map((w) => (
              <WalletOption
                key={w.id}
                label={`${w.label} · ${w.network}`}
                value={w.label}
                checked={walletChoice === w.label}
                onSelect={() => selectWallet(w.label)}
              />
            ))}
            {PROVIDERS.map((p) => (
              <WalletOption
                key={p}
                label={p}
                value={p}
                checked={walletChoice === p}
                onSelect={() => selectWallet(p)}
              />
            ))}
            {(wallets ?? []).length === 0 && (
              <p className="text-caption text-text-secondary">
                Nenhuma carteira cadastrada —{' '}
                <Link to="/wallets" className="text-text-accent hover:underline">
                  adicionar
                </Link>{' '}
                ou conectar um provedor acima.
              </p>
            )}

            {isProvider && (
              <div className="flex items-center gap-3">
                <label htmlFor="net" className="text-caption text-text-secondary">
                  Rede
                </label>
                <select
                  id="net"
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="rounded-md border border-border-soft bg-ink px-3 py-1.5 text-body text-text-primary"
                >
                  {WALLET_NETWORKS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                {connected ? (
                  <span className="flex items-center gap-2 text-caption text-text-accent">
                    Conectada
                    <button type="button" onClick={() => setConnected(false)} className="underline">
                      desconectar
                    </button>
                  </span>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={connectProvider}>
                    Conectar carteira
                  </Button>
                )}
              </div>
            )}
            {connectError && (
              <p role="alert" className="text-caption text-red-400">
                {connectError}
              </p>
            )}
          </fieldset>
        </section>

        <aside className="flex h-fit flex-col gap-4 rounded-lg border border-border bg-surface-card p-5">
          <h2 className="text-body-lg">Seus NFTs</h2>
          {empty ? (
            <p className="text-body text-text-secondary">
              Carrinho vazio.{' '}
              <Link to="/" className="text-text-accent hover:underline">
                Explorar
              </Link>
            </p>
          ) : (
            <>
              <ul className="flex flex-col gap-2 border-b border-border-soft pb-3">
                {quote.items.map((it) => (
                  <li key={it.nft.id} className="flex items-center justify-between text-caption">
                    <span className="truncate text-text-secondary">
                      {it.nft.name} <span className="text-text-secondary/60">(x{it.qty})</span>
                    </span>
                    <span className="text-text-primary">{formatEth(it.lineTotalEth)}</span>
                  </li>
                ))}
              </ul>
              <dl className="flex flex-col gap-1.5 text-body">
                <Line label="Subtotal" value={formatEth(quote.subtotalEth)} />
                {Number(quote.discountEth) > 0 && (
                  <Line label="Desconto" value={`- ${formatEth(quote.discountEth)}`} accent />
                )}
                <Line label="Taxa de rede" value={formatEth(quote.networkFeeEth)} />
              </dl>
              <div className="flex items-center justify-between border-t border-border-soft pt-3">
                <span className="text-body-lg">Total</span>
                <span className="text-body-lg text-primary" data-testid="checkout-total">
                  {formatEth(quote.totalEth)}
                </span>
              </div>

              {staleNotice && (
                <p role="alert" className="text-caption text-text-accent">
                  Os valores foram atualizados. Revise e confirme novamente.
                </p>
              )}
              {formError && (
                <p role="alert" className="text-caption text-red-400">
                  {formError}
                </p>
              )}

              <Button
                type="button"
                disabled={empty || submit.isPending}
                onClick={confirm}
                data-testid="confirm-order"
              >
                {submit.isPending ? 'Processando…' : 'Confirmar compra'}
              </Button>
            </>
          )}
        </aside>
      </main>
      <Footer />
    </div>
  )
}

function WalletOption({
  label,
  value,
  checked,
  onSelect,
}: {
  label: string
  value: string
  checked: boolean
  onSelect: () => void
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 ${checked ? 'border-primary bg-surface-dark' : 'border-border-soft'}`}
    >
      <input
        type="radio"
        name="wallet"
        value={value}
        checked={checked}
        onChange={onSelect}
        className="accent-primary"
      />
      <span className="text-body text-text-primary">{label}</span>
    </label>
  )
}

function Line({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-text-secondary">{label}</dt>
      <dd className={accent ? 'text-text-accent' : 'text-text-primary'}>{value}</dd>
    </div>
  )
}
