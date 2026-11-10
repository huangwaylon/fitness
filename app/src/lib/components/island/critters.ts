// The island's critters (docs/design.md "Scene interactions"): which fish and bugs come (any month: NH's
// northern-hemisphere months only weight the odds; hours keep day bugs to the day and night ones to the night), when the
// next one shows up, and how a fishing bite and a net swing turn out. Pure (no DOM, no
// timers): Critters.svelte owns the motion and the timers and asks this module what happens. Nothing here counts for
// anything: a catch is a caption and an icon, never ベル or a write.

import { pickOne, weighted } from '#lib/random.ts';
import type { SeaId } from './sea.ts';
import type { Sky } from './weather.ts';
import {
  BEACH_BOX, BRIDGE, CAMPSITE, CLIFF, FLOWERS, FALLS_POOL, GOAL_TREES, HEDGE_XS, HEDGE_Z, POND, RIVER, ROCK, SCENERY, SEA_BOX, SHORE_Z, TREE_H, freshWhere, surfaceAt,
  LAWN_SPOTS, PONDS, RIVER_BEND, onLayout, riverNS, worldGen, type FreshWhere
} from './world.ts';

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
  /** Its months are a gate, not a flavour: the dung beetle rolls a snowball, so only in NH's snowy months. */
  only?: true;
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
  | 'flea' | 'bagworm' | 'spider' | 'pondskater' | 'diving-beetle' | 'giant-water-bug' | 'cyclommatus-stag' | 'golden-stag'
  | 'horned-atlas' | 'horned-elephant' | 'blue-weevil-beetle' | 'giraffe-stag' | 'horned-hercules' | 'dung-beetle' | 'ant' | 'fly';

/** How a bug moves: a butterfly (or a bee, a moth) flutters about the flowers (a butterfly lands on one now and then), a
 *  dragonfly darts and hovers over the lawn, a few fireflies drift and blink, a ladybug or a mantis sits on a flower's
 *  head (NH's flower bugs), a grasshopper or a cricket hops in the grass, a cicada or a beetle flies
 *  in to a tree's trunk and perches there, and a crab, a pill bug or a snail crawls along the beach, the grass or a flower clump.
 *  A tarantula or a scorpion stalks the grass at night (it rears up when it's come at: `stalkTap`), a mole cricket
 *  chirps under a little mound of earth (dug up with a tap), and a bagworm or a spider dangles on its thread from a
 *  shaken tree (TreeShakes.svelte). */
export type Flight = 'flutter' | 'dart' | 'drift' | 'flower' | 'hop' | 'perch' | 'crawl' | 'stalk' | 'burrow' | 'dangle';
/** Where a crawler keeps to: the front beach (NH's shoreline and beach rocks), the grass, the flowers, the water (the
 *  pond and the river's still reach), by the rock (NH: out from under a hit rock), under a tree (the walking leaf), on a
 *  bush (the snail in the rain: NH's rocks and bushes), by the campfire (the ant: NH's rotten food is the camp's here). */
type Ground = 'beach' | 'grass' | 'beds' | 'pond' | 'rock' | 'tree' | 'bush' | 'camp';

