// The e2e suite: the built app (`npm run build` first; CI downloads the build job's artifact) served like GitHub Pages
// (scripts/serve-build.ts), in Playwright's WebKit as an iPhone 15 — the users' phones are an iPhone 15 and an iPhone 16 on
// Safari, and Playwright's two profiles have the same 393×659 viewport, so one project covers both. `npm run e2e`.
// Rules for stable specs: docs/ops/testing.md.
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 4173);
const BASE = process.env.BASE_PATH ?? '/fitness';

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  // No silent retries: CI reruns a failed spec in its own step and names it flaky in the job summary (pages.yml).
  retries: 0,
  fullyParallel: true,
  workers: process.env.CI ? 3 : undefined,
  reporter: process.env.CI ? [['github'], ['list'], ['json', { outputFile: 'playwright-results.json' }]] : 'list',
  projects: [
    { name: 'webkit', use: { ...devices['iPhone 15'] }, grepInvert: /@chromium/ },
    // What WebKit can't stage, tagged @chromium: stale.spec's deploy (its reload re-requests the very chunk URLs that
    // just failed, which WebKit's modulepreload never fetches again; a real new build has new URLs).
    {
      name: 'chromium',
      grep: /@chromium/,
      use: {
        ...devices['iPhone 15'],
        browserName: 'chromium',
        channel: process.env.CI ? undefined : 'chrome',
        // the tent's room is WebGL: headless Chromium draws it in software (SwiftShader)
        launchOptions: { args: ['--enable-unsafe-swiftshader'] }
      }
    }
  ],
  use: {
    baseURL: `http://127.0.0.1:${PORT}${BASE}/`,
    serviceWorkers: 'block', // every test starts from the network build, not a cached shell
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo'
  },
  webServer: {
    command: `node scripts/serve-build.ts ${PORT} ${BASE}`,
    url: `http://127.0.0.1:${PORT}${BASE}/`,
    reuseExistingServer: !process.env.CI
  }
});
