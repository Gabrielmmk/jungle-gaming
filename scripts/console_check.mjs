import { chromium } from '@playwright/test'
const b = await chromium.launch()
const p = await b.newPage()
const errs = []
p.on('console', m => { if (m.type()==='error') errs.push(m.text()) })
p.on('pageerror', e => errs.push('PAGEERROR: '+e.message))
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await p.waitForTimeout(800)
const id = await p.getByTestId('nft-card').first().getAttribute('href')
await p.goto('http://localhost:5173'+id, { waitUntil: 'networkidle' })
await p.waitForTimeout(800)
console.log('ERRORS('+errs.length+'):'); errs.slice(0,15).forEach(e=>console.log(' - '+e.slice(0,220)))
await b.close()