interface Bug extends Seasonal {
  flight: Flight;
  /** A crawler's ground. */
  ground?: Ground;
  /** A flier that keeps to a place of its own, not the flowers: the fly round the campfire (NH: round trash). */
  haunt?: 'camp';
  /** A percher's tree: NH's palm beetles keep to the palms; every other percher to the hardwood and cedar trunks. */
  tree?: 'palm';
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
  // NH's palm beetles: on the palms only, on summer nights (the golden stag the rarest, NH's 12,000 ベル against 8,000)
  'goliath-beetle': { months: span(6, 9), hours: [17, 8], flight: 'perch', tree: 'palm', weight: 0.5 },
  'cyclommatus-stag': { months: [7, 8], hours: [17, 8], flight: 'perch', tree: 'palm', weight: 0.5 },
  'golden-stag': { months: [7, 8], hours: [17, 8], flight: 'perch', tree: 'palm', weight: 0.3 },
  'horned-atlas': { months: [7, 8], hours: [17, 8], flight: 'perch', tree: 'palm', weight: 0.5 },
  'horned-elephant': { months: [7, 8], hours: [17, 8], flight: 'perch', tree: 'palm', weight: 0.5 },
  'drone-beetle': { months: span(6, 8), hours: ALL_DAY, flight: 'perch', weight: 1 },
  'jewel-beetle': { months: span(4, 8), hours: ALL_DAY, flight: 'perch', weight: 0.7, weather: 'dry' },
  'walking-stick': { months: span(7, 11), hours: [4, 8], also: [17, 19], flight: 'perch', weight: 1 },
  // on the beach and in the grass: the hermit crab after dark, the wharf roach on the rocks, the pill bug and the
  // centipede by the rock (NH: out from under a hit rock), the snail on a bush (only in the rain, as in NH)
  'hermit-crab': { months: ALL_YEAR, hours: [19, 8], flight: 'crawl', ground: 'beach', weight: 2 },
  'wharf-roach': { months: ALL_YEAR, hours: ALL_DAY, flight: 'crawl', ground: 'beach', weight: 1.5 },
  'pill-bug': { months: span(9, 6), hours: [23, 16], flight: 'crawl', ground: 'rock', weight: 1.5 },
  centipede: { months: span(9, 6), hours: [16, 23], flight: 'crawl', ground: 'rock', weight: 1 },
  snail: { months: ALL_YEAR, hours: ALL_DAY, flight: 'crawl', ground: 'bush', weight: 3, weather: 'rain' },
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
  // on the water (NH: on rivers and ponds: the pond and the river's still reach): the pondskater skating, the diving
  // beetle surfacing, the giant water bug at night
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
  // on the ground: the tiger beetle (it runs), the earth-boring dung beetle, the walking leaf (NH: a leaf under the trees)
  'tiger-beetle': { months: span(2, 10), hours: ALL_DAY, flight: 'crawl', ground: 'grass', weight: 1, weather: 'dry' },
  'earth-boring-dung-beetle': { months: span(7, 9), hours: ALL_DAY, flight: 'crawl', ground: 'grass', weight: 1.5 },
  'walking-leaf': { months: span(7, 9), hours: ALL_DAY, flight: 'crawl', ground: 'tree', weight: 1 },
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
  spider: { months: ALL_YEAR, hours: [19, 8], flight: 'dangle', weight: 0 },
  // NH 2.0's other palm beetles: the blue weevil all day (NH's spawn rate as the horned atlas's), the giraffe stag and
  // the horned hercules on summer nights, as rare as the golden stag (12,000 ベル)
  'blue-weevil-beetle': { months: [7, 8], hours: ALL_DAY, flight: 'perch', tree: 'palm', weight: 0.5 },
  'giraffe-stag': { months: [7, 8], hours: [17, 8], flight: 'perch', tree: 'palm', weight: 0.3 },
  'horned-hercules': { months: [7, 8], hours: [17, 8], flight: 'perch', tree: 'palm', weight: 0.3 },
  // NH's dung beetle rolls a snowball across the snow: its model rolls one (scripts/world3d-assets.ts), over the lawn,
  // and only in NH's months (Dec–Feb: the island's snowy ground is Dec 11 – Feb 24), never a snowball in summer
  'dung-beetle': { months: [12, 1, 2], hours: ALL_DAY, flight: 'crawl', ground: 'grass', weight: 1.5, only: true },
  // NH's ant and fly come to rotten food and trash; the island has neither lying about (the rod's junk goes to the
  // pocket), so they come to its food: the campfire, the ant on the ground by it, the fly buzzing round it. All year,
  // all day, as NH's; uncommon
  ant: { months: ALL_YEAR, hours: ALL_DAY, flight: 'crawl', ground: 'camp', weight: 0.7 },
  fly: { months: ALL_YEAR, hours: ALL_DAY, flight: 'flutter', haunt: 'camp', weight: 0.7 }
};

