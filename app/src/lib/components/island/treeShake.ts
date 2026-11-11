// Shaking a tree (docs/design.md "Trees", "Shaking a tree"): NH's shake, for every tree on the island. On a goal tree a
// single tap still opens (or closes) its popup; on any tree a quick run of taps, the third within SHAKE_WINDOW_MS and
// every quick tap after it, is a shake. What falls is NH's for the kind of tree: a hardwood (the oaks and the goal
// trees) or a cedar now and then drops a tree branch to pick up (into the pocket: the shop buys it), a bagworm (at night sometimes a spider)
// dangling on its thread for a while to net, and rarely a wasp nest; a palm drops its two coconuts (once a day) and
// otherwise only, rarely, a nest (NH: no branches or bagworms from a palm). Two oaks or cedars a day hold a present
// (NH's furniture, wrapped: treeGifts.ts), which their first shake drops before anything else. At most one
// nest per tree per NEST_GAP_MS, on both phones (the shared day's shakes; the relay refuses a second); out of it the
// wasps charge the villager who shook it, and a tap on them within SWARM_MS nets one (the ずかん's wasp), else they
// sting (a fright: a 「！」 and a sweat drop, and NH's swollen eye for a while). No ベル ever (scenery never pays). A shake is shared (docs/backend.md#
// shared-world): its outcome goes to the partner, whose phone plays it at the same tree, and what it left (a branch,
// coconuts) lies there on both phones, by ids from the day's shakes, until one of us picks it up. Every tree also gives
// NH's wood, without an axe: a shake knocks a piece out 1 in 3 times, three a tree a Tokyo day at most (`woodFall`,
// seeded by the date and the tree's shakes, the same on both phones), put on the island for both (`wd:<tree>:<k>`).
// Nothing piles up: a tree drops nothing while anything it dropped still lies under it (`liesUnder`), and a drop lands
// on a free spot of a small ring round the tree's foot (`dropSpot`, picked by its id: the same on both phones).
import type { Drop, Pt } from '#lib/contract/live-protocol.ts';
import { NEST_GAP_MS } from '#lib/contract/live-protocol.ts';
import type { Put, Shake } from '#lib/sync/world-day.ts';
import { BUGS, inHours } from './critters.ts';
import { GOAL_TREES, SCENERY, TREE_H, offBuildingsAt, onBuildingAt, surfaceAt } from './world.ts';
import { ISLAND_SEED, dayRand } from './daySeed.ts';
import { site } from './site.svelte.ts';
import { FRUIT_SPOTS, fruitLean } from './scene.ts';
import { seeded } from '#lib/random.ts';
import { giftTree } from './treeGifts.ts';

export { NEST_GAP_MS };

/** Taps in a run that make a shake, and the window they fall in. */
const SHAKE_TAPS = 3;
export const SHAKE_WINDOW_MS = 1200;

/** A canopy tap at `t` (ms) after the earlier `taps` (their times): the run kept, and whether this tap shakes the tree. */
export function shakeTap(taps: readonly number[], t: number): { taps: number[]; shake: boolean } {
  const run = [...taps.filter((x) => t - x < SHAKE_WINDOW_MS), t];
  return { taps: run.slice(-SHAKE_TAPS), shake: run.length >= SHAKE_TAPS };
}

// ---------- the trees ----------

/** NH's kinds of tree as they shake: a goal tree is a hardwood (its fruit falls with its goals, never from a shake). */
type TreeKind = 'goal' | 'oak' | 'cedar' | 'palm';

/** A shakeable tree: its id (a scenery id, or `goal-<person>`), kind, foot (world) and height, and its outer side (−1
 *  left, 1 right: where a nest and a dangling bug fall; a branch falls on the inner side). */
export interface ShakeTree {
  id: string;
  kind: TreeKind;
  x: number;
  z: number;
  h: number;
  out: -1 | 1;
}

/** Which side of the island's middle (site.midX: a lopsided resize moves it) a tree stands. */
const side = (x: number): -1 | 1 => (x < site.midX ? -1 : 1);

