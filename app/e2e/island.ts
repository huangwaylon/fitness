// The 3D island in the specs: its being up (`is3d`: the island's hooks and its models loaded), its hooks (`w3`, window.__world3d: Island3D.svelte), and taps by
// what a tap goes to (`__world3d.pick`) and where a thing is (`box`), by kind and id (`tapOn`: a thing only where a tap there is its own: in 3D the whole
// island is in view, so a villager or a visitor in front covers much of a small door).
import { expect, type BrowserContext, type Page } from './fixtures.ts';
import { hudMenu } from './hud.ts';
import { CONTROLS, type Actor, type Box, type BoxKind, type Care, type Critter, type Find, type FxSeen, type Picked, type PickKind, type Piece, type Props, type Shakes, type Visitor } from '../src/lib/components/island/probe.ts';

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
  /** What a tap at client (cx, cy) goes to (a villager, a door, a tree, a seat, …: island/probe.ts), or null: the
   *  ground or the sky. */
  pick(cx: number, cy: number): Picked | null;
  /** Where thing (`kind`, `id`) is on screen (client px, and its node's foot), or null: not there. */
  box(kind: BoxKind, id?: string): Box | null;
  /** What thing (`kind`, `id`) draws on screen (its art, not its tap area; a tree's leaves, a `trunk`'s trunk), or null. */
  drawn(kind: BoxKind, id?: string): Omit<Box, 'foot'> | null;
  /** Scenery piece `id` (a tree, a bush, a fixed decor piece, the decor, a building, a flower) as shown: its look, the
   *  seat it is, its fixture, tipped, lit, watered; null: not there. With no id, every piece shown. */
  scenery(id: string): Piece | null;
  scenery(): Piece[];
  /** A villager as the island shows it (`slot`: mine, partner, third). */
  actor(slot?: string): Actor | null;
  /** Every control shown and its box (client px), stacked or not (`pick` finds only the topmost). */
  controls(): { kind: PickKind; id: string; box: Omit<Box, 'foot'> }[];
  /** Goal tree `tree` (A, B) as shown: its popup open, its glints; null: no such tree. */
  goal(tree: string): { open: boolean; glints: boolean } | null;
  /** Goal tree `tree`'s fruit: id, stage (tree, fall, ground), up in the canopy, dropping, grey (1 at 0 %, 0 once met). */
  fruit(tree: string): { f: string; stage: string | null; up: boolean; dropping: boolean; grey: number }[];
  /** The critters out: a bug (`id` its species: its place, flight, a stalker's stalk, sat on something) or a shadow (`id`
   *  fish or pond: its water, pool, shape `fin`); `gone`/`fled` on the way out. */
  critters(): Critter[];
  /** The dive spot's bubbles (the item under them) and a dive on (the splash, the shadow it chases). */
  dive(): { bubbles: string | null; dive: 'splash' | 'chase' | null };
  /** The visitors out (K.K.'s id `kk`): slot, phase, way, stage, asleep, motion, vegAsk, walking; K.K.'s mode and
   *  playing; shown, card, emote, fx, treat, heart (island/probe.ts visitorsOf). */
  visitors(): Visitor[];
  /** The day's props out: the cake (out), the arch, Toy Day's presents, Halloween and its pumpkins (lit), the tape deck
   *  (state, hint); each shown and its art's box. */
  props(): Props;
  /** A tree shake's leavings: what fell to pick up (what: branch, coconut, wood, dangler; id; item: the wood's kind;
   *  box), the nests (fading), the swarms (side, stung), the bug dangling (bug, up: climbing back). */
  shakes(): Shakes;
  /** The bulletin board: its 「！」 up (`unseen`: a note I haven't read); null: not out. */
  board(): { unseen: boolean } | null;
  /** The day's finds lying out: kind (fossil, mushroom, present, shell, fragment, bottle), item id, uid, a present's
   *  tree and its fall, shown (drawn now), foot (the point it lies on), its art's box. */
  finds(): Find[];
  /** The care things out (the day's weeds, `sprout` just up; the rock, uid `rock`): shown, foot, art's box. */
  care(): Care[];
  /** The day's dig spots and weeds wherever they are, shown or not (world x, z). */
  spots(): { digs: [number, number][]; weeds: [number, number][] };
  /** The 3D island's effects as they fired, oldest first, the last 200 (a tap's `ring`: mine v null, a partner's
   *  '#ddefff'; the high five's `zap`; …): `at` the page's performance.now(). */
  fxLog(): FxSeen[];
};
export const w3 = <R,>(page: Page, fn: (w: W3) => R) => page.evaluate(`(${fn.toString()})(window.__world3d)`) as Promise<R>;

