// The sea creatures' room's tanks (docs/design.md "The museum"), pure: NH's 40 sea creatures (world/sea.ts), each
// shown once anyone has caught it, in one of the aquarium's two tanks of theirs (plan.ts FISH_WING):
//   the reef tank   along the right wall, tall: the drifters in its water (the jellyfish, the squid, the octopuses that
//                   swim, the nautilus) and the big crawlers on its sand
//   the tide pool   a low island in the middle (looked down into): the shells, urchins, stars and the little ones
// Each creature has its own place in its tank (the same whatever else is in), drawn as NH's museum-tank model where NH
// has one (`*Museum`: the octopus sprawled, the seaweed in a clump, the eels out of their sand, the barnacles on their
// rock...) and as the island's catch model otherwise.

import { across, alongX, type Box } from './tanks.ts';

/** NH's museum-tank variants (scripts/world3d-models.ts --museum: the `sea-museum` pack, each member its id). */
export const SEA_MUSEUM_MODEL: Readonly<Record<string, string>> = {
  'pearl-oyster': 'DiveFishAkoyagaiMuseum', 'spotted-garden-eel': 'DiveFishChinanagoMuseum', 'acorn-barnacle': 'DiveFishFujitsuboMuseum',
  'firefly-squid': 'DiveFishHotaruikaMuseum', 'sea-anemone': 'DiveFishIsogintyakuMuseum', 'moon-jellyfish': 'DiveFishMizukurageMuseum',
  mussel: 'DiveFishMuhrugaiMuseum', oyster: 'DiveFishOysterMuseum', octopus: 'DiveFishTakoMuseum', 'sea-grapes': 'DiveFishUmibudouMuseum',
  seaweed: 'DiveFishWakameMuseum', 'snow-crab': 'DiveFishZuwaiganiMuseum'
};

export type SeaTankId = 'reef' | 'pool';
interface SeaTank { id: SeaTankId; box: Box }
/** The two tanks' glass boxes (on the floor; under the room's ceiling, plan.ts WING_H). */
export const SEA_TANKS: readonly SeaTank[] = [
  { id: 'reef', box: { x0: 150, x1: 176, y0: 0, y1: 38, z0: 28, z1: 110 } },
  { id: 'pool', box: { x0: 106, x1: 130, y0: 0, y1: 15, z0: 40, z1: 84 } }
];
/** The drifters (in the reef tank's water, bobbing), the reef's floor (its big crawlers, NH's tall ones at the back) and
 *  the tide pool's (the little ones, a grid), each list in its places' order. */
const DRIFTERS = ['moon-jellyfish', 'firefly-squid', 'vampire-squid', 'umbrella-octopus', 'chambered-nautilus'] as const;
const REEF_BACK = ['seaweed', 'acorn-barnacle', 'venus-flower-basket', 'spider-crab', 'sea-pig', 'giant-isopod', 'horseshoe-crab'] as const;
const REEF_FRONT = ['octopus', 'snow-crab', 'red-king-crab', 'dungeness-crab', 'gazami-crab', 'lobster', 'spiny-lobster'] as const;
const POOL = [
  'sea-star', 'sea-urchin', 'slate-pencil-urchin', 'sea-anemone', 'sea-grapes', 'sea-cucumber', 'spotted-garden-eel',
  'pearl-oyster', 'mussel', 'oyster', 'scallop', 'whelk', 'turban-shell', 'abalone',
  'gigas-giant-clam', 'sea-slug', 'flatworm', 'sea-pineapple', 'tiger-prawn', 'sweet-shrimp', 'mantis-shrimp'
] as const;

/** A creature's place: its tank, its spot (x, y the floor or its height in the water, z), the most it may measure
 *  across (model units: it's scaled down to fit, a little one up to MIN_ACROSS), whether it drifts. */
interface SeaSpot { tank: SeaTankId; x: number; y: number; z: number; fit: number; drifts: boolean }
/** The least a creature is drawn across (NH's tanks show the little ones big). */
export const MIN_ACROSS = 4.5;
const SAND = 3;
export const SEA_SPOTS: ReadonlyMap<string, SeaSpot> = (() => {
  const out = new Map<string, SeaSpot>();
  const [reef, pool] = SEA_TANKS.map((t) => t.box);
  // (a row along a tank's long side, `back` of the way from its back (the wall, or its far side from the room's middle: tanks.ts frontOf) to its front)
  const row = (ids: readonly string[], tank: SeaTankId, b: Box, back: number, y: number, fit: number, drifts = false) =>
    ids.forEach((id, k) => {
      const t = (k + 0.5) / ids.length, c = across(b, back), [x, z] = alongX(b) ? [b.x0 + t * (b.x1 - b.x0), c] : [c, b.z0 + t * (b.z1 - b.z0)];
      out.set(id, { tank, x, y, z, fit, drifts });
    });
  const depth = (b: Box) => Math.min(b.x1 - b.x0, b.z1 - b.z0);
  row(REEF_BACK, 'reef', reef, 6 / depth(reef), SAND, 9);
  row(REEF_FRONT, 'reef', reef, 1 - 7 / depth(reef), SAND, 9);
  row(DRIFTERS, 'reef', reef, 0.5, 22, 8, true);
  // the tide pool: three rows of seven
  for (let r = 0; r < 3; r++) row(POOL.slice(r * 7, r * 7 + 7), 'pool', pool, (r + 0.5) / 3, SAND, 6.5);
  return out;
})();
