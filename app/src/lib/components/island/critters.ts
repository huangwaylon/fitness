// The island's critters (docs/design.md "Scene interactions"): which fish and bugs come (any month: NH's
// northern-hemisphere months only weight the odds; hours keep day bugs to the day and night ones to the night), when the
// next one shows up, and how a fishing bite and a net swing turn out. Pure (no DOM, no
// timers): Critters.svelte owns the motion and the timers and asks this module what happens. Nothing here counts for
// anything: a catch is a caption and an icon, never ベル or a write.

/** NH months (1–12) a critter is about, and its hours [from, to) in Tokyo time (to < from wraps past midnight). */
interface Seasonal {
  months: readonly number[];
  hours: readonly [number, number];
  /** Relative odds among the critters about at that moment. */
  weight: number;
}

const ALL_YEAR = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const ALL_DAY = [0, 24] as const;
const span = (a: number, b: number): number[] => (a <= b ? range(a, b) : [...range(a, 12), ...range(1, b)]);
const range = (a: number, b: number): number[] => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export type FishId =
  | 'sea-bass' | 'horse-mackerel' | 'olive-flounder' | 'red-snapper' | 'dab' | 'squid' | 'sea-butterfly'
  | 'puffer-fish' | 'barred-knifejaw' | 'anchovy';
export type JunkId = 'boot' | 'old-tire' | 'empty-can';

interface Fish extends Seasonal {
  /** NH's shadow size, 1 (tiny) – 6 (huge). */
  size: number;
}

/** The sea fish you can catch from a beach in NH (northern hemisphere), with their shadow sizes. The sea bass is the
 *  famous one: all year, all day, and by far the most common. */
export const FISH: Record<FishId, Fish> = {
  'sea-bass': { months: ALL_YEAR, hours: ALL_DAY, size: 5, weight: 10 },
  'horse-mackerel': { months: ALL_YEAR, hours: ALL_DAY, size: 2, weight: 4 },
  'olive-flounder': { months: ALL_YEAR, hours: ALL_DAY, size: 5, weight: 2 },
  'red-snapper': { months: ALL_YEAR, hours: ALL_DAY, size: 4, weight: 1 },
  anchovy: { months: ALL_YEAR, hours: [4, 21], size: 2, weight: 3 },
  dab: { months: span(10, 4), hours: ALL_DAY, size: 3, weight: 3 },
  squid: { months: span(12, 8), hours: ALL_DAY, size: 3, weight: 2 },
  'sea-butterfly': { months: span(12, 3), hours: ALL_DAY, size: 1, weight: 2 },
  'puffer-fish': { months: span(11, 2), hours: ALL_DAY, size: 3, weight: 1 },
  'barred-knifejaw': { months: span(3, 11), hours: ALL_DAY, size: 3, weight: 1 }
};
/** NH's junk: now and then the line brings up a boot, a tire or a can instead (1 in JUNK_ODDS). */
export const JUNK: readonly JunkId[] = ['boot', 'old-tire', 'empty-can'];
const JUNK_ODDS = 14;

export type BugId =
  | 'common-butterfly' | 'yellow-butterfly' | 'tiger-butterfly' | 'peacock-butterfly' | 'emperor-butterfly' | 'honeybee'
  | 'ladybug' | 'darner-dragonfly' | 'banded-dragonfly' | 'red-dragonfly' | 'robust-cicada' | 'evening-cicada' | 'firefly'
  | 'rice-grasshopper' | 'grasshopper' | 'migratory-locust' | 'mantis' | 'orchid-mantis' | 'bell-cricket' | 'cricket'
  | 'moth';

/** How a bug moves: a butterfly (or a bee, a moth) flutters about the flowers, a dragonfly darts and hovers over the
 *  lawn, a firefly drifts and blinks, a grasshopper, a cricket or a mantis hops in the grass, a cicada flies in to a
 *  tree's trunk and perches there, singing. */
export type Flight = 'flutter' | 'dart' | 'drift' | 'hop' | 'perch';