/** The scenery's trees (world.ts SCENERY: the oaks, the cedars, the palms; bamboo doesn't shake). */
export const sceneryTrees = (): readonly ShakeTree[] => SCENERY.filter((s) => s.kind === 'oak' || s.kind === 'cedar' || s.kind === 'palm').map((s) => ({
  id: s.id, kind: s.kind as TreeKind, x: s.x, z: s.z, h: s.h, out: side(s.x)
}));

/** A person's goal tree (A's on the left, B's on the right, on both phones). */
export const goalTree = (person: 'A' | 'B'): ShakeTree =>
  ({ id: `goal-${person}`, kind: 'goal', x: GOAL_TREES[person][0], z: GOAL_TREES[person][1], h: TREE_H, out: person === 'A' ? -1 : 1 });

/** A tree by id (the same on both phones), or null. */
export function treeById(id: string): ShakeTree | null {
  const g = /^goal-([AB])$/.exec(id);
  if (g) return goalTree(g[1] as 'A' | 'B');
  return sceneryTrees().find((t) => t.id === id) ?? null;
}

// ---------- what falls ----------

/** 1 in NEST_ODDS shakes drops a nest (when the tree has one due), else 1 in BUG_ODDS a dangling bug, else 1 in
 *  BRANCH_ODDS a branch. */
export const NEST_ODDS = 8;
export const BUG_ODDS = 7;
const BRANCH_ODDS = 5;

/** What a shake can drop, before the bug is told apart (`bug`: a bagworm or a spider, by the hour); `gift` the tree's
 *  present (treeGifts.ts: it crosses as a `put`, the shake itself as `none`). */
export type ShakeDrop = 'nest' | 'bug' | 'branch' | 'coconut' | 'gift' | null;

/** What a shake of a `kind` tree at `now` drops: `r` a uniform [0, 1) source, `lastNest` this tree's last nest (ms)
 *  if any, `coconuts` a palm still bears its coconuts today, `gift` the tree still holds its present today (it falls
 *  first, as NH's furniture does). `force` (the dev hook) makes it that drop (a palm's coconuts and nest, a hardwood's
 *  or a cedar's anything but coconuts; never the present, which only the day's trees hold). */
export function shakeDrop(r: () => number, now: number, lastNest: number | undefined, force?: ShakeDrop, kind: TreeKind = 'goal', coconuts = false, gift = false): ShakeDrop {
  const palm = kind === 'palm';
  if (force !== undefined && force !== 'gift' && (force === null || (palm ? force === 'nest' || force === 'coconut' : force !== 'coconut'))) return force;
  if (gift && !palm && kind !== 'goal') return 'gift';
  if (palm && coconuts) return 'coconut';
  const due = lastNest === undefined || now - lastNest >= NEST_GAP_MS;
  if (due && r() * NEST_ODDS < 1) return 'nest';
  if (palm) return null;
  if (r() * BUG_ODDS < 1) return 'bug';
  return r() * BRANCH_ODDS < 1 ? 'branch' : null;
}

/** Which bug dangles from a shaken tree at `hour`: a bagworm, or in the spider's hours (NH: 7 pm – 8 am) a spider 3 times
 *  in 8 (NH's spawn rates, 50 : 30). */
export function shakenBug(hour: number, r: () => number): 'bagworm' | 'spider' {
  return inHours(BUGS.spider.hours, hour) && r() * 8 < 3 ? 'spider' : 'bagworm';
}

/** A shake's outcome as the wire has it (live-protocol Drop): the bug told apart by the hour. */
export function wireDrop(d: ShakeDrop, hour: number, r: () => number, bug?: 'bagworm' | 'spider'): Drop {
  if (d === 'bug') return bug ?? shakenBug(hour, r);
  return d === 'gift' ? 'none' : (d ?? 'none');
}

/** A dangling bug climbs back up into the tree after this long unless it's netted. */
export const DANGLE_MS = 10_000;

