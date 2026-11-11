// The shop's floor plan (plan.ts): today's stock as shown in the room, the walk round it, the walls' sides.
import { describe, expect, it } from 'vitest';
import { stockOf as stockOn } from '#lib/contract/stock.ts';
import { addDays } from '#lib/time/dates.ts';
import { footprint, ITEMS } from '../tent/items.ts';
import { isWallItem } from '../tent/grid.ts';
import { COUNTER_FRONT, DOOR_IN, SIGN, TWINS_BOX, atCounter, corners, inHull, RECT, TWINS, WALL_ZONE, ZONES, blocked, display, side, standable, walkPath } from './plan.ts';

import { packOf } from './stock.ts';

const days = Array.from({ length: 30 }, (_, i) => addDays('2026-11-01', i));
/** A day's stock as the phones draw it (by packs from contract/stock.ts UNITS_FROM). */
const stockOf = (d: string) => stockOn(d, undefined, packOf);
/** A shown piece's box on its zone's top (model units: x0, x1, z0, z1) and the zone it's in. */
const boxOf = (s: ReturnType<typeof display>['shown'][number]) => {
  const [w, d] = footprint(s.item, s.f);
  return [s.at[0] - w * 5, s.at[0] + w * 5, s.at[1] - d * 5, s.at[1] + d * 5] as const;
};
const overlap = (a: readonly number[], b: readonly number[]) => a[0] < b[1] - 0.01 && b[0] < a[1] - 0.01 && a[2] < b[3] - 0.01 && b[2] < a[3] - 0.01;

describe('shop plan: the day’s stock in the room', () => {
  it('the same on every phone: a day’s stock is shown alike each time, every piece shown or in the list once', () => {
    for (const d of days) {
      const stock = stockOf(d);
      const a = display(stock), b = display([...stock]);
      expect(a).toEqual(b);
      expect([...a.shown.map((s) => s.item), ...a.rest].sort()).toEqual([...stock].sort());
    }
  });

  it('most of a day’s stock has a place (the rest in the list)', () => {
    // (about half: NH's whole catalogue since 2026-11-10, a day may bring a few big pieces, a vehicle, a castle wall; by
    // packs, a pack's big ones side by side: 11 on 2 days of 400, the median 21 either way)
    for (const d of days) expect(display(stockOf(d)).shown.length, d).toBeGreaterThanOrEqual(11);
  });

  it('each piece within its zone, none over another, on the zone’s top; wall things on the back wall', () => {
    for (const d of days) {
      const { shown } = display(stockOf(d));
      const floor = shown.filter((s) => !isWallItem(s.item));
      for (const s of floor) {
        const z = ZONES.find((x) => x.y === s.y && s.at[0] > x.x0 && s.at[0] < x.x0 + x.cols * 10 && s.at[1] > x.z0 && s.at[1] < x.z0 + x.rows * 10);
        expect(z, `${d} ${s.item}`).toBeTruthy();
        const [x0, x1, z0, z1] = boxOf(s);
        expect(x0).toBeGreaterThanOrEqual(z!.x0 - 0.01);
        expect(x1).toBeLessThanOrEqual(z!.x0 + z!.cols * 10 + 0.01);
        expect(z0).toBeGreaterThanOrEqual(z!.z0 - 0.01);
        expect(z1).toBeLessThanOrEqual(z!.z0 + z!.rows * 10 + 0.01);
        if (z!.small) expect(ITEMS[s.item].sm, s.item).toBe(1);
      }
      for (let i = 0; i < floor.length; i++) for (let j = i + 1; j < floor.length; j++) {
        if (floor[i].y !== floor[j].y) continue;
        expect(overlap(boxOf(floor[i]), boxOf(floor[j])), `${d} ${floor[i].item} ${floor[j].item}`).toBe(false);
      }
      const walls = shown.filter((s) => isWallItem(s.item));
      for (const s of walls) {
        expect(s.y).toBe(WALL_ZONE.y);
        expect(s.at[0] - ITEMS[s.item].w * 5).toBeGreaterThanOrEqual(WALL_ZONE.x0 - 0.01);
        expect(s.at[0] + ITEMS[s.item].w * 5).toBeLessThanOrEqual(WALL_ZONE.x0 + WALL_ZONE.cols * 10 + 0.01);
      }
      for (let i = 0; i < walls.length; i++) for (let j = i + 1; j < walls.length; j++)
        expect(Math.abs(walls[i].at[0] - walls[j].at[0]) * 2 >= (ITEMS[walls[i].item].w + ITEMS[walls[j].item].w) * 10 - 0.01).toBe(true);
    }
  });

  it('small things go on the table first; the largest first on the stage', () => {
    const small = Object.keys(ITEMS).filter((c) => ITEMS[c].sm && ITEMS[c].w === 1 && ITEMS[c].d === 1 && !ITEMS[c].wl).slice(0, 3);
    const { shown } = display(small);
    expect(shown.filter((s) => s.y === 5).map((s) => s.item)).toEqual(small.slice(0, 2));
    const big = Object.keys(ITEMS).find((c) => ITEMS[c].w === 2 && ITEMS[c].d === 2 && !ITEMS[c].wl)!;
    const one = Object.keys(ITEMS).find((c) => ITEMS[c].w === 1 && ITEMS[c].d === 1 && !ITEMS[c].sm && !ITEMS[c].wl)!;
    const r = display([one, big]);
    expect(r.shown.find((s) => s.item === big)).toMatchObject({ y: 8, at: [-58, -38] });
  });

  it('a piece with no model, or no place left, is in the list', () => {
    expect(display(['f0-none']).rest).toEqual(['f0-none']);
    const ones = Object.keys(ITEMS).filter((c) => ITEMS[c].w === 1 && ITEMS[c].d === 1 && !ITEMS[c].sm && !ITEMS[c].wl).slice(0, 40);
    const r = display(ones);
    // the stage's 24 tiles and the floor's 3
    expect(r.shown).toHaveLength(27);
    expect(r.rest).toEqual(ones.slice(27));
  });
});

