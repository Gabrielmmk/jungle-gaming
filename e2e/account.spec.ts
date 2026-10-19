import { test, expect } from '@playwright/test'
import { login, SEED_USER } from './helpers'

test.describe('Conta e sessão', () => {
  test('login com credenciais semeadas e logout', async ({ page }) => {
    await login(page)
    // sessão recuperável após refresh (rota com header fixo, independente
    // de viewport — a Início no mobile não tem o header padrão)
    await page.goto('/profile')
    await page.reload()
    await expect(page.getByRole('banner').getByRole('link', { name: SEED_USER.name })).toBeVisible()

    // logout pela área de conta
    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page.getByRole('banner').getByRole('button', { name: 'Entrar' })).toBeVisible()
  })

  test('cadastro cria conta e autentica', async ({ page }) => {
    const uniq = Date.now()
    const username = `novo${uniq}`
    // já carrega em modo "registro" (defaultMode="register"); não depende
    // da aba Entrar/Criar conta, que só existe no variant "dialog" (desktop)
    await page.goto('/register')
    await page.getByLabel('Nome de usuário').fill(username)
    await page.getByLabel('E-mail').fill(`novo${uniq}@x.com`)
    await page.getByLabel('Senha', { exact: true }).fill('segredo123')
    await page.getByLabel('Confirmar senha').fill('segredo123')
    await page.getByTestId('auth-submit').click()
    // rota com header fixo — a Início no mobile não tem o header padrão
    await page.goto('/profile')
    await expect(page.getByRole('banner').getByRole('link', { name: username })).toBeVisible()
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
