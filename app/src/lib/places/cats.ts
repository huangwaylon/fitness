// 保存した場所's categories as the app draws and finds them (docs/places.md "Categories"): the contract's taxonomy
// (contract/places.ts PLACE_CATS), each top in a family (its token colour, its marker's shape) with a one-kanji glyph,
// and the words a search reads as a category (each sub's and top's own name, then its synonyms). Pure.
import { PLACE_CATS, PLACE_CAT_KEYS, type PlaceCat } from '../contract/places.ts';
import { placeKey } from './text.ts';

export type Shape = 'circle' | 'diamond' | 'square';
export interface Family {
  /** The fill (a token's literal: MapLibre and a canvas paint no CSS variables; styles/tokens.css). */
  fill: string;
  /** The glyph's colour on it (ink on the light fills, white on sky and ink-soft). */
  ink: string;
  shape: Shape;
}
const INK = '#4A3A2C', WHITE = '#FFFFFF';
const F = {
  food: { fill: '#FF8F7A', ink: INK, shape: 'circle' }, // --c-coral
  drink: { fill: '#E88FAE', ink: INK, shape: 'circle' }, // --c-rose
  cafe: { fill: '#F2C14E', ink: INK, shape: 'circle' }, // --c-gold
  sight: { fill: '#4F9BE0', ink: WHITE, shape: 'diamond' }, // --c-sky
  nature: { fill: '#6ED07A', ink: INK, shape: 'diamond' }, // --c-leaf
  onsen: { fill: '#7BD7C1', ink: INK, shape: 'diamond' }, // --c-mint
  shop: { fill: '#CDB4F2', ink: INK, shape: 'square' }, // --c-lilac
  other: { fill: '#6B5544', ink: WHITE, shape: 'square' } // --c-ink-soft
} as const satisfies Record<string, Family>;

/** Each top's family and glyph. */
export const CAT_STYLE: Record<PlaceCat, Family & { glyph: string }> = {
  麺: { ...F.food, glyph: '麺' },
  '和食・寿司': { ...F.food, glyph: '寿' },
  肉: { ...F.food, glyph: '肉' },
  世界の料理: { ...F.food, glyph: '食' },
  '居酒屋・バー': { ...F.drink, glyph: '酒' },
  カフェ: { ...F.cafe, glyph: '茶' },
  甘いもの: { ...F.cafe, glyph: '甘' },
  見どころ: { ...F.sight, glyph: '見' },
  '自然・登山': { ...F.nature, glyph: '山' },
  温泉: { ...F.onsen, glyph: '湯' },
  買い物: { ...F.shop, glyph: '買' },
  泊まる: { ...F.other, glyph: '宿' },
  その他: { ...F.other, glyph: '他' }
};

/** More words for a top or a sub (its own name is always one). A search's word for a sub picks the sub (its top's
 *  chip shown with it); a top's picks the top. */
const SYN: Record<string, readonly string[]> = {
  麺: ['麺類', 'めん', 'noodle', 'noodles'],
  ラーメン: ['拉麺', 'ramen', '中華そば', 'らーめん屋'],
  つけ麺: ['つけめん', 'tsukemen'],
  うどん: ['饂飩', 'udon'],
  そば: ['蕎麦', 'soba', 'そば屋'],
  '和食・寿司': ['和食', '日本料理', 'washoku'],
  寿司: ['すし', '鮨', '鮓', 'sushi', '回転寿司'],
  天ぷら: ['天麩羅', '天婦羅', 'てんぷら', 'tempura'],
  定食: ['定食屋', '食堂'],
  割烹: ['懐石', '会席', '小料理'],
  肉: ['にく', 'ステーキ', 'steak', 'meat'],
  焼肉: ['焼き肉', 'やきにく', 'yakiniku', 'ホルモン'],
  焼き鳥: ['焼鳥', 'やきとり', 'yakitori'],
  とんかつ: ['豚カツ', 'トンカツ', 'tonkatsu', 'かつ'],
  世界の料理: ['洋食', 'レストラン', 'restaurant'],
  中華: ['中華料理', '中国料理', 'chinese', '餃子', 'ぎょうざ', '町中華'],
  イタリアン: ['イタリア料理', 'パスタ', 'ピザ', 'ピッツァ', 'italian', 'pizza', 'pasta'],
  カレー: ['curry', 'カリー', 'スパイスカレー'],
  エスニック: ['タイ料理', 'ベトナム料理', 'インド料理', 'ネパール料理', 'ethnic'],
  バーガー: ['ハンバーガー', 'burger', 'hamburger'],
  '居酒屋・バー': ['飲み屋', '呑み屋', 'お酒', '酒場', '飲み'],
  居酒屋: ['いざかや', 'izakaya'],
  バー: ['bar', 'ワインバー', 'ワイン', 'wine'],
  ビール: ['beer', 'クラフトビール', 'ブルワリー', 'brewery'],
  日本酒: ['酒蔵', 'sake'],
  カフェ: ['cafe', 'café', 'coffee', 'コーヒー', '珈琲'],
  喫茶店: ['喫茶', '純喫茶'],
  甘いもの: ['スイーツ', 'sweets', 'デザート', 'dessert', 'desserts', 'おやつ', '甘味', '甘味処', 'kanmi'],
  パン: ['パン屋', 'ベーカリー', 'bakery', 'bread'],
  ケーキ: ['cake', 'パティスリー', 'ケーキ屋'],
  和菓子: ['団子', 'だんご', '大福', 'あんこ'],
  アイス: ['ice', 'アイスクリーム', 'ジェラート', 'gelato', 'ソフトクリーム', 'かき氷'],
  見どころ: ['観光', '観光地', 'sightseeing'],
  寺社: ['寺', 'お寺', '神社', '寺院', 'temple', 'shrine'],
  美術館: ['博物館', 'ミュージアム', 'museum', 'ギャラリー', 'gallery'],
  景色: ['絶景', '展望', '展望台', '夜景', 'view'],
  公園: ['park', '庭園', '植物園'],
  '自然・登山': ['自然', 'nature', 'アウトドア活動'],
  山: ['mountain', 'mountains', '山頂', '登山', 'ハイキング', 'hiking', 'hike', 'trekking', 'トレッキング', '山歩き'],
  滝: ['waterfall'],
  海: ['ビーチ', 'beach', '海岸', '浜'],
  キャンプ: ['キャンプ場', 'camp', 'camping', 'グランピング'],
  温泉: ['おんせん', 'onsen', '日帰り温泉'],
  銭湯: ['せんとう', 'sento'],
  サウナ: ['sauna', 'サ活'],
  買い物: ['ショッピング', 'shopping', '買物'],
  雑貨: ['雑貨屋', 'ざっか'],
  本: ['本屋', '書店', 'bookstore', 'books'],
  服: ['古着', '洋服', 'アパレル', 'clothes'],
  市場: ['market', 'マルシェ', '朝市'],
  アウトドア: ['outdoor', 'アウトドア用品', '登山用品'],
  泊まる: ['ホテル', '旅館', '宿', '民宿', 'hotel', 'ゲストハウス', 'ryokan', 'inn', 'hostel', 'guesthouse', 'stay'],
  その他: []
};

