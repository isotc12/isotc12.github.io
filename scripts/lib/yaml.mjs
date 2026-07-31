import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

export function readYaml(p) {
  if (!fs.existsSync(p)) return null
  const txt = fs.readFileSync(p, 'utf-8')
  const parts = txt.split(/^---\s*$/m).filter(Boolean)
  const body = parts.length > 1 ? parts[1] : parts[0]
  return yaml.load(body)
}

export function readYamlDir(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
    .map(f => {
      const id = path.basename(f).replace(/\.ya?ml$/, '')
      const data = readYaml(path.join(dir, f))
      return data ? { id, data } : null
    })
    .filter(Boolean)
}
