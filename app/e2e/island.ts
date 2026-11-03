// The island's two renderers in the specs (docs/ops/testing.md "E2E_ISLAND"): which one a page draws (`is3d`), the 3D
// island's hooks (`w3`, window.__world3d: Island3D.svelte), and a tap on a DOM target only where it is that target's
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

/** The island drawn in 3D on this page (once the island is up): the 3D one's loaded too. */
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
  await expect.poll(find, { message: 'a point of the target not covered by anything in front of it' }).not.toBeNull();
  const [x, y] = (await find())!;
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
 *  own projection: the game's state says where it is, not the pixels. Polled until the model is in and shown and, with
 *  `sel`, until that point hit-tests to `sel`'s tap area (nothing walking in front of it). */
export async function tapThing(page: Page, id: string, { lift = 0, sel }: { lift?: number; sel?: string } = {}) {
  const at = () => page.evaluate(([id, lift, sel]) => {
    const w = (window as unknown as { __world3d: W3 }).__world3d, p = w.where(id);
    if (!p || p.hidden) return null;
    const [x, y] = w.client(p.x, -p.z, p.y + lift);
    return !sel || document.elementFromPoint(x, y)?.closest(sel) ? [x, y] : null;
  }, [id, lift, sel ?? ''] as const);
  await expect.poll(at, { message: `the 3D model ${id}, shown${sel ? ` and its ${sel} clear` : ''}` }).not.toBeNull();
  const [x, y] = (await at())!;
  await page.mouse.click(x, y);
}

/** The 3D island at rest: its camera still and nothing moving (polled; a villager wandering by doesn't count). */
export const settled = (page: Page, timeout = 20_000) => expect.poll(() => w3(page, (w) => w.camStill() && w.idle()), { timeout, message: 'the 3D island at rest' }).toBe(true);

/** Time on: the page's clock (`page.clock.install()` first) runs `ms`, the 3D engines' frames included (the clock fakes
 *  requestAnimationFrame): the sim step. Quick in the logic tier (nothing drawn); drawn under software GL a minute of
 *  frames takes minutes (use `page.clock.fastForward` there). */
export const step = (page: Page, ms: number) => page.clock.runFor(ms);

/** world.ts's places as the page's island has them (the layout's on the 3D island with the layout on): a spec reads
 *  these, not world.ts's constants imported here (those are the 2D island's). */
export type Geo = {
  CAMS: { mae: number; oku: number }; SHORE_Z: number; POND: { x: number; z: number; rx: number; rz: number }; SPRING: { x: number; z: number; rx: number; rz: number };
  CENTRE_STAGE: [number, number]; ARCH: [number, number]; CAKE: [number, number]; HOMES: { A: [number, number]; B: [number, number] };
  GOAL_TREES: { A: [number, number]; B: [number, number] }; ROCK: [number, number]; TAPE_DECK: [number, number]; SEATS: Record<string, [number, number]>;
  PULLUP_AT: [number, number]; BUILDINGS: { id: string; x: number; z: number; h: number; depth: number }[]; FLOWERS: { id: string; x: number; z: number; clump: number }[];
  SCENERY: { id: string; kind: string; key: string; x: number; z: number; h: number }[]; DECOR_SLOTS: { id: string; x: number; z: number }[];
  BRIDGE: { x: number; z0: number; z1: number; w: number }; CLIFF: { z0: number; z1: number }; LAWN_SPOTS: [number, number][];
  RIVER: [number, number, number][]; RIVER_BEND: number;
};
export async function geo(page: Page): Promise<Geo> {
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  return page.evaluate(() => (window as unknown as { __world: { geo(): Geo } }).__world.geo());
}

/** A tap at (x, y) the moment the fish bites (the 「！」, `[data-bite]`): waited for in the page (a MutationObserver), not
 *  by expect's polling, which backs off to a look a second, past NH's 1.6 s bite window (critters.ts BITE_WINDOW_MS)
 *  under CI's load, so the reel came after the fish had gone. Work out (x, y) before the bite. */
export async function reelOnBite(page: Page, x: number, y: number, timeout = 12_000) {
  await page.evaluate((timeout) => new Promise<void>((ok, no) => {
    const bit = () => !!document.querySelector('[data-bite]');
    if (bit()) return ok();
    const mo = new MutationObserver(() => bit() && (mo.disconnect(), clearTimeout(t), ok()));
    const t = setTimeout(() => (mo.disconnect(), no(new Error('no bite'))), timeout);
    mo.observe(document, { childList: true, subtree: true, attributes: true });
  }), timeout);
  await page.mouse.click(x, y);
}

/** A dig spot on screen and where to tap it (client px): the camera to the first of the day's (its world point,
 *  `data-x` / `data-z`: on the layout they lie all over the long island), then the one in view, nothing over it. */
export async function fossilOnScreen(page: Page): Promise<{ x: number; y: number }> {
  const first = page.locator('[data-find="fossil"]').first();
  await expect(first).toBeAttached();
  const z = Number(await first.getAttribute('data-z'));
  await page.evaluate((z) => (window as unknown as { __world: { go(z: number): void } }).__world.go(z), z - 160);
  const find = () => page.locator('[data-find="fossil"]').evaluateAll((els) => els.map((el) => [el, el.getBoundingClientRect()] as const)
    .filter(([el, r]) => (el as HTMLElement).checkVisibility({ visibilityProperty: true }) && r.top > 100 && r.bottom < innerHeight - 60
      && !document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('button, [data-flower], [data-tree], [data-bush], [data-care], [data-fixture], [data-visitor], [data-actor], [data-critter]'))
    .map(([, r]) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 }))[0] ?? null);
  await expect.poll(find, { message: 'a dig spot on screen, nothing over it' }).not.toBeNull();
  return (await find())!;
}

/** The camera's おく stop (the campsite's end: world.ts CAMS as the page's island has them). */
export const oku = async (page: Page): Promise<number> => (await geo(page)).CAMS.oku;

/** Where my villager stands to go into the tent (nav.ts's door node: a step in front of the campsite's door line). */
export const campDoor = (g: Geo): [number, number] => ((b) => [b.x, b.z - 16] as [number, number])(g.BUILDINGS.find((b) => b.id === 'campsite')!);

/** The open ground nearest (x, z) a tap walks to (__world.free: walkable, clear of today's weeds, dig spots and
 *  mushrooms by `away` u, of the scenery's tap areas and the flowers), searched in rings 6 u apart; `onScreen`: and on
 *  this screen with nothing over its point there (a near thing's thumb-sized tap area reaches far up it: set the camera
 *  first). */
export async function openNear(page: Page, x: number, z: number, away = 45, onScreen = false): Promise<[number, number]> {
  const p = await page.evaluate(([x, z, away, onScreen]) => {
    const w = (window as unknown as { __world: { free(x: number, z: number, away: number): boolean; at(x: number, z: number): [number, number] } }).__world;
    const TAPS = 'button, a, [data-flower], [data-tree], [data-bush], [data-care], [data-find], [data-fixture], [data-campfire], [data-decor], [data-visitor], [data-actor], [data-critter]';
    const bare = (px: number, pz: number) => {
      if (!onScreen) return true;
      const [sx, sy] = w.at(px, pz);
      if (sy < 120 || sy > innerHeight - 100 || sx < 30 || sx > innerWidth - 30) return false;
      // the point and a thumb round it
      return [[0, 0], [-14, 0], [14, 0], [0, -14], [0, 14]].every(([dx, dy]) => {
        const el = document.elementFromPoint(sx + dx, sy + dy);
        return !!el && !el.closest(TAPS);
      });
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
