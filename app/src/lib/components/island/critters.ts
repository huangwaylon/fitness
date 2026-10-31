// The island's critters (docs/design.md "Scene interactions"): which fish and bugs come (any month: NH's
// northern-hemisphere months only weight the odds; hours keep day bugs to the day and night ones to the night), when the
// next one shows up, and how a fishing bite and a net swing turn out. Pure (no DOM, no
// timers): Critters.svelte owns the motion and the timers and asks this module what happens. Nothing here counts for
// anything: a catch is a caption and an icon, never ベル or a write.

import type { SeaId } from './sea.ts';
import type { Sky } from './weather.ts';

/** NH months (1–12) a critter is about, and its hours [from, to) in Tokyo time (to < from wraps past midnight). */
export interface Seasonal {
  months: readonly number[];
  hours: readonly [number, number];
  /** Relative odds among the critters about at that moment. */
  weight: number;
  /** A second span of hours (NH's evening cicada: dawn and dusk; the piranha: midday and midnight). */
  also?: readonly [number, number];
  /** NH's weather (island/weather.ts): `dry` never in the rain (most butterflies, moths, dragonflies, grasshoppers…),
   *  `rain` only while it rains (the snail), `wet` only in rain or snow (the coelacanth). Snow isn't rain. */
  weather?: 'dry' | 'rain' | 'wet';
}

export const ALL_YEAR = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export const ALL_DAY = [0, 24] as const;
export const span = (a: number, b: number): number[] => (a <= b ? range(a, b) : [...range(a, 12), ...range(1, b)]);
const range = (a: number, b: number): number[] => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export type FishId =
  | 'sea-bass' | 'horse-mackerel' | 'olive-flounder' | 'red-snapper' | 'dab' | 'squid' | 'sea-butterfly'
  | 'blowfish' | 'puffer-fish' | 'barred-knifejaw' | 'anchovy' | 'zebra-turkeyfish' | 'ribbon-eel' | 'football-fish' | 'clownfish'
  | 'surgeonfish' | 'butterfly-fish' | 'sea-horse' | 'moray-eel' | 'napoleonfish' | 'ray' | 'ocean-sunfish' | 'mahi-mahi'
  | 'giant-trevally' | 'tuna' | 'blue-marlin' | 'suckerfish' | 'oarfish' | 'saw-shark' | 'hammerhead-shark'
  | 'great-white-shark' | 'whale-shark' | 'barreleye' | 'coelacanth';
export type JunkId = 'boot' | 'old-tire' | 'empty-can';
/** Anything the rod or the net brings up: a sea fish, a pond fish (pondFish.ts, its own chunk), junk or a bug. */
export type Catch = FishId | PondFishId | JunkId | BugId | SeaId;
/** The pond's fish (their table, pondFish.ts, is its own chunk; the ids are all the island needs up front). */
const POND_FISH_IDS = [
  'bitterling', 'pale-chub', 'crucian-carp', 'dace', 'carp', 'koi', 'goldfish', 'pop-eyed-goldfish', 'ranchu-goldfish',
  'killifish', 'crawfish', 'soft-shelled-turtle', 'snapping-turtle', 'tadpole', 'frog', 'freshwater-goby', 'loach',
  'catfish', 'giant-snakehead', 'bluegill', 'yellow-perch', 'black-bass', 'tilapia', 'pike', 'pond-smelt', 'sweetfish',
  'cherry-salmon', 'char', 'golden-trout', 'stringfish', 'salmon', 'king-salmon', 'mitten-crab', 'guppy', 'nibble-fish',
  'angelfish', 'betta', 'neon-tetra', 'rainbowfish', 'piranha', 'arowana', 'dorado', 'gar', 'arapaima', 'saddled-bichir',
  'sturgeon'
] as const;
export type PondFishId = (typeof POND_FISH_IDS)[number];
const POND_IDS: ReadonlySet<string> = new Set(POND_FISH_IDS);

export interface Fish extends Seasonal {
  /** NH's shadow size, 1 (tiny) – 6 (huge). */
  size: number;
  /** NH's two odd shadows: a long thin one (the eels) and one with a fin cutting the surface (the sharks, the sunfish,
   *  the suckerfish). */
  shape?: 'narrow' | 'fin';
}