/** Where a bug is found on the island (NH's locations, docs/design.md "Critters"): on a hardwood or cedar trunk (the
 *  cicadas, the stags; NH's stump beetles too, the island has no stumps), on a palm (NH's palm beetles), sitting on a
 *  flower (the ladybug, the mantises), flying over the flowers (the butterflies, the bee), round a lamp at night (the
 *  moth: NH's light sources), flying near water (the dragonflies, the fireflies), on the ground in the grass, on the
 *  beach, crawling over the flowers (the stink bugs), on the water (the pond and the river's still reach), by the rock, under
 *  a tree (the walking leaf), on a bush (the snail), by the campfire on the ground (the ant) and in the air (the fly). */
export type BugPlace = 'trunk' | 'palm' | 'flower' | 'flowers' | 'lights' | 'water-air' | 'grass' | 'beach' | 'beds' | 'water' | 'rock' | 'under-tree' | 'bush' | 'camp' | 'camp-air';
const GROUND_PLACE: Record<Ground, BugPlace> = { beach: 'beach', grass: 'grass', beds: 'beds', pond: 'water', rock: 'rock', tree: 'under-tree', bush: 'bush', camp: 'camp' };
export function bugPlace(id: BugId): BugPlace {
  const b = BUGS[id];
  if (b.haunt) return 'camp-air';
  if (b.flight === 'perch') return b.tree === 'palm' ? 'palm' : 'trunk';
  if (b.flight === 'flower') return 'flower';
  if (b.flight === 'dart' || b.flight === 'drift') return 'water-air';
  if (b.flight === 'crawl') return GROUND_PLACE[b.ground ?? 'grass'];
  if (id === 'moth') return 'lights';
  return b.flight === 'flutter' || b.flight === 'dangle' ? 'flowers' : 'grass';
}

/** Inside [from, to) of the day, wrapping past midnight when to < from. */
export function inHours([from, to]: readonly [number, number], h: number): boolean {
  return from <= to ? h >= from && h < to : h >= from || h < to;
}
/** Odds for a critter in its NH months against out of them: the season is a flavour, never a gate (user). */
export const IN_SEASON = 3;
const inHoursOf = (c: Seasonal, hour: number) => inHours(c.hours, hour) || (!!c.also && inHours(c.also, hour));
/** Whether the weather lets it out (Seasonal `weather`). */
function weatherLets(c: Seasonal, sky: Sky): boolean {
  // cloudy is a fine day's for the critters (NH)
  const rain = sky === 'rain' || sky === 'heavy';
  return c.weather === 'dry' ? !rain : c.weather === 'rain' ? rain : c.weather === 'wet' ? rain || sky === 'snow' : true;
}
/** Its odds at (month, hour, sky): 0 outside its hours or its weather (or its months, for one `only` in them), else
 *  its weight, ×IN_SEASON in its months. */
export const oddsAt = (c: Seasonal, month: number, hour: number, sky: Sky = 'clear'): number =>
  !inHoursOf(c, hour) || !weatherLets(c, sky) ? 0 : c.months.includes(month) ? c.weight * IN_SEASON : c.only ? 0 : c.weight;

/** A weighted pick among the ids that can come at (month, hour, sky), or null. `r` is a uniform [0, 1) source. */
export function pick<K extends string>(table: Record<K, Seasonal>, month: number, hour: number, r: () => number, sky: Sky = 'clear'): K | null {
  const live = (Object.keys(table) as K[]).map((k) => [k, oddsAt(table[k], month, hour, sky)] as const).filter(([, w]) => w > 0);
  return live.length ? weighted(live, r) : null;
}

/** The fish under a new shadow (always someone: the sea bass never takes a day off). */
export const pickFish = (month: number, hour: number, r: () => number, sky: Sky = 'clear'): FishId => pick(FISH, month, hour, r, sky) ?? 'sea-bass';

