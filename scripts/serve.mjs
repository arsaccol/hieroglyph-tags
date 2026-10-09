import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
const root = resolve(process.env.DEMO_ROOT || '.')
const port = Number(process.env.PORT || 4173)
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.otf': 'font/otf', '.json': 'application/json' }
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    let path = resolve(root, '.' + (pathname === '/' ? '/demo/index.html' : pathname))
    if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return }
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html')
    res.setHeader('Content-Type', types[extname(path)] || 'application/octet-stream')
    res.end(await readFile(path))
  } catch { res.writeHead(404).end('Not found') }
}).listen(port, '127.0.0.1', () => console.log(`Vanilla demo: http://127.0.0.1:${port}/demo/index.html\nBuilt demo: http://127.0.0.1:${port}/dist/demo/index.html`))
