import { readYaml } from './yaml.mjs'

export function loadLiaisons(dataDir) {
  return readYaml(`${dataDir}/liaisons.yml`) || { external_organisations: [], iso_iec_committees: [] }
}
