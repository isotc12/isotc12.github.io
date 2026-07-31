#!/usr/bin/env node
// Parse the ISO/TC 12 members list export into structured YAML files.
// Ignores: Centralized document monitor, Document monitor.
// Deduplicates entries.
// Outputs:
//   _data/members/{slug}.yaml  — one file per unique person
//   _data/national_bodies.yml — all NSBs with member-type
//   _data/liaisons_internal.yml — ISO/IEC committee liaisons
//   _data/liaisons_external.yml — external organization liaisons

import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

const ROOT = path.resolve(import.meta.dirname, '..')
const INPUT = path.join(ROOT, '..', '20270731-isotc12-members-list.txt')
const MEMBERS_DIR = path.join(ROOT, '_data', 'members')
const OUT_NB = path.join(ROOT, '_data', 'national_bodies.yml')
const OUT_LI = path.join(ROOT, '_data', 'liaisons_internal.yml')
const OUT_LE = path.join(ROOT, '_data', 'liaisons_external.yml')

fs.mkdirSync(MEMBERS_DIR, { recursive: true })

const raw = fs.readFileSync(INPUT, 'utf-8')
const lines = raw.split('\n').filter(l => l.trim())

// Skip header rows (lines that are exactly: Role / Appointed by / Salutation / etc.)
const HEADER_TOKENS = new Set(['Role', 'Appointed by', 'Salutation', 'Last name, First name', 'E-mail'])

// Parse rows: groups of 5 consecutive lines (role, appointed_by, salutation, name, email)
// But the file isn't strictly 5-line blocks — some entries span differently.
// Strategy: parse line-by-line, detecting role patterns as anchors.
const ROLE_PATTERNS = [
  /^Committee manager$/,
  /^Chairperson$/,
  /^Committee manager support team$/,
  /^Committee member$/,
  /^Technical programme manager$/,
  /^Liaison representative \(organizations\)$/,
  /^Liaison representative \(committees\)$/,
  /^Liaison representative \(IEC secretary\)$/,
  /^Liaison representative \(Committee manager\)$/,
  /^Liaison representative \(Committee manager support team\)$/,
]

const IGNORE_PATTERNS = [
  /Centralized document monitor/,
  /Document monitor/,
]

function slugify(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseMembers(raw) {
  const people = []
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    // Skip header rows
    if (HEADER_TOKENS.has(line)) { i++; continue }
    // Check if this line is a role
    const isRole = ROLE_PATTERNS.some(p => p.test(line))
    const isIgnored = IGNORE_PATTERNS.some(p => p.test(line))
    if (isIgnored) { i++; continue }
    if (!isRole) { i++; continue }

    // Found a role anchor — next 4 lines should be: appointed_by, salutation, name, email
    const role = line
    const appointedBy = lines[i + 1] || ''
    const salutation = lines[i + 2] || ''
    const name = lines[i + 3] || ''
    const email = lines[i + 4] || ''

    // Validate: name should not be a role pattern or header
    if (ROLE_PATTERNS.some(p => p.test(name)) || HEADER_TOKENS.has(name)) {
      i++
      continue
    }
    // Email should contain @ or be empty
    if (email && !email.includes('@') && !email.includes('.')) {
      // Maybe the block is misaligned — skip
      i++
      continue
    }

    people.push({ role, appointedBy, salutation, name, email: email || '' })
    i += 5
  }
  return people
}

