// The e2e suite: the built app (`npm run build` first; CI downloads the build job's artifact) served like GitHub Pages
// (scripts/serve-build.ts), on a phone viewport. CI installs Playwright's Chromium; locally it uses the installed Google
// Chrome. `npm run e2e`.
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 4173);
const BASE = process.env.BASE_PATH ?? '/fitness';

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list'], ['json', { outputFile: 'playwright-results.json' }]] : 'list',
  use: {
    ...devices['iPhone 13'],
    browserName: 'chromium',
    channel: process.env.CI ? undefined : 'chrome',
    // the tent's room is WebGL: headless Chromium draws it in software (SwiftShader)
    launchOptions: { args: ['--enable-unsafe-swiftshader'] },
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