/** The island's hooks there to read: __world and the 3D island's __world3d (it comes a moment after __world). */
async function ready3d(page: Page) {
  await page.waitForFunction(() => { const w = window as unknown as { __world?: unknown; __world3d?: unknown }; return !!w.__world && !!w.__world3d; }, null, { timeout: 30_000, polling: 100 }); // (not rAF: a tab behind another runs no frames)
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

/** A tap on thing (`kind`, `id`) at the first point of its box (`__world3d.box`, row by row from the top) a tap there
 *  goes to (`pick`: it, or the same tap area as another thing, a bench's seat): never through something standing in
 *  front of it (polled: a villager in front may still be walking). Frame-locked (tapAt), the mouse's. */
export const tapOn = (page: Page, kind: BoxKind, id = '', { mouse = true }: { mouse?: boolean } = {}) =>
  tapAt(page, (w, [kind, id]) => {
    const r = w.__world3d.box(kind, id);
    if (!r?.width) return null;
    for (let fy = 0.1; fy < 1; fy += 0.1)
      for (const fx of [0.5, 0.35, 0.65, 0.2, 0.8]) {
        const x = r.left + r.width * fx, y = r.top + r.height * fy, p = w.__world3d.pick(x, y);
        if (p && [p, ...p.also].some((t: { kind: string; id: string }) => t.kind === kind && t.id === id)) return [x, y];
      }
    return null;
  }, [kind, id] as const, { clear: null, mouse, message: `a point of ${kind} ${id} not covered by anything in front of it` });

/** A point of thing (`kind`, `id`)'s box a tap there goes to (`pick`: it, or the same tap area as another thing), its
 *  middle first, then out from it (`fy`: up its middle from `fy` of the way down instead, null when none: a trunk's
 *  base), or its middle when nothing there is (covered). Read now, not frame-locked: for taps on a paused clock. */
export const pointOn = async (page: Page, kind: BoxKind, id = '', fy?: number) =>
  (await ready3d(page), page.evaluate(([kind, id, fy]) => {
    const w = (window as unknown as { __world3d: W3 }).__world3d, b = w.box(kind, id);
    if (!b) return null;
    const own = (x: number, y: number) => { const p = w.pick(x, y); return !!p && [p, ...p.also].some((t) => t.kind === kind && t.id === id); };
    const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    if (fy !== null) {
      for (let y = b.top + b.height * fy; y > b.top; y -= 3) for (const dx of [0, -6, 6, -12, 12]) if (own(cx + dx, y)) return { x: cx + dx, y, w: b.width };
      return null;
    }
    for (let d = 0; d < Math.max(b.width, b.height) / 2; d += 3)
      for (const [dx, dy] of [[0, d], [0, -d], [d, 0], [-d, 0], [d, d], [-d, d]]) if (own(cx + dx, cy + dy)) return { x: cx + dx, y: cy + dy, w: b.width };
    return { x: cx, y: cy, w: b.width };
  }, [kind, id, fy ?? null] as const));

/** Watch from the page's first script for things that come and go before a slow island (CI's software GL) lets the
 *  spec look: `sawIt(page, thing)` says whether it was ever there (a selector matched, a visitor's phase (`VisitorIs`), or a villager as `Coming`'s
 *  `actor`: `*` any of them). Before `goto`. */
export async function watchFor(page: Page, things: readonly (string | ActorIs | VisitorIs)[]) {
  await page.addInitScript((things) => {
    const W = window as unknown as { __saw?: Record<string, boolean>; __world3d?: W3 };
    const key = (t: string | ActorIs | VisitorIs) => (typeof t === 'string' ? t : JSON.stringify(t));
    const saw: Record<string, boolean> = (W.__saw = Object.fromEntries(things.map((t) => [key(t), false])));
    const is = (t: ActorIs | VisitorIs) => {
      if ('visitor' in t) return !!W.__world3d?.visitors().some((v) => v.id === t.visitor && `phase:${v.phase}` === t.is);
      return (t.actor === '*' ? ['mine', 'partner', 'third'] : [t.actor]).some((s) => {
        const a = W.__world3d?.actor(s);
        return !!a && (t.is === 'walking' ? a.walking : t.is.startsWith('act:') ? a.act === t.is.slice(4) : a.fx.includes(t.is.slice(3)));
      });
    };
    const look = () => {
      for (const t of things) if (!saw[key(t)] && (typeof t === 'string' ? document.querySelector(t) : is(t))) saw[key(t)] = true;
    };
    new MutationObserver(look).observe(document, { childList: true, subtree: true, attributes: true });
  }, things);
}
export const sawIt = (page: Page, thing: string | ActorIs | VisitorIs) =>
  page.evaluate((k) => !!(window as unknown as { __saw?: Record<string, boolean> }).__saw?.[k], typeof thing === 'string' ? thing : JSON.stringify(thing));

/** The island's buttons (a villager, a door, the decor, a goal tree, the balloon, any control: `pick`'s kinds), for
 *  tapAt's `clear`: a point under none of them (scenery is fine: a bug flying past a bush). */
export const BUTTONS: readonly PickKind[] = CONTROLS;

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
 *  tries) while `aim` has no point, it's off the screen, or a tap there goes to something (`__world3d.pick`; `clear`:
 *  only these kinds of thing; null: anything goes);
 *  then one tap. `dispatch`: the finger's events (pointerdown, pointerup, click) sent from the page in the same task as
 *  the read, nothing at all between them (not even a lazy tap area coming in), but untrusted: exactTaps.ts leaves them
 *  be. Where it tapped, and on what. */
