import { test, expect } from '@playwright/test'
import { login, SEED_USER } from './helpers'

test.describe('Conta e sessão', () => {
  test('login com credenciais semeadas e logout', async ({ page }) => {
    await login(page)
    // sessão recuperável após refresh
    await page.reload()
    await expect(page.getByRole('banner').getByRole('link', { name: SEED_USER.name })).toBeVisible()

    // logout pela área de conta
    await page.goto('/profile')
    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
  })

  test('cadastro cria conta e autentica', async ({ page }) => {
    const uniq = Date.now()
    await page.goto('/register')
    await page.getByRole('tab', { name: 'Criar conta' }).click()
    await page.getByLabel('E-mail').fill(`novo${uniq}@x.com`)
    await page.getByLabel('Nome de exibição').fill('Novo Colecionador')
    await page.getByLabel('Nome de usuário').fill(`novo${uniq}`)
    await page.getByLabel('Senha').fill('segredo123')
    await page.getByTestId('auth-submit').click()
    await expect(
      page.getByRole('banner').getByRole('link', { name: 'Novo Colecionador' }),
    ).toBeVisible()
  })

  test('rota privada sem sessão redireciona ao login', async ({ page }) => {
    await page.goto('/wallets')
    await expect(page).toHaveURL(/\/login/)
    await expect(page).toHaveURL(/redirect/)
  })

  test('credenciais inválidas mostram erro', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('E-mail').fill(SEED_USER.email)
    await page.getByLabel('Senha').fill('errada')
    await page.getByTestId('auth-submit').click()
    await expect(page.getByRole('alert')).toBeVisible()
  })
})