/** A category chip's value: a top, and one of its subs or ''. */
export interface CatPick {
  cat: PlaceCat;
  sub: string;
}

/** The label a pick shows: the sub's name, else the top's. */
export const catLabel = (c: CatPick): string => c.sub || c.cat;

/** Every word for a pick (its name first), unkeyed. */
export function catWords(cat: PlaceCat, sub = ''): readonly string[] {
  const own = sub || cat;
  return [own, ...(SYN[own] ?? [])];
}

/** Every (word, pick) the parser reads, the top's and each sub's. */
export function catTerms(): { word: string; pick: CatPick }[] {
  const out: { word: string; pick: CatPick }[] = [];
  for (const cat of PLACE_CAT_KEYS) {
    for (const w of catWords(cat)) out.push({ word: w, pick: { cat, sub: '' } });
    for (const sub of PLACE_CATS[cat] as readonly string[]) for (const w of catWords(cat, sub)) out.push({ word: w, pick: { cat, sub } });
  }
  return out;
}

/** Other spellings of a word a name or a description may hold (no category: a dish, a sight, a feature), English
 *  and romaji with the Japanese: one group a line. */
const TEXT = [
  '抹茶|まっちゃ|matcha', '餃子|ぎょうざ|ギョーザ|gyoza|dumpling|小籠包', 'かき氷|カキ氷|かきごおり|kakigori', '古着|ヴィンテージ|ビンテージ|vintage|thrift',
  'お土産|土産|みやげ|souvenir|omiyage', 'テイクアウト|持ち帰り|takeout|takeaway', 'ブランチ|brunch', 'パンケーキ|pancake', '夜景|nightview',
  '予約|reservation|booking', '予約必須|要予約|予約制|完全予約制|完全予約|予約のみ|予約が必要|予約限定', '古民家|kominka', '足湯|ashiyu|footbath', '富士山|ふじさん|fuji|mtfuji', '夜市|nightmarket', '屋台|yatai',
  'うなぎ|鰻|unagi|eel', '紅葉|もみじ|koyo|foliage', 'ヴィーガン|ビーガン|vegan', 'ベジタリアン|vegetarian', 'テラス|terrace',
  '個室|privateroom', '海鮮|seafood', '牡蠣|カキ|oyster', 'ワッフル|waffle', 'クレープ|crepe', 'チーズ|cheese', 'チョコレート|chocolate',
  'ドーナツ|donut|doughnut', 'プリン|pudding', 'バインミー|banhmi', '小籠包|xiaolongbao', '飲茶|dimsum', '火鍋|hotpot', 'タコス|taco|tacos',
  '水族館|aquarium', '動物園|zoo', '洞窟|cave', '灯台|lighthouse'
].map((l) => l.split('|'));
const TEXT_KEYS = new Map<string, string[]>();
for (const g of TEXT) for (const w of g) TEXT_KEYS.set(placeKey(w), g);

/** Every word of the groups, keyed (whole words: never split into terms). */
export const textKeys = (): Iterable<string> => TEXT_KEYS.keys();

/** A free word's other spellings (keyed in, raw out; [] none). */
export const textWords = (k: string): readonly string[] => TEXT_KEYS.get(k) ?? [];
