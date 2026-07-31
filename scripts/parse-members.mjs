#!/usr/bin/env node
// Parse the ISO/TC 12 members list export into structured YAML files.
// IGNORES: "Centralized document monitor", "Document monitor".
// Deduplicates entries.
//
// Role classification fix: "Liaison representative (...)" lines are ALWAYS
// liaisons regardless of their internal role in the other committee.
// Only "Committee manager / support team / Chairperson / Committee member /
// Technical programme manager" lines are TC 12's own roles.
//
// Outputs:
//   _data/members/{slug}.yaml       — one per person (NO email)
//   _data/liaisons.yml              — single list of external orgs + ISO/IEC committees
//   _data/national_bodies.yml       — NSBs as a single list

import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

const ROOT = path.resolve(import.meta.dirname, '..')
const INPUT = path.join(ROOT, '..', '20270731-isotc12-members-list.txt')
const MEMBERS_DIR = path.join(ROOT, '_data', 'members')
const OUT_LIAISONS = path.join(ROOT, '_data', 'liaisons.yml')
const OUT_NB = path.join(ROOT, '_data', 'national_bodies.yml')

fs.mkdirSync(MEMBERS_DIR, { recursive: true })

const raw = fs.readFileSync(INPUT, 'utf-8')
const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)

const HEADER_TOKENS = new Set(['Role', 'Appointed by', 'Salutation', 'Last name, First name', 'E-mail'])

const ROLE_TC12_INTERNAL = new Set([
  'Chairperson',
  'Committee manager',
  'Committee manager support team',
  'Technical programme manager',
])

