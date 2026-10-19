import { defineConfig, devices } from '@playwright/test'

/**
 * E2E com os mocks ativos (o dev server sobe com VITE_ENABLE_MOCKS=true via
 * .env). Cada teste roda em um contexto isolado (IndexedDB limpo → o mock db
 * parte do seed determinístico). Chromium em viewports desktop e mobile.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // E2E roda contra o build otimizado servido pelo `preview` (estático,
  // rápido e estável — sem a compilação sob demanda do dev server, que fica
  // lenta sob carga paralela). Os mocks vão no build (VITE_ENABLE_MOCKS=true).
  webServer: {
    command: 'pnpm build && pnpm preview --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } },
    },
  ],
})
