// Ratchets on the e2e's flaky patterns (docs/ops/testing.md "Guardrails"): each rule's count per file in app/e2e/*.ts,
// with today's counts the ceiling in e2e/budgets.json. Over a ceiling (or any in a file not listed) fails; under one is
// fine, and `UPDATE_BUDGETS=1 npx vitest run src/lib/e2e-budgets` writes the ceilings down to the counts (never up: a
// raise is a hand edit, and a reviewer's question).
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const E2E = join(import.meta.dirname, '../../e2e');
const BUDGETS = join(E2E, 'budgets.json');
const files = readdirSync(E2E).filter((f) => f.endsWith('.ts')).sort();
const src = (f: string) => readFileSync(join(E2E, f), 'utf8');

/** Code lines only: a comment's mention isn't a use. */
const code = (text: string) => text.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l));
const hits = (text: string, re: RegExp) => code(text).reduce((n, l) => n + (l.match(re)?.length ?? 0), 0);

const ms = (s: string) => Number(s.replace(/_/g, ''));

type Rule = { only?: (f: string) => boolean; count: (text: string) => number; fix: string };
const spec = (f: string) => f.endsWith('.spec.ts');

const RULES: Record<string, Rule> = {
  waits: {
    count: (t) => hits(t, /\bwaitForTimeout\(|new Promise\(\s*\(?\w+\)?\s*=>\s*setTimeout\(\s*\w+\s*,\s*[1-9]/g),
    fix: "wait on state (expect.poll on a hook, a data-* attribute, quiet()/idle()); to prove nothing happens, step page.clock.runFor(ms) and assert it didn't"
  },
  wallClock: {
    only: spec,
    count: (t) => hits(t, /\bperformance\.now\(|\brequestAnimationFrame\(/g),
    fix: "don't sample motion against the page's wall clock or rAF: move the speed/step rule to vitest with an explicit dt, or step page.clock and read the engine's state (__world3d.stats().frames)"
  },
  longTests: {
    count: (t) =>
      code(t).reduce((n, l) => n + [...l.matchAll(/\btest\.setTimeout\(\s*([\d_]+)\s*\)/g)].filter((m) => ms(m[1]) > 30_000).length + (l.match(/\btest\.slow\(/g)?.length ?? 0), 0),
    fix: 'split the test (one behaviour each, under the 30 s default); its rule parts into vitest'
  },
  textSelectors: {
    only: spec,
    count: (t) => hits(t, /\bgetByText\(|\bhasText:/g),
    fix: "find it by role or a data-* hook (getByRole('button', { name }), [data-tab=…]): the text is product copy and moves"
  }
};

type Budgets = Record<string, Record<string, number>>;
let budgets: Budgets = existsSync(BUDGETS) ? JSON.parse(readFileSync(BUDGETS, 'utf8')) : {};

function counts(rule: Rule): Record<string, number> {
  const out: Record<string, number> = {};
  for (const f of files.filter(rule.only ?? (() => true))) {
    const n = rule.count(src(f));
    if (n) out[f] = n;
  }
  return out;
}

const now = Object.fromEntries(Object.entries(RULES).map(([k, r]) => [k, counts(r)])) as Budgets;

if (process.env.UPDATE_BUDGETS) {
  const down: Budgets = {};
  for (const k of Object.keys(RULES)) {
    down[k] = {};
    for (const [f, n] of Object.entries(now[k])) {
      // `init` seeds the ceilings from today's counts (a new rule); anything else only lowers them
      const m = process.env.UPDATE_BUDGETS === 'init' ? n : Math.min(n, budgets[k]?.[f] ?? 0);
      if (m) down[k][f] = m;
    }
  }
  writeFileSync(BUDGETS, JSON.stringify(down, null, 2) + '\n');
  budgets = down;
}

describe('the e2e stay under their budgets (e2e/budgets.json)', () => {
  for (const [k, rule] of Object.entries(RULES))
    it(`${k}: no file over its ceiling`, () => {
      const ceil = budgets[k] ?? {};
      const over = Object.entries(now[k]).filter(([f, n]) => n > (ceil[f] ?? 0));
      const under = Object.entries(ceil).filter(([f, max]) => (now[k][f] ?? 0) < max);
      if (under.length) console.info(`e2e/budgets.json ${k}: ${under.map(([f]) => f).join(', ')} under the ceiling; lower it: UPDATE_BUDGETS=1 npx vitest run src/lib/e2e-budgets`);
      expect(over.map(([f, n]) => `${f}: ${n} (${k}), ${ceil[f] ?? 0} allowed. Instead: ${rule.fix}`)).toEqual([]);
    });

  it('the counts read code, not comments', () => {
    const t = 'await page.waitForTimeout(300); // hold: x\n// page.waitForTimeout(1)\nawait new Promise((r) => setTimeout(r, 50));\nawait new Promise((r) => setTimeout(r, 0));';
    expect(RULES.waits.count(t)).toBe(2);
    expect(RULES.longTests.count('test.setTimeout(30_000);\ntest.setTimeout(45_000);\n  test.slow();\n// test.slow()')).toBe(2);
    expect(RULES.wallClock.count('const t = performance.now(); requestAnimationFrame(f);')).toBe(2);
    expect(RULES.textSelectors.count("page.getByText('x'); locator('li', { hasText: 'y' })")).toBe(2);
  });
});
