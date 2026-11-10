// The island's things as NH models (docs/world3d-assets.md): every art key the 2D island draws that has an NH model,
// mapped to its model folder (`<Model>.Nin_NX_NVN`), for scripts/world3d-models.ts to convert into
// static/room/world3d/<group>/<id>.glb and src/lib/components/world3d/assets.json. The critters' names are NH's own
// (Japanese, romanised as the game files spell them).

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BUGS, FISH as FISH_TABLE } from '../src/lib/components/island/critters.ts';
import { POND_FISH } from '../src/lib/components/island/pondFish.ts';
import { SEA as SEA_TABLE } from '../src/lib/components/island/sea.ts';
import { FOSSILS } from '../src/lib/components/island/beach.ts';

/** The bugs (critters.ts BugId) → NH's Insect<Name> models. */
const BUG: Record<string, string> = {
  'common-butterfly': 'Monshirocho', 'yellow-butterfly': 'Monkicho', 'tiger-butterfly': 'Agehacho', 'peacock-butterfly': 'Karasuageha',
  'common-bluebottle': 'Aosujiageha', 'paper-kite-butterfly': 'Ohgomamadara', 'great-purple-emperor': 'Ohmurasaki', 'monarch-butterfly': 'Ohkabamadara',
  'emperor-butterfly': 'Morufuocho', 'agrias-butterfly': 'Miirotateha', 'rajah-brookes-birdwing': 'Akaeritoribaneageha',
  'queen-alexandras-birdwing': 'Arekisandoratoribaneageha', moth: 'Ga', 'atlas-moth': 'Yonagunisan', 'madagascan-sunset-moth': 'Nishikiohtsubamega',
  'long-locust': 'Shoryobatta', 'migratory-locust': 'Tonosamabatta', 'rice-grasshopper': 'Inago', grasshopper: 'Kirigirisu', cricket: 'Kohrogi',
  'bell-cricket': 'Suzumushi', mantis: 'Kamakiri', 'orchid-mantis': 'Hanakamakiri', honeybee: 'Mitsubachi', wasp: 'Hachi',
  'brown-cicada': 'Aburazemi', 'robust-cicada': 'Kumazemi', 'giant-cicada': 'Minminzemi', 'walker-cicada': 'Tsukutsukuhousi',
  'evening-cicada': 'Higurashi', 'cicada-shell': 'Seminonukegara', 'red-dragonfly': 'Akiakane', 'darner-dragonfly': 'Ginyanma',
  'banded-dragonfly': 'Oniyanma', damselfly: 'Itotonbo', firefly: 'Hotaru', 'mole-cricket': 'Okera', pondskater: 'Amenbo',
  'diving-beetle': 'Gengorou', 'giant-water-bug': 'Tagame', stinkbug: 'Kamemushi', 'man-faced-stink-bug': 'Jinmenkamemushi',
  ladybug: 'Tentoumushi', 'tiger-beetle': 'Hanmyou', 'jewel-beetle': 'Tamamushi', 'violin-beetle': 'Baiorinmushi',
  'citrus-long-horned-beetle': 'Gomadarakamikiri', 'rosalia-batesi-beetle': 'Ruriboshikamikiri', 'earth-boring-dung-beetle': 'Ohsenchikogane',
  'scarab-beetle': 'Purachinakogane', 'drone-beetle': 'Kanabun', 'goliath-beetle': 'Goraiasuohtsunohanamuguri', 'saw-stag': 'Nokogirikuwagata',
  'miyama-stag': 'Miyamakuwagata', 'giant-stag': 'Ohkuwagata', 'rainbow-stag': 'Nijiirokuwagata', 'cyclommatus-stag': 'Hosoakakuwagata',
  'golden-stag': 'Ougononikuwagata', 'horned-dynastid': 'Kabutomushi', 'horned-atlas': 'Kohkasasuohkabuto', 'horned-elephant': 'Zoukabuto',
  'walking-stick': 'Nanafushi', 'walking-leaf': 'Konohamushi', bagworm: 'Minomushi', 'hermit-crab': 'Yadokari', 'wharf-roach': 'Funamushi',
  mosquito: 'Ka', flea: 'Nomi', snail: 'Katatsumuri', 'pill-bug': 'Dangomushi', centipede: 'Mukade', spider: 'Kumo', tarantula: 'Taranchura',
  scorpion: 'Sasori', 'blue-weevil-beetle': 'Housekizoumushi', 'giraffe-stag': 'Girafanokogirikuwagata', 'horned-hercules': 'Herakuresuohkabuto',
  'dung-beetle': 'Funkorogashi', ant: 'Ari', fly: 'Hae'
};

/** The fish (critters.ts FishId, pondFish.ts) → NH's Fish<Name> models (the one the player holds up). */
const FISH: Record<string, string> = {
  bitterling: 'Tanago', 'pale-chub': 'Oikawa', 'crucian-carp': 'Funa', dace: 'Ugui', carp: 'Koi', koi: 'Nishikigoi', goldfish: 'Kingyo',
  'pop-eyed-goldfish': 'Demekin', 'ranchu-goldfish': 'Ranchu', killifish: 'Medaka', crawfish: 'Zarigani', 'soft-shelled-turtle': 'Suppon',
  'snapping-turtle': 'Kamitsukigame', tadpole: 'Otamajakusi', frog: 'Kaeru', 'freshwater-goby': 'Donko', loach: 'Dojou', catfish: 'Namazu',
  'giant-snakehead': 'Raigyo', bluegill: 'Blueguill', 'yellow-perch': 'Yellowparch', 'black-bass': 'Blackbass', tilapia: 'Thirapia',
  pike: 'Paiku', 'pond-smelt': 'Wakasagi', sweetfish: 'Ayu', 'cherry-salmon': 'Yamame', char: 'Ooiwana', 'golden-trout': 'GoldenTorauto',
  stringfish: 'Itou', salmon: 'Sake', 'king-salmon': 'Kingsalmon', 'mitten-crab': 'Syanhaigani', guppy: 'Guppi', 'nibble-fish': 'Dokutaafish',
  angelfish: 'Angelfish', betta: 'Beta', 'neon-tetra': 'Neontetora', rainbowfish: 'Rainbowfish', piranha: 'Pirania', arowana: 'Arowana',
  dorado: 'Dolado', gar: 'Ga', arapaima: 'Piraruku', 'saddled-bichir': 'Endorikerii', sturgeon: 'Tyouzame',
  'sea-butterfly': 'Kurione', 'sea-horse': 'Tatsunootoshigo', clownfish: 'Kumanomi', surgeonfish: 'Nanyouhagi', 'butterfly-fish': 'Chouchouuo',
  napoleonfish: 'Naporeonfish', 'zebra-turkeyfish': 'Minokasago', blowfish: 'Harisenbon', 'puffer-fish': 'Fugu', anchovy: 'Antyobi',
  'horse-mackerel': 'Aji', 'barred-knifejaw': 'Ishidai', 'sea-bass': 'Suzuki', 'red-snapper': 'Tai', dab: 'Karei', 'olive-flounder': 'Hirame',
  squid: 'Ika', 'moray-eel': 'Utsubo', 'ribbon-eel': 'Hanahigeutubo', tuna: 'Maguro', 'blue-marlin': 'Kajiki', 'giant-trevally': 'Rouninaji',
  'mahi-mahi': 'Shiira', 'ocean-sunfish': 'Manbou', ray: 'Ei', 'saw-shark': 'Nokogirizame', 'hammerhead-shark': 'Shumokuzame',
  'great-white-shark': 'Same', 'whale-shark': 'Jinbeezame', suckerfish: 'Kobanzame', 'football-fish': 'Chouchinankou', oarfish: 'Ryuuguunotukai',
  barreleye: 'Demenigisu', coelacanth: 'Sirakansu'
};

