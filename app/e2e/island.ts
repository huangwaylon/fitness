// The 3D island in the specs: its being up (`is3d`: the island's hooks and its models loaded), its hooks (`w3`, window.__world3d: Island3D.svelte), and a tap on a DOM target only where it is that target's
// (`tapOn`: in 3D the whole island is in view, so a villager or a visitor in front covers much of a small door).
import { expect, type Locator, type Page } from '@playwright/test';

/** The 3D island's test hooks (Island3D.svelte's window.__world3d), the parts the specs read. */
export type W3 = {
  loaded(): boolean;
  camStill(): boolean;
  /** Nothing moving: no gesture, fling, settle or activity (the engine's idle). */
  idle(): boolean;
  /** `drawn`: false in the logic tier (E2E_RENDER=none: the frames run, nothing is drawn, `calls` 0). */
  stats(): { frames: number; calls: number; loading: number; lamps: number; points: number; drawn: boolean };
  view(): { camZ: number; zoom: number; pitch: number; camX: number };
  limits(): { min: number; max: number };
  client(x: number, z: number, lift?: number): [number, number];
  things(id: string): boolean;
  where(id: string): { x: number; y: number; z: number; hidden: boolean; model: string } | null;
  /** The ids of the lamps lit now (a stand-in's `s:` prefixed). */
  lamps(): string[];
};
export const w3 = <R,>(page: Page, fn: (w: W3) => R) => page.evaluate(`(${fn.toString()})(window.__world3d)`) as Promise<R>;

/** The island up on this page and drawn in 3D, its first models loaded (false: no WebGL, the island's message). */
export async function is3d(page: Page): Promise<boolean> {
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  if (!(await page.locator('.if-scene[data-r3]').count())) return false;
  await page.waitForFunction(() => (window as unknown as { __world3d?: { loaded(): boolean } }).__world3d?.loaded(), null, { timeout: 30_000 });
  return true;
}

/** A tap on `target` at the first point of its box (row by row from the top) that hit-tests to it: never through
 *  something standing in front of it (polled: a villager in front may still be walking). */
export async function tapOn(page: Page, target: Locator) {
  const find = () => target.evaluate((el) => {
    const r = el.getBoundingClientRect();
    for (let fy = 0.1; fy < 1; fy += 0.1)
      for (const fx of [0.5, 0.35, 0.65, 0.2, 0.8]) {
        const x = r.left + r.width * fx, y = r.top + r.height * fy;
        if (el.contains(document.elementFromPoint(x, y))) return [x, y];
      }
    return null;
  });
  // (the point the poll found: a villager walking by may cover it again a moment later)
  let pt: number[] | null = null;
  await expect.poll(async () => (pt = await find()), { message: 'a point of the target not covered by anything in front of it' }).not.toBeNull();
  const [x, y] = pt!;
  await page.mouse.click(x, y);
}

/** Watch from the page's first script for things that come and go before a slow island (CI's software GL) lets the
 *  spec look: `sawIt(page, sel)` says whether something matching `sel` was ever there. Before `goto`. */
export async function watchFor(page: Page, sels: readonly string[]) {
  await page.addInitScript((sels) => {
    const W = window as unknown as { __saw?: Record<string, boolean> };
    const saw: Record<string, boolean> = (W.__saw = Object.fromEntries(sels.map((s) => [s, false])));
    const look = () => {
      for (const s of sels) if (!saw[s] && document.querySelector(s)) saw[s] = true;
    };
    new MutationObserver(look).observe(document, { childList: true, subtree: true, attributes: true });
  }, sels);
}
export const sawIt = (page: Page, sel: string) => page.evaluate((s) => !!(window as unknown as { __saw?: Record<string, boolean> }).__saw?.[s], sel);

/** A tap on the 3D island's model `id` (`__world3d.where`), at its point `lift` above its feet, through the camera's
 *  own projection: the game's state says where it is, not the pixels. Polled until the model is in and shown. */
export async function tapThing(page: Page, id: string, { lift = 0 }: { lift?: number } = {}) {
  const at = () => page.evaluate(([id, lift]) => {
    const w = (window as unknown as { __world3d: W3 }).__world3d, p = w.where(id);
    if (!p || p.hidden) return null;
    return w.client(p.x, -p.z, p.y + lift);
  }, [id, lift] as const);
  await expect.poll(at, { message: `the 3D model ${id}, shown` }).not.toBeNull();
  const [x, y] = (await at())!;
  await page.mouse.click(x, y);
}

