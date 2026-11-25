// Google's place kinds (the details' `kind`: ラーメン屋, 仏教寺院, ハイキング コース…) as 保存した場所 reads them
// (docs/places.md "Categories"): each one's top and sub in the contract's taxonomy (contract/places.ts PLACE_CATS),
// whether it overrides the relay's pair (hard: a cuisine, a shrine, a peak, a station) or only fills an empty sub or an
// その他 top (soft: カフェ・喫茶, レストラン, ホテル…), and the words a search finds it by: the kind itself, its Japanese
// variants, English and romaji. The most common ~390 kinds by hand (most of the list's places: data/places-kinds.json),
// then a few suffix rules (…料理店, …博物館, …教会) for the rest. Specific kinds stay distinct: 神社 is no temple, 銭湯 no onsen. Pure.
import { isRec } from '../contract/guards.ts';
import { isPlaceCat, isPlaceSub, type PLACE_CATS, type PlaceCat } from '../contract/places.ts';

export interface KindInfo {
  cat: PlaceCat;
  /** One of the cat's subs, '' none. */
  sub: string;
  /** Overrides the relay's cat/sub (kept as an alt match); else only fills an empty sub or an その他 top. */
  hard: boolean;
  /** The kind itself first, then its other words (raw, not keyed). */
  words: string[];
}

/** A row: a top, one of its subs or '' (checked by the type), hard, the words. */
type Row = { [C in PlaceCat]: readonly [cat: C, sub: (typeof PLACE_CATS)[C][number] | '', hard: 0 | 1, words: string] }[PlaceCat];
const H = 1, S = 0;

// The table (kind → [cat, sub, hard 1|0, words '|'-separated, the kind itself added first]) is a data file,
// data/places-kinds.json (~13 KB gzipped: in this chunk it pushed the precache past its cap), loaded with the facets
// (facets.ts loadLexicon) and set here; till then only the endings below are read.
let KIND: Record<string, Row> = {};

/** The table, checked (every row's top and sub in the taxonomy), set; false (and nothing set) when it's off. */
export function setKinds(json: unknown): boolean {
  if (!isRec(json) || json.v !== 1 || !isRec(json.rows)) return false;
  for (const r of Object.values(json.rows)) {
    if (!Array.isArray(r) || r.length !== 4 || !isPlaceCat(r[0]) || !(r[1] === '' || isPlaceSub(r[0], r[1])) || (r[2] !== H && r[2] !== S) || typeof r[3] !== 'string') return false;
  }
  KIND = json.rows as Record<string, Row>;
  return true;
}

/** Endings for the kinds outside the table (a rare cuisine, museum or church): most specific first. */
const SUFFIX: readonly [RegExp, Row][] = [
  [/博物館$|ミュージアム$/, ['見どころ', '美術館', H, '博物館|museum']],
  [/美術館$|ギャラリー$/, ['見どころ', '美術館', H, '美術館|art|museum|gallery']],
  [/(?:教会|聖堂)$/, ['見どころ', '', H, '教会|church']],
  [/寺院$/, ['見どころ', '寺社', S, '寺院|temple']],
  [/(?:ラーメン|麺)(?:屋|店)$/, ['麺', 'ラーメン', H, 'ラーメン|ramen|noodles']],
  [/寿司(?:屋|店)$/, ['和食・寿司', '寿司', H, '寿司|sushi']],
  [/焼肉(?:屋|店)$/, ['肉', '焼肉', H, '焼肉|yakiniku']],
  [/中華料理店$|(?:広東|上海|北京|湖南|雲南)料理店$/, ['世界の料理', '中華', H, '中華|chinese']],
  [/(?:イタリア|ナポリ|シチリア)料理店$/, ['世界の料理', 'イタリアン', H, 'イタリアン|italian']],
  [/カレー(?:屋|店)$/, ['世界の料理', 'カレー', H, 'カレー|curry']],
  [/バーガー(?:屋|店)$/, ['世界の料理', 'バーガー', H, 'バーガー|burger']],
  [/(?:日本|和)料理店$/, ['和食・寿司', '', H, '和食|japanese']],
  [/料理店$|料理レストラン$|レストラン$/, ['世界の料理', '', S, 'レストラン|restaurant']],
  [/カフェ$|喫茶店?$/, ['カフェ', '', S, 'カフェ|cafe|coffee']],
  [/(?:バー|酒場)$/, ['居酒屋・バー', 'バー', S, 'バー|bar']],
  [/菓子(?:屋|店)$/, ['甘いもの', '', H, 'お菓子|sweets']],
  [/(?:パン屋|パン店|ベーカリー)$/, ['甘いもの', 'パン', H, 'パン|bakery']],
  [/温泉$/, ['温泉', '温泉', H, '温泉|onsen|hot spring']],
  [/公園$/, ['見どころ', '公園', H, '公園|park']],
  [/(?:ホテル|旅館|宿)$/, ['泊まる', '', S, '宿|hotel']],
  [/(?:専門店|販売店|用品店|ショップ)$/, ['買い物', '', S, 'お店|shop']]
];

const info = (kind: string, [cat, sub, hard, words]: Row): KindInfo => ({ cat, sub, hard: hard === H, words: [...new Set([kind, ...words.split('|')])] });

/** A Google kind's category and words; undefined for one it doesn't know (nor its ending). */
export function kindInfo(kind: string): KindInfo | undefined {
  const k = kind.trim();
  if (!k) return undefined;
  const row = Object.hasOwn(KIND, k) ? KIND[k] : undefined;
  if (row) return info(k, row);
  for (const [re, r] of SUFFIX) if (re.test(k)) return info(k, r);
  return undefined;
}
