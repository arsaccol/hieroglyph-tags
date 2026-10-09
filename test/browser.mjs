import { chromium, expect } from '@playwright/test'
import { build } from 'vite'
import { mkdtemp, mkdir, writeFile, readFile, cp, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const root = resolve('.')
const consumer = await mkdtemp(join(tmpdir(), 'hieroglyph-tags-consumer-'))
const pack = spawnSync('npm', ['pack', '--json', '--pack-destination', consumer], { encoding: 'utf8' })
if (pack.status !== 0) throw new Error(pack.stderr)
const packed = JSON.parse(pack.stdout)[0]
const shipped = new Set(packed.files.map(file => file.path))
for (const required of ['vendor/hierojax/NewGardiner.otf', 'vendor/hierojax/runtime.js', 'vendor/hierojax/LICENSE', 'vendor/hierojax/OFL.txt', 'LICENSE', 'THIRD_PARTY.md', 'src/mdc/convertMdcToUnicode.ts', 'scripts/vendor-hierojax.mjs']) {
  if (!shipped.has(required)) throw new Error(`Missing packed asset: ${required}`)
}
if ([...shipped].some(file => file.includes('inpu-reference') || file.includes('node_modules'))) throw new Error('Reference/dependency leak')
const unpack = spawnSync('tar', ['-xzf', join(consumer, packed.filename), '-C', consumer])
if (unpack.status !== 0) throw new Error('Could not extract packed package')
const pkg = JSON.parse(await readFile(join(consumer, 'package/package.json'), 'utf8'))
if (pkg.dependencies || pkg.peerDependencies) throw new Error('Unexpected production dependencies')
const core = await import(pathToFileURL(join(consumer, 'package/dist/core.js')).href)
expect(core.convertMdcToUnicode('A1:O1').unicode).toBe('𓀀𓐰𓉐')
await mkdir(join(consumer, 'demo'))
await writeFile(join(consumer, 'demo/index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><title>Packed vanilla consumer</title>
<style>body {color: rgb(12, 34, 56)} hieroglyph-tag {font-size:48px}</style>
<script type="module" src="/package/dist/index.js"></script>
<hieroglyph-tag id="one"> A1:O1 </hieroglyph-tag>
<hieroglyph-tag>W24*Z7</hieroglyph-tag><hieroglyph-tag>A1*(W24:Z7)</hieroglyph-tag><hieroglyph-tag>anx</hieroglyph-tag>
<hieroglyph-tag id="invalid">A999</hieroglyph-tag></html>`)
// A normal bundler consumer uses the package exports and must emit the font.
await mkdir(join(consumer, 'node_modules'), { recursive: true })
await cp(join(consumer, 'package'), join(consumer, 'node_modules/hieroglyph-tags'), { recursive: true })
const bundleSource = join(consumer, 'bundle-source')
await mkdir(bundleSource)
await writeFile(join(bundleSource, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Bundled consumer</title>
<script type="module">import 'hieroglyph-tags'</script><hieroglyph-tag>A1:O1</hieroglyph-tag>`)
await build({ configFile: false, root: bundleSource, base: './',
  build: { outDir: join(consumer, 'bundled'), emptyOutDir: true }, logLevel: 'warn' })
expect((await readdir(join(consumer, 'bundled/assets'))).some(file => file.endsWith('.otf'))).toBe(true)
const servers = []
async function serve(directory, port) {
  const child = spawn(process.execPath, [join(root, 'scripts/serve.mjs')], {
    env: { ...process.env, DEMO_ROOT: directory, PORT: String(port) }, stdio: ['ignore', 'pipe', 'inherit'],
  })
  servers.push(child)
  await new Promise((ok, reject) => {
    child.stdout.once('data', ok); child.once('error', reject)
    child.once('exit', () => reject(new Error('Server exited')))
  })
}
let browser
try {
  await serve(consumer, 4174)
  await serve(join(consumer, 'bundled'), 4175)
  await serve(root, 4176)
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://127.0.0.1:4174/')
  const one = page.locator('#one')
  await expect(one.locator('svg')).toHaveCount(1)
  await expect(page.locator('hieroglyph-tag svg')).toHaveCount(4)
  expect(await one.evaluate(el => el.textContent)).toBe(' A1:O1 ')
  expect(await page.evaluate(() => document.fonts.check('48px Hieroglyphic', '𓀀'))).toBe(true)
  const svg = one.locator('svg')
  const box = await svg.boundingBox()
  expect(box.width).toBeGreaterThan(5)
  expect(box.height).toBeGreaterThan(20)
  expect(await one.evaluate(el => getComputedStyle(el).color)).toBe('rgb(12, 34, 56)')
  const controls = one.locator('.controls')
  await expect(controls).toHaveCSS('opacity', '0')
  await one.hover()
  await expect(controls).toHaveCSS('opacity', '1')
  await one.getByRole('button', { name: 'Copy MdC', exact: true }).click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('A1:O1')
  await one.getByRole('button', { name: 'Copy Unicode', exact: true }).click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('𓀀𓐰𓉐')
  await page.mouse.move(0, 0)
  await one.getByRole('button', { name: 'Copy MdC', exact: true }).focus()
  await expect(controls).toHaveCSS('opacity', '1')
  await expect(page.locator('#invalid').getByRole('alert')).toContainText('Unknown sign')
  await one.evaluate(el => { el.textContent = 'W24*Z7' })
  await expect(one.locator('[role="img"]')).toHaveAttribute('aria-label', 'Hieroglyphs: W24*Z7')
  await expect(one.locator('svg')).toHaveCount(1)
  await one.getByRole('button', { name: 'Copy Unicode', exact: true }).click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('𓏌𓐱𓏲')
  await one.evaluate(el => { el.textContent = 'A999' })
  await expect(one.getByRole('alert')).toContainText('Unknown sign')
  await expect(one.getByRole('button', { name: 'Copy Unicode', exact: true })).toBeDisabled()
  await one.evaluate(el => { el.textContent = 'anx' })
  await expect(one.locator('svg')).toHaveCount(1)
  expect(errors).toEqual([])
  await page.screenshot({ path: join(consumer, 'smoke.png'), fullPage: true })
  await page.goto('http://127.0.0.1:4175/index.html')
  await expect(page.locator('hieroglyph-tag svg')).toHaveCount(1)
  expect(await page.evaluate(() => document.fonts.check('16px Hieroglyphic', '𓀀'))).toBe(true)
  for (const path of ['/demo/index.html', '/dist/demo/index.html']) {
    await page.goto(`http://127.0.0.1:4176${path}`)
    await expect(page.locator('#html-preview hieroglyph-tag svg')).toHaveCount(7)
    const editor = page.getByRole('textbox', { name: 'HTML editor' })
    await editor.fill('<h2>A new heading</h2><p>Inline <hieroglyph-tag>anx</hieroglyph-tag>.</p>')
    await expect(page.locator('#html-preview h2')).toHaveText('A new heading')
    await expect(page.locator('#html-preview hieroglyph-tag svg')).toHaveCount(1)
    await expect(page.locator('#html-preview [role="img"]')).toHaveAttribute('aria-label', 'Hieroglyphs: anx')
    await editor.fill('<p><hieroglyph-tag>A999</hieroglyph-tag></p>')
    await expect(page.locator('#html-preview').getByRole('alert')).toContainText('Unknown sign')
    await editor.fill('<p onclick="window.previewScriptRan=true">Safe markup</p><script>window.previewScriptRan=true</script>')
    await page.locator('#html-preview p').click()
    expect(await page.evaluate(() => window.previewScriptRan)).toBeUndefined()
    await page.getByRole('button', { name: 'Reset example' }).click()
    await expect(page.locator('#html-preview hieroglyph-tag svg')).toHaveCount(7)
    const sourceBox = await editor.boundingBox()
    const previewBox = await page.locator('#html-preview').boundingBox()
    expect(previewBox.x).toBeGreaterThan(sourceBox.x + sourceBox.width)
    await page.setViewportSize({ width: 390, height: 844 })
    const mobileSource = await editor.boundingBox()
    const mobilePreview = await page.locator('#html-preview').boundingBox()
    expect(mobilePreview.y).toBeGreaterThan(mobileSource.y + mobileSource.height)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.setViewportSize({ width: 1280, height: 720 })
  }
  expect(errors).toEqual([])
  await page.screenshot({ path: join(consumer, 'demo.png'), fullPage: true })
  console.log(`Packed vanilla, bundled consumer, and source/built demos passed: ${consumer}`)
} finally {
  await browser?.close()
  for (const server of servers) server.kill()
}