/** The wasps come out this long after the nest lands, and reach the villager SWARM_MS after that. */
export const SWARM_DELAY_MS = 600;
export const SWARM_MS = 1500;

/** A tap on the swarm `ms` after it came out: netted while it is still on its way, else too late (it has stung). */
export const netsSwarm = (ms: number): boolean => ms >= 0 && ms <= SWARM_MS;

/** A sting's fright: a 「！」, then a sweat drop this long after it. */
export const STUNG_SWEAT_MS = 1300;
/** How long a sting leaves its swollen eye (NH's lump over one eye, placed on each render's eye: villagers/heads.ts). */
export const SWOLLEN_MS = 60 * 1000;

// ---------- the day's shakes (shared) ----------

/** A tree's last nest today (ms), from the day's shakes. */
export function lastNestOf(shakes: readonly Shake[], tree: string): number | undefined {
  let t: number | undefined;
  for (const s of shakes) if (s.tree === tree && s.drop === 'nest') t = Math.max(t ?? 0, s.t);
  return t;
}

/** A palm still bears its coconuts today (NH: shaken once, they fall; they grow back by the next day). */
export const bearsCoconuts = (shakes: readonly Shake[], tree: string): boolean => !shakes.some((s) => s.tree === tree && s.drop === 'coconut');

/** The shared ids of what the `i`-th of the day's shakes left: a branch or two coconuts (things to pick up), a
 *  dangling bug or the nest's wasps (critters to catch). Named by the shake itself (who shook, at the shaker's own
 *  time, base 36: the same on both phones whatever order the shakes arrive in), but a palm's coconuts (once a day). */
export function dropIds(shakes: readonly Shake[], i: number): string[] {
  const s = shakes[i];
  if (!s || s.drop === 'none') return [];
  if (s.drop === 'coconut') return [`co:${s.tree}:0`, `co:${s.tree}:1`];
  const k = `${s.who}${s.t.toString(36)}`;
  return [`${s.drop === 'branch' ? 'br' : s.drop === 'nest' ? 'ws' : 'dg'}:${s.tree}:${k}`];
}

/** The ids an older app named the same drop by (and the island rows it stored, the record's replay): counted per tree
 *  and kind in the day's order, so a later-arriving earlier shake shifted them. A claim under one still counts. */
export function legacyDropIds(shakes: readonly Shake[], i: number): string[] {
  const s = shakes[i];
  if (!s || s.drop === 'none' || s.drop === 'coconut') return [];
  const k = shakes.slice(0, i).filter((x) => x.tree === s.tree && x.drop === s.drop).length;
  return [`${s.drop === 'branch' ? 'br' : s.drop === 'nest' ? 'ws' : 'dg'}:${s.tree}:${k}`];
}

/** Where a nest, a dangling bug and a palm's coconuts land beside a trunk (world units from its foot): just in front of
 *  the trunk's line (FRONT), a nest and a dangling bug on the outer side, a palm's coconuts round its foot. */
const FRONT = 2;
const NEST_DX = 34, DANGLE_DX = 30;
const COCONUT_AT: readonly (readonly [number, number])[] = [[-12, -3], [10, -7]];

export interface Fallen {
  id: string;
  tree: string;
  what: 'branch' | 'coconut';
  x: number;
  z: number;
}

/** Where a nest, a dangling bug or a coconut (`n` 0 or 1) of a tree lands (world); off a building beside the tree
 *  (world.ts offBuildingsAt), the same on every phone. */
export function dropAt(t: ShakeTree, what: 'nest' | 'bagworm' | 'spider' | 'coconut', n = 0): { x: number; z: number } {
  const [x, z] = what === 'coconut' ? [t.x + t.out * COCONUT_AT[n % 2][0], t.z + COCONUT_AT[n % 2][1]]
    : [t.x + t.out * (what === 'nest' ? NEST_DX : DANGLE_DX), t.z - FRONT];
  const [px, pz] = offBuildingsAt(x, z);
  return { x: px, z: pz };
}

