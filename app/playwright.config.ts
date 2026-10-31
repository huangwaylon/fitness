// The demo smoke test: the built app (`npm run build` first) under `vite preview`, on a phone viewport.
// CI installs Playwright's Chromium; locally it uses the installed Google Chrome. `npm run e2e`.
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const BASE = process.env.BASE_PATH ?? '/fitness';

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    ...devices['iPhone 13'],
    browserName: 'chromium',
    channel: process.env.CI ? undefined : 'chrome',
    baseURL: `http://127.0.0.1:${PORT}${BASE}/`,
    serviceWorkers: 'block', // every test starts from the network build, not a cached shell
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo'
  },
  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}${BASE}/`,
    reuseExistingServer: !process.env.CI
  }
});