/** What the line brings up from a `fish` shadow: the fish, or 1 in JUNK_ODDS a piece of junk. */
export function hookItem<F extends FishId | PondFishId>(fish: F, r: () => number): F | JunkId {
  return r() * JUNK_ODDS < 1 ? pickOne(JUNK, r) : fish;
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
  return flutter.length ? pickOne(flutter, r) : null;
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

/** Per slot, the chance the front sea's bubbles (a spot to dive at: island/sea.ts) come when none are there: their own
 *  channel (island/ambient.ts), beside the front's shadow, about as many a day as when they took 1 sea turn in 4. */
export const BUBBLE_ODDS = 0.07;

/** How long an ambient critter stays if nobody plays with it (ms). */
export const STAY_MS = { fish: 45_000, bug: 18_000 } as const;

// ---------- the water: the sea, the pond, the river ----------

/** Where a shadow swims (world.ts): the sea in front of the front beach, or a fresh water by NH's locations: the pond,
 *  the river, the river mouth (the wide reach on the west beach), the clifftop (the falls' pool and above). */
export type Water = 'sea' | FreshWhere;
export const FRESH: readonly FreshWhere[] = ['pond', 'river', 'mouth', 'clifftop'];

/** How far round the water's edge a tap still casts into it (u: a finger's slack round a small pond or a narrow
 *  river), and how far in from the edge a float lands (u). */
export const WATER_REACH = 12;
const EDGE_U = 8;

/** The water at world (x, z): the island's own tiles say (world.ts surfaceAt: the one answer to "is this water", the
 *  ground's, the walk's and the taps'), the sea or a fresh water by NH's locations (freshWhere); null: land, a bridge.
 *  `reach` > 0: else the nearest water within it (a finger's slack round a bank); < 0: only where all of it within
 *  −reach is water it swims on (sameWater: clear of its banks). */
export function waterAt(x: number, z: number, reach = 0): Water | null {
  const at = (px: number, pz: number): Water | null => {
    const s = surfaceAt(px, pz);
    return s === 'sea' ? 'sea' : s === 'water' ? freshWhere(px, pz) : null;
  };
  const here = at(x, z);
  if (reach < 0) return here && ring(-reach).every(([dx, dz]) => ((w) => !!w && sameWater(here, w))(at(x + dx, z + dz))) ? here : null;
  if (here || reach === 0) return here;
  for (let r = 4; r <= reach; r += 4) for (const [dx, dz] of ring(r)) { const w = at(x + dx, z + dz); if (w) return w; }
  return null;
}
/** Twelve points round a circle of radius r. */
const ring = (r: number): [number, number][] => Array.from({ length: 12 }, (_, i) => [Math.cos((i / 12) * Math.PI * 2) * r, Math.sin((i / 12) * Math.PI * 2) * r]);

/** Where a cast at world (x, z) lands, and on which water: the water there or the nearest within a finger's slack
 *  (WATER_REACH), drawn in from its edge by EDGE_U where there's room (NH's float never lands on the bank); null: no
 *  water there. */
export function landing(x: number, z: number): { x: number; z: number; water: Water } | null {
  let px = x, pz = z, w = waterAt(x, z);
  for (let r = 4; !w && r <= WATER_REACH; r += 4) {
    const wet = ring(r).find(([dx, dz]) => waterAt(x + dx, z + dz));
    if (wet) [px, pz, w] = [x + wet[0], z + wet[1], waterAt(x + wet[0], z + wet[1])];
  }
  if (!w) return null;
  // in from the edge: away from the dry points round it, a few steps
  for (let i = 0; i < 4; i++) {
    const dry = ring(EDGE_U).filter(([dx, dz]) => waterAt(px + dx, pz + dz) !== w);
    const sx = dry.reduce((a, [dx]) => a + dx, 0), sz = dry.reduce((a, [, dz]) => a + dz, 0), len = Math.hypot(sx, sz);
    if (!dry.length || len < 1e-6) break;
    const qx = px - (sx / len) * 3, qz = pz - (sz / len) * 3;
    if (waterAt(qx, qz) !== w) break;
    [px, pz] = [qx, qz];
  }
  return { x: px, z: pz, water: w };
}

/** The waters a shadow swims between to a float: its own, and the river's lower reach with its mouth (one channel). */
export const sameWater = (a: Water, b: Water): boolean => a === b || ((a === 'river' || a === 'mouth') && (b === 'river' || b === 'mouth'));
/** Open water all the way from (ax, az) to (bx, bz) for a shadow of `water` (a look every 6u). */
export function swimmable(water: Water, ax: number, az: number, bx: number, bz: number): boolean {
  const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 6));
  for (let i = 0; i <= n; i++) {
    const w = waterAt(ax + ((bx - ax) * i) / n, az + ((bz - az) * i) / n);
    if (!w || !sameWater(water, w)) return false;
  }
  return true;
}

