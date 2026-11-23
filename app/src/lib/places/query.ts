// 保存した場所's one search field, read as chips plus free text (docs/places.md "Search"): each keystroke's text split
// into words, each word read from its start as known terms (the time words: 営業中, 今日開いてる, 日曜に; 近く; an area
// of the places' own; a category's words), a particle after a term let go (渋谷のラーメン, 近くのカフェ). A word read
// whole becomes chips and leaves the field; one with anything else stays free text (パンダ is a name, not パン + ダ).
// The last word, still being typed, is taken only when it can't grow into another term and is a time or near word or
// ends on a particle; a category or an area waits for a space or 検索 (Enter), so a name that starts like one
// (パン屋まるき) isn't cut. The chips the map sets (この地点の周辺, 地図の中心) aren't typed. Pure.
import type { PlaceCat } from '../contract/places.ts';
import { placeKey } from './text.ts';
import { catLabel, catTerms } from './cats.ts';

type LL = [lng: number, lat: number];
export type Chip =
  | { k: 'open' }
  | { k: 'today' }
  /** Opens on weekday `d` (0 Sunday); `hol`: said as 祝日 (Sunday's hours). */
  | { k: 'day'; d: number; hol?: boolean }
  | { k: 'near' }
  /** `w` (typed ones): the word it was read from, keyed; a name with it in matches too (横浜 typed finds 横浜家系 in
   *  渋谷, Park typed a Park Hotel). */
  | { k: 'area'; name: string; w?: string }
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
  /** Saved by person `who` (an index into the payload's people, `name` theirs; members only). */
  | { k: 'by'; who: number; name?: string }
  /** With a note (members only). */
  | { k: 'memo' }
  /** Not this: a category (`cat`, `sub`) or a word (`w`, as typed) the name, kind or category has. */
  | { k: 'not'; w: string; cat?: PlaceCat; sub?: string }
  /** A point long-pressed on the map (1.5 km about it). */
  | { k: 'point'; at: LL }
  /** このあたりで探す: the map's view then (`r` metres about its centre). */
  | { k: 'centre'; at: LL; r: number };

/** The radius of 近く, a long-pressed point and an area's surroundings (m). */
export const NEAR_M = 1500;

const DAYS = '日月火水木金土';

