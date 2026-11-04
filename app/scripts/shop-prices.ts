// Build the shop's price list (docs/design.md "The shop", docs/decisions.md "The shop's かいがら"): NH's sell price of
// everything a pocket holds (contract/pocket.ts: every fish, bug and sea creature the island has, its shells, fossils
// and star fragments, and the goods: wood, fruit, mushrooms…), and NH's buy price of every piece of furniture the rooms have a model
// of, both scaled to かいがら, into src/lib/contract/shopPrices.ts (shared by the record and the phones: what a sell is
// worth and what a buy costs are the record's rules, so a refresh of this list is a relay deploy first).
// Usage (from app/): npm run shop:prices
//
// Source: the ACNH community spreadsheet as JSON (Norviah/animal-crossing, json/data/*.json, as scripts/catalog.ts
// reads it; cached for a day under the OS temp dir): Fish, Insects and Sea Creatures' `sell`, Fossils' (the assessed
// piece's) and Other's (the shells, fragments and goods, by NH's English name), the furniture tabs' `buy`.
// The island's species are the catch names' keys (i18n/catch.en.json `critter.name.<id>` / `sea.name.<id>`), matched
// to the spreadsheet by the catalogue's slug of the English name; the furniture by the rooms' `cat` (tent/items.json:
// the ずかん's id of a piece NH has a model of).
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { slug } from './catalog.ts';
import { FOSSILS, FRAGMENTS, SHELLS } from '../src/lib/components/island/beach.ts';
import { GOODS } from '../src/lib/contract/pocket.ts';

const APP = join(import.meta.dirname, '..');
const OUT = join(APP, 'src', 'lib', 'contract', 'shopPrices.ts');
const SHEET = 'https://raw.githubusercontent.com/Norviah/animal-crossing/master/json/data/';
const CACHE = join(tmpdir(), 'island-catalog-src');
const DAY_MS = 86_400_000;

/** The scales (docs/decisions.md "The shop's かいがら"): one for both ways, NH's Bells ÷ 20 (NH's own sell : buy), and
 *  nothing sells for under SELL_MIN. */
const SELL_DIV = 20;
const BUY_DIV = 20;
const SELL_MIN = 3;
/** Pieces dearer than this in NH (Bells) never come into the stock: a month and more of catches (the grand piano). */
const BUY_MAX_BELLS = 100_000;

type Row = { name: string; sell?: number; buy?: number; variations?: { buy?: number; sell?: number }[] };

