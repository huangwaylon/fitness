import { describe, expect, test } from 'vitest';
import { defaultLayout, doorOf, extentOf, fromJson, layoutOf, objMid, objTiles, toJson, withChanges, type Layout } from './model.ts';
import { KIND_LIST } from './catalog.ts';
import { beachOk, besideStage, daySpots, guestOk, guestSpot, markerOf, openGrass, plazaOk, spotWhy, stageOf, washedUp } from './spots.ts';
import { validate } from './validate.ts';
import { frontRows } from './hides.ts';
import { tapCovered } from './clear.ts';
import { navOf, reachable } from './nav.ts';
import RECORD from './record-2026-11-03.json' with { type: 'json' };
import { layoutOpOf, mergeLayout } from '#lib/contract/layout.ts';
import { migratedId, migrationOps } from './migrate.ts';
import { codeOf, tileAt, tileMid } from './grid.ts';
import type { LayoutEntry } from '#lib/contract/layout.ts';

const l = defaultLayout();
describe('the day’s spots from the layout (spots.ts)', () => {
  test('never under or before a tree’s canopy, nor by a bush, a flower, the rock or a bench (it, or the spot, takes the other’s tap)', () => {
    const near = [...l.objects.values()].filter((o) => ['rock', 'tape-deck', 'park-bench', 'log-bench'].includes(o.k)).flatMap((o) => objTiles(l, o).map((t) => [o.id, ...t] as const));
    for (const [c, r] of openGrass(l)) for (const [id, tc, tr] of near) expect(Math.abs(c - tc) <= 1 && Math.abs(r - tr) <= 1, `${c},${r} by ${id}`).toBe(false);
    const tall = [...l.objects.values()].filter((o) => ['oak', 'cedar', 'palm', 'bamboo', 'goal-tree', 'bush', 'hedge', 'flower'].includes(o.k));
    for (const [c, r] of openGrass(l))
      for (const t of tall) expect(Math.abs(c - t.x) <= 1 && r - t.z >= -1 && r - t.z <= (['bush', 'hedge', 'flower'].includes(t.k) ? 1 : 2), `${c},${r} by ${t.id}`).toBe(false);
  });
  test('the same on every phone for a date, another the next day; on open grass, the dig spots apart from the weeds', () => {
    const a = daySpots(l, '2026-11-04', 'island-fund'), b = daySpots(layoutOf([]), '2026-11-04', 'island-fund');
    expect(b).toEqual(a);
    expect(daySpots(l, '2026-11-05', 'island-fund').lawn).not.toEqual(a.lawn);
    expect(a.lawn).toHaveLength(15);
    expect(a.dig).toHaveLength(8);
    const open = new Set(openGrass(l).map(([c, r]) => `${c},${r}`));
    for (const [x, z] of [...a.lawn, ...a.dig]) expect(open.has(tileAt(x, z).join(','))).toBe(true);
    const digTiles = new Set(a.dig.map(([x, z]) => tileAt(x, z).join(',')));
    for (const [x, z] of a.lawn) expect(digTiles.has(tileAt(x, z).join(','))).toBe(false);
  });
  test('a tile that turns to water or under a new thing is never a spot', () => {
    const [c, r] = openGrass(l)[10];
    const wet = withChanges(l, { tiles: [[c, r, codeOf('pond', l.tier(c, r))]] });
    expect(openGrass(wet).some(([a, b]) => a === c && b === r)).toBe(false);
    const built = withChanges(l, { set: [{ id: 'o1', k: 'brick-well', x: c, z: r, f: 0 }] });
    expect(openGrass(built).some(([a, b]) => a === c && b === r)).toBe(false);
  });
});

/** The user's island: the record, then the shop and the museum where they put them (exit.test.ts's). */
function userLayout(): Layout {
  const m = new Map<string, LayoutEntry>();
  const extra = [{ who: 'A', sc: 'o', id: 'shop', at: 1.8e12, k: 'shop', x: 7, z: 49, f: 0 }, { who: 'A', sc: 'o', id: 'museum', at: 1.8e12 + 1, k: 'museum', x: 9, z: 18, f: 0 }];
  for (const { who, ...r } of [...(RECORD as Record<string, unknown>[]), ...extra]) {
    const op = layoutOpOf(r);
    if (op) mergeLayout(m, { ...op, who } as LayoutEntry);
  }
  return layoutOf(m);
}

