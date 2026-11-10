// The island's outdoor catalogue (docs/island-layout.md "The outdoor catalogue"): the rooms' pieces that NH lets one
// put outdoors (the ACNH spreadsheet's `outdoor`, 415 housewares and miscellaneous pieces) and the 36 gyroids, but those
// the editor already has as kinds of its own (IN_EDITOR, by NH's model file), sorted into the editor's tabs by NH's
// `tag` (TAB_OF). Each piece is the room's own conversion (tent/items.json, more.json: its model, loose or packed, its
// footprint, height, surface, emitter; its seat, villager3d/seats3d.json or tent/seats-more.json; its names, i18n/tent.*
// .json, NH's own): nothing is converted again, so a piece is the same indoors and out. Writes
// src/lib/layout/outdoor.json (loaded by layout/outdoor.ts only when the island has one of them or the editor opens).
// Reads the spreadsheet's JSON as scripts/room-models.ts caches it (the OS temp dir; fetched when missing).
//   node scripts/outdoor-catalog.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { KIND_LIST } from '../src/lib/layout/catalog.ts';

const APP = join(import.meta.dirname, '..');
const TENT = join(APP, 'src', 'lib', 'components', 'tent');
const OUT = join(APP, 'src', 'lib', 'layout', 'outdoor.json');
const SHEET = 'https://raw.githubusercontent.com/Norviah/animal-crossing/master/json/data/';
const CACHE = join(tmpdir(), 'island-catalog-src');

/** The editor's tabs for the catalogue (layout/catalog.ts groups; the new ones last), by NH's tag. */
const TAB_OF: Record<string, string> = {
  Lamp: 'light',
  Chair: 'furniture', Sofa: 'furniture', Table: 'furniture', Bed: 'furniture', Kitchen: 'furniture', Bathtub: 'furniture', Chest: 'furniture',
  Desk: 'furniture', 'Work Bench': 'furniture', Toilet: 'furniture', Fan: 'furniture', Office: 'furniture', Study: 'furniture',
  'Bathroom Things': 'furniture', 'Kitchen Things': 'furniture',
  DishFood: 'food', DishDrink: 'food', Dining: 'food',
  Ranch: 'camp',
  Garden: 'garden', Plants: 'garden', 'Japanese Style': 'garden', Animal: 'garden',
  Playground: 'park', Sports: 'park', 'Facility Decor': 'park', Shop: 'park', Audio: 'park', 'Musical Instrument': 'park',
  Vehicle: 'town', Supplies: 'town', Screen: 'town', Arch: 'town',
  Seaside: 'beach',
  'Folk Craft Decor': 'statue', Space: 'statue', Toy: 'statue', Mario: 'statue', Kerokerokeroppi: 'statue', Cinnamoroll: 'statue',
  'Seasonal Decor': 'event', Easter: 'event'
};
/** The tabs' order (each tab's pieces by NH's tag, then series, then name). */
const TABS = ['light', 'furniture', 'camp', 'food', 'garden', 'park', 'town', 'beach', 'statue', 'event', 'gyroid'];
/** NH's model files the editor's own kinds are drawn from (scripts/world3d-assets.ts, models.ts, world3d-models.ts):
 *  the same piece, never twice. Kind → NH file. */