/** The sea fish you can catch from a beach or a pier in NH (northern hemisphere; Nookipedia), with their shadow sizes
 *  and shapes. Months and hours only weight the odds (`oddsAt`); a low weight is a rare fish. The sea bass is the famous
 *  one: all year, all day, and by far the most common (every other weight × IN_SEASON stays under its 10). Deviations
 *  from NH: the pier fish (mahi-mahi, giant trevally, tuna, blue marlin) come to the beach, the island has no pier. The
 *  coelacanth comes only in rain or snow, as in NH. */
export const FISH: Record<FishId, Fish> = {
  'sea-bass': { months: ALL_YEAR, hours: ALL_DAY, size: 5, weight: 10 },
  'horse-mackerel': { months: ALL_YEAR, hours: ALL_DAY, size: 2, weight: 4 },
  'olive-flounder': { months: ALL_YEAR, hours: ALL_DAY, size: 5, weight: 2 },
  'red-snapper': { months: ALL_YEAR, hours: ALL_DAY, size: 4, weight: 1 },
  anchovy: { months: ALL_YEAR, hours: [4, 21], size: 2, weight: 3 },
  dab: { months: span(10, 4), hours: ALL_DAY, size: 3, weight: 3 },
  squid: { months: span(12, 8), hours: ALL_DAY, size: 3, weight: 2 },
  'sea-butterfly': { months: span(12, 3), hours: ALL_DAY, size: 1, weight: 2 },
  blowfish: { months: span(11, 2), hours: [21, 4], size: 3, weight: 1 },
  'puffer-fish': { months: span(7, 9), hours: ALL_DAY, size: 3, weight: 1 },
  'barred-knifejaw': { months: span(3, 11), hours: ALL_DAY, size: 3, weight: 1 },
  // the reef fish of spring and summer
  'zebra-turkeyfish': { months: span(4, 11), hours: ALL_DAY, size: 3, weight: 2 },
  clownfish: { months: span(4, 9), hours: ALL_DAY, size: 1, weight: 2 },
  surgeonfish: { months: span(4, 9), hours: ALL_DAY, size: 2, weight: 2 },
  'butterfly-fish': { months: span(4, 9), hours: ALL_DAY, size: 2, weight: 2 },
  'sea-horse': { months: span(4, 11), hours: ALL_DAY, size: 1, weight: 2 },
  'ribbon-eel': { months: span(6, 10), hours: ALL_DAY, size: 3, shape: 'narrow', weight: 1 },
  'moray-eel': { months: span(8, 10), hours: ALL_DAY, size: 3, shape: 'narrow', weight: 1 },
  // the big ones
  'football-fish': { months: span(11, 3), hours: [16, 9], size: 4, weight: 1 },
  ray: { months: span(8, 11), hours: [4, 21], size: 5, weight: 1 },
  'mahi-mahi': { months: span(5, 10), hours: ALL_DAY, size: 5, weight: 1 },
  'giant-trevally': { months: span(5, 10), hours: ALL_DAY, size: 5, weight: 1 },
  suckerfish: { months: span(6, 9), hours: ALL_DAY, size: 4, shape: 'fin', weight: 1 },
  napoleonfish: { months: [7, 8], hours: [4, 21], size: 6, weight: 0.5 },
  'ocean-sunfish': { months: span(7, 9), hours: [4, 21], size: 6, shape: 'fin', weight: 0.5 },
  tuna: { months: span(11, 4), hours: ALL_DAY, size: 6, weight: 0.5 },
  'blue-marlin': { months: [...span(7, 9), ...span(11, 4)], hours: ALL_DAY, size: 6, weight: 0.5 },
  oarfish: { months: span(12, 5), hours: ALL_DAY, size: 6, weight: 0.5 },
  barreleye: { months: ALL_YEAR, hours: [21, 4], size: 2, weight: 0.5 },
  // the sharks: summer, mostly after dark; rare
  'saw-shark': { months: span(6, 9), hours: [16, 9], size: 6, shape: 'fin', weight: 0.4 },
  'hammerhead-shark': { months: span(6, 9), hours: [16, 9], size: 6, shape: 'fin', weight: 0.4 },
  'great-white-shark': { months: span(6, 9), hours: [16, 9], size: 6, shape: 'fin', weight: 0.3 },
  'whale-shark': { months: span(6, 9), hours: ALL_DAY, size: 6, shape: 'fin', weight: 0.3 },
  coelacanth: { months: ALL_YEAR, hours: ALL_DAY, size: 6, weight: 0.3, weather: 'wet' }
};
/** NH's junk: now and then the line brings up a boot, a tire or a can instead (1 in JUNK_ODDS). */
export const JUNK: readonly JunkId[] = ['boot', 'old-tire', 'empty-can'];
const JUNK_ODDS = 14;

