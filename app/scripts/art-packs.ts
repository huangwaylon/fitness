// The ずかん's clothing, recipe and artwork icons into packs (lib/artPack/artPack.ts; docs/design.md "Official art"): the
// balloon catalogue's clothing (island/catalog.ts CLOTHING_CATEGORIES), its recipes and the genuine artworks, ~1,160
// 96 px icons browsed a ずかん tab at a time, into static/art/finds/pack/<tab>[-k].<hash>.pak (a ktx2Pack.ts container:
// its files' keys in its head), each at most MAX bytes, split as stably as can be (lib/packPlan.ts: a pack whose files
// didn't change keeps its name and bytes, so the phones' caches keep it). A clothing tab's closet icons first
// (player3d/parts.json), so a closet tab costs its first pack. Loose (static/art/finds/<group>/<id>.webp, each its own
// URL): the furniture (the shop's ずかん pieces, the tree gifts, the tent's) and every key the code names (a literal
// `finds/items/…` in src: けんこう's cards, ききみみ's pictures, the trips' packing list), so a single one never costs a
// pack. The index (each pack's keys) goes to static/art/finds/pack/index.<hash>.json and its hash to
// src/lib/artPack/packs.json (bundled). A key's bytes come from its loose file (scripts/nh-icons.ts and world3d-models.ts
// --museum write them there) over the packs as they are; a key that should be loose and is only packed is written
// loose again. Run alone, it packs again what's there (nothing changes when nothing did).
//   node scripts/art-packs.ts            (npm run art:packs; nh-icons.ts runs it at its end)
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { entries, pack } from '../src/lib/components/world3d/ktx2Pack.ts';
import { planHome } from '../src/lib/packPlan.ts';

const APP = join(import.meta.dirname, '..');
const FINDS = join(APP, 'static', 'art', 'finds');
export const PACKS = join(FINDS, 'pack');
const BUNDLED = join(APP, 'src', 'lib', 'artPack', 'packs.json');
const SRC = join(APP, 'src');
/** A pack's bound (bytes): a ずかん screenful or two of icons (~2 KB each). */
const MAX = 200_000;
const GROUPS = ['items', 'recipes', 'art'] as const;
/** The catalogue's clothing tabs (island/catalog.ts CLOTHING_CATEGORIES, which imports JSON as node can't: artPack.test
 *  checks they match), the closet's order. */
export const CLOTHING_CATEGORIES = ['tops', 'bottoms', 'dress', 'headwear', 'accessories', 'socks', 'shoes', 'umbrellas'] as const;

const sha8 = (b: Uint8Array | string): string => createHash('sha256').update(b).digest('hex').slice(0, 8);
const readJson = <T,>(f: string): T => JSON.parse(readFileSync(f, 'utf8')) as T;
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));