async function sheet(name: string): Promise<Row[]> {
  mkdirSync(CACHE, { recursive: true });
  const file = join(CACHE, `${name}.json`);
  const fresh = existsSync(file) && Date.now() - statSync(file).mtimeMs < DAY_MS;
  if (!fresh) {
    const res = await fetch(SHEET + encodeURIComponent(name) + '.json', { signal: AbortSignal.timeout(120_000) });
    if (!res.ok) throw new Error(`${res.status} ${name}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return JSON.parse(readFileSync(file, 'utf8')) as Row[];
}

const price = (r: Row, k: 'buy' | 'sell'): number | undefined => {
  const v = r[k] ?? r.variations?.[0]?.[k];
  return typeof v === 'number' && v > 0 ? v : undefined;
};
/** The island's ids whose English name the spreadsheet spells otherwise. */
const ALIAS: Record<string, string> = { clownfish: 'clown-fish' };
const scale = (bells: number, div: number, min = 1): number => Math.max(min, Math.round(bells / div));

async function main() {
  const names = JSON.parse(readFileSync(join(APP, 'src', 'lib', 'i18n', 'catch.en.json'), 'utf8')) as Record<string, string>;
  const fish = new Map((await sheet('Fish')).map((r) => [slug(r.name), r]));
  const bugs = new Map((await sheet('Insects')).map((r) => [slug(r.name), r]));
  const sea = new Map((await sheet('Sea Creatures')).map((r) => [slug(r.name), r]));
  const problems: string[] = [];
  const sell: Record<string, number> = {};
  for (const key of Object.keys(names)) {
    const m = /^(critter|sea)\.name\.([a-z0-9-]+)$/.exec(key);
    if (!m) continue;
    const id = m[2];
    const src = ALIAS[id] ?? id;
    const hit = m[1] === 'sea' ? (['sea', sea.get(src)] as const) : fish.has(src) ? (['fish', fish.get(src)] as const) : (['bug', bugs.get(src)] as const);
    const bells = hit[1] && price(hit[1], 'sell');
    if (!bells) {
      if (!['boot', 'old-tire', 'empty-can'].includes(id)) problems.push(`no sell price: ${key}`);
      continue;
    }
    sell[`${hit[0]}:${id}`] = scale(bells, SELL_DIV, SELL_MIN);
  }
  // the beach's finds and the goods (contract/pocket.ts), by NH's English name
  const other = new Map([...(await sheet('Other')), ...(await sheet('Fossils'))].map((r) => [slug(r.name), r]));
  const finds: [string, string][] = [
    ...[...SHELLS.map(([id]) => id), 'pearl'].map((id): [string, string] => [`shell:${id}`, id]),
    ...FOSSILS.map((id): [string, string] => [`fossil:${id}`, id]),
    ...FRAGMENTS.map((id): [string, string] => [`fragment:${id}`, id]),
    ...Object.entries(GOODS).map(([id, en]): [string, string] => [`goods:${id}`, slug(en)])
  ];
  for (const [key, name] of finds) {
    const r = other.get(name);
    const bells = r && price(r, 'sell');
    if (!bells) problems.push(`no sell price: ${key}`);
    else sell[key] = scale(bells, SELL_DIV, SELL_MIN);
  }

  const furniture = new Map<string, Row>();
  for (const tab of ['Housewares', 'Miscellaneous', 'Wall-mounted', 'Ceiling Decor', 'Rugs']) for (const r of await sheet(tab)) if (!furniture.has(slug(r.name))) furniture.set(slug(r.name), r);
  const room = JSON.parse(readFileSync(join(APP, 'src', 'lib', 'components', 'tent', 'items.json'), 'utf8')) as { items: Record<string, { cat?: string; starter?: 1 }> };
  const buy: Record<string, number> = {};
  for (const [code, m] of Object.entries(room.items)) {
    if (!m.cat || m.starter) continue;
    const r = furniture.get(m.cat);
    const bells = r && price(r, 'buy');
    if (!bells) {
      if (!r) problems.push(`not in the spreadsheet: ${m.cat}`);
      continue; // not for sale in NH (a model's, a prize)
    }
    if (bells > BUY_MAX_BELLS) continue;
    buy[code] = scale(bells, BUY_DIV);
  }

  const obj = (o: Record<string, number>) => `{\n${Object.entries(o).map(([k, v]) => `  ${JSON.stringify(k)}: ${v}`).join(',\n')}\n}`;
  writeFileSync(OUT, `// Generated by scripts/shop-prices.ts (npm run shop:prices): don't edit. NH's prices scaled to かいがら
// (docs/decisions.md "The shop's かいがら"): a catch's sell price (NH's Bells ÷ ${SELL_DIV}, at least ${SELL_MIN}), keyed as a tally's
// \`kind:id\`; a piece's buy price (NH's ÷ ${BUY_DIV}), keyed by the rooms' code (tent/items.json), every piece with a
// model that NH's shop sells for at most ${BUY_MAX_BELLS.toLocaleString('en')} Bells, the starter set aside.

export const SELL: Readonly<Record<string, number>> = ${obj(sell)};

export const BUY: Readonly<Record<string, number>> = ${obj(buy)};
`);
  console.log(`sell: ${Object.keys(sell).length} species; buy: ${Object.keys(buy).length} pieces`);
  for (const p of problems) console.log(p);
}

if (import.meta.main)
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
