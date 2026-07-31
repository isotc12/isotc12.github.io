import { readYamlDir } from './yaml.mjs'

export function loadMembers(dataDir) {
  return readYamlDir(`${dataDir}/members`)
    .filter(({ id }) => id !== 'README' && id)
    .map(({ data }) => ({
      id: data['member-id'],
      name: data.name,
      salutation: data.salutation || '',
      active: data.active !== false,
      roles: data.roles || [],
    }))
    .filter(m => m.id && m.name)
}