/** The 3D island at rest: its camera still and nothing moving (polled; a villager wandering by doesn't count). */
export const settled = (page: Page) => expect.poll(() => w3(page, (w) => w.camStill() && w.idle()), { timeout: 20_000, message: 'the 3D island at rest' }).toBe(true);

/** The camera to world z and held there (again till it holds: the scene may still re-fit its camera as it opens, a
 *  loaded runner's late), then the island at rest (`settled`: its nodes placed for that camera, so a DOM box read
 *  next is where the island draws it, not where the last camera had it). `rest` false: the camera still only (a
 *  critter swimming or flying keeps the island's frames coming: never at rest). */
export async function camTo(page: Page, z: number, rest = true) {
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await expect.poll(async () => {
    await page.evaluate((z) => (window as unknown as { __world: { go(z: number): void } }).__world.go(z), z);
    await page.waitForTimeout(250);
    return page.evaluate((z) => Math.abs((window as unknown as { __world: { cam(): number } }).__world.cam() - z), z);
  }, { timeout: 10_000, message: `the camera held at ${z}` }).toBeLessThan(1.5); // (WebKit scrolls by whole px: within a px of z)
  if (rest) await settled(page);
  else await expect.poll(() => w3(page, (w) => w.camStill()), { message: 'the camera still' }).toBe(true);
}

/** Time on: the page's clock (`page.clock.install()` first) runs `ms`, the 3D engines' frames included (the clock fakes
 *  requestAnimationFrame): the sim step. Quick in the logic tier (nothing drawn); drawn under software GL a minute of
 *  frames takes minutes (use `page.clock.fastForward` there). */
export const step = (page: Page, ms: number) => page.clock.runFor(ms);
/** The island's opening beats are over (the greeting and the day's beats played, no event queued): __world.quiet(). */
export const quiet = (page: Page) =>
  expect.poll(() => page.evaluate(() => (window as unknown as { __world?: { quiet?(): boolean } }).__world?.quiet?.() ?? false), { timeout: 15_000, message: 'the opening beats over' }).toBe(true);

/** world.ts's places as the page's island has them (the layout's): a spec reads these, not world.ts's constants
 *  imported here (those are the old fixed island's, before the layout is applied). */
export type Geo = {
  CAMS: { mae: number; oku: number }; SHORE_Z: number; POND: { x: number; z: number; rx: number; rz: number };
  CENTRE_STAGE: [number, number]; ARCH: [number, number]; CAKE: [number, number]; HOMES: { A: [number, number]; B: [number, number] };
  SEATS: Record<string, [number, number]>; BUILDINGS: { id: string; x: number; z: number; h: number; depth: number }[]; FLOWERS: { id: string; x: number; z: number; clump: number }[];
  SCENERY: { id: string; kind: string; key: string; x: number; z: number; h: number }[]; DECOR_SLOTS: { id: string; x: number; z: number }[];
  CLIFF: { z0: number; z1: number };
  RIVER: [number, number, number][]; RIVER_BEND: number; PONDS: { x: number; z: number; rx: number; rz: number }[];
  /** Today's trees holding a present (treeGifts.ts giftTreesOn over the island's trees). */
  GIFT_TREES: string[];
  /** Where Gulliver lies washed up today (visitors.ts beachedAt). */
  BEACHED: [number, number];
};
export async function geo(page: Page): Promise<Geo> {
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  return page.evaluate(() => (window as unknown as { __world: { geo(): Geo } }).__world.geo());
}

/** A tap at (x, y) the moment the fish bites (the 「！」, `[data-bite]`): watched for and tapped in the page (a
 *  MutationObserver, then a click on what's at (x, y), as a finger's goes), not by expect's polling and a round trip
 *  back, which under CI's load came after NH's short window (island/fishing.ts BITE_WINDOW_MS). Work out (x, y) before
 *  the bite. */
export async function reelOnBite(page: Page, x: number, y: number, timeout = 12_000) {
  await page.evaluate(([x, y, timeout]) => new Promise<void>((ok, no) => {
    const bit = () => !!document.querySelector('[data-bite]');
    const tap = () => {
      document.elementFromPoint(x, y)?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 }));
      ok();
    };
    if (bit()) return tap();
    const mo = new MutationObserver(() => bit() && (mo.disconnect(), clearTimeout(t), tap()));
    const t = setTimeout(() => (mo.disconnect(), no(new Error('no bite'))), timeout);
    mo.observe(document, { childList: true, subtree: true, attributes: true });
  }), [x, y, timeout] as const);
}

