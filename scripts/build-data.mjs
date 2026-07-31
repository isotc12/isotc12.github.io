import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(ROOT, '_data')
const OUT_DIR = path.join(ROOT, 'public', 'data')

function readYaml(p) {
  if (!fs.existsSync(p)) return null
  const txt = fs.readFileSync(p, 'utf-8')
  const parts = txt.split(/^---\s*$/m).filter(Boolean)
  const body = parts.length > 1 ? parts[1] : parts[0]
  return yaml.load(body)
}

function readYamlDir(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    .map((f) => {
      const id = path.basename(f).replace(/\.ya?ml$/, '')
      const data = readYaml(path.join(dir, f))
      return data ? { id, data } : null
    })
    .filter(Boolean)
}

function writeJson(name, data) {
  const out = path.join(OUT_DIR, name)
  fs.writeFileSync(out, JSON.stringify(data, null, 2))
  const size = fs.statSync(out).size
  console.log(`[build-data] ${name}  ${size.toLocaleString()} bytes`)
}

function loadPlenaryEvents() {
  const dir = path.join(DATA_DIR, 'events')
  const items = readYamlDir(dir)
    .filter(({ id }) => /^plenary-meeting-\d+$/.test(id))
    .map(({ id, data }) => ({
      id,
      ordinal: data.ordinal,
      year: data.year,
      status: data.status,
      title: data.title,
      landing_url: `/meetings/urn:iso:tc12:meeting:plenary-${data.ordinal}`,
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
  return items
}

function loadResolutionsSubmodule() {
  const dir = path.join(DATA_DIR, 'resolutions')
  const plenaryDir = path.join(dir, 'plenary')
  const ballotsDir = path.join(dir, 'ballots')
  const plenaryFiles = readYamlDir(plenaryDir)
    .filter(({ id }) => /^plenary-\d+$/.test(id))
    .sort((a, b) => parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1]))
  const ballotFiles = readYamlDir(ballotsDir).sort((a, b) => a.id.localeCompare(b.id))

  const plenaryMeetings = {}
  for (const { id, data } of plenaryFiles) {
    const n = parseInt(id.split('-')[1])
    const date = data.metadata?.date
    const title = (data.metadata?.title || []).map((t) => t.value).join(' / ')
    plenaryMeetings[n] = {
      ordinal: n,
      date,
      title,
      decision_count: (data.decisions || []).length,
      decisions: (data.decisions || []).map((d) => ({
        identifier: d.identifier?.map((i) => `${i.prefix} ${i.number}`).join(', '),
        urn: d.urn,
        number: d.identifier?.[0]?.number,
        title: (d.title || []).map((t) => t.value).join(' / '),
        categories: d.categories,
        status: d.status,
        dates: d.dates,
        kind: d.kind,
      })),
    }
  }

  const ballotYears = {}
  for (const { id, data } of ballotFiles) {
    const date = data.metadata?.date
    const title = (data.metadata?.title || []).map((t) => t.value).join(' / ')
    ballotYears[id] = {
      id,
      date,
      title,
      decision_count: (data.decisions || []).length,
      decisions: (data.decisions || []).map((d) => ({
        identifier: d.identifier?.map((i) => `${i.prefix} ${i.number}`).join(', '),
        urn: d.urn,
        number: d.identifier?.[0]?.number,
        title: (d.title || []).map((t) => t.value).join(' / '),
        categories: d.categories,
        status: d.status,
        dates: d.dates,
        kind: d.kind,
      })),
    }
  }

  return { plenaryMeetings, ballotYears }
}

function loadStandards() {
  return [
    { slug: 'iso-80000-1',  part: 1,  title: 'General',                          edition_year: 2022, status: 'published', stage: '90.20', scope: 'General definitions and overview of the ISO/IEC 80000 series.' },
    { slug: 'iso-80000-2',  part: 2,  title: 'Mathematics',                      edition_year: 2019, status: 'under revision', stage: '20.00', scope: 'Mathematical signs and symbols to be used in the natural sciences and technology.' },
    { slug: 'iso-80000-3',  part: 3,  title: 'Space and time',                   edition_year: 2019, status: 'published', stage: '90.20', scope: 'Quantities and units of space and time.' },
    { slug: 'iso-80000-4',  part: 4,  title: 'Mechanics',                        edition_year: 2019, status: 'under revision', stage: '20.00', scope: 'Mechanics quantities and units.' },
    { slug: 'iso-80000-5',  part: 5,  title: 'Thermodynamics',                   edition_year: 2019, status: 'published', stage: '60.00', scope: 'Thermodynamic quantities and units (incl. amendment 1 in development).' },
    { slug: 'iso-80000-6',  part: 6,  title: 'Electromagnetism',                 edition_year: 2022, status: 'published', stage: '60.00', scope: 'Electromagnetic quantities and units (IEC lead).' },
    { slug: 'iso-80000-7',  part: 7,  title: 'Light and radiation',              edition_year: 2019, status: 'published', stage: '60.00', scope: 'Optical radiation quantities and units.' },
    { slug: 'iso-80000-8',  part: 8,  title: 'Acoustics',                        edition_year: 2020, status: 'published', stage: '90.20', scope: 'Acoustic quantities and units.' },
    { slug: 'iso-80000-9',  part: 9,  title: 'Physical chemistry and molecular physics', edition_year: 2019, status: 'published', stage: '50.00', scope: 'Physical chemistry and molecular physics quantities and units.' },
    { slug: 'iso-80000-10', part: 10, title: 'Atomic and nuclear physics',       edition_year: 2019, status: 'published', stage: '90.20', scope: 'Atomic and nuclear physics quantities and units.' },
    { slug: 'iso-80000-11', part: 11, title: 'Characteristic numbers',           edition_year: 2019, status: 'published', stage: '90.20', scope: 'Dimensionless characteristic numbers used in transport phenomena.' },
    { slug: 'iso-80000-12', part: 12, title: 'Condensed matter physics',         edition_year: 2019, status: 'published', stage: '90.20', scope: 'Condensed matter physics quantities and units.' },
    { slug: 'iso-80000-13', part: 13, title: 'Information science and technology', edition_year: 2025, status: 'published', stage: '60.00', scope: 'Binary prefixes (e.g. kibi, mebi, gibi); updated 2025 with robi and quebi.' },
    { slug: 'iso-80000-14', part: 14, title: 'Telebiometrics and biometrics',    edition_year: null, status: 'withdrawn', stage: '95.99', scope: 'Transferred to IEC 80003 series.' },
    { slug: 'iso-80000-15', part: 15, title: 'Logarithmic and related quantities', edition_year: null, status: 'under development', stage: '30.60', scope: 'Logarithmic quantities and their units (IEC lead).' },
    { slug: 'iso-80000-16', part: 16, title: 'Printing and writing rules',       edition_year: null, status: 'under development', stage: '30.60', scope: 'Printing and writing rules for quantities and units (IEC lead).' },
    { slug: 'iso-80000-17', part: 17, title: 'Time dependency',                  edition_year: null, status: 'under development', stage: '30.00', scope: 'Time dependency of quantities (IEC lead).' },
  ]
}

function loadGroups() {
  return [
    { id: 'wg21',  name: 'WG 21',  scope: 'General — revision of ISO 80000-1',                     status: 'active',        convenor: 'Prof. Leslie Pendrill',    established: '2020-01-31', disbanded: null,        href: '/groups/wg21/' },
    { id: 'jwg2',  name: 'JWG 2',  scope: 'Joint with IEC/TC 25 — revision of IEC parts of ISO/IEC 80000 series', status: 'transition',    convenor: 'Prof. Göran Grimvall (stepping down)', established: '2018', disbanded: null, href: '/groups/jwg2/' },
    { id: 'wg19',  name: 'WG 19',  scope: 'Revision of the ISO 80000 series',                      status: 'disbanded',     convenor: 'Dr Michael Krystek',       established: '2013-08-20', disbanded: '2018-10-08', href: '/groups/wg19/' },
    { id: 'wg13',  name: 'WG 13',  scope: 'Earlier working group',                                 status: 'disbanded',     convenor: '—',                        established: null,         disbanded: '2012-10-24', href: '/groups/wg13/' },
    { id: 'jwg20', name: 'JWG 20', scope: 'Quantities and units in e-health (joint with ISO/TC 215, IEC/TC 25)', status: 'disbanded', convenor: 'Mr Stéphane Cullati', established: '2014', disbanded: '2016-08-25', href: '/groups/jwg20/' },
  ]
}

function loadLiaisons() {
  return {
    from_tc12: [
      { ref: 'CIE',                title: 'International Commission on Illumination',           representative: 'Dr Torgny Carlsson' },
      { ref: 'IEC/TC 1',           title: 'Terminology',                                        representative: 'Secretariat' },
      { ref: 'IEC/TC 25',          title: 'Quantities and units',                               representative: 'Dr Olivier Pellegrino' },
      { ref: 'ISO/IEC JTC 1/SC 32', title: 'Data management and interchange',                    representative: 'Prof. Leslie Pendrill' },
      { ref: 'ISO/TC 37',          title: 'Language and terminology',                           representative: 'Prof. Leslie Pendrill' },
      { ref: 'ISO/TC 43',          title: 'Acoustics',                                          representative: 'Dr Christopher J. Struck' },
      { ref: 'ISO/TC 43/SC 1',     title: 'Noise',                                              representative: 'Dr Christopher J. Struck' },
      { ref: 'ISO/TC 43/SC 3',     title: 'Underwater acoustics',                               representative: 'Secretariat (DIN)' },
      { ref: 'ISO/TC 69',          title: 'Applications of statistical methods',                representative: 'Dr Liu Zilong (SAC)' },
      { ref: 'ISO/TC 85',          title: 'Nuclear energy, nuclear technologies, and radiological protection', representative: 'Dr Li Dehong (SAC)' },
      { ref: 'ISO/TC 215',         title: 'Health informatics',                                 representative: 'Prof. Leslie Pendrill' },
      { ref: 'ISO/IEC JTC 3',      title: 'Quantum technology',                                 representative: 'TBD (liaison under CIB)', status: 'proposed' },
    ],
    external: [
      { ref: 'BIPM',        title: 'Bureau International des Poids et Mesures',         representative: 'via SI Brochure' },
      { ref: 'JCGM',        title: 'Joint Committee for Guides in Metrology (VIM, GUM)', representative: 'Dr Torgny Carlsson (WG 1 GUM); Dr Carl-Wilhelm Schwob (WG 2 VIM)' },
      { ref: 'CalConnect',  title: 'The Calendaring and Scheduling Consortium',          representative: 'Mr Michael Douglass, Mr Janssen Gershon, Mr Ronald Tse', liaison_type: 'A' },
      { ref: 'IMU',         title: 'International Mathematical Union',                   representative: 'Prof Helge Holden', liaison_type: 'A (pending ISO/CS confirmation)' },
      { ref: 'IUCr',        title: 'International Union of Crystallography',             representative: 'TBD' },
      { ref: 'OIML',        title: 'International Organization of Legal Metrology',      representative: 'Secretariat' },
      { ref: 'IUPAP',       title: 'International Union of Pure and Applied Physics',    representative: 'TBD' },
    ],
  }
}

function loadNationalBodies() {
  const p = [
    { code: 'AT', body: 'ASI',        name: 'Austria' },
    { code: 'BY', body: 'BELST',      name: 'Belarus' },
    { code: 'CN', body: 'SAC',        name: 'China' },
    { code: 'CZ', body: 'UNMZ',       name: 'Czech Republic' },
    { code: 'EG', body: 'EOS',        name: 'Egypt' },
    { code: 'FI', body: 'SFS',        name: 'Finland' },
    { code: 'FR', body: 'AFNOR',      name: 'France' },
    { code: 'DE', body: 'DIN',        name: 'Germany' },
    { code: 'IN', body: 'BIS',        name: 'India' },
    { code: 'IT', body: 'UNI',        name: 'Italy' },
    { code: 'JP', body: 'JISC',       name: 'Japan' },
    { code: 'KW', body: 'KOWSMD',     name: 'Kuwait' },
    { code: 'MU', body: 'MSB',        name: 'Mauritius' },
    { code: 'PT', body: 'IPQ',        name: 'Portugal' },
    { code: 'RU', body: 'GOST R',     name: 'Russian Federation' },
    { code: 'ES', body: 'UNE',        name: 'Spain' },
    { code: 'SE', body: 'SIS',        name: 'Sweden' },
    { code: 'CH', body: 'SNV',        name: 'Switzerland' },
    { code: 'GB', body: 'BSI',        name: 'United Kingdom' },
    { code: 'US', body: 'ANSI',       name: 'United States' },
    { code: 'UZ', body: 'O\'ZTTSA',   name: 'Uzbekistan' },
  ]
  return { participating: p, p_count: p.length }
}

function loadLeadership() {
  return [
    { role: 'Chair', name: 'Dr Torgny Carlsson', affiliation: 'Chalmers University of Technology', term: 'until end 2027' },
    { role: 'Committee Manager', name: 'Ms Rebecca Cederholm', affiliation: 'SIS — Swedish Standards Institute', term: 'since 2024' },
    { role: 'Secretariat Support', name: 'Ms Anette Lindor Norén', affiliation: 'SIS', term: '' },
    { role: 'Secretariat Support', name: 'Mr Jörgen Wyke', affiliation: 'SIS', term: 'since 2024' },
    { role: 'ISO Technical Programme Manager', name: 'Ms Mercè Ferrés Hernández', affiliation: 'ISO Central Secretariat', term: '' },
    { role: 'ISO Editorial Manager', name: 'Mr Vincenzo Bazzucchi', affiliation: 'ISO Central Secretariat', term: '' },
  ]
}

console.log('[build-data] reading _data/, writing public/data/')
fs.mkdirSync(OUT_DIR, { recursive: true })

const events = loadPlenaryEvents()
const { plenaryMeetings, ballotYears } = loadResolutionsSubmodule()
const standards = loadStandards()
const groups = loadGroups()
const liaisons = loadLiaisons()
const national_bodies = loadNationalBodies()
const leadership = loadLeadership()

const latestPlenary = events[0]
const nextPlenary = events.find((e) => e.status === 'upcoming') || events.find((e) => e.next_plenary != null)

const allDecisions = Object.entries(plenaryMeetings).flatMap(([n, m]) =>
  m.decisions.map((d) => ({ ...d, source: `plenary-${n}`, meeting_ordinal: parseInt(n), meeting_date: m.date }))
).concat(
  Object.entries(ballotYears).flatMap(([id, b]) =>
    b.decisions.map((d) => ({ ...d, source: id }))
  )
)

writeJson('meta.json', {
  generated_at: new Date().toISOString(),
  counts: {
    plenaries: events.length,
    standards: standards.length,
    decisions: allDecisions.length,
    p_members: national_bodies.p_count,
    working_groups: groups.filter((g) => g.status === 'active' || g.status === 'transition').length,
    active_liaisons: liaisons.from_tc12.length + liaisons.external.length,
  },
  latest_plenary: latestPlenary && {
    id: latestPlenary.id,
    ordinal: latestPlenary.ordinal,
    date: latestPlenary.time?.from?.date,
    title: latestPlenary.title,
    general_area: latestPlenary.general_area,
    landing_url: latestPlenary.landing_url,
    decision_count: plenaryMeetings[latestPlenary.ordinal]?.decision_count,
  },
  next_plenary: nextPlenary?.next_plenary,
})

writeJson('events.json', events)
writeJson('resolutions.json', {
  plenary: Object.entries(plenaryMeetings).map(([n, m]) => ({
    ordinal: parseInt(n),
    ...m,
  })).sort((a, b) => b.ordinal - a.ordinal),
  ballots: Object.values(ballotYears),
})
writeJson('standards.json', standards)
writeJson('groups.json', groups)
writeJson('liaisons.json', liaisons)
writeJson('national_bodies.json', national_bodies)
writeJson('leadership.json', leadership)

console.log('[build-data] done.')