/** The sea creatures (sea.ts SeaId) → NH's DiveFish<Name> models. */
const SEA: Record<string, string> = {
  seaweed: 'Wakame', 'sea-grapes': 'Umibudou', 'sea-cucumber': 'Namako', 'sea-pig': 'Senjunamako', 'sea-star': 'Hitode', 'sea-urchin': 'Uni',
  'slate-pencil-urchin': 'Paipuuni', 'sea-anemone': 'Isogintyaku', 'moon-jellyfish': 'Mizukurage', 'sea-slug': 'Umiushi', 'pearl-oyster': 'Akoyagai',
  mussel: 'Muhrugai', oyster: 'Oyster', scallop: 'Hotate', whelk: 'Baigai', 'turban-shell': 'Sazae', abalone: 'Awabi', 'gigas-giant-clam': 'Shakogai',
  'chambered-nautilus': 'Oumugai', octopus: 'Tako', 'umbrella-octopus': 'Mendako', 'vampire-squid': 'Koumoridako', 'firefly-squid': 'Hotaruika',
  'gazami-crab': 'Gazami', 'dungeness-crab': 'DungenessCrab', 'snow-crab': 'Zuwaigani', 'red-king-crab': 'Tarabagani', 'acorn-barnacle': 'Fujitsubo',
  'spider-crab': 'Takaashigani', 'tiger-prawn': 'Kurumaebi', 'sweet-shrimp': 'Amaebi', 'mantis-shrimp': 'Syako', 'spiny-lobster': 'Iseebi',
  lobster: 'Lobster', 'giant-isopod': 'Daiougusokumushi', 'horseshoe-crab': 'Kabutogani', 'sea-pineapple': 'Hoya', 'spotted-garden-eel': 'Chinanago',
  flatworm: 'Hiramushi', 'venus-flower-basket': 'Kairoudouketsu'
};

/** The junk a rod brings up → NH's UnitIconTrush<Name>. */
const JUNK: Record<string, string> = { boot: 'Boot', 'empty-can': 'Can', 'old-tire': 'Tire' };

// ---- the jobs ------------------------------------------------------------------------------------------------------

/** What a model is for: an art key it serves (assets.json `keys`). */
export interface Use {
  key: string;
  cat: Cat;
  /** World units per model unit (the island's: world.ts DECOR_U = 3, NH's furniture scale), or… */
  s?: number;
  /** …a size (u): the model's longest side drawn this long (today's island's drawn size, so the 3D matches it). */
  h?: number;
  /** Where its origin goes: its feet on the ground (the default), its bounds' centre at a height (a flying bug), or
   *  (a held tool, an accessory) its origin is NH's hand or head joint: put it there. */
  anchor?: 'feet' | 'centre' | 'joint';
  /** Lies flat on the ground (a dig spot, a shadow): casts no shadow. */
  flat?: true;
  /** Turned about the up axis (degrees: a decoration's facing). */
  yaw?: number;
  /** Its winter look's key (bushes/holly → bushes/holly-winter). */
  winter?: string;
  /** Loaded with its group, lazily (a critter: when one of the month's is about). */
  lazy?: 'bug' | 'fish' | 'sea' | 'event';
  /** No NH model of its own: another stands in. */
  standIn?: true;
}
export type Cat = 'bug' | 'fish' | 'shadow' | 'sea' | 'find' | 'fruit' | 'flower' | 'bush' | 'tree' | 'deco' | 'decor' | 'event' | 'scenery' | 'fx' | 'tool' | 'accessory';

/** A conversion (scripts/world3d-models.ts Job) and the keys it serves. */
export interface AssetJob {
  name: string;
  parts: ([string, string] | [string, string, [number, number] | [number, number, number, number]])[];
  tex?: string[];
  grdRow?: number;
  grdRows?: Record<string, number>;
  grdFile?: Record<string, string>;
  hide?: string[];
  maxTex?: number;
  tris?: number;
  alias?: Record<string, string>;
  flat?: [number, number];
  pose?: Record<string, [number, number, number]>;
  snow?: boolean;
  variant?: number;
  /** No occlusion baked in (the snowboy). */
  noAo?: boolean;
  /** A part lifted out as its own node (scripts/world3d-models.ts Job `split`: the weight bench's barbell). */
  split?: { name: string; above: number };
  /** Not NH's: a stylised effect (scripts/world3d-fx.ts). */
  fx?: 'sparkle' | 'bang' | 'dust' | 'splash' | 'ripple' | 'zzz' | 'sweat' | 'confetti' | 'flame' | 'lily-pad';
  /** A pack: several models in this one GLB (`name` its file), each under a node named its id, its model
   *  `decor/<id>` (assets.json `pack`: the file it's in); the job's own `uses` none. */
  pack?: (Pick<AssetJob, 'parts' | 'tex' | 'maxTex' | 'uses'> & { id: string })[];
  uses: Use[];
}

const DECOR_U = 3;
/** The villagers' scale: an NH villager is 14.9 model units, the island's 80u (engine.ts VILLAGER_H). The critters and
 *  the visitors (villager3d) are drawn at it, in NH's proportions to the villagers (the 2D island's bugs are about as big: 1.6× the
 *  furniture's scale, BugSprite.svelte). */
const VILLAGER_S = 5.4;
/** The 2D island's night looks (`<key>-lit`): in 3D the same model, its emissive lit. */
const LIT = new Set(['streetlamp', 'garden-lantern', 'garden-lantern-white', 'campfire', 'bamboo-shoot-lamp', 'mushroom-lamp', 'nut-lamp', 'illumi-tree']);
/** A gradient's row (of NH's 16): its centre. */
const row = (n: number) => (n + 0.5) / 16;
const one = (folder: string, dae = folder) => [[folder, dae]] as [string, string][];
const ftrTex = (model: string, body = 0) => [`${model}ReBody${body}`, `${model}ReFabric0`];

/** The bugs that fly (their bounds' centre at a height); the rest stand on their feet (a cicada on its trunk too). */
const FLYING = new Set(['flutter', 'dart', 'drift', 'dangle']);

