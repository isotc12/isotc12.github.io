import fs from 'node:fs'
import path from 'node:path'
import { glob } from 'node:fs/promises'

const ROOT = path.resolve(import.meta.dirname, '..')
const DIST = path.join(ROOT, 'dist')

// Check for broken internal links in all HTML files
const htmlFiles = []
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f)
    if (fs.statSync(fp).isDirectory()) walk(fp)
    else if (f.endsWith('.html')) htmlFiles.push(fp)
  }
}
walk(DIST)

const existingPaths = new Set(htmlFiles.map(f => '/' + path.relative(DIST, f).replace(/index\.html$/, '').replace(/\.html$/, '')))

let broken = 0
for (const f of htmlFiles) {
  const html = fs.readFileSync(f, 'utf-8')
  const links = html.match(/href="(\/[^"]*)"/g) || []
  for (const link of links) {
    const url = link.match(/href="([^"]*)"/)[1]
    if (url.startsWith('http') || url.startsWith('#') || url.startsWith('mailto')) continue
    const normalized = url.replace(/\/$/, '') + '/'
    // Check if it exists
    const checkPaths = [url, normalized, url.replace(/\/$/, '')]
    if (!checkPaths.some(p => existingPaths.has(p))) {
      // Skip if it's an external link or asset
      if (url.includes('.') && !url.endsWith('.html')) continue
      console.warn(`[post-build] broken link: ${url} in ${path.relative(DIST, f)}`)
      broken++
    }
  }
}
console.log(`[post-build] Checked ${htmlFiles.length} HTML files, ${broken} broken links`)
process.exit(broken > 0 ? 1 : 0)
