import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC_RES = path.join(ROOT, '_data/resolutions')
const SRC_EVT = path.join(ROOT, '_data/events')
const STAGE_R = path.join(ROOT, '_data/resolutions-edoxen')
const STAGE_E = path.join(ROOT, '_data/events-edoxen')

const RES_SUBDIRS = ['plenary', 'ballots']

fs.rmSync(STAGE_R, { recursive: true, force: true })
fs.rmSync(STAGE_E, { recursive: true, force: true })
fs.mkdirSync(STAGE_R, { recursive: true })
fs.mkdirSync(STAGE_E, { recursive: true })

// --- Decisions: pass through unchanged ---
let rCount = 0
for (const sub of RES_SUBDIRS) {
  const srcDir = path.join(SRC_RES, sub)
  if (!fs.existsSync(srcDir)) {
    console.warn(`[prepare-edoxen-data] skip ${sub}/ (missing)`)
    continue
  }
  for (const f of fs.readdirSync(srcDir).filter((f) => f.endsWith('.yaml'))) {
    const src = path.join(srcDir, f)
    const dst = path.join(STAGE_R, f)
    try { fs.linkSync(src, dst) } catch { fs.copyFileSync(src, dst) }
    rCount++
  }
}
console.log(`[prepare-edoxen-data] resolutions → ${rCount} YAML files (flat, unchanged)`)

// --- Meetings: transform site event YAML into edoxen Meeting format ---
// Site events use a TC 154-style shape (time/host/attendance/etc) which
// doesn't conform to the edoxen Meeting schema. Transform each into a
// minimal edoxen Meeting record so /meetings/[urn] works.
let eCount = 0
let warnCount = 0
if (fs.existsSync(SRC_EVT)) {
  for (const f of fs.readdirSync(SRC_EVT).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))) {
    const src = path.join(SRC_EVT, f)
    const raw = fs.readFileSync(src, 'utf-8')
    const parts = raw.split(/^---\s*$/m).filter(Boolean)
    const body = parts.length > 1 ? parts[1] : parts[0]
    let evt
    try { evt = yaml.load(body) } catch (e) {
      console.warn(`[prepare-edoxen-data] skip ${f}: YAML parse error`)
      warnCount++
      continue
    }
    if (!evt || !evt.ordinal) continue

    const ordinal = evt.ordinal
    // js-yaml parses bare dates into Date objects; force plain YYYY-MM-DD strings.
    const toDateStr = (d) => {
      if (!d) return null
      if (typeof d === 'string') return d.slice(0, 10)
      if (d instanceof Date) return d.toISOString().slice(0, 10)
      return String(d).slice(0, 10)
    }
    const dateFrom = toDateStr(evt.time?.from?.date)
    const dateTo = toDateStr(evt.time?.to?.date)

    const meeting = {
      identifier: [{ prefix: 'ISO/TC 12', number: `plenary-${ordinal}` }],
      urn: `urn:iso:tc12:meeting:plenary-${ordinal}`,
      ordinal,
      type: 'plenary',
      status: evt.status === 'upcoming' ? 'scheduled' : 'completed',
      title: [{ spelling: 'eng', value: evt.title || `${ordinal} plenary meeting` }],
      ...(dateFrom && {
        scheduled_date_range: { start: dateFrom, end: dateTo || dateFrom },
      }),
      ...(evt.general_area && {
        general_area: [{ spelling: 'eng', value: evt.general_area }],
      }),
      ...(evt.country_code && { country_code: evt.country_code }),
      ...(evt.landing_url && { landing_url: evt.landing_url }),
    }

    // Wrap in MeetingCollection — the validator's oneOf matches the
    // Collection form most reliably.
    const collection = {
      metadata: {
        title: [{ spelling: 'eng', value: `ISO/TC 12 plenary ${ordinal}` }],
      },
      meetings: [meeting],
    }

    const out = path.join(STAGE_E, `plenary-${ordinal}.yaml`)
    fs.writeFileSync(out, yaml.dump(collection, { lineWidth: -1, noRefs: true }))
    eCount++
  }
}
console.log(`[prepare-edoxen-data] events → ${eCount} edoxen Meeting files (transformed)${warnCount ? `, ${warnCount} skipped` : ''}`)