const bugs = Object.entries(BUGS).map(([id, b]): AssetJob => ({
  name: `critters/bugs/${id}`, parts: one(`Insect${BUG[id]}`), maxTex: 128, tris: 2500,
  uses: [{ key: `critters/${id}`, cat: 'bug', s: VILLAGER_S, anchor: FLYING.has(b.flight) ? 'centre' : 'feet', lazy: 'bug' }]
}));
// the snowball NH's dung beetle rolls (the snowboy's, its middle at its origin), on the island before its head
// (Critters.svelte, critterMotion3d.ts ball3), its snow unshaded white as the snowboy's
bugs.push({ name: 'critters/bugs/dung-beetle-ball', parts: one('SnowBall'), maxTex: 64, tris: 600, noAo: true, uses: [{ key: 'critters/dung-beetle-ball', cat: 'bug', h: 14, anchor: 'centre', lazy: 'bug' }] });
// the wasps that chase you (NH's field wasp: the swarm's)
bugs.push({ name: 'critters/bugs/wasp-swarm', parts: [['InsectHachiField', 'InsectHachi']], maxTex: 64, tris: 600, uses: [{ key: 'critters/wasp-swarm', cat: 'bug', s: VILLAGER_S, anchor: 'centre', lazy: 'bug' }] });
const fish = Object.keys({ ...FISH_TABLE, ...POND_FISH }).map((id): AssetJob => ({
  name: `critters/fish/${id}`, parts: one(`Fish${FISH[id]}`), maxTex: 128, tris: 2500,
  uses: [{ key: `critters/${id}`, cat: 'fish', s: VILLAGER_S, anchor: 'centre', lazy: 'fish' }]
}));
fish.push(...Object.entries(JUNK).map(([id, m]): AssetJob => ({
  name: `critters/fish/${id}`, parts: one(`UnitIconTrush${m}`), maxTex: 128, uses: [{ key: `critters/${id}`, cat: 'fish', s: VILLAGER_S, anchor: 'centre', lazy: 'fish' }]
})));
const sea = Object.keys(SEA_TABLE).map((id): AssetJob => ({
  name: `critters/sea/${id}`, parts: one(`DiveFish${SEA[id]}`), maxTex: 128, tris: 2500,
  uses: [{ key: `critters/${id}`, cat: 'sea', s: VILLAGER_S, anchor: 'centre', lazy: 'sea' }]
}));
/** NH's fish shadows, sizes 1–6 (critters.ts SHADOW_U: the shadow's length), in the sea and in fresh water; the eels' long
 *  thin one; a shark's (a fin); a diver's bubbles' shadow. Untextured in NH: one dark, see-through colour. */
const SHADOW_U = [20, 26, 32, 40, 48, 64];
const SIZES = ['SS', 'S', 'M', 'L', 'LL', 'LLL'];
const shadow = (name: string, folder: string, h: number): AssetJob => ({
  name: `critters/shadows/${name}`, parts: one(folder), flat: [0x1d2a36, 0.45], uses: [{ key: `shadow/${name}`, cat: 'shadow', h, flat: true }]
});
const shadows = [
  ...SIZES.map((z, i) => shadow(`sea-${i + 1}`, `FishShadow${z}Sea`, SHADOW_U[i])),
  ...SIZES.map((z, i) => shadow(`fresh-${i + 1}`, `FishShadow${z}`, SHADOW_U[i])),
  shadow('narrow', 'FishShadowK', 44), shadow('fin', 'FishShadowJ', 64), shadow('dive', 'DiveFishShadow', 30)
];

// the finds: on the sand, on the lawn, under the trees (Finds.svelte's sizes). NH's field models are its icons'
// (UnitIcon*): the beach's shells are three generic shapes (a clam, a spiral, a coral: you learn which shell on picking
// it up), a star fragment one star in its sign's colour (its gradient's rows: the normal star, then Capricorn to
// Sagittarius in the calendar's order), the large one its own
const find = (name: string, parts: [string, string][], h: number, extra: Partial<AssetJob> = {}, use: Partial<Use> = {}): AssetJob => ({
  name: `finds/${name}`, parts, maxTex: 128, ...extra, uses: [{ key: `finds/${name}`, cat: 'find', h, ...use }]
});
const CLAM = ['cowrie', 'venus-comb', 'sand-dollar', 'giant-clam'];
const finds: AssetJob[] = [
  { name: 'finds/clam', parts: one('UnitIconShellBivalve'), maxTex: 128, uses: CLAM.map((id): Use => ({ key: `finds/${id}`, cat: 'find', h: 22 })) },
  { name: 'finds/spiral', parts: one('UnitIconShellSnail'), maxTex: 128, grdRow: row(0), uses: ['sea-snail', 'conch'].map((id): Use => ({ key: `finds/${id}`, cat: 'find', h: 22 })) },
  find('summer-shell', one('UnitIconShellSnail'), 22, { grdRow: row(1) }),
  find('coral', one('UnitIconShellCoral'), 24),
  find('star-fragment', one('UnitIconStar0'), 18, { grdRow: row(0) }),
  find('large-star-fragment', one('UnitIconStarRare'), 22),
  ...['capricorn', 'aquarius', 'pisces', 'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpius', 'sagittarius']
    .map((z, i) => find(`${z}-fragment`, one('UnitIconStar0'), 18, { grdRow: row(i + 1) })),
  find('message-bottle', one('UnitIconMessageBottle'), 24),
  find('pearl', one('UnitIconPearl'), 12),
  // a fossil: its dig spot (NH's crack, flat on the lawn), the hole once dug, the fossil held up (the assessed ones are icons)
  find('dig-spot', [['UnitIconHole', 'UnitIconHoleOff']], 22, {}, { flat: true }),
  find('hole', [['UnitIconHole', 'UnitIconHoleOn']], 24, {}, { flat: true }),
  { name: 'finds/fossil', parts: one('UnitIconFossil'), maxTex: 128, uses: ['fossil', ...FOSSILS].map((id): Use => ({ key: `finds/${id}`, cat: 'find', h: 20 })) },
  { name: 'finds/diy-recipe', parts: one('UnitIconRecipe'), maxTex: 128, uses: [{ key: 'presents/diy-recipe', cat: 'find', h: 22 }] },
  ...([['skinny-mushroom', 'Slender'], ['round-mushroom', 'Round'], ['flat-mushroom', 'Flat'], ['elegant-mushroom', 'Splendid'], ['rare-mushroom', 'Rare']] as const)
    .map(([id, m]) => find(id, one(`UnitIconPltMush${m}`), 20)),
  find('coconut', one('UnitIconPltFruitCoconut'), 22),
  find('tree-branch', one('UnitIconPltBranch'), 30),
  // a tree's wood (treeShake.ts woodFall): NH's one bundle, its gradient's rows wood, softwood, hardwood
  ...(['wood', 'softwood', 'hardwood'] as const).map((id, i) => find(id, one('UnitIconPltWood'), 22, { grdRow: row(i) })),
  find('earth-egg', one('UnitIconEggGround'), 22), find('sky-egg', one('UnitIconEggSky'), 22), find('water-egg', one('UnitIconEggFish'), 22),
  // the tools a villager holds (a dig, a watering)
  find('shovel', one('ToolScoopWood'), 30), find('watering-can', one('ToolWateringWood'), 22),
  // the weeds of the season (NH's: spring's, summer's, autumn's, winter's; a grown clump)
  ...([['spring', 'PltWeedSpr', 'PltWeedSpr3'], ['summer', 'PltWeedSmr', 'PltWeedSmr3'], ['fall', 'PltWeedAut0', 'PltWeedAut03'], ['winter', 'PltWeedWin0', 'PltWeedWin03']] as const)
    .map(([season, f, d]): AssetJob => ({ name: `finds/weed-${season}`, parts: [[f, d]], maxTex: 128, uses: [{ key: `finds/weed-${season}`, cat: 'find', h: 16 }] })),
  // a balloon's present (NH's red one), Jack's candy, a wasp nest shaken out of a tree
  { name: 'finds/present', parts: one('UnitIconPresentred'), grdRow: row(0), maxTex: 128, uses: [{ key: 'deco/present', cat: 'find', h: 24 }] },
  { name: 'finds/candy', parts: one('UnitIconCandy'), maxTex: 128, uses: [{ key: 'items/candy', cat: 'find', h: 16, lazy: 'event' }] },
  { name: 'finds/wasp-nest', parts: one('UnitIconHoneycomb'), maxTex: 128, uses: [{ key: 'finds/wasp-nest', cat: 'find', h: 20 }] }
];
// the balloons: NH's five colours (its textures' variants)
for (let v = 0; v < 5; v++) finds.push({ name: `finds/balloon-${v}`, parts: one('Balloon00'), variant: v, maxTex: 128, uses: [{ key: `balloon/${v}`, cat: 'find', h: 30, anchor: 'centre' }] });


