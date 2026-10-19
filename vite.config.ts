import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { defineConfig as defineVitestConfig, mergeConfig } from 'vitest/config'

// https://vite.dev/config/
const viteConfig = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  // Sourcemaps no build de produção — o Lighthouse (Best Practices) espera
  // source maps válidos para o JS first-party.
  build: {
    sourcemap: true,
  },
})

const vitestConfig = defineVitestConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['tests/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
  },
})

export default mergeConfig(viteConfig, vitestConfig)
