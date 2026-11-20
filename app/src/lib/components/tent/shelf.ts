// もようがえ's shelf (docs/design.md "The tent" Tray): what the tray lists, worked out from what I have. Each piece
// has one kind (its tab: NH's catalogue's), a time I got it (a find's or a buy's; 0 for the starter set and the free
// rugs, wallpapers and floors), and its HHA numbers once hha.json is in (series, colours, themes, points). Search is
// forgiving (kana either way, widths, case, dakuten, small kana; the name in both languages, its series, colours,
// themes and kind; a few kanji words read as NH's kana), filters AND across groups and OR within, and the sorts are
// stable. Pure (the unit tests): TentEdit.svelte holds the state.
//   kindOf(code)                  its tab
//   fold(text)                    the search's folded form
//   haystack(…), matches(h, q)    an entry's searchable text; whether a query hits it
//   shelve(entries, view, ctx)    the list for a tab, a search, the filters and a sort
import type { HhaTable } from './hha.ts';
import { GYM, ITEMS } from './items.ts';
import '#lib/i18n/rooms.ts'; // the kinds', series', colours' and themes' names it reads

/** The tray's kinds (NH's catalogue tabs), each piece in one: ラグ > 天井 > 壁掛け > 生き物 > 小物 > 家具. */
export const KINDS = ['furniture', 'small', 'walled', 'ceiling', 'rugs', 'critters', 'wall', 'floor'] as const;
export type Kind = (typeof KINDS)[number];

export function kindOf(code: string): Kind {
  if (code[0] === 'w') return 'wall';
  if (code[0] === 'g') return 'floor';
  const m = ITEMS[code];
  return !m ? 'furniture' : m.rug ? 'rugs' : m.cl ? 'ceiling' : m.wl ? 'walled' : m.cr ? 'critters' : m.sm ? 'small' : 'furniture';
}

/** Where a piece came from: the starter set, a balloon's find, a buy, a catch's tank, or free (rugs, wallpapers, floors). */
export type Source = 'start' | 'find' | 'buy' | 'catch' | 'free';
export interface Entry {
  code: string;
  /** When I got it (ms), 0 for the starter set and the free ones. */
  got: number;
  src: Source;
}

export const SORTS = ['new', 'name', 'series', 'size', 'points'] as const;
export type Sort = (typeof SORTS)[number];

/** The filters: each group's picks (OR within a group, AND across). */
export interface Filters {
  /** 入手: find, buy, start. */
  src: readonly ('find' | 'buy' | 'start')[];
  /** この部屋: in (stands here) or out. */
  room: readonly ('in' | 'out')[];
  /** NH's catalogue colours (White, Pink…). */
  colour: readonly string[];
  series: readonly string[];
  /** NH's themes (HHA concepts), and `gym` (the island's ジム pieces). */
  theme: readonly string[];
  /** Footprint: 1 tile, 2, 3 or more. */
  size: readonly ('1' | '2' | '3')[];
}
export const NO_FILTERS: Filters = { src: [], room: [], colour: [], series: [], theme: [], size: [] };
export const filterCount = (f: Filters): number => f.src.length + f.room.length + f.colour.length + f.series.length + f.theme.length + f.size.length;

/** The tiles a piece covers (its footprint, unturned): 1, 2, 3+ (a wallpaper or a floor: none). */
const tilesBand = (code: string): '1' | '2' | '3' | null => {
  const m = ITEMS[code];
  if (!m) return null;
  const n = m.w * m.d;
  return n <= 1 ? '1' : n === 2 ? '2' : '3';
};

// ---- search ----

const SMALL: Record<string, string> = { ぁ: 'あ', ぃ: 'い', ぅ: 'う', ぇ: 'え', ぉ: 'お', っ: 'つ', ゃ: 'や', ゅ: 'ゆ', ょ: 'よ', ゎ: 'わ', ゕ: 'か', ゖ: 'け' };
/** Text folded for a forgiving match: NFKC (half-width kana, full-width Latin), lower case, katakana → hiragana,
 *  dakuten and handakuten dropped, small kana made big, ー and spaces and dots gone. */
