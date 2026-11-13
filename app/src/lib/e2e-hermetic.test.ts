// The e2e stay hermetic and wait on state (docs/ops/testing.md "Hermetic"): a lint over app/e2e/*.ts.
// - Playwright comes from e2e/fixtures.ts (the pinned scene clock, the network guard), never '@playwright/test';
// - fixed waits, wall-clock sampling, long tests: ratcheted in e2e-budgets.test.ts;
// - no randomness and no real time in what a spec asks for: `Math.random` (seed it), a `?date=` built from the real
//   clock (`Date.now()` / `new Date()` beside `date=`);
// - no URL off the local preview but a relay the spec routes itself (ROUTED);
// - a spec that lets the service worker run is Chromium's only (@chromium): WebKit's Playwright doesn't route a worker's
//   fetches, so the worker of a build that knows the real relay would reach it (review 5: unauthorized requests from
//   fake keys in the production log).
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const E2E = join(import.meta.dirname, '../../e2e');
const files = readdirSync(E2E).filter((f) => f.endsWith('.ts')).sort();
const src = (f: string) => readFileSync(join(E2E, f), 'utf8');

// a relay URL that every spec naming it routes (page.route / context.route: fulfilled in the test, never fetched), or
// the real relay's harness (RELAY_E2E=1, its own opt-in)
const ROUTED: Record<string, string> = {
  'board.spec.ts': 'the record routed (pairedWithPost)',
  'food-kalori.spec.ts': "Kalori's pictures (assets.kalori.jp) answered or aborted by context.route, never fetched; a product link's href asserted, never opened",
  'gymbot.spec.ts': "the gym bot's /status routed (page.route), never fetched",
  'its.spec.ts': "the its-bot Worker routed (page.route), never fetched; the run link is only read",
  'liveRoom.ts': 'the record and the room routed in-process',
  'log.spec.ts': 'the record and /log routed (LIVE=1 forwards to the test relay on purpose)',
  'record.ts': 'the record routed in-process',
  'relay.ts': 'the address record.ts, liveRoom.ts, board.spec and log.spec route',
  'sync-harness.spec.ts': 'RELAY_E2E=1 only: the test relay',
  'no-notify.spec.ts': "a push subscription's endpoint string, never fetched",
  'trips.ts': 'OpenFreeMap answered from e2e/fixtures/travel by page.route (fixtureTiles), never fetched',
  'mapTiles.ts': 'every map tile host answered on every context (fixtures.ts), never fetched',
  'travel-map.spec.ts': 'OpenFreeMap aborted by page.route (the offline case), never fetched',
  'offline.spec.ts': 'OpenFreeMap answered from e2e/fixtures/travel by context.route (the worker and the page), aborted offline, never fetched',
  'wedding-board.spec.ts': "a checklist link's href asserted, never fetched"
};

describe('the e2e are hermetic', () => {
  it("import Playwright from e2e/fixtures.ts, not '@playwright/test'", () => {
    const bad = files.filter((f) => f !== 'fixtures.ts' && /from\s+'@playwright\/test'/.test(src(f)));
    expect(bad, 'import { test, expect, type Page } from "./fixtures.ts"').toEqual([]);
  });

  it('no Math.random, no ?date= from the real clock', () => {
    const bad: string[] = [];
    for (const f of files)
      src(f).split('\n').forEach((l, i) => {
        if (/Math\.random\(/.test(l) && !/\/\/ hold:|ids? only/.test(l)) bad.push(`${f}:${i + 1} Math.random (seed it: ?seed=, a counter)`);
        if (/date=/.test(l) && /Date\.now\(\)|new Date\(\)/.test(l)) bad.push(`${f}:${i + 1} a ?date= from the real clock`);
      });
    expect(bad).toEqual([]);
  });

  it('no URL off the local preview but a routed relay', () => {
    const bad: string[] = [];
    for (const f of files) {
      if (f in ROUTED || f === 'fixtures.ts') continue;
      src(f).split('\n').forEach((l, i) => {
        if (/^\s*(\/\/|\*)/.test(l)) return;
        if (/['"`]wss?:\/\/|['"`]https?:\/\/(?!127\.0\.0\.1|localhost)/.test(l)) bad.push(`${f}:${i + 1}`);
      });
    }
    expect(bad).toEqual([]);
  });

  it("a spec that lets the service worker run tags each of its tests @chromium", () => {
    const bad: string[] = [];
    for (const f of files) {
      const lines = src(f).split('\n');
      lines.forEach((l, i) => {
        if (!/serviceWorkers:\s*'allow'/.test(l) || /^\s*(\/\/|\*)/.test(l)) return;
        // its scope: the file (a top-level test.use), else its describe block (to the describe's closing line)
        const indent = /^\s*/.exec(l)![0].length;
        let from = 0, to = lines.length;
        if (indent > 0) {
          for (from = i; from > 0 && !(/^\s*test\.describe\(/.test(lines[from]) && /^\s*/.exec(lines[from])![0].length < indent); from--);
          const outer = /^\s*/.exec(lines[from])![0];
          for (to = i; to < lines.length && !lines[to].startsWith(`${outer}});`); to++);
        }
        for (let k = from; k < to; k++) if (/^\s*test\(/.test(lines[k]) && !lines[k].includes('@chromium')) bad.push(`${f}:${k + 1}`);
      });
    }
    expect(bad, "add { tag: '@chromium' } (or block the worker)").toEqual([]);
  });
});
