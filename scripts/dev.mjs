import { spawnSync, spawn } from 'node:child_process'
const result = spawnSync(process.execPath, ['scripts/build.mjs'], { stdio: 'inherit' })
if (result.status !== 0) process.exit(result.status ?? 1)
const watcher = spawn('tsc', ['--watch', '--preserveWatchOutput'], { stdio: 'inherit' })
const server = spawn(process.execPath, ['scripts/serve.mjs'], { stdio: 'inherit' })
function stop() { watcher.kill(); server.kill() }
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
