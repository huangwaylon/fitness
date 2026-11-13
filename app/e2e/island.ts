// The 3D island in the specs: its being up (`is3d`: the island's hooks and its models loaded), its hooks (`w3`, window.__world3d: Island3D.svelte), and a tap on a DOM target only where it is that target's
// (`tapOn`: in 3D the whole island is in view, so a villager or a visitor in front covers much of a small door).
import { expect, type BrowserContext, type Locator, type Page } from './fixtures.ts';
import { hudMenu } from './hud.ts';

/** The site's base path, as the build's (playwright.config.ts BASE_PATH: '' at the root, the default; e.g. '/x' under one). */
export const BASE = process.env.BASE_PATH ?? '';
/** The island's own URL (the base path's root) with a query, `rest` (a regex source) after its `?`. */
export const islandURL = (rest = ''): RegExp => new RegExp(`^https?://[^/]+${BASE}/?\\?${rest}`);

/** The island's もようがえ, which is /editor's alone (docs/island-layout.md "Phone editing"): its phone view with IslandEdit
 *  over the plan (`preview=0`: no WebGL), the camera at `cam`, a tab of `context` (the demo's relay is the context's
 *  tabs': the island's tabs there have its edits at once). `q`: the island's query (`demo&date=…`, `&as=B`). */
export async function openEditor(context: BrowserContext, q: string, cam = 300): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`editor/?${q}&view=phone&edit&cam=${cam}&preview=0`);
  await expect(page.locator('[data-island-edit]')).toBeVisible();
  await page.waitForFunction(() => (window as unknown as { __islandEdit?: unknown }).__islandEdit);
  return page;
}

/** The 3D island's test hooks (Island3D.svelte's window.__world3d), the parts the specs read. */
export type W3 = {
  loaded(): boolean;
  camStill(): boolean;
  /** Nothing moving: no gesture, fling, settle or activity (the engine's idle). */
  idle(): boolean;
  /** `drawn`: false in the logic tier (E2E_RENDER=none: the frames run, nothing is drawn, `calls` 0). */
  stats(): { frames: number; calls: number; loading: number; lamps: number; points: number; drawn: boolean; paused: boolean };
  view(): { camZ: number; zoom: number; pitch: number; camX: number };
  limits(): { min: number; max: number };
  client(x: number, z: number, lift?: number): [number, number];
  /** Where model `id` is drawn, `lift` above its base (`where`'s y is world height, the raised ground's in it); null: not in, or hidden. */
  modelAt(id: string, lift?: number): [number, number] | null;
  things(id: string): boolean;
  where(id: string): { x: number; y: number; z: number; hidden: boolean; model: string } | null;
  /** The ids of the lamps lit now (a stand-in's `s:` prefixed). */
  lamps(): string[];
};
export const w3 = <R,>(page: Page, fn: (w: W3) => R) => page.evaluate(`(${fn.toString()})(window.__world3d)`) as Promise<R>;

/** The island's hooks there to read: __world and the 3D island's __world3d (it comes a moment after __world). */
async function ready3d(page: Page) {
  await page.waitForFunction(() => { const w = window as unknown as { __world?: unknown; __world3d?: unknown }; return !!w.__world && !!w.__world3d; }, null, { timeout: 30_000 });
}

/** The island open: the HUD up and the 3D island mounted, its camera placing the island's DOM targets (trees,
 *  villagers, finds, critters: hidden at the scene's corner until then; a step of the game's clock after the mount, not
 *  the first frame drawn). The HUD shows first: the island mounts once the ground's fields are in (worker or cache:
 *  layout/fieldsPrime.ts), and a box read or a tap before that missed. Not the models loaded: `is3d`. */
export async function islandUp(page: Page, { timeout = 30_000 }: { timeout?: number } = {}) {
  await expect(hudMenu(page)).toBeVisible({ timeout });
  const up = await page.waitForFunction(() => {
    type W = Window & { __world?: { perf: { frames: number }; idle(): boolean }; __world3d?: W3; __upAt?: number };
    const w = window as unknown as W;
    if (document.querySelector('[data-no3d]')) return 'no3d';
    if (!w.__world || !w.__world3d) return false;
    // a step since (the mount's own asks one), or none pending: placed; a sheet over it: nothing steps till it closes
    w.__upAt ??= w.__world.perf.frames;
    return w.__world.perf.frames > w.__upAt || w.__world.idle() || w.__world3d.stats().paused;
  }, null, { timeout });
  // (the island's no-WebGL message: a mount that failed, never an island up; world3d.spec's no-WebGL test reads it)
  if ((await up.jsonValue()) === 'no3d') throw new Error('the island failed to mount ([data-no3d])');
}