export function fold(text: string): string {
  let s = text.normalize('NFKC').toLowerCase();
  s = s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  s = s.normalize('NFD').replace(/[\u3099\u309a]/g, '').normalize('NFC');
  return s.replace(/[ぁぃぅぇぉっゃゅょゎゕゖ]/g, (c) => SMALL[c]).replace(/[\sー・·.,'’\-_/()（）「」&＆]+/g, '');
}

/** Kanji words NH's kana names don't hold: each read as what it may be (folded on use). */
const ALIASES: Record<string, readonly string[]> = {
  椅子: ['いす', 'チェア', 'スツール'], 机: ['つくえ', 'デスク', 'テーブル'], 棚: ['たな', 'シェルフ', 'ラック'], 本棚: ['ほんだな', 'ブックシェルフ'],
  寝台: ['ベッド'], 布団: ['ふとん'], 時計: ['とけい', 'クロック'], 照明: ['ランプ', 'ライト', 'ちょうちん', 'あかり'], 灯り: ['ランプ', 'ライト', 'あかり'],
  植物: ['プランツ', 'はち', 'うえき', 'グリーン'], 観葉植物: ['プランツ', 'うえき'], 花: ['はな', 'フラワー'], 木: ['き', 'ウッド', 'もくせい'],
  箱: ['はこ', 'ボックス'], 鏡: ['かがみ', 'ミラー'], 窓: ['まど', 'ウインドウ'], 絵: ['え', 'アート', 'ポスター'], 机上: ['テーブル'],
  台所: ['キッチン'], 風呂: ['ふろ', 'バス'], 水槽: ['すいそう', 'アクアリウム'], 魚: ['さかな', 'フィッシュ'], 虫: ['むし'], 楽器: ['ピアノ', 'ギター', 'ドラム', 'ウクレレ'],
  冷蔵庫: ['れいぞうこ'], 洗濯機: ['せんたくき'], 傘: ['かさ'], 人形: ['にんぎょう', 'ドール', 'ぬいぐるみ'], 敷物: ['ラグ', 'マット', 'カーペット'],
  壁: ['かべ'], 床: ['ゆか', 'フロア'], 天井: ['てんじょう'], 雑貨: ['こもの'], 小物: ['こもの'], 家具: ['かぐ'],
  黒: ['ブラック', 'くろ'], 白: ['ホワイト', 'しろ'], 赤: ['レッド', 'あか'], 青: ['ブルー', 'あお'], 緑: ['グリーン', 'みどり'], 黄: ['イエロー', 'きいろ'],
  茶: ['ブラウン', 'ちゃいろ'], 桃: ['ピンク'], 紫: ['パープル', 'むらさき'], 灰: ['グレー'], 橙: ['オレンジ'], 丸太: ['まるた'], 竹: ['たけ'], 鉄: ['アイアン']
};
const FOLDED_ALIASES: [string, string[]][] = Object.entries(ALIASES).map(([k, v]) => [fold(k), v.map(fold)]);

/** A query's terms (AND), each its folded alternatives (OR): the term and what its kanji words may read as. */
export function queryOf(q: string): string[][] {
  return q
    .split(/[\s　]+/)
    .map(fold)
    .filter(Boolean)
    .map((term) => {
      const alts = new Set([term]);
      for (const [k, v] of FOLDED_ALIASES) if (term.includes(k)) for (const r of v) alts.add(term.replace(k, r));
      return [...alts];
    });
}

/** Whether every term of a query (queryOf) is somewhere in an entry's haystack. */
export const matches = (h: string, q: readonly (readonly string[])[]): boolean => q.every((alts) => alts.some((a) => h.includes(a)));

/** An entry's searchable text, folded: its names (each language there is), its kind's, series', colours' and themes'
 *  names (`label` turns a key into the words on screen), ジム for the gym's pieces. */
export function haystack(code: string, names: readonly (string | undefined)[], label: (key: string) => string, hha?: HhaTable): string {
  const h = hha?.[code];
  const words = [...names, label(`tent.tab.${kindOf(code)}`)];
  if (h?.s) words.push(label(`tent.series.${h.s}`), h.s);
  for (const c of new Set(h?.c ?? [])) words.push(label(`tent.filter.colour.${c}`), label(`tent.colour.${c}`), c);
  for (const th of h?.t ?? []) words.push(label(`tent.theme.${th}`), th);
  if (GYM.has(code)) words.push(label('tent.filter.gym'), 'gym');
  return fold(words.filter(Boolean).join('|'));
}

// ---- the list ----

export interface ShelfView {
  /** The kind shown, or null: every kind (a search). */
  kind: Kind | null;
  /** The query's terms (queryOf), empty: none. */
  query: readonly (readonly string[])[];
  filters: Filters;
  sort: Sort;
  /** The entries' own order stands for 'new' (★'s, 最近's: newest first already). */
  ordered?: boolean;
}
export interface ShelfCtx {
  hha?: HhaTable;
  /** How many of each code stand in the room. */
  counts: ReadonlyMap<string, number>;
  /** A code's haystack (memoised by the caller). */
  hay: (code: string) => string;
  /** A code's name on screen (the name sort). */
  name: (code: string) => string;
  /** The name sort's (五十音: Intl.Collator('ja')). */
  collator?: Intl.Collator;
}

const COLOURS = ['White', 'Black', 'Gray', 'Brown', 'Beige', 'Red', 'Pink', 'Orange', 'Yellow', 'Green', 'Aqua', 'Blue', 'Purple', 'Colorful'] as const;
/** NH's catalogue colours, in the filter's order. */
const COLOUR_ORDER: readonly string[] = COLOURS;
/** Each colour's dot in the filter (Colorful: a wheel). */
export const SWATCH: Readonly<Record<string, string>> = {
  White: '#fbf8f0', Black: '#2b2622', Gray: '#9a958c', Brown: '#8a5a33', Beige: '#dcc7a1', Red: '#d9473b', Pink: '#f19bb5', Orange: '#f08a2c',
  Yellow: '#f3cf3a', Green: '#5fae4e', Aqua: '#5cc6c9', Blue: '#3f74c9', Purple: '#8d5cc0', Colorful: 'conic-gradient(#d9473b, #f3cf3a, #5fae4e, #3f74c9, #8d5cc0, #d9473b)'
};

/** Whether an entry passes the filters. */
function passes(e: Entry, f: Filters, ctx: Pick<ShelfCtx, 'hha' | 'counts'>): boolean {
  if (f.src.length && !f.src.includes(e.src as 'find')) return false;
  if (f.room.length && !f.room.includes((ctx.counts.get(e.code) ?? 0) > 0 ? 'in' : 'out')) return false;
  const h = ctx.hha?.[e.code];
  if (f.colour.length && !(h?.c ?? []).some((c) => f.colour.includes(c))) return false;
  if (f.series.length && !(h?.s && f.series.includes(h.s))) return false;
  if (f.theme.length && !f.theme.some((th) => (th === 'gym' ? GYM.has(e.code) : !!h?.t?.includes(th)))) return false;
  if (f.size.length && !f.size.includes(tilesBand(e.code) as '1')) return false;
  return true;
}

/** The list: the kind's entries (or every kind's, for a search), matching the query, passing the filters, sorted.
 *  Ties keep the entries' own order (newest got first, then the catalogue's). */
export function shelve(entries: readonly Entry[], view: ShelfView, ctx: ShelfCtx): Entry[] {
  const out = entries.filter((e) => (view.kind === null || kindOf(e.code) === view.kind) && (!view.query.length || matches(ctx.hay(e.code), view.query)) && passes(e, view.filters, ctx));
  const col = ctx.collator ?? new Intl.Collator('ja');
  const idx = new Map(entries.map((e, i) => [e.code, i]));
  const tie = (a: Entry, b: Entry) => idx.get(a.code)! - idx.get(b.code)!;
  const pts = (c: string) => ctx.hha?.[c]?.p ?? 0;
  const area = (c: string) => (ITEMS[c] ? ITEMS[c].w * ITEMS[c].d * 100 + ITEMS[c].h : 0);
  const by: Record<Sort, (a: Entry, b: Entry) => number> = {
    new: (a, b) => b.got - a.got || tie(a, b),
    name: (a, b) => col.compare(ctx.name(a.code), ctx.name(b.code)) || tie(a, b),
    // a series together (its name's order), the ones of none last
    series: (a, b) => {
      const sa = ctx.hha?.[a.code]?.s, sb = ctx.hha?.[b.code]?.s;
      return sa && sb ? sa.localeCompare(sb) || col.compare(ctx.name(a.code), ctx.name(b.code)) : sa ? -1 : sb ? 1 : tie(a, b);
    },
    size: (a, b) => area(b.code) - area(a.code) || tie(a, b),
    points: (a, b) => pts(b.code) - pts(a.code) || tie(a, b)
  };
  return view.ordered && view.sort === 'new' ? out : out.sort(by[view.sort]);
}

/** Each kind's count in a list (a search's tabs, the empty state). */
export function kindCounts(entries: readonly Entry[]): Map<Kind, number> {
  const m = new Map<Kind, number>();
  for (const e of entries) m.set(kindOf(e.code), (m.get(kindOf(e.code)) ?? 0) + 1);
  return m;
}

/** The filters' choices worth showing for what I have (a colour, series or theme at least one entry has), with counts,
 *  most first (the colours in NH's order). */
export function facets(entries: readonly Entry[], hha: HhaTable | undefined): { colour: [string, number][]; series: [string, number][]; theme: [string, number][] } {
  const col = new Map<string, number>(), ser = new Map<string, number>(), th = new Map<string, number>();
  const add = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
  let gym = 0;
  for (const e of entries) {
    const h = hha?.[e.code];
    for (const c of new Set(h?.c ?? [])) add(col, c);
    if (h?.s) add(ser, h.s);
    for (const t of h?.t ?? []) add(th, t);
    if (GYM.has(e.code)) gym++;
  }
  const most = (m: Map<string, number>) => [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return {
    colour: COLOUR_ORDER.filter((c) => col.has(c)).map((c) => [c, col.get(c)!]),
    series: most(ser),
    theme: [...(gym ? [['gym', gym] as [string, number]] : []), ...most(th)]
  };
}

/** NEW: got within this long and never picked on this phone. */
export const NEW_MS = 3 * 86_400_000;
/** 新着: got within this long. */
export const FRESH_MS = 14 * 86_400_000;
