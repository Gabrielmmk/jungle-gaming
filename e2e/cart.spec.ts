import { test, expect } from '@playwright/test'
import { addFirstNftToCart } from './helpers'

test.describe('Carrinho', () => {
  test('adicionar, cupom inválido/válido e persistência após refresh', async ({ page }) => {
    await addFirstNftToCart(page)
    await page.goto('/cart')
    await expect(page.getByTestId('cart-row')).toHaveCount(1)
    await expect(page.getByTestId('cart-total')).toBeVisible()

    // cupom inválido
    await page.getByLabel('Código promocional').fill('NOPE')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText(/inválido/i)).toBeVisible()

    // cupom válido
    await page.getByLabel('Código promocional').fill('LAUNCH10')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText(/aplicado/i)).toBeVisible()

    // persiste após refresh (estado do carrinho no mock sobrevive)
    await page.reload()
    await expect(page.getByTestId('cart-row')).toHaveCount(1)
  })

  test('remover item esvazia o carrinho', async ({ page }) => {
    await addFirstNftToCart(page)
    await page.goto('/cart')
    await page.getByRole('button', { name: /Remover/ }).click()
    await expect(page.getByText(/carrinho está vazio/i)).toBeVisible()
  })
})