// the flowers: every species and colour the island grows (static/art/flowers), one model each in bloom (stage 2), its
// petals the colour's own row of NH's gradient (16 rows: the row each colour is in NH's files), its stem the green row
const FLOWER: Record<string, [model: string, grdFile: Record<string, string>, petal: string, rows: Record<string, number>]> = {
  tulips: ['Tulip', { mFlowerTulip: 'Color00', Body: 'Color01' }, 'mFlowerTulip', { white: 0, red: 1, pink: 2, yellow: 3, orange: 4, purple: 5, black: 6 }],
  roses: ['Rose', { Petal: 'PetalGrd', Leaf: 'LeafGrd' }, 'Petal', { red: 0, blue: 1, pink: 2, black: 3, purple: 4, orange: 5, white: 6, yellow: 7 }],
  cosmos: ['Cosmos', { Flower: 'Color00', Body: 'Color01' }, 'Flower', { white: 0, pink: 1, red: 2, orange: 3, yellow: 4, black: 5 }],
  hyacinths: ['Hyacinth', { Petal: 'PetalGrd', Leaf: 'LeafGrd' }, 'Petal', { red: 0, white: 1, yellow: 2, pink: 3, orange: 4, blue: 5, purple: 6 }],
  mums: ['Mum', { Flower: 'FlowerColor', Body: 'BodyColor' }, 'Flower', { yellow: 0, red: 1, white: 2, pink: 3, purple: 4, green: 5 }],
  pansies: ['Pansy', { Flower: 'Color00', Body: 'Color01' }, 'Flower', { white: 0, red: 1, yellow: 2, orange: 3, purple: 4, blue: 5 }],
  lilies: ['Yuri', { mFlowerYuri: 'Color00', Body: 'Color01' }, 'mFlowerYuri', { yellow: 0, white: 1, red: 2, pink: 3, orange: 4, black: 5 }],
  windflowers: ['Anemone', { Flower: 'Color00', Body: 'Color01' }, 'Flower', { red: 0, white: 1, orange: 2, blue: 3, purple: 4, pink: 5 }]
};
const FLOWER_KEYS = readdirSync(join(import.meta.dirname, '..', 'static', 'art', 'flowers')).map((f) => f.replace(/\.webp$/, ''));
const flowers = FLOWER_KEYS.map((id): AssetJob => {
  const [colour, kind] = id.split(/-(.+)/) as [string, string];
  const [m, grdFile, petal, rows] = FLOWER[kind];
  if (rows[colour] === undefined) throw new Error(`no gradient row for flowers/${id}`);
  const body = Object.keys(grdFile)[1];
  return {
    name: `flowers/${id}`, parts: [[`PltFlw${m}`, `PltFlw${m}2`]], maxTex: 128, grdFile, grdRows: { [petal]: row(rows[colour]), [body]: 5 / 11 },
    alias: { mHyacinthLeafGrd: 'mHyacinthLeaf', mHyacinthPetalGrd: 'mHyacinthPetal' }, uses: [{ key: `flowers/${id}`, cat: 'flower', s: DECOR_U }]
  };
});

// the bushes in bloom (stage 3; the colour a row of the flowers' gradient: scripts/models.ts's rows), and in winter
// NH's snowy bush (the plumeria's own: below)
const BUSH = [
  ['white-azalea', 'Azalea', 'Petal', 0.03, 2], ['pink-azalea', 'Azalea', 'Petal', 0.09, 2],
  ['red-hibiscus', 'Hibiscus', 'Flow', 0.03, 2], ['yellow-hibiscus', 'Hibiscus', 'Flow', 0.09, 2],
  ['blue-hydrangea', 'Hydrangea', 'Petal', 0.03, 2], ['pink-hydrangea', 'Hydrangea', 'Petal', 0.09, 2],
  ['yellow-tea-olive', 'Osmanthus', 'Flow', 0.03, 2], ['orange-tea-olive', 'Osmanthus', 'Flow', 0.09, 2],
  ['red-camellia', 'Camellia', 'Flow', 0.03, 2], ['pink-camellia', 'Camellia', 'Flow', 0.09, 2],
  ['holly', 'Holly', 'Flow', 0.03, 4]
] as const;
/** The POC's bushes (models.json): the same conversion, kept where they are. */
const POC_BUSH = new Set(['holly', 'white-azalea', 'pink-azalea', 'red-hibiscus', 'orange-tea-olive']);
const bushes: AssetJob[] = BUSH.flatMap(([id, sp, part, r, snow]): AssetJob[] => [
  ...(POC_BUSH.has(id) ? [] : [{ name: `bushes/${id}`, parts: [[`PltBush${sp}`, `PltBush${sp}3`]], grdRows: { [part]: r }, uses: [{ key: `bushes/${id}`, cat: 'bush', s: DECOR_U, winter: `bushes/${id}-winter` }] } as AssetJob]),
  { name: `bushes/${id}-winter`, parts: [[`PltBush${sp}Snow`, `PltBush${sp}${snow}Snow`]], snow: true, uses: [{ key: `bushes/${id}-winter`, cat: 'bush', s: DECOR_U }] }
]);

// NH's plumeria (PltBushPlumeria, in bloom), its petals' gradient rows white (0) and pink (1) (the file is NH's own
// misspelt `PetalColer`, so named here); in winter its one snowy look, the flowers gone, for both
bushes.push(
  ...([['white', 0], ['pink', 1]] as const).map(([c, r]): AssetJob => ({
    name: `bushes/${c}-plumeria`, parts: [['PltBushPlumeria', 'PltBushPlumeria3']], grdFile: { Flow: 'PltBushPlumeriaPetalColer' }, grdRows: { Flow: row(r) },
    uses: [{ key: `bushes/${c}-plumeria`, cat: 'bush', s: DECOR_U, winter: 'bushes/plumeria-winter' }]
  })),
  { name: 'bushes/plumeria-winter', parts: [['PltBushPlumeriaSnow', 'PltBushPlumeria2Snow']], snow: true, uses: [{ key: 'bushes/plumeria-winter', cat: 'bush', s: DECOR_U }] }
);

