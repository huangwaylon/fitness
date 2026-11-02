// Where the bulletin board stands (docs/board.md "Placement"): the layout's `board` object once the layout has it (it
// is movable in the editor and in game), else its default spot, the same place: on the front beach, left of the
// shells' sand, facing the sea-side camera. The face's size and height are the model's (world3d/assets.json
// deco/bulletin-board: its cork at model x −6.85…6.80, y 3.49…13.52, z +0.30, at 3.5 u a model unit).
import { layout } from '#lib/store/layout.svelte.ts';
import type { Proj3 } from '../island/camera.svelte.ts';

/** What the board needs of the 3D island (docs/board.md "To the 3D lead"): all optional, the lead's to add. */
export type BoardProj = Proj3 & {
  focus?(f: { x: number; z: number; y: number; w: number; h: number; yaw?: number; bottom?: number; fill?: number }, ms?: number): Promise<void>;
  unfocus?(ms?: number): Promise<void>;
  attach?(id: string, obj: unknown): void;
};

/** The board's middle (world u) when the layout doesn't place it: tiles 7–8 × 6 (x 120…180, z 90…120). */
const BOARD_SPOT = [150, 105] as const;
/** The model's scale (u a model unit: scripts/world3d-assets.ts BOARD_S). */
export const BOARD_S = 3.5;
/** The face (the cork) in the model's units: its middle's height and how far in front of the origin, its size. */
export const FACE = { y: 8.5, z: 0.38, w: 13.6, h: 10 } as const;
/** How tall the board stands (u), and how far in front of it a villager stands to read it. */
export const BOARD_H = 17.21 * BOARD_S;
export const READ_AT = 28;

/** Where the board is now (its middle, world u) and which way it faces (a layout `f`: 0 toward the camera). */
export function boardAt(): { x: number; z: number; f: number } {
  const o = layout.obj('board');
  const p = layout.pos('board');
  return p ? { x: p[0], z: p[1], f: o?.f ?? 0 } : { x: BOARD_SPOT[0], z: BOARD_SPOT[1], f: 0 };
}

/** The point in front of the face, `d` u out (where a reader stands; the camera looks from that side). */
export function inFront(b: { x: number; z: number; f: number }, d: number): [number, number] {
  const [dx, dz] = ([[0, -1], [1, 0], [0, 1], [-1, 0]] as const)[b.f & 3];
  return [b.x + dx * d, b.z + dz * d];
}