/** NH's ring of spots round a tree's foot where a branch or a piece of wood lands (u from the foot, x toward its outer
 *  side): the first four in front of the trunk and on its inner side, the last three behind it; never its outer side,
 *  where a nest falls and a bug dangles. A tap's width apart on screen (CLEAR). */
const RING: readonly (readonly [number, number])[] = [[0, -40], [34, -40], [-34, -36], [-42, 0], [0, 40], [34, 40], [-34, 40]];
/** A goal tree's: its front row and inner spot further out, past the fruit row (scene.ts FRUIT_SPOTS) in front of it. */
const GOAL_RING: readonly (readonly [number, number])[] = [[0, -52], [34, -52], [-34, -52], [-48, 0], [0, 40], [34, 40], [-34, 40]];
const RING_FRONT = 4;
/** Two things on the ground at least this far apart on screen (u; the camera's tilt shortens z: TILT_Z): a pick-up's
 *  button each. */
const CLEAR = 24;
const TILT_Z = 0.68;
/** Whether two spots on the ground are a tap's width apart on screen. */
export const apart = (a: Pt, b: Pt): boolean => Math.hypot(a[0] - b[0], (a[1] - b[1]) * TILT_Z) >= CLEAR;
const LAND = new Set(['sand', 'grass', 'dirt']);

/** The ring's spots of a tree (world), in its order: those on land and off a building's ground (world.ts onBuildingAt:
 *  a tree beside the museum keeps its drops off the museum's steps); none of those, the ring moved off the buildings. */
export function dropSpots(t: ShakeTree): [number, number][] {
  const ring = (t.kind === 'goal' ? GOAL_RING : RING).map(([a, b]): [number, number] => [Math.round(t.x + t.out * a), Math.round(t.z + b)]);
  const land = ring.filter(([x, z]) => LAND.has(surfaceAt(x, z)) && !onBuildingAt(x, z));
  return land.length ? land : ring.map(([x, z]) => offBuildingsAt(x, z));
}

/** Where a tree's drop (`key`: its shared id) lands (world): the first of the ring's spots clear of everything in
 *  `busy` (what lies about, the day's dig spots, a goal tree's fruit row), starting at one picked by the key among the
 *  front ones (seeded: every phone picks the same), then the ones behind; none clear, the key's own. */
export function dropSpot(t: ShakeTree, key: string, busy: readonly Pt[]): [number, number] {
  const spots = dropSpots(t);
  const fruit = t.kind === 'goal' ? FRUIT_SPOTS.map(([a, b]): Pt => [t.x + fruitLean(t.x, site.midX) + a, t.z + b]) : [];
  const front = Math.min(RING_FRONT, spots.length);
  const k = Math.floor(seeded(key)() * front);
  const order = [...spots.slice(k, front), ...spots.slice(0, k), ...spots.slice(front)];
  return order.find((s) => [...busy, ...fruit].every((b) => apart(s, b))) ?? spots[k];
}

/** What else is on the ground, for where a drop lands: the day's puts (presents, wood) with when they were put, things
 *  that never move (the day's dig spots and mushrooms), and when an id was picked up (its claim's time), if it was. */
export interface Ground {
  puts?: readonly Put[];
  still?: readonly Pt[];
  pickedAt: (id: string) => number | undefined;
}

/** What the day's shakes left lying (branches, coconuts) nobody has picked up yet (`all`: picked up too), where. A
 *  branch lands at its dropSpot clear of what lay about when it fell (the day's puts and drops by then, not yet picked
 *  up): the shared day's, in the shakes' own order (their time, then who), so it lies at one spot on both phones and
 *  stays there as other things come and go. */
