// Build the balloon presents' catalogue (docs/design.md "Balloon"): NH's furniture and clothing a balloon can hold and
// NH's DIY recipes balloons carry, with their official ja/en names and icons.
// Usage (from app/): node scripts/catalog.ts            (data + any icon not on disk yet)
//                    node scripts/catalog.ts --data     (data only)   --force (re-download every icon)
//
// Sources:
// - The ACNH community spreadsheet as JSON (Norviah/animal-crossing, json/data/*.json): every NH item with its catalog
//   status ("For sale" = orderable from the catalogue), its sources, its season event, its shop season and the game's
//   own ja/en names (translations.jPja / uSen). The pool rules below read these fields.
// - Nookipedia's Cargo tables (nh_furniture_variation, nh_clothing_variation, nh_recipe): the file of each item's
//   official icon (the first variation's) and each recipe's DIY icon; the recipes' "balloons" availability cross-checks
//   the spreadsheet's.
//
// Pool rules (NH: a balloon holds furniture, clothing, a DIY recipe, Bells or materials (Nookipedia, Balloon); the
// furniture and clothing are the shops' random stock): an item is in when it is orderable ("For sale"), sold by Nook's
// Cranny (furniture, umbrellas) or the Able Sisters (clothing) and not tied to an event (Halloween, Toy Day, Festivale,
// Bunny Day, Prom, Shamrock Day, Mario...). Never: Nook Miles exclusives, special characters' items (Gulliver, C.J.,
// Flick, Label, Kicks, Saharah...), Nook Shopping-only items (promotions, the daily selection), amiibo/Pocket Camp
// unlocks, crafted (DIY) items. One entry per base item: no colour or pattern variants. The shops' season stock stays in
// its season (Able Sisters' summer and winter lines, Nook's Cranny's summer slot). Recipes: every recipe whose source is
// "Balloons" (the seasonal sets, Halloween, Shamrock Day) or "Egg balloons" (Bunny Day).
//
// Output: src/lib/components/island/catalog.json (ids, category, season; the pool in island/catalog.ts reads it),
// src/lib/i18n/catalog.{ja,en}.json (`item.name.<id>`, `recipe.name.<id>`), static/art/finds/{items,recipes}/<id>.webp
// (96 px, cwebp -q 75: ~2 KB each; under art/finds/ so the service worker caches them on first use, never at install).
// Requires `cwebp` (brew install webp).
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const APP = join(import.meta.dirname, '..');
const DATA_OUT = join(APP, 'src', 'lib', 'components', 'island', 'catalog.json');
const NAMES_OUT = (lang: string) => join(APP, 'src', 'lib', 'i18n', `catalog.${lang}.json`);
const ART = join(APP, 'static', 'art', 'finds');
const SHEET = 'https://raw.githubusercontent.com/Norviah/animal-crossing/master/json/data/';
const API = 'https://nookipedia.com/w/api.php';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const CACHE = join(tmpdir(), 'island-catalog-src');
const ICON_PX = 96;
const DELAY_MS = 150;
const force = process.argv.includes('--force');
const dataOnly = process.argv.includes('--data');

/** The spreadsheet's tabs → our category (the ずかん's tabs, NH's catalogue order). */
const FURNITURE = { Housewares: 'housewares', Miscellaneous: 'misc', 'Wall-mounted': 'wall', 'Ceiling Decor': 'ceiling' } as const;
const CLOTHING = {
  Tops: 'tops', Bottoms: 'bottoms', 'Dress-Up': 'dress', Headwear: 'headwear', Accessories: 'accessories', Socks: 'socks',
  Shoes: 'shoes', Umbrellas: 'umbrellas'
} as const;
/** The shops that sell a balloon's stock. */
const SHOPS = new Set(["Nook's Cranny", 'Able Sisters']);
/** Sources that may stand beside a shop (the same item is also sold in Happy Home Paradise's office or café). */
const ALSO = new Set(['HHP Office', 'HHP Café']);
/** Season events that are a shop's seasonal stock (kept, in their window), not an event. */
const SHOP_SEASONS: Record<string, string> = { 'Summer shopping': 'summer', 'Winter shopping': 'winter' };
/** The recipe seasons (NH, northern hemisphere: the spreadsheet's "Crafting season" dates) → our season id. */
const RECIPE_SEASONS: Record<string, string> = {
  'cherry-blossom petals': 'cherry', 'young spring bamboo': 'bamboo', 'summer shells': 'shells',
  'acorns and pine cones': 'acorns', 'maple leaves': 'maple', mushrooms: 'mushrooms', ornaments: 'ornaments',
  snowflakes: 'snowflakes', 'Halloween (ready days); Halloween': 'halloween', 'Shamrock Day': 'shamrock',
  'Bunny Day (ready days); Bunny Day': 'bunny'
};
/** Clothing's style season (the spreadsheet's `seasonality`: what villagers wear when) → ours: likelier in season. */
const STYLE: Record<string, string> = { Spring: 'spring', Summer: 'summer', Autumn: 'autumn', Winter: 'winter' };

