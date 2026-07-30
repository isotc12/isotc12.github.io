import { defineConfig } from '@edoxen/browser/config'

// Scoped integration: @edoxen/browser owns /meetings/ and /decisions/ only.
// Theme colors aligned with the main TC 12 site palette (wine + calibration
// teal on warm paper) so the decision browser doesn't feel like a separate
// site.
export default defineConfig({
  site: {
    title: 'ISO/TC 12 — Meetings & Decisions',
    description: 'Plenary meetings and decisions of ISO/TC 12 (Quantities and Units).',
    url: 'https://isotc12.github.io/',
  },
  data: {
    decisions: '_data/resolutions-edoxen',
    meetings: '_data/events-edoxen',
  },
  theme: {
    primary: '#7b1e3a',
    accent: '#0e6b5c',
    surface: '#f7f4ed',
  },
  features: {
    search: true,
    timeline: true,
    urnCopy: true,
    doi: true,
    darkMode: true,
    printStyles: true,
  },
})
