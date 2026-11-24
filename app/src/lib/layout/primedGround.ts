// The ground's bands and the fields' bytes the launch's prime brought (fieldsPrime.ts: the worker's answer or the
// cache's), held till the island's ground takes them (bands.ts): a module of its own, so the launch's first load (which
// holds fieldsPrime.ts) carries none of bands.ts, and the worker (which builds them with bands.ts) none of the prime.
import type { BandArrays, SdfBytes } from './bands.ts';
import type { Fields } from './fields.ts';
import type { Layout } from './model.ts';

export interface PrimedGround { layout: Layout; f: Fields; bands: (BandArrays | null)[]; sdf: SdfBytes }
let ground: PrimedGround | null = null;
/** The prime's, for `layout` and its fields (a later one replaces it). */
export const holdGround = (g: PrimedGround): void => void (ground = g);
/** The prime's, once. */
export function takeGround(): PrimedGround | null {
  const g = ground;
  ground = null;
  return g;
}