export type BugId =
  | 'common-butterfly' | 'yellow-butterfly' | 'tiger-butterfly' | 'peacock-butterfly' | 'emperor-butterfly' | 'honeybee'
  | 'ladybug' | 'darner-dragonfly' | 'banded-dragonfly' | 'red-dragonfly' | 'robust-cicada' | 'evening-cicada' | 'firefly'
  | 'rice-grasshopper' | 'grasshopper' | 'migratory-locust' | 'mantis' | 'orchid-mantis' | 'bell-cricket' | 'cricket'
  | 'moth' | 'walker-cicada' | 'brown-cicada' | 'giant-cicada' | 'cicada-shell' | 'saw-stag' | 'miyama-stag' | 'giant-stag'
  | 'rainbow-stag' | 'horned-dynastid' | 'goliath-beetle' | 'drone-beetle' | 'jewel-beetle' | 'walking-stick' | 'hermit-crab'
  | 'wharf-roach' | 'pill-bug' | 'centipede' | 'snail' | 'paper-kite-butterfly' | 'agrias-butterfly'
  | 'queen-alexandras-birdwing' | 'rajah-brookes-birdwing' | 'monarch-butterfly' | 'atlas-moth' | 'damselfly' | 'long-locust'
  | 'wasp' | 'common-bluebottle' | 'great-purple-emperor' | 'madagascan-sunset-moth' | 'mosquito' | 'stinkbug'
  | 'man-faced-stink-bug' | 'tiger-beetle' | 'earth-boring-dung-beetle' | 'walking-leaf' | 'violin-beetle'
  | 'citrus-long-horned-beetle' | 'rosalia-batesi-beetle' | 'scarab-beetle' | 'mole-cricket' | 'tarantula' | 'scorpion'
  | 'flea' | 'bagworm' | 'spider' | 'pondskater' | 'diving-beetle' | 'giant-water-bug';

/** How a bug moves: a butterfly (or a bee, a moth) flutters about the flowers (a butterfly lands on one now and then), a
 *  dragonfly darts and hovers over the lawn, a few fireflies drift and blink, a ladybug or a mantis sits on a flower's
 *  head (NH's flower bugs), a grasshopper or a cricket hops in the grass, a cicada or a beetle flies
 *  in to a tree's trunk and perches there, and a crab, a pill bug or a snail crawls along the beach, the grass or a bed.
 *  A tarantula or a scorpion stalks the grass at night (it rears up when it's come at: `stalkTap`), a mole cricket
 *  chirps under a little mound of earth (dug up with a tap), and a bagworm or a spider dangles on its thread from a
 *  shaken tree (TreeShakes.svelte). */
export type Flight = 'flutter' | 'dart' | 'drift' | 'flower' | 'hop' | 'perch' | 'crawl' | 'stalk' | 'burrow' | 'dangle';
/** Where a crawler keeps to: the front beach (NH's beach and rocks), the grass, the flower beds, the pond's water. */
type Ground = 'beach' | 'grass' | 'beds' | 'pond';

interface Bug extends Seasonal {
  flight: Flight;
  /** A crawler's ground. */
  ground?: Ground;
}

/** NH bugs that suit this island (no wasps about, only from a shaken nest): months and hours as in
 *  NH's northern hemisphere (Nookipedia). Spring: the butterflies, the honeybee, the ladybug, the peacock butterfly;
 *  summer: the emperor butterfly at dusk, the dragonflies, the cicadas on the trunks, fireflies at night; autumn: the
 *  red dragonfly, the grasshoppers and the locust, the crickets in the evening, the mantises; winter: the common
 *  butterfly by day, moths at night. Deviations from NH: fireflies follow the island's own summer nights (NH: June
 *  only); the emperor butterfly keeps to summer (NH: also Dec–Mar). NH has no pine cricket (its コオロギ is `cricket`). */
