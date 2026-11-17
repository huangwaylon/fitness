// この動画のフレーズ (docs/english.md "The page"): the bank's quoted lines, the retired questions' too, once each (by
// their words, the first kept), in time order; lines starting within a second of a moment's first are that moment, and
// its ▶ plays from its first start to its last end. No new data: each question's own line, notes and phrase. And what
// every phrase shown shares: a `use` apart, a line's key words (underlined). Pure.
import type { Clip, Question } from './types.ts';

export interface Moment {
  from: number;
  to: number;
  qs: Question[];
}

/** Lines this close after a moment's first start are of that moment, s. */
const SAME = 1;

export function momentsOf(clip: Clip): Moment[] {
  const seen = new Set<string>();
  const lines = clip.questions
    .filter((q) => {
      const k = q.line?.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
      return !!k && !seen.has(k) && !!seen.add(k);
    })
    .sort((a, b) => a.seg[0] - b.seg[0]);
  const out: Moment[] = [];
  for (const q of lines) {
    const m = out.at(-1);
    if (m && q.seg[0] - m.from <= SAME) (m.to = Math.max(m.to, q.seg[1])), m.qs.push(q);
    else out.push({ from: q.seg[0], to: q.seg[1], qs: [q] });
  }
  return out;
}

/** A `use` apart: its English and its Japanese in （…） (none: the whole is the English). */
export function splitUse(use: string): { en: string; ja: string } {
  const m = /^(.*?)\s*（(.+)）\s*$/.exec(use);
  return m ? { en: m[1], ja: m[2] } : { en: use.trim(), ja: '' };
}

/** A text in parts, some marked (underlined). */
export type Parts = { t: string; key: boolean }[];

/** A line in parts, its *starred* key words marked (the stars dropped). */
export const keyed = (line: string): Parts => line.split(/\*([^*]+)\*/g).map((t, i) => ({ t, key: i % 2 === 1 }));

/** A text's words: lower case, punctuation dropped ("Can't" → "cant", "Wi-Fi" → "wifi"). */
export const wordsOf = (s: string): string[] => s.toLowerCase().split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}]/gu, '')).filter(Boolean);

/** A line's key words: the words of its starred parts, but a / an / the (which match anything). */
export const keyWordsOf = (line: string): Set<string> => new Set(keyed(line).flatMap((p) => (p.key ? wordsOf(p.t).filter((w) => !ARTICLES.has(w)) : [])));
const ARTICLES = new Set(['a', 'an', 'the']);

/** `en` in parts, its words that are one of `keys` marked (a run of them one part, the spaces inside it too). */
export function markedIn(en: string, keys: ReadonlySet<string>): Parts {
  // a marked word's punctuation outside the mark ("history." → "history" + ".")
  const parts = en.split(/(\s+)/).flatMap((t) => {
    if (!wordsOf(t).some((w) => keys.has(w))) return [{ t, key: false }];
    const m = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u.exec(t)!;
    return [{ t: m[1], key: false }, { t: m[2], key: true }, { t: m[3], key: false }];
  }).filter((p) => p.t);
  parts.forEach((p, i) => (p.key ||= /^\s+$/.test(p.t) && !!parts[i - 1]?.key && !!parts[i + 1]?.key));
  const out: Parts = [];
  for (const p of parts) {
    const last = out.at(-1);
    if (last && last.key === p.key) last.t += p.t;
    else out.push({ ...p });
  }
  return out;
}
