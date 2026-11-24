// 保存した場所's one search field, read as chips plus free text (docs/places.md "Search"): each keystroke's text split
// into words, each word read from its start as known terms (the time words: 営業中, 今日開いてる, 日曜に; 近く; an area
// of the places' own; a category's words), a particle after a term let go (渋谷のラーメン, 近くのカフェ). A word read
// whole becomes chips and leaves the field; one with anything else stays free text (パンダ is a name, not パン + ダ).
// The last word, still being typed, is taken only when it can't grow into another term and is a time or near word or
// ends on a particle; a category or an area waits for a space or 検索 (Enter), so a name that starts like one
// (パン屋まるき) isn't cut. The chip the map sets (この地点の周辺, a long press) isn't typed. Pure.
import type { PlaceCat } from '../contract/places.ts';
import type { LL } from './geo.ts';
import { placeKey } from './text.ts';
import { catLabel, catTerms, FEATURES } from './cats.ts';

export type Chip =
  | { k: 'open' }
  | { k: 'today' }
  /** Opens on weekday `d` (0 Sunday); `hol`: said as 祝日 (Sunday's hours). */
  | { k: 'day'; d: number; hol?: boolean }
  | { k: 'near' }
  /** `w` (typed ones): the word it was read from, keyed; a name with it in matches too (横浜 typed finds 横浜家系 in
   *  渋谷, Park typed a Park Hotel). */
  | { k: 'area'; name: string; w?: string; label?: string }
  /** `kind`: said as a kind more specific than its sub (神社 of 寺社, bookstore of 本): Google's kind or the name
   *  says it (a place with no kind of its own: its sub). */
  | { k: 'cat'; cat: PlaceCat; sub: string; w?: string; kind?: string }
  /** Rated `min` or more (★4.5, 4.5以上, 評価高い, top rated). */
  | { k: 'rate'; min: number }
  /** Open at minute `m` of weekday `d` (today when absent), in each place's zone (21時, 土曜18時, 深夜, sat 7pm). */
  | { k: 'at'; d?: number; m: number }
  /** Within `m` metres of the anchor (1km以内, 徒歩10分, within 2km). */
  | { k: 'radius'; m: number }
  /** Saved in the last `days` days (最近, recent). */
  | { k: 'recent'; days: number }
  /** Saved by person `who` (an index into the payload's people, `name` theirs). */
  | { k: 'by'; who: number; name?: string }
  /** With a note. */
  | { k: 'memo' }
  /** A meal (ランチ, dinner, 朝ごはん): the places to eat it at (its tops), those open at `m` first (no hour filter). */
  | { k: 'meal'; meal: Meal; m: number }
  /** A feature a name, description or note says (夜景, night view), or a place of its kinds (展望台): cats.ts FEATURES. */
  | { k: 'word'; w: string; label: string }
  /** Not this: a category (`cat`, `sub`) or a word (`w`, as typed) the name, kind or category has. */
  | { k: 'not'; w: string; cat?: PlaceCat; sub?: string }
  /** A point long-pressed on the map (1.5 km about it). */
  | { k: 'point'; at: LL };

/** The radius of 近く, a long-pressed point and an area's surroundings (m). */
export const NEAR_M = 1500;

export type Meal = 'breakfast' | 'lunch' | 'dinner';
const MEAL_LABEL: Record<Meal, string> = { breakfast: '朝ごはん', lunch: 'ランチ', dinner: 'ディナー' };

const DAYS = '日月火水木金土';
const KANA_DAYS = ['にち', 'げつ', 'か', 'すい', 'もく', 'きん', 'ど'];

