// What the museum shows and where (docs/design.md "The museum"), pure: every fish and bug in the ずかん's first finds
// (model/finds.ts: anyone's, the guest's too; NH's shared museum, each credited to its first finder), each in its place:
//   a fish in its tank, NH's aquarium grouped by water and size:
//     sea       the great tank (the sea's middling and big fish, the rays, the sharks)
//     deep      the deep-sea tank (dark: the oarfish, the coelacanth, the barreleye, the football fish, the squid…)
//     river     the river tank (the fresh water's middling and big fish, the turtles)
//     small-1…8 the small tanks, two to each group of little fish: the pond's, the stream's, the tropical, the reef's
//   a bug where NH's garden would have it, by how it lives (island/critters.ts BUGS: its flight, its ground, its tree):
//     fly the flowers' air (the butterflies, the moths, the bees: on paths round the beds), dart over the pond (the
//     dragonflies), drift over it (the fireflies), flower (sat on a bloom), hop (in the grass), trunk / palm (perched on
//     a tree's trunk), leaf (on a bush's leaves: the snail, the walking leaf), ground (crawling the soil), water (on the
//     pond), terrarium (in a glass case: the tarantula, the scorpion, the centipede, the beach's crawlers, the mole
//     cricket), dangle (from a branch on its thread)
// The assignment is the species' own, whatever else is found, so a tank never reshuffles.
import { BUGS, FISH, type BugId } from '../island/critters.ts';
import { POND_FISH } from '../island/pondFish.ts';
import { findKey, type FirstFind } from '#lib/model/finds.ts';

export type TankId = 'sea' | 'deep' | 'river' | `small-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
export type Habitat = 'fly' | 'dart' | 'drift' | 'flower' | 'hop' | 'trunk' | 'palm' | 'leaf' | 'ground' | 'water' | 'terrarium' | 'dangle';
type Kind = 'fish' | 'bug';
export interface Specimen {
  id: string;
  kind: Kind;
  /** Its tank (a fish) or its place in the garden (a bug). */
  tank: TankId | Habitat;
  /** NH's shadow size, 1–6 (a fish), else 0. */
  size: number;
  found: FirstFind;
}

/** The deep sea's (NH's dark tank). */
const DEEP: ReadonlySet<string> = new Set(['oarfish', 'coelacanth', 'barreleye', 'football-fish', 'squid', 'sea-butterfly']);
/** The little fish's groups, each two small tanks (the first half of a group's list in the first). */
const SMALL: Record<string, readonly string[]> = {
  pond: ['goldfish', 'pop-eyed-goldfish', 'ranchu-goldfish', 'killifish', 'tadpole', 'frog', 'crawfish', 'crucian-carp'],
  stream: ['bitterling', 'pale-chub', 'freshwater-goby', 'loach', 'bluegill', 'pond-smelt', 'mitten-crab'],
  tropical: ['guppy', 'nibble-fish', 'angelfish', 'betta', 'neon-tetra', 'rainbowfish', 'piranha'],
  reef: ['clownfish', 'surgeonfish', 'butterfly-fish', 'sea-horse', 'anchovy', 'horse-mackerel']
};
const SMALL_TANK = new Map<string, TankId>();
Object.values(SMALL).forEach((ids, g) => ids.forEach((id, i) => SMALL_TANK.set(id, `small-${g * 2 + (i < Math.ceil(ids.length / 2) ? 1 : 2)}` as TankId)));

export const FISH_IDS: readonly string[] = [...Object.keys(POND_FISH), ...Object.keys(FISH)];
export const BUG_IDS: readonly string[] = Object.keys(BUGS);

/** A fish's NH shadow size (1–6). */
const fishSize = (id: string): number => (FISH as Record<string, { size: number }>)[id]?.size ?? (POND_FISH as Record<string, { size: number }>)[id]?.size ?? 2;
const isSea = (id: string): boolean => id in FISH;

/** A fish's tank. */
export function tankOf(id: string): TankId {
  const small = SMALL_TANK.get(id);
  if (small) return small;
  if (DEEP.has(id)) return 'deep';
  return isSea(id) ? 'sea' : 'river';
}

/** A bug's place in the garden. */
export function habitatOf(id: string): Habitat {
  const b = BUGS[id as BugId];
  if (!b) return 'ground';
  switch (b.flight) {
    case 'flutter': return 'fly';
    case 'dart': return 'dart';
    case 'drift': return 'drift';
    case 'flower': return 'flower';
    case 'hop': return 'hop';
    case 'perch': return b.tree === 'palm' ? 'palm' : 'trunk';
    case 'dangle': return 'dangle';
    case 'stalk': case 'burrow': return 'terrarium';
    case 'crawl':
      if (b.ground === 'pond') return 'water';
      if (b.ground === 'bush' || b.ground === 'tree') return 'leaf';
      if (b.ground === 'beach' || b.ground === 'rock') return 'terrarium';
      if (b.ground === 'beds') return 'flower';
      return 'ground';
  }
}

/** What's on show: every fish and bug in the first finds, in the ずかん's kinds' order, each in its place. */
export function onShow(finds: ReadonlyMap<string, FirstFind>): Specimen[] {
  const out: Specimen[] = [];
  for (const id of FISH_IDS) {
    const f = finds.get(findKey('fish', id));
    if (f) out.push({ id, kind: 'fish', tank: tankOf(id), size: fishSize(id), found: f });
  }
  for (const id of BUG_IDS) {
    const f = finds.get(findKey('bug', id));
    if (f) out.push({ id, kind: 'bug', tank: habitatOf(id), size: 0, found: f });
  }
  return out;
}
