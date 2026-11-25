import { describe, expect, test } from 'vitest';
import { defaultLayout, doorOf, withChanges } from '#lib/layout/model.ts';
import { validate } from '#lib/layout/validate.ts';

import { brushTiles, cliff, copy, duplicate, ghostAt, ghostFoot, inBox, move, objectAt, paint, paste, place, remove, resize, revert, rotate, sameLayout } from './edits.ts';
import { layoutOf, opsBetween } from '#lib/layout/model.ts';
import { loadOutdoor } from '#lib/layout/outdoor.ts';
import type { LayoutEntry } from '#lib/contract/layout.ts';

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
    const r = remove(l, ['goal-A', 'home-B', 'spot-villager-A', 'palm-1']);
    expect(r.objects.has('goal-A') && r.objects.has('home-B') && r.objects.has('spot-villager-A')).toBe(true);
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
  test('しまの おおきさ: the back a row out is one action (its chunks’ ops), undone over a partner’s change since; a pull waits on what’s in the way, moved inside on うごかす', () => {
    const out = resize(l, 'back', 1);
    expect(out.blocked).toEqual([]);
    const ops = opsBetween(l, out.layout!, T0);
    expect(ops.every((o) => o.sc === 'c')).toBe(true);
    expect(ops.map((o) => o.id)).toEqual(['c0x7', 'c1x7', 'c2x7']);
    // undo with the partner's bench moved since: the island's back as it was, the bench where they put it
    const since = move(out.layout!, ['bench-mae'], 1, 0);
    const back = revert(since, l, out.layout!);
    expect(sameLayout(back, move(l, ['bench-mae'], 1, 0))).toBe(true);
    // the front a row in: the sandcastle (fixed) in the way; うごかす moves it inside, the tiles and the move one action
    const held = resize(l, 'front', -1);
    expect([held.layout, held.blocked.map((b) => b.id)]).toEqual([null, ['sandcastle']]);
    const moved = resize(l, 'front', -1, true);
    expect(moved.stuck).toEqual([]);
    const sc = moved.layout!.objects.get('sandcastle')!;
    expect(moved.layout!.kind(sc.x, sc.z)).not.toBe('sea');
    expect(opsBetween(l, moved.layout!, T0).filter((o) => o.sc === 'o').map((o) => o.id)).toEqual(['sandcastle']);
    // the museum can't fit on a shallower clifftop: the pull waits
    const museum = resize(l, 'back', -2, true);
    expect([museum.layout, museum.stuck]).toEqual([null, ['museum']]);
  });
  test('a duplicate goes beside its pieces (right, else left, below, above: where it fits whole), new ids; never a fixed one, a bridge or stairs', () => {
    const p = place(l, 'park-bench', 6, 15, 0, undefined, T0)!;
    const w = p.layout.objects.get(p.id)!, [fw] = ghostFoot('park-bench', 0);
    const d = duplicate(p.layout, [p.id, 'tape-deck'], T0 + 1);
    if ('why' in d) throw new Error(d.why);
    expect(d.ids).toHaveLength(1);
    expect(d.layout.objects.get(d.ids[0])).toMatchObject({ k: 'park-bench', x: w.x + fw, z: w.z, f: 0 });
    // at the lawn's right edge (the beach beside it: no bush there): to the left
    const edge = place(l, 'bush', 15, 15, 0, undefined, T0)!;
    const e = duplicate(edge.layout, [edge.id], T0 + 1);
    if ('why' in e) throw new Error(e.why);
    expect(e.layout.objects.get(e.ids[0])).toMatchObject({ k: 'bush', x: 14, z: 15 });
    // hemmed in right and left (the beach, a tree): below
    const hem = place(edge.layout, 'oak', 14, 15, 0, undefined, T0 + 2)!;
    const b = duplicate(hem.layout, [edge.id], T0 + 3);
    if ('why' in b) throw new Error(b.why);
    expect(b.layout.objects.get(b.ids[0])).toMatchObject({ k: 'bush', x: 15, z: 16 });
    expect(duplicate(l, ['tape-deck'], T0)).toEqual({ why: 'これは複製できません' });
    for (const id of ['bridge', 'stairs']) expect(duplicate(l, [id], T0)).toEqual({ why: expect.stringContaining('橋と坂は複製できません') });
    expect(copy(l, ['bridge', 'stairs'])).toBeNull();
  });
  test("a duplicate of any of the default's pieces never makes an issue (or isn't made)", () => {
    const had = new Set(validate(l).map((i) => `${i.code}|${[...i.ids].sort().join(',')}`));
    for (const o of l.objects.values()) {
      const d = duplicate(l, [o.id], T0);
      if ('why' in d) continue;
      const fresh = validate(d.layout).filter((i) => !had.has(`${i.code}|${[...i.ids].sort().join(',')}`));
      expect(fresh, o.id).toEqual([]);
    }
  });
  test('a paste goes down whole where it fits, else not at all', () => {
    const p = place(l, 'park-bench', 6, 15, 0, undefined, T0)!, clip = copy(p.layout, [p.id])!;
    expect(paste(p.layout, clip, 6, 17, T0 + 1).ids).toHaveLength(1);
    // on itself, on the sea: nothing
    for (const [c, r] of [[6, 15], [0, 0]]) expect(paste(p.layout, clip, c, r, T0 + 1)).toEqual({ layout: p.layout, ids: [] });
  });
  test('a ghost is green only where validate passes the piece: never on another, across a cliff, on stairs; an arch over the stream', async () => {
    await loadOutdoor();
    const tape = l.objects.get('tape-deck')!;
    expect(ghostAt(l, 'oak', 0, [tape.x, tape.z]).ok).toBe(false);
    expect(ghostAt(l, 'flower', 0, [4, 50]).ok).toBe(false); // the stairs
    expect(ghostAt(l, 'flower', 0, [9, 23]).ok).toBe(false); // the bridge's deck
    expect(ghostAt(l, 'park-bench', 1, [10, 52]).ok).toBe(false); // rows 52 and 53: the cliff
    expect(ghostAt(l, 'park-bench', 1, [14, 44]).ok).toBe(true);
    expect(ghostAt(l, 'nh-f13631', 0, [15, 30])).toMatchObject({ x: 14, ok: true }); // a torii across the stream
    expect(ghostAt(l, 'nh-f13631', 0, [14, 30]).ok).toBe(false); // a post in it
    expect(ghostAt(l, 'bridge', 0, [9, 12]).ok).toBe(false); // a bridge over no water
    expect(ghostAt(l, 'bridge', 0, [9, 24]).ok).toBe(false); // on the bridge there
  });
  test('a seasonal piece (the beach chair, the sandcastle, the snowboy) is deleted for good and put back from the palette', () => {
    const at = (ops: ReturnType<typeof opsBetween>) => ops.map((o) => ({ ...o, who: 'A' }) as LayoutEntry);
    for (const k of ['beach-chair', 'sandcastle', 'snowboy']) {
      const gone = remove(l, [k]);
      expect(gone.objects.has(k), k).toBe(false);
      const rm = at(opsBetween(l, gone, T0));
      // (the record's op over the default: it stays gone)
      expect(layoutOf(rm).objects.has(k), k).toBe(false);
      const back = place(gone, k, 7, 13, 0, undefined, T0 + 1)!;
      expect(back.id, k).toBe(k); // its season's id (world/fixedDecor.ts)
      expect(layoutOf([...rm, ...at(opsBetween(gone, back.layout, T0 + 1))]).objects.get(k), k).toMatchObject({ k, x: 7, z: 13 });
      // a second moves the one there
      expect(place(back.layout, k, 7, 16, 0, undefined, T0 + 2)!.layout.objects.get(k)).toMatchObject({ x: 7, z: 16 });
    }
  });
  test("a ghost centres the footprint on the tile; never on water, the sea or off the grid (but a bridge)", () => {
    expect(ghostAt(l, 'bush', 0, [8, 15])).toEqual({ k: 'bush', x: 8, z: 15, f: 0, ok: true });
    expect(ghostAt(l, 'bush', 0, [0, 0]).ok).toBe(false);
    expect(ghostAt(l, 'bush', 0, [-1, 5]).ok).toBe(false);
    const [w, d] = ghostFoot('museum', 0), g = ghostAt(l, 'museum', 0, [8, 15]);
    expect([g.x, g.z]).toEqual([8 - Math.floor((w - 1) / 2), 15 - Math.floor((d - 1) / 2)]);
  });
});