// the trees' winter looks (NH's snowy trees: the snow drawn)
const trees: AssetJob[] = ([['oak', 'Oak', 0.5], ['cedar', 'Cedar', 0.3], ['palm', 'Palm', 0.5], ['bamboo', 'Bamboo', 0.5]] as const).map(([id, t, r]) => ({
  name: `trees/${id}-winter`, parts: [[`PltTree${t}Snow`, `PltTree${t}4Snow`]], snow: true, grdRow: r, uses: [{ key: `trees/${id}-winter`, cat: 'tree', s: DECOR_U }]
}));

// the fixed decor and the seasons' pieces (scripts/models.ts: NH's outdoor furniture at the decorations' scale)
const deco = (id: string, model: string, tex: string[] = [], extra: Partial<AssetJob> = {}, use: Partial<Use> = {}): AssetJob => ({
  name: `deco/${id}`, parts: one(model), tex, ...extra,
  uses: [{ key: `deco/${id}`, cat: 'deco', s: DECOR_U, ...use }, ...(LIT.has(id) ? [{ key: `deco/${id}-lit`, cat: 'deco', s: DECOR_U, ...use } as Use] : [])]
});
const decos: AssetJob[] = [
  deco('pond-stone-sakura', 'FtrStonewaterbowlSakura'), deco('pond-stone-maple', 'FtrStonewaterbowlAutumun'),
  deco('picnic-set', 'FtrSakuraPicnicset'), deco('bamboo-shoot-lamp', 'FtrBambooshootLamp'),
  deco('mushroom-lamp', 'FtrMushroomLamp', ['FtrMushroomLampReBody0']), deco('nut-lamp', 'FtrNutLamp', ['FtrNutLampReBody0']),
  deco('beach-chair', 'FtrBeachbed', ['FtrBeachbedReBody2']), deco('sandcastle', 'FtrSandcastle', ['FtrSandcastleReBody0']),
  deco('illumi-tree', 'FtrIllumiTree', ['FtrIllumiTreeReBody0']), deco('kadomatsu', 'FtrKadomatsu'), deco('egg-arch', 'FtrEggArch'),
  deco('shishiodoshi-tip', 'FtrShishiodoshi', ['FtrShishiodoshiReBody0'], { pose: { Shishiodoshi: [35, 0, 0] } }),
  // the snowboy (NH's snowball body, its face on top) and its three days of melting
  ...([['SnowBall', 8.5, 0.75], ['SnowBall1Day', 7.5, 0.7], ['SnowBall2Day', 5.5, 0.62], ['SnowBall3Day', 3, 0.5]] as const).map(([body, up, k], i): AssetJob => ({
    name: `deco/snowboy-${i}`, parts: [[body, body], ['SnowBallFaceC', 'SnowBallFaceC', [up, k]]], noAo: true, uses: [{ key: `deco/snowboy-${i}`, cat: 'deco', s: DECOR_U }]
  })),
  // the campsite's tent in the snow
  { name: 'deco/campsite-winter', parts: [['StrcCampsiteTentA00', 'StrcCampsiteTentA00'], ['StrcCampsiteTentA00', 'StrcCampsiteTentA00Door0']], snow: true, maxTex: 512, tris: 8000, uses: [{ key: 'deco/campsite-winter', cat: 'deco', s: DECOR_U }] },
  { name: 'bridges/stone-winter', parts: [['BridgeStone', 'BridgeStone03']], snow: true, tris: 8000, uses: ['deck', 'front'].map((p): Use => ({ key: `bridges/stone-${p}-winter`, cat: 'scenery', s: 1.18 })) }
];

// the decorations (island/decor.ts: もようがえ), one model each in its first colour, turned for its four facings
const DECOR: [string, string][] = [
  ['stone-lantern', 'FtrStonelantern'], ['birdbath', 'FtrBirdbus'], ['garden-wagon', 'FtrGardenwagon'], ['iron-table', 'FtrIrongardenTable'],
  ['iron-chair', 'FtrIrongardenChair'], ['brick-well', 'FtrWellBrick'], ['tanuki', 'FtrOrnamentTanuki'], ['monstera', 'FtrPlantMonstera'],
  ['signpost', 'FtrSignpost'], ['wheelbarrow', 'FtrHandcart'],
  // the gym (もようがえ's ジム tab: layout/catalog.ts group 'gym'), NH's fitness furniture
  ['weight-bench', 'FtrPressBench'], ['exercise-bike', 'FtrExercisebike'], ['treadmill', 'FtrRunningmachine'], ['punching-bag', 'FtrSandbag'],
  ['exercise-ball', 'FtrBalanceball'], ['barbell', 'FtrBarbell'], ['kettlebell', 'FtrKettlebell'], ['protein-shaker', 'FtrProtein'],
  ['water-cooler', 'FtrWaterserver'], ['digital-scale', 'FtrWeightscale'], ['climbing-wall', 'FtrClimbingwall'], ['upright-locker', 'FtrLocker']
];
// the packs (docs/design.md "Decorating"): the もようがえ's キャンプ, たべもの and more of the ジム, NH's camp goods,
// food and fitness furniture, a GLB a tab (static/ stays under Pages' file cap: a few files, not three an item), each
// member as a decoration (its four facings' keys `decor/<id>-<f>`, its model `decor/<id>`). [id, NH's model, its texture
// colour folders (default its ReBody0 and ReFabric0), longest texture side]
type Member = [id: string, model: string, tex?: string[], maxTex?: number];
const PACKS: Record<string, Member[]> = {
  'decor/camp': [
    ['small-campfire', 'FtrBonfire'], ['fire-pit', 'FtrFirepit'], ['lantern', 'FtrLantern'], ['camping-cot', 'FtrCampbed'],
    ['sleeping-bag', 'FtrSleepingbag'], ['kids-tent', 'FtrCrsTent'], ['cooler-box', 'FtrCoolerbox'], ['barbecue', 'FtrBarbecuegrill'],
    ['camp-stove', 'FtrKocher'], ['folding-chair', 'FtrOutdoorChair'], ['folding-table', 'FtrOutdoorTable'], ['outdoor-bench', 'FtrOutdoorchairM'],
    ['outdoor-table', 'FtrOutdoortableM'], ['directors-chair', 'FtrDirectorchair'], ['utility-wagon', 'FtrOutdoorCarry'],
    ['water-jug', 'FtrWaterjug', undefined, 128], ['simple-kettle', 'FtrKettle', undefined, 128], ['portable-radio', 'FtrPortableradio', undefined, 128],
    ['angled-signpost', 'FtrSignpostTilt'], ['destinations-signpost', 'FtrSignpostWorld']
  ],
  'decor/food': [
    ['picnic-basket', 'FtrPicnicbasket'], ['fruit-basket', 'FtrFruitbasket'], ['bread', 'FtrBreadbasket'], ['sandwich-set', 'FtrBucketsandset'],
    ['campfire-cookware', 'FtrMesstin'], ['stewpot', 'FtrStockpot'], ['frying-pan', 'FtrPan'], ['seafood-ajillo', 'FtrSkilletSeafood'],
    ['grilled-sea-bass', 'FtrFishdishBass'], ['western-meal', 'FtrCuisineWestern'], ['japanese-meal', 'FtrCuisineJapan'],
    ['bottled-beverage', 'FtrBottlePlastic'], ['coconut-juice', 'FtrCoconutjuice'], ['cookies', 'FtrCookiePlain']
  ].map(([id, m]): Member => [id, m, undefined, 128]),
  'decor/gym2': [
    ['yoga-mat', 'FtrYogamat'], ['nook-yoga-mat', 'FtrYogamatExercise'], ['speed-bag', 'FtrSpeedbag'], ['massage-chair', 'FtrMassagechair'],
    ['dumbbell', 'ToolDumbbell', [], 128]
  ],
  // the キャンプ tab's second file (camp.glb near its 400 KB): NH's camp kitchen (the table with its burner), the
  // site's power, water, washing line, fires and pots
  'decor/camp2': [
    ['outdoor-kitchen', 'FtrOutdoorKitchen'], ['outdoor-generator', 'FtrOutdoorgenerator'], ['plastic-canister', 'FtrPolytank', undefined, 128],
    ['clothesline', 'FtrClothesline'], ['clothesline-pole', 'FtrClotheshorse'], ['leaf-campfire', 'FtrFallenleavesfire'],
    ['oil-barrel-bathtub', 'FtrDrumcanbath'], ['smoker', 'FtrSmoker'], ['lawn-chair', 'FtrVinylchair'],
    ['kettle', 'FtrKettleJapan', [], 128], ['espresso-maker', 'FtrEspressomaker', undefined, 128], ['wooden-bucket', 'FtrBucketWood', [], 128],
    ['tin-bucket', 'FtrBucket', [], 128]
  ]
};
// (NH's おはなみセット, converted already with the fixed decor: the たべもの tab's too, its facings' keys on its model)
decos.find((j) => j.name === 'deco/picnic-set')!.uses.push({ key: 'decor/picnic-set-0', cat: 'decor', s: DECOR_U });
const packs = Object.entries(PACKS).map(([name, ms]): AssetJob => ({
  name, parts: [], uses: [],
  pack: ms.map(([id, model, tex, maxTex]) => ({
    id, parts: one(model), tex: tex ?? ftrTex(model), ...(maxTex ? { maxTex } : {}),
    // (its facing 0's key only: the island turns it by its facing, world3d/objects.ts; the first load's bytes)
    uses: [{ key: `decor/${id}-0`, cat: 'decor', s: DECOR_U }]
  }))
}));

