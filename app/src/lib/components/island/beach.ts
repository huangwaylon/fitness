// The island's day items (docs/design.md "Beach finds"): seashells washing up on the front beach, fossil dig spots on
// the lawn, a message bottle now and then, star fragments the morning after a wish. Pure and deterministic: everything
// derives from the Tokyo date and the time of day plus a seed, so both phones broadly see the same island; what one
// phone picked up is hidden there only (the caller keeps that list). Nothing here counts for anything: a pick-up is a
// caption, an icon and (the first time) a ずかん `find`, never ベル.
import { pickOne, shuffle, weighted } from '#lib/random.ts';
import { ISLAND_SEED, dayRand } from './daySeed.ts';
import { BEACH_BOX, DIG_SPOTS as DIGS, LAWN_SPOTS, SHORE_Z } from './world.ts';
import { daySpots } from '#lib/layout/spots.ts';
import type { Layout } from '#lib/layout/model.ts';

// ---------- catalogs (official NH items; art in static/art/finds/, names under beach.name.<id>) ----------

/** NH's eight beach seashells (the pearl comes from diving: island/sea.ts), with how often each washes up; the summer
 *  shell is NH's summer one (June–September): ×SHELL_SEASON then, rare otherwise, never a gate. */
export const SHELLS = [
  ['sea-snail', 4], ['cowrie', 4], ['venus-comb', 3], ['sand-dollar', 3], ['coral', 2], ['conch', 1.5], ['giant-clam', 1],
  ['summer-shell', 0.6]
] as const;
type ShellId = (typeof SHELLS)[number][0];
const SUMMER_SHELL_MONTHS = [6, 7, 8, 9];
const SHELL_SEASON = 3;
/** The shells' odds in `month` (the summer shell ×SHELL_SEASON in its months). */
export const shellOdds = (month: number): (readonly [ShellId, number])[] =>
  SHELLS.map(([id, w]) => [id, id === 'summer-shell' && SUMMER_SHELL_MONTHS.includes(month) ? w * SHELL_SEASON : w] as const);

/** NH's 14 standalone fossils. */
const STANDALONE = [
  'amber', 'ammonite', 'trilobite', 'dinosaur-track', 'shark-tooth-pattern', 'coprolite', 'myllokunmingia', 'juramaia',
  'anomalocaris', 'archaeopteryx', 'dunkleosteus', 'eusthenopteron', 'acanthostega', 'australopith'
] as const;
/** NH's 21 fossils in pieces, each with its pieces in the game's order (the ずかん shows each as a set: 「Tレックス 2/3」). */
export const FOSSIL_SETS = {
  't-rex': ['t-rex-skull', 't-rex-torso', 't-rex-tail'],
  tricera: ['tricera-skull', 'tricera-torso', 'tricera-tail'],
  stego: ['stego-skull', 'stego-torso', 'stego-tail'],
  brachio: ['brachio-skull', 'brachio-chest', 'brachio-pelvis', 'brachio-tail'],
  mammoth: ['mammoth-skull', 'mammoth-torso'],
  sabertooth: ['sabertooth-skull', 'sabertooth-tail'],
  dimetrodon: ['dimetrodon-skull', 'dimetrodon-torso'],
  ankylo: ['ankylo-skull', 'ankylo-torso', 'ankylo-tail'],
  plesio: ['plesio-skull', 'plesio-torso', 'plesio-tail'],
  spino: ['spino-skull', 'spino-torso', 'spino-tail'],
  iguanodon: ['iguanodon-skull', 'iguanodon-torso', 'iguanodon-tail'],
  pachy: ['pachy-skull', 'pachy-tail'],
  diplo: ['diplo-skull', 'diplo-neck', 'diplo-chest', 'diplo-pelvis', 'diplo-tail', 'diplo-tail-tip'],
  ptera: ['ptera-body', 'left-ptera-wing', 'right-ptera-wing'],
  megacero: ['megacero-skull', 'megacero-torso', 'megacero-tail'],
  parasaur: ['parasaur-skull', 'parasaur-torso', 'parasaur-tail'],
  ophthalmo: ['ophthalmo-skull', 'ophthalmo-torso'],
  archelon: ['archelon-skull', 'archelon-tail'],
  deinony: ['deinony-torso', 'deinony-tail'],
  megalo: ['left-megalo-side', 'right-megalo-side'],
  quetzal: ['quetzal-torso', 'left-quetzal-wing', 'right-quetzal-wing']
} as const;
/** Every fossil to dig up (NH's 73): the standalone ones, then each set's pieces; each as likely as any other. */
export const FOSSILS = [...STANDALONE, ...Object.values(FOSSIL_SETS).flat()];
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

// ---------- where things lie (world units: x across, y = the world's z, docs/design.md "World") ----------

