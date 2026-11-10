// Fetch the official New Horizons art the UI uses (from Nookipedia's file pages) into static/art/.
// Usage (from app/): npm run assets:fetch   [--force to re-download everything]
//                    npm run assets:fetch -- --only=trees/oak,host/   (re-download keys with these prefixes)
//
// The art is Nintendo's, used for a personal, non-commercial app: see docs/decisions.md#official-nh-art.
// Output: static/art/<category>/<id>.webp (+ static/art/manifest.json), downscaled to ≤ the size the UI needs.
// Idempotent: files already on disk are skipped (a file on disk but missing from the manifest, e.g. after an
// interrupted run, is adopted: its size is read from the webp header). The manifest is saved after every file and
// failed requests are retried, so a flaky connection only costs the file in flight. Requires `cwebp` (brew install webp).
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { registerHooks } from 'node:module';

// The roster's look helpers import lib/art.ts, which reads Kit's `$app/paths` and the art manifest as JSON: stub the
// one and load the other as JSON, so this script can read the roster outside Vite.
registerHooks({
  resolve: (spec, ctx, next) =>
    spec === '$app/paths' ? { url: 'data:text/javascript,export const asset = (p) => p;', shortCircuit: true } : next(spec, ctx),
  load: (url, ctx, next) => (url.endsWith('.json') ? next(url, { ...ctx, importAttributes: { type: 'json' } }) : next(url, ctx))
});
const { ROSTER } = await import('../src/lib/villagers/roster.ts');

const UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const API = 'https://nookipedia.com/w/api.php';
const OUT = join(import.meta.dirname, '..', 'static', 'art');
const MANIFEST = join(OUT, 'manifest.json');
const DELAY_MS = 400;
const force = process.argv.includes('--force');
const only = (process.argv.find((a) => a.startsWith('--only='))?.slice(7) ?? '').split(',').filter(Boolean);

/** key → [max px on the longer side, ...candidate file titles in preference order]. */
type Spec = [number, ...string[]];

