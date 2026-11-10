// The e2e suite: the built app (`npm run build` first; each CI shard builds the commit itself) served like Cloudflare
// Pages (scripts/serve-build.ts), in Playwright's WebKit as an iPhone 15 — the users' phones are an iPhone 15 and an iPhone 16 on
// Safari, and Playwright's two profiles have the same 393×659 viewport, so one project covers both — and in Chromium.
// `npm run e2e -- --project=webkit`.
// Rules for stable specs: docs/ops/testing.md. Specs import `test` from e2e/fixtures.ts: the scene clock pinned, no network
// outside the local preview (docs/ops/testing.md "Hermetic").
import { availableParallelism } from 'node:os';
import { defineConfig, devices, type Project } from '@playwright/test';

// Locally the preview is reused (reuseExistingServer), so each checkout gets its own port from its path: two worktrees on
// one port tested each other's build. E2E_PORT overrides; CI keeps 4173.
const ownPort = () => 4700 + [...import.meta.dirname].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 800;
const PORT = Number(process.env.E2E_PORT ?? (process.env.CI ? 4173 : ownPort()));
const BASE = process.env.BASE_PATH ?? '';
// Each test's phone starts with these in localStorage:
// E2E_RENDER=none: the logic mode, the 3D engines run every frame but draw nothing (src/lib/ui-state/testMode.ts,
// docs/ops/testing.md): CI's software GL then costs nothing
const local = process.env.E2E_RENDER === 'none' ? [{ name: 'e2e.render', value: 'none' }] : [];
const ISLAND = { storageState: { cookies: [], origins: [{ origin: `http://127.0.0.1:${PORT}`, localStorage: local }] } };

// E2E_SLOW=1 (the full tier: everything drawn under CI's software GL, a frame ~0.5 s): 3× the test's time, 2× an expect's
const SLOW = !!process.env.E2E_SLOW;
/** The mic's specs: their own project (chromium-mic), no other's. */
const MIC = /kikimimi-mic.*\.spec\.ts$/;
// E2E_X3 (the gate: the specs a push changed, scripts/e2e-impact.ts): their tests run in projects of their own,
// chromium-x3 and chromium-mic-x3, each 3× and never retried: one failure in three is a flake the push brought, red
const X3 = (process.env.E2E_X3 ?? '').split(/\s+/).filter(Boolean).map((f) => f.replace(/^e2e\//, ''));
const file = (f: string) => new RegExp(`(^|/)${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
const x3 = (p: Project, files: string[]): Project[] => {
  p.testIgnore = [...[p.testIgnore ?? []].flat(), ...X3.map(file)];
  return files.length ? [{ ...p, name: `${p.name}-x3`, testMatch: files.map(file), testIgnore: [], repeatEach: 3, retries: 0 }] : [];
};
// Chromium: the whole suite, gating the deploy until WebKit is green across the board (pages.yml); and what WebKit
// can't stage, tagged @chromium: stale.spec's deploy (its reload re-requests the very chunk URLs that just failed,
// which WebKit's modulepreload never fetches again; a real new build has new URLs).
const chromium: Project = {
  name: 'chromium',
  testIgnore: MIC,
  use: {
    ...devices['iPhone 13'],
    browserName: 'chromium',
    channel: process.env.CI ? undefined : 'chrome',
    // the tent's room is WebGL: headless Chromium draws it in software (SwiftShader)
    // (E2E_SWIFTSHADER=1: software GL on a Mac too, as CI's Linux runners draw: a slow GPU's timing)
    // --mute-audio: never a sound out loud from a test (the music, K.K., the effects play on a dev's Mac too);
    // --disable-audio-output: a fake output's clock, never the machine's device (CI's Linux has none, so it has
    // always been this there): on a Mac the real one stalled a page's audio clock (running, its time frozen: the
    // music decks never moved, or each tab's apart, kk-sync red locally);
    // --host-resolver-rules: no host but the local preview resolves (docs/ops/testing.md "Hermetic"; e2e/fixtures.ts
    // fails a test that tried, in every browser), but for the real relay's harness (RELAY_E2E=1)
    launchOptions: {
      args: [
        '--enable-unsafe-swiftshader',
        '--mute-audio',
        '--disable-audio-output',
        ...(process.env.RELAY_E2E ? [] : ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost']),
        ...(process.env.E2E_SWIFTSHADER ? ['--use-angle=swiftshader', '--use-gl=angle'] : [])
      ]
    }
  }
};
// the mic's specs (docs/kikimimi-mic.md "Tests"): Chromium's fake media (the permission granted without a prompt; the
// capture fed one of our clips), else as `chromium` (muted, no audio out, no host but the preview). On a Mac headless
// Chrome's capture waits on the OS's mic permission, so the specs feed the same clip through a getUserMedia shim too
const chromiumMic: Project = {
  name: 'chromium-mic',
  testMatch: MIC,
  use: {
    ...devices['iPhone 13'],
    browserName: 'chromium',
    channel: process.env.CI ? undefined : 'chrome',
    launchOptions: {
      args: [
        '--mute-audio',
        '--disable-audio-output',
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        `--use-file-for-fake-audio-capture=${import.meta.dirname}/e2e/fixtures/mic/ladder-line.wav`,
        '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost'
      ]
    }
  }
};

export default defineConfig({
  testDir: 'e2e',
  timeout: SLOW ? 90_000 : 30_000,
  // an expect waits up to 10 s on CI (5 here): a page load there now and then takes over 5 s, several shards at once (the
  // runners starting their browsers), and a spec's first wait after goto (the ribbon) ran out: a wait budget, no assertion looser
  expect: { timeout: (process.env.CI ? 10_000 : 5_000) * (SLOW ? 2 : 1) },
  // CI retries a failed test once: failing again is red; passing then, it's green but flaky, and e2e/reporters/flaky.ts
  // names it (summary, annotation) and writes it to the flaky ledger (docs/ops/testing.md "Flakes")
  retries: process.env.CI ? 1 : 0,
  fullyParallel: true,
  // (CI: 3 on GitHub's 4-core runners (4 made the short waits flaky); 2 on fewer cores: the private repo's runners have 2,
  // where 3 timed tests out across the gate from 11-10)
  workers: process.env.CI ? (availableParallelism() >= 4 ? 3 : 2) : undefined,
  reporter: process.env.CI ? [['./e2e/reporters/flaky.ts'], ['list'], ['json', { outputFile: 'playwright-results.json' }]] : 'list',
  projects: [
    // the users' browser (CI: on macOS, Safari's own WebKit; Linux's draws the island at ~1 frame a second)
    { name: 'webkit', use: { ...devices['iPhone 15'] }, grepInvert: /@chromium/, testIgnore: MIC },
    chromium,
    chromiumMic,
    ...x3(chromium, X3.filter((f) => !MIC.test(f))),
    ...x3(chromiumMic, X3.filter((f) => MIC.test(f)))
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
