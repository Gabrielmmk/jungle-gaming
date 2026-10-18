import { describe, it, expect, beforeEach } from 'vitest'
import { createDb, type MockDb } from '@/mocks/db/createDb'
import type { ApiErrorCode } from '@/contracts/errors'

let db: MockDb

beforeEach(() => {
  db = createDb()
})

/** Verifica que `fn` lança um DbError com o `code` esperado. */
const expectCode = (fn: () => unknown, code: ApiErrorCode): void => {
  try {
    fn()
  } catch (error) {
    expect((error as { code?: string }).code).toBe(code)
    return
  }
  throw new Error(`esperava lançar erro com code="${code}", mas não lançou`)
}

describe('db auth', () => {
  it('register cria usuário + sessão e não retorna senha', () => {
    const { token, user } = db.register({
      email: 'n@x.com',
      password: 'secret123',
      displayName: 'N',
      username: 'novo',
    })
    expect(token).toBeTruthy()
    expect((user as Record<string, unknown>).password).toBeUndefined()
    expect(db.getSession(token)?.email).toBe('n@x.com')
  })

  it('register com email duplicado → conflict', () => {
    db.register({ email: 'd@x.com', password: 'secret123', displayName: 'D', username: 'dd' })
    expectCode(
      () =>
        db.register({
          email: 'd@x.com',
          password: 'secret123',
          displayName: 'D2',
          username: 'dd2',
        }),
      'conflict',
    )
  })

  it('login confere hash; credenciais inválidas → unauthorized', () => {
    db.register({ email: 'l@x.com', password: 'secret123', displayName: 'L', username: 'll' })
    expect(db.login({ email: 'l@x.com', password: 'secret123' }).token).toBeTruthy()
    expectCode(() => db.login({ email: 'l@x.com', password: 'wrong' }), 'unauthorized')
  })

  it('login funciona com credenciais semeadas', () => {
    const res = db.login({ email: 'ana.silva@greenmint.test', password: 'senha1234' })
    expect(res.user.displayName).toBe('Ana Silva')
  })

  it('logout invalida o token', () => {
    const { token } = db.register({
      email: 'o@x.com',
      password: 'secret123',
      displayName: 'O',
      username: 'oo',
    })
    db.logout(token)
    expect(db.getSession(token)).toBeUndefined()
  })

  it('senha nunca é armazenada em claro', () => {
    db.register({ email: 'p@x.com', password: 'plaintextpw', displayName: 'P', username: 'pp' })
    expect(JSON.stringify(db.__debugState())).not.toContain('plaintextpw')
  })

  it('favoritos são isolados por usuário', () => {
    const a = db.register({
      email: 'a@x.com',
      password: 'secret123',
      displayName: 'A',
      username: 'aaa',
    })
    const b = db.register({
      email: 'b@x.com',
      password: 'secret123',
      displayName: 'B',
      username: 'bbb',
    })
    db.addFavorite(a.user.id, 'nft-1')
    expect(db.listFavorites(a.user.id)).toContain('nft-1')
    expect(db.listFavorites(b.user.id)).not.toContain('nft-1')
  })

  it('perfil: update rejeita email duplicado e troca de senha confere a atual', () => {
    const a = db.register({
      email: 'c@x.com',
      password: 'secret123',
      displayName: 'C',
      username: 'ccc',
    })
    expectCode(
      () =>
        db.updateProfile(a.user.id, {
          email: 'ana.silva@greenmint.test',
          username: 'ccc',
          displayName: 'C',
        }),
      'conflict',
    )
    expectCode(() => db.changePassword(a.user.id, 'wrong', 'newsecret1'), 'validation')
    db.changePassword(a.user.id, 'secret123', 'newsecret1')
    expect(db.login({ email: 'c@x.com', password: 'newsecret1' }).token).toBeTruthy()
  })

  it('carteiras: CRUD com endereço único', () => {
    const a = db.register({
      email: 'w@x.com',
      password: 'secret123',
      displayName: 'W',
      username: 'www',
    })
    const addr = '0x' + 'a'.repeat(40)
    const wallet = db.addWallet(a.user.id, { label: 'Main', address: addr, network: 'Ethereum' })
    expect(db.listWallets(a.user.id)).toHaveLength(1)
    expectCode(
      () => db.addWallet(a.user.id, { label: 'Dup', address: addr, network: 'Polygon' }),
      'conflict',
    )
    const updated = db.updateWallet(a.user.id, wallet.id, {
      label: 'Renomeada',
      address: addr,
      network: 'Polygon',
    })
    expect(updated.label).toBe('Renomeada')
    expect(updated.network).toBe('Polygon')
  })

  it('operações de conta sem sessão → unauthorized', () => {
    expectCode(() => db.getProfile(null), 'unauthorized')
    expectCode(() => db.listWallets(null), 'unauthorized')
  })
})
