// Other spellings of an area (docs/places.md "Areas"): a generic public gazetteer, so 渋谷, しぶや and Shibuya meet,
// as do シアトル and Seattle, and a city or country stands for the places in it (東京 → its 23 wards, its towns; Seattle
// → Redmond, Bellevue…). Independent of the list (public geography only): the 47 prefectures, Tokyo's wards and towns,
// the big cities and the tourist towns, and the countries and foreign cities travellers save. Romaji in Hepburn with
// long vowels marked (Jinbōchō), read with the marks dropped and m/n before b, m, p both ways (Jimbocho, Jinbocho);
// the long vowels typed out (Ryougoku) are the search key's own fold (text.ts). Pure.
import { isRec } from '../contract/guards.ts';
import { placeKey } from './text.ts';

// The gazetteer's text is a data file, data/places-gazetteer.json (~17 KB gzipped: in this chunk it pushed the precache
// past its cap), loaded with the facets (facets.ts loadLexicon) and set here (setGazetteer); till then nothing is known.
// Its blocks: each line one place, its spellings '|'-separated (the name first, its reading, then the romaji and the
// others); '>' then the places in it, ';'-separated. A prefecture's block is the prefecture's line, then its towns.

interface Place {
  /** Its spellings, the name first. */
  names: string[];
  /** The places directly in it. */
  kids: Place[];
}

/** Hepburn's marks dropped (ō → o) and the foreign ones (ẵ → a, đ → d, ı → i, ø → o); kana untouched. */
const fold = (s: string): string =>
  /[À-ɏḀ-ỿ]/.test(s) ? s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/ı/g, 'i').replace(/ø/g, 'o').normalize('NFC') : s;

/** A spelling and, a Latin one, its marks dropped and (romaji) m and n before b, m, p written both ways (Jimbocho,
 *  Jinbocho). */
function variants(s: string, jp: boolean): string[] {
  if (!/[A-Za-zÀ-ɏḀ-ỿ]/.test(s)) return [s];
  const plain = fold(s);
  const out = new Set([s, plain]);
  if (jp && /[nm](?=[bmp])/i.test(plain)) {
    out.add(plain.replace(/n(?=[bmp])/g, 'm').replace(/N(?=[bmp])/g, 'M'));
    out.add(plain.replace(/m(?=[bp])/g, 'n').replace(/M(?=[bp])/g, 'N'));
  }
  return [...out];
}

const line = (s: string, jp = true): Place => ({ names: [...new Set(s.split('|').map((x) => x.trim()).filter(Boolean).flatMap((x) => variants(x, jp)))], kids: [] });

/** The places by their keys (a spelling two places share, 館山 and 立山's たてやま, keys both). */
let BY = new Map<string, Place[]>();
/** The places whose name (first spelling) a key is: a kanji name picks its own place among the ones sharing a reading. */
let OWN = new Map<string, Place[]>();
const add = (m: Map<string, Place[]>, k: string, p: Place) => {
  const l = m.get(k);
  if (!l) m.set(k, [p]);
  else if (!l.includes(p)) l.push(p);
};
/** One place per name within a block: a town under two parents (広尾 in 港区 and 渋谷), a region given its own line
 *  (ハワイ in アメリカ, then its towns). Blocks don't share one (豊島 the ward, 北区 Tokyo's and another city's). */
type Named = Map<string, Place>;

/** The place a line's part names, one per name in a block (its spellings joined). */
function place(s: string, named: Named, jp: boolean): Place {
  const p = line(s, jp);
  const first = key(p.names[0]);
  const had = named.get(first);
  if (!had) {
    named.set(first, p);
    return p;
  }
  for (const n of p.names) if (!had.names.includes(n)) had.names.push(n);
  return had;
}