/** A shadow's length (u) by NH's size 1 (tiny) – 6 (huge): one teardrop, 0.42 of its length tall; the eels' long thin
 *  one (`narrow`) is 32u at 0.18. */
const SHADOW_U = [20, 26, 32, 40, 48, 64] as const;
export const shadowLen = (size: number, shape?: 'narrow' | 'fin'): number =>
  shape === 'narrow' ? 44 : SHADOW_U[Math.min(6, Math.max(1, Math.round(size))) - 1];
/** A fresh-water shadow is drawn smaller than the sea's (the pond's 80u across, the river 30u wide): NH's sizes 1–6
 *  still read apart, a size 6 still fits along the river. */
export const POND_SHADOW = 0.65;

// ---------- where they live in the world (world.ts units) ----------

/** A patch of water a shadow swims in: an oriented box round (cx, cz), half-length L along (ux, uz) (a river's
 *  reach runs along its channel), half-width W across; a stretch of coast (coast.ts) its tiles' middles too, where it
 *  swims (the box only says roughly where it is). */
export interface Swim { cx: number; cz: number; ux: number; uz: number; L: number; W: number; tiles?: readonly (readonly [number, number])[] }
/** A point of a swim patch (s along, t across, each −1…1). */
export const swimAt = (a: Swim, s: number, t: number): { x: number; z: number } => ({ x: a.cx + a.ux * s * a.L - a.uz * t * a.W, z: a.cz + a.uz * s * a.L + a.ux * t * a.W });
/** A random point of a swim patch: anywhere in one of its tiles, or in its box. */
export function swimPick(a: Swim, r: () => number): { x: number; z: number } {
  if (!a.tiles?.length) return swimAt(a, r() * 2 - 1, r() * 2 - 1);
  const [x, z] = a.tiles[Math.min(a.tiles.length - 1, Math.floor(r() * a.tiles.length))];
  return { x: x + (r() - 0.5) * 30, z: z + (r() - 0.5) * 30 };
}

/** The sea's fishing water: SEA_BOX, reaching in to just past the foam (from まえ only its near strip is on screen). */
export const SEA_SWIM: Swim = {
  get cx() { return (SEA_BOX.x0 + SEA_BOX.x1) / 2; }, get cz() { return (SEA_BOX.z0 + SHORE_Z - 16) / 2; }, ux: 1, uz: 0,
  get L() { return (SEA_BOX.x1 - SEA_BOX.x0) / 2; }, get W() { return (SHORE_Z - 16 - SEA_BOX.z0) / 2; }
};

/** Patches along the river's centreline from RIVER[i0] to RIVER[i1], one every `step` u, each a reach's stretch. */
function reaches(i0: number, i1: number, step: number, keep: (x: number, z: number) => boolean): Swim[] {
  const out: Swim[] = [];
  for (let i = i0; i < i1; i++) {
    const [ax, az, aw] = RIVER[i], [bx, bz, bw] = RIVER[i + 1];
    const len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(len / step));
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, hw = (aw + (bw - aw) * t) / 2;
      if (keep(x, z)) out.push({ cx: x, cz: z, ux: (bx - ax) / len, uz: (bz - az) / len, L: 22, W: hw * 0.35 });
    }
  }
  return out;
}
/** Where a fresh water's shadows swim (world): the pond's open middle; the stream's reaches below the falls' pool (not
 *  under the bridge); the
 *  mouth's wide reach on the west beach; the falls' pool (NH's clifftop: the upper tier is beyond the horizon). */
