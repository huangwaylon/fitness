// The aquarium's tanks (docs/design.md "The museum"), pure: where each stands in the aquarium wing (plan.ts FISH_WING,
// model units), its glass box, the water a fish swims in, and how big a fish is drawn in it (NH's own sizes, a big one
// scaled to its tank). NH's grouping (species.ts tankOf): the great sea tank along the back wall, the deep-sea tank on
// the far wall, the river tank as an island in the middle, and the sixteen small tanks on their stands in two rows of eight by
// the front (the pond's and the stream's behind, the tropical and the reef's in front: four tanks a group). Each tank's long side is its swimmers' way (they keep mostly along it, as in NH's tanks).
import type { TankId } from './species.ts';

export interface Box { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number }
export interface Tank {
  id: TankId;
  /** Which look: the open sea's blue, the deep's dark, the river's green, a small tank's. */
  look: 'sea' | 'deep' | 'river' | 'small';
  /** Its glass box (its stand under it: y0 above the floor). */
  box: Box;
  /** The longest a fish is drawn in it (model units). */
  maxLen: number;
  /** How much bigger than NH's own a fish is drawn in it (the little ones, close to the glass). */
  scale: number;
}

const tank = (id: TankId, look: Tank['look'], box: Box, maxLen: number, scale = 1): Tank => ({ id, look, box, maxLen, scale });
/** The small tanks' grid: eight a row from x 76, 22.5 apart, 18 wide; the rows at z 50 and 84. */
const small = (i: number): Tank => {
  const x = 76 + (i % 8) * 22.5, z = i < 8 ? 50 : 84;
  return tank(`small-${i + 1}`, 'small', { x0: x - 9, x1: x + 9, y0: 9, y1: 25, z0: z - 9, z1: z + 9 }, 10, 2.4);
};

export const TANKS: readonly Tank[] = [
  tank('sea', 'sea', { x0: 80, x1: 292, y0: 0, y1: 52, z0: -98, z1: -46 }, 34),
  tank('deep', 'deep', { x0: 250, x1: 296, y0: 0, y1: 48, z0: -34, z1: 60 }, 30),
  tank('river', 'river', { x0: 118, x1: 236, y0: 0, y1: 22, z0: -16, z1: 14 }, 28),
  ...Array.from({ length: 16 }, (_, i) => small(i))
];

/** The water inside a tank's glass (its sand below, its surface a little under the rim). */
export function waterOf(t: Tank): Box {
  const b = t.box, glass = 1.2, sand = t.look === 'small' ? 2 : 4;
  return { x0: b.x0 + glass, x1: b.x1 - glass, y0: b.y0 + sand, y1: b.y1 - 2.5, z0: b.z0 + glass, z1: b.z1 - glass };
}

/** How big a fish of NH's length `len` (model units) is drawn in a tank: NH's own size (a little one bigger), a big one
 *  down to the tank's longest. */
export const fishScale = (t: Tank, len: number): number => Math.min(t.scale, t.maxLen / Math.max(1, len));