interface Bug extends Seasonal {
  flight: Flight;
  /** A second span of hours (NH's evening cicada: dawn and dusk). */
  also?: readonly [number, number];
}

/** NH bugs that suit this island (no wasps, nothing that chases, nothing tropical in winter): months and hours as in
 *  NH's northern hemisphere (Nookipedia). Spring: the butterflies, the honeybee, the ladybug, the peacock butterfly;
 *  summer: the emperor butterfly at dusk, the dragonflies, the cicadas on the trunks, fireflies at night; autumn: the
 *  red dragonfly, the grasshoppers and the locust, the crickets in the evening, the mantises; winter: the common
 *  butterfly by day, moths at night. Deviations from NH: fireflies follow the island's own summer nights (NH: June
 *  only); the emperor butterfly keeps to summer (NH: also Dec–Mar). NH has no pine cricket (its コオロギ is `cricket`). */
export const BUGS: Record<BugId, Bug> = {
  'common-butterfly': { months: span(9, 6), hours: [4, 19], flight: 'flutter', weight: 4 },
  'yellow-butterfly': { months: [3, 4, 5, 6, 9, 10], hours: [4, 19], flight: 'flutter', weight: 2 },
  'tiger-butterfly': { months: span(3, 9), hours: [4, 19], flight: 'flutter', weight: 2 },
  'peacock-butterfly': { months: [3, 4, 5, 6], hours: [4, 19], flight: 'flutter', weight: 1 },
  'emperor-butterfly': { months: [6, 7, 8, 9], hours: [17, 8], flight: 'flutter', weight: 1 },
  honeybee: { months: [3, 4, 5, 6, 7], hours: [8, 17], flight: 'flutter', weight: 2 },
  ladybug: { months: [3, 4, 5, 6, 10], hours: [8, 17], flight: 'flutter', weight: 1 },
  'darner-dragonfly': { months: span(4, 10), hours: [8, 17], flight: 'dart', weight: 2 },
  'banded-dragonfly': { months: span(5, 10), hours: [8, 17], flight: 'dart', weight: 1 },
  'red-dragonfly': { months: [9, 10], hours: [8, 19], flight: 'dart', weight: 3 },
  'robust-cicada': { months: [7, 8], hours: [8, 17], flight: 'perch', weight: 3 },
  'evening-cicada': { months: [7, 8], hours: [4, 8], also: [16, 19], flight: 'perch', weight: 3 },
  firefly: { months: [6, 7, 8], hours: [19, 4], flight: 'drift', weight: 5 },
  'rice-grasshopper': { months: [8, 9, 10, 11], hours: [8, 19], flight: 'hop', weight: 2 },
  grasshopper: { months: [7, 8, 9], hours: [8, 17], flight: 'hop', weight: 2 },
  'migratory-locust': { months: [8, 9, 10, 11], hours: [8, 19], flight: 'hop', weight: 1 },
  mantis: { months: span(3, 11), hours: [8, 17], flight: 'hop', weight: 1 },
  'orchid-mantis': { months: span(3, 11), hours: [8, 17], flight: 'hop', weight: 1 },
  'bell-cricket': { months: [9, 10], hours: [17, 8], flight: 'hop', weight: 2 },
  cricket: { months: [9, 10, 11], hours: [17, 8], flight: 'hop', weight: 2 },
  moth: { months: ALL_YEAR, hours: [19, 4], flight: 'flutter', weight: 1 }
};

/** Inside [from, to) of the day, wrapping past midnight when to < from. */
export function inHours([from, to]: readonly [number, number], h: number): boolean {
  return from <= to ? h >= from && h < to : h >= from || h < to;
}
/** Odds for a critter in its NH months against out of them: the season is a flavour, never a gate (user). */
export const IN_SEASON = 3;
const inHoursOf = (c: Seasonal & { also?: readonly [number, number] }, hour: number) => inHours(c.hours, hour) || (!!c.also && inHours(c.also, hour));
/** Its odds at (month, hour): 0 outside its hours, else its weight, ×IN_SEASON in its months. */
export const oddsAt = (c: Seasonal & { also?: readonly [number, number] }, month: number, hour: number): number =>
  !inHoursOf(c, hour) ? 0 : c.weight * (c.months.includes(month) ? IN_SEASON : 1);

