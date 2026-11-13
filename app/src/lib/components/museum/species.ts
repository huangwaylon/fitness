// What the museum shows and where (docs/design.md "The museum"), pure: every fish and bug in the ずかん's first finds
// (model/finds.ts: anyone's, the guest's too; NH's shared museum, each credited to its first finder), each in its place:
//   a fish in its tank, NH's aquarium's three by water:
//     sea    the great tank (the sea's fish, the rays, the sharks)
//     deep   the deep-sea tank (dark: the oarfish, the coelacanth, the barreleye, the football fish, the squid…)
//     river  the river tank (the fresh water's: the river's and the pond's fish, the turtles, the frog; the crawfish and
//            the mitten crab walking its sand)
//   each tank showing at most seven of its own at a time, a new pick each hour (onDisplay), the great tank's first a
//   caught predator (feeding.ts PREDATORS: there's always a hunter for its feeders, once one's been caught);
//   at most ten bugs at a time, a new pick each hour (bugShow.ts), each in a place of its own;
//   a bug where NH's garden would have it, by how it lives (world/critters.ts BUGS: its flight, its ground, its tree):
//     fly the flowers' air (the butterflies, the moths, the bees: on paths round the beds), dart over the pond (the
//     dragonflies), drift over it (the fireflies), flower (sat on a bloom), hop (in the grass), trunk / palm (perched on
//     a tree's trunk), leaf (on a bush's leaves: the snail, the walking leaf), ground (crawling the soil), water (on the
//     pond), terrarium (in a glass case: the tarantula, the scorpion, the centipede, the beach's crawlers, the mole
//     cricket), dangle (from a branch on its thread)
//   a sea creature in its place in the sea creatures' room (seaTanks.ts: the reef tank or the tide pool), all of them
//   at once (they hardly move: no hour's pick).
// A species' tank is its own, whatever else is found; which of a tank's are swimming is the hour's.
import { BUGS, FISH, type BugId } from '#lib/world/critters.ts';
import { POND_FISH } from '#lib/world/pondFish.ts';
import { SEA } from '#lib/world/sea.ts';
import { SEA_SPOTS, type SeaTankId } from './seaTanks.ts';
import { PREDATORS } from './feeding.ts';
import { findKey, type FirstFind } from '#lib/model/finds.ts';
import { ZONE_OFFSET_MS, localDateAt } from '#lib/time/dates.ts';
import { seeded, shuffle } from '#lib/random.ts';

export type TankId = 'sea' | 'deep' | 'river';
export type Habitat = 'fly' | 'dart' | 'drift' | 'flower' | 'hop' | 'trunk' | 'palm' | 'leaf' | 'ground' | 'water' | 'terrarium' | 'dangle';
type Kind = 'fish' | 'bug' | 'sea';
export interface Specimen {
  id: string;
  kind: Kind;
  /** Its tank (a fish, a sea creature) or its place in the garden (a bug). */
  tank: TankId | Habitat | SeaTankId;
  /** NH's shadow size, 1–6 (a fish), else 0. */
  size: number;
  found: FirstFind;
}

/** The deep sea's (NH's dark tank). */
const DEEP: ReadonlySet<string> = new Set(['oarfish', 'coelacanth', 'barreleye', 'football-fish', 'squid', 'sea-butterfly']);
/** The aquarium's bottom walkers, on the river tank's sand (NH's): the crab sideways, the crawfish ahead. */
export const WALKERS: Readonly<Record<string, 'side' | 'ahead'>> = { 'mitten-crab': 'side', crawfish: 'ahead' };

/** NH's museum-tank variants of the bugs where they differ from the catch's model (the dung beetle with its ball; the
 *  others NH ships, the ant and the cicada shell, are the catch's same mesh): scripts/world3d-models.ts --museum's
 *  `bug-museum` pack, each member its id. NH's fish variants are the catch's meshes too (only their textures differ),
 *  so the aquarium keeps the catch models. */
export const BUG_MUSEUM_MODEL: Readonly<Record<string, string>> = { 'dung-beetle': 'InsectFunkorogashiMuseum' };

