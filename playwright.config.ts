import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  // Routes are code-split (Phase 7) and served unbundled by the Vite dev
  // server, so a lazy route's first visit under parallel workers can take
  // longer than the 30s default, especially for the longer scoring/import
  // flows below. The production build has no such latency (confirmed via
  // `npm run build`); this only compensates for dev-server test runs.
  // Firefox/WebKit are slower than Chromium for this app's heavy DOM/Radix
  // interaction under parallel load (confirmed passing well within time
  // when run single-threaded), so the long end-to-end specs need headroom
  // on every engine, not just Chromium.
  timeout: 60_000,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
