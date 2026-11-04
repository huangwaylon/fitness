// Tap-to-walk (spec §4, docs/design.md "Walking"): what a tap on the ground does with my villager. Pure: nothing here
// touches the DOM, so every rule is a unit test.
//   A tap → nav.ts snaps it (a building's door, a bank facing the water, the nearest walkable point) and finds the way;
//   my villager runs it at SPEED.run (walkGraph.ts: 300 u/s; idle strolls and visitors 90 u/s). The cream tap ring marks
//   where it ends. The camera never moves for it (only the finger scrolls the island).
import { findPath, pathLength, snapTap, type Extra, type Nav, type Snap } from './nav.ts';
import * as onLayout from '#lib/layout/nav.ts';
import type { Pt, Surface } from './world.ts';
import { SPEED } from './walkGraph.ts';
import type { Cue } from '#lib/sound/cues.ts';

/** The tap ring's life (ms): a cream ring, 34u, flattened like a shadow, shrinking out (IslandScene's .tap-ring). */
export const RING_MS = 400;

export interface TapPlan {
  /** Where the walk ends (snapped). */
  to: Pt;
  /** The waypoints after the start, ending at `to`. */
  pts: Pt[];
  /** The walk's length (u) and duration (ms) at the run. */
  len: number;
  ms: number;
  /** How the tap was snapped (here, door, bank, near), the building whose door it is, the face on arrival. */
  snap: Snap | onLayout.Snap;
}

/** Where feet may stand for world (x, z), as a tap there would end (a building's door, a bank, the nearest walkable
 *  point, reachable), or null: nowhere near. */
export function standAt(g: Nav | onLayout.LayoutNav, x: number, z: number): Pt | null {
  const s = onLayout.isLayoutNav(g) ? onLayout.snapTap(g, x, z) : snapTap(g as Nav, x, z);
  return s && [Math.round(s.to[0]), Math.round(s.to[1])];
}

/** The walk a tap at world (x, z) starts from `from`, or null when it goes nowhere (nothing walkable near, no way
 *  there, or already there). `g`: today's island's nav, or a layout's (layout/nav.ts navOf: the same rules). */
export function planTap(g: Nav | onLayout.LayoutNav, from: Pt, x: number, z: number, extra?: Extra): TapPlan | null {
  const lay = onLayout.isLayoutNav(g) ? g : null;
  const snap = lay ? onLayout.snapTap(lay, x, z, extra) : snapTap(g as Nav, x, z, extra);
  if (!snap) return null;
  const to: Pt = [Math.round(snap.to[0]), Math.round(snap.to[1])];
  const path = (p: Pt) => (lay ? onLayout.findPath(lay, from, p, extra) : findPath(g as Nav, from, p, extra));
  const pts = path(to) ?? path(snap.to);
  if (!pts) return null;
  const len = pathLength(from, pts);
  if (len < 2 && snap.kind !== 'door') return null;
  return { to: pts.at(-1)!, pts, len, ms: Math.round((len / SPEED.run) * 1000), snap };
}

// ---- footsteps ----------------------------------------------------------------------------------------------------------

/** A footstep's cue by the ground under the walker (world.ts surfaceAt): grass (snow in winter), sand, a dirt path, the
 *  stairs' stone; a rainy day splashes; none in water (a wading frame never happens, but a walker caught at a bank
 *  stays silent). */
export function stepCue(surface: Surface, winter: boolean, rain: boolean): Cue | null {
  if (surface === 'sea' || surface === 'water') return null;
  if (rain) return 'footstep-splash';
  if (winter && (surface === 'grass' || surface === 'dirt')) return 'footstep-snow';
  if (surface === 'sand') return 'footstep-sand';
  if (surface === 'stone') return 'footstep-stone';
  return 'footstep-grass';
}