export const FISH_IDS: readonly string[] = [...Object.keys(POND_FISH), ...Object.keys(FISH)];
export const BUG_IDS: readonly string[] = Object.keys(BUGS);
const SEA_IDS: readonly string[] = Object.keys(SEA);

/** A fish's NH shadow size (1–6). */
const fishSize = (id: string): number => (FISH as Record<string, { size: number }>)[id]?.size ?? (POND_FISH as Record<string, { size: number }>)[id]?.size ?? 2;
const isSea = (id: string): boolean => id in FISH;

/** A fish's tank. */
export function tankOf(id: string): TankId {
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
    // (NH's spider, down from its tree, crawls the ground; the bagworm stays on its thread)
    case 'dangle': return id === 'spider' ? 'ground' : 'dangle';
    case 'stalk': case 'burrow': return 'terrarium';
    case 'crawl':
      if (b.ground === 'pond') return 'water';
      if (b.ground === 'bush' || b.ground === 'tree') return 'leaf';
      if (b.ground === 'beach' || b.ground === 'rock') return 'terrarium';
      if (b.ground === 'beds') return 'flower';
      return 'ground';
  }
}

/** What's on show: every fish, bug and sea creature in the first finds, in the ずかん's kinds' order, each in its place. */
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
  for (const id of SEA_IDS) {
    const f = finds.get(findKey('sea', id)), sp = SEA_SPOTS.get(id);
    if (f && sp) out.push({ id, kind: 'sea', tank: sp.tank, size: 0, found: f });
  }
  return out;
}

/** The most of a tank's species swimming in it at once. */
export const PER_TANK = 7;
/** The largest tank: its pick always leads with a caught predator (none caught: none). */
export const HUNTED: TankId = 'sea';
const TANK_IDS: readonly TankId[] = ['sea', 'deep', 'river'];
const HOUR_MS = 3_600_000;

/** The Tokyo hour of an instant (hours since the epoch, Tokyo's): the pick changes as it does. */
export const hourOf = (ms: number): number => Math.floor((ms + ZONE_OFFSET_MS) / HOUR_MS);
/** That hour as Tokyo's date and hour, `YYYY-MM-DDTHH` (the pick's seed). */
const hourKey = (hour: number): string => `${localDateAt(hour * HOUR_MS - ZONE_OFFSET_MS)}T${String(hour % 24).padStart(2, '0')}`;

/** Which fish swim in each tank this hour: at most PER_TANK of its own from what's on show (the ずかん's finds), by a
 *  shuffle seeded by (the Tokyo date and hour, the tank): the same on every phone, a new pick each hour, none twice. The
 *  great tank's (HUNTED) first is the shuffle's first predator caught (feeding.ts PREDATORS), the rest in its order. */
export function onDisplay(fish: readonly Specimen[], hour: number): Map<TankId, Specimen[]> {
  const out = new Map<TankId, Specimen[]>(), taken = new Set<string>();
  for (const tank of TANK_IDS) {
    const mine = hourShuffle(fish.filter((s) => s.kind === 'fish' && s.tank === tank && !taken.has(s.id)), hour, tank);
    if (tank === HUNTED) {
      const k = mine.findIndex((s) => PREDATORS.has(s.id));
      if (k > 0) mine.unshift(...mine.splice(k, 1));
    }
    const pick = mine.slice(0, PER_TANK);
    for (const s of pick) taken.add(s.id);
    out.set(tank, pick);
  }
  return out;
}
/** These specimens (one of each id) shuffled by a seed of (`hour`'s Tokyo date and hour, `what`): the same order on
 *  every phone, a new one each hour (`hour`: hourOf's). */
export function hourShuffle(list: readonly Specimen[], hour: number, what: string): Specimen[] {
  const out = [...new Map(list.map((s) => [s.id, s])).values()].sort((a, b) => (a.id < b.id ? -1 : 1));
  return shuffle(out, seeded(`${hourKey(hour)}|${what}`));
}