const ROLE_LIAISON = /^Liaison representative \(/
const ROLE_MEMBER = 'Committee member'

const IGNORE = /Centralized document monitor|Document monitor/

function slugify(name) {
  // Name is "Lastname, Firstname" — convert to "firstname-lastname"
  const parts = name.split(',').map(s => s.trim())
  const reordered = parts.length > 1 ? `${parts[1]} ${parts[0]}` : parts[0]
  return reordered.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseMembers(text) {
  const out = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (HEADER_TOKENS.has(line)) { i++; continue }
    if (IGNORE.test(line)) { i++; continue }

    const isLiaison = ROLE_LIAISON.test(line)
    const isTC12Role = ROLE_TC12_INTERNAL.has(line)
    const isMember = line === ROLE_MEMBER
    if (!isLiaison && !isTC12Role && !isMember) { i++; continue }

    const role = line
    const appointedBy = lines[i + 1] || ''
    const salutation = lines[i + 2] || ''
    const name = lines[i + 3] || ''
    const email = lines[i + 4] || ''

    if (HEADER_TOKENS.has(name) || (!email.includes('@') && email && !email.includes('.'))) {
      i++; continue
    }

    out.push({ role, roleKind: isLiaison ? 'liaison' : (isTC12Role ? 'tc12' : 'member'), appointedBy, salutation, name, email: email || '' })
    i += 5
  }
  return out
}

function dedup(people) {
  const seen = new Set()
  return people.filter(p => {
    const key = `${p.name}|${p.role}|${p.appointedBy}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function parseAppointedBy(s) {
  const nsb = s.match(/^([A-Z][A-Z\s\/\d-]+?)\s*\((P-member|O-member)\)$/)
  if (nsb) return { kind: 'nsb', body: nsb[1].trim(), member_type: nsb[2] }
  const ext = s.match(/^(.+?)\s*\((A-liaison|B-liaison|C-liaison|D-liaison)\)$/)
  if (ext) return { kind: 'external_org', body: ext[1].trim(), liaison_type: ext[2] }
  if (/^(ISO|IEC)\//.test(s)) return { kind: 'committee', body: s }
  if (s === 'SIS') return { kind: 'sis', body: 'SIS' }
  if (s === 'ISO') return { kind: 'iso', body: 'ISO' }
  return { kind: 'unknown', body: s }
}

const countryMap = {
  ASI: 'AT', AFNOR: 'FR', ANSI: 'US', ASRO: 'RO', BDS: 'BG', BELST: 'BY',
  BIS: 'IN', BSI: 'GB', DIN: 'DE', DS: 'DK', EOS: 'EG', EVS: 'EE',
  GOST: 'RU', HZN: 'HR', ICONTEC: 'CO', IES: 'ET', INSO: 'IR', IPQ: 'PT',
  ISBIH: 'BA', ISS: 'RS', ITCHKSAR: 'HK', JISC: 'JP', KATS: 'KR',
  KOWSMD: 'KW', 'MoIAT-SAS': 'AE', MSB: 'MU', MSZT: 'HU', NBN: 'BE', NC: 'CU',
  NEN: 'NL', PKN: 'PL', PSQCA: 'PK', SAC: 'CN', SFS: 'FI', SIS: 'SE',
  SLSI: 'LK', SNV: 'CH', STAMEQ: 'VN', TISI: 'TH', TSE: 'TR', UNE: 'ES',
  UNI: 'IT', UNMZ: 'CZ', UNMS: 'SK', ELOT: 'GR', BSN: 'ID', CSK: 'KP',
  QS: 'QA', INN: 'CL',
}
const countryName = {
  AT: 'Austria', FR: 'France', US: 'United States', RO: 'Romania', BG: 'Bulgaria',
  BY: 'Belarus', IN: 'India', GB: 'United Kingdom', DE: 'Germany', DK: 'Denmark',
  EG: 'Egypt', EE: 'Estonia', RU: 'Russian Federation', HR: 'Croatia', CO: 'Colombia',
  ET: 'Ethiopia', IR: 'Iran', PT: 'Portugal', BA: 'Bosnia and Herzegovina',
  RS: 'Serbia', HK: 'Hong Kong', JP: 'Japan', KR: 'Korea, Republic of', KW: 'Kuwait',
  AE: 'United Arab Emirates', MU: 'Mauritius', HU: 'Hungary', BE: 'Belgium',
  CU: 'Cuba', NL: 'Netherlands', PL: 'Poland', PK: 'Pakistan', CN: 'China',
  FI: 'Finland', SE: 'Sweden', LK: 'Sri Lanka', CH: 'Switzerland', VN: 'Viet Nam',
  TH: 'Thailand', TR: 'Türkiye', ES: 'Spain', IT: 'Italy', CZ: 'Czech Republic',
  SK: 'Slovakia', QA: 'Qatar', KP: 'Korea, DPR of', GR: 'Greece', CL: 'Chile',
  ID: 'Indonesia',
}

const orgName = {
  BIPM: 'Bureau International des Poids et Mesures',
  CalConnect: 'The Calendaring and Scheduling Consortium',
  CIE: 'International Commission on Illumination',
  EURAMET: 'European Association of National Metrology Institutes',
  ICRU: 'International Commission on Radiation Units and Measurements',
  IMO: 'International Maritime Organization',
  IMU: 'International Mathematical Union',
  Infoterm: 'International Information Centre for Terminology',
  ITU: 'International Telecommunication Union',
  IUCr: 'International Union of Crystallography',
  IUPAP: 'International Union of Pure and Applied Physics',
  OASIS: 'Organization for the Advancement of Structured Information Standards',
  OIML: 'International Organization of Legal Metrology',
  UNECE: 'United Nations Economic Commission for Europe',
  WHO: 'World Health Organization',
  WMO: 'World Meteorological Organization',
  IUPAC: 'International Union of Pure and Applied Chemistry',
}

const people = dedup(parseMembers(raw))
console.log(`Parsed ${people.length} unique people`)

const memberMap = new Map()
for (const p of people) {
  const slug = slugify(p.name)
  if (!slug) continue
  if (!memberMap.has(slug)) {
    memberMap.set(slug, {
      'member-id': slug,
      name: p.name,
      active: true,
      roles: [],
    })
  }
  const m = memberMap.get(slug)
  if (p.salutation && p.salutation !== '-' && !m.salutation) m.salutation = p.salutation
  // NOTE: email intentionally NOT included

  const ab = parseAppointedBy(p.appointedBy)

  let roleId, roleExtra = {}
  if (p.roleKind === 'tc12') {
    if (p.role === 'Chairperson') roleId = 'chair'
    else if (p.role === 'Committee manager') roleId = 'committee_manager'
    else if (p.role === 'Committee manager support team') roleId = 'secretariat_support'
    else if (p.role === 'Technical programme manager') roleId = 'tpm'
  } else if (p.roleKind === 'liaison') {
    roleId = 'liaison_representative'
    if (ab.kind === 'external_org') {
      roleExtra = { organization: ab.body, liaison_type: ab.liaison_type }
    } else if (ab.kind === 'committee') {
      roleExtra = { committee: ab.body }
    } else if (ab.kind === 'sis') {
      roleExtra = { organization: 'SIS' }
    } else if (ab.kind === 'iso') {
      roleExtra = { organization: 'ISO' }
    }
  } else if (p.roleKind === 'member') {
    roleId = 'member'
    if (ab.kind === 'nsb') {
      roleExtra = { nsbody: ab.body, member_type: ab.member_type }
    } else if (ab.kind === 'committee') {
      roleExtra = { committee: ab.body }
    } else if (ab.kind === 'external_org') {
      roleExtra = { organization: ab.body, liaison_type: ab.liaison_type }
    }
  }

  if (!roleId) continue
  const exists = m.roles.some(r => r.id === roleId && JSON.stringify({ ...r, id: undefined }) === JSON.stringify({ ...roleExtra, id: undefined }))
  if (!exists) m.roles.push({ id: roleId, ...roleExtra })
}

let memberCount = 0
for (const [slug, m] of memberMap) {
  fs.writeFileSync(path.join(MEMBERS_DIR, `${slug}.yaml`), yaml.dump(m, { lineWidth: -1 }))
  memberCount++
}
console.log(`Wrote ${memberCount} member files (no emails)`)

const externalOrgs = new Map()
const committees = new Map()
for (const p of people) {
  if (p.roleKind !== 'liaison') continue
  const ab = parseAppointedBy(p.appointedBy)
  if (ab.kind === 'external_org') {
    if (!externalOrgs.has(ab.body)) {
      externalOrgs.set(ab.body, {
        id: ab.body.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        short_name: ab.body,
        name: orgName[ab.body] || ab.body,
        category: ab.liaison_type?.replace('-liaison', '').toUpperCase() || 'A',
        representatives: [],
      })
    }
    externalOrgs.get(ab.body).representatives.push(p.name)
  } else if (ab.kind === 'committee') {
    if (!committees.has(ab.body)) {
      committees.set(ab.body, { ref: ab.body, representatives: [] })
    }
    committees.get(ab.body).representatives.push(p.name)
  }
}
for (const v of externalOrgs.values()) v.representatives = [...new Set(v.representatives)]
for (const v of committees.values()) v.representatives = [...new Set(v.representatives)]

const liaisonsList = {
  external_organisations: Array.from(externalOrgs.values()).sort((a, b) => a.short_name.localeCompare(b.short_name)),
  iso_iec_committees: Array.from(committees.values()).sort((a, b) => a.ref.localeCompare(b.ref)),
}
fs.writeFileSync(OUT_LIAISONS, yaml.dump(liaisonsList, { lineWidth: -1 }))
console.log(`Wrote liaisons.yml: ${liaisonsList.external_organisations.length} external orgs, ${liaisonsList.iso_iec_committees.length} ISO/IEC committees`)

const nsbMap = new Map()
for (const p of people) {
  if (p.roleKind !== 'member') continue
  const ab = parseAppointedBy(p.appointedBy)
  if (ab.kind !== 'nsb') continue
  if (!nsbMap.has(ab.body)) {
    const code = countryMap[ab.body] || ''
    nsbMap.set(ab.body, {
      id: ab.body.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      short_name: ab.body,
      name: countryName[code] || ab.body,
      iso_country_code: code,
      country: countryName[code] || ab.body,
      membership: ab.member_type === 'P-member' ? 'P' : 'O',
      representatives: [],
    })
  }
  nsbMap.get(ab.body).representatives.push(p.name)
}
for (const v of nsbMap.values()) v.representatives = [...new Set(v.representatives)]

const nbList = Array.from(nsbMap.values()).sort((a, b) => (a.country || a.short_name).localeCompare(b.country || b.short_name))
const participating = nbList.filter(n => n.membership === 'P')
const observing = nbList.filter(n => n.membership === 'O')
fs.writeFileSync(OUT_NB, yaml.dump({ participating, observing }, { lineWidth: -1 }))
console.log(`Wrote national_bodies.yml: ${participating.length} P-members, ${observing.length} O-members`)
console.log('Done.')