/** A decoration's part lifted out of its one mesh, its own node (the same material): the weight bench's barbell, its bar,
 *  plates and collars (the mesh's pieces wholly above 10 model units: the rack's uprights reach the ground), lifted off
 *  the rack and pressed by whoever lies on it (world3d/benchBar.ts). */
const SPLIT: Record<string, AssetJob['split']> = { 'weight-bench': { name: 'bar', above: 10 } };
const decor = DECOR.map(([id, model]): AssetJob => ({
  name: `decor/${id}`, parts: one(model), tex: ftrTex(model), ...(SPLIT[id] ? { split: SPLIT[id] } : {}), uses: [0, 1, 2, 3].map((f): Use => ({ key: `decor/${id}-${f}`, cat: 'decor', s: DECOR_U, yaw: f * 90 }))
}));

// the events: Halloween (the pumpkin by day, the spooky lantern lit at night), the birthday's cake and popper, the
// wedding's arch, the New Year's countdown board (its stall and its display: the display's digits are NH's lit
// textures), the balloons' presents (above)
const ev = (id: string, parts: AssetJob['parts'], extra: Partial<AssetJob> = {}, use: Partial<Use> = {}): AssetJob => ({
  name: `events/${id}`, parts, ...extra, uses: [{ key: `deco/${id}`, cat: 'event', s: DECOR_U, lazy: 'event', ...use }]
});
const events: AssetJob[] = [
  ev('pumpkin', one('UnitIconPltVgtPumpkin'), { grdRow: row(0), maxTex: 128 }, { h: 22 }),
  ev('spooky-lantern', one('FtrHwnLantern'), { tex: ftrTex('FtrHwnLantern') }),
  ev('birthday-cake', one('FtrBirthdayCake'), { tex: ftrTex('FtrBirthdayCake') }),
  ev('party-popper', one('ToolCracker'), { maxTex: 128 }, { h: 18 }),
  ev('wedding-arch', one('FtrWeddingArch'), { tex: ftrTex('FtrWeddingArch'), tris: 6000 }),
  // (the stall's board and balloons without its cart and its string of lights, the display moved into the board's frame,
  // the board at the origin)
  ev('countdown-board', [['EvtobjCountdownStall', 'EvtobjCountdownStall', [0, 1, 25, 0]], ['EvtobjCountdownBoard', 'EvtobjCountdownBoard', [0, 1, -15, 7.5]]], {
    maxTex: 512, tris: 6000,
    // the display: NH's big digits in their ring (its clock's small digits and its scrolling greeting overlap them: hidden)
    hide: ['mEvtCountdownYatai01', 'mEvtCountdownDenshoku', 'mCountdownDisplayScroll', ...['10H', '10M', '10S', '1H', '1M', '1S', 'Colon'].map((n) => `mCountdownSmall${n}`)],
    alias: { mEvtCountdownFusen: 'mEvtCountdownFusen01', mCountdownBig: 'mEvtCowntdownBoard_NumberBig', mCountdownCircle: 'mEvtCowntdownBoard_Circle' }
  }, { key: 'deco/countdown-board' })
];

// (the visitors are NH's skinned special characters, posed at runtime as the villagers are: scripts/villagers3d-models.ts)

// the island's bulletin board (docs/board.md): NH's board outside Resident Services (EvtobjBbs: its cork face at model
// x −6.85…6.80, y 3.49…13.52, z +0.30 once centred), centred on its origin, in winter its snow; the bird that perches on
// it, by day (BbsBirdDay) and by night (BbsBirdNight, an owl), its wings folded. All at the board's scale: 60u tall.
const BOARD_S = 3.5;
const board: AssetJob[] = [
  { name: 'deco/bulletin-board', parts: [['EvtobjBbs', 'EvtobjBbs', [0, 1, -8.277, -4.203]]], maxTex: 512, uses: [{ key: 'deco/bulletin-board', cat: 'deco', s: BOARD_S, winter: 'deco/bulletin-board-winter' }] },
  { name: 'deco/bulletin-board-winter', parts: [['EvtobjBbs', 'EvtobjBbs', [0, 1, -8.277, -4.203]]], maxTex: 512, snow: true, uses: [{ key: 'deco/bulletin-board-winter', cat: 'deco', s: BOARD_S }] },
  { name: 'deco/bbs-bird-day', parts: one('BbsBirdDay'), maxTex: 128, pose: { Arm_1_L: [0, 0, 78], Arm_1_R: [0, 0, 78] }, uses: [{ key: 'deco/bbs-bird-day', cat: 'deco', s: BOARD_S }] },
  { name: 'deco/bbs-bird-night', parts: one('BbsBirdNight'), maxTex: 128, pose: { Arm_1_L: [0, 0, 100], Arm_1_R: [0, 0, 100] }, uses: [{ key: 'deco/bbs-bird-night', cat: 'deco', s: BOARD_S }] }
];
// the effects: the seasons' falling leaves, petals and snowflakes (NH's own: the ones a net catches), and the
// stylised ones NH has no model for (scripts/world3d-fx.ts), their size the 2D's (u: the longest side)
const fxs: AssetJob[] = [
  { name: 'fx/maple-leaf', parts: one('InsectAutumnLeaf'), maxTex: 64, uses: [{ key: 'season/maple-leaf', cat: 'fx', h: 8, flat: true, anchor: 'centre' }] },
  { name: 'fx/petal', parts: one('InsectSakurapetal'), maxTex: 64, uses: [{ key: 'season/petal', cat: 'fx', h: 7, flat: true, anchor: 'centre' }] },
  { name: 'fx/snowflake', parts: one('InsectSnowCrystal'), maxTex: 64, uses: [{ key: 'season/snowflake', cat: 'fx', h: 7, flat: true, anchor: 'centre' }] },
  ...([['sparkle', 12], ['bang', 27], ['dust', 14], ['splash', 18], ['ripple', 18], ['zzz', 14], ['sweat', 8], ['confetti', 16], ['flame', 14], ['lily-pad', 12]] as const).map(([fx, h]): AssetJob => ({
    name: `fx/${fx}`, parts: [], fx, uses: [{ key: `fx/${fx}`, cat: 'fx', h, flat: true, anchor: ['dust', 'splash', 'ripple', 'flame', 'lily-pad'].includes(fx) ? 'feet' : 'centre' }]
  })),
  // NH's heart and music note (its item icons: a love letter's heart, a song's note), for the emotes over a character
  { name: 'fx/heart', parts: one('UnitIconLove'), maxTex: 64, uses: [{ key: 'fx/heart', cat: 'fx', h: 10, flat: true, anchor: 'centre' }] },
  { name: 'fx/note', parts: one('UnitIconMusic'), maxTex: 64, uses: [{ key: 'fx/note', cat: 'fx', h: 10, flat: true, anchor: 'centre' }] }
];