const SPECS: Record<string, Spec> = {
  // Isabelle, the host. Only the transparent renders (NH_2..4 have white backgrounds). There is no
  // official bow render: 'bow' is the stand render + a CSS bow (N2). Winter = the full-body cardigan
  // model (same canvas as the stand model, N3); the old `Isabelle_NH_Winter.png` is a waist-up bust.
  'host/isabelle': [512, 'Isabelle_NH_Transparent.png'],
  'host/isabelle-stand': [512, 'Isabelle_NH_Model.png'],
  'host/isabelle-winter': [512, 'Isabelle_NH_Model_2.png'],
  'host/isabelle-icon': [128, 'Isabelle_NH_Character_Icon.png'],
  'host/tom-nook': [512, 'Tom_Nook_NH.png'],
  // The shop's twins behind its counter (components/shop): NH has them only together (no head icons)
  'host/timmy-tommy': [512, 'Timmy_&_Tommy_NH_Transparent.png'],
  // The fruit icons (🍒 cherry = Stand).
  'fruit/peach': [128, 'Peach_NH_Inv_Icon.png'],
  'fruit/apple': [128, 'Apple_NH_Inv_Icon.png'],
  'fruit/pear': [128, 'Pear_NH_Inv_Icon.png'],
  'fruit/cherry': [128, 'Cherry_NH_Inv_Icon.png'],
  // The wallet's two rewards: soft serve (おやつ) and shoyu ramen (外食).
  'items/snack': [128, 'Soft_Serve_NH_Inv_Icon.png'],
  'items/dinner': [128, 'Shoyu_Ramen_NH_Icon.png'],
  // The HUD's health button (けんこう): NH's red dumbbell.
  'items/dumbbell': [128, 'Dumbbell_(Red)_NH_Icon.png'],
  // The wild flowers (island/scene.ts WILD): the NH inventory art of each, trimmed to the figure (TRIM).
  'flowers/red-tulips': [128, 'Red_Tulips_NH_Inv_Icon.png'],
  'flowers/yellow-tulips': [128, 'Yellow_Tulips_NH_Inv_Icon.png'],
  'flowers/red-roses': [128, 'Red_Roses_NH_Inv_Icon.png'],
  'flowers/white-roses': [128, 'White_Roses_NH_Inv_Icon.png'],
  'flowers/pink-cosmos': [128, 'Pink_Cosmos_NH_Inv_Icon.png'],
  'flowers/purple-mums': [128, 'Purple_Mums_NH_Inv_Icon.png'],
  'flowers/orange-pansies': [128, 'Orange_Pansies_NH_Inv_Icon.png'],
  // Money UI.
  'money/bells': [128, '99k_Bells_NH_Inv_Icon.png'],
  'money/leaf': [128, 'Leaf_NH_Icon.png'],
  // The trees, the hedge's and the campsite's bushes, the campsite, the lamps and the rocks are NH's own models rendered by
  // scripts/models.ts (source "rendered"). The plumeria's are its catalog renders (128 px, trimmed: TRIM), from before NH's model was in the files.
  'bushes/white-plumeria': [128, 'White-Plumeria_Bush_NH_Icon.png'],
  'bushes/pink-plumeria': [128, 'Pink-Plumeria_Bush_NH_Icon.png'],
  // Island decorations.
  // NH's map icon of the airport (the pairing page; 320 px, trimmed: TRIM)
  'deco/airport': [320, 'Airport_(Blue)_NH_Map_Icon.png'],
  // the paths' furniture (NH's catalog icons, trimmed: TRIM)
  'deco/campsite-sign': [128, 'Campsite_Sign_NH_Icon.png'],
  'deco/present': [96, 'Present_NH_Inv_Icon.png'],
  // Halloween (Oct 31): NH's orange pumpkin by day, the orange spooky lantern (a jack-o'-lantern) from 17:00, the candy
  // Jack is given (Jack himself, and the holiday hosts and the wedding's pair, are their 3D models only: no renders).
  'deco/pumpkin': [96, 'Orange_Pumpkin_NH_Inv_Icon.png'],
  'deco/spooky-lantern': [128, 'Spooky_Lantern_(Orange)_NH_Icon.png'],
  'items/candy': [96, 'Candy_NH_Inv_Icon.png'],
  // the wedding countdown (island/wedding.ts): NH's wedding arch for June Sundays
  'deco/wedding-arch': [256, 'Wedding_Arch_(Cute)_NH_Icon.png'],
  // birthdays (island/Birthday.svelte): NH's birthday cake, the party hats our villagers wear, the party popper
  'deco/birthday-cake': [128, 'Birthday_Cake_(Strawberry_Buttercream)_NH_Icon.png'],
  'deco/birthday-hat-pink': [96, 'Birthday_Hat_(Pink)_NH_Icon.png'],
  'deco/birthday-hat-blue': [96, 'Birthday_Hat_(Blue)_NH_Icon.png'],
  'deco/party-popper': [96, 'Party_Popper_NH_Inv_Icon.png'],
  // group stretching's tape deck (island/TapeDeck.svelte)
  'deco/tape-deck': [96, 'Tape_Deck_NH_Icon.png'],
  // Game-derived replacements for hand-drawn chrome.
  // Seasonal particles.
  'season/petal': [64, 'Cherry-Blossom_Petal_NH_Inv_Icon.png'],
  'season/maple-leaf': [64, 'Maple_Leaf_NH_Inv_Icon.png'],
  'season/snowflake': [64, 'Snowflake_NH_Inv_Icon.png'],
  // a shaken tree's branch, on the ground to pick up (island/TreeShakes.svelte)
  'finds/tree-branch': [64, 'Tree_Branch_NH_Inv_Icon.png'],
  // a shaken palm's coconuts (NH: a coconut palm drops its two when shaken)
  'finds/coconut': [64, 'Coconut_NH_Inv_Icon.png'],
  // a shaken tree's wood (NH's three, from a tree's three a day: island/treeShake.ts), and a pulled weed: the pocket's
  // しげん in the shop's うる (shop/pocket.ts)
  'finds/wood': [64, 'Wood_NH_Inv_Icon.png'],
  'finds/softwood': [64, 'Softwood_NH_Inv_Icon.png'],
  'finds/hardwood': [64, 'Hardwood_NH_Inv_Icon.png'],
  'finds/weeds': [64, 'Clump_of_Weeds_NH_Inv_Icon.png', 'Weeds_NH_Inv_Icon.png'],
};
// Scene critters (docs/design.md#scene-interactions): the critterpedia icon of each catch (fish, bugs, junk), shown
// ~36px for a moment after a catch and only loaded then (island/critters.ts critterArt).
for (const name of [
  'Sea Bass', 'Horse Mackerel', 'Olive Flounder', 'Red Snapper', 'Dab', 'Squid', 'Sea Butterfly', 'Blowfish', 'Puffer Fish',
  'Barred Knifejaw', 'Anchovy', 'Common Butterfly', 'Yellow Butterfly', 'Tiger Butterfly', 'Darner Dragonfly',
  'Red Dragonfly', 'Firefly', 'Moth', 'Bell Cricket', 'Cricket', 'Ladybug', 'Boot', 'Old Tire', 'Empty Can',
  'Peacock Butterfly', 'Emperor Butterfly', 'Honeybee', 'Banded Dragonfly', 'Robust Cicada', 'Evening Cicada',
  'Rice Grasshopper', 'Grasshopper', 'Migratory Locust', 'Mantis', 'Orchid Mantis',
  // the rest of NH's sea and pier fish
  'Zebra Turkeyfish', 'Ribbon Eel', 'Football Fish', 'Clownfish', 'Surgeonfish', 'Butterfly Fish', 'Sea Horse', 'Moray Eel',
  'Napoleonfish', 'Ray', 'Ocean Sunfish', 'Mahi-Mahi', 'Giant Trevally', 'Tuna', 'Blue Marlin', 'Suckerfish', 'Oarfish',
  'Saw Shark', 'Hammerhead Shark', 'Great White Shark', 'Whale Shark', 'Barreleye', 'Coelacanth',
  // more NH bugs: on the trees, on the beach and in the grass, flying
  'Walker Cicada', 'Brown Cicada', 'Giant Cicada', 'Cicada Shell', 'Saw Stag', 'Miyama Stag', 'Giant Stag', 'Rainbow Stag',
  'Horned Dynastid', 'Goliath Beetle', 'Drone Beetle', 'Jewel Beetle', 'Walking Stick', 'Hermit Crab', 'Wharf Roach',
  'Pill Bug', 'Centipede', 'Snail', 'Paper Kite Butterfly', 'Agrias Butterfly', "Queen Alexandra's Birdwing",
  "Rajah Brooke's Birdwing", 'Monarch Butterfly', 'Atlas Moth', 'Damselfly', 'Long Locust',
  // the palm trees' beetles (Goliath Beetle is above)
  'Cyclommatus Stag', 'Golden Stag', 'Horned Atlas', 'Horned Elephant',
  // only from a shaken tree's wasp nest (island/treeShake.ts)
  'Wasp',
  // the rest of NH's bugs the island can hold (a flea off a villager, a bagworm or a spider from a shaken tree)
  'Common Bluebottle', 'Great Purple Emperor', 'Madagascan Sunset Moth', 'Mosquito', 'Stinkbug', 'Man-Faced Stink Bug',
  'Tiger Beetle', 'Earth-Boring Dung Beetle', 'Walking Leaf', 'Violin Beetle', 'Citrus Long-Horned Beetle',
  'Rosalia Batesi Beetle', 'Scarab Beetle', 'Mole Cricket', 'Tarantula', 'Scorpion', 'Flea', 'Bagworm', 'Spider',
  // the pond's bugs (on its water: island/Pond.svelte)
  'Pondskater', 'Diving Beetle', 'Giant Water Bug',
  // NH's 40 sea creatures, caught by diving at a bubble spot (island/sea.ts)
  'Seaweed', 'Sea Grapes', 'Sea Cucumber', 'Sea Pig', 'Sea Star', 'Sea Urchin', 'Slate Pencil Urchin', 'Sea Anemone',
  'Moon Jellyfish', 'Sea Slug', 'Pearl Oyster', 'Mussel', 'Oyster', 'Scallop', 'Whelk', 'Turban Shell', 'Abalone',
  'Gigas Giant Clam', 'Chambered Nautilus', 'Octopus', 'Umbrella Octopus', 'Vampire Squid', 'Firefly Squid', 'Gazami Crab',
  'Dungeness Crab', 'Snow Crab', 'Red King Crab', 'Acorn Barnacle', 'Spider Crab', 'Tiger Prawn', 'Sweet Shrimp',
  'Mantis Shrimp', 'Spiny Lobster', 'Lobster', 'Giant Isopod', 'Horseshoe Crab', 'Sea Pineapple', 'Spotted Garden Eel',
  'Flatworm', "Venus' Flower Basket",
  // the pond's fish (island/pondFish.ts): NH's river, river-mouth, clifftop and pond fish
  'Bitterling', 'Pale Chub', 'Crucian Carp', 'Dace', 'Carp', 'Koi', 'Goldfish', 'Pop-Eyed Goldfish', 'Ranchu Goldfish',
  'Killifish', 'Crawfish', 'Soft-Shelled Turtle', 'Snapping Turtle', 'Tadpole', 'Frog', 'Freshwater Goby', 'Loach',
  'Catfish', 'Giant Snakehead', 'Bluegill', 'Yellow Perch', 'Black Bass', 'Tilapia', 'Pike', 'Pond Smelt', 'Sweetfish',
  'Cherry Salmon', 'Char', 'Golden Trout', 'Stringfish', 'Salmon', 'King Salmon', 'Mitten Crab', 'Guppy', 'Nibble Fish',
  'Angelfish', 'Betta', 'Neon Tetra', 'Rainbowfish', 'Piranha', 'Arowana', 'Dorado', 'Gar', 'Arapaima', 'Saddled Bichir',
  'Sturgeon'
])
  SPECS[`critters/${name.toLowerCase().replace(/'/g, '').replace(/ /g, '-')}`] = [96, `${name.replace(/ /g, '_')}_NH_Icon.png`];