/** A weighted pick among the ids that can come at (month, hour), or null. `r` is a uniform [0, 1) source. */
function pick<K extends string>(table: Record<K, Seasonal>, month: number, hour: number, r: () => number): K | null {
  const live = (Object.keys(table) as K[]).map((k) => [k, oddsAt(table[k], month, hour)] as const).filter(([, w]) => w > 0);
  const total = live.reduce((s, [, w]) => s + w, 0);
  if (!total) return null;
  let x = r() * total;
  for (const [k, w] of live) if ((x -= w) < 0) return k;
  return live[live.length - 1][0];
}

/** The fish under a new shadow (always someone: the sea bass never takes a day off). */
export const pickFish = (month: number, hour: number, r: () => number): FishId => pick(FISH, month, hour, r) ?? 'sea-bass';

/** What the line brings up from a `fish` shadow: the fish, or 1 in JUNK_ODDS a piece of junk. */
export function hookItem(fish: FishId, r: () => number): FishId | JunkId {
  return r() * JUNK_ODDS < 1 ? JUNK[Math.floor(r() * JUNK.length)] : fish;
}

/** An ambient bug for (month, hour), or null when nobody is about (with the moths out every night, never in NH's table). */
export const pickBug = (month: number, hour: number, r: () => number): BugId | null => pick(BUGS, month, hour, r);

/** What flies out of a shaken bush: 1 in 3 a bug (a moth after dark, else a butterfly, 1 in 4 a ladybug by day), or
 *  nothing. */
export function bushBug(month: number, hour: number, r: () => number): BugId | null {
  if (r() * 3 >= 1) return null;
  if (oddsAt(BUGS.moth, month, hour) > 0) return 'moth';
  if (oddsAt(BUGS.ladybug, month, hour) > 0 && r() < 0.25) return 'ladybug';
  const flutter = (Object.keys(BUGS) as BugId[]).filter((k) => k.endsWith('-butterfly') && oddsAt(BUGS[k], month, hour) > 0);
  return flutter.length ? flutter[Math.floor(r() * flutter.length)] : null;
}

// ---------- timing ----------

/** Visible time until the next ambient visit: 3–6 s for the first, then 8–15 s, so a fish is basically always there
 *  (back a few seconds after a catch or a flee) and a bug comes by every so often (user: frequent, it's for fun). */
export const nextSpawnMs = (r: () => number, first = false): number => (first ? 3_000 + r() * 3_000 : 8_000 + r() * 7_000);

/** Which ambient critter to bring on (≤ 1 of each, so ≤ 2 animating at once): a fish whenever the sea is empty,
 *  otherwise a bug when none is about (most visits; `r` keeps a little air between them). */
export function spawnKind(slots: { fish: boolean; bug: boolean }, bugAbout: boolean, r: () => number): 'fish' | 'bug' | null {
  if (!slots.fish) return 'fish';
  return !slots.bug && bugAbout && r() < 0.8 ? 'bug' : null;
}

/** How long an ambient critter stays if nobody plays with it (ms). */
export const STAY_MS = { fish: 45_000, bug: 18_000 } as const;

// ---------- fishing ----------

/** A cast's story, NH-style: the shadow notices the bobber and swims up to it, nibbles it a few times (each a little
 *  bob), then bites (the bobber is pulled under: the moment to reel). All in ms from the bobber landing. */
export interface BitePlan {
  /** The shadow reaches the bobber. */
  arrive: number;
  /** Each nibble (a little bob). */
  nibbles: number[];
  /** The bite: the bobber goes under. */
  bite: number;
  /** Reel within this long after the bite, or it gets away. */
  window: number;
}

/** The bite window (ms): NH's is about half a second with a controller; a phone tap, reacting to the 「！」, gets
 *  longer (a human sees it, decides and taps in ~0.4–0.8 s). */
