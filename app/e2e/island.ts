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