describe('what one stands before keeps the day’s spots off the ground its art covers behind it (clear.ts tapCovered)', () => {
  // (the board's 60u art, a button, covers the ground to ~88u past its back on screen at every zoom: a dig spot there
  // hid once the camera settled and showed while it moved, flickering behind the board: 2026-11-06 on the user's
  // island. K.K. on his stool stands 75u: four rows, where the board's three left his fourth open)
  for (const [k, rows] of [['board', 3], ['kk-stool', 4]] as const)
    for (const [name, g] of [['the default', l], ['the user’s record', userLayout()]] as const)
      test(`${k}, ${name}: no weed or dig spot within ${rows} rows behind it, nor a tile each side`, () => {
        expect(frontRows(k)).toBe(rows);
        const b = [...g.objects.values()].find((o) => o.k === k)!;
        const tiles = objTiles(g, b), behind = (c: number, r: number) => tiles.some(([bc, br]) => Math.abs(c - bc) <= 1 && r - br >= 1 && r - br <= rows);
        for (const [c, r] of openGrass(g)) expect(behind(c, r), `${c},${r}`).toBe(false);
        for (let d = 1; d <= 61; d++) {
          const date = new Date(Date.UTC(2026, 10, d)).toISOString().slice(0, 10), { dig, lawn } = daySpots(g, date, 'island-fund');
          for (const [x, z] of [...dig, ...lawn]) expect(behind(...tileAt(x, z)), `${date} ${x},${z}`).toBe(false);
        }
      });
  test('K.K. moved onto the open lawn: the fourth row behind him kept clear too (the board’s three left it open)', () => {
    const k = [...l.objects.values()].find((o) => o.k === 'kk-stool')!, m = withChanges(l, { set: [{ ...k, x: 8, z: 8 }] });
    expect(m.kind(8, 12)).toBe('grass');
    for (let i = -1; i <= 1; i++) expect(tapCovered(m).has(`${8 + i},12`), `${8 + i},12`).toBe(true);
    expect(openGrass(m).some(([c, r]) => r === 12 && Math.abs(c - 8) <= 1)).toBe(false);
  });
});

describe('the visitors’ stage and Gulliver’s beach, from the layout (spots.ts)', () => {
  const villagers = (g: Layout) => [...g.objects.values()].filter((o) => o.k === 'spot' && o.s !== 'stage').map((o) => objMid(g, o));
  for (const [name, g] of [['the default', l], ['the user’s record', userLayout()]] as const)
    test(`${name}: on open, walkable grass with a clear patch round it, near the middle a little behind the villagers (in view as the island opens)`, () => {
      const s = stageOf(g)!, nav = navOf(g);
      expect(s).toBeTruthy();
      expect(reachable(nav, s[0], s[1])).toBe(true);
      expect(openGrass(g).some(([c, r]) => tileAt(s[0], s[1]).join() === `${c},${r}`)).toBe(true);
      // a tile clear each side, behind and in front (the cake): no water, nothing standing there
      const [c, r] = tileAt(s[0], s[1]);
      const taken = new Set([...g.objects.values()].flatMap((o) => objTiles(g, o).map((t) => t.join())));
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) expect(['grass', 'dirt', 'stone', 'brick', 'plank'].includes(g.kind(c + i, r + j)) && !taken.has(`${c + i},${r + j}`), `${c + i},${r + j}`).toBe(true);
      // the middle of the lawn, behind the villagers' spots, well in front of the homes at the back
      const vz = Math.max(...villagers(g).map((p) => p[1]));
      expect(Math.abs(s[0] - 195)).toBeLessThan(120);
      expect(s[1] - vz).toBeGreaterThan(30);
      expect(s[1] - vz).toBeLessThanOrEqual(320);
      for (const v of villagers(g)) expect(Math.hypot(s[0] - v[0], s[1] - v[1])).toBeGreaterThan(60);
      // the same on every phone; the day's weeds and fossils keep off it
      expect(stageOf(g === l ? defaultLayout() : userLayout())).toEqual(s);
      for (const [x, z] of [...daySpots(g, '2026-11-04', 'island-fund').lawn, ...daySpots(g, '2026-11-04', 'island-fund').dig]) expect(Math.hypot(x - s[0], z - s[1])).toBeGreaterThan(30);
    });
  test('it moves with the layout: a well put on it sends the visitors to the next clear patch', () => {
    const s = stageOf(l)!, [c, r] = tileAt(s[0], s[1]);
    const moved = stageOf(withChanges(l, { set: [{ id: 'o1', k: 'brick-well', x: c, z: r, f: 0 }] }))!;
    expect(moved).not.toEqual(s);
    expect(Math.abs(moved[0] - 195)).toBeLessThanOrEqual(150);
    expect(moved[1]).toBeLessThan(800);
  });
  test('Gulliver washes up on the front beach’s sand by the sea, in the middle, somewhere new some days, the same on every phone', () => {
    for (const g of [l, userLayout()]) {
      const days = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07'];
      const at = days.map((d) => washedUp(g, d, 'island-fund')!);
      expect(new Set(at.map((p) => p.join())).size).toBeGreaterThan(1);
      for (const [i, p] of at.entries()) {
        expect(washedUp(g, days[i], 'island-fund')).toEqual(p);
        expect(g.kind(...tileAt(p[0], p[1] - 1))).toBe('sand');
        expect(Math.abs(p[0] - 195)).toBeLessThanOrEqual(135);
        expect(p[1]).toBeLessThan(extentOf(g).shore + 90);
      }
    }
  });
});