type Raw = Record<string, unknown> & { name: string; variations?: Record<string, unknown>[]; translations?: Record<string, unknown> | null };
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

/** A spreadsheet tab (cached for a day under the OS temp dir: the full set is ~40 MB). */
async function sheet(name: string): Promise<Raw[]> {
  mkdirSync(CACHE, { recursive: true });
  const file = join(CACHE, `${name}.json`);
  if (!existsSync(file) || force) writeFileSync(file, Buffer.from(await (await get(SHEET + encodeURIComponent(name) + '.json')).arrayBuffer()));
  return JSON.parse(readFileSync(file, 'utf8')) as Raw[];
}

/** Every row of a Cargo table (500 per call). */
async function cargo(table: string, fields: string): Promise<Record<string, string>[]> {
  mkdirSync(CACHE, { recursive: true });
  const file = join(CACHE, `${table}.json`);
  if (existsSync(file) && !force) return JSON.parse(readFileSync(file, 'utf8'));
  const out: Record<string, string>[] = [];
  for (let offset = 0; ; offset += 500) {
    const u = new URL(API);
    for (const [k, v] of Object.entries({ action: 'cargoquery', format: 'json', limit: '500', offset: String(offset), tables: table, fields }))
      u.searchParams.set(k, v);
    const d = (await (await get(String(u))).json()) as { cargoquery?: { title: Record<string, string> }[] };
    const rows = (d.cargoquery ?? []).map((r) => r.title);
    out.push(...rows);
    if (rows.length < 500) break;
    await sleep(DELAY_MS);
  }
  writeFileSync(file, JSON.stringify(out));
  return out;
}

/** A field of the item, or of its first variation (the spreadsheet keeps per-variation fields there). */
const field = (i: Raw, k: string): unknown => i[k] ?? i.variations?.[0]?.[k];
const sources = (i: Raw): string[] => (field(i, 'source') as string[] | undefined) ?? [];

/** Our id: the English name in kebab case ("Pavé's balloon-hem dress" → paves-balloon-hem-dress); a leading number
 *  goes last, so an id starts with a letter ("3D glasses" → glasses-3d). */
export const slug = (en: string): string =>
  en.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '').replace(/^(\d[a-z0-9]*)-(.+)$/, '$2-$1');

/** The English name with an article, as the catch lines use it ("a froggy chair", "an LCD TV", "some cargo pants"). The
 *  spreadsheet has no plural flag for these: a name whose head word (before "of" / "with") ends in a plural -s is
 *  plural ("some knee braces", but "a pile of leaves", "a dress"). */
export function withArticle(en: string): string {
  const head = en.split(/ (?:of|with) /)[0];
  if (/[^su]s$/.test(head) && !/(ss|us|is)$/.test(head)) return `some ${en}`;
  const vowel = /^[aeiou]/i.test(en) && !/^(uni|use|usu|util|ukulele|eu|one)/i.test(en);
  const acronym = /^[FHLMNRSX][A-Z]/.test(en);
  return `${vowel || acronym ? 'an' : 'a'} ${en}`;
}

export function inPool(i: Raw): boolean {
  if (field(i, 'catalog') !== 'For sale') return false;
  const src = sources(i);
  if (!src.some((s) => SHOPS.has(s)) || !src.every((s) => SHOPS.has(s) || ALSO.has(s))) return false;
  const notes = String(field(i, 'sourceNotes') ?? '');
  if (/amiibo|Pocket Camp/i.test(notes)) return false;
  const ev = field(i, 'seasonEvent') as string | null | undefined;
  return !ev || ev in SHOP_SEASONS;
}