// Beach finds (docs/design.md#beach-finds): NH's seashells, fossils (the assessed icon), star fragments, the message
// bottle and the shovel, shown small on the sand and on the catch plate, only loaded when one is about.
const FIND_FILES: Record<string, string> = {
  'sea-snail': 'Sea_Snail_NH_Inv_Icon.png', cowrie: 'Cowrie_NH_Inv_Icon.png', 'venus-comb': 'Venus_Comb_NH_Inv_Icon.png',
  'sand-dollar': 'Sand_Dollar_NH_Inv_Icon.png', coral: 'Coral_NH_Inv_Icon.png', conch: 'Conch_NH_Inv_Icon.png',
  'giant-clam': 'Giant_Clam_NH_Inv_Icon.png', 'summer-shell': 'Summer_Shell_NH_Inv_Icon.png',
  pearl: 'Pearl_NH_Inv_Icon.png', 'message-bottle': 'Message_Bottle_NH_Inv_Icon.png', shovel: 'Shovel_NH_Icon.png',
  'star-fragment': 'Star_Fragment_NH_Inv_Icon.png', 'large-star-fragment': 'Large_Star_Fragment_NH_Inv_Icon.png'
};
for (const z of ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpius', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'])
  FIND_FILES[`${z.toLowerCase()}-fragment`] = `${z}_Fragment_NH_Inv_Icon.png`;