export function freshAreas(where: FreshWhere): Swim[] {
  // (each patch's middle on that water's own tiles, clear of its edge: never one over a bank or out at sea; a layout
  // without a painted pond has POND far off the island, layoutWorld.ts FAR_OVAL)
  const on = (x: number, z: number) => waterAt(x, z, -4) === where;
  if (where === 'pond') return [POND, ...PONDS].filter((o) => on(o.x, o.z)).map((o) => ({ cx: o.x, cz: o.z, ux: 1, uz: 0, L: o.rx * 0.55, W: o.rz * 0.4 }));
  if (where === 'clifftop')
    return reaches(0, RIVER.length - 1, 24, (x, z) => z > CLIFF.z0 - FALLS_POOL && z < CLIFF.z0 - 6 && on(x, z));
  if (where === 'mouth') return reaches(0, RIVER.length - 1, 44, on);
  return reaches(0, RIVER.length - 1, 80, (x, z) => z < CLIFF.z0 - FALLS_POOL - 8 && on(x, z) && Math.abs(x - BRIDGE.x) > BRIDGE.w / 2 + 24);
}

/** A patch a bug keeps to (world): x0…x1 across, z0…z1 deep, l0…l1 units above the ground. */
export interface Patch { x0: number; x1: number; z0: number; z1: number; l0: number; l1: number }
const patch = (x: number, z: number, hx: number, hz: number, l0 = 0, l1 = l0): Patch => ({ x0: x - hx, x1: x + hx, z0: z - hz, z1: z + hz, l0, l1 });

/** A trunk a bug perches on: where on it (lift: up the trunk, dx: off the foot's x where the trunk leans). */
export interface Perch { tree: string; kind: 'oak' | 'cedar' | 'palm'; x: number; z: number; lift: number; dx: number; h: number }
/** The trunks: NH's palm beetles on the palms; every other percher on the goal trees, the oaks and the cedars (their
 *  bare trunk under the leaves: an oak's lower half, a cedar's bottom third, a palm's lower third). */
export function perches(palm: boolean): Perch[] {
  if (palm)
    return SCENERY.filter((s) => s.kind === 'palm').map((s) => ({ tree: s.id, kind: 'palm' as const, x: s.x, z: s.z, lift: s.h * 0.3, dx: (s.flip ? -1 : 1) * s.h * 0.03, h: s.h }));
  const goal = (['A', 'B'] as const).map((k) => ({ tree: `goal-${k}`, kind: 'oak' as const, x: GOAL_TREES[k][0], z: GOAL_TREES[k][1], lift: TREE_H * 0.28, dx: 0, h: TREE_H }));
  const scenery = SCENERY.filter((s) => s.kind === 'oak' || s.kind === 'cedar').map((s) => ({ tree: s.id, kind: s.kind as 'oak' | 'cedar', x: s.x, z: s.z, lift: s.h * (s.kind === 'oak' ? 0.3 : 0.16), dx: 0, h: s.h }));
  return [...goal, ...scenery];
}

/** The 3D island's trunks (NH's tree models, fitted to the tree's height h; measured from the models' vertices): how
 *  far up a percher sits, low enough that the canopy (a cedar's skirt is wide and low) leaves it in view from the
 *  camera at every pitch (44°–63°), and how far out of the trunk's middle the bark's front is, the bug's belly on it. */
