// The gate's e2e selection (scripts/e2e-impact.ts) and the flaky ledger's tally (scripts/e2e-flakes.ts).
import { describe, expect, it } from 'vitest';
import { fill, mapFile, select, type Ctx } from '../../scripts/e2e-impact.ts';
import { tally } from '../../scripts/e2e-flakes.ts';

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

  it('more than 5 qualifying is the runners: none quarantined', () => {
    const keys = Array.from({ length: 6 }, (_, i) => `a.spec.ts › t${i}`);
    const six = tally([run(1, 'a', keys), run(2, 'b', keys)]);
    expect([six.widespread, six.quarantined.length, six.due.length]).toEqual([true, 0, 6]);
    expect(tally([run(1, 'a', keys.slice(1)), run(2, 'b', keys.slice(1))]).quarantined).toHaveLength(5);
  });
});
