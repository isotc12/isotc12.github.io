import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import vue from '@astrojs/vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: 'https://isotc12.github.io',
  integrations: [vue(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
})
