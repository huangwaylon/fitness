// The e2e's `test` and `expect` (docs/ops/testing.md "Hermetic"): every spec and helper imports Playwright from here,
// never '@playwright/test' (src/lib/e2e-hermetic.test.ts checks), so each test runs in a sealed world:
// - the clock: the scene clock starts at PINNED_DATE (`localStorage['e2e.date']`; src/lib/time/clock.ts reads it as a
//   `?date=` for a load that has none), so no test reads the real day, hour, season or the seeded day's sky (the seeded
//   rain of 2026-11-06's morning turned demo.spec's music red for hours). An init script on every context sets it, a
//   second phone's (browser.newContext / newPage) too.
//   A `?date=` in the URL still wins, and a page that sets its device clock to a time (`page.clock.install({ time })`,
//   `setFixedTime`, `setSystemTime`, before it opens) owns its clock: the pin is lifted for that page.
//   `test.use({ ownClock: true })` lifts it for a whole test or file;
// - the weather: with the clock pinned the island never takes a relay's or a cached timeline (clockMoved), so its sky is
//   the pinned day's seeded one (clear at noon) or a `?wx=` / `?weather=` fixture;
// - the network: nothing leaves the local preview. Chromium resolves no other host (playwright.config.ts), and any
//   request or socket to one fails the test loudly at its end, naming it (`test.use({ network: 'any' })`: the real
//   relay's harness only, RELAY_E2E=1). Every map tile host (OpenFreeMap, USGS, GSI) is answered on every context
//   (e2e/mapTiles.ts), so a drawn map is local whichever spec makes it;
// - storage: each test's own context (Playwright's), service workers blocked; two phones in one context share it.
//   ききみみ's first-run welcome counts as seen for every player (DEVICE.kikiOnboarded, unless the test set it):
//   `test.use({ kikiFirstRun: true })` keeps it for the onboarding spec;
// - test mode: allowed (`localStorage['e2e.testMode'] = '1'`, src/lib/ui-state/testMode.ts), so `?demo` gives the
//   made-up data and the hooks in this production build, as nowhere else but the dev server; `test.use({ testMode:
//   false })` is a real visitor's phone (boot.spec);
// - ambient life: off (`localStorage['e2e.ambient'] = 'off'`, read with the hooks on, `?demo`: island/devHooks.ts),
//   as if the URL said `?critter=none&visitor=events&balloon=none&idle=none&stars=none` (devHooks.ts AMBIENT): no
//   critter visits, no day's visitor (an event's host still comes), no balloon, no idle beats of the villagers or しずえ
//   (they stand where they are), no ordinary night's shooting stars. Nothing wanders into a tap. A URL's own param wins (`?critter=fish`, `?visitor=jack`);
//   `test.use({ ambient: 'on' })` brings it all back for a test or file.
import { test as base, type BrowserContext, type Page } from '@playwright/test';
import { serveMapTiles } from './mapTiles.ts';

export * from '@playwright/test';

/** Every test's scene clock unless its URL has a `?date=` (Tokyo time): a Wednesday, clear all day, no event. */
export const PINNED_DATE = '2026-11-04T12:00';

/** The clock of the tests' own stand-in relay (liveRoom.ts, record.ts) and of the phones on it: from PINNED_DATE
 *  (Tokyo) on as the time goes. A phone and its relay agree on the time (its day, its tickets, the room's replay of the
 *  day), so a phone on it (`device(context)`) has its device clock there too (Date shifted, the scene clock on it with
 *  no pin of its own): a room on the real clock replayed another day than the pinned phones' (live-sync's catches). */
export function pinnedClock(): { now: () => number; device(c: BrowserContext): Promise<void> } {
  const off = Date.parse(`${PINNED_DATE}:00+09:00`) - Date.now();
  return {
    now: () => Date.now() + off,
    device: async (c) => {
      await c.addInitScript((off) => {
        const Real = Date;
        const now = () => Real.now() + off;
        const Shifted = function (this: unknown, ...a: unknown[]) {
          if (!new.target) return new Real(now()).toString();
          return a.length ? new (Real as unknown as new (...b: unknown[]) => Date)(...a) : new Real(now());
        } as unknown as DateConstructor;
        Object.setPrototypeOf(Shifted, Real);
        Object.defineProperty(Shifted, 'prototype', { value: Real.prototype });
        Shifted.now = now;
        globalThis.Date = Shifted;
        try {
          localStorage.removeItem('e2e.date');
        } catch {
          /* about:blank */
        }
      }, off);
    }
  };
}

const LOCAL = /^(https?|wss?):\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/;
const INERT = /^(data|blob|about|chrome|chrome-error|chrome-extension):/;
/** Whether a URL leaves the local preview. */
const external = (url: string): boolean => !LOCAL.test(url) && !INERT.test(url);

