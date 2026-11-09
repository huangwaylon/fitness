// The gate's e2e selection (scripts/e2e-impact.ts) and the flaky ledger's tally (scripts/e2e-flakes.ts).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fill, mapFile, select, type Ctx } from '../../scripts/e2e-impact.ts';
import { runnerTrouble, tally } from '../../scripts/e2e-flakes.ts';
import { failedSpecs, missed } from '../../scripts/e2e-missed.ts';

const ctx: Ctx = {
  specs: ['boot.spec.ts', 'tent.spec.ts', 'tent-hold.spec.ts', 'kikimimi-call.spec.ts', 'kikimimi-mic-role.spec.ts', 'fishing3d.spec.ts', 'offline.spec.ts', 'big.spec.ts'],
  importers: new Map([['island.ts', Array.from({ length: 11 }, (_, i) => `s${i}.spec.ts`)], ['trips.ts', ['tent-hold.spec.ts']]]),
  rules: [
    ['content/**', ['offline']],
    ['src/lib/components/kikimimi/*/**', ['kikimimi-$1*', 'kikimimi-mic-$1*']],
    ['src/lib/components/tent/**', ['tent*']],
    ['src/lib/nowhere/**', ['missing']],
    ['src/lib/huge/**', ['big']]
  ],
  gate: ['boot.spec.ts'],
  cost: (s) => (s === 'big.spec.ts' ? 2_000_000 : 10_000)
};

describe('e2e impact', () => {
  it('maps a path by the first rule whose specs exist, $1 its first *, else the file name', () => {
    expect(mapFile('src/lib/components/kikimimi/call/Call.svelte', ctx)).toEqual(['kikimimi-call.spec.ts']);
    expect(mapFile('src/lib/components/kikimimi/role/x.ts', ctx)).toEqual(['kikimimi-mic-role.spec.ts']);
    expect(mapFile('src/lib/components/tent/engine.ts', ctx)).toEqual(['tent-hold.spec.ts', 'tent.spec.ts']);
    expect(mapFile('content/listen/a.yaml', ctx)).toEqual(['offline.spec.ts']);
    expect(mapFile('src/lib/components/world3d/fishing3d.ts', ctx)).toEqual(['fishing3d.spec.ts']);
    expect(mapFile('src/lib/nowhere/x.ts', ctx)).toEqual([]);
    expect(mapFile('static/x.webp', ctx)).toEqual([]);
  });

  it('changed specs 3×, a helper its importers, an unmapped file the gate set only', () => {
    const s = select(['e2e/tent.spec.ts', 'e2e/trips.ts', 'src/lib/store/actions.ts', 'src/lib/x.test.ts', 'content/a.yaml'], ctx);
    expect(s.gate).toEqual(['boot.spec.ts']);
    expect(s.x3).toEqual(['tent.spec.ts']);
    expect([...s.reached.keys()].sort()).toEqual(['offline.spec.ts', 'tent-hold.spec.ts']);
    expect(s.gateOnly).toEqual(['src/lib/store/actions.ts']);
    expect(s.ms).toBe(10_000 + 30_000 + 20_000);
  });

  it('a helper most specs import adds nothing', () => {
    expect(select(['e2e/island.ts'], ctx).reached.size).toBe(0);
  });

  it('over the budget the reached specs drop out first, then the changed run once: never none', () => {
    const fits = select(['e2e/tent.spec.ts', 'src/lib/huge/a.ts'], ctx);
    expect([fits.x3, fits.once, fits.reached.size]).toEqual([['tent.spec.ts'], [], 0]);
    expect(fits.notes).toHaveLength(1);
    const over = select(['e2e/big.spec.ts', 'src/lib/components/tent/a.ts'], ctx);
    expect([over.x3, over.once, over.reached.size]).toEqual([[], ['big.spec.ts'], 0]);
    expect(over.ms).toBe(10_000 + 2_000_000);
    expect(over.notes).toHaveLength(2);
  });

  it('a sweep (over 8 changed specs) runs each once', () => {
    const many = Array.from({ length: 9 }, (_, i) => `m${i}.spec.ts`);
    const s = select(many.map((f) => `e2e/${f}`), { ...ctx, specs: [...ctx.specs, ...many] });
    expect([s.x3, s.once]).toEqual([[], many]);
  });

  it('no base: the gate set, then the cheapest specs up to the budget', () => {
    const s = fill(ctx);
    expect(s.gate).toEqual(['boot.spec.ts']);
    expect([...s.reached.keys()]).toEqual(ctx.specs.filter((f) => f !== 'boot.spec.ts' && f !== 'big.spec.ts').sort());
    expect(s.ms).toBe(70_000);
  });
});

