import { describe, expect, test } from 'vitest';
import { defaultLayout, doorOf, withChanges } from '#lib/layout/model.ts';

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
    const up = cliff(l, [[8, 15]], 1);
    expect(up.tier(8, 15)).toBe(1);
    const sand = paint(up, [[8, 15]], 'sand');
    expect([sand.kind(8, 15), sand.tier(8, 15)]).toEqual(['sand', 1]);
    const sea = paint(up, [[8, 15]], 'sea');
    expect([sea.kind(8, 15), sea.tier(8, 15)]).toEqual(['sea', 0]);
    expect(paint(l, [[8, 15]], 'grass')).toBe(l); // no change, the same layout
    expect(cliff(l, [[0, 0]], 1)).toBe(l); // the sea doesn't rise
    expect(cliff(cliff(l, [[8, 15]], -1), [[8, 15]], -1).tier(8, 15)).toBe(0);
  });
  test('place a new piece, move a group on the grid (clamped at its edge), turn it, copy and paste it', () => {
    const p = place(l, 'park-bench', 6, 15, 0, undefined, T0)!;
    expect(p.layout.objects.get(p.id)).toMatchObject({ k: 'park-bench', x: 6, z: 15, f: 0 });
    const m = move(p.layout, [p.id, 'tape-deck'], 2, 1);
    expect(m.objects.get(p.id)).toMatchObject({ x: 8, z: 16 });
    expect(m.objects.get('tape-deck')!.n).toBeUndefined(); // a moved default piece sits on its tile
    expect(move(p.layout, [p.id], -50, 0).objects.get(p.id)!.x).toBe(0);
    expect(rotate(p.layout, [p.id]).objects.get(p.id)!.f).toBe(1);
    const clip = copy(p.layout, [p.id, 'goal-A'])!;
    expect(clip.items).toHaveLength(1); // a goal tree is never copied
    const pasted = paste(p.layout, clip, 10, 17, T0 + 5);
    expect(pasted.ids).toHaveLength(1);
    expect(pasted.layout.objects.get(pasted.ids[0])).toMatchObject({ k: 'park-bench', x: 10, z: 17 });
  });
  test('a visitors’ spot is one on the island: placing another moves it; it may be taken away', () => {
    const a = place(l, 'plaza', 6, 15, 0, undefined, T0)!, b = place(a.layout, 'plaza', 9, 20, 0, undefined, T0 + 1)!;
    const plazas = (g: typeof l) => [...g.objects.values()].filter((o) => o.k === 'plaza').map((o) => [o.id, o.x, o.z]);
    expect([b.id, plazas(b.layout), plazas(remove(b.layout, [b.id]))]).toEqual([a.id, [[a.id, 9, 20]], []]);
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
    const after = paint(move(l, ['tape-deck'], 1, 0), [[8, 15]], 'sand');
    // the partner moved the rock in the meantime
    const now = withChanges(after, { set: [{ ...l.objects.get('rock')!, x: 2, n: undefined }] });
    const back = revert(now, before, after);
    expect(back.kind(8, 15)).toBe('grass');
    expect(back.objects.get('tape-deck')).toEqual(l.objects.get('tape-deck'));
    expect(back.objects.get('rock')!.x).toBe(2);
    expect(sameLayout(revert(after, before, after), before)).toBe(true);
    // a placed piece's undo takes it away
    const p = place(l, 'oak', 5, 13, 0, undefined, T0)!;
    expect(revert(p.layout, l, p.layout).objects.has(p.id)).toBe(false);
  });
});

describe('turning a home', () => {
  test('only its owner, about its door, never so its door is walled in', () => {
    const turned = rotate(l, ['home-B'], 1, 'B');
    expect(turned.objects.get('home-B')!.f).toBe(1);
    expect(turned.homes.B.f).toBe(1);
    expect(rotate(l, ['home-B'], 1, 'A')).toBe(l);
    // a wall of rocks where its turned door would be: refused
    const d = doorOf(turned, turned.objects.get('home-B')!).tiles;
    const walled = withChanges(l, { set: d.map(([c, r], i) => ({ id: `w${i}`, k: 'garden-rock', x: c, z: r, f: 0 as const })) });
    expect(rotate(walled, ['home-B'], 1, 'B').objects.get('home-B')!.f).toBe(0);
  });
});