export const PERCH_3D: Record<Perch['kind'], { lift: number; out: number }> = {
  oak: { lift: 0.18, out: 0.11 },
  cedar: { lift: 0.13, out: 0.09 },
  palm: { lift: 0.19, out: 0.095 }
};
/** A perch on the 3D island: on the bark's front, toward the camera (`f`: a little lower or higher). */
export const perch3d = (p: Perch, f = 1): { x: number; z: number; lift: number } => ({
  x: p.x, z: p.z - PERCH_3D[p.kind].out * p.h, lift: PERCH_3D[p.kind].lift * p.h * f
});

/** The bushes (the hedge and the scenery's): x, z and height. */
export const bushes = (): readonly { id: string; x: number; z: number; h: number }[] => [
  ...HEDGE_XS.map((x, i) => ({ id: `hedge-${i}`, x, z: HEDGE_Z, h: 40 })),
  ...SCENERY.filter((s) => s.kind === 'bush').map((s) => ({ id: s.id, x: s.x, z: s.z, h: s.h }))
];
/** The wild flowers' clumps, each a patch round its flowers: where the butterflies and the bee flutter and the stink
 *  bugs crawl. A clump is the flowers within CLUMP_U of each other (the layout's own clump tags repeat across the
 *  island: one patch by them spanned half of it, and a butterfly crossed it in a second). */
const CLUMP_U = 60;
const beds = (l0: number, l1: number, grow: number) => {
  const left = [...FLOWERS], out: Patch[] = [];
  while (left.length) {
    const clump = [left.pop()!];
    for (let i = 0; i < clump.length; i++)
      for (let j = left.length - 1; j >= 0; j--)
        if (Math.abs(left[j].x - clump[i].x) <= CLUMP_U && Math.abs(left[j].z - clump[i].z) <= CLUMP_U) clump.push(...left.splice(j, 1));
    const xs = clump.map((f) => f.x), zs = clump.map((f) => f.z);
    out.push({ x0: Math.min(...xs) - grow, x1: Math.max(...xs) + grow, z0: Math.min(...zs) - grow / 2, z1: Math.max(...zs) + grow / 2, l0, l1 });
  }
  return out;
};
/** The open lawn (off the beds, the trunks and the paths' middle): まえ's and the campsite's ground. */
const LAWN: Patch[] = [
  { x0: 22, x1: 100, z0: 262, z1: 318, l0: 0, l1: 0 }, { x0: 292, x1: 368, z0: 262, z1: 318, l0: 0, l1: 0 },
  { x0: 60, x1: 172, z0: 372, z1: 560, l0: 0, l1: 0 }, { x0: 218, x1: 290, z0: 372, z1: 560, l0: 0, l1: 0 },
  { x0: 128, x1: 172, z0: 668, z1: 700, l0: 0, l1: 0 }, { x0: 216, x1: 296, z0: 690, z1: 712, l0: 0, l1: 0 },
  { x0: 260, x1: 300, z0: 748, z1: 784, l0: 0, l1: 0 }, { x0: 214, x1: 240, z0: 836, z1: 880, l0: 0, l1: 0 }
];

/** The open lawn on the layout: a dozen of its open grass tiles, spread over the island. */
let lawn3: { gen: number; patches: Patch[] } | null = null;
function lawnOnLayout(): Patch[] {
  if (lawn3?.gen === worldGen()) return lawn3.patches;
  const step = Math.max(1, Math.floor(LAWN_SPOTS.length / 12));
  const patches = LAWN_SPOTS.filter((_, i) => i % step === 0).map(([x, z]) => patch(x, z, 14, 12));
  lawn3 = { gen: worldGen(), patches };
  return patches;
}

/** The ground by each campfire (the camp's food: the ant's and the fly's), in front of it and either side (never behind
 *  it, out of view), `l0`…`l1` above it; with no campfire on the island, in front of the campsite's tent. Where
 *  something stands there (a bench, a lantern put by the fire) the bug keeps off it (critterPath.ts groundOk). */
