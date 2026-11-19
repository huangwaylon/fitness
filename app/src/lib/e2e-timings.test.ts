// e2e/timings.json against today's tests (docs/ops/testing.md "CI"): the shards are planned from it, and a test
// without a time is planned at the median (sugoroku-mini's 16 tests at ~6 s each ran ~400 s). A new test lands
// untimed until the next refresh, so a little is fine; past the tolerance, `npm run e2e:timings` and commit it.
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const APP = join(import.meta.dirname, '../..');
const times: Record<string, number> = JSON.parse(readFileSync(join(APP, 'e2e/timings.json'), 'utf8'));

type Spec = { title: string; file: string; tests: unknown[] };
type Suite = { title: string; specs?: Spec[]; suites?: Suite[] };
/** The tests' keys as e2e-shards.ts names them: file › describe… › title. */
function list(...args: string[]) {
  const json = execFileSync('npx', ['playwright', 'test', '--list', '--reporter=json', '--project=chromium', ...args], { cwd: APP, encoding: 'utf8', maxBuffer: 64 << 20 });
  const out: string[] = [];
  const walk = (s: Suite, path: string[]) => {
    for (const sp of s.specs ?? []) out.push(...sp.tests.map(() => [sp.file, ...path, sp.title].join(' › ')));
    for (const c of s.suites ?? []) walk(c, c.title && !c.title.endsWith('.ts') ? [...path, c.title] : path);
  };
  for (const s of (JSON.parse(json.slice(json.indexOf('{'))) as { suites: Suite[] }).suites) walk(s, []);
  return out;
}

// what the full logic tier runs and so can time (e2e-logic-full.yml's plan), and every test (a key's to stay)
const planned = list('--grep-invert', '@render|@quarantine');
const all = new Set(list());

describe('e2e/timings.json is current (else: npm run e2e:timings, commit it)', () => {
  it('at most 5 % of the planned tests untimed', () => {
    const untimed = planned.filter((k) => !(k in times));
    expect(untimed.length, `${untimed.length} of ${planned.length} untimed:\n${untimed.slice(0, 40).join('\n')}`).toBeLessThanOrEqual(Math.ceil(planned.length * 0.05));
  });

  it('at most 2 % of its keys name a test that is gone (a rename: rename its key)', () => {
    const stale = Object.keys(times).filter((k) => !all.has(k));
    expect(stale.length, `stale:\n${stale.slice(0, 40).join('\n')}`).toBeLessThanOrEqual(Math.ceil(Object.keys(times).length * 0.02));
  });
});
