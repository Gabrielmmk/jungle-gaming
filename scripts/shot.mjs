// Screenshot utilitário para o passe de fidelidade visual.
// Uso: node scripts/shot.mjs <rota> <arquivo> [largura] [altura]
import { chromium } from '@playwright/test'

const [route = '/', out = 'shot.png', w = '1440', h = '900'] = process.argv.slice(2)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } })
await page.goto(`http://localhost:5173${route}`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
await page.screenshot({ path: `/tmp/${out}`, fullPage: true })
await browser.close()
console.log(`saved /tmp/${out}`)
