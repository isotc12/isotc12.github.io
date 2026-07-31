import { readYamlDir } from './yaml.mjs'

export function loadEvents(dataDir) {
  return readYamlDir(`${dataDir}/events`)
    .filter(({ id }) => /^plenary-meeting-\d+$/.test(id))
    .map(({ id, data }) => ({
      id,
      ordinal: data.ordinal,
      year: data.year,
      status: data.status,
      title: data.title,
      landing_url: `/meetings/plenary-${data.ordinal}/`,
      general_area: data.general_area,
      country_code: data.country_code,
      time: data.time,
      host: data.host,
      chair: data.chair,
      acting_chair_at_meeting: data.acting_chair_at_meeting,
      attendance: data.attendance,
      next_plenary: data.next_plenary,
    }))
    .sort((a, b) => (b.ordinal ?? 0) - (a.ordinal ?? 0))
}