export const BUGS: Record<BugId, Bug> = {
  'common-butterfly': { months: span(9, 6), hours: [4, 19], flight: 'flutter', weight: 4, weather: 'dry' },
  'yellow-butterfly': { months: [3, 4, 5, 6, 9, 10], hours: [4, 19], flight: 'flutter', weight: 2, weather: 'dry' },
  'tiger-butterfly': { months: span(3, 9), hours: [4, 19], flight: 'flutter', weight: 2, weather: 'dry' },
  'peacock-butterfly': { months: [3, 4, 5, 6], hours: [4, 19], flight: 'flutter', weight: 1, weather: 'dry' },
  'emperor-butterfly': { months: [6, 7, 8, 9], hours: [17, 8], flight: 'flutter', weight: 1, weather: 'dry' },
  honeybee: { months: [3, 4, 5, 6, 7], hours: [8, 17], flight: 'flutter', weight: 2, weather: 'dry' },
  ladybug: { months: [3, 4, 5, 6, 10], hours: [8, 17], flight: 'flower', weight: 1, weather: 'dry' },
  'darner-dragonfly': { months: span(4, 10), hours: [8, 17], flight: 'dart', weight: 2, weather: 'dry' },
  'banded-dragonfly': { months: span(5, 10), hours: [8, 17], flight: 'dart', weight: 1, weather: 'dry' },
  'red-dragonfly': { months: [9, 10], hours: [8, 19], flight: 'dart', weight: 3, weather: 'dry' },
  'robust-cicada': { months: [7, 8], hours: [8, 17], flight: 'perch', weight: 3 },
  'evening-cicada': { months: [7, 8], hours: [4, 8], also: [16, 19], flight: 'perch', weight: 3 },
  firefly: { months: [6, 7, 8], hours: [19, 4], flight: 'drift', weight: 5, weather: 'dry' },
  'rice-grasshopper': { months: [8, 9, 10, 11], hours: [8, 19], flight: 'hop', weight: 2 },
  grasshopper: { months: [7, 8, 9], hours: [8, 17], flight: 'hop', weight: 2, weather: 'dry' },
  'migratory-locust': { months: [8, 9, 10, 11], hours: [8, 19], flight: 'hop', weight: 1 },
  mantis: { months: span(3, 11), hours: [8, 17], flight: 'flower', weight: 1, weather: 'dry' },
  'orchid-mantis': { months: span(3, 11), hours: [8, 17], flight: 'flower', weight: 1, weather: 'dry' },
  'bell-cricket': { months: [9, 10], hours: [17, 8], flight: 'hop', weight: 2, weather: 'dry' },
  cricket: { months: [9, 10, 11], hours: [17, 8], flight: 'hop', weight: 2, weather: 'dry' },
  moth: { months: ALL_YEAR, hours: [19, 4], flight: 'flutter', weight: 1, weather: 'dry' },
  // on the trees: the rest of the cicadas (and a shell left on a trunk), the beetles (NH's stumps are trunks here), the
  // walking stick at dawn and dusk; the big beetles come out at night
  'walker-cicada': { months: [8, 9], hours: [8, 17], flight: 'perch', weight: 3 },
  'brown-cicada': { months: [7, 8], hours: [8, 17], flight: 'perch', weight: 3 },
  'giant-cicada': { months: [7, 8], hours: [8, 17], flight: 'perch', weight: 2 },
  'cicada-shell': { months: [7, 8], hours: ALL_DAY, flight: 'perch', weight: 1 },
  'saw-stag': { months: [7, 8], hours: ALL_DAY, flight: 'perch', weight: 1.5 },
  'miyama-stag': { months: [7, 8], hours: ALL_DAY, flight: 'perch', weight: 1.5 },
  'giant-stag': { months: [7, 8], hours: [23, 8], flight: 'perch', weight: 1 },
  'rainbow-stag': { months: span(6, 9), hours: [19, 8], flight: 'perch', weight: 0.7 },
  'horned-dynastid': { months: [7, 8], hours: [17, 8], flight: 'perch', weight: 1 },
  'goliath-beetle': { months: span(6, 9), hours: [17, 8], flight: 'perch', weight: 0.5 },
  'drone-beetle': { months: span(6, 8), hours: ALL_DAY, flight: 'perch', weight: 1 },
  'jewel-beetle': { months: span(4, 8), hours: ALL_DAY, flight: 'perch', weight: 0.7, weather: 'dry' },
  'walking-stick': { months: span(7, 11), hours: [4, 8], also: [17, 19], flight: 'perch', weight: 1 },
  // on the beach and in the grass: the hermit crab after dark, the wharf roach on the rocks, the pill bug and the
  // centipede (NH: under rocks), the snail on the flowers (only in the rain, as in NH)
  'hermit-crab': { months: ALL_YEAR, hours: [19, 8], flight: 'crawl', ground: 'beach', weight: 2 },
  'wharf-roach': { months: ALL_YEAR, hours: ALL_DAY, flight: 'crawl', ground: 'beach', weight: 1.5 },
  'pill-bug': { months: span(9, 6), hours: [23, 16], flight: 'crawl', ground: 'grass', weight: 1.5 },
  centipede: { months: span(9, 6), hours: [16, 23], flight: 'crawl', ground: 'grass', weight: 1 },
  snail: { months: ALL_YEAR, hours: ALL_DAY, flight: 'crawl', ground: 'beds', weight: 3, weather: 'rain' },
  // flying: the big tropical butterflies (rare), the monarch in autumn, the Atlas moth at night, the damselfly in
  // winter, the long locust
  'paper-kite-butterfly': { months: ALL_YEAR, hours: [8, 19], flight: 'flutter', weight: 2, weather: 'dry' },
  'agrias-butterfly': { months: span(4, 9), hours: [8, 17], flight: 'flutter', weight: 1, weather: 'dry' },
  'queen-alexandras-birdwing': { months: span(5, 9), hours: [8, 16], flight: 'flutter', weight: 0.5, weather: 'dry' },
  'rajah-brookes-birdwing': { months: [...span(4, 9), 12, 1, 2], hours: [8, 17], flight: 'flutter', weight: 0.7, weather: 'dry' },
  'monarch-butterfly': { months: span(9, 11), hours: [4, 17], flight: 'flutter', weight: 2, weather: 'dry' },
  'atlas-moth': { months: span(4, 9), hours: [19, 4], flight: 'flutter', weight: 0.7 },
  damselfly: { months: span(11, 2), hours: ALL_DAY, flight: 'dart', weight: 2, weather: 'dry' },
  'long-locust': { months: span(4, 11), hours: [8, 19], flight: 'hop', weight: 2 },
  // never about on its own (weight 0): only out of a nest shaken from a tree (island/treeShake.ts), netted in time
  wasp: { months: ALL_YEAR, hours: ALL_DAY, flight: 'flutter', weight: 0 },
  // on the pond's water (Pond.svelte; NH: on rivers and ponds): the pondskater skating, the diving beetle surfacing, the
  // giant water bug at night
  pondskater: { months: span(5, 9), hours: [8, 19], flight: 'crawl', ground: 'pond', weight: 2 },
  'diving-beetle': { months: span(5, 9), hours: [8, 19], flight: 'crawl', ground: 'pond', weight: 1.5 },
  'giant-water-bug': { months: span(4, 9), hours: [19, 8], flight: 'crawl', ground: 'pond', weight: 1 },
  // the rest of NH's bugs that this island can hold. Flying: the bluebottle, the great purple emperor and the
  // Madagascan sunset moth by day, the mosquito on summer evenings
  'common-bluebottle': { months: span(4, 8), hours: [4, 19], flight: 'flutter', weight: 3, weather: 'dry' },
  'great-purple-emperor': { months: span(5, 8), hours: [4, 19], flight: 'flutter', weight: 0.7, weather: 'dry' },
  'madagascan-sunset-moth': { months: span(4, 9), hours: [8, 16], flight: 'flutter', weight: 0.7, weather: 'dry' },
  mosquito: { months: span(6, 9), hours: [17, 4], flight: 'flutter', weight: 2, weather: 'dry' },
  // on the flowers: the stink bugs (the man-faced one at night)
  stinkbug: { months: span(3, 10), hours: ALL_DAY, flight: 'crawl', ground: 'beds', weight: 2, weather: 'dry' },
  'man-faced-stink-bug': { months: span(3, 10), hours: [19, 8], flight: 'crawl', ground: 'beds', weight: 1.2, weather: 'dry' },
  // on the ground: the tiger beetle (it runs), the earth-boring dung beetle, the walking leaf (NH: a leaf under the
  // trees, here in the grass)
  'tiger-beetle': { months: span(2, 10), hours: ALL_DAY, flight: 'crawl', ground: 'grass', weight: 1, weather: 'dry' },
  'earth-boring-dung-beetle': { months: span(7, 9), hours: ALL_DAY, flight: 'crawl', ground: 'grass', weight: 1.5 },
  'walking-leaf': { months: span(7, 9), hours: ALL_DAY, flight: 'crawl', ground: 'grass', weight: 1 },
  // on the trunks: NH's stump beetles (the island has no stumps: a trunk, like the jewel beetle) and the scarab at night
  'violin-beetle': { months: [5, 6, 9, 10, 11], hours: ALL_DAY, flight: 'perch', weight: 1, weather: 'dry' },
  'citrus-long-horned-beetle': { months: ALL_YEAR, hours: ALL_DAY, flight: 'perch', weight: 1, weather: 'dry' },
  'rosalia-batesi-beetle': { months: span(5, 9), hours: ALL_DAY, flight: 'perch', weight: 0.5, weather: 'dry' },
  'scarab-beetle': { months: [7, 8], hours: [23, 8], flight: 'perch', weight: 0.5 },
  // under the lawn: the mole cricket of winter and spring, chirping under a mound of earth
  'mole-cricket': { months: span(11, 5), hours: ALL_DAY, flight: 'burrow', weight: 1.5 },
  // in the grass at night, rare: the tarantula (winter) and the scorpion (summer); come at one and it rears up
  tarantula: { months: span(11, 4), hours: [19, 4], flight: 'stalk', weight: 0.5 },
  scorpion: { months: span(5, 10), hours: [19, 4], flight: 'stalk', weight: 0.5 },
  // never about on their own (weight 0): a flea hops off my villager now and then (`fleaJumps`), a bagworm or (at
  // night) a spider dangles from a shaken tree (island/treeShake.ts)
  flea: { months: span(4, 11), hours: ALL_DAY, flight: 'hop', weight: 0 },
  bagworm: { months: ALL_YEAR, hours: ALL_DAY, flight: 'dangle', weight: 0 },
  spider: { months: ALL_YEAR, hours: [19, 8], flight: 'dangle', weight: 0 }
};

