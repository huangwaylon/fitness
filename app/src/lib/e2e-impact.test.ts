// The gate's e2e selection (scripts/e2e-impact.ts) and the flaky ledger's tally (scripts/e2e-flakes.ts).
import { describe, expect, it } from 'vitest';
import { mapFile, select, type Ctx } from '../../scripts/e2e-impact.ts';
import { tally } from '../../scripts/e2e-flakes.ts';

const ctx: Ctx = {
  specs: ['boot.spec.ts', 'tent.spec.ts', 'tent-hold.spec.ts', 'kikimimi-call.spec.ts', 'kikimimi-mic-role.spec.ts', 'fishing3d.spec.ts', 'offline.spec.ts', 'big.spec.ts'],
  importers: new Map([['island.ts', Array.from({ length: 11 }, (_, i) => `s${i}.spec.ts`)], ['trips.ts', ['tent-hold.spec.ts']]]),
  rules: [
    ['content/**', ['offline']],
    ['src/lib/components/kikimimi/*/**', ['kikimimi-$1*', 'kikimimi-mic-$1*']],
    ['src/lib/components/tent/**', ['tent*']],
    ['src/lib/nowhere/**', ['missing']]
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

  it('a helper most specs import, or a selection over the budget, is the gate set only', () => {
    expect(select(['e2e/island.ts'], ctx).reached.size).toBe(0);
    const over = select(['e2e/big.spec.ts', 'src/lib/components/tent/a.ts'], ctx);
    expect(over.x3).toEqual([]);
    expect(over.reached.size).toBe(0);
    expect(over.notes.length).toBe(2);
  });
});

describe('the flaky ledger', () => {
  const entry = (key: string) => ({ key, project: 'chromium', file: 'e2e/a.spec.ts', line: 1, error: 'boom' });
  it('quarantines a test flaky in 2 runs, not one flaky twice in a run', () => {
    const { all, quarantined } = tally([
      { run: '1', sha: 'a', workflow: 'Deploy UI', at: '2026-11-08T01:00:00Z', flaky: [entry('a.spec.ts › x'), entry('a.spec.ts › y'), entry('a.spec.ts › y')] },
      { run: '2', sha: 'b', workflow: 'e2e logic full', at: '2026-11-08T02:00:00Z', flaky: [entry('a.spec.ts › x')] }
    ]);
    expect(all.map((t) => [t.key, t.runs.size])).toEqual([['a.spec.ts › x', 2], ['a.spec.ts › y', 1]]);
    expect(quarantined.map((t) => t.key)).toEqual(['a.spec.ts › x']);
  });
});
