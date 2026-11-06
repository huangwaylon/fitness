// What a tall thing hides on screen (docs/design.md "Tap targets"): the island's camera looks down the island toward +z,
// PITCH.def at the default zoom, lower zoomed in (PITCH.near) and higher zoomed out (world3d/engine.ts), so a thing h
// tall covers the ground behind it out to behindOf(h, pitch). One model for the three rules that ask:
//   - a building's model hides the strip behind it from finds (clear.ts buildingZones: BUILDING_HIDES)
//   - a figure standing behind a thing is hidden by it (spots.ts's visitors' stage: FIGURE_HIDES)
//   - what one stands before to use (the board, K.K.: catalog `front`) covers rows behind it at every zoom, where the
//     day's spots keep off (clear.ts tapCovered: rowsBehind of its art's height)
// Pure.
import { TILE } from './grid.ts';
import { kindDef } from './catalog.ts';

/** The island camera's pitch (degrees): at the default zoom, fully zoomed in, fully out (world3d/engine.ts). */
export const PITCH = { def: 58, near: 40, far: 63 } as const;

/** How far behind it (u) a thing `h` tall covers the ground on screen at `pitch` (degrees). */
const behindOf = (h: number, pitch: number): number => h / Math.tan((pitch * Math.PI) / 180);

/** A building's model hides this much of its height behind it: behindOf(1, PITCH.def) (0.62) and a little. */
export const BUILDING_HIDES = 0.65;
/** A figure behind a thing is hidden this much of the thing's height behind it: a card stands taller than its model,
 *  so more than behindOf(1, PITCH.def). */
export const FIGURE_HIDES = 1.1;

/** A guard round what a standing thing covers (u): ~6px at the default zoom. */
const GUARD_U = 16;
/** The art's height (u) of a thing one stands before, where its kind's drawn `h` isn't it: the board's (board/spot.ts
 *  BOARD_H, NH's model at its scale, taller than its kind's 44). */
export const FRONT_ART_H: Readonly<Record<string, number>> = { board: 60 };

/** How many rows behind it a thing `artH` tall covers on screen at every zoom (fully in the lowest: PITCH.near). */
const rowsBehind = (artH: number): number => Math.ceil((behindOf(artH, PITCH.near) + GUARD_U) / TILE);

/** The rows a `front` kind's art covers behind it: the board's three, K.K.'s four (75u on his stool). */
export const frontRows = (k: string): number => rowsBehind(FRONT_ART_H[k] ?? kindDef(k)?.h ?? 0);