/** The front beach between the grass and the foam (shells, the bottle, fragments). */
export const BEACH = { x0: BEACH_BOX.x0, x1: BEACH_BOX.x1, y0: BEACH_BOX.z0 + 8, y1: BEACH_BOX.z1 } as const;
/** The water's edge (the bottle lies half in the foam). */
const EDGE_Z = SHORE_Z + 3;
/** The least gap (u) between two things lying on the front beach (shells, fragments, the bottle): about two of them
 *  side by side, so they never clump or touch. */
export const BEACH_GAP = 34;
type Pt = { x: number; y: number };
/** A spot on the beach (from the item's own stream `r`) at least BEACH_GAP from every point in `near`: every 5u along
 *  the sand, tried in a seeded order (so a gap is found whenever there is one), else the spot furthest from them (a
 *  crowded beach: fragments after many wishes). `first`: an x to try first (a fragment's stretch of sand); `edge`: at the
 *  water's edge, half in the foam (the bottle). Depth varies a little (y0 − 2 to y1). */
function beachSpot(r: () => number, near: readonly Pt[], { first, edge = false }: { first?: number; edge?: boolean } = {}): Pt {
  const x0 = BEACH.x0 + 6 + r() * 5, n = Math.floor((BEACH.x1 - 6 - x0) / 5) + 1;
  const xs = Array.from({ length: n }, (_, k) => x0 + k * 5);
  shuffle(xs, r);
  if (first !== undefined) xs.unshift(first);
  let best: Pt = { x: xs[0], y: BEACH.y1 }, bestD = -1;
  const tenth = (v: number) => Math.round(v * 10) / 10;
  for (const x0 of xs) {
    const x = tenth(x0), y = tenth(edge ? EDGE_Z : BEACH.y0 - 2 + r() * (BEACH.y1 - BEACH.y0 + 2));
    const d = Math.min(Infinity, ...near.map((p) => Math.hypot(p.x - x, p.y - y)));
    if (d >= BEACH_GAP) return { x, y };
    if (d > bestD) (best = { x, y }), (bestD = d);
  }
  return best;
}
/** Open lawn for a weed (world.ts LAWN_SPOTS: the health lawn and the campsite's ground, off the paths, flowers and trunks;
 *  a dig spot takes its own spots, world.ts DIG_SPOTS). Centre stage (a visitor's spot) stays clear. */
export const LAWN: readonly (readonly [number, number])[] = LAWN_SPOTS;
export const DIG_SPOTS: readonly (readonly [number, number])[] = DIGS;

/** Where a day's weeds and fossils may go: world.ts's fixed spots (the 2D island's), or the layout's open grass,
 *  seeded by the date (layout/spots.ts daySpots: the 3D island on the layout calls useSpots(layoutSpots(…))). The
 *  same on every phone either way. */
type SpotSource = (date: string, seed: string) => { lawn: readonly (readonly [number, number])[]; dig: readonly (readonly [number, number])[] };
const worldSpots: SpotSource = () => ({ lawn: LAWN, dig: DIG_SPOTS });
let source: SpotSource = worldSpots;
/** @public (the 3D island on the layout) Today's spots from this source (null: world.ts's). */
export function useSpots(s: SpotSource | null): void {
  source = s ?? worldSpots;
}
/** @public (the 3D island on the layout) The layout's daily spots as a source. */
export const layoutSpots = (get: () => Layout): SpotSource => (date, seed) => daySpots(get(), date, seed);
/** The day's spots. */
export const spotsOn = (date: string, seed = ISLAND_SEED) => source(date, seed);

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
/** The shells (`at` ≤ ms, the newest 3) on the sand at `ms`, keeping BEACH_GAP from each other, the morning's
 *  `fragments` and a bottle lying there. Picked ones (by uid) are left out by the caller. */
export function shellsAt(date: string, ms: number, seed = ISLAND_SEED, fragments: readonly Fragment[] = []): Shell[] {
  return beachDay(date, seed, fragments).shells.filter((s) => s.at <= ms).slice(-MAX_SHELLS);
}

/** The whole day on the front beach, worked out once (per date, seed and the morning's fragments): every shell and
 *  bottle in the order they arrive, each placed BEACH_GAP clear of what lies there when it lands (the fragments, the
 *  last two shells, a bottle), so a new arrival never moves anything already lying there and both phones agree. */
