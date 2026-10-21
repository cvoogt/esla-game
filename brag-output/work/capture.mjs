import { createRequire } from 'module'
const require = createRequire('/opt/node22/lib/node_modules/')
const { chromium } = require('playwright')
const [, , mode, outDir, ...times] = process.argv
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' + '' })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
page.on('pageerror', (e) => console.error('PAGEERR', e.message))
await page.goto('file://' + new URL('./video.html', import.meta.url).pathname)
await page.evaluate(() => document.fonts.ready)
const fps = 30
const list = mode === 'all' ? Array.from({ length: Math.round(21.5 * fps) }, (_, i) => i / fps) : times.map(Number)
for (let i = 0; i < list.length; i++) {
  await page.evaluate((t) => window.render(t), list[i])
  const name = mode === 'all' ? `f${String(i).padStart(4, '0')}.png` : `t${list[i].toFixed(2)}.png`
  await page.screenshot({ path: `${outDir}/${name}` })
}
await browser.close()
