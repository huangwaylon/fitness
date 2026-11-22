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
  | { k: 'cat'; cat: PlaceCat; sub: string; w?: string }
  /** A point long-pressed on the map (1.5 km about it). */
  | { k: 'point'; at: LL }
  /** このあたりで探す: the map's view then (`r` metres about its centre). */
  | { k: 'centre'; at: LL; r: number };

/** The radius of 近く, a long-pressed point and an area's surroundings (m). */
export const NEAR_M = 1500;

const DAYS = '日月火水木金土';

export function chipLabel(c: Chip): string {
  switch (c.k) {
    case 'open': return '営業中';
    case 'today': return '今日営業';
    case 'day': return c.hol ? '祝日営業' : `${DAYS[c.d]}曜営業`;
    case 'near': return '現在地周辺';
    case 'area': return `${c.name}周辺`;
    case 'cat': return catLabel(c);
    case 'point': return 'この地点の周辺';
    case 'centre': return '地図の中心';
  }
}

/** One chip per key: a second of the same is dropped; at most one point or centre (the later wins). */
export function chipKey(c: Chip): string {
  switch (c.k) {
    case 'day': return `day${c.d}${c.hol ? 'h' : ''}`;
    case 'area': return `area:${c.name}`;
    case 'cat': return `cat:${c.cat}:${c.sub}`;
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
  chip: Chip;
  /** A time or near word: taken while still being typed. */
  strong: boolean;
}

/** The terms (keyed), and those a longer term of another chip starts with (a word that may still grow into it:
 *  日曜 into 日曜日 is the same chip, 今日 isn't a term). */
export interface Vocab {
  terms: Map<string, Term>;
  grows: Set<string>;
  max: number;
}

const PARTICLES = ['にある', 'の', 'に', 'で', 'へ'].map(placeKey);
const AREA_TAILS = ['', '駅', '周辺', 'あたり', '付近', 'エリア'];

/** The vocabulary for these areas' names (the places' own: search.ts). Categories over areas over the time words
 *  where a key is both. */
export function vocab(areas: Iterable<string>): Vocab {
  const terms = new Map<string, Term>();
  const put = (w: string, chip: Chip, strong: boolean) => {
    const k = placeKey(w);
    if (k) terms.set(k, { chip, strong });
  };
  for (const w of ['営業中', '開いてる', '開いている', '今開いてる', '今開いている', 'あいてる', '今あいてる', 'やってる', '今やってる', 'オープン中', 'open']) put(w, { k: 'open' }, true);
  for (const w of ['今日開いてる', '今日開いている', '今日あいてる', '今日やってる', '今日営業', '本日営業']) put(w, { k: 'today' }, true);
  for (let d = 0; d < 7; d++) for (const t of ['曜', '曜日', '曜に', '曜日に', '曜営業', '曜日営業', '曜開いてる', '曜日開いてる']) put(`${DAYS[d]}${t}`, { k: 'day', d }, true);
  for (const w of ['祝日', '祝日に', '祝日営業', '祝日開いてる']) put(w, { k: 'day', d: 0, hol: true }, true);
  for (const w of ['近く', '近くの', '周辺', '近所', 'この辺', 'このへん', '近場', '付近', '現在地', '現在地周辺', 'nearby']) put(w, { k: 'near' }, true);
  for (const a of areas) if (placeKey(a).length >= 2) for (const t of AREA_TAILS) put(`${a}${t}`, { k: 'area', name: a, w: placeKey(a) }, false);
  for (const { word, pick } of catTerms()) {
    const w = placeKey(word);
    put(word, { k: 'cat', ...pick, ...(w.length >= 2 ? { w } : {}) }, false);
  }
  const grows = new Set<string>();
  let max = 0;
  for (const [k, t] of terms) {
    max = Math.max(max, k.length);
    for (let i = 1; i < k.length; i++) {
      const s = terms.get(k.slice(0, i));
      if (s && chipKey(s.chip) !== chipKey(t.chip)) grows.add(k.slice(0, i));
    }
  }
  return { terms, grows, max };
}

/** One word read from its start: its chips if the whole of it is terms (and particles), how it ended. A particle may
 *  lead (の after a chip typed before it: 営業中 | のカフェ). A one-character term (本, 山, バー's ば) stands only between
 *  the word's ends, particles or time words, so 山本 or 本山 stay names. A word in Latin letters is one term or none
 *  (barber isn't bar + beer) and waits for a space (typed a letter at a time: open may grow into opentable). */
function readWord(v: Vocab, word: string): Read | null {
  const k = placeKey(word);
  if (!k) return null;
  if (/^[a-z0-9]+$/.test(k)) {
    const t = v.terms.get(k);
    return t ? { chips: [t.chip], strong: false, particle: false, last: k } : null;
  }
  const lead = PARTICLES.find((x) => k.startsWith(x) && x.length < k.length);
  return readFrom(v, k, 0) ?? (lead ? readFrom(v, k, lead.length) : null);
}

type Read = { chips: Chip[]; strong: boolean; particle: boolean; last: string };

function readFrom(v: Vocab, k: string, i: number): Read | null {
  const chips: Chip[] = [];
  let strong = false, particle = false, last = '', bound = true; // (bound: at the word's start, after a particle or a time word)
  while (i < k.length) {
    let hit = '';
    for (let n = Math.min(v.max, k.length - i); n > 0; n--) {
      const s = k.slice(i, i + n);
      if (v.terms.has(s)) {
        hit = s;
        break;
      }
    }
    if (!hit) return null;
    const end = i + hit.length;
    const p = PARTICLES.find((x) => k.startsWith(x, end));
    if (hit.length === 1 && !(bound && (end === k.length || p))) return null;
    const t = v.terms.get(hit)!;
    chips.push(t.chip);
    ((strong = t.strong), (last = hit), (particle = !!p), (bound = !!p || t.strong));
    i = end + (p?.length ?? 0);
  }
  return { chips, strong, particle, last };
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

/**
 * The field's text read: the words taken as chips, the rest left as it was typed. `commit` (Enter, or the field let
 * go): the last word is taken too when it's all terms.
 */
export function parse(v: Vocab, raw: string, commit = false): Parsed {
  const words = raw.split(/[\s　]+/);
  const open = words.at(-1) !== ''; // the last word still being typed
  const list = words.filter(Boolean);
  const chips: Chip[] = [];
  const keep: string[] = [];
  let tail = '';
  list.forEach((w, i) => {
    const r = readWord(v, w);
    const typing = open && i === list.length - 1 && !commit;
    const take = !!r && (!typing || r.particle || (r.strong && !v.grows.has(r.last)));
    if (take) chips.push(...r!.chips);
    else keep.push(w);
    if (take && typing) tail = placeKey(w);
  });
  if (!chips.length) return { chips, text: raw, tail: '' };
  return { chips, text: keep.length ? keep.join(' ') + (open ? '' : ' ') : '', tail };
}

/**
 * What's typed after a word that just became a chip as it was typed (`tail`: parse's): `more` when the two make
 * another term of the same chip (日曜 + 日 → 日曜日, 近く + の: the keystroke goes into the chip), `wait` while they're on
 * the way to one (日曜 + 営, till 業), else null (a word of its own). Direct kana input types a word a key at a time.
 */
export function continues(v: Vocab, tail: string, typed: string): 'more' | 'wait' | null {
  const t = v.terms.get(tail), k = tail + placeKey(typed);
  if (!t || k === tail) return null;
  const same = (x: Term | undefined) => !!x && chipKey(x.chip) === chipKey(t.chip);
  if (same(v.terms.get(k))) return 'more';
  for (const [key, x] of v.terms) if (key.length > k.length && key.startsWith(k) && same(x)) return 'wait';
  return null;
}

/** The free text's words, keyed (each must match: search.ts). */
export const words = (text: string): string[] => text.split(/[\s　]+/).map(placeKey).filter(Boolean);