for (const f of [
  'Amber', 'Ammonite', 'Trilobite', 'Dinosaur Track', 'Shark-Tooth Pattern', 'Coprolite', 'Myllokunmingia', 'Juramaia',
  'Anomalocaris', 'Archaeopteryx', 'Dunkleosteus', 'Eusthenopteron', 'Acanthostega', 'Australopith', 'T. Rex Skull',
  'Tricera Skull', 'Stego Skull', 'Brachio Skull', 'Mammoth Skull', 'Sabertooth Skull', 'Dimetrodon Skull', 'Ankylo Skull',
  'Plesio Skull', 'Spino Skull', 'Iguanodon Skull', 'Pachy Skull', 'Diplo Skull', 'Ptera Body', 'Megacero Skull',
  'Parasaur Skull', 'Ophthalmo Skull', 'Archelon Skull',
  // the rest of each dinosaur (beach.ts FOSSIL_SETS)
  'T. Rex Torso', 'T. Rex Tail', 'Tricera Torso', 'Tricera Tail', 'Stego Torso', 'Stego Tail', 'Brachio Chest', 'Brachio Pelvis',
  'Brachio Tail', 'Mammoth Torso', 'Sabertooth Tail', 'Dimetrodon Torso', 'Ankylo Torso', 'Ankylo Tail', 'Plesio Torso',
  'Plesio Tail', 'Spino Torso', 'Spino Tail', 'Iguanodon Torso', 'Iguanodon Tail', 'Pachy Tail', 'Diplo Neck', 'Diplo Chest',
  'Diplo Pelvis', 'Diplo Tail', 'Diplo Tail Tip', 'Left Ptera Wing', 'Right Ptera Wing', 'Megacero Torso', 'Megacero Tail',
  'Parasaur Torso', 'Parasaur Tail', 'Ophthalmo Torso', 'Archelon Tail', 'Deinony Torso', 'Deinony Tail', 'Left Megalo Side',
  'Right Megalo Side', 'Quetzal Torso', 'Left Quetzal Wing', 'Right Quetzal Wing'
])
  FIND_FILES[f.toLowerCase().replace(/\. /g, '-').replace(/ /g, '-')] = `${f.replace(/ /g, '_')}_NH_Icon.png`;
