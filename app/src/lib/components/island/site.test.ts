// The island on its layout (site.svelte.ts): its middle across follows the land as it's resized (a lopsided pull moves
// it), for what turns by it (SceneTaps' flowers, the goal trees' fruit rows, HudCoins' coins off them, the shaken
// trees' sides).
import { beforeEach, describe, expect, it } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import { MID_X, extentOf, opsBetween } from '#lib/layout/model.ts';
import { resizeEdge, withTiles } from '#lib/layout/resize.ts';
import { layout } from '#lib/store/layout.svelte.ts';
import { site } from './site.svelte.ts';
import { fruitLean, FRUIT_LEAN } from './scene.ts';
import { sceneryTrees } from './treeShake.ts';

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

beforeEach(() => {
  configureStorage({ local: new Mem() });
  layout.reset();
  site.sync();
});

describe("the island's middle across", () => {
  it('is 195 on the default island, and follows its land when the east is pulled in (a hard-coded 195 did not)', () => {
    expect(site.midX).toBe(MID_X);
    const l = layout.current, narrow = withTiles(l, resizeEdge(l, 'right', -4).codes!);
    layout.apply(opsBetween(l, narrow, layout.stamp()));
    site.sync();
    expect(site.extent.land).toEqual(extentOf(narrow).land);
    expect(site.midX).toBe(MID_X - 60);
    // a goal tree a tile west of 195 is east of the new middle: its fruit row leans east
    expect(fruitLean(MID_X - 30, site.midX)).toBe(FRUIT_LEAN);
    expect(fruitLean(MID_X - 30, MID_X)).toBe(-FRUIT_LEAN);
  });

  it("turns a shaken tree's outer side (where its nest and dangling bug fall) by the moved middle", () => {
    const l = layout.current, narrow = withTiles(l, resizeEdge(l, 'left', -6).codes!);
    layout.apply(opsBetween(l, narrow, layout.stamp()));
    site.sync();
    expect(site.midX).toBe(MID_X + 90);
    const between = sceneryTrees().filter((t) => t.x >= MID_X && t.x < site.midX);
    expect(between.length).toBeGreaterThan(0);
    for (const t of between) expect(t.out).toBe(-1);
  });
});