const IN_EDITOR: Record<string, string> = {
  streetlamp: 'FtrStreetlamp', 'garden-lantern': 'FtrLampGarden', campfire: 'FtrCampfire', 'log-stool': 'FtrLogStoolS',
  'campsite-sign': 'FtrCompassSignCamp', 'park-bench': 'FtrParkbenche', 'log-bench': 'FtrLogSofaL', hammock: 'FtrHammock',
  'rod-stand': 'FtrRodstand', pump: 'FtrHandpump', shishiodoshi: 'FtrShishiodoshi', firewood: 'FtrFirewood', 'tape-deck': 'FtrRadicase',
  'garden-rock': 'FtrGardenrock', 'flat-rock': 'FtrGardenrockLow', pullup: 'FtrPullupstand',
  'beach-chair': 'FtrBeachbed', sandcastle: 'FtrSandcastle',
  'stone-lantern': 'FtrStonelantern', birdbath: 'FtrBirdbus', 'garden-wagon': 'FtrGardenwagon', 'iron-table': 'FtrIrongardenTable',
  'iron-chair': 'FtrIrongardenChair', 'brick-well': 'FtrWellBrick', tanuki: 'FtrOrnamentTanuki', monstera: 'FtrPlantMonstera',
  signpost: 'FtrSignpost', wheelbarrow: 'FtrHandcart',
  'weight-bench': 'FtrPressBench', 'exercise-bike': 'FtrExercisebike', treadmill: 'FtrRunningmachine', 'punching-bag': 'FtrSandbag',
  'exercise-ball': 'FtrBalanceball', barbell: 'FtrBarbell', kettlebell: 'FtrKettlebell', 'protein-shaker': 'FtrProtein',
  'water-cooler': 'FtrWaterserver', 'digital-scale': 'FtrWeightscale', 'climbing-wall': 'FtrClimbingwall', 'upright-locker': 'FtrLocker',
  'small-campfire': 'FtrBonfire', 'fire-pit': 'FtrFirepit', lantern: 'FtrLantern', 'camping-cot': 'FtrCampbed', 'sleeping-bag': 'FtrSleepingbag',
  'kids-tent': 'FtrCrsTent', 'cooler-box': 'FtrCoolerbox', barbecue: 'FtrBarbecuegrill', 'camp-stove': 'FtrKocher',
  'folding-chair': 'FtrOutdoorChair', 'folding-table': 'FtrOutdoorTable', 'outdoor-bench': 'FtrOutdoorchairM', 'outdoor-table': 'FtrOutdoortableM',
  'directors-chair': 'FtrDirectorchair', 'utility-wagon': 'FtrOutdoorCarry', 'water-jug': 'FtrWaterjug', 'simple-kettle': 'FtrKettle',
  'portable-radio': 'FtrPortableradio', 'angled-signpost': 'FtrSignpostTilt', 'destinations-signpost': 'FtrSignpostWorld',
  'outdoor-kitchen': 'FtrOutdoorKitchen', 'outdoor-generator': 'FtrOutdoorgenerator', 'plastic-canister': 'FtrPolytank',
  clothesline: 'FtrClothesline', 'clothesline-pole': 'FtrClotheshorse', 'leaf-campfire': 'FtrFallenleavesfire',
  'oil-barrel-bathtub': 'FtrDrumcanbath', smoker: 'FtrSmoker', 'lawn-chair': 'FtrVinylchair', kettle: 'FtrKettleJapan',
  'espresso-maker': 'FtrEspressomaker', 'wooden-bucket': 'FtrBucketWood', 'tin-bucket': 'FtrBucket',
  'picnic-basket': 'FtrPicnicbasket', 'picnic-set': 'FtrSakuraPicnicset', 'fruit-basket': 'FtrFruitbasket', bread: 'FtrBreadbasket',
  'sandwich-set': 'FtrBucketsandset', 'campfire-cookware': 'FtrMesstin', stewpot: 'FtrStockpot', 'frying-pan': 'FtrPan',
  'seafood-ajillo': 'FtrSkilletSeafood', 'grilled-sea-bass': 'FtrFishdishBass', 'western-meal': 'FtrCuisineWestern',
  'japanese-meal': 'FtrCuisineJapan', 'bottled-beverage': 'FtrBottlePlastic', 'coconut-juice': 'FtrCoconutjuice', cookies: 'FtrCookiePlain',
  'yoga-mat': 'FtrYogamat', 'nook-yoga-mat': 'FtrYogamatExercise', 'speed-bag': 'FtrSpeedbag', 'massage-chair': 'FtrMassagechair'
};

type Raw = Record<string, unknown> & { name: string; variations?: Record<string, unknown>[]; translations?: Record<string, string> | null };
async function sheet(name: string): Promise<Raw[]> {
  mkdirSync(CACHE, { recursive: true });
  const file = join(CACHE, `${name}.json`);
  if (!existsSync(file)) {
    const res = await fetch(SHEET + encodeURIComponent(name) + '.json', { signal: AbortSignal.timeout(120_000) });
    if (!res.ok) throw new Error(`${res.status} ${name}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return JSON.parse(readFileSync(file, 'utf8')) as Raw[];
}
const field = (i: Raw, k: string): unknown => i[k] ?? i.variations?.[0]?.[k];
const base = (file: string) => file.replace(/_Remake_\d+_\d+$/, '');

type Item = Record<string, unknown> & { w: number; d: number; h: number; cat?: string; icon?: 1; pk?: unknown; v?: string; gy?: 1; rug?: 1; wl?: 1; cl?: 1; cr?: string; sm?: 1; s?: 1; u?: string };
const json = (f: string) => JSON.parse(readFileSync(f, 'utf8'));
const items: Record<string, Item> = { ...json(join(TENT, 'items.json')).items, ...json(join(TENT, 'more.json')).items };
const packedIcons = json(join(TENT, 'more.json')).icons as Record<string, unknown>;
const seats: Record<string, unknown> = { ...json(join(APP, 'src', 'lib', 'components', 'villager3d', 'seats3d.json')).tent, ...json(join(TENT, 'seats-more.json')).tent };
const ja = json(join(APP, 'src', 'lib', 'i18n', 'tent.ja.json')) as Record<string, string>;
const en = json(join(APP, 'src', 'lib', 'i18n', 'tent.en.json')) as Record<string, string>;

const rows: { code: string; tab: string; tag: string; series: string; name: string; file: string }[] = [];
for (const s of ['Housewares', 'Miscellaneous', 'Gyroids']) {
  const seen = new Set<string>();
  for (const r of await sheet(s)) {
    if (seen.has(r.name)) continue;
    seen.add(r.name);
    const code = `f${field(r, 'internalId')}`, file = base(String(field(r, 'filename') ?? ''));
    const tab = s === 'Gyroids' ? 'gyroid' : field(r, 'outdoor') === true ? TAB_OF[String(field(r, 'tag'))] : undefined;
    if (!tab) {
      if (field(r, 'outdoor') === true) throw new Error(`outdoor-catalog: no tab for ${r.name}'s tag ${String(field(r, 'tag'))}`);
      continue;
    }
    if (!items[code]) {
      // (a gyroid's other colours: the rooms convert its first, one a piece)
      if (s === 'Gyroids') continue;
      throw new Error(`outdoor-catalog: ${r.name} (${code}) has no room piece`);
    }
    rows.push({ code, tab, tag: String(field(r, 'tag') ?? ''), series: String(field(r, 'series') ?? ''), name: r.name, file });
  }
}

