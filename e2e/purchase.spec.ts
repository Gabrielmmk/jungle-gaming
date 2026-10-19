import { test, expect } from '@playwright/test'
import { login, addFirstNftToCart } from './helpers'

/** Seleciona o provedor MetaMask e simula a conexão da carteira no checkout. */
async function connectMetaMask(page: import('@playwright/test').Page) {
  await page.getByRole('radio', { name: 'MetaMask' }).check()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText('Conectada')).toBeVisible()
}

test.describe('Compra', () => {
  test('fluxo completo do catálogo ao recibo confirmado', async ({ page }) => {
    await login(page)
    await addFirstNftToCart(page)
    await page.goto('/cart')
    await page.getByRole('link', { name: /Conectar e finalizar/ }).click()
    await expect(page).toHaveURL(/\/checkout/)

    await connectMetaMask(page)
    await page.getByTestId('confirm-order').click()

    await expect(page).toHaveURL(/\/order\//)
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Seus NFTs agora estão na sua carteira.')).toBeVisible()
    await expect(page.getByText(/transferida para sua carteira/i)).toBeVisible()
  })

  test('pagamento recusado mostra estado de recusa', async ({ page }) => {
    await login(page)
    await addFirstNftToCart(page)
    await page.goto('/checkout?scenario=payment-refused')
    await connectMetaMask(page)
    await page.getByTestId('confirm-order').click()
    await expect(page.getByRole('heading', { name: /recusado/i })).toBeVisible({ timeout: 10_000 })
  })

  test('timeout na criação do pedido é recuperado por idempotência (sem duplicar)', async ({
    page,
  }) => {
    await login(page)
    await addFirstNftToCart(page)
    await page.goto('/checkout?scenario=order-timeout')
    await connectMetaMask(page)
    await page.getByTestId('confirm-order').click()
    // O 1º POST expira (2s) e o retry com a mesma chave recupera o pedido.
    await expect(page).toHaveURL(/\/order\//, { timeout: 15_000 })
  })
})