/** Inside [from, to) of the day, wrapping past midnight when to < from. */
export function inHours([from, to]: readonly [number, number], h: number): boolean {
  return from <= to ? h >= from && h < to : h >= from || h < to;
}
/** Odds for a critter in its NH months against out of them: the season is a flavour, never a gate (user). */
export const IN_SEASON = 3;
const inHoursOf = (c: Seasonal, hour: number) => inHours(c.hours, hour) || (!!c.also && inHours(c.also, hour));
/** Whether the weather lets it out (Seasonal `weather`). */
function weatherLets(c: Seasonal, sky: Sky): boolean {
  const rain = sky === 'rain' || sky === 'heavy';
  return c.weather === 'dry' ? !rain : c.weather === 'rain' ? rain : c.weather === 'wet' ? sky !== 'clear' : true;
}
/** Its odds at (month, hour, sky): 0 outside its hours or its weather, else its weight, ×IN_SEASON in its months. */
export const oddsAt = (c: Seasonal, month: number, hour: number, sky: Sky = 'clear'): number =>
  !inHoursOf(c, hour) || !weatherLets(c, sky) ? 0 : c.weight * (c.months.includes(month) ? IN_SEASON : 1);

/** A weighted pick among the ids that can come at (month, hour, sky), or null. `r` is a uniform [0, 1) source. */
export function pick<K extends string>(table: Record<K, Seasonal>, month: number, hour: number, r: () => number, sky: Sky = 'clear'): K | null {
  const live = (Object.keys(table) as K[]).map((k) => [k, oddsAt(table[k], month, hour, sky)] as const).filter(([, w]) => w > 0);
  const total = live.reduce((s, [, w]) => s + w, 0);
  if (!total) return null;
  let x = r() * total;
  for (const [k, w] of live) if ((x -= w) < 0) return k;
  return live[live.length - 1][0];
}