/** The keys the code names (a literal `finds/<group>/<id>` in src, tests and the generated tables aside): kept loose. */
export function pinned(): Set<string> {
  const out = new Set<string>();
  for (const f of walk(SRC)) {
    if (!/\.(ts|svelte|json)$/.test(f) || /\.test\.ts$/.test(f) || /(catalog|parts)\.json$|\/artPack\//.test(f)) continue;
    for (const m of readFileSync(f, 'utf8').matchAll(/finds\/(?:items|recipes|art)\/[a-z0-9-]+/g)) out.add(m[0]);
  }
  return out;
}

/** The packs now: stem → its files (key → bytes). */
function readPacks(): Map<string, Map<string, Uint8Array>> {
  const out = new Map<string, Map<string, Uint8Array>>();
  if (!existsSync(PACKS)) return out;
  for (const f of readdirSync(PACKS).filter((f) => f.endsWith('.pak')).sort()) {
    const b = new Uint8Array(readFileSync(join(PACKS, f)));
    const es = entries(b);
    if (!es) throw new Error(`art-packs: ${f} isn't a pack`);
    out.set(f.slice(0, -4), new Map([...es].map(([id, [o, l]]) => [id, b.subarray(o, o + l)])));
  }
  return out;
}

/** Every packed icon now (key → bytes): the tests' view. */
export const packedArt = (): Map<string, Uint8Array> => new Map([...readPacks().values()].flatMap((m) => [...m]));

const loosePath = (key: string): string => join(APP, 'static', 'art', `${key}.webp`);

export function packArt(): { packs: number; bytes: number; packed: number; written: number; removed: number; loosened: number; missing: string[] } {
  const now = readPacks();
  const source = new Map<string, Uint8Array>([...now.values()].flatMap((m) => [...m]));
  for (const g of GROUPS) {
    const dir = join(FINDS, g);
    if (existsSync(dir)) for (const f of readdirSync(dir)) if (f.endsWith('.webp')) source.set(`finds/${g}/${f.slice(0, -5)}`, new Uint8Array(readFileSync(join(dir, f))));
  }
  const catalog = readJson<{ items: string[]; recipes: string[] }>(join(SRC, 'lib/components/island/catalog.json'));
  const parts = readJson<{ items: Record<string, { icon: string | null }> }>(join(SRC, 'lib/components/player3d/parts.json'));
  const pins = pinned();
  const missing: string[] = [];

  // the homes: a ずかん tab's keys, in its order (a clothing tab's closet icons first)
  const homes = new Map<string, string[]>();
  const add = (home: string, key: string) => {
    if (pins.has(key)) return;
    if (!source.has(key)) return void missing.push(key);
    homes.set(home, [...(homes.get(home) ?? []), key]);
  };
  const clothing = new Map<string, string>(); // id → its tab
  for (const row of catalog.items) {
    const [id, cat] = row.split(' ');
    if ((CLOTHING_CATEGORIES as readonly string[]).includes(cat)) clothing.set(id, cat);
  }
  for (const cat of CLOTHING_CATEGORIES) homes.set(cat, []);
  for (const it of Object.values(parts.items)) if (it.icon && clothing.has(it.icon) && !homes.get(clothing.get(it.icon)!)!.includes(`finds/items/${it.icon}`)) add(clothing.get(it.icon)!, `finds/items/${it.icon}`);
  for (const [id, cat] of clothing) if (!homes.get(cat)!.includes(`finds/items/${id}`)) add(cat, `finds/items/${id}`);
  for (const row of catalog.recipes) add('recipes', `finds/recipes/${row.split(' ')[0]}`);
  for (const key of [...source.keys()].filter((k) => k.startsWith('finds/art/')).sort()) add('art', key);
  for (const [h, keys] of homes) if (!keys.length) homes.delete(h);

  const prev: Record<string, string[]> = {};
  for (const [stem, m] of now) prev[stem.replace(/\.[0-9a-f]{8}$/, '')] = [...m.keys()];
  const index: Record<string, [number, string]> = {}, wanted = new Set<string>(), inPack = new Set<string>();
  let bytes = 0, written = 0;
  mkdirSync(PACKS, { recursive: true });
  for (const [home, keys] of homes) {
    for (const [name, ids] of planHome(home, keys.map((id) => ({ id, bytes: source.get(id)!.length })), MAX, prev)) {
      const b = pack(ids.map((id) => [id, source.get(id)!]));
      const stem = `${name}.${sha8(b)}`, f = join(PACKS, `${stem}.pak`);
      wanted.add(`${stem}.pak`);
      bytes += b.length;
      if (!existsSync(f)) writeFileSync(f, b), written++;
      // (where its first file starts, then each key's bytes: lib/artPack cuts them with no need of the head)
      index[stem] = [entries(b)!.get(ids[0])![0], ids.map((id) => `${id.slice('finds/'.length)}:${source.get(id)!.length}`).join(',')];
      ids.forEach((id) => inPack.add(id));
    }
  }
  const json = `{\n${Object.entries(index).map(([s, ids]) => `${JSON.stringify(s)}: ${JSON.stringify(ids)}`).join(',\n')}\n}\n`;
  const hash = sha8(json);
  wanted.add(`index.${hash}.json`);
  writeFileSync(join(PACKS, `index.${hash}.json`), json);
  // (only the hash: it's bundled)
  writeFileSync(BUNDLED, `${JSON.stringify({ index: hash })}\n`);
  let removed = 0, loosened = 0;
  for (const f of readdirSync(PACKS)) if (!wanted.has(f)) rmSync(join(PACKS, f)), removed++;
  // the packed keys' loose files go; a loose key only in a pack comes out again
  for (const [key, b] of source) {
    const f = loosePath(key);
    if (inPack.has(key)) {
      if (existsSync(f)) rmSync(f);
    } else if (!existsSync(f)) {
      mkdirSync(dirname(f), { recursive: true });
      writeFileSync(f, b);
      loosened++;
    }
  }
  return { packs: wanted.size - 1, bytes, packed: inPack.size, written, removed, loosened, missing };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = packArt();
  console.log(`${r.packs} packs of ${r.packed} icons, ${(r.bytes / 1e6).toFixed(2)} MB (${r.written} written, ${r.removed} removed, ${r.loosened} loose again)`);
  if (r.missing.length) console.log(`no icon for ${r.missing.length}: ${r.missing.slice(0, 12).join(' ')}`);
}