describe('e2e/impact.json', () => {
  const app = join(import.meta.dirname, '..', '..');
  const impact = JSON.parse(readFileSync(join(app, 'e2e', 'impact.json'), 'utf8')) as { rules: Ctx['rules']; unmapped: Record<string, string> };
  const specs = readdirSync(join(app, 'e2e')).filter((f) => f.endsWith('.spec.ts'));
  const walk = (d: string): string[] => readdirSync(join(app, d)).flatMap((f) => (statSync(join(app, d, f)).isDirectory() ? walk(`${d}/${f}`) : [`${d}/${f}`]));
  const dirs = new Map<string, string[]>();
  for (const f of [...walk('src'), ...walk('content')].filter((f) => !f.endsWith('.test.ts'))) {
    const d = f.slice(0, f.lastIndexOf('/'));
    dirs.set(d, [...(dirs.get(d) ?? []), f]);
  }
  const unmapped = [...dirs].filter(([, files]) => !files.some((f) => mapFile(f, { rules: impact.rules, specs }).length)).map(([d]) => d);

  it('maps every source directory to a spec, or lists it in `unmapped` with why', () => {
    expect(unmapped.filter((d) => !impact.unmapped[d]), 'add an impact.json rule (or an `unmapped` entry with why)').toEqual([]);
  });

  it('lists in `unmapped` only directories there are, that no rule maps', () => {
    expect(Object.keys(impact.unmapped).filter((d) => !unmapped.includes(d))).toEqual([]);
  });

  it('names only specs there are', () => {
    const none = impact.rules.flatMap(([glob, pats]) => pats.filter((p) => !p.includes('$1') && !specs.some((s) => new RegExp(`^${p.replace(/[.-]/g, '\\$&').replace(/\*/g, '.*')}\\.spec\\.ts$`).test(s))).map((p) => `${glob}: ${p}`));
    expect(none).toEqual([]);
  });
});

describe('what the gate missed', () => {
  const report = (tests: [string, string[]][]) => ({ suites: [{ suites: tests.map(([file, results]) => ({ specs: [{ file, tests: [{ results: results.map((status) => ({ status })) }] }] })) }] });
  it('a spec with a test that never passed, not one passing on its retry, nor a skip', () => {
    const r = report([['a.spec.ts', ['failed', 'failed']], ['b.spec.ts', ['failed', 'passed']], ['c.spec.ts', ['skipped']], ['d.spec.ts', ['timedOut']]]);
    expect(failedSpecs([r])).toEqual(['a.spec.ts', 'd.spec.ts']);
  });

  it("the failed specs that weren't in the gate's plan", () => {
    expect(missed(['a.spec.ts', 'd.spec.ts'], ['e2e/a.spec.ts', 'e2e/boot.spec.ts'])).toEqual(['d.spec.ts']);
  });
});

describe('the flaky ledger', () => {
  const entry = (key: string) => ({ key, project: 'chromium', file: `e2e/${key.split(' › ')[0]}`, line: 1, error: 'boom' });
  const run = (n: number, sha: string, keys: string[]) => ({ run: String(n), sha, workflow: 'Deploy UI', at: `2026-11-08T0${n}:00:00Z`, flaky: keys.map(entry) });
  it('quarantines a test flaky in runs of 2 commits, not 2 runs of one, nor twice in a run', () => {
    const { all, quarantined } = tally([run(1, 'a', ['a.spec.ts › x', 'a.spec.ts › y', 'a.spec.ts › y', 'a.spec.ts › z']), run(2, 'b', ['a.spec.ts › x']), run(3, 'a', ['a.spec.ts › z'])]);
    expect(all.map((t) => [t.key, t.runs.size, t.shas.size])).toEqual([['a.spec.ts › x', 2, 2], ['a.spec.ts › z', 2, 1], ['a.spec.ts › y', 1, 1]]);
    expect(quarantined.map((t) => t.key)).toEqual(['a.spec.ts › x']);
  });

  it("never a gate set spec's test: held, for a warning", () => {
    const { quarantined, held } = tally([run(1, 'a', ['boot.spec.ts › x', 'a.spec.ts › x']), run(2, 'b', ['boot.spec.ts › x', 'a.spec.ts › x'])], ['boot.spec.ts']);
    expect(quarantined.map((t) => t.key)).toEqual(['a.spec.ts › x']);
    expect(held.map((t) => t.key)).toEqual(['boot.spec.ts › x']);
  });

  it('more than 5 qualifying: the worst 5 quarantined (commits, then runs, then the latest), the rest over the cap', () => {
    const keys = Array.from({ length: 7 }, (_, i) => `a.spec.ts › t${i}`);
    const t = tally([run(1, 'a', keys), run(2, 'b', keys.slice(1)), run(3, 'c', ['a.spec.ts › t6']), run(4, 'c', ['a.spec.ts › t5'])]);
    expect(t.quarantined.map((q) => q.key)).toEqual(['a.spec.ts › t5', 'a.spec.ts › t6', 'a.spec.ts › t1', 'a.spec.ts › t2', 'a.spec.ts › t3']);
    expect(t.over.map((q) => q.key)).toEqual(['a.spec.ts › t4']);
    expect(t.all.at(-1)!.key).toBe('a.spec.ts › t0');
  });

  it("a shard that mostly broke, or 10 flaky at once, is the runner's: left out of the tally", () => {
    const many = Array.from({ length: 10 }, (_, i) => `a.spec.ts › m${i}`);
    const sick = { ...run(2, 'b', ['a.spec.ts › x']), total: 6, failed: 3 };
    const t = tally([run(1, 'a', ['a.spec.ts › x']), sick, run(3, 'c', many), run(4, 'd', many.slice(0, 9))]);
    expect(t.runner.map((l) => l.run)).toEqual(['2', '3']);
    expect(t.quarantined).toEqual([]);
    expect(t.all.find((q) => q.key === 'a.spec.ts › x')!.shas.size).toBe(1);
    expect(runnerTrouble({ ...run(5, 'e', ['a.spec.ts › x']), total: 100, failed: 2 })).toBe(false);
  });
});