/** The fish under a new shadow (always someone: the sea bass never takes a day off). */
export const pickFish = (month: number, hour: number, r: () => number, sky: Sky = 'clear'): FishId => pick(FISH, month, hour, r, sky) ?? 'sea-bass';

/** What the line brings up from a `fish` shadow: the fish, or 1 in JUNK_ODDS a piece of junk. */
export function hookItem<F extends FishId | PondFishId>(fish: F, r: () => number): F | JunkId {
  return r() * JUNK_ODDS < 1 ? JUNK[Math.floor(r() * JUNK.length)] : fish;
}

/** An ambient bug for (month, hour, sky), or null when nobody is about (with the moths out every night, never in NH's
 *  table; in the rain, fewer: NH's "any except rain" stay away and the snail comes out). */
export const pickBug = (month: number, hour: number, r: () => number, sky: Sky = 'clear'): BugId | null => pick(BUGS, month, hour, r, sky);

/** What flies out of a shaken bush: 1 in 3 a bug (a moth after dark, else a butterfly, 1 in 4 a ladybug by day), or
 *  nothing (in the rain, nothing: they all stay out of it). */
export function bushBug(month: number, hour: number, r: () => number, sky: Sky = 'clear'): BugId | null {
  if (r() * 3 >= 1) return null;
  if (oddsAt(BUGS.moth, month, hour, sky) > 0) return 'moth';
  if (oddsAt(BUGS.ladybug, month, hour, sky) > 0 && r() < 0.25) return 'ladybug';
  const flutter = (Object.keys(BUGS) as BugId[]).filter((k) => k.endsWith('-butterfly') && oddsAt(BUGS[k], month, hour, sky) > 0);
  return flutter.length ? flutter[Math.floor(r() * flutter.length)] : null;
}