function deduplicate(people) {
  const seen = new Set()
  return people.filter(p => {
    const key = `${p.name}|${p.role}|${p.appointedBy}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// Normalize roles to clean categories
function normalizeRole(role) {
  if (/Chairperson/.test(role)) return 'chair'
  if (/^Committee manager$/.test(role)) return 'committee_manager'
  if (/support team/.test(role)) return 'secretariat_support'
  if (/Technical programme manager/.test(role)) return 'tpm'
  if (/^Committee member$/.test(role)) return 'member'
  if (/Liaison representative/.test(role)) return 'liaison_representative'
  return 'other'
}

// Parse appointed_by to extract NSB code and member type
function parseAppointedBy(s) {
  // Patterns: "DIN (P-member)", "ASRO (O-member)", "SIS", "BIPM (A-liaison)", "ISO/TC 43"
  const nsbMatch = s.match(/^([A-Z][A-Z\s\/\d-]+)\s*\((P-member|O-member)\)$/)
  if (nsbMatch) return { type: 'nsb', body: nsbMatch[1].trim(), memberType: nsbMatch[2] }
  const liaisonMatch = s.match(/^(.+?)\s*\((A-liaison|B-liaison|C-liaison|D-liaison)\)$/)
  if (liaisonMatch) return { type: 'external_org', body: liaisonMatch[1].trim(), liaisonType: liaisonMatch[2] }
  if (/^ISO$/.test(s)) return { type: 'iso', body: 'ISO' }
  if (/^SIS$/.test(s)) return { type: 'sis', body: 'SIS' }
  if (/^(ISO|IEC)\//.test(s)) return { type: 'committee', body: s }
  return { type: 'other', body: s }
}

const rawPeople = parseMembers(raw)
const people = deduplicate(rawPeople)

console.log(`Parsed ${rawPeople.length} entries, ${people.length} unique`)

// Build member YAML files
const memberMap = new Map() // slug -> data
for (const p of people) {
  const norm = normalizeRole(p.role)
  const ab = parseAppointedBy(p.appointedBy)
  const slug = slugify(p.name)
  if (!slug || slug === '-') continue

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
  if (p.email && !m.email) m.email = p.email

  const roleRecord = { id: norm }
  if (ab.type === 'nsb') {
    roleRecord.group = ab.body.toLowerCase().replace(/\s+/g, '-')
    roleRecord.nsbody = ab.body
    roleRecord.member_type = ab.memberType
  } else if (ab.type === 'external_org') {
    roleRecord.organization = ab.body
    roleRecord.liaison_type = ab.liaisonType
  } else if (ab.type === 'committee') {
    roleRecord.committee = ab.body
  } else if (ab.type === 'sis') {
    roleRecord.organization = 'SIS'
  } else if (ab.type === 'iso') {
    roleRecord.organization = 'ISO'
  }

  // Avoid duplicate role records
  const exists = m.roles.some(r =>
    r.id === roleRecord.id &&
    r.nsbody === roleRecord.nsbody &&
    r.organization === roleRecord.organization &&
    r.committee === roleRecord.committee
  )
  if (!exists) m.roles.push(roleRecord)
}

// Write member YAML files
let memberCount = 0
for (const [slug, m] of memberMap) {
  const out = path.join(MEMBERS_DIR, `${slug}.yaml`)
  fs.writeFileSync(out, yaml.dump(m, { lineWidth: -1, noRefs: true }))
  memberCount++
}
console.log(`Wrote ${memberCount} member files to _data/members/`)

// Build national_bodies.yml — all unique NSBs from committee members
const nsbMap = new Map()
for (const p of people) {
  if (normalizeRole(p.role) !== 'member') continue
  const ab = parseAppointedBy(p.appointedBy)
  if (ab.type !== 'nsb') continue
  if (!nsbMap.has(ab.body)) {
    nsbMap.set(ab.body, { body: ab.body, member_type: ab.memberType })
  }
}
const countryMap = {
  ASI: 'AT', AFNOR: 'FR', ANSI: 'US', ASRO: 'RO', BDS: 'BG', BELST: 'BY',
  BIS: 'IN', BSI: 'GB', DIN: 'DE', DS: 'DK', EOS: 'EG', EVS: 'EE',
  GOST: 'RU', HZN: 'HR', ICONTEC: 'CO', IES: 'ET', INSO: 'IR', IPQ: 'PT',
  ISBIH: 'BA', ISS: 'RS', ITCHKSAR: 'HK', JISC: 'JP', KATS: 'KR',
  KOWSMD: 'KW', MoIAT: 'AE', MSB: 'MU', MSZT: 'HU', NBN: 'BE', NC: 'CU',
  NEN: 'NL', PKN: 'PL', PSQCA: 'PK', SAC: 'CN', SFS: 'FI', SIS: 'SE',
  SLSI: 'LK', SNV: 'CH', STAMEQ: 'VN', TISI: 'TH', TSE: 'TR', UNE: 'ES',
  UNI: 'IT', UNMZ: 'CZ', UNMS: 'SK',
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
}
const nsbList = Array.from(nsbMap.values())
  .map(n => ({
    body: n.body,
    code: countryMap[n.body] || '',
    name: countryName[countryMap[n.body]] || n.body,
    member_type: n.member_type,
  }))
  .sort((a, b) => (a.name || a.body).localeCompare(b.name || b.body))

fs.writeFileSync(OUT_NB, yaml.dump({ participating: nsbList.filter(n => n.member_type === 'P-member'), observing: nsbList.filter(n => n.member_type === 'O-member') }, { lineWidth: -1 }))
console.log(`Wrote national_bodies.yml: ${nsbList.filter(n => n.member_type === 'P-member').length} P-members, ${nsbList.filter(n => n.member_type === 'O-member').length} O-members`)

// Build liaisons_internal.yml — ISO/IEC committee liaisons
const committeeSet = new Map()
for (const p of people) {
  if (normalizeRole(p.role) !== 'liaison_representative') continue
  const ab = parseAppointedBy(p.appointedBy)
  if (ab.type !== 'committee') continue
  if (!committeeSet.has(ab.body)) committeeSet.set(ab.body, { ref: ab.body, representatives: [] })
  committeeSet.get(ab.body).representatives.push(p.name)
}
// Deduplicate reps
for (const [k, v] of committeeSet) {
  v.representatives = [...new Set(v.representatives)]
}
const committeeList = Array.from(committeeSet.values()).sort((a, b) => a.ref.localeCompare(b.ref))
fs.writeFileSync(OUT_LI, yaml.dump(committeeList, { lineWidth: -1 }))
console.log(`Wrote liaisons_internal.yml: ${committeeList.length} ISO/IEC committees`)

// Build liaisons_external.yml — external organization liaisons
const orgSet = new Map()
for (const p of people) {
  if (normalizeRole(p.role) !== 'liaison_representative') continue
  const ab = parseAppointedBy(p.appointedBy)
  if (ab.type !== 'external_org') continue
  if (!orgSet.has(ab.body)) orgSet.set(ab.body, { ref: ab.body, liaison_type: ab.liaisonType, representatives: [] })
  orgSet.get(ab.body).representatives.push(p.name)
}
for (const [k, v] of orgSet) {
  v.representatives = [...new Set(v.representatives)]
}
const orgList = Array.from(orgSet.values()).sort((a, b) => a.ref.localeCompare(b.ref))
fs.writeFileSync(OUT_LE, yaml.dump(orgList, { lineWidth: -1 }))
console.log(`Wrote liaisons_external.yml: ${orgList.length} external organizations`)

console.log('Done.')