/** The 3D island's first models loaded (its hooks there; no check for the no-WebGL message: `is3d`). */
export const loaded3d = (page: Page, timeout = 30_000) =>
  page.waitForFunction(() => !!(window as unknown as { __world3d?: { loaded(): boolean } }).__world3d?.loaded(), null, { timeout });

/** The app's own navigation to `path` (a link's click: SvelteKit's router), as a door does. */
export const nav = (page: Page, path: string) => page.evaluate((h) => {
  const a = document.createElement('a');
  a.href = h;
  document.body.append(a);
  a.click();
  a.remove();
}, path);

/** The island up on this page and drawn in 3D, its first models loaded (false: no WebGL, the island's message). */
export async function is3d(page: Page): Promise<boolean> {
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  if (!(await page.locator('.if-scene[data-r3]').count())) return false;
  await loaded3d(page);
  return true;
}

/** A tap on `target` at the first point of its box (row by row from the top) that hit-tests to it: never through
 *  something standing in front of it (polled: a villager in front may still be walking). */
export async function tapOn(page: Page, target: Locator) {
  // (frame-locked, tapAt: the point found and tapped with no frame between, a villager walking by never in time to
  // cover it; the target marked for the page's look)
  await target.evaluate((el) => {
    for (const e of document.querySelectorAll('[data-e2e-tap]')) e.removeAttribute('data-e2e-tap');
    el.setAttribute('data-e2e-tap', '');
  });
  await tapAt(page, (w) => {
    const el = w.document.querySelector('[data-e2e-tap]'), r = el?.getBoundingClientRect();
    if (!r?.width) return null;
    for (let fy = 0.1; fy < 1; fy += 0.1)
      for (const fx of [0.5, 0.35, 0.65, 0.2, 0.8]) {
        const x = r.left + r.width * fx, y = r.top + r.height * fy;
        if (el.contains(w.document.elementFromPoint(x, y))) return [x, y];
      }
    return null;
  }, null, { clear: null, mouse: true, message: 'a point of the target not covered by anything in front of it' });
  await page.evaluate(() => document.querySelector('[data-e2e-tap]')?.removeAttribute('data-e2e-tap')).catch(() => {});
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

/** What a tap on the island goes to (the scene's tap areas and controls): a point under one is that thing's. */
const TAP_AREAS = 'button, a, [role="button"], [data-bush], [data-tree], [data-flower], [data-sit], [data-fixture], [data-campfire], [data-building], [data-decor], [data-actor], [data-visitor], [data-fx="talk"]';

/** Where a frame-locked tap aims, worked out in the page (`w`: its window): a client point, or null (not there yet).
 *  Self-contained: it runs in the page, so it reads only `w` and `arg`. */
export type Aim<A> = (w: any, arg: A) => readonly [number, number] | null;
/** Where a frame-locked tap went (client px), on what, and the 3D island's ground under it then (world x, z). */
export type Tapped = { x: number; y: number; on: string; ground: { x: number; z: number } | null };

/** The page's frames held (window.__e2eHold): requestAnimationFrame's callbacks kept, not run, from `on()` (a frame
 *  already asked for runs first: `on` resolves after it) till `off()` runs them. Installed at the first use; the engines
 *  ask for each frame anew (world3d/pace.ts), so nothing moves meanwhile: no camera ease, no walk, no swim. */
const HOLD = `(window.__e2eHold ??= (() => {
  const raf = window.requestAnimationFrame.bind(window), caf = window.cancelAnimationFrame.bind(window);
  let held = null, n = 0;
  window.requestAnimationFrame = (cb) => (held ? (held.set(--n, cb), n) : raf(cb));
  window.cancelAnimationFrame = (id) => (id < 0 ? held && held.delete(id) : caf(id));
  return {
    on: () => { held ??= new Map(); return new Promise((ok) => raf(() => setTimeout(ok, 0))); },
    off: () => { const h = held; held = null; for (const cb of h ? h.values() : []) raf(cb); }
  };
})())`;

/** A tap frame-locked to the 3D island (docs/ops/testing.md "Flakes"): the page's frames held (HOLD), the point `aim`
 *  gives read, a real tap there (`page.touchscreen`, else the mouse; `mouse`: the mouse, for taps one after another,
 *  which WebKit moves to the last touch's point within a double tap's time), its click seen, then the frames let go. No
 *  frame comes between reading where something is and the tap (a camera easing, a villager walking over it, a fish
 *  swimming on: what moved a target between a read and a tap a round trip later). Polled (frames running between
 *  tries) while `aim` has no point, it's off the screen, or it's under one of `clear`'s tap areas (null: anything goes);
 *  then one tap. `dispatch`: the finger's events (pointerdown, pointerup, click) sent from the page in the same task as
 *  the read, nothing at all between them (not even a lazy tap area coming in), but untrusted: exactTaps.ts leaves them
 *  be. Where it tapped, and on what. */
export async function tapAt<A>(page: Page, aim: Aim<A>, arg: A, o: { clear?: string | null; message?: string; timeout?: number; intervals?: number[]; mouse?: boolean; dispatch?: boolean } = {}): Promise<Tapped> {
  const clear = o.clear === undefined ? TAP_AREAS : o.clear;
  const read = () => page.evaluate(`(async (aim, arg, clear, dispatch) => {
    if (!dispatch) await ${HOLD}.on();
    const p = aim(window, arg), [x, y] = p || [];
    const el = p && document.elementFromPoint(x, y), over = el && clear ? el.closest(clear) : null;
    const why = !p ? 'no point yet' : !(x >= 1 && y >= 1 && x <= innerWidth - 1 && y <= innerHeight - 1) ? 'off the screen at ' + x + ',' + y
      : !el || over ? 'at ' + Math.round(x) + ',' + Math.round(y) + ' ' + (over ? 'under ' + over.outerHTML.slice(0, 80) : 'nothing') : '';
    if (why) return (dispatch || window.__e2eHold.off(), { why });
    const on = el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : '');
    const ground = (window.__world3d && window.__world3d.ground(x, y)) || null;
    if (dispatch) {
      const at = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, button: 0 };
      const finger = { ...at, pointerId: 7001, pointerType: 'touch', isPrimary: true, width: 10, height: 10 };
      el.dispatchEvent(new PointerEvent('pointerdown', finger));
      el.dispatchEvent(new PointerEvent('pointerup', finger));
      el.dispatchEvent(new MouseEvent('click', at));
      return { x, y, on, ground };
    }
    window.__e2eTapped = new Promise((ok) => {
      const seen = () => (removeEventListener('click', seen, true), clearTimeout(t), ok());
      const t = setTimeout(seen, 400);
      addEventListener('click', seen, true);
    });
    return { x, y, on, ground };
  })(${aim.toString()}, ${JSON.stringify(arg)}, ${JSON.stringify(clear)}, ${!!o.dispatch})`) as Promise<Tapped | { why: string }>;
  let last = { why: 'not tried' } as Tapped | { why: string };
  await expect.poll(async () => 'x' in (last = await read()) || last.why, { timeout: o.timeout ?? 10_000, intervals: o.intervals, message: o.message ?? 'a frame-locked tap' }).toBe(true);
  const t = last as Tapped;
  if (o.dispatch) return t;
  try {
    if (o.mouse) await page.mouse.click(t.x, t.y);
    else await page.touchscreen.tap(t.x, t.y).catch((e: Error) => (/hasTouch/.test(e.message) ? page.mouse.click(t.x, t.y) : Promise.reject(e)));
    await page.evaluate(() => (window as unknown as { __e2eTapped?: Promise<void> }).__e2eTapped).catch(() => {});
  } finally {
    // (gone with the page when the tap navigated: a door)
    await page.evaluate(() => (window as unknown as { __e2eHold?: { off(): void } }).__e2eHold?.off()).catch(() => {});
  }
  return t;
}

/** A frame-locked tap (`tapAt`) on the world point (x, z), `lift` above the ground, through the 3D camera's projection
 *  as it is at the tap (the DOM island's, `__world.at`, without the 3D island). */
export const tapWorld = (page: Page, x: number, z: number, o: { lift?: number; clear?: string | null; message?: string; mouse?: boolean } = {}) =>
  tapAt(page, (w, [x, z, lift]) => (w.__world3d ? w.__world3d.client(x, z, lift) : w.__world.at(x, z)), [x, z, o.lift ?? 0] as const, { message: `a tap on the island at ${x}, ${z}`, ...o });

/** A frame-locked tap (`tapAt`) at the middle of the first element `sel` matches, where its box is at the tap (a bug's
 *  sprite, a 0 × 0 anchor whose box is its point; a villager's button: the island moves them each frame). `clear` as
 *  tapAt's (a bug never under a button: 'button'). */
export const tapBox = (page: Page, sel: string, o: { clear?: string | null; message?: string; timeout?: number; mouse?: boolean } = {}) =>
  tapAt(page, (w, sel) => {
    const r = w.document.querySelector(sel)?.getBoundingClientRect();
    return r && (r.width || r.height || r.left || r.top) ? [r.left + r.width / 2, r.top + r.height / 2] : null;
  }, sel, { message: `a tap on ${sel}`, ...o });

/** A tap on the 3D island's model `id` (`__world3d.where`), at its point `lift` above its feet, through the camera's
 *  own projection: the game's state says where it is, not the pixels. Frame-locked (`tapAt`): polled until the model is
 *  in and shown, then read and tapped in one task (anything over it counts: it's the topmost there that's tapped). */
export const tapThing = (page: Page, id: string, { lift = 0 }: { lift?: number } = {}) =>
  tapAt(page, (w, [id, lift]) => w.__world3d.modelAt(id, lift), [id, lift] as const, { clear: null, message: `the 3D model ${id}, shown` });

/** The 3D island at rest: its camera still and nothing moving (polled; a villager wandering by doesn't count). */
export async function settled(page: Page) {
  await ready3d(page);
  await expect.poll(() => w3(page, (w) => w.camStill() && w.idle()), { timeout: 20_000, message: 'the 3D island at rest' }).toBe(true);
}

/** The camera to world z and held there (again till it holds: the scene may still re-fit its camera as it opens, a
 *  loaded runner's late), then the island at rest (`settled`: its nodes placed for that camera, so a DOM box read
 *  next is where the island draws it, not where the last camera had it). `rest` false: the camera still only (a
 *  critter swimming or flying keeps the island's frames coming: never at rest). */
export async function camTo(page: Page, z: number, rest = true) {
  // (the 3D island's hooks too: __world comes first, and a camStill read before __world3d was there threw: holidays'
  // and finds' "reading 'camStill'" in every full-tier run)
  await ready3d(page);
  await expect.poll(async () => {
    await page.evaluate((z) => (window as unknown as { __world: { go(z: number): void } }).__world.go(z), z);
    await page.waitForTimeout(250);
    return page.evaluate((z) => Math.abs((window as unknown as { __world: { cam(): number } }).__world.cam() - z), z);
  }, { timeout: 10_000, message: `the camera held at ${z}` }).toBeLessThan(1.5); // (WebKit scrolls by whole px: within a px of z)
  if (rest) await settled(page);
  else await expect.poll(() => w3(page, (w) => w.camStill()), { message: 'the camera still' }).toBe(true);
}

/** The controls under a thing's corners and middle (a building's door behind a world prop is the world's, not a
 *  control over it): [] when it stands clear of every control. Read once the camera is still (`camTo`). */
export const controlsUnder = (page: Page, sel: string) =>
  page.evaluate((s) => {
    const b = document.querySelector(s)!.getBoundingClientRect();
    const pts = [[b.left + 2, b.top + 2], [b.right - 2, b.top + 2], [b.left + 2, b.bottom - 2], [b.right - 2, b.bottom - 2], [(b.left + b.right) / 2, (b.top + b.bottom) / 2]];
    return pts.flatMap(([x, y]) => document.elementsFromPoint(x, y).filter((e) => e.closest('button') && !e.closest('[data-building]')).map((e) => e.className));
  }, sel);

/** A world node's origin (its foot) on screen against where a world point projects (px apart). */
export const offFrom = (page: Page, sel: string, x: number, z: number) =>
  page.evaluate(([sel, x, z]) => {
    const r = document.querySelector(sel as string)!.getBoundingClientRect();
    const [px, py] = (window as unknown as { __world: { at(x: number, z: number): [number, number] } }).__world.at(x as number, z as number);
    return Math.hypot(r.left - px, r.top - py);
  }, [sel, x, z] as const);

/** A tap on a figure the scene hit-tests itself (a visitor's `.art`, the cake: their layer takes no pointer, so a tap
 *  goes through to the scene, SceneTaps asks them): at its box's middle (`fy` down it). `tapOn` can't: nothing there
 *  hit-tests to the figure's own node. */
export const tapFigure = (page: Page, sel: string, fy = 0.5) =>
  // (frame-locked, tapAt: its box read at the tap; a figure walks, bobs and the camera eases)
  tapAt(page, (w, [sel, fy]) => {
    const r = w.document.querySelector(sel)?.getBoundingClientRect();
    return r?.width ? [r.left + r.width / 2, r.top + r.height * fy] : null;
  }, [sel, fy] as const, { clear: null, mouse: true, message: `the figure ${sel}` });

/** Time on: the page's clock (`page.clock.install()` first) runs `ms`, the 3D engines' frames included (the clock fakes
 *  requestAnimationFrame): the sim step. Quick in the logic tier (nothing drawn); drawn under software GL a minute of
 *  frames takes minutes (use `page.clock.fastForward` there). */
export const step = (page: Page, ms: number) => page.clock.runFor(ms);
/** The island's opening beats are over (the greeting and the day's beats played, no event queued): __world.quiet().
 *  (Twice as long drawn in the full tier, as its expects: in software GL they end 10-odd s after the island is up.) */
export const quiet = (page: Page) =>
  expect.poll(() => page.evaluate(() => (window as unknown as { __world?: { quiet?(): boolean } }).__world?.quiet?.() ?? false), { timeout: process.env.E2E_SLOW ? 30_000 : 15_000, message: 'the opening beats over' }).toBe(true);

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
 *  back, which under CI's load came after NH's short window (world/fishing.ts BITE_WINDOW_MS). Work out (x, y) before
 *  the bite; at the bite, the nearest point to it (within 60 px) under none of the island's tap areas (a villager or a
 *  tree there then takes the tap, and the fish got away: dialogue's flake). */
export async function reelOnBite(page: Page, x: number, y: number, timeout = 12_000) {
  await page.evaluate(([x0, y0, timeout, areas]) => new Promise<void>((ok, no) => {
    const bit = () => !!document.querySelector('[data-bite]');
    const tap = () => {
      let [x, y] = [x0, y0];
      for (let r = 0, done = false; r <= 60 && !done; r += 6)
        for (let a = 0; a < (r ? 16 : 1) && !done; a++) {
          const px = Math.min(innerWidth - 2, Math.max(2, x0 + Math.cos((a / 8) * Math.PI) * r)), py = y0 + Math.sin((a / 8) * Math.PI) * r;
          if (!document.elementFromPoint(px, py)?.closest(areas)) [x, y, done] = [px, py, true];
        }
      document.elementFromPoint(x, y)?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 }));
      ok();
    };
    if (bit()) return tap();
    const mo = new MutationObserver(() => bit() && (mo.disconnect(), clearTimeout(t), tap()));
    const t = setTimeout(() => (mo.disconnect(), no(new Error('no bite'))), timeout);
    mo.observe(document, { childList: true, subtree: true, attributes: true });
  }), [x, y, timeout, TAP_AREAS] as const);
}