type Options = {
  /** The test sets the device clock itself (page.clock): no pinned scene clock. */
  ownClock: boolean;
  /** 'local' (every test but the real relay's harness): any request off 127.0.0.1 fails the test. */
  network: 'local' | 'any';
  /** ききみみ's first-run welcome shows (else it counts as seen: every other spec opens on the hub). */
  kikiFirstRun: boolean;
  /** The island's ambient life ('off': none, island/devHooks.ts AMBIENT; 'on': as on a phone). */
  ambient: 'off' | 'on';
  /** Test mode allowed (`?demo`: ui-state/testMode.ts); false: a real visitor's phone. */
  testMode: boolean;
};

export const test = base.extend<Options & { hermetic: void }>({
  ownClock: [false, { option: true }],
  network: ['local', { option: true }],
  kikiFirstRun: [false, { option: true }],
  ambient: ['off', { option: true }],
  testMode: [true, { option: true }],
  hermetic: [
    async ({ context, browser, ownClock, network, kikiFirstRun, ambient, testMode }, use) => {
      const seen: string[] = [];
      const watch = async (c: BrowserContext) => {
        // (before any page script, every load: a fresh context's storage, or one the test changed)
        await c.addInitScript(([d, a, t]) => {
          try {
            if (d) localStorage.setItem('e2e.date', d);
            else localStorage.removeItem('e2e.date');
            if (a === 'off') localStorage.setItem('e2e.ambient', a);
            else localStorage.removeItem('e2e.ambient');
            if (t) localStorage.setItem('e2e.testMode', '1');
            else localStorage.removeItem('e2e.testMode');
          } catch {
            /* about:blank: no storage */
          }
        }, [ownClock ? null : PINNED_DATE, ambient, testMode] as const);
        if (!kikiFirstRun)
          await c.addInitScript(() => {
            try {
              if (localStorage.getItem('island.kikiOnboarded') === null) localStorage.setItem('island.kikiOnboarded', '{"A":1,"B":1,"G":1}');
            } catch {
              /* about:blank: no storage */
            }
          });
        // a page that sets its device clock to a time (page.clock.install({ time }), setFixedTime, setSystemTime) owns
        // its clock: the pin is lifted for its loads (a page init script runs after the context's)
        const own = (p: Page) => {
          for (const k of ['install', 'setFixedTime', 'setSystemTime'] as const) {
            const f = p.clock[k] as (...a: unknown[]) => Promise<void>;
            (p.clock[k] as unknown) = async (...a: unknown[]) => {
              const timed = k !== 'install' || (a[0] as { time?: unknown } | undefined)?.time !== undefined;
              if (timed)
                await p.addInitScript(() => {
                  try {
                    localStorage.removeItem('e2e.date');
                  } catch {
                    /* about:blank */
                  }
                });
              return f.apply(p.clock, a);
            };
          }
        };
        c.pages().forEach(own);
        c.on('page', own);
        if (network === 'any') return;
        await serveMapTiles(c);
        // ボット's dots read the ITS and gym Workers' status (the menu unfolding, the sheet opening): refused unless a
        // spec answers them (its.spec's and gymbot.spec's page.route come first), so a dot just stays off
        await c.route('https://its-bot.island-fund-relay.workers.dev/**', (r) => r.abort());
        await c.route('https://gym-bot.island-fund-relay.workers.dev/**', (r) => r.abort());
        // what went out: one Chromium refused to resolve, or one a server answered (WebKit has no such block); a request
        // the test routes and fulfils or aborts itself (a mocked relay: board.spec, record.ts) never left
        const blocked = (e: string | undefined) => /NAME_NOT_RESOLVED|NAME_RESOLUTION_FAILED/.test(e ?? '');
        c.on('requestfailed', (r) => void (external(r.url()) && blocked(r.failure()?.errorText) && seen.push(`${r.method()} ${r.url()}`)));
        c.on('requestfinished', (r) => {
          if (external(r.url()))
            void r
              .response()
              .then(async (res) => (res && (await res.serverAddr()) ? seen.push(`${r.method()} ${r.url()}`) : 0))
              .catch(() => 0); // (the page gone meanwhile)
        });
        const ws = (p: Page) => p.on('websocket', (w) => void (external(w.url()) && w.on('socketerror', (e) => void (blocked(e) && seen.push(`WS ${w.url()}`)))));
        c.pages().forEach(ws);
        c.on('page', ws);
      };
      await watch(context);
      // a second phone's context (browser.newContext / newPage) is watched too
      const newContext = browser.newContext;
      browser.newContext = async function (this: typeof browser, ...a: Parameters<typeof newContext>) {
        const c = await newContext.apply(this, a);
        await watch(c);
        return c;
      };
      try {
        await use();
      } finally {
        browser.newContext = newContext;
      }
      if (seen.length) throw new Error(`The test reached the network outside the local preview (docs/ops/testing.md "Hermetic"):\n${[...new Set(seen)].slice(0, 10).join('\n')}`);
    },
    { auto: true }
  ]
});
