export const committee = {
  name: 'ISO/TC 12',
  short_title: 'Quantities & Units',
  title: 'Quantities and units',
  tagline: 'Quantities and units',
  scope:
    'Standardization of units and symbols for quantities and units (and mathematical symbols) used within the different fields of science and technology, giving, where necessary, definitions of these quantities and units. Standard conversion factors between various units.',

  secretariat: 'SIS (Sweden)',
  chair: 'Dr Torgny Carlsson',
  committee_manager: 'Ms Rebecca Cederholm',
  established: 1947,

  links: {
    iso: 'https://www.iso.org',
    isoCommittee: 'https://www.iso.org/committee/45976.html',
    committeeSite: 'https://committee.iso.org/home/tc12',
    github: 'https://github.com/isotc12',
  },

  secretariat_email: 'anette.noren@sis.se',
} as const

export type Committee = typeof committee
