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
// NH's wood, without an axe: a shake knocks a piece out now and then, three a tree a Tokyo day at most (`woodFall`,
// seeded by the date and the tree's shakes, the same on both phones), put on the island for both (`wd:<tree>:<k>`).
import type { Drop } from '#lib/sync/live-protocol.ts';
import { NEST_GAP_MS } from '#lib/sync/live-protocol.ts';
import type { Put, Shake } from '#lib/sync/world-day.ts';
import { BUGS, inHours } from './critters.ts';
import { GOAL_TREES, SCENERY, TREE_H, surfaceAt } from './world.ts';
import { ISLAND_SEED, dayRand } from './daySeed.ts';

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
export type TreeKind = 'goal' | 'oak' | 'cedar' | 'palm';

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

const side = (x: number): -1 | 1 => (x < 195 ? -1 : 1);

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
 *  dangling bug or the nest's wasps (critters to catch). Counted per tree and kind, so both phones name them alike. */
export function dropIds(shakes: readonly Shake[], i: number): string[] {
  const s = shakes[i];
  if (!s || s.drop === 'none') return [];
  const k = shakes.slice(0, i).filter((x) => x.tree === s.tree && x.drop === s.drop).length;
  if (s.drop === 'branch') return [`br:${s.tree}:${k}`];
  if (s.drop === 'coconut') return [`co:${s.tree}:0`, `co:${s.tree}:1`];
  if (s.drop === 'nest') return [`ws:${s.tree}:${k}`];
  return [`dg:${s.tree}:${k}`];
}

/** Where things land beside a trunk (world units from its foot): just in front of the trunk's line (FRONT), a branch
 *  on the inner side, a nest and a dangling bug on the outer, a palm's coconuts round its foot. */
const FRONT = 2;
const BRANCH_DX = 36, NEST_DX = 34, DANGLE_DX = 30;
const COCONUT_AT: readonly (readonly [number, number])[] = [[-12, -3], [10, -7]];

export interface Fallen {
  id: string;
  tree: string;
  what: 'branch' | 'coconut';
  x: number;
  z: number;
}

/** Where a tree's drop lies (world): a branch inside, a nest or a dangling bug outside, a coconut (`n` 0 or 1). */
export function dropAt(t: ShakeTree, what: Exclude<Drop, 'none'>, n = 0): { x: number; z: number } {
  const z = t.z - FRONT;
  if (what === 'branch') return { x: t.x - t.out * BRANCH_DX, z };
  if (what === 'coconut') return { x: t.x + t.out * COCONUT_AT[n % 2][0], z: t.z + COCONUT_AT[n % 2][1] };
  return { x: t.x + t.out * (what === 'nest' ? NEST_DX : DANGLE_DX), z };
}

/** What the day's shakes left lying (branches, coconuts) nobody has picked up yet, where on this phone. */
export function fallen(shakes: readonly Shake[], tree: (id: string) => ShakeTree | null, taken: (id: string) => boolean): Fallen[] {
  const out: Fallen[] = [];
  shakes.forEach((s, i) => {
    const what = s.drop;
    if (what !== 'branch' && what !== 'coconut') return;
    const t = tree(s.tree);
    if (!t) return;
    dropIds(shakes, i).forEach((id, n) => {
      if (!taken(id)) out.push({ id, tree: s.tree, what, ...dropAt(t, what, n) });
    });
  });
  return out;
}

// ---------- wood (NH's axe, without one) ----------

/** A tree gives this many pieces of wood a Tokyo day (NH: three hits of an axe, then nothing till the next day). */
export const WOOD_A_DAY = 3;
/** A shake knocks a piece out 1 in WOOD_ODDS times, while the tree has some left today. */
const WOOD_ODDS = 2;
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

/** Where a tree's `k`-th piece lands (world): the k-th of WOOD_AT's spots on land (a beach palm's front may be the sea):
 *  a row out in front of the trunk, then one behind it; the three apart and a tap's width clear of what else lies there
 *  (the branch inside, the nest and the dangling bug outside, a palm's coconuts at its foot; never with a present: no
 *  wood on the shake that drops one, nor while it lies). */
const WOOD_AT: readonly (readonly [number, number])[] = [[0, -40], [34, -36], [-34, -38], [0, 40], [34, 40], [-34, 40]];
const LAND = new Set(['sand', 'grass', 'dirt']);
export const woodAt = (t: ShakeTree, k: number): [number, number] => {
  const spots = WOOD_AT.map(([a, b]): [number, number] => [Math.round(t.x + t.out * a), Math.round(t.z + b)]);
  const land = spots.filter(([x, z]) => LAND.has(surfaceAt(x, z)));
  return land[k] ?? spots[k % spots.length];
};