// the tools a villager holds (NH's wooden ones: the plain ones' textures aren't in the files): the bug net, the rod and
// its bobber (the rod's own float: the line between them is the runtime's, a line), at the villagers' scale (the shovel
// and the watering can are the finds')
const tools: AssetJob[] = [
  { name: 'tools/net', parts: one('ToolNetWood'), maxTex: 128, uses: [{ key: 'tools/net', cat: 'tool', s: VILLAGER_S, anchor: 'joint' }] },
  { name: 'tools/rod', parts: [['ToolFishingrodWood', 'Main']], maxTex: 128, uses: [{ key: 'tools/rod', cat: 'tool', s: VILLAGER_S, anchor: 'joint' }] },
  { name: 'tools/bobber', parts: [['ToolFishingrodWood', 'Sub']], maxTex: 64, uses: [{ key: 'tools/bobber', cat: 'tool', s: VILLAGER_S, anchor: 'centre' }] }
];
// the birthday's accessories (birthday.ts HATS: the birthday person's pink hat, the partner's blue; NH's party glasses
// with their nose), at the villagers' scale, their origin NH's head joint
const accessories: AssetJob[] = [
  ...([['pink', 'CapHatBirthday0'], ['blue', 'CapHatBirthday1']] as const).map(([c, m]): AssetJob => ({ name: `accessories/birthday-hat-${c}`, parts: one(m), maxTex: 128, uses: [{ key: `deco/birthday-hat-${c}`, cat: 'accessory', s: VILLAGER_S, anchor: 'joint', lazy: 'event' }] })),
  { name: 'accessories/party-glasses', parts: one('AccessoryGlassBirthday0'), maxTex: 128, uses: [{ key: 'accessories/party-glasses', cat: 'accessory', s: VILLAGER_S, anchor: 'joint', lazy: 'event' }] }
];

export const ASSETS: AssetJob[] = [...bugs, ...fish, ...sea, ...shadows, ...finds, ...flowers, ...bushes, ...trees, ...decos, ...decor, ...packs, ...events, ...board, ...fxs, ...tools, ...accessories];

/** The POC's models (models.json: static/room/world3d/<name>.glb) serving the island's keys as they are. */
export const POC_USES: [string, Use[]][] = [
  ['oak-summer', [{ key: 'trees/oak-summer', cat: 'tree', s: DECOR_U, winter: 'trees/oak-winter' }]],
  ['oak-fall', [{ key: 'trees/oak-fall', cat: 'tree', s: DECOR_U, winter: 'trees/oak-winter' }]],
  ['oak-spring', [{ key: 'trees/oak-spring', cat: 'tree', s: DECOR_U, winter: 'trees/oak-winter' }]],
  ['cedar', [{ key: 'trees/cedar', cat: 'tree', s: DECOR_U, winter: 'trees/cedar-winter' }]],
  ['palm', [{ key: 'trees/palm', cat: 'tree', s: DECOR_U, winter: 'trees/palm-winter' }]],
  ['bamboo', [{ key: 'trees/bamboo', cat: 'tree', s: DECOR_U, winter: 'trees/bamboo-winter' }]],
  ...[...POC_BUSH].map((id): [string, Use[]] => [`bush-${id}`, [{ key: `bushes/${id}`, cat: 'bush', s: DECOR_U, winter: `bushes/${id}-winter` }]]),
  ...(['apple', 'cherry', 'peach', 'pear'] as const).map((f): [string, Use[]] => [`fruit-${f}`, [{ key: `fruit/${f}`, cat: 'fruit', h: 24 }]]),
  ['rock', [{ key: 'finds/rock', cat: 'find', h: 26 }]],
  ['garden-rock', [{ key: 'deco/garden-rock', cat: 'deco', s: DECOR_U }]],
  ['flat-rock', [{ key: 'deco/flat-rock', cat: 'deco', s: DECOR_U }]],
  ['bridge-stone', ['deck', 'front'].map((p): Use => ({ key: `bridges/stone-${p}`, cat: 'scenery', s: 1.18, winter: `bridges/stone-${p}-winter` }))],
  ['tent', [{ key: 'deco/campsite', cat: 'deco', s: DECOR_U, winter: 'deco/campsite-winter' }, { key: 'deco/campsite-lit', cat: 'deco', s: DECOR_U }]],
  ...(['streetlamp', 'garden-lantern', 'garden-lantern-white', 'campfire', 'log-stool', 'campsite-sign', 'park-bench', 'log-bench', 'rod-stand', 'hammock', 'firewood', 'pullup', 'pump', 'shishiodoshi'] as const)
    .map((id): [string, Use[]] => [id, [{ key: `deco/${id}`, cat: 'deco', s: DECOR_U }, ...(LIT.has(id) ? [{ key: `deco/${id}-lit`, cat: 'deco', s: DECOR_U } as Use] : [])]]),
  // group stretching's boom box at the villagers' scale, as NH has it beside them (the user: "super tiny" at DECOR_U)
  ['tape-deck', [{ key: 'deco/tape-deck', cat: 'deco', s: VILLAGER_S }]]
];

// ---- the manifest --------------------------------------------------------------------------------------------------

interface Meta { min: number[]; max: number[]; tris: number; kb: number; v: string; lit?: 1 }
/** A model's budget (KB) by kind: the unit test holds every file to it (src/lib/components/world3d/assets.test.ts). */
const BUDGET_KB: Record<Cat, number> = {
  bug: 40, fish: 40, shadow: 4, sea: 40, find: 30, fruit: 30, flower: 24, bush: 90, tree: 160, deco: 120, decor: 120, event: 160, scenery: 200, fx: 30, tool: 40, accessory: 40
};
/** The tile (u): docs/island-layout.md. */
const TILE = 30;
const CATS_WITH_FOOT = new Set<Cat>(['bush', 'tree', 'deco', 'decor', 'event', 'scenery']);

