import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '@/mocks/server'
import { api } from '@/shared/http/axios'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const auth = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

describe('REST auth', () => {
  it('register → session round-trip', async () => {
    const reg = await api.post('/auth/register', {
      email: 'a@b.com',
      password: 'secret123',
      displayName: 'A',
      username: 'userab',
    })
    expect(reg.data.token).toBeTruthy()
    const sess = await api.get('/session', auth(reg.data.token))
    expect(sess.data.email).toBe('a@b.com')
  })

  it('login com credenciais semeadas e GET /session', async () => {
    const login = await api.post('/auth/login', {
      email: 'ana.silva@greenmint.test',
      password: 'senha1234',
    })
    const sess = await api.get('/session', auth(login.data.token))
    expect(sess.data.displayName).toBe('Ana Silva')
  })

  it('GET /session sem token → 401', async () => {
    await expect(api.get('/session')).rejects.toMatchObject({ response: { status: 401 } })
  })

  it('login inválido → 401', async () => {
    await expect(
      api.post('/auth/login', { email: 'ana.silva@greenmint.test', password: 'errada' }),
    ).rejects.toMatchObject({ response: { status: 401 } })
  })

  it('register com validação inválida → 422 com fields', async () => {
    await expect(
      api.post('/auth/register', {
        email: 'nao-email',
        password: '123',
        displayName: '',
        username: 'x',
      }),
    ).rejects.toMatchObject({ response: { status: 422 } })
  })

  it('favoritos exigem token (401 sem; persistem com)', async () => {
    await expect(api.get('/favorites')).rejects.toMatchObject({ response: { status: 401 } })
    const login = await api.post('/auth/login', {
      email: 'bruno.costa@greenmint.test',
      password: 'senha1234',
    })
    const t = login.data.token
    const nft = (await api.get('/nfts', { params: { pageSize: 1 } })).data.items[0].id
    await api.post(`/favorites/${nft}`, {}, auth(t))
    const favs = await api.get('/favorites', auth(t))
    expect(favs.data).toContain(nft)
  })

  it('perfil e carteiras com sessão', async () => {
    const login = await api.post('/auth/login', {
      email: 'ana.silva@greenmint.test',
      password: 'senha1234',
    })
    const t = login.data.token
    const prof = await api.patch(
      '/profile',
      { displayName: 'Ana S.', username: 'ana.s', email: 'ana.silva@greenmint.test' },
      auth(t),
    )
    expect(prof.data.displayName).toBe('Ana S.')
    const w = await api.post(
      '/wallets',
      { label: 'Main', address: '0x' + 'b'.repeat(40), network: 'Ethereum' },
      auth(t),
    )
    expect(w.data.id).toBeTruthy()
    const list = await api.get('/wallets', auth(t))
    expect(list.data).toHaveLength(1)
  })
})