/** A tap on my villager: a flea hops off now and then (NH: villagers sometimes have fleas), 1 in FLEA_ODDS, ×IN_SEASON
 *  in its NH months. */
const FLEA_ODDS = 30;
export const fleaJumps = (month: number, r: () => number): boolean => r() * FLEA_ODDS < (BUGS.flea.months.includes(month) ? IN_SEASON : 1);

// ---------- the ground at night: a tarantula, a scorpion ----------

/** Where a tarantula or a scorpion stands with you: just about, reared up (it has noticed you), or settled again. */
export type StalkState = 'calm' | 'rear' | 'settled';
/** How long it stays reared up before it settles (ms). */
export const REAR_MS = 1600;

/** A tap at a tarantula or a scorpion (`swing`: how close, as the net sees it). NH: come at one too fast and it rears up;
 *  keep coming while it does and it charges. Here, gently: the first tap on it or near it makes it rear up; a tap while
 *  it's reared makes it charge (it rushes at you and scuttles off: gone); once it has settled, a tap on it nets it (a
 *  tap only near it makes it rear again). */
export function stalkTap(state: StalkState, swing: 'catch' | 'startle' | 'none'): 'catch' | 'rear' | 'charge' | 'none' {
  if (swing === 'none') return 'none';
  if (state === 'rear') return 'charge';
  return state === 'settled' && swing === 'catch' ? 'catch' : 'rear';
}

// ---------- timing ----------

/** Visible time until the next ambient visit: 3–6 s for the first, then 8–15 s, so a fish is basically always there
 *  (back a few seconds after a catch or a flee) and a bug comes by every so often (user: frequent, it's for fun). */
export const nextSpawnMs = (r: () => number, first = false): number => (first ? 3_000 + r() * 3_000 : 8_000 + r() * 7_000);

/** The share of the sea's turns that bring a bubble spot to dive at instead of a fish shadow (island/sea.ts). */
export const BUBBLE_SHARE = 0.25;
/** Which ambient critter to bring on (≤ 1 in the sea, ≤ 1 in the pond, ≤ 1 bug, so ≤ 3 animating at once): whenever
 *  the sea is empty a fish shadow, or 1 in 4 a bubble spot (the sea holds one or the other); then whenever the pond is
 *  empty a pond shadow (as often as the sea's); otherwise a bug when none is about (most visits; `r` keeps a little air
 *  between them). A slot is true when taken (the pond's too when this screen has none). */
export function spawnKind(slots: { sea: boolean; pond: boolean; bug: boolean }, bugAbout: boolean, r: () => number): 'fish' | 'sea' | 'pond' | 'bug' | null {
  if (!slots.sea) return r() < BUBBLE_SHARE ? 'sea' : 'fish';
  if (!slots.pond) return 'pond';
  return !slots.bug && bugAbout && r() < 0.8 ? 'bug' : null;
}

/** How long an ambient critter stays if nobody plays with it (ms). */
export const STAY_MS = { fish: 45_000, bug: 18_000 } as const;

