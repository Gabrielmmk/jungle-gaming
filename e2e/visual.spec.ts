import { test, expect } from '@playwright/test'
import { login, gotoHome, addFirstNftToCart } from './helpers'

// Regressão visual (§9) das telas-chave, com baselines versionadas por
// projeto (desktop e mobile). Dados vêm do seed determinístico. As imagens
// de NFT são MASCARADAS (os assets de arte não entram nas baselines — a
// regressão foca em layout/estrutura/cores/tipografia, não na arte).
test.describe('Regressão visual', () => {
  const snap = (page: import('@playwright/test').Page) => ({
    fullPage: true,
    animations: 'disabled' as const,
    maxDiffPixelRatio: 0.02,
    mask: [page.locator('img')],
  })

  test('Início', async ({ page }) => {
    await gotoHome(page)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('inicio.png', snap(page))
  })

  test('Detalhe do NFT', async ({ page }) => {
    await gotoHome(page)
    await page.getByTestId('nft-card').first().click()
    await expect(page.getByRole('button', { name: /Favoritar/ })).toBeVisible()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('detalhe.png', snap(page))
  })

  test('Carrinho', async ({ page }) => {
    await addFirstNftToCart(page)
    await page.goto('/cart')
    await expect(page.getByTestId('cart-total')).toBeVisible()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('carrinho.png', snap(page))
  })

  test('Pagamento', async ({ page }) => {
    await login(page)
    await addFirstNftToCart(page)
    await page.goto('/checkout')
    await expect(page.getByTestId('checkout-total')).toBeVisible()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('pagamento.png', snap(page))
  })
})