// Island care: the watering can and the rock by the hedge (the weeds are ours: NH's icon is a sack of them).
Object.assign(FIND_FILES, { 'watering-can': 'Watering_Can_NH_Icon.png', rock: 'Rock_NH_Icon.png' });
// Mushroom season (island/mushrooms.ts): NH's four ground mushrooms beside the trees and the rare one dug up.
for (const m of ['Round', 'Skinny', 'Flat', 'Elegant', 'Rare']) FIND_FILES[`${m.toLowerCase()}-mushroom`] = `${m}_Mushroom_NH_Icon.png`;
// Bunny Day's eggs (island/eggs.ts): dug up, from a balloon, on the line.
for (const e of ['Earth', 'Sky', 'Water']) FIND_FILES[`${e.toLowerCase()}-egg`] = `${e}_Egg_NH_Inv_Icon.png`;
for (const [id, file] of Object.entries(FIND_FILES)) SPECS[`finds/${id}`] = [96, file];
// The hybrid flowers a watered flower can grow the next day (NH's genetics, simplified: island/care.ts), trimmed alike.
for (const f of ['Purple Tulips', 'Black Tulips', 'Orange Tulips', 'Pink Roses', 'Orange Roses', 'Black Roses', 'Purple Roses', 'Blue Roses',
  'Orange Cosmos', 'Black Cosmos', 'Pink Mums', 'Green Mums', 'Blue Pansies', 'Purple Pansies'])
  SPECS[`flowers/${f.toLowerCase().replace(/ /g, '-')}`] = [128, `${f.replace(/ /g, '_')}_NH_Inv_Icon.png`];
