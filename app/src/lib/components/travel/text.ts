// The guides' text on screen (docs/travel.md "Data shape"): a pair shown in the reader's locale, else the other side
// (Seattle's guide is English only; a text-only side like 'SNA 021' is the guide's own), and its inline tokens as
// parts: `{km:}` in the phone's units (units.ts), `{m:}` / `{c:}` metric or imperial with it, `{p:key}` the trip
// note's value, or locked while the note isn't in; its Japanese cut where a line may break (between words, never
// inside one: ニュープリマス, 予約番号); and where a trip stands, in words.
import { parseTokens } from '#lib/travel/tokens.ts';
import type { L } from '#lib/travel/types.ts';
import { t, type Locale } from '#lib/i18n/index.ts';
import { fmtKm, units } from './units.ts';
import type { Phase } from './when.ts';

/** The reader's side of a pair, else the other ('' for none). */
export const pick = (l: L | undefined | null, locale: Locale): string => (l ? (l[locale] ?? l[locale === 'ja' ? 'en' : 'ja'] ?? '') : '');

/** Whether a pair is shown in the other language than the reader's (no side of its own: lang="…" on it). */
export const otherLang = (l: L | undefined | null, locale: Locale): Locale | null => (l && !l[locale] && l[locale === 'ja' ? 'en' : 'ja'] ? (locale === 'ja' ? 'en' : 'ja') : null);

export type Part = { k: 'text'; s: string } | { k: 'lock'; key: string };

/** A height in metres: '444 m' or '1,457 ft'. */
export const fmtM = (m: number): string => (units.current === 'mi' ? `${Math.round(m * 3.28084).toLocaleString('en-US')} ft` : `${m.toLocaleString('en-US')} m`);
/** A temperature in °C: '29°C' or '84°F'. */
const fmtC = (c: number): string => (units.current === 'mi' ? `${Math.round((c * 9) / 5 + 32)}°F` : `${c}°C`);

/** A string's parts with its tokens rendered: measures in the phone's units, private values from `note` (null: not
 *  loaded yet, every one locked; a key it lacks stays locked too). Neighbouring text runs are joined. */
export function render(s: string, note: Record<string, string> | null): Part[] {
  const out: Part[] = [];
  const text = (x: string) => {
    const last = out.at(-1);
    if (last?.k === 'text') last.s += x;
    else out.push({ k: 'text', s: x });
  };
  for (const tk of parseTokens(s)) {
    if (tk.t === 'text') text(tk.s);
    else if (tk.t === 'km') text(fmtKm(tk.n));
    else if (tk.t === 'm') text(fmtM(tk.n));
    else if (tk.t === 'c') text(fmtC(tk.n));
    else if (tk.t === 'p') {
      const v = note?.[tk.key];
      if (v) text(v);
      else out.push({ k: 'lock', key: tk.key });
    }
  }
  return out;
}

/** A link's href: https as written, or a `{p:key}` from the note (null while locked, or not https). */
export function hrefOf(href: string, note: Record<string, string> | null): string | null {
  const parts = render(href, note);
  if (parts.length !== 1 || parts[0].k !== 'text') return null;
  return /^https:\/\//.test(parts[0].s) ? parts[0].s : null;
}

/** A string with its private values as plain text (a locked one as ・・・): Orville's line. */
export const plain = (s: string, note: Record<string, string> | null): string => render(s, note).map((p) => (p.k === 'text' ? p.s : '・・・')).join('');

/** Where a trip stands, in words: 「あと 97にち」, 「あした しゅっぱつ」, 「いま 2日目」, 「いってきた」. */
export const phaseLabel = (p: Phase): string =>
  p.k === 'now' ? t('travel.nowAria', { n: p.day }) : p.k === 'past' ? t('travel.stamp') : p.days === 1 ? t('travel.tomorrowAria') : t('travel.soonAria', { n: p.days });

const JA = /[\u3040-\u30ff\u3400-\u9fff]/;
const KANA = /^[\u30a0-\u30ffー]+$/;
const HIRA = /^[\u3041-\u309f]+$/;
/** Closing punctuation and the like: kept with the word before it. */
const TAIL = /^[、。，．・）」』】〕！？：；…ー〜]+$/;
/** A counter after a number (2月, 10日, 3日間, 10時間): kept with it. */
const COUNTER = /^[\u3400-\u9fff]{1,2}$/;
let seg: Intl.Segmenter | null | undefined;
const cuts = new Map<string, string[]>();

/**
 * A text's pieces between which a line may break (the guides' text is `word-break: keep-all`, so these are its only
 * breaks in Japanese): ICU's words (Intl.Segmenter), with a particle or okurigana, closing punctuation, a katakana
 * word's next part (ニュー + プリマス) and a number's counter kept on the word before. A string with no Japanese, or
 * a browser without the segmenter, is one piece (it breaks at its spaces). Memoised per string.
 */
export function pieces(s: string): string[] {
  let out = cuts.get(s);
  if (out) return out;
  seg ??= typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('ja', { granularity: 'word' }) : null;
  out = [];
  if (!seg || !JA.test(s)) out.push(s);
  else {
    let prev = '';
    for (const { segment: w } of seg.segment(s)) {
      const glue = out.length > 0 && !/\s$/.test(prev) && (HIRA.test(w) || TAIL.test(w) || (KANA.test(w) && KANA.test(prev)) || (/\d$/.test(prev) && COUNTER.test(w)));
      if (glue) out[out.length - 1] += w;
      else out.push(w);
      prev = w;
    }
  }
  cuts.set(s, out);
  return out;
}