// ---------- the water: the sea or the pond ----------

/** Where a shadow swims: the sea off the beaches, or the pond at the back of the island. */
export type Water = 'sea' | 'pond';
/** An oval in stage units (the pond's water: its centre and half-axes). */
export interface Oval { cx: number; cy: number; rx: number; ry: number }

/** Inside the oval shrunk to `k` of its size. */
export const inOval = (o: Oval, x: number, y: number, k = 1): boolean => ((x - o.cx) / (o.rx * k)) ** 2 + ((y - o.cy) / (o.ry * k)) ** 2 <= 1;

/** The water a tap at (x, y) u lands in: the pond's oval (grown by `reach`: the pond is small, a finger's slack around
 *  its rim still casts into it), else the sea (`sea`: the tap is off the island, beyond the beach), else none. */
export const waterAt = (pond: Oval | null, x: number, y: number, sea: boolean, reach = 1): Water | null =>
  pond && inOval(pond, x, y, reach) ? 'pond' : sea ? 'sea' : null;
/** How far around the pond's water a tap still casts into it (×, the oval's size). */
export const POND_REACH = 1.6;

/** Where a pond shadow dawdles: the open middle of the water, clear of the rim (a fish's length inside its oval). */
export const pondBox = (o: Oval): { x0: number; x1: number; y0: number; y1: number } =>
  ({ x0: o.cx - o.rx * 0.55, x1: o.cx + o.rx * 0.55, y0: o.cy - o.ry * 0.35, y1: o.cy + o.ry * 0.4 });

/** A shadow's length (u) by NH's size 1 (tiny) – 6 (huge): one teardrop, 0.42 of its length tall; the eels' long thin
 *  one (`narrow`) is 32u at 0.18. */
const SHADOW_U = [14, 18, 23, 28, 34, 46] as const;
export const shadowLen = (size: number, shape?: 'narrow' | 'fin'): number =>
  shape === 'narrow' ? 32 : SHADOW_U[Math.min(6, Math.max(1, Math.round(size))) - 1];
/** A pond shadow is drawn smaller than the sea's (a small pond, seen from further back): NH's sizes 1–6 still read
 *  apart, a size 6 still fits its water. */
export const POND_SHADOW = 0.65;

/** Where the bobber lands for a tap in the pond (kept a little inside the rim) and where the angler stands: on the
 *  pond's front rim, a little toward the island's middle. */
export function pondCast(o: Oval, x: number, y: number): { x: number; y: number; sx: number; sy: number } {
  const d = Math.hypot((x - o.cx) / o.rx, (y - o.cy) / o.ry);
  const k = d > 0.75 ? 0.75 / d : 1;
  const bx = o.cx + (x - o.cx) * k, by = o.cy + (y - o.cy) * k;
  const sx = bx + (bx < 195 ? 1 : -1) * o.rx * 0.25;
  const t = Math.max(-1, Math.min(1, (sx - o.cx) / o.rx));
  return { x: bx, y: by, sx, sy: o.cy + o.ry * Math.sqrt(1 - t * t) + 2 };
}

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
 *  letdown (a sea creature: 「〇〇を とったよ！」). Returns an i18n key and its params (the name is looked up by the caller under critter.name.<id>). */
export function caption(item: Catch): { key: string; name?: string } {
  if (item === 'sea-bass') return { key: 'critter.seaBass' };
  if ((JUNK as readonly string[]).includes(item)) return { key: `critter.junk.${item}` };
  if (!(item in FISH) && !(item in BUGS) && !POND_IDS.has(item)) return { key: 'critter.caughtSea', name: `sea.name.${item}` };
  return { key: item in BUGS ? 'critter.caughtBug' : 'critter.caughtFish', name: `critter.name.${item}` };
}

/** What a rod or a net's catch counts as in the shared ずかん: a fish (the sea's or the pond's), a bug, or nothing (junk;
 *  a sea creature from a dive is the caller's: `sea`). */
export const findKind = (item: FishId | PondFishId | JunkId | BugId): 'fish' | 'bug' | null =>
  (JUNK as readonly string[]).includes(item) ? null : item in BUGS ? 'bug' : 'fish';

/** The official icon of a catch (static/art/critters/, fetched by scripts/fetch-assets.ts; the sea creatures too). */
export const critterArt = (item: Catch): string => `critters/${item}`;