type Fishing = {
  __fish: { fish(): { water: string; x: number; z: number }[] };
  __world: { free(x: number, z: number, away?: number): boolean; put(x: number, z: number): void; at(x: number, z: number): [number, number]; mine(): [number, number] };
};
/** My villager on the bank near the shadow in `water` (NH casts from where it stands; any water casts, this one's the
 *  near case): open ground near it, behind it on screen where there's any (so it never stands over the shadow), put
 *  there; the camera on the shadow first (at `zoom`: a side of the island shows zoomed in). Where the shadow is seen
 *  now (client px). */
export async function toTheWater(page: Page, water: string, zoom = 1): Promise<[number, number]> {
  // (the opening beats over: a greeting's balloon at the bottom of the screen lies over the sea)
  await quiet(page);
  // (the camera where the shadow is a little below the screen's middle, at the whole island's zoom: a shadow far up
  // the island by the horizon is a speck, and the ground there is the far bank's)
  await page.evaluate(([water, k]) => {
    type G = { go(z: number, k?: number, x?: number): void; client(x: number, z: number): [number, number]; view(): { camZ: number } };
    const w = (window as unknown as { __world3d: G }).__world3d, f = (window as unknown as Fishing).__fish.fish().find((f) => f.water === water)!;
    let best: [number, number] | null = null;
    for (let z = f.z - 700; z <= f.z + 100; z += 25) {
      w.go(z, k, f.x);
      const d = Math.abs(w.client(f.x, f.z)[1] - innerHeight * 0.58);
      if (!best || d < best[1]) best = [w.view().camZ, d];
    }
    w.go(best![0], k, f.x);
  }, [water, zoom] as const);
  await expect.poll(() => w3(page, (w) => w.camStill()), { message: 'the camera still' }).toBe(true);
  const spot = await page.evaluate((water) => {
    const w = window as unknown as Fishing, f = w.__fish.fish().find((f) => f.water === water)!;
    // (behind it; else off to its side, never just in front, where my villager would stand over it on screen: a shadow
    // off the back beach has no ground behind it)
    for (const where of ['behind', 'beside', 'any'])
      for (let r = 40; r <= 160; r += 8)
        for (let a = 0; a < 24; a++) {
          const x = Math.round(f.x + Math.cos((a / 24) * Math.PI * 2) * r), z = Math.round(f.z + Math.sin((a / 24) * Math.PI * 2) * r);
          if (where === 'behind' ? z < f.z + 20 : where === 'beside' ? Math.abs(x - f.x) < 60 : false) continue;
          if (w.__world.free(x, z, 0)) return [x, z] as [number, number];
        }
    return null;
  }, water);
  expect(spot, `open ground near the ${water}'s shadow`).not.toBeNull();
  await page.evaluate(([x, z]) => (window as unknown as Fishing).__world.put(x, z), spot!);
  await expect.poll(() => page.evaluate(() => (window as unknown as Fishing).__world.mine()).then(([x, z]) => Math.hypot(x - spot![0], z - spot![1]))).toBeLessThan(1);
  // (and the camera still again: a put may bring it after my villager, and a tap mid-move lands on what was there)
  await expect.poll(() => w3(page, (w) => w.camStill()), { message: 'the camera still' }).toBe(true);
  // the shadow's spot, or the water nearest it a finger can tap (nothing of the island's over it: a canopy, a door, a
  // bush on the bank), within 60 px
  const find = () => page.evaluate((water) => {
    const w = window as unknown as Fishing & { __world3d: { ground(cx: number, cy: number): { x: number; z: number } | null }; __world: { ground(x: number, z: number): { surface: string } } };
    const f = w.__fish.fish().find((f) => f.water === water)!, [cx, cy] = w.__world.at(f.x, f.z);
    const TAPS = 'button, a, [role="button"], [data-bush], [data-tree], [data-flower], [data-sit], [data-fixture], [data-campfire], [data-building], [data-decor], [data-actor], [data-visitor], [data-fx="talk"]';
    for (let r = 0; r <= 60; r += 6)
      for (let a = 0, n = r ? 16 : 1; a < n; a++) {
        const x = cx + Math.cos((a / n) * Math.PI * 2) * r, y = cy + Math.sin((a / n) * Math.PI * 2) * r;
        const g = w.__world3d.ground(x, y), s = g && w.__world.ground(g.x, g.z).surface;
        // (on screen; for the sea, the sea's: a clifftop pool by the back beach is water too)
        if (x < 8 || x > innerWidth - 8 || y < 8 || y > innerHeight - 8) continue;
        if ((water === 'sea' ? s === 'sea' : s === 'water' || s === 'sea') && !document.elementFromPoint(x, y)?.closest(TAPS)) return [x, y] as [number, number];
      }
    return null;
  }, water);
  // (still clear a moment later: nothing walking over it, a villager or a balloon)
  const clear = (p: [number, number]) => page.evaluate(([x, y]) => !document.elementFromPoint(x, y)?.closest('button, a, [role="button"], [data-bush], [data-tree], [data-flower], [data-sit], [data-fixture], [data-campfire], [data-building], [data-decor], [data-actor], [data-visitor], [data-fx="talk"]'), p);
  let pt: [number, number] | null = null;
  await expect.poll(async () => {
    if (pt && (await clear(pt))) return true;
    pt = await find();
    return false;
  }, { message: `water a finger can tap by the ${water}'s shadow` }).toBe(true);
  return pt!;
}

