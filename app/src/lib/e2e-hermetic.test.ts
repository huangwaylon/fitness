// The e2e stay hermetic and wait on state (docs/ops/testing.md "Hermetic"): a lint over app/e2e/*.ts.
// - Playwright comes from e2e/fixtures.ts (the pinned scene clock, the network guard), never '@playwright/test';
// - no fixed wait (`page.waitForTimeout`, a `setTimeout` promise) without a reason: a wait that proves nothing happens
//   for a while says so on its line, `// hold: <why>`; the older ones are counted per file in e2e/waits.json and may
//   only go down (fix one: lower its count);
// - no randomness and no real time in what a spec asks for: `Math.random` (seed it), a `?date=` built from the real
//   clock (`Date.now()` / `new Date()` beside `date=`);
// - no URL off the local preview but a relay the spec routes itself (ROUTED).
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const E2E = join(import.meta.dirname, '../../e2e');
const files = readdirSync(E2E).filter((f) => f.endsWith('.ts')).sort();
const src = (f: string) => readFileSync(join(E2E, f), 'utf8');
const WAITS = JSON.parse(readFileSync(join(E2E, 'waits.json'), 'utf8')) as Record<string, number>;

/** The un-reasoned fixed waits in a file's source. */
function fixedWaits(text: string): number {
  return text.split('\n').filter((l) => /\bwaitForTimeout\(|new Promise\(\s*\(?\w+\)?\s*=>\s*setTimeout\(\s*\w+\s*,\s*[1-9]/.test(l) && !/\/\/ hold:/.test(l) && !/^\s*(\/\/|\*)/.test(l)).length;
}

// a relay URL that every spec naming it routes (page.route / context.route: fulfilled in the test, never fetched), or
// the real relay's harness (RELAY_E2E=1, its own opt-in)
const ROUTED: Record<string, string> = {
  'board.spec.ts': 'the record routed (pairedWithPost)',
  'liveRoom.ts': 'the record and the room routed in-process',
  'log.spec.ts': 'the record and /log routed (LIVE=1 forwards to the test relay on purpose)',
  'record.ts': 'the record routed in-process',
  'relay.ts': 'the address record.ts, liveRoom.ts, board.spec and log.spec route',
  'sync-harness.spec.ts': 'RELAY_E2E=1 only: the test relay',
  'no-notify.spec.ts': "a push subscription's endpoint string, never fetched",
  'trips.ts': 'OpenFreeMap answered from e2e/fixtures/travel by page.route (fixtureTiles), never fetched',
  'travel-map.spec.ts': 'OpenFreeMap aborted by page.route (the offline case), never fetched',
  'wedding-board.spec.ts': "a checklist link's href asserted, never fetched"
};

describe('the e2e are hermetic', () => {
  it("import Playwright from e2e/fixtures.ts, not '@playwright/test'", () => {
    const bad = files.filter((f) => f !== 'fixtures.ts' && /from\s+'@playwright\/test'/.test(src(f)));
    expect(bad, 'import { test, expect, type Page } from "./fixtures.ts"').toEqual([]);
  });

  it('wait on state: no new fixed wait without `// hold: <why>`', () => {
    const over = files.map((f) => [f, fixedWaits(src(f)), WAITS[f] ?? 0] as const).filter(([, n, max]) => n > max);
    expect(over.map(([f, n, max]) => `${f}: ${n} fixed waits, ${max} allowed (wait on the app's state; or \`// hold: why\` for one proving nothing happens)`)).toEqual([]);
  });

  it('e2e/waits.json names only files there are', () => {
    expect(Object.keys(WAITS).filter((f) => !files.includes(f))).toEqual([]);
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

  it('the fixed-wait count reads lines, not comments', () => {
    expect(fixedWaits('await page.waitForTimeout(300);\nawait page.waitForTimeout(3000); // hold: the toast stays\n// page.waitForTimeout(1)\nawait new Promise((r) => setTimeout(r, 50));\nawait new Promise((r) => setTimeout(r, 0));')).toBe(2);
  });
});
