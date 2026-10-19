import { test, expect } from '@playwright/test'
import { gotoHome } from './helpers'

test.describe('Descoberta', () => {
  test('busca compõe a URL e sobrevive a refresh e histórico', async ({ page }) => {
    await gotoHome(page)
    // A busca no header é um ícone que expande o campo.
    await page.getByRole('button', { name: 'Abrir busca' }).click()
    await page.getByTestId('search-input').fill('ape')
    await expect(page).toHaveURL(/q=ape/)

    // o estado vive na URL e sobrevive ao refresh
    await page.reload()
    await expect(page).toHaveURL(/q=ape/)

    // histórico: voltar remove o filtro
    await page.goBack()
    await expect(page).not.toHaveURL(/q=ape/)
  })

  test('paginação compõe a URL e sobrevive a refresh', async ({ page }) => {
    await gotoHome(page)
    const nextBtn = page.getByRole('button', { name: 'Próxima página' })
    await expect(nextBtn).toBeEnabled()
    await nextBtn.click()
    await expect(page).toHaveURL(/page=2/)
    await page.reload()
    await expect(page).toHaveURL(/page=2/)
  })

  test('acesso direto ao detalhe funciona', async ({ page }) => {
    await gotoHome(page)
    const first = page.getByTestId('nft-card').first()
    await first.click()
    await expect(page).toHaveURL(/\/nft\//)
    await expect(page.getByRole('button', { name: /Favoritar/ })).toBeVisible()
  })

  test('recurso inexistente mostra "não encontrado"', async ({ page }) => {
    await page.goto('/nft/nao-existe-xyz')
    await expect(page.getByText(/não encontrado/i)).toBeVisible()
  })
})
