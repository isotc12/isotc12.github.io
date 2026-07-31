import { readYaml } from './yaml.mjs'

export function loadNationalBodies(dataDir) {
  return readYaml(`${dataDir}/national_bodies.yml`) || { participating: [], observing: [] }
}
