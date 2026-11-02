// The e2e suite: the built app (`npm run build` first; CI downloads the build job's artifact) served like GitHub Pages
// (scripts/serve-build.ts), in Playwright's WebKit as an iPhone 15 — the users' phones are an iPhone 15 and an iPhone 16 on
// Safari, and Playwright's two profiles have the same 393×659 viewport, so one project covers both — and in Chromium.
// `npm run e2e -- --project=webkit`.
// Rules for stable specs: docs/ops/testing.md.
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 4173);
const BASE = process.env.BASE_PATH ?? '/fitness';
// Each test's phone starts with these in localStorage:
// E2E_ISLAND=3d: the island drawn in 3D (せってい's switch: docs/ops/testing.md);
// E2E_RENDER=none: the logic mode, the 3D engines run every frame but draw nothing (src/lib/ui-state/testMode.ts,
// docs/ops/test-strategy.md): CI's software GL then costs nothing;
const local = [
  ...(process.env.E2E_ISLAND === '3d' ? [{ name: 'island.render', value: '3d' }] : []),
  ...(process.env.E2E_RENDER === 'none' ? [{ name: 'e2e.render', value: 'none' }] : []),
  // E2E_LAYOUT=1 (with E2E_ISLAND=3d): the 3D island on the editable layout, as at the cutover (island/site.svelte.ts)
  ...(process.env.E2E_LAYOUT ? [{ name: 'island.layout', value: 'on' }] : [])
];
const ISLAND = local.length ? { storageState: { cookies: [], origins: [{ origin: `http://127.0.0.1:${PORT}`, localStorage: local }] } } : {};

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  // No silent retries: CI reruns a failed spec in its own step and names it flaky in the job summary (pages.yml).
  retries: 0,
  fullyParallel: true,
  workers: process.env.CI ? 3 : undefined,
  reporter: process.env.CI ? [['github'], ['list'], ['json', { outputFile: 'playwright-results.json' }]] : 'list',
  projects: [
    // the users' browser (CI: on macOS, Safari's own WebKit; Linux's draws the island at ~1 frame a second)
    { name: 'webkit', use: { ...devices['iPhone 15'] }, grepInvert: /@chromium/ },
    // Chromium: the whole suite, gating the deploy until WebKit is green across the board (pages.yml); and what WebKit
    // can't stage, tagged @chromium: stale.spec's deploy (its reload re-requests the very chunk URLs that just failed,
    // which WebKit's modulepreload never fetches again; a real new build has new URLs).
    {
      name: 'chromium',
      use: {
        ...devices['iPhone 13'],
        browserName: 'chromium',
        channel: process.env.CI ? undefined : 'chrome',
        // the tent's room is WebGL: headless Chromium draws it in software (SwiftShader)
        // (E2E_SWIFTSHADER=1: software GL on a Mac too, as CI's Linux runners draw: a slow GPU's timing)
        launchOptions: { args: ['--enable-unsafe-swiftshader', ...(process.env.E2E_SWIFTSHADER ? ['--use-angle=swiftshader', '--use-gl=angle'] : [])] }
      }
    }
  ],
  use: {
    baseURL: `http://127.0.0.1:${PORT}${BASE}/`,
    serviceWorkers: 'block', // every test starts from the network build, not a cached shell
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
    ...ISLAND
  },
  webServer: {
    command: `node scripts/serve-build.ts ${PORT} ${BASE}`,
    url: `http://127.0.0.1:${PORT}${BASE}/`,
    reuseExistingServer: !process.env.CI
  }
});
