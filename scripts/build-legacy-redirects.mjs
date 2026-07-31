import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'public', 'data', 'legacy-redirects.json')

const resolutions = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/resolutions.json'), 'utf-8'))

const redirects = {}
// Map N-numbers to decision URLs
for (const p of resolutions.plenary || []) {
  for (const d of p.decisions || []) {
    if (d.number) {
      redirects[`/resolutions/${d.number}/`] = `/decisions/${d.number}/`
    }
  }
}

fs.writeFileSync(OUT, JSON.stringify(redirects, null, 2))
console.log(`[legacy-redirects] Wrote ${Object.keys(redirects).length} redirects`)
