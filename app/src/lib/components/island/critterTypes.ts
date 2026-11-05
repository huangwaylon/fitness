// The island's critters' shapes (Critters.svelte): a fish shadow, a bug, another's line, the net, and where a shadow
// swims (a pool). Pure.
import type { Who } from '#lib/contract/live-protocol.ts';
import type { Leg } from './critterPath.ts';
import type { BugId, BugPlace, FishId, Flight, JunkId, StalkState, Swim, Water } from './critters.ts';
import type { PondFishId } from './pondFish.ts';

/** Where a shadow is, one at a time each: a stretch of the coast (coast.ts: `sea` off the front beach, `sea1`…
 *  round the rest, ambient life's sea channels) or a fresh water. */
export type Pool = Water | `sea${number}`;
export const seaPool = (coast = 0): Pool => (coast ? `sea${coast}` : 'sea');
export const poolOf = (water: Water, coast = 0): Pool => (water === 'sea' ? seaPool(coast) : water);

/** A world point (units) and its height above the ground. */
export interface P3 { x: number; z: number; lift: number }
export interface Fish {
  n: number; item: FishId | PondFishId | JunkId; water: Water; pool: Pool; size: number; shape?: 'narrow' | 'fin';
  /** Where it is heading (world) and how long that takes; its node's anchor (its spawn point). */
  x: number; z: number; ms: number; ax: number; az: number;
  /** Heading: mirrored (head right) and turned toward where it swims (deg, −90…90 on screen). */
  flip: boolean; rot: number;
  area: Swim; gone: boolean; dash: boolean;
  /** Closing in on a bobber in short darts (NH): each one quick off the mark, easing in. */
  spurt?: boolean;
  /** The shared world's (critterPath.ts): its id (its catch is shared), its itinerary and when it came (relay ms). */
  cid?: string; legs?: Leg[]; t0?: number;
  /** Another's line is out at it (their phone's `fish` steps): theirs while it is, swimming up to their float. */
  taken?: Who;
  /** Its stay is over: it leaves once no line holds it (never while it plays with a float). */
  due?: boolean;
}
/** Another's line as their phone tells it (`fish` steps): its float at (x, z), the line from their villager's rod (the
 *  bank's sx, sz when it isn't in reach), at a shadow `id`. */
export interface Line { who: Who; slot: string; id?: string; x: number; z: number; sx: number; sz: number; landed: boolean; under: boolean; rings: number; n: number }
export interface Bug {
  n: number; id: BugId; flight: Flight; place: BugPlace;
  /** Where it is (world, lift above the ground), its node's anchor and the ground's foreshortening there. */
  x: number; z: number; lift: number; ax: number; az: number; g: number;
  ms: number; flip: boolean; gone: boolean;
  /** Sat down: a cicada on its trunk, a butterfly resting on a flower (its wings slowly open and close). */
  sat: boolean;
  /** Startled: it rises up and away, fully seen, and fades out at the end. */
  fled?: boolean;
  /** A tarantula's or a scorpion's mood (stalkTap). */
  stalk?: StalkState;
  /** Netted: it holds still where it was seen (its translate frozen) until the swing lands. */
  held?: boolean; freeze?: string;
  /** When it set off for good (performance.now() ms): the 3D model fades over its leave's last FADE3_MS. */
  goneAt?: number;
  /** Its itinerary (critterPath.ts: the shared world's, from its seed, or this phone's own), where it set off and
   *  when it came (relay ms); dropped when something else moves it (a startle, a charge, a rear). */
  cid?: string; legs?: Leg[]; start?: P3; t0?: number;
}
/** A shared critter's id and where its itinerary comes from: its seed, when it came (relay ms) and how long it stays
 *  in all (ms). */
export interface Shared { cid?: string; path?: { seed: number; t0: number; total: number } }
/** The net swung at a bug (stage units: the screen's overlay). */
export interface Net { n: number; x: number; y: number; in3d?: boolean }

/** A node's inner offset (local units: before the node's perspective scale). */
export const loc = (dx: number, dy: number) => `calc(${dx.toFixed(2)} * var(--u)) calc(${dy.toFixed(2)} * var(--u))`;
/** A shadow's offset in its flat node (local y is −z). */
export const fishLoc = (f: Fish) => loc(f.x - f.ax, -(f.z - f.az));
/** A bug's offset in its upright node (local y is −z·ground − lift). */
export const bugLoc = (b: Bug) => loc(b.x - b.ax, -(b.z - b.az) * b.g - b.lift);