const hhmm = (m: number): string => (m % 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}` : `${m / 60}時`);

/** A chip's words. */
export function chipLabel(c: Chip): string {
  switch (c.k) {
    case 'open': return '営業中';
    case 'today': return '今日営業';
    case 'day': return c.hol ? '祝日営業' : `${DAYS[c.d]}曜営業`;
    case 'near': return '現在地周辺';
    case 'area': return `${c.label ?? c.name}周辺`;
    case 'cat': return c.kind ?? catLabel(c);
    case 'rate': return `★${c.min.toFixed(1)}以上`;
    case 'at': return `${c.d === undefined ? '' : `${DAYS[c.d]}曜 `}${hhmm(c.m)}に営業`;
    case 'radius': return `半径 ${c.m < 1000 ? `${c.m} m` : `${+(c.m / 1000).toFixed(1)} km`}`;
    case 'recent': return `最近${c.days === 30 ? '1か月' : c.days === 7 ? '1週間' : c.days === 90 ? '3か月' : `${c.days}日`}に保存`;
    case 'by': return `${c.name ?? '?'}の保存`;
    case 'memo': return 'メモあり';
    case 'meal': return MEAL_LABEL[c.meal];
    case 'word': return c.label;
    case 'not': return `${c.sub || c.cat || c.w}以外`;
    case 'point': return 'この地点の周辺';
  }
}

/** One chip per key: a second of the same is dropped; at most one point (the later wins). */
export function chipKey(c: Chip): string {
  switch (c.k) {
    case 'day': return `day${c.d}${c.hol ? 'h' : ''}`;
    case 'area': return `area:${c.name}`;
    case 'cat': return `cat:${c.cat}:${c.sub}${c.kind ? `:${c.kind}` : ''}`;
    case 'by': return `by${c.who}`;
    case 'word': return `word:${c.w}`;
    case 'not': return `not:${c.cat ?? ''}:${c.sub ?? ''}:${placeKey(c.w)}`;
    default: return c.k;
  }
}

/** `chips` with `add` put on the end: one of a key, a new point replacing the old one. */
export function withChips(chips: readonly Chip[], add: readonly Chip[]): Chip[] {
  let out = [...chips];
  for (const c of add) {
    out = out.filter((x) => chipKey(x) !== chipKey(c));
    out.push(c);
  }
  return merged(out);
}

interface Term {
  chips: Chip[];
  /** A time or near word: taken while still being typed. */
  strong: boolean;
  /** A word that says nothing the data has (デート, 雨の日, cheap): read, no chip, kept in the field as this (the
   *  search ignores it, and says so). */
  soft?: string;
}

/** The terms (keyed), and those a longer term of another chip starts with (a word that may still grow into it:
 *  日曜 into 日曜日 is the same chip, 今日 isn't a term). */
export interface Vocab {
  terms: Map<string, Term>;
  grows: Set<string>;
  max: number;
  /** The Latin terms of 5 letters or more (a typo's one edit away: ramenn, coffe). */
  latin: string[];
  /** An area the gazetteer knows with places in it, for a word the terms haven't (VocabMore). */
  gazetteer?: (word: string) => string | null;
  /** A Latin phrase's first word → the rest of each phrase it starts, keyed (near → me, here). */
  starts: Map<string, string[]>;
  /** Whole words never split into terms (VocabMore). */
  known: ReadonlySet<string>;
  /** An area's chip (its one shown spelling as the label). */
  areaChip: (area: string, word: string) => Chip;
}

/** What else the vocabulary reads: the payload's people (うめが保存), other spellings of an area (word → the area's
 *  name: Shibuya, しぶや → 渋谷), a category word that names a kind more specific than its sub (keyed word → the
 *  kind's label: 神社, bookstore). */
export interface VocabMore {
  people?: readonly string[];
  aliases?: Iterable<readonly [word: string, area: string]>;
  specific?: ReadonlyMap<string, string>;
  /** A word (raw) the gazetteer knows as an area with places in it: the area chip's name, else null. */
  gazetteer?: (word: string) => string | null;
  /** Google kinds' words (raw) and the chip each reads as (タイ料理店 for thai, 水族館, 城): a category word wins. */
  kinds?: Iterable<readonly [word: string, chip: Chip]>;
  /** Whole words a name or description holds that must not be split into terms (パンケーキ isn't パン + ケーキ), keyed. */
  known?: ReadonlySet<string>;
  /** The one spelling an area chip shows (渋谷 for Shibuya; search.ts: the gazetteer's Japanese name). */
  display?: (area: string) => string;
}

const PARTICLES = ['にある', 'から', 'まで', 'の', 'に', 'で', 'へ', 'と', 'や'].map(placeKey);
const AREA_TAILS = ['', '駅', '周辺', 'あたり', '付近', 'エリア'];
const keyOf = (t: Term): string => t.chips.map(chipKey).join('|') || `soft:${t.soft}`;
/** The minutes 朝, 昼, 夜 and 深夜 stand for: open by 9:00, at noon, at 19:00, at 23:00. */
const MORNING = 540, NOON = 720, EVENING = 1140, LATE = 1380;
/** 日帰り (a day trip): within 100 km. */
const DAY_TRIP_M = 100_000;
const FOOD: Chip[] = (['麺', '和食・寿司', '肉', '世界の料理'] as const).map((cat) => ({ k: 'cat', cat, sub: '' }));
const EN_DAYS = [['sunday', 'sundays'], ['monday', 'mondays', 'mon'], ['tuesday', 'tuesdays', 'tue', 'tues'], ['wednesday', 'wednesdays', 'wed'], ['thursday', 'thursdays', 'thu', 'thurs'], ['friday', 'fridays', 'fri'], ['saturday', 'saturdays', 'sat']];
/** Words the data can't answer (a mood, a price): read and ignored, never zeroing the list. */
const SOFT = ['デート', '雨の日', 'おすすめ', 'オススメ', 'お勧め', '人気', '有名', '安い', '格安', 'コスパ', 'おしゃれ', 'オシャレ', '穴場', '話題', 'date', 'datenight', 'rainy', 'rainyday', 'romantic', 'cheap', 'thingstodo', 'fun', 'cute', 'popular', 'famous', 'recommended', 'cozy', 'hidden', 'gem', 'hiddengem'];

/** The vocabulary for these areas' names (the places' own: search.ts). Categories over areas over the time words
 *  where a key is both. */
export function vocab(areas: Iterable<string>, more: VocabMore = {}): Vocab {
  const terms = new Map<string, Term>();
  const put = (w: string, chips: Chip | Chip[], strong: boolean) => {
    const k = placeKey(w);
    if (k) terms.set(k, { chips: Array.isArray(chips) ? chips : [chips], strong });
  };
  for (const w of SOFT) terms.set(placeKey(w), { chips: [], strong: false, soft: w });
  // (Japanese glue inside a line: 渋谷のお店, 夜景スポット read as 渋谷, 夜景)
  for (const k of STOP) if (k.length >= 2 && !/^[a-z]+$/.test(k)) terms.set(k, { chips: [], strong: false });
  for (const w of ['営業中', '開いてる', '開いている', '今開いてる', '今開いている', 'あいてる', '今あいてる', 'やってる', '今やってる', 'やっている', '今やっている', '営業してる', '今営業', 'オープン中', 'えいぎょうちゅう', 'いまやってる', 'いまあいてる', 'いまひらいてる', 'ひらいてる', 'いまえいぎょう', 'open', 'opennow']) put(w, { k: 'open' }, true);
  for (const w of ['今日開いてる', '今日開いている', '今日あいてる', '今日やってる', '今日営業', '本日営業', 'きょうやってる', 'きょうあいてる', 'today', 'opentoday']) put(w, { k: 'today' }, true);
  for (let d = 0; d < 7; d++) {
    for (const t of ['曜', '曜日', '曜に', '曜日に', '曜営業', '曜日営業', '曜開いてる', '曜日開いてる', '曜やってる', '曜日やってる']) put(`${DAYS[d]}${t}`, { k: 'day', d }, true);
    for (const t of ['よう', 'ようび', 'ようびに']) put(`${KANA_DAYS[d]}${t}`, { k: 'day', d }, true);
    for (const w of EN_DAYS[d]) for (const t of ['', 'open']) put(`${t}${w}`, { k: 'day', d }, true);
  }
  for (const w of ['祝日', '祝日に', '祝日営業', '祝日開いてる', 'holiday', 'holidays']) put(w, { k: 'day', d: 0, hol: true }, true);
  for (const w of ['近く', '近くの', '周辺', '近所', 'この辺', 'このへん', '近場', '付近', '現在地', '現在地周辺', 'ちかく', 'ちかくの', 'きんじょ', 'nearby', 'nearme', 'aroundme', 'closeby', 'aroundhere', 'nearhere']) put(w, { k: 'near' }, true);
  for (const w of ['夜', '今夜', '今晩', '夜に', 'tonight', 'evening']) put(w, { k: 'at', m: EVENING }, true);
  for (const w of ['ディナー', '夜ご飯', '夜ごはん', '晩ご飯', '晩ごはん', 'dinner', 'supper']) put(w, { k: 'meal', meal: 'dinner', m: EVENING }, true);
  for (const w of ['深夜', '夜遅く', '夜中', '遅くまで', '深夜営業', 'late', 'latenight', 'openlate', 'midnight']) put(w, { k: 'at', m: LATE }, true);
  for (const w of ['朝', '早朝', '朝から', 'morning', 'early']) put(w, { k: 'at', m: MORNING }, true);
  for (const w of ['朝ごはん', '朝ご飯', '朝食', 'モーニング', 'breakfast']) put(w, { k: 'meal', meal: 'breakfast', m: MORNING }, true);
  for (const w of ['昼', 'お昼']) put(w, { k: 'at', m: NOON }, true);
  for (const w of ['ランチ', '昼ごはん', '昼ご飯', 'lunch']) put(w, { k: 'meal', meal: 'lunch', m: NOON }, true);
  for (const f of FEATURES) for (const w of f.words) put(w, { k: 'word', w: placeKey(f.label), label: f.label }, false);
  for (const w of ['ご飯', 'ごはん', '飯', 'めし', '食事', '食べる', '食べたい', '食べ物', 'グルメ', '飲食店']) put(w, FOOD, false);
  for (const w of ['高評価', '評価高い', '評価が高い', '評価の高い', 'highlyrated', 'wellrated', 'goodreviews']) put(w, { k: 'rate', min: 4.3 }, false);
  for (const w of ['最高評価', '評価最高', 'toprated', 'bestrated', 'best', 'top']) put(w, { k: 'rate', min: 4.5 }, false);
  for (const w of ['日帰り', '日帰りで', 'daytrip', 'daytrips']) put(w, { k: 'radius', m: DAY_TRIP_M }, false);
  for (const w of ['最近', '最近保存', '最近保存した', '新着', 'recent', 'recently', 'recentlysaved', 'newest', 'latest']) put(w, { k: 'recent', days: 30 }, false);
  // (a note and who saved it: the payload has the people)
  if (more.people?.length) for (const w of ['メモあり', 'メモ付き', 'メモがある', 'メモ有り', 'withnotes', 'withnote', 'hasnote']) put(w, { k: 'memo' }, false);
  (more.people ?? []).forEach((nm, who) => {
    if (!nm) return;
    const chip: Chip = { k: 'by', who, name: nm };
    for (const t of ['が保存', 'の保存', 'が保存した', 'の保存した', 'が追加']) put(`${nm}${t}`, chip, false);
    // in Latin letters too: the name, its first word, a kana name's romaji (ume)
    const own = [...new Set([nm, nm.split(/\s+/)[0], romajiOf(nm)].map(placeKey).filter((x) => /^[a-z]{2,}$/.test(x)))];
    for (const n of own) for (const [a, b] of [['savedby', ''], ['addedby', ''], ['', 'saved'], ['', 's'], ['', 'ssaved']]) put(`${a}${n}${b}`, chip, false);
  });
  for (const [w, c] of more.kinds ?? []) {
    const k = placeKey(w);
    // (a country's or city's word is the area's: 台湾, kyoto)
    if (k && !STOP.has(k) && (/[一-鿿]/.test(k) || k.length >= 3) && !terms.has(k) && !more.gazetteer?.(w)) put(w, c, false);
  }
  const shown = more.display ?? ((a: string) => a);
  const areaChip = (a: string, w: string): Chip => (shown(a) !== a ? { k: 'area', name: a, w: placeKey(w), label: shown(a) } : { k: 'area', name: a, w: placeKey(w) });
  for (const a of areas) if (areaWord(a)) for (const t of AREA_TAILS) put(`${a}${t}`, areaChip(a, a), false);
  for (const [w, a] of more.aliases ?? []) if (areaWord(w) && !terms.has(placeKey(w))) for (const t of AREA_TAILS) put(`${w}${t}`, areaChip(a, w), false);
  for (const { word, pick } of catTerms()) {
    const w = placeKey(word);
    const kind = more.specific?.get(w);
    put(word, { k: 'cat', ...pick, ...(w.length >= 2 ? { w } : {}), ...(kind ? { kind } : {}) }, false);
  }
  const grows = new Set<string>();
  let max = 0;
  for (const [k, t] of terms) {
    max = Math.max(max, k.length);
    for (let i = 1; i < k.length; i++) {
      const s = terms.get(k.slice(0, i));
      if (s && keyOf(s) !== keyOf(t)) grows.add(k.slice(0, i));
    }
  }
  const latin = [...terms.keys()].filter((k) => k.length >= 5 && /^[a-z]+$/.test(k));
  // the first words of the Latin phrases (open now, top rated, late night): one waits for the next while typed
  const starts = new Map<string, string[]>();
  for (const ph of PHRASES) {
    const [h, ...rest] = ph.split(' ');
    starts.set(h, [...(starts.get(h) ?? []), rest.join('')]);
  }
  const gz = more.gazetteer, memo = new Map<string, string | null>();
  const gazetteer = gz && ((w: string) => {
    let a = memo.get(w);
    if (a === undefined) memo.set(w, (a = gz(w)));
    return a;
  });
  return { terms, grows, max, latin, gazetteer, starts, known: more.known ?? new Set(), areaChip };
}

/** An area name or alias that may stand as a term: not glue (nice, la), a Latin one of 4 letters or more, a kana-only
 *  reading of 3 characters or more (なす is an eggplant before it's 那須), never a plus code's piece. */
function areaWord(w: string): boolean {
  const k = placeKey(w);
  if (k.length < 2 || STOP.has(k) || SOFT_KEYS.has(k)) return false;
  if (/^[a-z0-9]+$/.test(k)) return k.length >= 4 && !/\d/.test(k);
  if (/^[ぁ-ゖ]+$/.test(k)) return k.length >= 3;
  return true;
}

/** The English phrases read as one term (their words apart), for waiting on their first word while typed. */
const PHRASES = ['near me', 'around me', 'close by', 'around here', 'near here', 'open now', 'open today', 'open late', 'late night', 'top rated', 'best rated', 'highly rated', 'well rated', 'good reviews', 'things to do', 'rainy day', 'date night', 'recently saved', 'with notes', 'with note', 'has note', 'day trip', 'day trips', 'hot spring', 'hot springs', 'ice cream', 'night view', 'night market'];

const KANA = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';
const ROMA = 'a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa wo n'.split(' ');
/** A kana name's romaji (うめ → ume, ウェイ → wei; voiced and small kana roughly), '' for any other. */
function romajiOf(name: string): string {
  const k = name.normalize('NFKC').replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  if (!/^[ぁ-ゖー]+$/.test(k)) return '';
  let out = '';
  for (const ch of k.normalize('NFD').replace(/[\u3099\u309a]/g, '')) {
    const small = 'ぁぃぅぇぉゃゅょっ'.indexOf(ch);
    if (small >= 0) out = small < 5 ? out.replace(/[aiueo]$/, '') + 'aiueo'[small] : small < 8 ? out.replace(/i$/, '') + ['ya', 'yu', 'yo'][small - 5] : out;
    else if (ch === 'ー') continue;
    else out += ROMA[KANA.indexOf(ch)] ?? '';
  }
  return out.replace(/^u(?=[ei])/, 'w');
}

/** One edit apart (a letter in, out, changed, or two swapped). */
function oneOff(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1 || a === b) return false;
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

type Read = { chips: Chip[]; strong: boolean; particle: boolean; last: string; soft: string[] };
const NONE: Read = { chips: [], strong: false, particle: false, last: '', soft: [] };

/** The numbers a word may say (on its NFKC, lower-cased text: the key drops their dots and colons), each from where
 *  it stands: a rating needs its marker (★4, 4.5以上, 評価4, 4+, 4stars: 4月 and 4号店 stay text), a time its 時 or
 *  am/pm or a colon (21時, 夜7時, 7pm, 19:00), a distance its unit (1km以内, 800m, 徒歩10分, 10minwalk). */
const NUMS: { re: RegExp; chip: (m: RegExpExecArray) => Chip | null }[] = [
  { re: /(?:徒歩|歩いて|walk(?:ing)?)(\d{1,3})分(?:以内|圏内)?|(\d{1,3})(?:分|min|mins|minutes?)(?:walk|walking|歩く|歩き)|(\d{1,3})(?:min|mins|minutes?)(?![a-z])/y, chip: (m) => ({ k: 'radius', m: Number(m[1] ?? m[2] ?? m[3]) * 80 }) },
  // (under 100 m only with its 以内 or within: 3m is a name's)
  { re: /(within|半径)?(\d{1,3}(?:\.\d)?)(km|キロ|m|メートル)(以内|圏内|まで)?(?![a-z])/y, chip: (m) => {
    const r = Math.round(Number(m[2]) * (m[3] === 'km' || m[3] === 'キロ' ? 1000 : 1));
    return r >= 100 || m[1] || m[4] ? { k: 'radius', m: Math.max(r, 50) } : null;
  } },
  // (夜1時, 深夜2時: past midnight, 25:00 of the day; 夜12時 24:00; 24時–29時 the same)
  { re: /(?:(深夜|夜中|今夜|夜|午後|pm)|(午前|朝|am))?(\d{1,2})(?:時(半)?|:(\d{2})|(am|pm))(?:に|から|頃|ごろ|以降|開いてる|やってる|営業)?/y, chip: (m) => {
    let h = Number(m[3]);
    const min = m[4] ? 30 : Number(m[5] ?? 0);
    const night = m[1] && m[1] !== '午後' && m[1] !== 'pm';
    if (night && (h <= 4 || h === 12)) h = h === 12 ? 24 : h + 24;
    else if ((m[1] || m[6] === 'pm') && h < 12) h += 12;
    if ((m[2] || m[6] === 'am') && h === 12) h = 0;
    return h <= 29 && min < 60 ? { k: 'at', m: h * 60 + min } : null;
  } },
  { re: /(?:[★☆*]|星|評価|rating|rated)(\d(?:\.\d)?)(?:以上|\+|点以上|点|つ星|stars?)?|(\d(?:\.\d)?)(?:以上|\+|点以上|つ星|stars?)/y, chip: (m) => {
    const r = Number(m[1] ?? m[2]);
    return r >= 1 && r <= 5 ? { k: 'rate', min: r } : null;
  } }
];
/** A word's negation: a leading - or a trailing 以外 / じゃない (ラーメン以外). */
const NOT_TAIL = /(?:以外|じゃない|じゃなく)$/;
const NOT_DE = /(?:でない|ではない|でなく|ではなく)$/;

/** One word read: its chips if the whole of it is terms, numbers and particles, how it ended. A particle may lead
 *  (の after a chip typed before it: 営業中 | のカフェ). A one-character term (本, 山, 夜) stands only between the word's
 *  ends, particles or time words, so 山本 or 本山 stay names. A word in Latin letters is one term or none (barber isn't
 *  bar + beer; cafes is cafe's plural) and waits for a space (typed a letter at a time: open may grow into opentable).
 *  A time right after a weekday is that day's (土曜18時); an 'open' word after a time is the time's (日曜にやってる). */
function readWord(v: Vocab, word: string): Read | null {
  const raw = word.normalize('NFKC').toLowerCase();
  const tail = raw.replace(NOT_TAIL, '');
  if (/^[-−]./.test(raw)) return notOf(v, word.slice(1));
  if (tail !== raw && tail) return notOf(v, word.normalize('NFKC').replace(NOT_TAIL, ''));
  // (でない / ではない: a category's only; 出ない stays a word)
  const cut = raw.replace(NOT_DE, '');
  if (cut !== raw && cut) {
    const r = notOf(v, word.normalize('NFKC').replace(NOT_DE, ''));
    if (r && r.chips[0].k === 'not' && r.chips[0].cat) return r;
  }
  const k = placeKey(word);
  if (!k) return null;
  if (/^[a-z][a-z' ]*$/.test(raw)) {
    const t = latin(v, k);
    if (t) return { chips: t.chips, strong: false, particle: false, last: k, soft: t.soft ? [t.soft] : [] };
    const a = v.gazetteer?.(word);
    return a ? { ...NONE, chips: [v.areaChip(a, k)], last: k } : null;
  }
  // (a whole word names and descriptions hold, not two terms: パンケーキ isn't パン + ケーキ)
  if (v.known.has(k) && !v.terms.has(k)) return null;
  const r = nums(v, raw);
  if (r) return r;
  const a = v.gazetteer?.(word);
  if (a) return { ...NONE, chips: [v.areaChip(a, k)], last: k };
  return pieced(v, word);
}

/** A line the terms can't read whole, cut at its particles, each piece read whole (しもきたざわのふるぎや: the area
 *  and 古着屋); the pieces nothing reads stay text (soft). Null unless a piece gives a chip and the cut is clean (no
 *  piece of one kana: まるの内 isn't まる + 内). */
function pieced(v: Vocab, word: string): Read | null {
  // (glue words whole first: ところ isn't と + ころ)
  let t = word.normalize('NFKC');
  for (const g of GLUE_JA) t = t.split(g).join('\u0000');
  const ps = t.split(/(?:から|まで|の|で|に|が|を|と|へ|\u0000)/).filter(Boolean);
  if ((ps.length < 2 && t === word.normalize('NFKC')) || !ps.length || ps.some((p) => p.length < 2)) return null;
  const out: Read = { ...NONE, chips: [], soft: [] };
  for (const p of ps) {
    const k = placeKey(p);
    const r = readKey(v, k) ?? (v.gazetteer?.(p) ? { ...NONE, chips: [v.areaChip(v.gazetteer(p)!, k)] } : null);
    if (r?.chips.length) out.chips.push(...r.chips);
    else if (!STOP.has(k)) out.soft.push(p);
  }
  return out.chips.length ? out : null;
}

/** A Latin word's term: itself, else its singular (cafes, temples, dumplings; 4 letters or more), else the one term a
 *  typo away (ramenn, coffe; 5 letters or more, and only one such). */
function latin(v: Vocab, k: string): Term | undefined {
  const t = v.terms.get(k) ?? (k.length >= 4 && k.endsWith('s') ? (v.terms.get(k.slice(0, -1)) ?? (k.endsWith('es') ? v.terms.get(k.slice(0, -2)) : undefined)) : undefined);
  if (t || k.length < 5) return t;
  const near = v.latin.filter((x) => oneOff(k, x));
  return near.length === 1 ? v.terms.get(near[0]) : undefined;
}

/** A negated word: its category's chip negated, else the word itself. */
function notOf(v: Vocab, word: string): Read | null {
  const k = placeKey(word);
  if (!k) return null;
  const t = /^[a-z]+$/.test(k) ? latin(v, k) : v.terms.get(k);
  const c = t?.chips.length === 1 && t.chips[0].k === 'cat' ? t.chips[0] : null;
  const w = c ? (c.kind ?? (c.sub || c.cat)) : word;
  return { ...NONE, chips: [{ k: 'not', w, ...(c ? { cat: c.cat, sub: c.sub } : {}) }], last: k };
}

/** A key read from its start, or after a leading particle. */
const readKey = (v: Vocab, k: string): Read | null => {
  const lead = PARTICLES.find((x) => k.startsWith(x) && x.length < k.length);
  return readFrom(v, k, 0, true) ?? (lead ? readFrom(v, k, lead.length, true) : null);
};

/** The word split at its numbers, each other piece read as terms. */
function nums(v: Vocab, raw: string): Read | null {
  const pieces: (string | Chip)[] = [];
  let i = 0, text = '';
  outer: while (i < raw.length) {
    // (a number glued to a letter or digit before it is a name's: 2nd, 7eleven, the 2 of 12)
    if (!(i > 0 && /[a-z0-9.]/.test(raw[i - 1]))) {
      for (const n of NUMS) {
        n.re.lastIndex = i;
        const m = n.re.exec(raw);
        const c = m && m[0] && !/[a-z0-9]/.test(raw[i + m[0].length] ?? '') ? n.chip(m) : null;
        if (c) {
          if (text) pieces.push(text);
          ((text = ''), pieces.push(c), (i += m![0].length));
          continue outer;
        }
      }
    }
    text += raw[i++];
  }
  if (text) pieces.push(text);
  if (pieces.length === 1 && typeof pieces[0] === 'string') return readKey(v, placeKey(raw));
  const out: Read = { ...NONE, chips: [], soft: [] };
  for (const [j, p] of pieces.entries()) {
    if (typeof p !== 'string') {
      (out.chips.push(p), (out.strong = false), (out.particle = false), (out.last = ''));
      continue;
    }
    const k = placeKey(p);
    if (!k) continue;
    if (PARTICLES.includes(k)) {
      out.particle = j === pieces.length - 1;
      continue;
    }
    const r = readKey(v, k);
    if (!r) return null;
    (out.chips.push(...r.chips), out.soft.push(...r.soft));
    ((out.strong = r.strong), (out.particle = r.particle), (out.last = r.last));
  }
  return out;
}

/** The chips folded, in order (parse's, and withChips' over the whole row, so typing a key at a time gives what the
 *  whole line does): a time right after a weekday is that day's (土曜 18時); one time at most, the later (朝ごはん 7時:
 *  7時), a weekday it holds not again; an 'open' or 'today' right after a weekday or a time says nothing more
 *  (日曜にやってる), and a weekday or a time right after an 'open' is what it meant (open late, open sunday). */
function merged(chips: readonly Chip[]): Chip[] {
  let out: Chip[] = [];
  for (const c of chips) {
    const prev = out.at(-1);
    if (c.k === 'at') {
      const at = c.d === undefined && prev?.k === 'day' && !prev.hol ? { ...c, d: prev.d } : c;
      if (at !== c || prev?.k === 'open') out.pop();
      out = out.filter((x) => x.k !== 'at');
      out.push(at);
    } else if ((c.k === 'open' || c.k === 'today') && (prev?.k === 'day' || prev?.k === 'at')) continue;
    else if (c.k === 'day' && prev?.k === 'open') out[out.length - 1] = c;
    else out.push(c);
  }
  const atDays = new Set(out.map((c) => (c.k === 'at' ? c.d : undefined)).filter((d) => d !== undefined));
  return out.filter((c) => !(c.k === 'day' && !c.hol && atDays.has(c.d)));
}

/** The key from `i` read as terms, each followed by a particle or not (whichever reads the rest), longest first. */
function readFrom(v: Vocab, k: string, i: number, bound: boolean): Read | null {
  if (i >= k.length) return NONE;
  for (let n = Math.min(v.max, k.length - i); n > 0; n--) {
    const s = k.slice(i, i + n);
    const t = v.terms.get(s);
    if (!t) continue;
    const end = i + n;
    for (const p of [...PARTICLES.filter((x) => k.startsWith(x, end)), '']) {
      if (n === 1 && !(bound && (end + p.length === k.length || p))) continue;
      const rest = readFrom(v, k, end + p.length, !!p || t.strong);
      if (!rest) continue;
      const tail = end + p.length === k.length;
      return {
        chips: [...t.chips, ...rest.chips],
        soft: [...(t.soft ? [t.soft] : []), ...rest.soft],
        strong: tail ? t.strong : rest.strong,
        particle: tail ? !!p : rest.particle,
        last: tail ? s : rest.last
      };
    }
  }
  return null;
}

export interface Parsed {
  /** The chips this text adds. */
  chips: Chip[];
  /** What stays in the field. */
  text: string;
  /** The last word's term (keyed) when it was taken still being typed: what comes next may go on with it
   *  (continues). */
  tail: string;
}

/** Two or three Latin words read as one term (near me, open now, top rated, late night, things to do). */
const PHRASE_MAX = 3;
const NEGATE = /^(?:no|not|except|without|non)$/i;

/**
 * The field's text read: the words taken as chips, the rest left as it was typed. `commit` (Enter, or the field let
 * go): the last word is taken too when it's all terms. A soft word (デート) stays in the field (the search ignores it);
 * one inside a word with chips (東京から日帰り) is left as its own word. A number and its unit typed apart are one word
 * (4 stars, 2 km, 7 pm).
 */
export function parse(v: Vocab, raw: string, commit = false): Parsed {
  const joined = raw.replace(/(\d)[\s　]+(km|m|stars?|pm|am|min|mins|minutes|時|分)(?=$|[\s　])/gi, '$1$2').replace(/\b(within)[\s　]+(?=\d)/gi, '$1');
  const words = joined.split(/[\s　]+/);
  const open = words.at(-1) !== ''; // the last word still being typed
  const list = words.filter(Boolean);
  const chips: Chip[] = [];
  const keep: string[] = [];
  let tail = '';
  for (let i = 0; i < list.length; i++) {
    let w = list[i], span = 1;
    for (let n = Math.min(PHRASE_MAX, list.length - i); n >= 2; n--) {
      const ws = list.slice(i, i + n);
      if (ws.every((x) => /^[a-z]+$/i.test(x)) && v.terms.has(placeKey(ws.join('')))) {
        ((w = ws.join('')), (span = n));
        break;
      }
    }
    // no X, not X, except X, without X: X's category negated
    if (span === 1 && NEGATE.test(w) && list[i + 1]) {
      const r = notOf(v, list[i + 1]);
      if (r && r.chips[0].k === 'not' && r.chips[0].cat && (i + 2 < list.length || !open || commit)) {
        chips.push(...r.chips);
        i++;
        continue;
      }
      // (not open, no late: a chip that isn't a category can't be negated: both words stay text)
      if (readWord(v, list[i + 1])?.chips.length) {
        keep.push(w, list[i + 1]);
        i++;
        continue;
      }
    }
    // a phrase's first word waits while the phrase may still come (top | top r… | top rated)
    if (span === 1 && !commit && v.starts.has(placeKey(w))) {
      const next = list[i + 1], rest = v.starts.get(placeKey(w))!;
      const lastDone = i === list.length - 1 && !open;
      const growing = i === list.length - 2 && open && !!next && rest.some((x) => x.startsWith(placeKey(next)));
      if (lastDone || growing || (i === list.length - 1 && open)) {
        keep.push(...list.slice(i));
        break;
      }
    }
    const r = readWord(v, w);
    const typing = open && i + span >= list.length && !commit;
    const take = !!r && r.chips.length > 0 && (!typing || r.particle || (r.strong && !v.grows.has(r.last)));
    if (take) {
      chips.push(...r!.chips);
      keep.push(...r!.soft);
      if (typing) tail = placeKey(w);
    } else keep.push(...list.slice(i, i + span));
    i += span - 1;
  }
  const all = merged(chips);
  if (!all.length) return { chips: all, text: raw, tail: '' };
  return { chips: all, text: keep.length ? keep.join(' ') + (open ? '' : ' ') : '', tail };
}

/**
 * What's typed after a word that just became a chip as it was typed (`tail`: parse's): `more` when the two make
 * another term of the same chip (日曜 + 日 → 日曜日, 近く + の: the keystroke goes into the chip), `wait` while they're on
 * the way to one (日曜 + 営, till 業), else null (a word of its own). Direct kana input types a word a key at a time.
 */
export function continues(v: Vocab, tail: string, typed: string): 'more' | 'wait' | null {
  const t = v.terms.get(tail), k = tail + placeKey(typed);
  if (t && typed && k === tail) return 'more'; // (ー, a small kana's fold: nothing new)
  if (!t || k === tail) return null;
  const same = (x: Term | undefined) => !!x && keyOf(x) === keyOf(t);
  if (same(v.terms.get(k))) return 'more';
  for (const [key, x] of v.terms) if (key.length > k.length && key.startsWith(k) && same(x)) return 'wait';
  return null;
}


/** Glue the search lets go when there's anything else to go by (in, the, near, now; の, で, お店): not wants. */
const STOP_WORDS = ['in', 'at', 'the', 'a', 'an', 'near', 'now', 'me', 'with', 'for', 'of', 'around', 'to', 'do', 'and', 'or', 'some', 'any', 'good', 'nice', 'great', 'place', 'places', 'spot', 'spots', 'things', 'shop', 'shops', 'store', 'stores', 'find', 'show', 'open', 'from', 'by', 'on', 'day', 'night', 'の', 'で', 'から', 'に', 'へ', 'と', 'や', '店', 'お店', '場所', 'ところ', 'スポット', 'いい', '良い', '行きたい', 'within', 'rated', 'saved', 'walk', 'walking', 'min', 'mins', 'minutes', 'food', 'eat', 'eats', 'meal', 'meals', 'きれいな', 'ステキな', '素敵な', 'でも', '見える', '見られる', '眺める', '望む', '楽しめる', 'できる', 'ある', 'いる', '行ける', '食べられる', '飲める', 'したい', 'たい'];
export const STOP = new Set(STOP_WORDS.map(placeKey));
/** The Japanese glue words of 2 characters or more, longest first (a line's cut keeps them whole). */
const GLUE_JA = STOP_WORDS.filter((k) => k.length >= 2 && !/^[a-z]+$/.test(k)).sort((a, b) => b.length - a.length);
/** The soft words, keyed (the search says it ignored them). */
export const SOFT_KEYS = new Set(SOFT.map(placeKey));
