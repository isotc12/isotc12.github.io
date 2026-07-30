import { defineConfig } from '@edoxen/browser/config'

// Scoped integration: @edoxen/browser owns /meetings/ and /decisions/ only.
// Activated once `_data/resolutions-edoxen` and `_data/events-edoxen` exist
// (populated by scripts/prepare-edoxen-data.mjs from the resolutions-data
// and meetings-data submodules).
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
    primary: '#0f4c81',
    accent: '#1e6fb8',
    surface: '#ffffff',
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