/** A block's places (each line's head), each line's own under it, and each head under `parent`. */
function block(text: string, parent: Place | null, jp: boolean): Place[] {
  const tops: Place[] = [];
  const named: Named = new Map();
  for (const row of text.split('\n')) {
    if (!row.trim()) continue;
    const [head, kids = ''] = row.split('>');
    const p = place(head, named, jp);
    for (const k of kids.split(';')) {
      if (!k.trim()) continue;
      const kid = place(k, named, jp);
      if (kid !== p && !p.kids.includes(kid)) p.kids.push(kid);
    }
    if (parent && !parent.kids.includes(p)) parent.kids.push(p);
    tops.push(p);
  }
  return tops;
}

/** The key a spelling is looked up by: the search's own (text.ts placeKey) with Latin marks dropped, and a Japanese
 *  name's 都/府/県/市/区/町/村 dropped when two characters or more stay (渋谷区 → 渋谷, 港区 stays). */
function key(s: string): string {
  const k = placeKey(fold(s));
  return /^[^a-z0-9]{3,}$/.test(k) && /[都府県市区町村]$/.test(k) ? k.slice(0, -1) : k;
}

const PREF_SUFFIX = (name: string): string => (name === '北海道' ? '' : name === '東京' ? '都' : name === '京都' || name === '大阪' ? '府' : '県');

/** The gazetteer's blocks ({v: 1, tokyo, prefs, world}: Tokyo's wards and towns, the prefectures', the world's), read
 *  and set; false (nothing set) when the file is off. */
export function setGazetteer(json: unknown): boolean {
  if (!isRec(json) || json.v !== 1 || typeof json.tokyo !== 'string' || typeof json.prefs !== 'string' || typeof json.world !== 'string') return false;
  const JAPAN = line('日本|にほん|にっぽん|Japan|Nippon|Nihon');
  const tokyo = line('東京|東京都|とうきょう|Tōkyō|Tokyo-to');
  JAPAN.kids.push(tokyo);
  block(json.tokyo, tokyo, true);
  for (const p of block(json.prefs, JAPAN, true)) {
    const pref = p.names[0] + PREF_SUFFIX(p.names[0]);
    if (!p.names.includes(pref)) p.names.push(pref);
  }
  const by = new Map<string, Place[]>(), own = new Map<string, Place[]>();
  (function index(seen: Set<Place>, ps: readonly Place[]) {
    for (const p of ps) {
      if (seen.has(p)) continue;
      seen.add(p);
      for (const n of p.names) add(by, key(n), p);
      add(own, key(p.names[0]), p);
      index(seen, p.kids);
    }
  })(new Set(), [JAPAN, ...block(json.world, null, false)]);
  ((BY = by), (OWN = own));
  return true;
}

/** The places a name is: its own (a kanji name over a shared reading), else every place with that spelling. A name
 *  with a slash (Fatih/İstanbul) by each part. */
function find(name: string): Place[] {
  const k = key(name);
  if (!k) return [];
  const hit = OWN.get(k) ?? BY.get(k);
  if (hit) return hit;
  const parts = name.split(/\s*[/／,、]\s*/).filter(Boolean);
  return parts.length > 1 ? [...new Set(parts.flatMap(find))] : [];
}

/** Other spellings of an area, city or country (raw: 渋谷 → しぶや, Shibuya; Seattle → シアトル); [] for one it doesn't know. */
export function areaAliases(name: string): string[] {
  const k = placeKey(name);
  const out = new Set<string>();
  for (const p of find(name)) for (const n of p.names) if (placeKey(n) !== k) out.add(n);
  return [...out];
}

/** Every spelling of every place in an area, city or country, all the way down (東京 → the 23 wards and their towns,
 *  the Tama cities; Seattle → Redmond, Bellevue…; アメリカ → Washington, Seattle…); the area's own spellings not
 *  included (areaAliases). [] for one with nothing in it. */
export function areaGroup(name: string): string[] {
  const out = new Set<string>();
  const seen = new Set<Place>(find(name));
  const walk = (p: Place) => {
    for (const c of p.kids) {
      if (seen.has(c)) continue;
      seen.add(c);
      for (const n of c.names) out.add(n);
      walk(c);
    }
  };
  for (const p of find(name)) walk(p);
  return [...out];
}
