import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, '_data/resolutions')
const EVENTS = path.join(ROOT, '_data/events')
const STAGE_R = path.join(ROOT, '_data/resolutions-edoxen')
const STAGE_E = path.join(ROOT, '_data/events-edoxen')

const SUBDIRS_R = ['plenary', 'ballots']

fs.rmSync(STAGE_R, { recursive: true, force: true })
fs.rmSync(STAGE_E, { recursive: true, force: true })
fs.mkdirSync(STAGE_R, { recursive: true })
fs.mkdirSync(STAGE_E, { recursive: true })

let rCount = 0
for (const sub of SUBDIRS_R) {
  const srcDir = path.join(SRC, sub)
  if (!fs.existsSync(srcDir)) {
    console.warn(`[prepare-edoxen-data] skip ${sub}/ (missing)`)
    continue
  }
  for (const f of fs.readdirSync(srcDir).filter((f) => f.endsWith('.yaml'))) {
    const src = path.join(srcDir, f)
    const dst = path.join(STAGE_R, f)
    try { fs.linkSync(src, dst) } catch { fs.copyFileSync(src, dst) }
    rCount++
  }
}
console.log(`[prepare-edoxen-data] resolutions → ${rCount} YAML files (flat)`)

let eCount = 0
if (fs.existsSync(EVENTS)) {
  for (const f of fs.readdirSync(EVENTS).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))) {
    const src = path.join(EVENTS, f)
    const dst = path.join(STAGE_E, f.replace(/\.ya?ml$/, '.yaml'))
    try { fs.linkSync(src, dst) } catch { fs.copyFileSync(src, dst) }
    eCount++
  }
}
console.log(`[prepare-edoxen-data] events → ${eCount} YAML files`)