/** Window season of an item (a shop's seasonal stock) and its style season (clothing). */
export function seasons(i: Raw): { stock: string; style: string } {
  const ev = field(i, 'seasonEvent') as string | null | undefined;
  const avail = i.seasonalAvailability as string | undefined;
  const stock = (ev && SHOP_SEASONS[ev]) || (avail === 'Summer' ? 'summer' : avail === 'Winter' ? 'winter' : '');
  return { stock, style: STYLE[String(field(i, 'seasonality') ?? '')] ?? '' };
}

/** Official names from the spreadsheet's translations (the game's own text; English: the spreadsheet's name, NH's US text). */
function names(i: Raw, byName?: Map<string, Raw>): { ja: string; en: string } {
  let t = i.translations ?? {};
  // A clothing recipe's row carries its variants' translations ("No Variations"): read the item's own.
  if (String(t.uSen ?? '').toLowerCase() !== i.name.toLowerCase()) t = byName?.get(i.name.toLowerCase())?.translations ?? {};
  const ja = String(t.jPja ?? '').trim();
  const en = i.name.trim();
  return { ja, en };
}

/** en name (lowercase) → the icon file title of its first variation and pattern. */
function iconIndex(rows: Record<string, string>[]): Map<string, { title: string; url: string; rank: number }> {
  const out = new Map<string, { title: string; url: string; rank: number }>();
  for (const r of rows) {
    if (!r.image) continue;
    const key = (r['en name'] ?? '').toLowerCase();
    const rank = Number(r['variation number'] || 0) * 100 + Number(r['pattern number'] || 0);
    const prev = out.get(key);
    if (!prev || rank < prev.rank) out.set(key, { title: r.image, url: r['image url'], rank });
  }
  return out;
}

interface Item { id: string; cat: string; stock: string; style: string; order: number; ja: string; en: string; icon?: string }
interface Recipe { id: string; season: string; order: number; ja: string; en: string; icon?: string }