const TAPS = 'button, a, [role="button"], [data-bush], [data-tree], [data-flower], [data-sit], [data-fixture], [data-campfire], [data-building], [data-decor], [data-actor], [data-visitor], [data-fx="talk"]';
/** A cast by the shadow in `water` from its bank (toTheWater), checked: the point's checked clear and clicked in one
 *  step in the page (a tree's tap area on the bank comes in as its lazy art loads, between a check and a click from
 *  here: the tap was the tree's), and tried again where the shadow has gone (at most four) until the tap cast. Where
 *  it cast (client px): a reel's tap there is on the island, never on a door (a door with the line out goes in). */
export async function castIn(page: Page, water: string, zoom = 1): Promise<[number, number]> {
  for (let i = 0; i < 4; i++) {
    const [x, y] = await toTheWater(page, water, zoom);
    const tapped = await page.evaluate(([x, y, taps]) => {
      const el = document.elementFromPoint(x, y);
      if (!el || el.closest(taps)) return false;
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 }));
      return true;
    }, [x, y, TAPS] as const);
    if (tapped && (await expect.poll(() => page.evaluate(() => (window as unknown as { __fish: { line(): unknown } }).__fish.line()), { timeout: 1500 }).not.toBeNull().then(() => true, () => false)))
      return [x, y];
  }
  throw new Error(`no cast in the ${water}: ${await page.evaluate(() => (window as unknown as { __fish: { why(): string } }).__fish.why())}`);
}

/** A dig spot on screen and where to tap it (client px): the camera to each of the day's in turn (Finds' `data-digs`
 *  list: on the layout they lie all over the long island) until one is in view with nothing over it. */
export async function fossilOnScreen(page: Page): Promise<{ x: number; y: number }> {
  const at = await page.locator('[data-digs]').getAttribute('data-at');
  const zs = (at ?? '').split(' ').filter(Boolean).map((p) => Number(p.split(',')[1]));
  const find = () => page.locator('[data-find="fossil"]').evaluateAll((els) => els.map((el) => [el, el.getBoundingClientRect()] as const)
    .filter(([el, r]) => (el as HTMLElement).checkVisibility({ visibilityProperty: true }) && r.top > 100 && r.bottom < innerHeight - 60
      && !document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('button, [data-flower], [data-tree], [data-bush], [data-care], [data-fixture], [data-sit], [data-visitor], [data-actor], [data-critter]'))
    .map(([, r]) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 }))[0] ?? null);
  // each in turn (a villager may stand over one)
  for (const z of zs) {
    await page.evaluate((z) => (window as unknown as { __world: { go(z: number): void } }).__world.go(z), z - 160);
    const p = await expect.poll(find, { timeout: 1500 }).not.toBeNull().then(() => find(), () => null);
    if (p) return p;
  }
  throw new Error('no dig spot on screen with nothing over it');
}

/** The camera's おく stop (the campsite's end: world.ts CAMS as the page's island has them). */
export const oku = async (page: Page): Promise<number> => (await geo(page)).CAMS.oku;
/** The camera's z with centre stage (the visitors' spot: the layout's plaza) about the screen's middle. */
export const stageCam = async (page: Page): Promise<number> => {
  const g = await geo(page);
  return Math.min(g.CAMS.oku, Math.max(g.CAMS.mae, g.CENTRE_STAGE[1] - 150));
};

/** Where my villager stands to go into the tent (nav.ts's door node: a step in front of the campsite's door line). */
export const campDoor = (g: Geo): [number, number] => ((b) => [b.x, b.z - 16] as [number, number])(g.BUILDINGS.find((b) => b.id === 'campsite')!);