describe('the visitors’ spots: the members’ marks (spots.ts markerSpot)', () => {
  const auto = stageOf(l)!, [ac, ar] = tileAt(auto[0], auto[1]);
  // a tile the plaza may go on, well away from the usual spot; one more for a move
  const ok = openGrass(l).filter(([c, r]) => plazaOk(l, c, r) && Math.hypot(c - ac, r - ar) > 4);
  const [pc, pr] = ok[0], [qc, qr] = ok.find(([c, r]) => Math.hypot(c - pc, r - pr) > 4 && guestOk(l, c, r))!;
  const mark = (g: Layout, id: string, k: string, x: number, z: number) => withChanges(g, { set: [{ id, k, x, z, f: 0 }] });
  test('the plaza: they stand on it, it moves them, the day’s weeds and fossils keep off it; a mark gone, or nobody able to stand there, the usual spot', () => {
    const bad: string[] = [];
    const want = (what: string, got: unknown, exp: unknown) => JSON.stringify(got) === JSON.stringify(exp) || bad.push(`${what}: ${JSON.stringify(got)} ≠ ${JSON.stringify(exp)}`);
    const marked = mark(l, 'o1', 'plaza', pc, pr);
    want('on it', stageOf(marked), tileMid(pc, pr));
    want('every phone', stageOf(mark(defaultLayout(), 'o1', 'plaza', pc, pr)), tileMid(pc, pr));
    want('moved', stageOf(mark(marked, 'o1', 'plaza', qc, qr)), tileMid(qc, qr));
    want('gone', stageOf(withChanges(marked, { remove: ['o1'] })), auto);
    want('takes no ground', openGrass(marked), openGrass(l));
    want('no issue', validate(marked).filter((i) => i.code === 'visitor-spot').length, 0);
    for (const [x, z] of [...daySpots(marked, '2026-11-04', 'island-fund').lawn, ...daySpots(marked, '2026-11-04', 'island-fund').dig])
      if (Math.hypot(x - tileMid(pc, pr)[0], z - tileMid(pc, pr)[1]) <= 30) bad.push(`a weed or a fossil at ${x},${z}`);
    // a well put on it, or beside it: the usual spot (of the layout with the well), and the editor's warning
    for (const [dx, why] of [[0, 'on it'], [1, 'beside it']] as const) {
      const walled = mark(marked, 'o2', 'brick-well', pc + dx, pr);
      want(`a well ${why}`, stageOf(walled), stageOf(withChanges(walled, { remove: ['o1'] })));
      want(`a well ${why}: the warning, the well named and marked`, validate(walled).filter((i) => i.code === 'visitor-spot').map((i) => [i.level, i.ids, i.ja, i.tiles.some(([c, r]) => c === pc + dx && r === pr)]),
        [['warn', ['o1', 'o2'], `お客さんの場所に立てない：${dx ? '横に' : ''}レンガのいど${dx ? 'があります' : 'の上です'}（いつもの場所に立ちます）`, true]]);
      want(`a well ${why}: no overlap`, validate(walled).filter((i) => i.code === 'overlap').length, 0);
    }
    // on the water, on sand: never
    for (const [c, r] of [[pc, pr], [pc, pr + 1]] as const) if (plazaOk(withChanges(l, { tiles: [[c, r, codeOf('pond', l.tier(c, r))]] }), pc, pr)) bad.push(`water at ${c},${r}`);
    // two put down at once (two phones): the later one
    want('the later', markerOf(mark(marked, 'o0', 'plaza', qc, qr), 'plaza')?.id, 'o1');
    expect(bad).toEqual([]);
  });
  test('Gulliver’s: he lies on it every day, the dated pick when it’s gone or off the sand', () => {
    const bad: string[] = [];
    const sand: [number, number][] = [];
    for (let r = 0; r < 60; r++) for (let c = 0; c < 20; c++) if (beachOk(l, c, r)) sand.push([c, r]);
    const [bc, br] = sand[0] ?? [-1, -1];
    const days = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'];
    const g = mark(l, 'o3', 'beach-spot', bc, br);
    for (const d of days) {
      if (JSON.stringify(washedUp(g, d, 'island-fund')) !== JSON.stringify(tileMid(bc, br))) bad.push(`${d}: not on it`);
      // on the grass (the plaza's tile): the dated pick, as without it
      if (JSON.stringify(washedUp(mark(l, 'o3', 'beach-spot', pc, pr), d, 'island-fund')) !== JSON.stringify(washedUp(l, d, 'island-fund'))) bad.push(`${d}: off the sand`);
    }
    // the plaza is the others': it never moves him, his never moves them
    if (JSON.stringify(stageOf(g)) !== JSON.stringify(auto)) bad.push('his moved the stage');
    expect([sand.length > 0, bad]).toEqual([true, []]);
  });
  test('the guest’s: they stand on it; none down (or nobody can stand there): the fallback, centre stage or beside it', () => {
    // none down: no guest spot (the guest at centre stage), and the stage-side spot 2-3 tiles across, usable
    expect(guestSpot(l)).toBeNull();
    const side = besideStage(l)!, [sc, sr] = tileAt(side[0], side[1]);
    expect([Math.abs(sc - ac) >= 2 && Math.abs(sc - ac) <= 3, Math.abs(sr - ar) <= 1, guestOk(l, sc, sr)]).toEqual([true, true, true]);
    // put down: there; the stage and the day's weeds unmoved by it, the weeds kept off it
    const g = mark(l, 'o4', 'guest-spot', qc, qr);
    expect(guestSpot(g)).toEqual(tileMid(qc, qr));
    expect(stageOf(g)).toEqual(auto);
    expect(daySpots(g, '2026-11-04', 'island-fund').lawn.every(([x, z]) => Math.abs(tileAt(x, z)[0] - qc) > 1 || Math.abs(tileAt(x, z)[1] - qr) > 3)).toBe(true);
    // something put on it: the fallback, and the editor's warning
    const walled = mark(g, 'o5', 'brick-well', qc, qr);
    expect(guestSpot(walled)).toBeNull();
    expect(validate(walled).filter((i) => i.code === 'visitor-spot').map((i) => i.ids)).toEqual([['o4', 'o5']]);
    expect(layoutOpOf({ sc: 'o', id: 'o4', at: 1.8e12, k: 'guest-spot', x: 9, z: 30, f: 0 })).toMatchObject({ k: 'guest-spot' });
  });
  test('an op of the new kinds passes the contract as it is (no relay change; an older app keeps it as a thing it doesn’t know)', () => {
    expect([layoutOpOf({ sc: 'o', id: 'o1', at: 1.8e12, k: 'plaza', x: 9, z: 30, f: 0 }), layoutOpOf({ sc: 'o', id: 'o2', at: 1.8e12, k: 'beach-spot', x: 9, z: 3, f: 0 })].map((o) => (o && 'k' in o ? o.k : null))).toEqual(['plaza', 'beach-spot']);
  });
});