const editorFiles = new Map(Object.entries(IN_EDITOR).map(([k, f]) => [f, k]));
const kindNames = new Set(KIND_LIST.flatMap((d) => [d.ja, d.en.toLowerCase()]));
const inEditor: Record<string, string> = {};
const tagOrder = Object.keys(TAB_OF);
const pieces: [string, Record<string, unknown>][] = [];
for (const r of rows.sort((a, b) => TABS.indexOf(a.tab) - TABS.indexOf(b.tab) || tagOrder.indexOf(a.tag) - tagOrder.indexOf(b.tag) || a.series.localeCompare(b.series) || a.name.localeCompare(b.name))) {
  const m = items[r.code], nja = ja[`tent.item.${r.code}`], nen = en[`tent.item.${r.code}`];
  if (!nja || !nen) throw new Error(`outdoor-catalog: no names for ${r.code}`);
  const dup = editorFiles.get(r.file) ?? (kindNames.has(nen.toLowerCase()) || kindNames.has(nja) ? `(${nen})` : undefined);
  if (dup) {
    inEditor[r.code] = dup;
    continue;
  }
  if (m.rug || m.wl || m.cl || m.cr) throw new Error(`outdoor-catalog: ${r.code} isn't a floor piece`);
  // its icon: the ずかん's (already on the phone) or NH's own, loose (a packed one would cost the editor a pack a tab)
  const own = !m.cat || m.icon;
  if (own && (packedIcons[r.code] || !existsSync(join(APP, 'static', 'room', 'icons', `${r.code}.webp`)))) throw new Error(`outdoor-catalog: ${r.code} has no loose icon`);
  const p: Record<string, unknown> = { t: r.tab, ja: nja, en: nen, i: own ? 1 : m.cat };
  // the room's own data, as it is (a test holds the two together)
  for (const k of ['w', 'd', 'h', 'v', 'pk', 'lit', 'lt', 'e', 's', 'sy', 'st', 'sl', 'sm', 'u', 'n', 'gy'] as const) if (m[k] !== undefined) p[k] = m[k];
  // a seat with no pose isn't one (as in the rooms)
  if (m.u) {
    if (seats[r.code]) p.seat = seats[r.code];
    else delete p.u, delete p.n;
  }
  pieces.push([r.code, p]);
}
const missing = Object.keys(IN_EDITOR).filter((k) => !Object.values(inEditor).includes(k) && !KIND_LIST.some((d) => d.k === k));
if (missing.length) throw new Error(`outdoor-catalog: IN_EDITOR names kinds the catalogue hasn't: ${missing.join(', ')}`);

const line = (v: unknown) => JSON.stringify(v);
writeFileSync(OUT, `{
  "_": "scripts/outdoor-catalog.ts: the rooms' pieces NH lets one put outdoors and the gyroids, as the island's kinds nh-<code> (layout/outdoor.ts): t the editor's tab, ja/en NH's names, i the icon (1: NH's own, room/icons; else the ずかん's id), the rest the room's own data (tent/items.json, more.json; seat: its seat's shape). inEditor: NH's pieces the editor has as kinds of its own",
  "tabs": ${line(TABS)},
  "pieces": {
${pieces.map(([c, p]) => `    ${line(c)}: ${line(p)}`).join(',\n')}
  },
  "inEditor": ${line(inEditor)}
}
`);
const by = new Map<string, number>();
for (const [, p] of pieces) by.set(p.t as string, (by.get(p.t as string) ?? 0) + 1);
console.log(`outdoor-catalog: ${pieces.length} pieces (${[...by].map(([t, n]) => `${t} ${n}`).join(', ')}), ${Object.keys(inEditor).length} already the editor's`);
