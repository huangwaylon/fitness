// Build the shop's price list (docs/design.md "The shop", docs/decisions.md "The shop's かいがら"): NH's sell price of
// everything a pocket holds (contract/pocket.ts: every fish, bug and sea creature the island has, its shells, fossils
// and star fragments, and the goods: wood, fruit, mushrooms…), and NH's buy price of every piece of furniture the rooms have a model
// of (NH's or, for a piece NH sells nowhere, a made-up one: MADE_UP), both scaled to かいがら, into
// src/lib/contract/shopPrices.ts (sell) and buyPrices.ts (buy: its own module, so the
// first load never carries it) (shared by the record and the phones: what a sell is worth and what a buy costs are the
// record's rules, so a refresh of this list is a relay deploy first).
// Usage (from app/): npm run shop:prices
//
// Source: the ACNH community spreadsheet as JSON (Norviah/animal-crossing, json/data/*.json, as scripts/catalog.ts
// reads it; cached for a day under the OS temp dir): Fish, Insects and Sea Creatures' `sell`, Fossils' (the assessed
// piece's) and Other's (the shells, fragments and goods, by NH's English name), the furniture tabs' `buy` and `sell`.
// The island's species are the catch names' keys (i18n/catch.en.json `critter.name.<id>` / `sea.name.<id>`), matched
// to the spreadsheet by the catalogue's slug of the English name; the furniture by the rooms' code (tent/items.json and
// more.json: `f` + NH's internal id).
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { slug } from './catalog.ts';
import { FOSSILS, FRAGMENTS, SHELLS } from '../src/lib/world/beach.ts';
import { GOODS } from '../src/lib/contract/pocket.ts';

const APP = join(import.meta.dirname, '..');
const OUT = join(APP, 'src', 'lib', 'contract', 'shopPrices.ts');
const OUT_BUY = join(APP, 'src', 'lib', 'contract', 'buyPrices.ts');
const SHEET = 'https://raw.githubusercontent.com/Norviah/animal-crossing/master/json/data/';
const CACHE = join(tmpdir(), 'island-catalog-src');
const DAY_MS = 86_400_000;

/** The scales (docs/decisions.md "The shop's かいがら"): one for both ways, NH's Bells ÷ 20 (NH's own sell : buy), and
 *  nothing sells for under SELL_MIN. */
const SELL_DIV = 20;
const BUY_DIV = 20;
const SELL_MIN = 3;
/** No piece costs more than this (かいがら): a dearer one (golden furniture, a vehicle, a castle piece, a big critter
 *  model) costs this (the user, 2026-11-10: every piece buyable; was a 100,000-Bell cap that left 43 out). */
const BUY_MAX = 10_000;
/** A piece NH's shops never sell (a DIY piece, an event's, Nook Miles', Nook Shopping's, a special character's: no
 *  `buy`) gets a made-up price (docs/decisions.md "The shop's かいがら"): NH's own sell : buy, 1 : 4, from its NH sell
 *  price, so it costs what it would if Nook's Cranny stocked it (a crafted piece its materials' worth ×4, as NH prices
 *  its sell), then the same ÷ BUY_DIV and BUY_MAX as any piece; at least SELL_MIN. */
const MADE_UP = 4;

type Row = { name: string; sell?: number; buy?: number; variations?: { buy?: number; sell?: number; internalId?: number }[] };
type Piece = { starter?: 1; rug?: 1; cr?: string };

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

  // the pieces by NH's internal id (the rooms' code: f + it)
  const furniture = new Map<string, Row>();
  for (const tab of ['Housewares', 'Miscellaneous', 'Wall-mounted', 'Ceiling Decor', 'Rugs', 'Gyroids'])
    for (const r of await sheet(tab)) {
      const id = (r as { internalId?: number }).internalId ?? r.variations?.[0]?.internalId;
      if (id !== undefined && !furniture.has(`f${id}`)) furniture.set(`f${id}`, r);
    }
  const table = (f: string) => (JSON.parse(readFileSync(join(APP, 'src', 'lib', 'components', 'tent', f), 'utf8')) as { items: Record<string, Piece> }).items;
  const room = { ...table('items.json'), ...table('more.json') };
  const buy: Record<string, number> = {};
  let madeUp = 0, capped = 0;
  for (const [code, m] of Object.entries(room)) {
    // never sold: the starter set (always to hand), the rugs (all free in もようがえ's ラグ), a critter's tank (the
    // ずかん's catch brings it)
    if (m.starter || m.rug || m.cr) continue;
    const r = furniture.get(code);
    if (!r) {
      problems.push(`not in the spreadsheet: ${code}`);
      continue;
    }
    const nh = price(r, 'buy'), sold = price(r, 'sell');
    const bells = nh ?? (sold ? sold * MADE_UP : undefined);
    if (!bells) {
      problems.push(`no NH price at all: ${code} ${r.name}`);
      continue;
    }
    buy[code] = Math.min(BUY_MAX, scale(bells, BUY_DIV, nh ? 1 : SELL_MIN));
    if (!nh) madeUp++;
    if (buy[code] === BUY_MAX) capped++;
  }

  const obj = (o: Record<string, number>) => `{\n${Object.entries(o).map(([k, v]) => `  ${JSON.stringify(k)}: ${v}`).join(',\n')}\n}`;
  writeFileSync(OUT, `// Generated by scripts/shop-prices.ts (npm run shop:prices): don't edit. NH's sell prices scaled to かいがら
// (docs/decisions.md "The shop's かいがら"): a catch's (NH's Bells ÷ ${SELL_DIV}, at least ${SELL_MIN}), keyed as a tally's \`kind:id\`.

export const SELL: Readonly<Record<string, number>> = ${obj(sell)};
`);
  writeFileSync(OUT_BUY, `// Generated by scripts/shop-prices.ts (npm run shop:prices): don't edit. NH's buy prices scaled to かいがら
// (docs/decisions.md "The shop's かいがら"): a piece's (NH's ÷ ${BUY_DIV}; one NH never sells, ${MADE_UP} × its NH sell price ÷ ${BUY_DIV},
// at least ${SELL_MIN}; at most ${BUY_MAX.toLocaleString('en')}), keyed by the rooms' code (tent/items.json, more.json), every piece
// with a model, the starter set, the rugs and the critters' tanks aside.

export const BUY: Readonly<Record<string, number>> = ${obj(buy)};
`);
  console.log(`sell: ${Object.keys(sell).length} species; buy: ${Object.keys(buy).length} pieces (${madeUp} at a made-up price, ${capped} at the cap)`);
  for (const p of problems) console.log(p);
}

if (import.meta.main)
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