const hhmm = (m: number): string => (m % 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}` : `${m / 60}時`);

/** A chip's words. */
export function chipLabel(c: Chip): string {
  switch (c.k) {
    case 'open': return '営業中';
    case 'today': return '今日営業';
    case 'day': return c.hol ? '祝日営業' : `${DAYS[c.d]}曜営業`;
    case 'near': return '現在地周辺';
    case 'area': return `${c.name}周辺`;
    case 'cat': return c.kind ?? catLabel(c);
    case 'rate': return `★${c.min.toFixed(1)}以上`;
    case 'at': return `${c.d === undefined ? '' : `${DAYS[c.d]}曜 `}${hhmm(c.m)}に営業`;
    case 'radius': return `半径 ${c.m < 1000 ? `${c.m} m` : `${+(c.m / 1000).toFixed(1)} km`}`;
    case 'recent': return `最近${c.days}日に保存`;
    case 'by': return `${c.name ?? '?'}の保存`;
    case 'memo': return 'メモあり';
    case 'not': return `${c.sub || c.cat || c.w}以外`;
    case 'point': return 'この地点の周辺';
    case 'centre': return '地図の中心';
  }
}

/** One chip per key: a second of the same is dropped; at most one point or centre (the later wins). */
export function chipKey(c: Chip): string {
  switch (c.k) {
    case 'day': return `day${c.d}${c.hol ? 'h' : ''}`;
    case 'area': return `area:${c.name}`;
    case 'cat': return `cat:${c.cat}:${c.sub}${c.kind ? `:${c.kind}` : ''}`;
    case 'by': return `by${c.who}`;
    case 'not': return `not:${c.cat ?? ''}:${c.sub ?? ''}:${c.w}`;
    default: return c.k;
  }
}

/** `chips` with `add` put on the end: one of a key, a new point or centre replacing the old one. */
export function withChips(chips: readonly Chip[], add: readonly Chip[]): Chip[] {
  let out = [...chips];
  for (const c of add) {
    const where = c.k === 'point' || c.k === 'centre';
    out = out.filter((x) => chipKey(x) !== chipKey(c) && !(where && (x.k === 'point' || x.k === 'centre')));
    out.push(c);
  }
  return out;
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
}

const PARTICLES = ['にある', 'から', 'まで', 'の', 'に', 'で', 'へ', 'と', 'や'].map(placeKey);
const AREA_TAILS = ['', '駅', '周辺', 'あたり', '付近', 'エリア'];
const keyOf = (t: Term): string => t.chips.map(chipKey).join('|') || `soft:${t.soft}`;
/** The minutes 朝, 昼, 夜 and 深夜 stand for: open by 9:00, at noon, at 19:00, at 23:00. */
const MORNING = 540, NOON = 720, EVENING = 1140, LATE = 1380;
/** 日帰り (a day trip): within 100 km. */
const DAY_TRIP_M = 100_000;
const FOOD: Chip[] = (['麺', '和食・寿司', '肉', '世界の料理'] as const).map((cat) => ({ k: 'cat', cat, sub: '' }));
const BREAKFAST: Chip[] = [{ k: 'at', m: MORNING }, { k: 'cat', cat: 'カフェ', sub: '' }, { k: 'cat', cat: '甘いもの', sub: 'パン' }];
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
  for (const w of ['営業中', '開いてる', '開いている', '今開いてる', '今開いている', 'あいてる', '今あいてる', 'やってる', '今やってる', 'やっている', '今やっている', '営業してる', '今営業', 'オープン中', 'open', 'opennow']) put(w, { k: 'open' }, true);
  for (const w of ['今日開いてる', '今日開いている', '今日あいてる', '今日やってる', '今日営業', '本日営業', 'today', 'opentoday']) put(w, { k: 'today' }, true);
  for (let d = 0; d < 7; d++) {
    for (const t of ['曜', '曜日', '曜に', '曜日に', '曜営業', '曜日営業', '曜開いてる', '曜日開いてる', '曜やってる', '曜日やってる']) put(`${DAYS[d]}${t}`, { k: 'day', d }, true);
    for (const w of EN_DAYS[d]) for (const t of ['', 'open']) put(`${t}${w}`, { k: 'day', d }, true);
  }
  for (const w of ['祝日', '祝日に', '祝日営業', '祝日開いてる', 'holiday', 'holidays']) put(w, { k: 'day', d: 0, hol: true }, true);
  for (const w of ['近く', '近くの', '周辺', '近所', 'この辺', 'このへん', '近場', '付近', '現在地', '現在地周辺', 'nearby', 'nearme', 'aroundme', 'closeby', 'aroundhere', 'nearhere']) put(w, { k: 'near' }, true);
  for (const w of ['夜', '今夜', '今晩', '夜に', 'tonight', 'evening']) put(w, { k: 'at', m: EVENING }, true);
  for (const w of ['ディナー', '夜ご飯', '夜ごはん', '晩ご飯', '晩ごはん', 'dinner']) put(w, [{ k: 'at', m: EVENING }, ...FOOD], true);
  for (const w of ['深夜', '夜遅く', '夜中', '遅くまで', '深夜営業', 'late', 'latenight', 'openlate', 'midnight']) put(w, { k: 'at', m: LATE }, true);
  for (const w of ['朝', '早朝', '朝から', 'morning', 'early']) put(w, { k: 'at', m: MORNING }, true);
  for (const w of ['朝ごはん', '朝ご飯', '朝食', 'モーニング', 'breakfast']) put(w, BREAKFAST, true);
  for (const w of ['昼', 'お昼']) put(w, { k: 'at', m: NOON }, true);
  for (const w of ['ランチ', '昼ごはん', '昼ご飯', 'lunch']) put(w, [{ k: 'at', m: NOON }, ...FOOD], true);
  for (const w of ['ご飯', 'ごはん', '飯', 'めし', '食事', '食べる', '食べたい', '食べ物', 'グルメ', '飲食店', 'food', 'eat', 'eats', 'meal']) put(w, FOOD, false);
  for (const w of ['高評価', '評価高い', '評価が高い', '評価の高い', 'highlyrated', 'wellrated', 'goodreviews']) put(w, { k: 'rate', min: 4.3 }, false);
  for (const w of ['最高評価', '評価最高', 'toprated', 'bestrated', 'best', 'top']) put(w, { k: 'rate', min: 4.5 }, false);
  for (const w of ['日帰り', '日帰りで', 'daytrip', 'daytrips']) put(w, { k: 'radius', m: DAY_TRIP_M }, false);
  for (const w of ['最近', '最近保存', '最近保存した', '新着', 'recent', 'recently', 'recentlysaved', 'newest', 'latest']) put(w, { k: 'recent', days: 30 }, false);
  for (const w of ['メモあり', 'メモ付き', 'メモがある', 'メモ有り', 'withnotes', 'withnote', 'hasnote', 'notes']) put(w, { k: 'memo' }, false);
  (more.people ?? []).forEach((nm, who) => {
    if (!nm) return;
    for (const t of ['が保存', 'の保存', 'が保存した', 'の保存した', 'が追加']) put(`${nm}${t}`, { k: 'by', who, name: nm }, false);
    for (const t of ['savedby', 'addedby']) put(`${t}${nm}`, { k: 'by', who, name: nm }, false);
  });
  for (const a of areas) if (placeKey(a).length >= 2) for (const t of AREA_TAILS) put(`${a}${t}`, { k: 'area', name: a, w: placeKey(a) }, false);
  for (const [w, a] of more.aliases ?? []) if (placeKey(w).length >= 2 && !terms.has(placeKey(w))) for (const t of AREA_TAILS) put(`${w}${t}`, { k: 'area', name: a, w: placeKey(w) }, false);
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
  const gz = more.gazetteer, memo = new Map<string, string | null>();
  const gazetteer = gz && ((w: string) => {
    let a = memo.get(w);
    if (a === undefined) memo.set(w, (a = gz(w)));
    return a;
  });
  return { terms, grows, max, latin, gazetteer };
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
  { re: /(?:徒歩|歩いて|walk(?:ing)?)(\d{1,3})分(?:以内|圏内)?|(\d{1,3})(?:分|min|mins|minutes?)(?:walk|walking|歩く|歩き)/y, chip: (m) => ({ k: 'radius', m: Number(m[1] ?? m[2]) * 80 }) },
  { re: /(?:within|半径)?(\d{1,3}(?:\.\d)?)(km|キロ|m|メートル)(?:以内|圏内|まで)?(?![a-z])/y, chip: (m) => ({ k: 'radius', m: Math.round(Number(m[1]) * (m[2] === 'km' || m[2] === 'キロ' ? 1000 : 1)) }) },
  { re: /(?:(夜|午後|pm)|(午前|朝|am))?(\d{1,2})(?:時(半)?|:(\d{2})|(am|pm))(?:に|から|頃|ごろ|以降|開いてる|やってる|営業)?/y, chip: (m) => {
    let h = Number(m[3]);
    const min = m[4] ? 30 : Number(m[5] ?? 0);
    if ((m[1] || m[6] === 'pm') && h < 12) h += 12;
    if ((m[2] || m[6] === 'am') && h === 12) h = 0;
    return h <= 29 && min < 60 ? { k: 'at', m: (h % 24) * 60 + min } : null;
  } },
  { re: /(?:[★☆*]|星|評価|rating|rated)(\d(?:\.\d)?)(?:以上|\+|点以上|点|つ星|stars?)?|(\d(?:\.\d)?)(?:以上|\+|点以上|つ星|stars?)/y, chip: (m) => {
    const r = Number(m[1] ?? m[2]);
    return r >= 1 && r <= 5 ? { k: 'rate', min: r } : null;
  } }
];
/** A word's negation: a leading - or a trailing 以外 / じゃない (ラーメン以外). */
const NOT_TAIL = /(?:以外|じゃない|じゃなく|でない|抜き)$/;

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
  const k = placeKey(word);
  if (!k) return null;
  if (/^[a-z][a-z' ]*$/.test(raw)) {
    const t = latin(v, k);
    if (t) return { chips: t.chips, strong: false, particle: false, last: k, soft: t.soft ? [t.soft] : [] };
    const a = v.gazetteer?.(word);
    return a ? { ...NONE, chips: [{ k: 'area', name: a, w: k }], last: k } : null;
  }
  const r = nums(v, raw);
  if (r) return r;
  const a = v.gazetteer?.(word);
  return a ? { ...NONE, chips: [{ k: 'area', name: a, w: k }], last: k } : null;
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

/** A time after a weekday is that day's; an 'open' after a weekday or a time says nothing more (日曜にやってる). */
function merged(chips: readonly Chip[]): Chip[] {
  const out: Chip[] = [];
  for (const c of chips) {
    const prev = out.at(-1);
    if (c.k === 'at' && c.d === undefined && prev?.k === 'day' && !prev.hol) out[out.length - 1] = { ...c, d: prev.d };
    else if ((c.k === 'open' || c.k === 'today') && (prev?.k === 'day' || prev?.k === 'at')) continue;
    else if ((c.k === 'day' || c.k === 'at') && prev?.k === 'open') out[out.length - 1] = c;
    else out.push(c);
  }
  return out;
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
  const joined = raw.replace(/(\d)[\s　]+(km|m|stars?|pm|am|min|mins|minutes|時|分)(?=$|[\s　])/gi, '$1$2');
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
  if (!t || k === tail) return null;
  const same = (x: Term | undefined) => !!x && keyOf(x) === keyOf(t);
  if (same(v.terms.get(k))) return 'more';
  for (const [key, x] of v.terms) if (key.length > k.length && key.startsWith(k) && same(x)) return 'wait';
  return null;
}


/** Glue the search lets go when there's anything else to go by (in, the, near, now; の, で, お店): not wants. */
export const STOP = new Set(['in', 'at', 'the', 'a', 'an', 'near', 'now', 'me', 'with', 'for', 'of', 'around', 'to', 'do', 'and', 'or', 'some', 'any', 'good', 'nice', 'great', 'place', 'places', 'spot', 'spots', 'things', 'shop', 'shops', 'store', 'stores', 'find', 'show', 'open', 'from', 'by', 'on', 'day', 'night', 'の', 'で', 'から', 'に', 'へ', 'と', 'や', '店', 'お店', '場所', 'ところ', 'スポット', 'いい', '良い', '行きたい', '見える', '見られる', '眺める', '望む', '楽しめる', 'できる', 'ある', 'いる', '行ける', '食べられる', '飲める', 'したい', 'たい'].map(placeKey));
/** The soft words, keyed (the search says it ignored them). */
export const SOFT_KEYS = new Set(SOFT.map(placeKey));
