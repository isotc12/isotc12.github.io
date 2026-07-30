# isotc12.github.io

Website for **ISO/TC 12 — Quantities and Units**.

Built with Astro 7, Tailwind v4, Vue 3, AsciiDoctor, and the [`@edoxen/browser`](https://github.com/edoxen/edoxen) integration for meetings/decisions. The architecture mirrors the sibling [ISO/TC 154 site](https://www.isotc154.org).

## Status

Scaffold only. Pages, data, and content extraction from the historic corpus are pending — see [`../CLAUDE.md`](../CLAUDE.md) for the full plan.

## Quick start

```sh
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # → dist/
pnpm check        # type-check
```

Requires Node ≥ 22.18 and pnpm 11.12.

## Layout

```
src/
  pages/         Astro routes (index, 404, …)
  layouts/       BaseLayout, AsciiDocLayout
  components/    Astro components
  islands/       Vue 3 interactive islands
  data/          TS data (committee metadata, navigation)
  styles/        Tailwind v4 + custom CSS
_data/
  events/        Plenary-meeting YAML (one file per meeting)
  members/       Member YAML (one file per member)
  groups/        Working-group YAML
  standards/     Standards catalogue YAML
  resolutions/   Placeholder for the resolutions-data submodule
content/         AsciiDoc narrative content
scripts/         Build-data scripts (planned)
public/          Static assets
```

See [`../CLAUDE.md`](../CLAUDE.md) for the data model, extraction plan, and TC 12-specific conventions.