// More of the wild flowers' kinds (island/scene.ts WILD), the season's in turn.
for (const f of ['Pink Hyacinths', 'Purple Hyacinths', 'White Hyacinths', 'White Tulips', 'Pink Tulips', 'White Lilies', 'Orange Lilies', 'Pink Lilies',
  'Yellow Lilies', 'White Cosmos', 'Yellow Cosmos', 'Red Cosmos', 'White Mums', 'Yellow Mums', 'Red Mums', 'White Pansies', 'Yellow Pansies', 'Red Pansies',
  'Red Windflowers', 'Purple Windflowers', 'White Windflowers'])
  SPECS[`flowers/${f.toLowerCase().replace(/ /g, '-')}`] = [128, `${f.replace(/ /g, '_')}_NH_Inv_Icon.png`];
// NH's DIY recipe card, held up when a balloon's present held a recipe (island/Finds.svelte; the presents' own icons are the
// catalogue's, scripts/catalog.ts).
SPECS['presents/diy-recipe'] = [96, 'DIY_Recipe_NH_Inv_Icon.png'];
/** Keys whose transparent margin is trimmed off (alpha bbox + 2 px), so `size` = the figure's height and
 *  scene sizes are true to the tile unit (docs/design.md#world). */
const TRIM = ['bushes/', 'flowers/', 'finds/rock', 'deco/pumpkin', 'deco/spooky-lantern', 'deco/tape-deck', 'deco/wedding-arch', 'deco/birthday-', 'deco/party-popper',
  'deco/airport', 'deco/campsite-sign', ...['round', 'skinny', 'flat', 'elegant', 'rare'].map((m) => `finds/${m}-mushroom`)];
/** Villager renders are trimmed too (not the round icons; Hamlet's padded render is cropped by lib/art.ts BOX). */
const trims = (key: string) =>
  TRIM.some((p) => key.startsWith(p)) || (key.startsWith('villagers/') && !key.endsWith('-icon') && key !== 'villagers/hamlet');

// Reaction icons (the NH reaction wheel: grey cat face + coloured accents), shown inside our emote bubble.
const EMOTIONS = [
  'Joy', 'Love', 'Surprise', 'Laughter', 'Sleepy', 'Happiness', 'Encouraging', 'Glee', 'Pleased', 'Pride',
  'Inspiration', 'Dozing', 'Curiosity', 'Thought', 'Flourish', 'Sheepishness', 'Worry', 'Shocked'
];
for (const e of EMOTIONS) SPECS[`reactions/${e.toLowerCase()}`] = [96, `Emotion_${e}_NH_Icon.png`];
// The pose-style reaction (a player silhouette) of the both-of-us dance (motion/reactions.ts).
SPECS['reactions/pose-viva'] = [96, 'Viva_NH_Reaction_Icon.png'];
// Every roster villager (src/lib/villagers/roster.ts): a full-body render + the round head icon.
// The 2.0 villagers' `<Name>_NH.png` is a small (~230 px) promo crop with the feet cut off: use the full-body model.
const MODEL_FIRST = new Set(['roswell', 'zoe', 'ace', 'frett', 'quinn', 'marlo', 'faith', 'petri', 'cephalobot', 'rio', 'chabwick', 'azalea', 'sasha', 'shino', 'audie', 'rosie',
  'colton', 'tiansheng']);
