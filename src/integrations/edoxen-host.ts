import type { AstroIntegration } from 'astro'
import browserDefault from '@edoxen/browser/integration'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const edoxenRoot = dirname(require.resolve('@edoxen/browser/package.json'))
const pagesRootDir = resolve(edoxenRoot, 'src/astro/pages')

const routes: Array<[string, string]> = [
  ['/decisions', 'decisions/index.astro'],
  ['/decisions/[urn]', 'decisions/[urn].astro'],
  ['/meetings', 'meetings/index.astro'],
  ['/meetings/[urn]', 'meetings/[urn].astro'],
]

export default function edoxenHost(config: unknown): AstroIntegration {
  const underlying = browserDefault({ config, injectRoutes: false })

  return {
    name: 'edoxen-host',
    hooks: {
      ...underlying.hooks,
      'astro:config:setup': async (ctx) => {
        await underlying.hooks['astro:config:setup']?.(ctx as never)
        for (const [pattern, file] of routes) {
          ctx.injectRoute({
            pattern,
            entrypoint: pathToFileURL(resolve(pagesRootDir, file)),
          })
        }
      },
    },
  }
}
