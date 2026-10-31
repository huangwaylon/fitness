// The island's day items (docs/design.md "Beach finds"): seashells washing up on the front beach, fossil dig spots on
// the lawn, a message bottle now and then, star fragments the morning after a wish. Pure and deterministic: everything
// derives from the Tokyo date and the time of day plus a seed, so both phones broadly see the same island; what one
// phone picked up is hidden there only (the caller keeps that list). Nothing here counts for anything: a pick-up is a
// caption, an icon and (the first time) a ずかん `find`, never ベル.
import { mulberry32 } from '#lib/random.ts';

/** The island's own seed (`?seed=` in the demo varies it). */
export const ISLAND_SEED = 'island-fund';

/** A seeded PRNG for one stream of one day. */
function dayRand(date: string, stream: string, seed = ISLAND_SEED): () => number {
  let h = 2166136261;
  for (const c of `${seed}|${date}|${stream}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return mulberry32(h);
}

/** A weighted pick from [id, weight] pairs. */
function weighted<T extends string>(list: readonly (readonly [T, number])[], r: () => number): T {
  const total = list.reduce((s, [, w]) => s + w, 0);
  let x = r() * total;
  for (const [id, w] of list) if ((x -= w) < 0) return id;
  return list[list.length - 1][0];
}

// ---------- catalogs (official NH items; art in static/art/finds/, names under beach.name.<id>) ----------

/** NH's seashells on the beach (the summer shell and the diving shells aside), with how often each washes up. */
export const SHELLS = [
  ['sea-snail', 4], ['cowrie', 4], ['venus-comb', 3], ['sand-dollar', 3], ['coral', 2], ['conch', 1.5], ['giant-clam', 1]
] as const;
type ShellId = (typeof SHELLS)[number][0];

/** Fossils to dig up: NH's standalone fossils and one piece of each dinosaur (the skull, the pteranodon's body). */
export const FOSSILS = [
  'amber', 'ammonite', 'trilobite', 'dinosaur-track', 'shark-tooth-pattern', 'coprolite', 'myllokunmingia', 'juramaia',
  'anomalocaris', 'archaeopteryx', 'dunkleosteus', 'eusthenopteron', 'acanthostega', 'australopith', 't-rex-skull',
  'tricera-skull', 'stego-skull', 'brachio-skull', 'mammoth-skull', 'sabertooth-skull', 'dimetrodon-skull', 'ankylo-skull',
  'plesio-skull', 'spino-skull', 'iguanodon-skull', 'pachy-skull', 'diplo-skull', 'ptera-body', 'megacero-skull',
  'parasaur-skull', 'ophthalmo-skull', 'archelon-skull'
] as const;
type FossilId = (typeof FOSSILS)[number];

/** NH's zodiac fragments by season (from the day each sign starts: [month, day]), then the two plain fragments. */
const ZODIAC: readonly (readonly [string, number, number])[] = [
  ['capricorn', 1, 1], ['aquarius', 1, 20], ['pisces', 2, 19], ['aries', 3, 21], ['taurus', 4, 20], ['gemini', 5, 21],
  ['cancer', 6, 22], ['leo', 7, 23], ['virgo', 8, 23], ['libra', 9, 23], ['scorpius', 10, 24], ['sagittarius', 11, 23],
  ['capricorn', 12, 22]
];
export const FRAGMENTS = [
  'star-fragment', 'large-star-fragment', ...['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpius',
    'sagittarius', 'capricorn', 'aquarius', 'pisces'].map((z) => `${z}-fragment`)
] as const;

/** The zodiac fragment of a date's season (`MM-DD` compared as text). */
export function zodiacOf(date: string): string {
  const md = date.slice(5);
  let sign = 'capricorn';
  for (const [z, m, d] of ZODIAC) if (md >= `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`) sign = z;
  return `${sign}-fragment`;
}

// ---------- where things lie (stage units, docs/design.md "Layout and scale") ----------

/** The front beach between the cliff's foot and the foam (shells, the bottle, fragments): x and a 0–1 depth. */
export const BEACH = { x0: 74, x1: 316, y0: 331, y1: 345 } as const;
/** Open lawn for a dig spot, clear of every control at 320–430 px (measured: the canopies, the fruit rows, the jar,
 *  the villagers): beside the trunks under the canopies, and between the fruit rows and the beds. */
export const DIG_SPOTS: readonly (readonly [number, number])[] = [
  [68, 143], [142, 143], [248, 143], [322, 143], [66, 219], [324, 219]
];

// ---------- the schedules ----------

/** Arrival times (ms after Tokyo midnight) of a stream that brings one thing every [min, max] ms, the first at
 *  `first`·gap, up to `until`. */
function arrivals(r: () => number, [min, max]: readonly [number, number], until: number, first = 1): number[] {
  const out: number[] = [];
  for (let t = (min + r() * (max - min)) * first; t <= until; t += min + r() * (max - min)) out.push(Math.round(t));
  return out;
}

export interface Shell { uid: string; id: ShellId; x: number; y: number; tilt: number; at: number }

/** One shell washes up every 60–120 s (user: frequent); the sand holds the newest 3 (an older one is taken back by the
 *  tide). `ms`: ms after Tokyo midnight. Picked ones (by uid) are left out by the caller. */
const SHELL_GAP: readonly [number, number] = [60_000, 120_000];
export const MAX_SHELLS = 3;
export function shellsAt(date: string, ms: number, seed = ISLAND_SEED): Shell[] {
  const r = dayRand(date, 'shells', seed);
  const times = arrivals(r, SHELL_GAP, ms, 0.25);
  return times.slice(-MAX_SHELLS).map((at) => {
    // each shell's own stream (so the list doesn't shift as more arrive)
    const s = dayRand(date, `shell@${at}`, seed);
    return { uid: `s${at}`, id: weighted(SHELLS, s), x: BEACH.x0 + s() * (BEACH.x1 - BEACH.x0), y: BEACH.y0 + s() * (BEACH.y1 - BEACH.y0), tilt: Math.round(s() * 50 - 25), at };
  });
}

export interface DigSpot { uid: string; fossil: FossilId; x: number; y: number }

/** The day's fossils, in the order they turn up: 1–2 dig spots at a time (seeded per day), each on its own lawn
 *  spot; the next comes after one is dug (the caller adds a short wait). `dug`: uids already dug on this phone. */
export function digSpots(date: string, dug: ReadonlySet<string>, seed = ISLAND_SEED): DigSpot[] {
  const r = dayRand(date, 'fossils', seed);
  const atOnce = r() < 0.5 ? 1 : 2;
  const out: DigSpot[] = [];
  const used = new Set<number>();
  for (let i = 0; i < 60 && out.length < atOnce; i++) {
    const fossil = FOSSILS[Math.floor(r() * FOSSILS.length)];
    let spot = Math.floor(r() * DIG_SPOTS.length);
    const uid = `f${i}`;
    if (dug.has(uid)) continue;
    while (used.has(spot)) spot = (spot + 1) % DIG_SPOTS.length;
    used.add(spot);
    const [x, y] = DIG_SPOTS[spot];
    out.push({ uid, fossil, x, y });
  }
  return out;
}

export interface Bottle { uid: string; note: number; x: number; y: number; at: number }

/** A message bottle drifts in every 8–14 minutes and lies at the water's edge for 6 (then the tide takes it). */
const BOTTLE_GAP: readonly [number, number] = [8 * 60_000, 14 * 60_000];
export const BOTTLE_STAY = 6 * 60_000;
/** How many notes the bottles carry (beach.note.0 … ). */
export const NOTES = 16;
export function bottleAt(date: string, ms: number, seed = ISLAND_SEED): Bottle | null {
  const at = arrivals(dayRand(date, 'bottles', seed), BOTTLE_GAP, ms).at(-1);
  if (at === undefined || ms - at > BOTTLE_STAY) return null;
  const s = dayRand(date, `bottle@${at}`, seed);
  return { uid: `b${at}`, note: Math.floor(s() * NOTES), x: BEACH.x0 + 10 + s() * (BEACH.x1 - BEACH.x0 - 20), y: BEACH.y1 + 2, at };
}

export interface Fragment { uid: string; id: string; x: number; y: number }

/** The day a wish brings star fragments: a wish on a shooting star before dawn (5:00) lands them that morning, after
 *  dusk the next morning (NH: the day after). */
export function fragmentDay(wishDate: string, hour: number, next: (d: string) => string): string {
  return hour < 5 ? wishDate : next(wishDate);
}

/** The morning after a wish, 2–3 fragments lie on the beach: mostly star fragments, now and then a large one or the
 *  season's zodiac fragment. */
export function fragmentsOn(date: string, seed = ISLAND_SEED): Fragment[] {
  const r = dayRand(date, 'fragments', seed);
  const n = 2 + (r() < 0.5 ? 1 : 0);
  return Array.from({ length: n }, (_, i) => {
    const k = r();
    const id = k < 0.2 ? zodiacOf(date) : k < 0.4 ? 'large-star-fragment' : 'star-fragment';
    // spread along the beach, one in each third
    const x = BEACH.x0 + ((i + 0.2 + r() * 0.6) / n) * (BEACH.x1 - BEACH.x0);
    return { uid: `g${i}`, id, x, y: BEACH.y0 + r() * (BEACH.y1 - BEACH.y0) };
  });
}

/** The official icon of a beach item (static/art/finds/, fetched by scripts/fetch-assets.ts). */
export const findArt = (id: string): string => `finds/${id}`;