/** The open ground nearest (x, z) a tap walks to (__world.free: walkable, clear of today's weeds, dig spots and
 *  mushrooms by `away` u, of the scenery's tap areas and the flowers), searched in rings 6 u apart; `onScreen`: and on
 *  this screen with nothing over its point there (a near thing's thumb-sized tap area reaches far up it: set the camera
 *  first). */
export async function openNear(page: Page, x: number, z: number, away = 45, onScreen = false): Promise<[number, number]> {
  const p = await page.evaluate(([x, z, away, onScreen]) => {
    const w = (window as unknown as { __world: { free(x: number, z: number, away: number): boolean; at(x: number, z: number): [number, number] } }).__world;
    const TAPS = 'button, a, [data-flower], [data-tree], [data-bush], [data-care], [data-find], [data-fixture], [data-sit], [data-campfire], [data-decor], [data-visitor], [data-actor], [data-critter]';
    const bare = (px: number, pz: number) => {
      if (!onScreen) return true;
      const [sx, sy] = w.at(px, pz);
      if (sy < 120 || sy > innerHeight - 100 || sx < 30 || sx > innerWidth - 30) return false;
      // the point and a thumb round it
      if (![[0, 0], [-14, 0], [14, 0], [0, -14], [0, 14]].every(([dx, dy]) => {
        const el = document.elementFromPoint(sx + dx, sy + dy);
        return !!el && !el.closest(TAPS);
      })) return false;
      // (a visitor's art takes no pointer, the scene asks it: a tap within its box, a thumb round it, is theirs)
      if ([...document.querySelectorAll('[data-visitor] .art')].some((el) => {
        const r = el.getBoundingClientRect();
        return sx > r.left - 14 && sx < r.right + 14 && sy > r.top - 14 && sy < r.bottom + 14;
      })) return false;
      // (the 3D island: a tap there finds that very ground, not a model standing in front of it)
      const g3 = (window as unknown as { __world3d?: { ground(cx: number, cy: number): { x: number; z: number } | null } }).__world3d?.ground(sx, sy);
      return !g3 || Math.min(Math.hypot(g3.x - px, g3.z - pz), Math.hypot(g3.x - px, -g3.z - pz)) < 8;
    };
    for (let r = 0; r <= 240; r += 6)
      for (let a = 0, n = Math.max(1, Math.round((r * Math.PI * 2) / 6)); a < n; a++) {
        const px = Math.round(x + Math.cos((a / n) * Math.PI * 2) * r), pz = Math.round(z + Math.sin((a / n) * Math.PI * 2) * r);
        if (w.free(px, pz, away) && bare(px, pz)) return [px, pz] as [number, number];
      }
    return null;
  }, [x, z, away, onScreen] as const);
  if (!p) throw new Error(`no open ground near ${x}, ${z}`);
  return p;
}

/** Open lawn a tap-walk goes to near (x, z), on this screen with nothing over it, and where to tap it (client px): read
 *  from the page's island (`openNear`), never a fixed point, which a building of the layout's may come to stand on (the
 *  shop's did, on the lawn the specs walked on). Set the camera first. */
export async function lawnTap(page: Page, x: number, z: number): Promise<{ at: [number, number]; x: number; y: number }> {
  const at = await openNear(page, x, z, 45, true);
  const [cx, cy] = await page.evaluate(([x, z]) => (window as unknown as { __world: { at(x: number, z: number): [number, number] } }).__world.at(x, z), at);
  return { at, x: cx, y: cy };
}

/** A catch or a find shown (docs/design.md "Critters"): its plate in the bottom stack, the item's icon on it (`art`:
 *  its key, or a pattern on the art's path). Where the icon flew in from (client px). */
export async function plateOnly(page: Page, art: string | RegExp): Promise<{ x: number; y: number }> {
  const plate = page.locator('[data-catch-stack] [data-fx="catch"].placed').last();
  await expect(plate).toBeVisible({ timeout: 4000 });
  const r = await plate.locator('.catch-icon').evaluate(async (icon) => {
    await Promise.all(icon.getAnimations().map((a) => a.finished.catch(() => {})));
    const img = icon.querySelector('img'), at = icon.getBoundingClientRect(), s = getComputedStyle(icon);
    const off = (v: string) => parseFloat(s.getPropertyValue(v)) || 0;
    return { src: img?.dataset.src || img?.getAttribute('src') || '', x: at.left + at.width / 2 + off('--dx'), y: at.top + at.height / 2 + off('--dy') };
  });
  expect(r.src).toMatch(typeof art === 'string' ? `/${art}.webp` : art);
  return { x: r.x, y: r.y };
}