describe('the guest’s and Gulliver’s rules, relaxed (2026-11-11: what they draw and where they walk), and why a spot fails (spots.ts spotWhy)', () => {
  const put = (g: Layout, ...os: [string, string, number, number][]) => withChanges(g, { set: os.map(([id, k, x, z]) => ({ id, k, x, z, f: 0 as const })) });
  const why = (g: Layout, k: 'plaza' | 'guest-spot' | 'beach-spot', c: number, r: number) => spotWhy(g, k, c, r).map((w) => w.why);
  /** Gulliver's old rule: sand under him and each side, nothing a tile round his tile, three in front of a thing. */
  const oldBeachOk = (g: Layout, c: number, r: number) =>
    [-1, 0, 1].every((i) => g.kind(c + i, r) === 'sand') && ![...g.objects.values()].some((o) => !['plaza', 'guest-spot', 'beach-spot'].includes(o.k) && objTiles(g, o).some(([a, b]) => Math.abs(a - c) <= 1 && r - b >= -3 && r - b <= 1));
  // an open tile for the guest (grass, nothing round it for two tiles) and a beach tile for Gulliver, on the default
  // (the guest's tile: open grass usable as the plaza, what stands within two tiles of it and three rows taken away)
  const open = openGrass(l).find(([c, r]) => plazaOk(l, c, r) && guestOk(l, c, r))!;
  const bare = withChanges(l, { remove: [...l.objects.values()].filter((o) => o.k !== 'home' && objTiles(l, o).some(([a, b]) => Math.abs(a - open[0]) <= 2 && Math.abs(b - open[1]) <= 3)).map((o) => o.id) });
  const sand: [number, number][] = [];
  for (let r = 0; r < 60; r++) for (let c = 1; c < 19; c++) if (beachOk(l, c, r) && oldBeachOk(l, c, r) && beachOk(l, c, r + 2)) sand.push([c, r]);
  test('the guest: next to a flower, a fence (the old 3×3 patch refused each); never on water, a building, a door, out of reach or hidden', () => {
    const [c, r] = open;
    const fence = KIND_LIST.find((d) => d.group === 'fence')!.k;
    const passes = [put(bare, ['f1', 'flower', c + 1, r]), put(bare, ['f1', fence, c - 1, r]), put(bare, ['f1', 'flower', c + 1, r], ['f2', fence, c - 1, r], ['f3', 'flower', c, r - 2])];
    expect(passes.map((g) => [guestOk(g, c, r), plazaOk(g, c, r)])).toEqual(passes.map(() => [true, false]));
    expect(validate(put(passes[2], ['gs', 'guest-spot', c, r])).filter((i) => i.code === 'visitor-spot')).toEqual([]);
    const wet = withChanges(bare, { tiles: [[c, r, codeOf('pond', l.tier(c, r))]] });
    const ringed = withChanges(bare, { tiles: [-1, 0, 1].flatMap((i) => [-1, 0, 1].filter((j) => i || j).map((j) => [c + i, r + j, codeOf('pond', l.tier(c, r))] as [number, number, number])) });
    const museum = l.objects.get('museum') ?? [...l.objects.values()].find((o) => o.k === 'home')!;
    const [mc, mr] = objTiles(l, museum)[0];
    expect([why(wet, 'guest-spot', c, r), why(ringed, 'guest-spot', c, r), why(bare, 'guest-spot', mc, mr), why(put(bare, ['t1', 'oak', c, r - 1]), 'guest-spot', c, r), why(put(bare, ['t1', 'flower', c, r + 1]), 'guest-spot', c, r)])
      .toEqual([['water'], ['unreachable'], ['on'], ['hidden'], ['covers']]);
    const home = l.objects.get('home-A')!, [dc, dr] = doorOf(l, home).tiles[0];
    expect(why(l, 'guest-spot', dc, dr)).toEqual(['door']);
  });
  test('Gulliver: by a palm, behind his feet or three rows before it (the old clearance refused both); never off the sand, on a thing, out of reach, hidden or under its fronds', () => {
    expect(sand.length).toBeGreaterThan(0);
    const [c, r] = sand[0];
    for (const [pc, pr] of [[c + 1, r + 2], [c, r + 3], [c + 3, r]] as const) {
      const g = put(l, ['p1', 'palm', pc, pr]);
      expect([`${pc - c},${pr - r}`, beachOk(g, c, r)]).toEqual([`${pc - c},${pr - r}`, true]);
      if (pc - c !== 3) expect(oldBeachOk(g, c, r)).toBe(false);
    }
    const grass = withChanges(l, { tiles: [[c + 1, r, codeOf('grass', l.tier(c, r))]] }), wet = withChanges(l, { tiles: [[c - 1, r, codeOf('sea', 0)]] });
    const ringed = withChanges(l, { tiles: [-2, -1, 0, 1, 2].flatMap((i) => [-1, 1].map((j) => [c + i, r + j, codeOf('pond', 0)] as [number, number, number])).concat([[c - 2, r, codeOf('pond', 0)], [c + 2, r, codeOf('pond', 0)]]) });
    expect([why(grass, 'beach-spot', c, r), why(wet, 'beach-spot', c, r), why(put(l, ['w1', 'brick-well', c + 1, r]), 'beach-spot', c, r), why(put(l, ['p1', 'palm', c, r - 1]), 'beach-spot', c, r), why(ringed, 'beach-spot', c, r), why(put(l, ['p1', 'palm', c, r + 1]), 'beach-spot', c, r), why(put(l, ['p1', 'palm', c + 2, r]), 'beach-spot', c, r)])
      .toEqual([['sand'], ['water'], ['beside'], ['hidden'], ['unreachable'], ['covers'], ['hidden']]);
  });
  test('the warning says why in words (kanji, and English) and marks the tiles that block', () => {
    const [c, r] = open;
    const g = put(bare, ['pz', 'plaza', c, r], ['f1', 'flower', c + 1, r]);
    const is = validate(g).filter((i) => i.code === 'visitor-spot');
    expect(is.map((i) => [i.ja, i.en, i.ids, i.tiles])).toEqual([['お客さんの場所に立てない：横に花があります（いつもの場所に立ちます）', "Nobody can stand at the visitors' spot: a flower beside it (the usual spot instead)", ['pz', 'f1'], [[c, r], [c + 1, r]]]]);
    const [bc, br] = sand[0];
    const off = validate(put(withChanges(l, { tiles: [[bc + 1, br, codeOf('grass', 0)]] }), ['bs', 'beach-spot', bc, br])).find((i) => i.code === 'visitor-spot')!;
    expect([off.ja, off.tiles]).toEqual(['ジョニーの場所に立てない：砂浜ではありません（いつもの場所に立ちます）', [[bc, br], [bc + 1, br]]]);
    const step = withChanges(bare, { tiles: [[c, r + 1, codeOf('grass', l.tier(c, r) + 1)]] });
    expect(validate(put(step, ['pz', 'plaza', c, r])).find((i) => i.code === 'visitor-spot')!.ja).toContain('段差があります');
  });
});

