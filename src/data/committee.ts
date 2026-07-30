export const committee = {
  name: 'ISO/TC 12',
  title: 'Quantities and units',
  tagline: 'Quantities and units — the foundation of measurement science and engineering',
  scope:
    'Standardization of quantities and units, and the corresponding scales, symbols, formulae, letter symbols and signs, including their nomenclature and practical use, in science, technology, and trade, in fields such as physical, chemical, mathematical, biological, physiological, and other sciences.',

  secretariat: 'SIS (Sweden)',
  chair: 'Dr Torgny Carlsson',
  established: 1947,

  links: {
    iso: 'https://www.iso.org',
    isoCommittee: 'https://www.iso.org/committee/45976.html',
    committeeSite: 'https://committee.iso.org/home/tc12',
    github: 'https://github.com/isotc12',
  },
} as const

export type Committee = typeof committee