// Special characters (たぬきち, しずえ…): `<Name>_NH.png` is their posed NH artwork (K.K.'s guitar, Blathers' book),
// but some are tiny (Sable's is 122 px) or sit on white (Label's): those use the 3D model; Kapp'n's large render is
// `_NH_2`. Their head icon is `<Name>_NH_Character_Icon.png`; K.K. has none, his flat head icon is the Question one.
const SPECIAL_MODEL_FIRST = new Set(['sable', 'label', 'kicks', 'saharah', 'gulliver']);
for (const { id, nameEn, special } of Object.values(ROSTER)) {
  const name = nameEn.replace(/ /g, '_'); // file titles use underscores ('Agent S' → Agent_S_NH.png)
  if (special) {
    const model = SPECIAL_MODEL_FIRST.has(id) ? [`${name}_NH_Model.png`] : [];
    const extra = id === 'kappn' ? [`${name}_NH_2.png`] : [];
    SPECS[`villagers/${id}`] = [512, ...model, ...extra, `${name}_NH_Transparent.png`, `${name}_NH.png`, `${name}_NH_Model.png`];
    SPECS[`villagers/${id}-icon`] = [128, `${name}_NH_Character_Icon.png`, `${name}_NH_Question_Icon.png`];
    continue;
  }
  // Prefer the large transparent renders; `<Name>_NH.png` (the infobox image) is the safe fallback, and the 3D
  // model render (padded, trimmed below) the last resort (Chai has no NH artwork, only `Chai_NH_Model.png`).
  const extra = id === 'hamlet' ? ['Hamlet_NH_2.png'] : []; // Hamlet's _1 doesn't exist; _2 is the big front render
  const model = MODEL_FIRST.has(id) ? [`${name}_NH_Model.png`] : [];
  SPECS[`villagers/${id}`] = [512, ...model, `${name}_NH_Transparent.png`, `${name}_NH_1.png`, ...extra, `${name}_NH.png`, `${name}_NH_Model.png`];
  SPECS[`villagers/${id}-icon`] = [128, `${name}_NH_Villager_Icon.png`];
}

interface Info {
  url: string;
  width: number;
  height: number;
}
interface Entry {
  path: string;
  w: number;
  h: number;
  source: string;
}
interface Manifest {
  version: number;
  files: Record<string, Entry>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(url: string, tries = 4): Promise<Response> {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(120_000) });
      if (res.ok) return res;
      if (res.status < 500 && res.status !== 429) throw Object.assign(new Error(`${res.status} ${url}`), { final: true });
      if (i >= tries) throw new Error(`${res.status} ${url}`);
    } catch (e) {
      if (i >= tries || (e as { final?: boolean }).final) throw e;
    }
    await sleep(2000 * i);
  }
}

/** Canvas size of a cwebp output (VP8X header: 24-bit little-endian width-1 / height-1), or null. */
function webpSize(file: string): [number, number] | null {
  const b = readFileSync(file).subarray(0, 30);
  if (b.toString('latin1', 12, 16) !== 'VP8X') return null;
  return [b.readUIntLE(24, 3) + 1, b.readUIntLE(27, 3) + 1];
}

/** Resolve file titles → original URL + size, 40 titles per API call. */
async function resolve(titles: string[]): Promise<Map<string, Info>> {
  const out = new Map<string, Info>();
  for (let i = 0; i < titles.length; i += 40) {
    const batch = titles.slice(i, i + 40).map((t) => `File:${t}`);
    const url = `${API}?action=query&format=json&prop=imageinfo&iiprop=url|size&titles=${encodeURIComponent(batch.join('|'))}`;
    const data = (await (await get(url)).json()) as {
      query: {
        normalized?: { from: string; to: string }[];
        pages: Record<string, { title: string; missing?: string; imageinfo?: Info[] }>;
      };
    };
    const back = new Map((data.query.normalized ?? []).map((n) => [n.to, n.from]));
    for (const p of Object.values(data.query.pages)) {
      if (!p.imageinfo?.length) continue;
      const asked = (back.get(p.title) ?? p.title).replace(/^File:/, '');
      out.set(asked, p.imageinfo[0]);
    }
    await sleep(DELAY_MS);
  }
  return out;
}

