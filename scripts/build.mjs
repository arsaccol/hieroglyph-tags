import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
let css = await readFile(new URL('../vendor/hierojax/hierojax.css', import.meta.url), 'utf8')
css = css.replace(/@font-face\s*\{[^}]*\}/, '')
await writeFile(new URL('../src/hierojax/styles.ts', import.meta.url),
  '// Generated from upstream CSS by scripts/build.mjs; see THIRD_PARTY.md.\nexport const hierojaxStyles = ' + JSON.stringify(css) + '\n')
const result = spawnSync('tsc', [], { stdio: 'inherit', shell: process.platform === 'win32' })
if (result.status !== 0) process.exit(result.status ?? 1)
await mkdir('dist/demo', { recursive: true })
const demo = await readFile('demo/index.html', 'utf8')
await writeFile('dist/demo/index.html', demo.replaceAll('../dist/index.js', '../index.js'))