describe('shop plan: the walk', () => {
  const b = blocked([]);
  it('from the door to the counter, every step on the floor', () => {
    const pts = walkPath(b, DOOR_IN, COUNTER_FRONT);
    expect(pts.at(-1)).toEqual(COUNTER_FRONT);
    for (const p of pts) expect(standable(b, p), String(p)).toBe(true);
  });
  it('never onto the stage, behind the counter or through a piece shown on the floor', () => {
    expect(standable(b, [-30, -30])).toBe(false);
    expect(standable(b, TWINS.timmy)).toBe(false);
    expect(standable(b, [0, 10])).toBe(false);
    const piece = Object.keys(ITEMS).find((c) => ITEMS[c].w === 1 && ITEMS[c].d === 1 && !ITEMS[c].sm && !ITEMS[c].wl)!;
    const lots = Array.from({ length: 27 }, () => piece);
    // (one piece shown 27 times: the stage's, then the floor by the left wall)
    const shown = display(lots).shown.map((s, i) => ({ ...s, id: `s${i}` }));
    const onFloor = shown.filter((s) => s.y === 0);
    expect(onFloor.length).toBeGreaterThan(0);
    const bb = blocked(shown);
    for (const s of onFloor) expect(standable(bb, s.at)).toBe(false);
    const end = walkPath(bb, DOOR_IN, onFloor[0].at).at(-1)!;
    expect(standable(bb, end)).toBe(true);
  });
  it('a tap off the floor walks as near as it can', () => {
    const end = walkPath(b, DOOR_IN, [-40, -30]).at(-1)!;
    expect(standable(b, end)).toBe(true);
    expect(end[1]).toBeGreaterThan(3);
  });
});

describe('shop plan: the walls’ sides (the cutaway)', () => {
  it('each wall of the L by its side; the floor and what stands on it none', () => {
    expect(side(RECT[0] - 1, 10, 0)).toBe(1);
    expect(side(RECT[1] + 1, 10, 20)).toBe(2);
    expect(side(0, 10, RECT[2] - 1)).toBe(0);
    expect(side(23, 10, -20)).toBe(2);
    expect(side(40, 10, 4)).toBe(0);
    expect(side(0, 0.2, 0)).toBeNull();
    expect(side(50, 8, 25)).toBeNull();
  });
});

describe('shop plan: at the counter (the twins’ hello)', () => {
  it('the counter’s front is at the counter; the door, the stage and the shop floor aren’t', () => {
    expect(atCounter(COUNTER_FRONT)).toBe(true);
    expect(atCounter(DOOR_IN)).toBe(false);
    expect(atCounter([DOOR_IN[0] + 8, DOOR_IN[1] - 12])).toBe(false);
    expect(atCounter([0, 10])).toBe(false);
    expect(atCounter([-40, 12])).toBe(false);
  });
});

describe('shop plan: where a tap talks to the twins', () => {
  it('their box is over the counter corner one never walks on, the twins inside it; the floor in front walks', () => {
    const [x0, x1, , , z0, z1] = TWINS_BOX, b = blocked([]);
    for (let x = x0; x <= x1; x += 2) for (let z = z0; z <= z1; z += 2) expect(standable(b, [x, z]), `${x},${z}`).toBe(false);
    for (const t of Object.values(TWINS)) expect(t[0] > x0 && t[0] < x1 && t[1] > z0 && t[1] < z1).toBe(true);
    expect(standable(b, COUNTER_FRONT)).toBe(true);
    expect(standable(b, [SIGN[0], SIGN[2] - 4])).toBe(true);
  });
  it('a point is in the hull of a box’s corners as projected, or not', () => {
    const sq = corners([0, 10, 0, 10, 0, 1]).map(([x, y]) => [x, y] as const);
    expect([inHull(sq, 5, 5), inHull(sq, 0, 0), inHull(sq, 11, 5), inHull(sq, 5, -1)]).toEqual([true, true, false, false]);
  });
});