describe('the old fixed visitors’ spot (spot variant "stage") is gone from the layout (model.ts isLegacyStage)', () => {
  test('not in the default; an older record’s op of it or an export with it reads as before, without it', () => {
    const stage = { id: 'spot-stage', k: 'spot', x: 8, z: 45, f: 0 as const, s: 'stage' };
    expect([...l.objects.values()].filter((o) => o.s === 'stage')).toEqual([]);
    const m = new Map<string, LayoutEntry>();
    for (const r of [{ sc: 'o', ...stage, at: 1.7e12 }, { sc: 'o', id: 'o9', k: 'flower', x: 9, z: 30, f: 0, s: 'c1', at: 1.7e12 + 1 }]) mergeLayout(m, { ...layoutOpOf(r)!, who: 'A' } as LayoutEntry);
    const g = layoutOf(m);
    expect([g.objects.has('spot-stage'), g.objects.has('o9'), stageOf(g)]).toEqual([false, true, stageOf(withChanges(l, { set: [{ id: 'o9', k: 'flower', x: 9, z: 30, f: 0, s: 'c1' }] }))]);
    const j = toJson(l);
    expect(fromJson({ ...j, objects: [...j.objects, stage] })!.objects.has('spot-stage')).toBe(false);
  });
});

describe('the old decorations into the layout, once (migrate.ts)', () => {
  const placed = [
    { id: 'dabc1234', item: 'tanuki', x: 120, z: 400, f: 1 as const, at: 1_800_000_000_000, who: 'A' as const },
    { id: 'dbbb1234', item: 'brick-well', x: 200, z: 900, f: 0 as const, at: 1_800_000_000_100, who: 'B' as const }
  ];
  test('mine only, on its tile, おく moved back; never twice; none for the guest (it placed none)', () => {
    const ops = migrationOps(new Map(), placed, 'A');
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ sc: 'o', id: migratedId('dabc1234'), k: 'tanuki', f: 1 });
    const b = migrationOps(new Map(), placed, 'B')[0] as { z: number };
    expect(-90 + b.z * 30 + 30).toBeGreaterThan(900 + 400);
    const m = new Map<string, LayoutEntry>([[`o|${migratedId('dabc1234')}`, { ...ops[0], who: 'A' } as LayoutEntry]]);
    expect(migrationOps(m, placed, 'A')).toEqual([]);
    expect(migrationOps(new Map(), placed, 'G')).toEqual([]);
  });
});
