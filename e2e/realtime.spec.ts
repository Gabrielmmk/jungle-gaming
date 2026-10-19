import { test, expect } from '@playwright/test'
import { login, addFirstNftToCart } from './helpers'

test.describe('Tempo real', () => {
  test('mudança de preço durante o checkout bloqueia a cotação desatualizada', async ({ page }) => {
    await login(page)
    await addFirstNftToCart(page)
    await page.goto('/checkout')

    await page.getByRole('radio', { name: 'MetaMask' }).check()
    await page.getByRole('button', { name: 'Conectar carteira' }).click()
    await expect(page.getByText('Conectada')).toBeVisible()

    // Altera o preço de um NFT do carrinho diretamente no mock db (o mesmo
    // efeito de um nft.updated que muda o estado do catálogo).
    await page.evaluate(() => {
      const g = (
        window as unknown as {
          __greenmint: {
            db: {
              __debugState: () => unknown
              bumpNftVersion: (id: string, patch: Record<string, unknown>) => void
            }
          }
        }
      ).__greenmint
      const state = g.db.__debugState() as {
        sessions: Record<string, string>
        cartsByKey: Record<string, { nftId: string }[]>
      }
      const uid = Object.values(state.sessions)[0]
      const line = state.cartsByKey[uid]?.[0]
      if (line) g.db.bumpNftVersion(line.nftId, { priceEth: '999.0' })
    })

    await page.getByTestId('confirm-order').click()
    // O servidor recusa com cotação desatualizada → a tela exige nova confirmação.
    await expect(page.getByText(/valores foram atualizados|desatualiz/i)).toBeVisible({
      timeout: 10_000,
    })
    await expect(page).not.toHaveURL(/\/order\//)
  })
})
