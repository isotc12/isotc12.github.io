import { describe, it, expect } from 'vitest'
import { readYaml, readYamlDir } from './yaml.mjs'
import path from 'node:path'

const DATA_DIR = path.resolve(import.meta.dirname, '../../_data')

describe('readYaml', () => {
  it('returns null for non-existent file', () => {
    expect(readYaml('/nonexistent/file.yaml')).toBeNull()
  })

  it('reads a YAML file', () => {
    const data = readYaml(path.join(DATA_DIR, 'liaisons.yml'))
    expect(data).toBeTruthy()
    expect(data.external_organisations).toBeInstanceOf(Array)
  })
})

describe('readYamlDir', () => {
  it('returns empty array for non-existent dir', () => {
    expect(readYamlDir('/nonexistent/dir')).toEqual([])
  })

  it('reads all YAML files in members/', () => {
    const items = readYamlDir(path.join(DATA_DIR, 'members'))
    expect(items.length).toBeGreaterThan(100)
    expect(items[0]).toHaveProperty('id')
    expect(items[0]).toHaveProperty('data')
  })
})
