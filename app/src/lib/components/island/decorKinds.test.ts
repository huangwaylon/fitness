// The island's decoration kinds (island/decor.svelte.ts isDecorKind): the outdoor catalogue's `nh-<code>` kinds count
// as decorations though they join the layout's catalogue only after the table loads (DECOR_KINDS is fixed before:
// every nh- piece had no tap area, so none could be used).
import { describe, expect, it } from 'vitest';
import { isDecorKind } from './decor.svelte.ts';
import { DECOR_KINDS } from '#lib/world/decor.ts';
import { loadOutdoor } from '#lib/layout/outdoor.ts';
import { decorH, decorPlace } from '#lib/world/decor.ts';

describe('the decorations’ kinds', () => {
  it('the island’s own and every outdoor catalogue piece’s, before its table is in and after', async () => {
    for (const k of DECOR_KINDS) expect(isDecorKind(k), k).toBe(true);
    expect(DECOR_KINDS.some((k) => k.startsWith('nh-'))).toBe(false);
    for (const k of ['nh-f4379', 'nh-f4008', 'nh-f13774']) expect(isDecorKind(k), k).toBe(true);
    for (const k of ['tree', 'home', 'museum', 'flower']) expect(isDecorKind(k), k).toBe(false);
    await loadOutdoor();
    expect(isDecorKind('nh-f3345')).toBe(true);
    // (its tap area from its catalogue box and height once in: the lifeguard chair stands 25.8 model units, 77.4u)
    expect(decorPlace('nh-f3345', 0)).toMatchObject({ ax: 0.5, ay: 1 });
    expect(decorH('nh-f3345', 0)).toBeCloseTo(77.4, 1);
  });
});
