import { useState } from 'react'
import { createRoute, useNavigate, Link } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import { Route as rootRoute } from '@/routes/__root'
import { requireAuth } from '@/features/auth/guard'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/form/Field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

const WALLET_TYPES = ['WalletConnect', 'MetaMask', 'Coinbase Wallet'] as const
const COMPATIBLE_BADGES = ['MetaMask', 'WalletConnect', 'Coinbase']

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

  // Campos do Figma fora do contrato de criação de pedido (`collectorSchema`
  // só cobre displayName/email/note): ficam como estado local apresentacional,
  // sem bloquear o envio — mesmo padrão dos elementos fora de escopo do
  // Header/Footer (ex.: `ComingSoonLink`), sem fingir uma validação real.
  const [username, setUsername] = useState('')
  const [profileName, setProfileName] = useState('')
  const [profileNetwork, setProfileNetwork] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [secondaryWallet, setSecondaryWallet] = useState('')
  const [walletType, setWalletType] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [ensSuffix, setEnsSuffix] = useState('.eth')
  const [useOtherWallet, setUseOtherWallet] = useState(false)

  const [walletChoice, setWalletChoice] = useState<string>('')
  const [network, setNetwork] = useState<string>('Ethereum')
  const [connected, setConnected] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [staleNotice, setStaleNotice] = useState(false)
  const [couponOpen, setCouponOpen] = useState(false)
  const [couponCode, setCouponCode] = useState('')

  const quote = cart.quote
  const empty = !quote || quote.items.length === 0
  const isProvider = (WALLET_TYPES as readonly string[]).includes(walletChoice)
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
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-body text-text-secondary">
          <Link to="/" className="hover:text-text-accent">
            Início
          </Link>
          {' / '}
          <Link to="/mercado" className="hover:text-text-accent">
            Mercado
          </Link>
          {' / '}
          <span className="text-text-primary">Pagamento</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <section aria-label="Dados do colecionador" className="flex flex-col gap-6">
            <h1 className="text-body-lg font-bold text-text-primary">Perfil do colecionador</h1>

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Nome de exibição"
                name="displayName"
                value={collector.displayName}
                onChange={(v) => setCollector((c) => ({ ...c, displayName: v }))}
                error={errors.displayName}
                required
              />
              <Field label="Nome de usuário" name="username" value={username} onChange={setUsername} required />

              <SelectField
                label="Rede"
                placeholder="Selecione uma rede"
                value={profileNetwork}
                onChange={setProfileNetwork}
                options={WALLET_NETWORKS as unknown as string[]}
                required
              />
              <Field
                label="Nome do perfil"
                name="profileName"
                value={profileName}
                onChange={setProfileName}
                required
              />

              <Field
                label="Endereço da carteira"
                name="walletAddress"
                value={walletAddress}
                onChange={setWalletAddress}
                placeholder="Endereço 0x da carteira"
                required
              />
              <Field
                label="ENS ou carteira secundária (opcional)"
                name="secondaryWallet"
                value={secondaryWallet}
                onChange={setSecondaryWallet}
              />

              <SelectField
                label="Tipo de carteira"
                placeholder="Selecione uma carteira"
                value={walletType}
                onChange={setWalletType}
                options={WALLET_TYPES as unknown as string[]}
                required
              />
              <Field
                label="Código de indicação"
                name="referralCode"
                value={referralCode}
                onChange={setReferralCode}
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
              <SelectField
                label="Nome ENS"
                placeholder=".eth"
                value={ensSuffix}
                onChange={setEnsSuffix}
                options={['.eth']}
                required
              />
            </div>

            <label className="flex w-fit items-center gap-2 text-body text-text-primary">
              <input
                type="checkbox"
                checked={useOtherWallet}
                onChange={(e) => setUseOtherWallet(e.target.checked)}
                className="size-4 rounded-full accent-primary"
              />
              Usar outra carteira?
            </label>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="note" className="text-caption font-medium text-text-secondary">
                Observação do colecionador (opcional)
              </label>
              <textarea
                id="note"
                name="note"
                rows={6}
                value={collector.note}
                onChange={(e) => setCollector((c) => ({ ...c, note: e.target.value }))}
                className="w-full rounded-md border border-border-soft bg-ink px-3 py-2 font-mono text-body text-text-primary placeholder:text-text-secondary/60 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </section>

          <aside className="flex h-fit flex-col gap-4 rounded-lg border border-border bg-surface-card p-5">
            <div className="flex items-center justify-between border-b border-border-soft pb-3">
              <h2 className="text-body-lg text-text-primary">Seus NFTs</h2>
              <span className="text-caption uppercase tracking-wide text-text-secondary">Subtotal</span>
            </div>

            {empty ? (
              <p className="text-body text-text-secondary">
                Carrinho vazio.{' '}
                <Link to="/" className="text-text-accent hover:underline">
                  Explorar
                </Link>
              </p>
            ) : (
              <>
                <ul className="flex flex-col gap-3 border-b border-border-soft pb-3">
                  {quote.items.map((it) => (
                    <li key={it.nft.id} className="flex items-center gap-3">
                      <img
                        src={it.nft.image}
                        alt=""
                        className="size-12 shrink-0 rounded-md object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-body text-text-primary">{it.nft.name}</p>
                        <p className="text-caption text-text-secondary">
                          ID do token: {it.nft.name.match(/#\d+/)?.[0] ?? it.nft.id}
                        </p>
                      </div>
                      <span className="shrink-0 text-caption text-text-secondary">(x{it.qty})</span>
                      <span className="shrink-0 text-body font-bold text-text-accent">
                        {formatEth(it.lineTotalEth)}
                      </span>
                    </li>
                  ))}
                </ul>

                {couponOpen ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <label htmlFor="coupon" className="sr-only">
                        Código promocional
                      </label>
                      <input
                        id="coupon"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Digite o código promocional"
                        className="min-w-0 flex-1 rounded-md border border-border-soft bg-ink px-3 py-2 text-caption text-text-primary placeholder:text-text-secondary/60 focus:border-primary focus:outline-none"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => couponCode.trim() && cart.applyCoupon(couponCode.trim())}
                      >
                        Aplicar
                      </Button>
                    </div>
                    {quote.coupon?.applied && (
                      <p role="status" className="text-caption text-text-accent">
                        Cupom {quote.coupon.code} aplicado (-{quote.coupon.percentOff}%).{' '}
                        <button type="button" onClick={cart.removeCoupon} className="underline">
                          remover
                        </button>
                      </p>
                    )}
                    {quote.coupon && !quote.coupon.applied && (
                      <p role="status" className="text-caption text-red-400">
                        Cupom {quote.coupon.reason === 'expired' ? 'expirado' : 'inválido'}.
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCouponOpen(true)}
                    className="text-center text-caption text-text-accent hover:underline"
                  >
                    Tem um código promocional? Aplique aqui
                  </button>
                )}

                <dl className="flex flex-col gap-1.5 text-body">
                  <Line label="Subtotal" value={formatEth(quote.subtotalEth)} />
                  <Line
                    label="Desconto do lançamento"
                    value={Number(quote.discountEth) > 0 ? `(-) ${formatEth(quote.discountEth)}` : '(-) 00.00'}
                    accent={Number(quote.discountEth) > 0}
                  />
                  <Line label="Taxa de rede" value={formatEth(quote.networkFeeEth)} hint="Taxa estimada" />
                </dl>

                <div className="flex items-center justify-between border-t border-border-soft pt-3">
                  <span className="text-body-lg font-bold text-text-primary">Total</span>
                  <span className="text-body-lg font-bold text-primary" data-testid="checkout-total">
                    {formatEth(quote.totalEth)}
                  </span>
                </div>

                <fieldset className="flex flex-col gap-3">
                  <legend className="mb-1 w-full text-center text-body-lg text-text-primary">
                    Carteira e rede
                  </legend>

                  <WalletOption
                    label="WalletConnect"
                    value="WalletConnect"
                    checked={walletChoice === 'WalletConnect'}
                    onSelect={() => selectWallet('WalletConnect')}
                    badges
                  />
                  {(wallets ?? []).map((w) => (
                    <WalletOption
                      key={w.id}
                      label={`${w.label} · ${w.network}`}
                      value={w.label}
                      checked={walletChoice === w.label}
                      onSelect={() => selectWallet(w.label)}
                    />
                  ))}
                  <WalletOption
                    label="MetaMask"
                    value="MetaMask"
                    checked={walletChoice === 'MetaMask'}
                    onSelect={() => selectWallet('MetaMask')}
                  />
                  <WalletOption
                    label="Coinbase Wallet"
                    value="Coinbase Wallet"
                    checked={walletChoice === 'Coinbase Wallet'}
                    onSelect={() => selectWallet('Coinbase Wallet')}
                  />

                  {isProvider && !savedWallet && (
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
                  className="w-full uppercase tracking-wide"
                  data-testid="confirm-order"
                >
                  {submit.isPending ? 'Processando…' : 'Confirmar compra'}
                </Button>
              </>
            )}
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function SelectField({
  label,
  placeholder,
  value,
  onChange,
  options,
  required,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  options: string[]
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-caption font-medium text-text-secondary">
        {label}
        {required && <span className="ml-0.5 text-text-accent">*</span>}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function WalletOption({
  label,
  value,
  checked,
  onSelect,
  badges,
}: {
  label: string
  value: string
  checked: boolean
  onSelect: () => void
  badges?: boolean
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 ${checked ? 'border-primary bg-surface-dark' : 'border-border-soft'}`}
    >
      <input
        type="radio"
        name="wallet"
        value={value}
        checked={checked}
        onChange={onSelect}
        aria-label={badges ? label : undefined}
        className="accent-primary"
      />
      {badges ? (
        <div className="flex flex-wrap gap-1.5">
          {COMPATIBLE_BADGES.map((b) => (
            <span
              key={b}
              className="rounded border border-border-soft px-2 py-1 text-tiny uppercase tracking-wide text-text-secondary"
            >
              {b}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-body text-text-primary">{label}</span>
      )}
    </label>
  )
}

function Line({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-text-secondary">
        {label}
        {hint && <span className="ml-2 text-tiny text-text-secondary/60">{hint}</span>}
      </dt>
      <dd className={accent ? 'text-text-accent' : 'text-text-primary'}>{value}</dd>
    </div>
  )
}
