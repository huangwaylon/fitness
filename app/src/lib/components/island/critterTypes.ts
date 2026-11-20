// The island's critters' shapes (critters.svelte.ts): a fish shadow, a bug, another's line, and where a shadow swims
// (a pool). Pure.
import type { Who } from '#lib/contract/live-protocol.ts';
import type { Leg, P3 } from './critterPath.ts';
import type { BugId, BugPlace, FishId, Flight, JunkId, StalkState, Swim, Water } from '#lib/world/critters.ts';
import type { PondFishId } from '#lib/world/pondFish.ts';

/** Where a shadow is, one at a time each: a stretch of the coast (coast.ts: `sea` off the front beach, `sea1`…
 *  round the rest, ambient life's sea channels) or a fresh water. */
export type Pool = Water | `sea${number}`;
export const seaPool = (coast = 0): Pool => (coast ? `sea${coast}` : 'sea');
export const poolOf = (water: Water, coast = 0): Pool => (water === 'sea' ? seaPool(coast) : water);

/** A world point (units) and its height above the ground. */
export type { P3 } from './critterPath.ts';
export interface Fish {
  n: number; item: FishId | PondFishId | JunkId; water: Water; pool: Pool; size: number; shape?: 'narrow' | 'fin';
  /** Where it is heading (world) and how long that takes; where it came (its spawn point). */
  x: number; z: number; ms: number; ax: number; az: number;
  /** Heading right (else left), before its first move. */
  flip: boolean;
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
  /** Where it is heading (world, lift above the ground) and where it came. */
  x: number; z: number; lift: number; ax: number; az: number;
  ms: number; flip: boolean; gone: boolean;
  /** Sat down: a cicada on its trunk, a butterfly resting on a flower (its wings slowly open and close). */
  sat: boolean;
  /** Startled: it rises up and away, fully seen, and fades out at the end. */
  fled?: boolean;
  /** A tarantula's or a scorpion's mood (stalkTap). */
  stalk?: StalkState;
  /** Netted: it holds still where it was seen until the swing lands. */
  held?: boolean;
  /** When it set off for good (performance.now() ms): the 3D model fades over its leave's last FADE3_MS. */
  goneAt?: number;
  /** Its itinerary (critterPath.ts: the shared world's, from its seed, or this phone's own), where it set off and
   *  when it came (relay ms); dropped when something else moves it (a startle, a charge, a rear). */
  cid?: string; legs?: Leg[]; start?: P3; t0?: number;
}
/** A shared critter's id and where its itinerary comes from: its seed, when it came (relay ms) and how long it stays
 *  in all (ms). */
export interface Shared { cid?: string; path?: { seed: number; t0: number; total: number } }
