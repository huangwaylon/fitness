import { describe, expect, test } from 'vitest';
import { defaultLayout, withChanges } from '#lib/layout/model.ts';

import { brushTiles, cliff, copy, inBox, move, objectAt, paint, paste, place, remove, revert, rotate, sameLayout } from './edits.ts';

const T0 = 1_800_000_000_000;
const l = defaultLayout();

describe('the editor’s edits', () => {
  test('a brush covers its square on the grid', () => {
    expect(brushTiles(5, 5, 1)).toEqual([[5, 5]]);
    expect(brushTiles(5, 5, 3)).toHaveLength(9);
    expect(brushTiles(0, 0, 3)).toHaveLength(4);
  });
  test('paint keeps the tier; land on the sea starts at tier 0; the sea is always tier 0', () => {
    const up = cliff(l, [[8, 60]], 1);
    expect(up.tier(8, 60)).toBe(1);
    const sand = paint(up, [[8, 60]], 'sand');
    expect([sand.kind(8, 60), sand.tier(8, 60)]).toEqual(['sand', 1]);
    const sea = paint(up, [[8, 60]], 'sea');
    expect([sea.kind(8, 60), sea.tier(8, 60)]).toEqual(['sea', 0]);
    expect(paint(l, [[8, 60]], 'grass')).toBe(l); // no change, the same layout
    expect(cliff(l, [[0, 0]], 1)).toBe(l); // the sea doesn't rise
    expect(cliff(cliff(l, [[8, 60]], -1), [[8, 60]], -1).tier(8, 60)).toBe(0);
  });
  test('place a new piece, move a group on the grid (clamped at its edge), turn it, copy and paste it', () => {
    const p = place(l, 'park-bench', 6, 60, 0, undefined, T0)!;
    expect(p.layout.objects.get(p.id)).toMatchObject({ k: 'park-bench', x: 6, z: 60, f: 0 });
    const m = move(p.layout, [p.id, 'tape-deck'], 2, 1);
    expect(m.objects.get(p.id)).toMatchObject({ x: 8, z: 61 });
    expect(m.objects.get('tape-deck')!.n).toBeUndefined(); // a moved default piece sits on its tile
    expect(move(p.layout, [p.id], -50, 0).objects.get(p.id)!.x).toBe(0);
    expect(rotate(p.layout, [p.id]).objects.get(p.id)!.f).toBe(1);
    const clip = copy(p.layout, [p.id, 'goal-A'])!;
    expect(clip.items).toHaveLength(1); // a goal tree is never copied
    const pasted = paste(p.layout, clip, 10, 62, T0 + 5);
    expect(pasted.ids).toHaveLength(1);
    expect(pasted.layout.objects.get(pasted.ids[0])).toMatchObject({ k: 'park-bench', x: 10, z: 62 });
  });
  test('the fixed pieces stay: a goal tree, a home, the villagers’ spots', () => {
    const r = remove(l, ['goal-A', 'home-B', 'spot-stage', 'palm-1']);
    expect(r.objects.has('goal-A') && r.objects.has('home-B') && r.objects.has('spot-stage')).toBe(true);
    expect(r.objects.has('palm-1')).toBe(false);
  });
  test('what is under a tile, and in a box', () => {
    const h = l.objects.get('home-B')!;
    expect(objectAt(l, h.x + 1, h.z + 1)?.id).toBe('home-B');
    expect(inBox(l, h.x, h.z, h.x + 3, h.z + 2)).toContain('home-B');
  });
  test('undo reverts only its action: a partner’s change since stays', () => {
    const before = l;
    const after = paint(move(l, ['tape-deck'], 1, 0), [[8, 60]], 'sand');
    // the partner moved the rock in the meantime
    const now = withChanges(after, { set: [{ ...l.objects.get('rock')!, x: 2, n: undefined }] });
    const back = revert(now, before, after);
    expect(back.kind(8, 60)).toBe('grass');
    expect(back.objects.get('tape-deck')).toEqual(l.objects.get('tape-deck'));
    expect(back.objects.get('rock')!.x).toBe(2);
    expect(sameLayout(revert(after, before, after), before)).toBe(true);
    // a placed piece's undo takes it away
    const p = place(l, 'oak', 6, 60, 0, undefined, T0)!;
    expect(revert(p.layout, l, p.layout).objects.has(p.id)).toBe(false);
  });
});