/** assets.json: the models (bounds in model units, triangles, KB, content hash; under static/room/world3d/<name>.glb)
 *  and per art key: its model, kind, scale, anchor, footprint (tiles, unturned), hit radius (u), shadow, lit (an
 *  emissive for the night), its winter look, its facing, how it loads. */
export function writeAssets(file: string, metas: Record<string, Meta>, poc: Record<string, Meta>, pocUses: [string, Use[]][], jobUses: (readonly [string, Use[]])[]) {
  const models: Record<string, Meta> = {};
  const keys: Record<string, Record<string, unknown>> = {};
  for (const [m, uses] of [...pocUses.filter(([m]) => poc[m]), ...jobUses.filter(([m]) => metas[m])]) {
    const meta = metas[m] ?? poc[m];
    models[m] = meta;
    const [dx, dy, dz] = meta.max.map((n, i) => n - meta.min[i]);
    // (a pack's member's one key is assets.ts packKey's, not written: the first load's bytes)
    if ((meta as { pack?: string }).pack) continue;
    for (const u of uses) {
      const s = +(u.h ? u.h / Math.max(dx, dy, dz) : u.s ?? 3).toFixed(3);
      const turned = u.yaw === 90 || u.yaw === 270;
      const [w, d] = turned ? [dz, dx] : [dx, dz];
      keys[u.key] = {
        m, cat: u.cat, s, anchor: u.anchor ?? 'feet',
        ...(CATS_WITH_FOOT.has(u.cat) ? { foot: [Math.max(1, Math.ceil((dx * s) / TILE - 0.2)), Math.max(1, Math.ceil((dz * s) / TILE - 0.2))] } : {}),
        hit: Math.max(12, Math.round((Math.max(w, d) * s) / 2)),
        shadow: !u.flat && u.cat !== 'shadow',
        ...(meta.lit ? { lit: 1 } : {}), ...(u.yaw ? { yaw: u.yaw } : {}), ...(u.winter ? { winter: u.winter } : {}),
        ...(u.lazy ? { lazy: u.lazy } : {}), ...(u.standIn ? { standIn: 1 } : {})
      };
    }
  }
  for (const k of Object.values(keys)) if (k.winter && !keys[k.winter as string]) delete k.winter;
  const sorted = <T>(o: Record<string, T>) => Object.entries(o).sort(([a], [b]) => a.localeCompare(b));
  const kb: Partial<Record<Cat, number>> = {};
  const catOf = new Map(Object.values(keys).map((k) => [k.m as string, k.cat as Cat]));
  for (const [m, meta] of Object.entries(models)) {
    const c = catOf.get(m) ?? 'decor';
    kb[c] = +((kb[c] ?? 0) + meta.kb).toFixed(1);
  }
  writeFileSync(file, `{
  "_": "scripts/world3d-models.ts (scripts/world3d-assets.ts): the island's NH models (docs/world3d-assets.md). models: under static/room/world3d/<name>.glb, bounds in model units, triangles, KB, content hash, lit (an emissive). keys: an art key → its model (m), kind, scale (u per model unit), anchor (feet: the origin on the ground; centre: the bounds' centre), footprint (tiles, unturned), hit radius (u), shadow, lit, yaw (degrees), winter (the key of its winter look), lazy (loaded with its group), standIn (no NH model of its own)",
  "budgetKb": ${JSON.stringify(BUDGET_KB)},
  "kb": ${JSON.stringify(Object.fromEntries(sorted(kb)))},
  "models": {
${sorted(models).map(([k, m]) => `    ${JSON.stringify(k)}: ${JSON.stringify(m)}`).join(',\n')}
  },
  "keys": {
${sorted(keys).map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n')}
  }
}
`);
}

// ---- the inventory (docs/world3d-assets.md) --------------------------------------------------------------------------

/** The island's art without a model of its own (a key or a group `<group>/*`) and why: it stays a billboard (or 2D). */
const NO_MODEL: [string, string][] = [
  ['villagers/*', 'not here: the villagers and the visitors are skinned models of their own (scripts/villagers3d-models.ts); a villager with none is its card'],
  ['trees/*-canopy, trees/*-trunk', '2D only: the 2D oak’s two layers; the 3D tree is one model'],
  ['reactions/*', 'billboard: the villagers’ emotes'],
  ['fx/* (sparkle, bang, dust, splash, ripple)', 'not NH’s: NH’s files have no effect models (no Eff*/Emo*), so these are stylised meshes in the 2D’s colours (scripts/world3d-fx.ts)'],
  ['deco/airport', 'not on the island: the pairing page’s map icon'],
  ['host/*, items/snack, items/dinner, money/*', 'not on the island: the panels’ and the HUD’s art'],
  ['finds/items/*, finds/recipes/*', 'not on the island: the balloon catalogue’s icons, on the catch plate'],
  ['deco/tape-deck', 'approximate: NH’s boom box (FtrRadicase) stands for the tape deck (the POC’s)'],
  ['finds/shovel, finds/watering-can', 'approximate: NH’s wooden shovel and watering can (the plain ones’ textures aren’t in the files)']
];

/** The inventory's summary, between the doc's markers: per kind its keys, models, KB and loading; the art with no model. */
export function writeDoc(file: string, assets: string) {
  const A = JSON.parse(readFileSync(assets, 'utf8')) as { kb: Record<string, number>; models: Record<string, Meta>; keys: Record<string, { m: string; cat: Cat; s: number; anchor: string; foot?: number[]; hit: number; lit?: 1; winter?: string; lazy?: string; standIn?: 1; yaw?: number }> };
  const byCat = new Map<Cat, [string, (typeof A.keys)[string]][]>();
  for (const e of Object.entries(A.keys)) (byCat.get(e[1].cat) ?? byCat.set(e[1].cat, []).get(e[1].cat)!).push(e);
  const total = Object.values(A.models).reduce((n, m) => n + m.kb, 0);
  const lines = [
    `${Object.keys(A.keys).length} keys, ${Object.keys(A.models).length} models, ${(total / 1024).toFixed(2)} MB in all.`, '',
    '| kind | keys | models | KB | loads |', '| --- | --- | --- | --- | --- |',
    ...[...byCat].map(([c, ks]) => `| ${c} | ${ks.length} | ${new Set(ks.map(([, k]) => k.m)).size} | ${A.kb[c] ?? 0} | ${ks[0][1].lazy ? `lazily (${ks[0][1].lazy})` : 'with the island'} |`), ''
  ];
  lines.push('### No model of its own', '', '| keys | status |', '| --- | --- |', ...NO_MODEL.map(([k, why]) => `| ${k} | ${why} |`));
  const doc = readFileSync(file, 'utf8');
  const [a, b] = ['<!-- assets:start -->', '<!-- assets:end -->'];
  writeFileSync(file, `${doc.slice(0, doc.indexOf(a) + a.length)}\n${lines.join('\n')}\n${doc.slice(doc.indexOf(b))}`);
}
