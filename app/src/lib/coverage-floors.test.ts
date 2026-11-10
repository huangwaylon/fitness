// The unit tests' coverage floors (scripts/coverage-floors.ts).
import { describe, expect, it } from 'vitest';
import { FLOOR, RATCHET, floors } from '../../scripts/coverage-floors.ts';

const at = (pct: number, total = 10) => ({ lines: { pct, total } });
describe('coverage floors', () => {
  it('contract/, sync/ and store/actions.ts at the floor, a ratchet file at its own; the rest not checked', () => {
    const r = floors({
      '/x/app/src/lib/contract/a.ts': at(FLOOR - 1),
      '/x/app/src/lib/sync/b.ts': at(FLOOR),
      '/x/app/src/lib/sync/live-local.ts': at(RATCHET['src/lib/sync/live-local.ts']),
      '/x/app/src/lib/store/actions.ts': at(RATCHET['src/lib/store/actions.ts'] - 1),
      '/x/app/src/lib/store/week.svelte.ts': at(10),
      '/x/app/src/lib/contract/empty.ts': at(0, 0)
    });
    expect(r.under.map((l) => l.split(':')[0])).toEqual(['src/lib/contract/a.ts', 'src/lib/store/actions.ts']);
    expect(r.raise).toEqual([]);
  });

  it('names a ratchet floor 5 points under its file, to raise', () => {
    expect(floors({ '/x/app/src/lib/sync/live-local.ts': at(RATCHET['src/lib/sync/live-local.ts'] + 5) }).raise).toHaveLength(1);
  });
});
