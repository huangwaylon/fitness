// What the museum shows and where (docs/design.md "The museum"), pure: every fish and bug in the ずかん's first finds
// (model/finds.ts: anyone's, the guest's too; NH's shared museum, each credited to its first finder), each in its place:
//   a fish in its tank, NH's aquarium's three by water:
//     sea    the great tank (the sea's fish, the rays, the sharks)
//     deep   the deep-sea tank (dark: the oarfish, the coelacanth, the barreleye, the football fish, the squid…)
//     river  the river tank (the fresh water's: the river's and the pond's fish, the turtles, the frog; the crawfish and
//            the mitten crab walking its sand)
//   each tank showing at most five of its own at a time, a new pick each hour (onDisplay);
//   a bug where NH's garden would have it, by how it lives (island/critters.ts BUGS: its flight, its ground, its tree):
//     fly the flowers' air (the butterflies, the moths, the bees: on paths round the beds), dart over the pond (the
//     dragonflies), drift over it (the fireflies), flower (sat on a bloom), hop (in the grass), trunk / palm (perched on
//     a tree's trunk), leaf (on a bush's leaves: the snail, the walking leaf), ground (crawling the soil), water (on the
//     pond), terrarium (in a glass case: the tarantula, the scorpion, the centipede, the beach's crawlers, the mole
//     cricket), dangle (from a branch on its thread)
// A species' tank is its own, whatever else is found; which of a tank's are swimming is the hour's.
import { BUGS, FISH, type BugId } from '../island/critters.ts';
import { POND_FISH } from '../island/pondFish.ts';
import { findKey, type FirstFind } from '#lib/model/finds.ts';
import { ZONE_OFFSET_MS, localDateAt } from '#lib/time/dates.ts';

export type TankId = 'sea' | 'deep' | 'river';
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
/** The aquarium's bottom walkers, on the river tank's sand (NH's): the crab sideways, the crawfish ahead. */
export const WALKERS: Readonly<Record<string, 'side' | 'ahead'>> = { 'mitten-crab': 'side', crawfish: 'ahead' };

export const FISH_IDS: readonly string[] = [...Object.keys(POND_FISH), ...Object.keys(FISH)];
export const BUG_IDS: readonly string[] = Object.keys(BUGS);

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

/** The most of a tank's species swimming in it at once. */
export const PER_TANK = 5;
const TANK_IDS: readonly TankId[] = ['sea', 'deep', 'river'];
const HOUR_MS = 3_600_000;

/** The Tokyo hour of an instant (hours since the epoch, Tokyo's): the pick changes as it does. */
export const hourOf = (ms: number): number => Math.floor((ms + ZONE_OFFSET_MS) / HOUR_MS);
/** That hour as Tokyo's date and hour, `YYYY-MM-DDTHH` (the pick's seed). */
const hourKey = (hour: number): string => `${localDateAt(hour * HOUR_MS - ZONE_OFFSET_MS)}T${String(hour % 24).padStart(2, '0')}`;

/** Which fish swim in each tank this hour: at most PER_TANK of its own from what's on show (the ずかん's finds), by a
 *  shuffle seeded by (the Tokyo date and hour, the tank): the same on every phone, a new pick each hour, none twice. */
export function onDisplay(fish: readonly Specimen[], hour: number): Map<TankId, Specimen[]> {
  const key = hourKey(hour), out = new Map<TankId, Specimen[]>(), taken = new Set<string>();
  for (const tank of TANK_IDS) {
    const mine = [...new Map(fish.filter((s) => s.kind === 'fish' && s.tank === tank && !taken.has(s.id)).map((s) => [s.id, s])).values()];
    mine.sort((a, b) => (a.id < b.id ? -1 : 1));
    const rnd = mulberry(seedOf(`${key}|${tank}`));
    for (let i = mine.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [mine[i], mine[j]] = [mine[j], mine[i]];
    }
    const pick = mine.slice(0, PER_TANK);
    for (const s of pick) taken.add(s.id);
    out.set(tank, pick);
  }
  return out;
}
const seedOf = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
const mulberry = (a: number) => () => {
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