const days = new Map<string, { shells: Shell[]; bottles: Bottle[] }>();
function beachDay(date: string, seed: string, fragments: readonly Fragment[]): { shells: Shell[]; bottles: Bottle[] } {
  const key = `${date}|${seed}|${fragments.map((f) => `${f.x},${f.y}`).join(';')}`;
  const hit = days.get(key);
  if (hit) return hit;
  const DAY = 24 * 3600_000;
  const shellTimes = arrivals(dayRand(date, 'shells', seed), SHELL_GAP, DAY, 0.25);
  const bottleTimes = arrivals(dayRand(date, 'bottles', seed), BOTTLE_GAP, DAY);
  const odds = shellOdds(Number(date.slice(5, 7)));
  const shells: Shell[] = [], bottles: Bottle[] = [];
  const events = [...shellTimes.map((at) => ({ at, shell: true })), ...bottleTimes.map((at) => ({ at, shell: false }))].sort((a, b) => a.at - b.at);
  for (const { at, shell } of events) {
    const lying: Pt[] = [...fragments, ...shells.slice(shell ? -(MAX_SHELLS - 1) : -MAX_SHELLS), ...bottles.filter((b) => at - b.at <= BOTTLE_STAY)];
    if (shell) {
      // each shell's own stream (its kind and tilt don't depend on what else is about)
      const s = dayRand(date, `shell@${at}`, seed);
      const id = weighted(odds, s), tilt = Math.round(s() * 50 - 25);
      shells.push({ uid: `s${at}`, id, tilt, at, ...beachSpot(s, lying) });
    } else {
      const s = dayRand(date, `bottle@${at}`, seed);
      bottles.push({ uid: `b${at}`, note: Math.floor(s() * NOTES), at, ...beachSpot(s, lying, { edge: true }) });
    }
  }
  if (days.size > 8) days.clear();
  const day = { shells, bottles };
  days.set(key, day);
  return day;
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
    const fossil = pickOne(FOSSILS, r);
    const spots = spotsOn(date, seed).dig;
    let spot = Math.floor(r() * spots.length);
    const uid = `f${i}`;
    if (dug.has(uid)) continue;
    while (used.has(spot)) spot = (spot + 1) % spots.length;
    used.add(spot);
    const [x, y] = spots[spot];
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
/** The bottle at the water's edge at `ms` (half in the foam, BEACH_GAP clear of what was lying there when it came), or
 *  null. */
export function bottleAt(date: string, ms: number, seed = ISLAND_SEED, fragments: readonly Fragment[] = []): Bottle | null {
  const b = beachDay(date, seed, fragments).bottles.filter((x) => x.at <= ms).at(-1);
  return b && ms - b.at <= BOTTLE_STAY ? b : null;
}
/** A bottle brought now (`?find=bottle`): at the water's edge, clear of what lies on the sand. */
export function bottleNow(date: string, lying: readonly Pt[], seed = ISLAND_SEED): Bottle {
  const s = dayRand(date, 'bottle-now', seed);
  return { uid: 'b-demo', note: Math.floor(s() * NOTES), at: 0, ...beachSpot(s, lying, { edge: true }) };
}

export interface Fragment { uid: string; id: string; x: number; y: number }

/** The morning after `n` wishes (stars.ts fragmentsDue), `n` fragments lie on the beach: mostly star fragments, now
 *  and then a large one or the season's zodiac fragment (twice as likely after a meteor shower's night, `shower`,
 *  meteor.ts), spread along the sand one to each stretch of it (so they never pile up), each where it landed whatever
 *  `n` (a later wish only adds one further along). */
export function fragmentsOn(date: string, n: number, seed = ISLAND_SEED, shower = false): Fragment[] {
  const slots = SLOTS(date, seed);
  const zodiac = shower ? 0.4 : 0.2;
  const out: Fragment[] = [];
  for (let i = 0; i < n; i++) {
    const r = dayRand(date, `fragment@${i}`, seed);
    const k = r();
    const id = k < zodiac ? zodiacOf(date) : k < zodiac + 0.2 ? 'large-star-fragment' : 'star-fragment';
    // the beach in MAX_FRAGMENTS stretches, taken in a seeded order: one fragment to a stretch (tried first), each
    // BEACH_GAP clear of the ones before it where the sand has room
    const slot = slots[i % slots.length];
    const first = BEACH.x0 + ((slot + 0.35 + r() * 0.3) / FRAGMENT_SLOTS) * (BEACH.x1 - BEACH.x0);
    out.push({ uid: `g${i}`, id, ...beachSpot(r, out, { first }) });
  }
  return out;
}
/** The beach's stretches for fragments (stars.ts MAX_FRAGMENTS), in the day's order. */
const FRAGMENT_SLOTS = 8;
const SLOTS = (date: string, seed: string): number[] => {
  const r = dayRand(date, 'fragment-slots', seed);
  const s = Array.from({ length: FRAGMENT_SLOTS }, (_, i) => i);
  shuffle(s, r);
  return s;
};

/** The official icon of a beach item (static/art/finds/, fetched by scripts/fetch-assets.ts). */
export const findArt = (id: string): string => `finds/${id}`;
