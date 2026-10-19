import { type Page, expect } from '@playwright/test'

export const SEED_USER = {
  email: 'ana.silva@greenmint.test',
  password: 'senha1234',
  name: 'Ana Silva',
}

/** Aguarda os mocks ativarem e a primeira grade de NFTs renderizar. */
export async function gotoHome(page: Page): Promise<void> {
  await page.goto('/')
  await expect(page.getByTestId('nft-card').first()).toBeVisible()
}

/** Faz login pela UI com as credenciais semeadas (ou as fornecidas). */
export async function login(
  page: Page,
  email = SEED_USER.email,
  password = SEED_USER.password,
): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByTestId('auth-submit').click()
  // Login bem-sucedido navega para fora de /login…
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 })
  // …e o header (banner) passa a mostrar o nome do usuário (link p/ /profile).
  await expect(page.getByRole('banner').getByRole('link', { name: SEED_USER.name })).toBeVisible()
}

/** Adiciona o primeiro NFT disponível ao carrinho e retorna para /cart. */
export async function addFirstNftToCart(page: Page): Promise<void> {
  await gotoHome(page)
  await page.getByTestId('nft-card').first().click()
  await expect(page.getByRole('button', { name: /Comprar/ })).toBeVisible()
  await page.getByRole('button', { name: /Comprar/ }).click()
  await expect(page.getByText(/Adicionado ao carrinho/)).toBeVisible()
}
