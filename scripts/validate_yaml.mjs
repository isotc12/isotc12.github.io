import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import Ajv from 'ajv'

const ROOT = path.resolve(import.meta.dirname, '..')
const SCHEMA_DIR = path.join(ROOT, 'schemas')
const DATA_DIR = path.join(ROOT, '_data')

const ajv = new Ajv({ allErrors: true })

function loadSchema(name) {
  const p = path.join(SCHEMA_DIR, `${name}.yaml`)
  if (!fs.existsSync(p)) return null
  return yaml.load(fs.readFileSync(p, 'utf-8'))
}

function validate(name, file, schemaName) {
  const schema = loadSchema(schemaName)
  if (!schema) { console.warn(`[validate] no schema for ${schemaName}`); return true }
  const validate = ajv.compile(schema)
  const p = path.join(DATA_DIR, file)
  if (!fs.existsSync(p)) { console.log(`[validate] skip ${file} (missing)`); return true }
  const data = yaml.load(fs.readFileSync(p, 'utf-8'))
  const ok = validate(data)
  if (!ok) {
    console.error(`[validate] ${file}: INVALID`)
    for (const err of validate.errors) console.error(`  ${err.instancePath}: ${err.message}`)
    return false
  }
  console.log(`[validate] ${file}: OK`)
  return true
}

function validateMembers() {
  const schema = loadSchema('member')
  if (!schema) return true
  const validate = ajv.compile(schema)
  const dir = path.join(DATA_DIR, 'members')
  let allOk = true
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.yaml'))) {
    const data = yaml.load(fs.readFileSync(path.join(dir, f), 'utf-8'))
    if (!validate(data)) {
      console.error(`[validate] members/${f}: INVALID`)
      for (const err of validate.errors) console.error(`  ${err.instancePath}: ${err.message}`)
      allOk = false
    }
  }
  console.log(`[validate] members/: ${allOk ? 'ALL OK' : 'HAS ERRORS'}`)
  return allOk
}

let ok = true
ok = validateMembers() && ok
ok = validate('national_bodies', 'national_bodies.yml', 'national_bodies') && ok
ok = validate('liaisons', 'liaisons.yml', 'liaisons') && ok

process.exit(ok ? 0 : 1)
