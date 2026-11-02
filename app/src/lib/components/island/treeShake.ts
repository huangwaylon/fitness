// Shaking a tree (docs/design.md "Trees", "Shaking a tree"): NH's shake, for every tree on the island. On a goal tree a
// single tap still opens (or closes) its popup; on any tree a quick run of taps, the third within SHAKE_WINDOW_MS and
// every quick tap after it, is a shake. What falls is NH's for the kind of tree: a hardwood (the oaks and the goal
// trees) or a cedar now and then drops a tree branch to pick up (cosmetic), a bagworm (at night sometimes a spider)
// dangling on its thread for a while to net, and rarely a wasp nest; a palm drops its two coconuts (once a day) and
// otherwise only, rarely, a nest (NH: no branches or bagworms from a palm). Two oaks or cedars a day hold a present
// (NH's furniture, wrapped: treeGifts.ts), which their first shake drops before anything else. At most one
// nest per tree per NEST_GAP_MS, on both phones (the shared day's shakes; the relay refuses a second); out of it the
// wasps charge the villager who shook it, and a tap on them within SWARM_MS nets one (the ずかん's wasp), else they
// sting (a fright: a 「！」 and a sweat drop, and NH's swollen eye for a while). No ベル ever (scenery never pays). A shake is shared (docs/backend.md#
// shared-world): its outcome goes to the partner, whose phone plays it at the same tree, and what it left (a branch,
// coconuts) lies there on both phones, by ids from the day's shakes, until one of us picks it up.
import type { Drop } from '#lib/sync/live-protocol.ts';
import { NEST_GAP_MS } from '#lib/sync/live-protocol.ts';
import type { Shake } from '#lib/sync/world-day.ts';
import { BUGS, inHours } from './critters.ts';
import { GOAL_TREES, SCENERY, TREE_H } from './world.ts';

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
