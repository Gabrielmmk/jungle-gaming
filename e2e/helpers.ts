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
  // Locators por `name` (não por label): o botão de mostrar/ocultar senha
  // tem aria-label "Mostrar/Ocultar senha", que colide com getByLabel('Senha').
  await page.locator('input[name="email"]').fill(email)
  await page.locator('input[name="password"]').fill(password)
  await page.getByTestId('auth-submit').click()
  // Login bem-sucedido navega para fora de /login…
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 })
  // …e o header (banner) passa a mostrar o nome do usuário (link p/ /profile).
  // Exceção: a Início no mobile não tem o header padrão (ver `MobileTopBar`/
  // `MobileBottomNav`) — lá a sessão é confirmada pelo ícone "Minha conta".
  const banner = page.getByRole('banner')
  if (await banner.count()) {
    await expect(banner.getByRole('link', { name: SEED_USER.name })).toBeVisible()
  } else {
    await expect(page.getByRole('link', { name: 'Minha conta' })).toBeVisible()
  }
}

/** Adiciona o primeiro NFT disponível ao carrinho e retorna para /cart. */
export async function addFirstNftToCart(page: Page): Promise<void> {
  await gotoHome(page)
  await page.getByTestId('nft-card').first().click()
  await expect(page.getByRole('button', { name: /Comprar/ })).toBeVisible()
  await page.getByRole('button', { name: /Comprar/ }).click()
  await expect(page.getByText(/Adicionado ao carrinho/)).toBeVisible()
}