function campFronts(l0: number, l1: number): Patch[] {
  const fires = SCENERY.filter((s) => s.key === 'deco/campfire');
  if (!fires.length) return [patch(CAMPSITE.x, CAMPSITE.z - 26, 24, 6, l0, l1)];
  return fires.flatMap((f) => [patch(f.x, f.z - 20, 22, 6, l0, l1), patch(f.x - 30, f.z - 4, 6, 10, l0, l1), patch(f.x + 30, f.z - 4, 6, 10, l0, l1)]);
}

/** Where a bug of `place` keeps to (not the trunks or the flower heads: `perches`, FLOWERS). */
export function patches(place: BugPlace): Patch[] {
  switch (place) {
    case 'flowers': return beds(16, 44, 36);
    case 'beds': return beds(3, 7, 10);
    case 'lights': return SCENERY.filter((s) => s.kind === 'prop' && /lamp/.test(s.key)).map((s) => patch(s.x, s.z - 2, 16, 6, s.h * 0.75, s.h * 1.05));
    case 'bush': return bushes().map((b) => patch(b.x, b.z - 1, 7, 2, b.h * 0.8, b.h * 0.86));
    case 'water-air':
      return [
        patch(POND.x, POND.z, POND.rx, POND.rz, 10, 36),
        ...reaches(3, RIVER.length - 1, 100, (x, z) => z < CLIFF.z0 - 40 && x > -10).map((a) => patch(a.cx, a.cz, Math.abs(a.uz) > 0.7 ? a.W * 2 + 8 : 30, Math.abs(a.uz) > 0.7 ? 40 : a.W * 2 + 6, 10, 34))
      ];
    case 'water':
      return [
        { x0: POND.x - POND.rx * 0.6, x1: POND.x + POND.rx * 0.6, z0: POND.z - POND.rz * 0.5, z1: POND.z + POND.rz * 0.5, l0: 0, l1: 0 },
        // four along the reach between its bend and the falls' pool
        ...[0, 1, 2, 3].map((k) => RIVER_BEND + 20 + (k / 3) * (CLIFF.z0 - 40 - RIVER_BEND - 20)).flatMap((z) => { const r = riverNS(z); return r ? [patch(r.x, z, r.hw * 0.45, 26)] : []; })
      ];
    case 'beach': return [{ x0: BEACH_BOX.x0 - 40, x1: BEACH_BOX.x1, z0: BEACH_BOX.z0, z1: BEACH_BOX.z1 - 10, l0: 0, l1: 0 }];
    case 'rock': return [{ x0: ROCK[0] - 18, x1: ROCK[0] + 20, z0: ROCK[1] - 14, z1: ROCK[1] - 6, l0: 0, l1: 0 }];
    case 'under-tree': return perches(false).filter((p) => !/cedar/.test(p.tree)).map((p) => ({ x0: p.x - 20, x1: p.x + 20, z0: p.z - 18, z1: p.z - 8, l0: 0, l1: 0 }));
    case 'camp': return campFronts(0, 0);
    case 'camp-air': return campFronts(8, 28);
    default: return onLayout() ? lawnOnLayout() : LAWN;
  }
}

// (fishing: island/fishing.ts)

// ---------- the net ----------

/** A tap near a bug (px from its centre): on it (a 44px target at least, a finger's slack round a small one) it's
 *  caught; a swing just past it startles it off; further away it doesn't care. */
export function netSwing(distPx: number, sizePx: number): 'catch' | 'startle' | 'none' {
  if (distPx <= Math.max(30, sizePx * 0.8)) return 'catch';
  return distPx <= 56 ? 'startle' : 'none';
}

/** My villager running at a bug (u/s: faster than a stroll's 90; a tap-walk runs at 300) within this (u) of it... */
export const FLEE_U = 70;
const RUN_UPS = 120;
/** ...sends a flier, a percher or a hopper off, as NH's bugs take off at a run and keep still for one creeping up
 *  (or netting from where they stand). */
export const fleesFrom = (flight: Flight, distU: number, ups: number): boolean =>
  (flight === 'flutter' || flight === 'dart' || flight === 'perch' || flight === 'hop') && distU <= FLEE_U && ups > RUN_UPS;

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
