import { describe, expect, it } from 'vitest';
import room from '../tent/items.json';
import { FURNITURE_CATEGORIES, ITEMS, treeFurniture, treeItem } from './catalog.ts';
import { GIFTS_A_DAY, GIFT_TREES, giftAt, giftId, giftTree, giftTreesOn, holdsGift } from './treeGifts.ts';
import { SCENERY_TREES, shakeDrop, treeById, wireDrop } from './treeShake.ts';
import { addDays } from '#lib/time/dates.ts';
import type { LocalDate } from '#lib/types.ts';
import { apply, applyRow, emptyDay, lying, rowOf } from '#lib/sync/world-day.ts';
import { dayStart } from '#lib/sync/live-protocol.ts';

const byId = new Map(ITEMS.map((i) => [i.id, i]));
const placeable = new Set(Object.values(room.items as Record<string, { cat?: string }>).flatMap((m) => (m.cat ? [m.cat] : [])));
/** A year of Tokyo days. */
const YEAR = Array.from({ length: 366 }, (_, i) => addDays('2026-01-01' as LocalDate, i));

describe('the trees’ presents (NH: two trees a day hold furniture)', () => {
  it('the same trees and pieces on every phone for a date: pure on the date and the seed', () => {
    for (const date of YEAR.slice(0, 60)) {
      expect(giftTreesOn(date)).toEqual(giftTreesOn(date));
      for (const tree of giftTreesOn(date)) expect(treeItem(date, tree)).toEqual(treeItem(date, tree));
    }
    // the days differ, and so does another island's seed
    expect(new Set(YEAR.map((d) => giftTreesOn(d).join())).size).toBeGreaterThan(30);
    expect(YEAR.slice(0, 30).some((d) => giftTreesOn(d).join() !== giftTreesOn(d, 'other').join())).toBe(true);
  });

  it('two a day, of the oaks and cedars only (not a palm, a goal tree or bamboo), each tree its turn', () => {
    expect(GIFT_TREES.length).toBeGreaterThanOrEqual(GIFTS_A_DAY);
    expect(GIFT_TREES).toEqual(SCENERY_TREES.filter((t) => t.kind === 'oak' || t.kind === 'cedar').map((t) => t.id));
    const seen = new Map<string, number>();
    for (const date of YEAR) {
      const trees = giftTreesOn(date);
      expect(trees.length).toBeLessThanOrEqual(2);
      expect(trees.length).toBe(GIFTS_A_DAY);
      expect(new Set(trees).size).toBe(trees.length);
      for (const t of trees) {
        expect(['oak', 'cedar']).toContain(treeById(t)?.kind);
        seen.set(t, (seen.get(t) ?? 0) + 1);
      }
    }
    // every oak and cedar gets its days, about evenly
    for (const t of GIFT_TREES) expect(seen.get(t) ?? 0, t).toBeGreaterThan(20);
  });

  it('furniture only, from the presents’ catalogue, that the tent can place; never Bells; the shops’ season stock in season', () => {
    const got = new Set<string>();
    for (const date of YEAR)
      for (const tree of giftTreesOn(date)) {
        const p = treeItem(date, tree);
        expect(p.kind).toBe('item');
        const it = byId.get(p.id)!;
        expect(it, p.id).toBeTruthy();
        expect(FURNITURE_CATEGORIES as readonly string[]).toContain(it.category);
        expect(placeable.has(p.id), p.id).toBe(true);
        expect(p.id).not.toMatch(/^bells?$|bell-bag|money-bag/);
        if (it.stock === 'winter') expect(['12', '01', '02']).toContain(date.slice(5, 7));
        if (it.stock === 'summer') expect(['06', '07', '08']).toContain(date.slice(5, 7));
        got.add(p.id);
      }
    expect(got.size).toBeGreaterThan(200);
    // the pool is every placeable piece of furniture of the day
    expect(treeFurniture('2026-07-01').length).toBeGreaterThan(200);
    for (const date of ['2026-07-01', '2026-12-24']) for (const i of treeFurniture(date)) expect(placeable.has(i.id)).toBe(true);
    expect(treeFurniture('2026-07-01').some((i) => i.stock === 'winter')).toBe(false);
  });

  it('a holding tree’s first shake drops it, before anything else; once it’s put, the tree shakes as before', () => {
    const date = '2026-11-04', [tree] = giftTreesOn(date), t = treeById(tree)!;
    const day = emptyDay(20_400);
    expect(holdsGift(date, tree, day.puts)).toBe(true);
    const other = GIFT_TREES.find((x) => !giftTreesOn(date).includes(x))!;
    expect(holdsGift(date, other, day.puts)).toBe(false);
    for (const r of [0, 0.5, 0.99]) expect(shakeDrop(() => r, 0, undefined, undefined, t.kind, false, true)).toBe('gift');
    // the dev hook's drops still come first; a palm or a goal tree never drops one; the hook can't force one
    expect(shakeDrop(() => 0.99, 0, undefined, 'nest', t.kind, false, true)).toBe('nest');
    expect(shakeDrop(() => 0.99, 0, undefined, 'gift', t.kind, false, false)).not.toBe('gift');
    expect(shakeDrop(() => 0.99, 0, undefined, undefined, 'palm', true, true)).toBe('coconut');
    expect(shakeDrop(() => 0.99, 0, undefined, undefined, 'goal', false, true)).not.toBe('gift');
    // on the wire the shake is `none`; the present is a put by the tree's id
    expect(wireDrop('gift', 12, Math.random)).toBe('none');
    expect(giftTree(giftId(tree))).toBe(tree);
    expect(giftTree('pa123')).toBeNull();
    for (const id of GIFT_TREES) expect(giftId(id)).toMatch(/^[\w:.-]{1,32}$/);
    day.puts[giftId(tree)] = { id: giftId(tree), what: 'present', at: giftAt(t), who: 'A', t: 0 };
    expect(holdsGift(date, tree, day.puts)).toBe(false);
  });

  it('it lands in front of its trunk, and the sheet’s day row keeps it until it’s opened (the guest’s too)', () => {
    for (const id of GIFT_TREES) {
      const t = treeById(id)!, [x, z] = giftAt(t);
      expect(Math.abs(x - t.x)).toBeLessThan(30);
      expect(z).toBeLessThan(t.z);
    }
    const T = dayStart(20_400), d = emptyDay(20_400), tree = GIFT_TREES[0], at = giftAt(treeById(tree)!);
    apply(d, { kind: 'put', id: giftId(tree), what: 'present', at, who: 'G', t: T + 1000 }, 'G');
    const row = rowOf(d, 'G');
    expect(row.puts).toEqual([[giftId(tree), 'present', ...at]]);
    // a phone with nothing from the relay finds it lying there from the row
    const back = emptyDay(20_400);
    applyRow(back, row, 'G', T + 2000, 'A');
    expect(lying(back).map((p) => p.id)).toEqual([giftId(tree)]);
  });
});