export const BITE_WINDOW_MS = 1600;
/** A tap in the sea this close to a shadow (stage units) casts a bobber (1.5× the old 130u)... */
export const CAST_U = 195;
/** ...and the shadow notices a bobber this close, so every cast it allows is noticed (the bobber lands a little nearer
 *  the beach than the tap, now and then). */
export const NOTICE_U = 210;

/** A slow, curious swim up to the bobber `distU` away, 0–3 nibbles (or `minNibbles`+), then the bite, all from `from`. */
function story(from: number, distU: number, r: () => number, minNibbles = 0): BitePlan {
  const arrive = from + 500 + Math.min(distU, NOTICE_U) * 8 + r() * 500;
  const n = minNibbles + Math.floor(r() * (4 - minNibbles)); // up to 3 nibbles
  const nibbles: number[] = [];
  let at = arrive + 400 + r() * 500;
  for (let i = 0; i < n; i++) {
    nibbles.push(Math.round(at));
    at += 700 + r() * 600;
  }
  return { arrive: Math.round(arrive), nibbles, bite: Math.round(at), window: BITE_WINDOW_MS };
}

export const bitePlan = (distU: number, r: () => number): BitePlan => story(0, distU, r);

/** The fish hesitates (a first tap before the bite, `ms` after the bobber landed): it backs off HESITATE_U, then
 *  comes back from there and nibbles (at least once) before it bites, later. */
export const HESITATE_U = 16;
export const HESITATE_MS = 700;
export const hesitatePlan = (ms: number, r: () => number): BitePlan => story(ms + HESITATE_MS, HESITATE_U, r, 1);

/** Where a cast stands when the player taps again. */
export type CastPhase = 'waiting' | 'approach' | 'nibble' | 'bite' | 'late';

/** The phase of a cast `ms` after the bobber landed (a shadow that never noticed it stays 'waiting'). */
export function castPhase(plan: BitePlan | null, ms: number): CastPhase {
  if (!plan) return 'waiting';
  if (ms < plan.arrive) return 'approach';
  if (ms < plan.bite) return 'nibble';
  return ms < plan.bite + plan.window ? 'bite' : 'late';
}

/** A tap while the bobber is out (NH's A button): reel in on the bite to catch it. A first tap any earlier only makes
 *  the fish hesitate (it backs off and comes back); a second early tap (or one too late) and it's spooked and gone.
 *  With no fish interested it just reels the line back in. */
export function reel(phase: CastPhase, hesitated = false): 'catch' | 'hesitate' | 'flee' | 'reel' {
  if (phase === 'bite') return 'catch';
  if (phase === 'waiting') return 'reel';
  return phase !== 'late' && !hesitated ? 'hesitate' : 'flee';
}

// ---------- the net ----------

/** A tap near a bug (px from its centre): on it (a 44px target at least) it's caught; close by, it's startled and
 *  flies off; further away it doesn't care. */
export function netSwing(distPx: number, sizePx: number): 'catch' | 'startle' | 'none' {
  if (distPx <= Math.max(26, sizePx * 0.75)) return 'catch';
  return distPx <= 80 ? 'startle' : 'none';
}

// ---------- captions ----------

/** The catch caption: NH's 「〇〇を つりあげた！」 / 「〇〇を つかまえた！」, the sea bass's famous joke, or the junk's
 *  letdown. Returns an i18n key and its params (the name is looked up by the caller under critter.name.<id>). */
export function caption(item: FishId | JunkId | BugId): { key: string; name?: string } {
  if (item === 'sea-bass') return { key: 'critter.seaBass' };
  if ((JUNK as readonly string[]).includes(item)) return { key: `critter.junk.${item}` };
  return { key: item in FISH ? 'critter.caughtFish' : 'critter.caughtBug', name: `critter.name.${item}` };
}

/** The official icon of a catch (static/art/critters/, fetched by scripts/fetch-assets.ts). */
export const critterArt = (item: FishId | JunkId | BugId): string => `critters/${item}`;
