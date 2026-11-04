// The sea's fishing coasts (coast.ts): on the default island and the user's (the record of 2026-11-03), every stretch
// of coast gets sea shadows over a day of ambient life, each on the sea along the shore.
import { afterAll, describe, expect, test } from 'vitest';
import RECORD from '#lib/layout/record-2026-11-03.json' with { type: 'json' };
import { defaultLayout, layoutOf, type Layout } from '#lib/layout/model.ts';
import { GRID, tileAt, tileMid } from '#lib/layout/grid.ts';
import { layoutOpOf, mergeLayout, type LayoutEntry } from '#lib/contract/layout.ts';
import { worldOf } from './layoutWorld.ts';
import { setWorld, layoutNav, SEA_BOX } from './world.ts';
import { COAST_U, coasts } from './coast.ts';
import { crittersAt, SLOTS_PER_DAY } from './ambient.ts';
import { fishPath } from './critterPath.ts';
import { STAY_MS, swimmable, waterAt } from './critters.ts';

function userLayout(): Layout {
  const m = new Map<string, LayoutEntry>();
  const extra = [{ who: 'A', sc: 'o', id: 'shop', at: 1.8e12, k: 'shop', x: 7, z: 49, f: 0 }, { who: 'A', sc: 'o', id: 'museum', at: 1.8e12 + 1, k: 'museum', x: 9, z: 18, f: 0 }];
  for (const { who, ...r } of [...(RECORD as Record<string, unknown>[]), ...extra]) {
    const op = layoutOpOf(r);
    if (op) mergeLayout(m, { ...op, who } as LayoutEntry);
  }
  return layoutOf(m);
}

afterAll(() => setWorld(null));

/** The shore (the middles of the land tiles beside the sea) of the island now. */
function shorePoints(): [number, number][] {
  const l = layoutNav()!.layout, out: [number, number][] = [];
  for (let r = 0; r < GRID.rows; r++)
    for (let c = 0; c < GRID.cols; c++) {
      const k = l.kind(c, r);
      if (k === 'sea' || k === 'river' || k === 'pond') continue;
      if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dr]) => l.kind(c + dc, r + dr) === 'sea')) continue;
      out.push(tileMid(c, r));
    }
  return out;
}

const DATE = '2026-11-04';

for (const [name, layout] of [['the default island', defaultLayout], ['the user’s island', userLayout]] as const)
  describe(`${name}: sea shadows all round the coast`, () => {
    test('the stretches: one per COAST_U of coastline, every side of the island, the first off the front beach', () => {
      setWorld(worldOf(layout()));
      const all = coasts();
      const len = all.reduce((s, c) => s + c.len, 0);
      expect(all.length).toBe(Math.round(len / COAST_U));
      expect(new Set(all.map((c) => c.side))).toEqual(new Set(['front', 'back', 'left', 'right']));
      expect(all[0].side).toBe('front');
      // (the front's straight out from the old strip off the front beach)
      expect(all[0].area.cz).toBeLessThan(SEA_BOX.z1);
      expect(Math.abs(all[0].area.cx - (SEA_BOX.x0 + SEA_BOX.x1) / 2)).toBeLessThan(90);
      // the same stretches from the same layout (both phones: a world built anew cuts them alike)
      const again = (setWorld(worldOf(layout())), coasts());
      expect(again).not.toBe(all);
      expect(again).toEqual(all);
      // every tile once
      const tiles = all.flatMap((c) => c.area.tiles!.map((t) => t.join()));
      expect(new Set(tiles).size).toBe(tiles.length);
    });

    test('a simulated day: shadows off every stretch of shore (each tile of it a shadow within 4 tiles); every waypoint on the sea along the shore (within 4 tiles of it), its glides by sea', () => {
      setWorld(worldOf(layout()));
      const all = coasts(), shore = shorePoints();
      const got = new Array(all.length).fill(0);
      const bad: string[] = [], swum = new Set<string>();
      const near = (x: number, z: number) => shore.some(([sx, sz]) => (sx - x) ** 2 + (sz - z) ** 2 <= 120 ** 2);
      for (let slot = 0; slot < SLOTS_PER_DAY; slot += 1)
        for (const c of crittersAt(DATE, slot, all.length)) {
          if (c.slot !== slot || c.kind !== 'fish') continue;
          got[c.coast ?? 0]++;
          // (every fourth spawn walked through: the day's ~4,000 shadows' paths all is many seconds)
          if (slot % 4) continue;
          const p = fishPath(c.seed, 'sea', STAY_MS.fish, c.coast)!;
          let at = p.start;
          for (const q of [p.start, ...p.legs]) {
            if (waterAt(q.x, q.z) !== 'sea') bad.push(`${c.coast}: ${q.x.toFixed(0)},${q.z.toFixed(0)} not on the sea`);
            else if (!near(q.x, q.z)) bad.push(`${c.coast}: ${q.x.toFixed(0)},${q.z.toFixed(0)} off the coast`);
            if (!swimmable('sea', at.x, at.z, q.x, q.z)) bad.push(`${c.coast}: a glide over land to ${q.x.toFixed(0)},${q.z.toFixed(0)}`);
            at = q;
            swum.add(tileAt(q.x, q.z).join());
          }
        }
      expect(bad.slice(0, 10)).toEqual([]);
      // each stretch: a shadow most of the day (≈ 0.9 × 86,400 s / ~50 s a stay → ~1,500 each)
      expect(got.filter((n) => n < 800)).toEqual([]);
      // every shore tile: a shadow within 4 tiles of it some time in the day (the old front-only sea: none
      // off the sides or the back)
      const lonely = new Set<string>();
      for (const [x, z] of shore) {
        const [c, r] = tileAt(x, z);
        let seen = false;
        for (let dc = -4; dc <= 4 && !seen; dc++) for (let dr = -4; dr <= 4 && !seen; dr++) seen = swum.has(`${c + dc},${r + dr}`);
        if (!seen) lonely.add(`${c},${r}`);
      }
      expect([...lonely]).toEqual([]);
    });
  });