async function main() {
  const furnitureIcons = iconIndex(await cargo('nh_furniture_variation', 'en_name,variation_number,pattern_number,image,image_url'));
  const clothingIcons = iconIndex(await cargo('nh_clothing_variation', 'en_name,variation_number,image,image_url'));
  const recipeRows = await cargo('nh_recipe', 'en_name,image,image_url,serial_id,diy_availability1,diy_availability2,diy_availability3,diy_availability4');
  const recipeIcons = iconIndex(recipeRows);
  const problems: string[] = [];

  const items: Item[] = [];
  /** Every furniture and clothing row by English name (a recipe's names come from what it makes). */
  const byName = new Map<string, Raw>();
  for (const tab of ['Bags']) for (const i of await sheet(tab)) byName.set(i.name.toLowerCase(), i);
  for (const [tab, cat] of [...Object.entries(FURNITURE), ...Object.entries(CLOTHING)]) {
    const icons = tab in FURNITURE ? furnitureIcons : clothingIcons;
    for (const i of await sheet(tab)) {
      byName.set(i.name.toLowerCase(), i);
      if (!inPool(i)) continue;
      const n = names(i);
      const { stock, style } = seasons(i);
      const icon = icons.get(i.name.toLowerCase()) ?? (tab === 'Umbrellas' ? furnitureIcons.get(i.name.toLowerCase()) : undefined);
      if (!icon) problems.push(`no icon: ${i.name}`);
      items.push({ id: slug(n.en), cat, stock, style, order: Number(field(i, 'internalId') ?? 0), ...n, icon: icon?.url });
    }
  }
  // A balloon recipe by either source: the spreadsheet's "Balloons" / "Egg balloons" or Nookipedia's "balloons" /
  // "egg balloon" (it has the Bunny Day bed from egg balloons, the spreadsheet from Zipper). Not the golden slingshot:
  // the 300th balloon's reward, not a season's.
  const npBalloon = new Set(recipeRows.filter((r) => [1, 2, 3, 4].some((k) => /balloon/i.test(r[`diy availability${k}`] ?? ''))).map((r) => r['en name'].toLowerCase()));
  npBalloon.delete('golden slingshot');
  const recipes: Recipe[] = [];
  for (const r of await sheet('Recipes')) {
    const src = (r.source as string[]) ?? [];
    if (!src.includes('Balloons') && !src.includes('Egg balloons') && !npBalloon.has(r.name.toLowerCase())) continue;
    const season = RECIPE_SEASONS[String(r.seasonEvent)];
    if (!season) { problems.push(`recipe without a season: ${r.name}`); continue; }
    const n = names(r, byName);
    const icon = recipeIcons.get(r.name.toLowerCase());
    if (!icon) problems.push(`no DIY icon: ${r.name}`);
    recipes.push({ id: slug(n.en), season, order: Number(r.serialId ?? 0), ...n, icon: icon?.url });
  }
  const ours = new Set(recipes.map((r) => r.en.toLowerCase()));
  for (const n of npBalloon) if (!ours.has(n)) problems.push(`Nookipedia lists a balloon recipe we don't have: ${n}`);
  for (const n of ours) if (!npBalloon.has(n)) problems.push(`Nookipedia doesn't list as a balloon recipe: ${n}`);

  for (const list of [items, recipes] as { id: string; ja: string; en: string }[][]) {
    const seen = new Set<string>();
    for (const e of list) {
      if (seen.has(e.id)) problems.push(`duplicate id: ${e.id}`);
      seen.add(e.id);
      if (!e.ja) problems.push(`no ja name: ${e.en}`);
      if (!/^[a-z][a-z0-9-]{0,47}$/.test(e.id)) problems.push(`bad id: ${e.id}`);
    }
  }
  const CATS = [...Object.values(FURNITURE), ...Object.values(CLOTHING)] as string[];
  items.sort((a, b) => CATS.indexOf(a.cat) - CATS.indexOf(b.cat) || a.order - b.order || a.id.localeCompare(b.id));
  recipes.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

  // catalog.json: compact rows (a ~2,000-entry list read once when the ずかん or a present needs it).
  const data = {
    items: items.map((i) => [i.id, i.cat, i.stock, i.style].join(' ').trimEnd()),
    recipes: recipes.map((r) => `${r.id} ${r.season}`)
  };
  writeFileSync(DATA_OUT, JSON.stringify(data, null, 0).replace(/\[/g, '[\n').replace(/",/g, '",\n') + '\n');
  const ja: Record<string, string> = {}, en: Record<string, string> = {};
  for (const i of items) (ja[`item.name.${i.id}`] = i.ja), (en[`item.name.${i.id}`] = withArticle(i.en));
  for (const r of recipes) (ja[`recipe.name.${r.id}`] = r.ja), (en[`recipe.name.${r.id}`] = withArticle(r.en));
  writeFileSync(NAMES_OUT('ja'), JSON.stringify(ja, null, 2) + '\n');
  writeFileSync(NAMES_OUT('en'), JSON.stringify(en, null, 2) + '\n');
  console.log(`${items.length} items (${CATS.map((c) => `${c} ${items.filter((i) => i.cat === c).length}`).join(', ')}), ${recipes.length} recipes`);
  if (problems.length) console.log(`check:\n  ${problems.join('\n  ')}`);
  if (dataOnly) return;

  // Icons: 96 px webp, skipped when on disk; files of ids no longer in the catalogue are removed.
  const tmp = join(tmpdir(), `island-catalog-${process.pid}`);
  mkdirSync(tmp, { recursive: true });
  for (const [dir, list] of [['items', items], ['recipes', recipes]] as const) {
    const out = join(ART, dir);
    mkdirSync(out, { recursive: true });
    const want = new Set(list.map((e) => `${e.id}.webp`));
    for (const f of readdirSync(out)) if (!want.has(f)) rmSync(join(out, f));
    let n = 0;
    for (const e of list) {
      const dest = join(out, `${e.id}.webp`);
      if (!e.icon || (existsSync(dest) && !force)) continue;
      const src = join(tmp, 'src.png');
      writeFileSync(src, Buffer.from(await (await get(e.icon)).arrayBuffer()));
      execFileSync('cwebp', ['-quiet', '-q', '75', '-alpha_q', '80', '-m', '6', '-resize', String(ICON_PX), String(ICON_PX), src, '-o', dest]);
      if (++n % 100 === 0) console.log(`  ${dir}: ${n}`);
      await sleep(DELAY_MS);
    }
    console.log(`${dir}: ${n} fetched`);
  }
  rmSync(tmp, { recursive: true, force: true });
}

// Run, not imported (catalog.test.ts reads the pool rules and the id and article helpers).
if (import.meta.main)
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
