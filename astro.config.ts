import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import vue from '@astrojs/vue'
import tailwindcss from '@tailwindcss/vite'
import edoxenHost from './src/integrations/edoxen-host'
import cfg from './edoxen.config'

export default defineConfig({
  site: 'https://isotc12.github.io',
  integrations: [vue(), edoxenHost(cfg), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
})