export async function tapAt<A>(page: Page, aim: Aim<A>, arg: A, o: { clear?: readonly PickKind[] | null; message?: string; timeout?: number; intervals?: number[]; mouse?: boolean; dispatch?: boolean } = {}): Promise<Tapped> {
  const clear = o.clear === undefined ? 'all' : o.clear;
  const read = () => page.evaluate(`(async (aim, arg, clear, dispatch) => {
    if (!dispatch) await ${HOLD}.on();
    const p = aim(window, arg), [x, y] = p || [];
    const el = p && document.elementFromPoint(x, y), hit = el && clear ? window.__world3d.pick(x, y) : null;
    const over = hit && (clear === 'all' || clear.includes(hit.kind)) ? hit : null;
    const why = !p ? 'no point yet' : !(x >= 1 && y >= 1 && x <= innerWidth - 1 && y <= innerHeight - 1) ? 'off the screen at ' + x + ',' + y
      : !el || over ? 'at ' + Math.round(x) + ',' + Math.round(y) + ' ' + (over ? 'under ' + over.kind + ' ' + over.id : 'nothing') : '';
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
export const tapWorld = (page: Page, x: number, z: number, o: { lift?: number; clear?: readonly PickKind[] | null; message?: string; mouse?: boolean } = {}) =>
  tapAt(page, (w, [x, z, lift]) => (w.__world3d ? w.__world3d.client(x, z, lift) : w.__world.at(x, z)), [x, z, o.lift ?? 0] as const, { message: `a tap on the island at ${x}, ${z}`, ...o });

/** A frame-locked tap (`tapAt`) at the middle of thing (`kind`, `id`)'s box (`__world3d.box`) where it is at the tap (a
 *  bug's sprite, a 0 × 0 anchor whose box is its point; a villager: the island moves them each frame). `clear` as
 *  tapAt's (a bug never under a button: BUTTONS). */
export const tapBox = (page: Page, kind: BoxKind, id = '', o: { clear?: readonly PickKind[] | null; message?: string; timeout?: number; mouse?: boolean } = {}) =>
  tapAt(page, (w, [kind, id]) => {
    const r = w.__world3d.box(kind, id);
    return r && (r.width || r.height || r.left || r.top) ? [r.left + r.width / 2, r.top + r.height / 2] : null;
  }, [kind, id] as const, { message: `a tap on ${kind} ${id}`, ...o });

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

/** The controls a tap at a thing's corners and middle goes to (`pick`: a building's door behind a world prop is the
 *  world's, not a control over it), as kind:id: [] when it stands clear of every control. Read once the camera is still
 *  (`camTo`). */
export const controlsUnder = async (page: Page, kind: BoxKind, id = '') =>
  (await ready3d(page), page.evaluate(([kind, id, controls]) => {
    const w = (window as unknown as { __world3d: W3 }).__world3d, b = w.box(kind, id)!, [r, bt] = [b.left + b.width, b.top + b.height];
    const pts = [[b.left + 2, b.top + 2], [r - 2, b.top + 2], [b.left + 2, bt - 2], [r - 2, bt - 2], [(b.left + r) / 2, (b.top + bt) / 2]];
    return pts.map(([x, y]) => w.pick(x, y)).filter((p) => !!p && p.kind !== 'building' && controls.includes(p.kind)).map((p) => `${p!.kind}:${p!.id}`);
  }, [kind, id, CONTROLS] as const));

/** Villager `slot` (mine, partner, third) as the island shows it (`__world3d.actor`: its motion, walking, seat, hat, …),
 *  or null: not out. */
export const villager = async (page: Page, slot = 'mine'): Promise<Actor | null> =>
  (await ready3d(page), page.evaluate((s) => (window as unknown as { __world3d: W3 }).__world3d.actor(s), slot));
/** Whether villager `slot` is walking now (`villager`). */
export const walking = (page: Page, slot = 'mine') => villager(page, slot).then((a) => !!a?.walking);
/** The slot (mine, partner, third) of person `who`'s villager (A, B, G) on this phone, or null: not out. */
export const slotOf = async (page: Page, who: string): Promise<string | null> =>
  (await ready3d(page), page.evaluate((who) => ['mine', 'partner', 'third'].find((s) => (window as unknown as { __world3d: W3 }).__world3d.actor(s)?.who === who) ?? null, who));
/** Villager `slot`'s feet on screen now (client px: its box's foot), or null: not out. */
export const feetOf = async (page: Page, slot = 'mine'): Promise<[number, number] | null> =>
  (await ready3d(page), page.evaluate((s) => (window as unknown as { __world3d: W3 }).__world3d.box('villager', s)?.foot ?? null, slot));
/** Visitor `id` (K.K.: `kk`) as the island shows it (`__world3d.visitors`: phase, asleep, motion, shown, fx, …), only
 *  in `slot` (visitor, guest) if given, or null: not out. Polled: `expect.poll(async () => (await visitorOut(page,
 *  'jack'))?.shown).toBe(true)`. */
export const visitorOut = async (page: Page, id: string, slot?: string): Promise<Visitor | null> =>
  (await ready3d(page), page.evaluate(([id, slot]) => (window as unknown as { __world3d: W3 }).__world3d.visitors().find((v) => v.id === id && (!slot || v.slot === slot)) ?? null, [id, slot ?? null] as const));
/** The visitors out but K.K. (the day's and its guest), only `slot`'s if given. */
export const visitorsOut = async (page: Page, slot?: string): Promise<Visitor[]> =>
  (await ready3d(page), page.evaluate((slot) => (window as unknown as { __world3d: W3 }).__world3d.visitors().filter((v) => v.id !== 'kk' && (!slot || v.slot === slot)), slot ?? null));
/** The day's props out (`__world3d.props`: the cake, the arch, the toys, Halloween's pumpkins, the tape deck). */
export const propsOut = async (page: Page): Promise<Props> => (await ready3d(page), page.evaluate(() => (window as unknown as { __world3d: W3 }).__world3d.props()));
/** A tree shake's leavings now (`__world3d.shakes`: the drops to pick up, nests, swarms, the dangling bug). */
export const shakesOut = async (page: Page): Promise<Shakes> => (await ready3d(page), page.evaluate(() => (window as unknown as { __world3d: W3 }).__world3d.shakes()));
/** The drops lying out to pick up (`what`: branch, its id the tree's; coconut; wood; dangler, the bug's), only `what`'s if given. */
export const dropsOut = async (page: Page, what?: string) => (await shakesOut(page)).drops.filter((d) => !what || d.what === what);
/** The bulletin board's 「！」 up (a note I haven't read: `__world3d.board`). */
export const boardUnseen = async (page: Page) => (await ready3d(page), page.evaluate(() => !!(window as unknown as { __world3d: W3 }).__world3d.board()?.unseen));
/** A tap on the bulletin board (`tapOn` its tap area: pick's `board`; `mouse` false: a finger's), the camera brought to
 *  it first when it isn't wholly on the screen (its 3D model's spot: `where('board')`). */
export async function tapBoard(page: Page, { mouse = true }: { mouse?: boolean } = {}) {
  await islandUp(page);
  const off = () => w3(page, (w) => { const b = w.box('board'); return !b || b.top < 0 || b.top + b.height > innerHeight; });
  if (await off()) {
    await expect.poll(() => w3(page, (w) => !!w.where('board')), { timeout: 20_000, message: 'the board’s model in' }).toBe(true);
    const z = await w3(page, (w) => -w.where('board')!.z);
    await page.evaluate((z) => (window as unknown as { __world: { go(z: number): void } }).__world.go(z), z - 114);
  }
  await tapOn(page, 'board', '', { mouse });
}
/** The page's clock now (performance.now(): `fxLog`'s `at`), to count effects from. */
export const pageNow = (page: Page) => page.evaluate(() => performance.now());
/** How many effects of `kind` fired after page time `since` (`__world3d.fxLog`: a tap's `ring`, the high five's `zap`),
 *  only those of colour `v` if given (a ring: mine null, a partner's '#ddefff'). However brief, a hidden tab's too. */
export const fxSince = async (page: Page, kind: string, since = 0, v?: string | null) =>
  (await ready3d(page), page.evaluate(([k, s, v, any]) => (window as unknown as { __world3d: W3 }).__world3d.fxLog().filter((e) => e.kind === k && e.at > s && (any || e.v === v)).length, [kind, since, v ?? null, v === undefined] as const));

/** Thing (`kind`, `id`)'s foot on screen (its node's origin, `box`) against where a world point projects (px apart). */
export const offFrom = async (page: Page, kind: BoxKind, id: string, x: number, z: number) =>
  // (the 3D island's hooks there first: __world comes a moment before __world3d)
  (await ready3d(page), page.evaluate(([kind, id, x, z]) => {
    const w = window as unknown as { __world3d: W3; __world: { at(x: number, z: number): [number, number] } };
    const [fx, fy] = w.__world3d.box(kind, id)!.foot!, [px, py] = w.__world.at(x, z);
    return Math.hypot(fx - px, fy - py);
  }, [kind, id, x, z] as const));

/** A tap on a figure the scene hit-tests itself (a visitor, K.K., the cake: their layer takes no pointer, so a tap goes
 *  through to the scene, SceneTaps asks them): at its box's middle (`fy` down it). `tapOn` can't: no tap area there is
 *  the figure's own (`pick` says the ground). */
export const tapFigure = (page: Page, kind: BoxKind, id = '', fy = 0.5) =>
  // (frame-locked, tapAt: its box read at the tap; a figure walks, bobs and the camera eases)
  tapAt(page, (w, [kind, id, fy]) => {
    const r = w.__world3d.box(kind, id);
    return r?.width ? [r.left + r.width / 2, r.top + r.height * fy] : null;
  }, [kind, id, fy] as const, { clear: null, mouse: true, message: `the figure ${kind} ${id}` });

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
 *  the bite; at the bite, the nearest point to it (within 60 px) a tap at goes to nothing (`pick`: a villager or a tree
 *  there then takes the tap, and the fish got away: dialogue's flake). */
export async function reelOnBite(page: Page, x: number, y: number, timeout = 12_000) {
  await page.evaluate(([x0, y0, timeout]) => new Promise<void>((ok, no) => {
    const bit = () => !!document.querySelector('[data-bite]');
    const tap = () => {
      let [x, y] = [x0, y0];
      for (let r = 0, done = false; r <= 60 && !done; r += 6)
        for (let a = 0; a < (r ? 16 : 1) && !done; a++) {
          const px = Math.min(innerWidth - 2, Math.max(2, x0 + Math.cos((a / 8) * Math.PI) * r)), py = y0 + Math.sin((a / 8) * Math.PI) * r;
          if (!(window as unknown as { __world3d: W3 }).__world3d.pick(px, py)) [x, y, done] = [px, py, true];
        }
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
    const w = window as unknown as Fishing & { __world3d: W3 & { ground(cx: number, cy: number): { x: number; z: number } | null }; __world: { ground(x: number, z: number): { surface: string } } };
    const f = w.__fish.fish().find((f) => f.water === water)!, [cx, cy] = w.__world.at(f.x, f.z), kk = w.__world3d.box('kk');
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
        const figure = !!kk && x > kk.left - 14 && x < kk.left + kk.width + 14 && y > kk.top - 14 && y < kk.top + kk.height + 14;
        if ((water === 'sea' ? s === 'sea' : s === 'water' || s === 'sea') && !figure && !w.__world3d.pick(x, y)) return [x, y] as [number, number];
      }
    return null;
  }, water);
  // (still clear a moment later: nothing walking over it, a villager or a balloon)
  const clear = (p: [number, number]) => page.evaluate(([x, y]) => !(window as unknown as { __world3d: W3 }).__world3d.pick(x, y), p);
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

/** A dig spot on screen and where to tap it (client px): the camera to each of the day's in turn (`spots().digs`: on
 *  the layout they lie all over the long island) until one is in view with nothing over it. */
export async function fossilOnScreen(page: Page): Promise<{ x: number; y: number }> {
  const zs = (await daySpots(page)).digs.map(([, z]) => z);
  const find = () => page.evaluate(() => {
    const w = (window as unknown as { __world3d: W3 }).__world3d;
    // (its foot: the spot's middle, flat on the ground)
    return w.finds().filter((f) => f.kind === 'fossil' && f.shown).map((f) => f.foot)
      .filter(([x, y]) => y > 100 && y < innerHeight - 60 && !w.pick(x, y)).map(([x, y]) => ({ x, y }))[0] ?? null;
  });
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
    const w3 = (window as unknown as { __world3d: W3 }).__world3d;
    const figures = w3.visitors().map((v) => (v.id === 'kk' ? w3.box('kk') : w3.box('visitor', v.id))).filter((b) => !!b);
    const bare = (px: number, pz: number) => {
      if (!onScreen) return true;
      const [sx, sy] = w.at(px, pz);
      if (sy < 120 || sy > innerHeight - 100 || sx < 30 || sx > innerWidth - 30) return false;
      // the point and a thumb round it
      if (![[0, 0], [-14, 0], [14, 0], [0, -14], [0, 14]].every(([dx, dy]) => !!document.elementFromPoint(sx + dx, sy + dy) && !w3.pick(sx + dx, sy + dy))) return false;
      // (a visitor's figure and K.K.'s take no pointer, the scene asks them: a tap within its box, a thumb round it, is theirs)
      if (figures.some((r) => sx > r!.left - 14 && sx < r!.left + r!.width + 14 && sy > r!.top - 14 && sy < r!.top + r!.height + 14)) return false;
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
    // (a packed catalogue icon is an object URL, or not known yet: data-art names its key)
    return { src: img?.dataset.art ? `/${img.dataset.art}.webp` : img?.dataset.src || img?.getAttribute('src') || '', x: at.left + at.width / 2 + off('--dx'), y: at.top + at.height / 2 + off('--dy') };
  });
  expect(r.src).toMatch(typeof art === 'string' ? `/${art}.webp` : art);
  return { x: r.x, y: r.y };
}

/** A point of the left goal tree (A's) the finger reaches (its middle, else the nearest part the popup leaves open). */
export const canopyAt = async (page: Page) => (await pointOn(page, 'goal', 'A'))!;
/** Goal tree `who` (A, B) as shown (`__world3d.goal`): its popup open, its glints. */
export const goalTree = async (page: Page, who: string) => (await ready3d(page), page.evaluate((who) => (window as unknown as { __world3d: W3 }).__world3d.goal(who), who));
/** Goal tree `who`'s fruit (`__world3d.fruit`). */
export const fruitOn = async (page: Page, who: string) => (await ready3d(page), page.evaluate((who) => (window as unknown as { __world3d: W3 }).__world3d.fruit(who), who));
/** Critter `id` out (a bug's species; `fish`, or `pond` in `water`: a shadow), the first; null: none (gone ones count
 *  till they're off: `gone`). Its `box`'s middle: `mid`. */
export const critter = async (page: Page, id: string, water?: string): Promise<Critter | null> =>
  (await ready3d(page), page.evaluate(([id, water]) => (window as unknown as { __world3d: W3 }).__world3d.critters().find((c) => c.id === id && (!water || c.water === water)) ?? null, [id, water] as const));
/** Critter `id` (in `water`) out (`critter`), polled: `expect.poll(() => isOut(page, 'fish')).toBe(true)`. */
export const isOut = async (page: Page, id: string, water?: string) => !!(await critter(page, id, water));
/** A box's middle (client px). */
export const mid = (b: { left: number; top: number; width: number; height: number }) => ({ x: b.left + b.width / 2, y: b.top + b.height / 2 });
/** My float (__fish.line()): flying out (`cast`), on the water (`wait`), under (`bite`); null: no line out. */
export const float = (page: Page) =>
  page.evaluate(() => {
    const l = (window as unknown as { __fish?: { line(): { landed: boolean; under: boolean } | null } }).__fish?.line();
    return l ? (l.under ? 'bite' : l.landed ? 'wait' : 'cast') : null;
  });
/** The dive spot's bubbles and a dive on (`__world3d.dive()`). */
export const diveNow = async (page: Page) => (await ready3d(page), page.evaluate(() => (window as unknown as { __world3d: W3 }).__world3d.dive()));
/** The day's finds lying out (`__world3d.finds()`: kind, item id, uid, a present's tree and fall, shown, foot, art's
 *  box), only `kind`'s (fossil, mushroom, present, shell, fragment, bottle) if given. */
export const findsOut = async (page: Page, kind?: string): Promise<Find[]> =>
  (await ready3d(page), page.evaluate((k) => (window as unknown as { __world3d: W3 }).__world3d.finds().filter((f) => !k || f.kind === k), kind ?? null));
/** How many finds of `kind` (or any) lie out, polled: `expect.poll(() => findCount(page, 'shell')).toBe(2)`. */
export const findCount = async (page: Page, kind?: string) => (await findsOut(page, kind)).length;
/** The care things out (`__world3d.care()`: the day's weeds, the rock), only `kind`'s (weed, rock) if given. */
export const careOut = async (page: Page, kind?: string): Promise<Care[]> =>
  (await ready3d(page), page.evaluate((k) => (window as unknown as { __world3d: W3 }).__world3d.care().filter((c) => !k || c.kind === k), kind ?? null));
/** The day's dig spots and weeds wherever they are, shown or not (`__world3d.spots()`: world x, z). */
export const daySpots = async (page: Page) => (await ready3d(page), page.evaluate(() => (window as unknown as { __world3d: W3 }).__world3d.spots()));
/** Scenery piece `id` as shown (`__world3d.scenery`: look, sit, fixture, tipped, lit, watered), or null: not there. */
export const piece = async (page: Page, id: string) => (await ready3d(page), page.evaluate((id) => (window as unknown as { __world3d: W3 }).__world3d.scenery(id), id));
/** The flowers watered today (their ids). */
export const watered = async (page: Page) => (await ready3d(page), page.evaluate(() => (window as unknown as { __world3d: W3 }).__world3d.scenery().filter((p) => p.watered).map((p) => p.id)));
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
 *  `each`: every node of the selector added, counted (two overlapping at once are two: a shooting star's streak), or
 *  `actor`: villager `actor` as the island's probe shows it (`__world3d.actor`) doing `is`: walking, an act (`act:hop`),
 *  a flourish (`fx:hearts`). */
export type Coming = string | { sel: string; text: string } | { sel: string; each: true } | ActorIs | FxIs | ShakeIs;
/** Villager `actor` (a slot; `watchFor`: `*` any) doing `is`, as the island's probe shows it (`__world3d.actor`). */
export type ActorIs = { actor: string; is: 'walking' | `act:${string}` | `fx:${string}` };
/** Visitor `visitor` (its id) in a phase of its visit (arrive, here, leave), as `__world3d.visitors` shows it. */
export type VisitorIs = { visitor: string; is: `phase:${string}` };
/** A tree shake's leavings of a kind out (`__world3d.shakes`: a swarm, a nest, a drop, a dangling bug). */
type ShakeIs = { shake: 'drops' | 'nests' | 'swarms' | 'dangles' };
/** An effect the 3D island fired (`__world3d.fxLog`: a tap's `ring`, mine `v` null, a partner's '#ddefff'; the high
 *  five's `zap`), only colour `v` if given: counted off the log, a hidden tab's too. */
type FxIs = { fx: string; v?: string | null };
/** Watches, from now, for each thing's comings (it there after it wasn't): a transient effect (a sparkle, the tap's
 *  ring, hearts, a banner) seen however late a loaded runner looks, and a second coming counted. One watch a page: a
 *  new one stops the last (whose `came` throws then). Returns how many came of `k` (a key not watched throws). (Read
 *  at each change of the DOM: the probe's source, for now.) */
export async function watchComings(page: Page, things: Record<string, Coming>) {
  const t0 = await page.evaluate((things) => {
    const W = window as unknown as { __came: Record<string, number>; __comingsMO?: MutationObserver; __world3d?: W3 };
    W.__comingsMO?.disconnect();
    const there = (t: Coming) => {
      if (typeof t === 'string') return !!document.querySelector(t);
      if ('fx' in t) return false;
      if ('shake' in t) return !!W.__world3d?.shakes()[t.shake].length;
      if ('actor' in t) {
        const a = W.__world3d?.actor(t.actor);
        return !!a && (t.is === 'walking' ? a.walking : t.is.startsWith('act:') ? a.act === t.is.slice(4) : a.fx.includes(t.is.slice(3)));
      }
      return [...document.querySelectorAll(t.sel)].some((el) => 'text' in t && el.textContent?.includes(t.text));
    };
    const on: Record<string, boolean> = {};
    W.__came = {};
    for (const k in things) (W.__came[k] = 0), (on[k] = there(things[k]));
    W.__comingsMO = new MutationObserver((ms) => {
      for (const k in things) {
        const t = things[k];
        if (typeof t !== 'string' && 'fx' in t) continue;
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
    return performance.now();
  }, things);
  return (k: string) => {
    if (!(k in things)) throw new Error(`watchComings: '${k}' isn't watched (${Object.keys(things).join(', ')})`);
    const t = things[k];
    return page.evaluate(([k, fx, t0]) => {
      const W = window as unknown as { __came: Record<string, number>; __world3d: W3 };
      if (!(k in W.__came)) throw new Error(`watchComings: '${k}' no longer watched (a later watch on this page replaced it)`);
      return fx ? W.__world3d.fxLog().filter((e) => e.kind === fx.fx && e.at > t0 && (fx.v === undefined || e.v === fx.v)).length : W.__came[k];
    }, [k, typeof t !== 'string' && 'fx' in t ? t : null, t0] as const);
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
