import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['scripts/lib/**/*.spec.mjs', 'src/islands/**/*.spec.ts'],
    environment: 'node',
  },
})