export function fallen(shakes: readonly Shake[], tree: (id: string) => ShakeTree | null, g: Ground, all = false): Fallen[] {
  const lay = (p: { id: string; t: number }, t: number) => p.t <= t && !((g.pickedAt(p.id) ?? Infinity) <= t);
  const order = shakes.map((_, i) => i).sort((a, b) => shakes[a].t - shakes[b].t || shakes[a].who.localeCompare(shakes[b].who));
  const out: (Fallen & { t: number; gone: boolean })[] = [];
  for (const i of order) {
    const s = shakes[i], what = s.drop;
    if (what !== 'branch' && what !== 'coconut') continue;
    const t = tree(s.tree);
    if (!t) continue;
    const old = legacyDropIds(shakes, i);
    dropIds(shakes, i).forEach((id, n) => {
      let at: Pt;
      if (what === 'coconut') {
        const c = dropAt(t, what, n);
        at = [c.x, c.z];
      } else {
        const busy: Pt[] = [...(g.still ?? []), ...(g.puts ?? []).filter((p) => lay(p, s.t)).map((p) => p.at), ...out.filter((f) => lay(f, s.t)).map((f): Pt => [f.x, f.z])];
        at = dropSpot(t, id, busy);
      }
      const gone = g.pickedAt(id) !== undefined || (!!old[n] && g.pickedAt(old[n]) !== undefined);
      out.push({ id, tree: s.tree, what, x: at[0], z: at[1], t: s.t, gone });
    });
  }
  return out.filter((f) => all || !f.gone).map(({ id, tree: tr, what, x, z }) => ({ id, tree: tr, what, x, z }));
}

/** Whether something `tree` dropped still lies under it (a branch, coconuts, a piece of wood, its present: `lying` the
 *  day's puts nobody has picked up yet): then a shake drops nothing (NH: no pile under a tree). */
export const liesUnder = (tree: string, drops: readonly Fallen[], lying: readonly Put[]): boolean =>
  drops.some((f) => f.tree === tree) || lying.some((p) => (woodTree(p.id) ?? giftTree(p.id)) === tree);

// ---------- wood (NH's axe, without one) ----------

/** A tree gives this many pieces of wood a Tokyo day (NH: three hits of an axe, then nothing till the next day). */
export const WOOD_A_DAY = 3;
/** A shake knocks a piece out 1 in WOOD_ODDS times, while the tree has some left today (and nothing of it lies there). */
export const WOOD_ODDS = 3;
/** NH's three, each as likely (bamboo's none: it doesn't shake). */
export const WOODS = ['wood', 'softwood', 'hardwood'] as const;
export type Wood = (typeof WOODS)[number];

const WOOD_PREFIX = 'wd:';
/** The shared id of `tree`'s `k`-th piece of wood today (the day's put). */
export const woodId = (tree: string, k: number): string => `${WOOD_PREFIX}${tree}:${k}`;
/** The tree a piece of wood fell from (its id's), or null when the id isn't wood's. */
export const woodTree = (id: string): string | null => (id.startsWith(WOOD_PREFIX) ? id.slice(WOOD_PREFIX.length, id.lastIndexOf(':')) : null);
/** How many pieces `tree` has given today (the day's puts). */
export const woodOut = (puts: Readonly<Record<string, Put>>, tree: string): number => {
  let k = 0;
  while (k < WOOD_A_DAY && puts[woodId(tree, k)]) k++;
  return k;
};
/** Which wood `tree`'s `k`-th piece of `date` is (seeded: every phone says the same). */
const woodOf = (date: string, tree: string, k: number, seed = ISLAND_SEED): Wood =>
  WOODS[Math.floor(dayRand(date, `wood:${tree}:${k}`, seed)() * WOODS.length)];

/**
 * The piece of wood the `n`-th shake of `tree` on `date` (counting both of ours: the day's shakes before it) knocks out,
 * with `out` pieces given already today, or null. Seeded by the date, the tree and `n` (and the island's seed), so the
 * same shake says the same on every phone; never past WOOD_A_DAY. `force` (the dev hook) knocks one out if any are left.
 */
export function woodFall(date: string, tree: string, n: number, out: number, seed = ISLAND_SEED, force = false): { id: string; what: Wood } | null {
  if (out >= WOOD_A_DAY) return null;
  if (!force && dayRand(date, `wood-shake:${tree}:${n}`, seed)() * WOOD_ODDS >= 1) return null;
  return { id: woodId(tree, out), what: woodOf(date, tree, out, seed) };
}