/** Alpha bounding box of an image (via a lossless webp → PAM round trip; no image library needed), padded 2 px. */
function alphaBox(src: string, tmp: string): [number, number, number, number] {
  const lossless = join(tmp, 'trim.webp'), pam = join(tmp, 'trim.pam');
  execFileSync('cwebp', ['-quiet', '-lossless', '-exact', src, '-o', lossless]);
  execFileSync('dwebp', ['-quiet', lossless, '-pam', '-o', pam]);
  const buf = readFileSync(pam);
  const head = buf.subarray(0, 200).toString('latin1');
  const end = head.indexOf('ENDHDR\n') + 7;
  const W = Number(/WIDTH (\d+)/.exec(head)![1]), H = Number(/HEIGHT (\d+)/.exec(head)![1]);
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (buf[end + (y * W + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) return [0, 0, W, H];
  x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2); x1 = Math.min(W - 1, x1 + 2); y1 = Math.min(H - 1, y1 + 2);
  return [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
}

function fit(w: number, h: number, max: number): [number, number] {
  const s = Math.min(1, max / Math.max(w, h));
  return [Math.round(w * s), Math.round(h * s)];
}

async function main() {
  const manifest: Manifest = existsSync(MANIFEST)
    ? JSON.parse(readFileSync(MANIFEST, 'utf8'))
    : { version: 1, files: {} };
  const todo = Object.entries(SPECS).filter(
    ([key]) =>
      force || only.some((o) => key.startsWith(o)) || !manifest.files[key] || !existsSync(join(OUT, manifest.files[key].path))
  );
  console.log(`${Object.keys(SPECS).length} assets, ${todo.length} to fetch`);
  // Drop manifest entries (and files) the UI no longer uses.
  for (const [key, e] of Object.entries(manifest.files)) {
    if (SPECS[key] || e.source.startsWith('derived') || e.source.startsWith('rendered')) continue; // models.ts's (and the old derived ones')
    rmSync(join(OUT, e.path), { force: true });
    delete manifest.files[key];
  }
  if (!todo.length) return writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

  const infos = await resolve([...new Set(todo.flatMap(([, [, ...t]]) => t))]);
  const tmp = join(tmpdir(), `island-art-${process.pid}`);
  mkdirSync(tmp, { recursive: true });
  const missing: string[] = [];

  const save = () => {
    manifest.files = Object.fromEntries(Object.entries(manifest.files).sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  };
  mkdirSync(OUT, { recursive: true });

  for (const [key, [max, ...titles]] of todo) {
    const title = titles.find((t) => infos.has(t));
    if (!title) {
      missing.push(`${key} (${titles.join(', ')})`);
      continue;
    }
    const onDisk = join(OUT, `${key}.webp`);
    const size = !force && !only.some((o) => key.startsWith(o)) && existsSync(onDisk) ? webpSize(onDisk) : null;
    if (size) {
      manifest.files[key] = { path: `${key}.webp`, w: size[0], h: size[1], source: `https://nookipedia.com/wiki/File:${title}` };
      console.log(`  = ${key}  ${size[0]}×${size[1]}  (on disk)`);
      save();
      continue;
    }
    const info = infos.get(title)!;
    const src = join(tmp, 'src' + (title.match(/\.\w+$/)?.[0] ?? '.png'));
    writeFileSync(src, Buffer.from(await (await get(info.url)).arrayBuffer()));
    const crop = trims(key) ? alphaBox(src, tmp) : null;
    const [w, h] = crop ? fit(crop[2], crop[3], max) : fit(info.width, info.height, max);
    const rel = `${key}.webp`;
    const dest = join(OUT, rel);
    mkdirSync(dirname(dest), { recursive: true });
    const cropArgs = crop ? ['-crop', ...crop.map(String)] : [];
    execFileSync('cwebp', ['-quiet', '-q', '86', '-alpha_q', '100', '-m', '6', ...cropArgs, '-resize', String(w), String(h), src, '-o', dest]);
    manifest.files[key] = { path: rel, w, h, source: `https://nookipedia.com/wiki/File:${title}` };
    console.log(`  ✓ ${key}  ${w}×${h}  ← ${title}`);
    save();
    await sleep(DELAY_MS);
  }
  rmSync(tmp, { recursive: true, force: true });

  manifest.version += todo.length - missing.length > 0 ? 1 : 0;
  save();
  console.log(`manifest: ${Object.keys(manifest.files).length} files (v${manifest.version})`);
  if (missing.length) console.log(`missing (no candidate title found):\n  ${missing.join('\n  ')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