type Fishing = {
  __fish: { fish(): { water: string; x: number; z: number }[] };
  __world: { free(x: number, z: number, away?: number): boolean; put(x: number, z: number): void; at(x: number, z: number): [number, number]; mine(): [number, number] };
};
/** My villager on the bank near the shadow in `water` (NH casts from where it stands; any water casts, this one's the
 *  near case): open ground near it, behind it on screen where there's any (so it never stands over the shadow), put
 *  there, `away` u from it at least; the camera on the shadow first (at `zoom`: a side of the island shows zoomed in).
 *  Where the shadow is seen now (client px). A spec that reads the line's direction wants `away` past the rod's reach
 *  (~36u from the feet to the tip): a float landing under the tip has no direction (fishing3d's line-up read 180°). */
export async function toTheWater(page: Page, water: string, zoom = 1, away = 40): Promise<[number, number]> {
  // (the opening beats over: a greeting's balloon at the bottom of the screen lies over the sea)
  await quiet(page);
  // (the camera where the shadow is a little below the screen's middle, at the whole island's zoom: a shadow far up
  // the island by the horizon is a speck, and the ground there is the far bank's; a shadow out by the sea's edge, off
  // the screen's side at that zoom (its x the island's middle there), zoomed in a step at a time till the camera's x
  // reaches it, 60 px in from the side)
  await page.evaluate(([water, k0]) => {
    type G = { go(z: number, k?: number, x?: number): void; client(x: number, z: number): [number, number]; view(): { camZ: number } };
    const w = (window as unknown as { __world3d: G }).__world3d, f = (window as unknown as Fishing).__fish.fish().find((f) => f.water === water)!;
    for (const k of [k0, k0 * 1.4, k0 * 1.8, k0 * 2.2]) {
      let best: [number, number] | null = null;
      for (let z = f.z - 700; z <= f.z + 100; z += 25) {
        w.go(z, k, f.x);
        const d = Math.abs(w.client(f.x, f.z)[1] - innerHeight * 0.58);
        if (!best || d < best[1]) best = [w.view().camZ, d];
      }
      w.go(best![0], k, f.x);
      const x = w.client(f.x, f.z)[0];
      if (x > 60 && x < innerWidth - 60) return;
    }
  }, [water, zoom] as const);
  await expect.poll(() => w3(page, (w) => w.camStill()), { message: 'the camera still' }).toBe(true);
  const spot = await page.evaluate(([water, away]) => {
    const w = window as unknown as Fishing, f = w.__fish.fish().find((f) => f.water === water)!;
    // (behind it; else off to its side, never just in front, where my villager would stand over it on screen: a shadow
    // off the back beach has no ground behind it)
    for (const where of ['behind', 'beside', 'any'])
      for (let r = away; r <= away + 120; r += 8)
        for (let a = 0; a < 24; a++) {
          const x = Math.round(f.x + Math.cos((a / 24) * Math.PI * 2) * r), z = Math.round(f.z + Math.sin((a / 24) * Math.PI * 2) * r);
          if (where === 'behind' ? z < f.z + 20 : where === 'beside' ? Math.abs(x - f.x) < 60 : false) continue;
          if (w.__world.free(x, z, 0)) return [x, z] as [number, number];
        }
    return null;
  }, [water, away] as const);
  expect(spot, `open ground near the ${water}'s shadow`).not.toBeNull();
  await page.evaluate(([x, z]) => (window as unknown as Fishing).__world.put(x, z), spot!);
  await expect.poll(() => page.evaluate(() => (window as unknown as Fishing).__world.mine()).then(([x, z]) => Math.hypot(x - spot![0], z - spot![1]))).toBeLessThan(1);
  // (and the camera still again: a put may bring it after my villager, and a tap mid-move lands on what was there)
  await expect.poll(() => w3(page, (w) => w.camStill()), { message: 'the camera still' }).toBe(true);
  // the shadow's spot, or the water nearest it a finger can tap (nothing of the island's over it: a canopy, a door, a
  // bush on the bank), within 60 px, else further off but within 90 u of it
  const find = () => page.evaluate((water) => {
    const w = window as unknown as Fishing & { __world3d: { ground(cx: number, cy: number): { x: number; z: number } | null }; __world: { ground(x: number, z: number): { surface: string } } };
    const f = w.__fish.fish().find((f) => f.water === water)!, [cx, cy] = w.__world.at(f.x, f.z);
    const TAPS = 'button, a, [role="button"], [data-bush], [data-tree], [data-flower], [data-sit], [data-fixture], [data-campfire], [data-building], [data-decor], [data-actor], [data-visitor], [data-fx="talk"]';
    for (let r = 0; r <= 150; r += 6)
      for (let a = 0, n = r ? 16 : 1; a < n; a++) {
        const x = cx + Math.cos((a / n) * Math.PI * 2) * r, y = cy + Math.sin((a / n) * Math.PI * 2) * r;
        const g = w.__world3d.ground(x, y), s = g && w.__world.ground(g.x, g.z).surface;
        // (within 130 u of it, however near on screen, so the shadow notices the float (fishing.ts NOTICE_U, 180 u;
        // the rest the shadow's swim while the float flies): off the back beach, high on the screen at the camera's
        // far stop, 60 px was 182 u and it never did (fishing-taps' back beach, flaky in 5 runs); and past 60 px the
        // sea round it lies under the doors' tap areas there)
        if (!g || Math.hypot(g.x - f.x, g.z - f.z) > 130) continue;
        // (on screen; for the sea, the sea's: a clifftop pool by the back beach is water too)
        if (x < 8 || x > innerWidth - 8 || y < 8 || y > innerHeight - 8) continue;
        // (K.K.'s art takes no pointer, the scene asks him: a tap within his box is his)
        const figure = [...document.querySelectorAll('[data-kk] .art')].some((el) => {
          const b = el.getBoundingClientRect();
          return x > b.left - 14 && x < b.right + 14 && y > b.top - 14 && y < b.bottom + 14;
        });
        if ((water === 'sea' ? s === 'sea' : s === 'water' || s === 'sea') && !figure && !document.elementFromPoint(x, y)?.closest(TAPS)) return [x, y] as [number, number];
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

/** A frame-locked tap (`tapAt`) on the water by the shadow in `water`: toTheWater's spot, kept as the world point under
 *  it and projected again at the tap, still that water there (for the sea, the sea) and clear of the island's tap
 *  areas. Where it tapped, and the world point (where the float must land). */
export async function tapWater(page: Page, water: string, zoom = 1, away = 40, { timeout, dispatch }: { timeout?: number; dispatch?: boolean } = {}): Promise<Tapped & { at: { x: number; z: number } }> {
  const at = await groundUnder(page, await toTheWater(page, water, zoom, away));
  return { ...(await tapAt(page, onWater, [at.x, at.z, water] as const, { message: `a tap on the ${water} by its shadow`, timeout, dispatch })), at };
}
/** The world point under a client point (the 3D island's ground). */
export const groundUnder = async (page: Page, [x, y]: readonly [number, number]) =>
  (await page.evaluate(([x, y]) => (window as unknown as { __world3d: { ground(cx: number, cy: number): { x: number; z: number } | null } }).__world3d.ground(x, y), [x, y] as const))!;
/** `tapAt`'s aim at world (x, z) on `water` (for the sea, the sea's): where it is now, while it's that water there. */
export const onWater: Aim<readonly [number, number, string]> = (w, [gx, gz, water]) => {
  const p = w.__world.at(gx, gz), g = w.__world3d.ground(p[0], p[1]), s = g && w.__world.ground(g.x, g.z).surface;
  return (water === 'sea' ? s === 'sea' : s === 'water' || s === 'sea') ? p : null;
};

/** A cast by the shadow in `water` from its bank (`tapWater`, frame-locked), checked, and tried again where the shadow
 *  has gone (at most four) until the tap cast. Where it cast (client px): a reel's tap there is on the island, never on
 *  a door (a door with the line out goes in). */
export async function castIn(page: Page, water: string, zoom = 1, away = 40): Promise<[number, number]> {
  for (let i = 0; i < 4; i++) {
    // (dispatched: a tree's tap area on the bank comes in as its lazy art loads, between a read and a real tap)
    const t = await tapWater(page, water, zoom, away, { timeout: 1500, dispatch: true }).catch(() => null);
    if (t && (await expect.poll(() => page.evaluate(() => (window as unknown as { __fish: { line(): unknown } }).__fish.line()), { timeout: 1500 }).not.toBeNull().then(() => true, () => false)))
      return [t.x, t.y];
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
    // (at rest: Finds shows a spot once the camera settles there and nothing covers it, so the count read next holds)
    await settled(page);
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
      // (a visitor's art and K.K.'s take no pointer, the scene asks them: a tap within its box, a thumb round it, is theirs)
      if ([...document.querySelectorAll('[data-visitor] .art, [data-kk] .art')].some((el) => {
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

/** A point of the left tree's canopy the finger reaches (its middle, else the nearest part the popup leaves open). */
export const canopyAt = (page: Page) =>
  page.locator('button.canopy').first().evaluate((el) => {
    const b = el.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    for (let d = 0; d < b.height / 2; d += 4)
      for (const [dx, dy] of [[0, d], [0, -d], [d, 0], [-d, 0], [d, d], [-d, d]])
        if (document.elementFromPoint(cx + dx, cy + dy)?.closest('button.canopy') === el) return { x: cx + dx, y: cy + dy };
    return { x: cx, y: cy };
  });
/** The popup where it stays (or none): it's placed, then placed again as its rows come in and it grows (FruitTree
 *  fitPopup), so a canopy point it left open a frame ago may be under it now (the next tap the popup's). Three frames
 *  unmoved, at most 400 ms. */
const popupStill = async (page: Page) => {
  await poppedIn(page);
  await page.evaluate(() => new Promise<void>((ok) => {
    const t0 = performance.now();
    let last = '', same = 0;
    const frame = () => {
      const b = document.querySelector('.detail')?.getBoundingClientRect();
      const now = b ? `${b.left},${b.top},${b.width},${b.height}` : '';
      same = now === last ? same + 1 : 0;
      last = now;
      if (!now || same >= 3 || performance.now() - t0 > 400) ok();
      else requestAnimationFrame(frame);
    };
    frame();
  }));
};
/** The popup's pop-in over (FruitTree's `if-pop`, 360 ms: a CSS animation, on the wall clock, which an installed clock
 *  doesn't hold): while it plays the popup is smaller than it ends, so a canopy point it leaves open then is under it
 *  after (the next tap the popup's, the shake's run a tap short). */
const poppedIn = (page: Page) =>
  page.evaluate(() => Promise.all((document.querySelector('.detail')?.getAnimations() ?? []).map((a) => a.finished.catch(() => {}))).then(() => {}));
/** A thing watched for: a selector, or a selector with this text in one of its nodes (only those nodes read), or
 *  `each`: every node of the selector added, counted (two overlapping at once are two: a shooting star's streak). */
export type Coming = string | { sel: string; text: string } | { sel: string; each: true };
/** Watches, from now, for each thing's comings (it there after it wasn't): a transient effect (a sparkle, the tap's
 *  ring, hearts, a banner) seen however late a loaded runner looks, and a second coming counted. One watch a page: a
 *  new one stops the last (whose `came` throws then). Returns how many came of `k` (a key not watched throws). */
export async function watchComings(page: Page, things: Record<string, Coming>) {
  await page.evaluate((things) => {
    const W = window as unknown as { __came: Record<string, number>; __comingsMO?: MutationObserver };
    W.__comingsMO?.disconnect();
    const there = (t: Coming) =>
      typeof t === 'string' ? !!document.querySelector(t) : [...document.querySelectorAll(t.sel)].some((el) => 'text' in t && el.textContent?.includes(t.text));
    const on: Record<string, boolean> = {};
    W.__came = {};
    for (const k in things) (W.__came[k] = 0), (on[k] = there(things[k]));
    W.__comingsMO = new MutationObserver((ms) => {
      for (const k in things) {
        const t = things[k];
        if (typeof t !== 'string' && 'each' in t) {
          for (const m of ms) for (const n of m.addedNodes) if (n instanceof Element) W.__came[k] += (n.matches(t.sel) ? 1 : 0) + n.querySelectorAll(t.sel).length;
          continue;
        }
        const now = there(t);
        if (now && !on[k]) W.__came[k]++;
        on[k] = now;
      }
    });
    W.__comingsMO.observe(document.body, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-act'], // (data-act: a villager's motion)
      characterData: Object.values(things).some((t) => typeof t !== 'string' && 'text' in t)
    });
  }, things);
  return (k: string) => {
    if (!(k in things)) throw new Error(`watchComings: '${k}' isn't watched (${Object.keys(things).join(', ')})`);
    return page.evaluate((k) => {
      const c = (window as unknown as { __came: Record<string, number> }).__came;
      if (!(k in c)) throw new Error(`watchComings: '${k}' no longer watched (a later watch on this page replaced it)`);
      return c[k];
    }, k);
  };
}
/** The page's installed clock paused about now: a moment ahead of the page's time, which runs on during the round
 *  trip (pauseAt can't go back: again further ahead if the page got there first). */
export async function pauseNow(page: Page) {
  for (let ahead = 250; ; ahead *= 2) {
    const at = await page.evaluate((ms) => Date.now() + ms, ahead);
    if (await page.clock.pauseAt(at).then(() => true, (e: Error) => (/to the past/.test(e.message) && ahead < 8000 ? false : Promise.reject(e)))) return;
  }
}
/** The popup's box (or ''), read once. */
const popupBox = (page: Page) =>
  page.evaluate(() => {
    const b = document.querySelector('.detail')?.getBoundingClientRect();
    return b ? `${b.left},${b.top},${b.width},${b.height}` : '';
  });
/** NH's shake of the left goal tree: three quick taps on its canopy, each where the popup leaves it open. `onClock`:
 *  on the page's own clock (installed by the caller; left running after): paused for the taps, so they come 120 ms
 *  of the page's time apart (the popup's pop-in waited out on the wall clock, its placing a few frames of the page's),
 *  however long a round trip takes (the full tier's software-GL frames spread the wall-clock taps past
 *  SHAKE_WINDOW_MS). */
export async function shakeTree(page: Page, o: { onClock?: boolean } = {}) {
  if (o.onClock) {
    await pauseNow(page);
    try {
      for (let i = 0; i < 3; i++) {
        if (i) {
          await page.clock.runFor(120);
          await poppedIn(page);
          // the popup at rest (it's placed again as its rows come in): unmoved over a frame or so, at most 5 tries
          for (let k = 0, was = await popupBox(page); k < 5; k++) {
            await page.clock.runFor(50);
            const now = await popupBox(page);
            if (now === was) break;
            was = now;
          }
        }
        const c = await canopyAt(page);
        await page.mouse.click(c.x, c.y);
      }
    } catch (e) {
      // (a step failed: the clock running again all the same, as after the taps)
      await page.clock.resume().catch(() => {});
      throw e;
    }
    await page.clock.resume();
    return;
  }
  for (let i = 0; i < 3; i++) {
    await popupStill(page);
    const c = await canopyAt(page);
    await page.mouse.click(c.x, c.y);
    await page.waitForTimeout(120); // hold: a finger's rhythm, not a state: three taps 120 ms apart, a run within SHAKE_WINDOW_MS
  }
}
