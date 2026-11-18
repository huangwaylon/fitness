// 英語すごろく's words (docs/sugoroku.md "Words"): the familiar list (scripts/sugoroku-words.ts: words.txt) and the everyday
// ones with their Japanese (everyday.json), what a word may be (accept.txt: any real word), loaded once with the game
// (their own chunks), and what a rack can make (ヒント: the familiar only).
import { once } from '#lib/once.ts';
import { spellable } from './tiles.ts';

export interface Words {
  has(w: string): boolean;
  /** An everyday (A1–A2) word's Japanese, else ''. */
  ja(w: string): string;
  /** The words this rack can make, best first (everyday ones, then the most letters' points; long words last among equals). */
  from(rack: readonly string[], score: (w: string) => number): string[];
  /** The familiar words starting with `prefix` (しりとり's ヒント), everyday ones first, then shortest, then a–z (none
   *  loaded: none). */
  starting?(prefix: string): string[];
}

/** accept.txt's lines read back (each: the letters shared with the word before, then the rest). */
export function decodeAccept(coded: string): Set<string> {
  const out = new Set<string>();
  let prev = '';
  for (const line of coded.split('\n')) {
    const m = /^(\d+)([a-z]*)$/.exec(line);
    if (!m) continue;
    prev = prev.slice(0, Number(m[1])) + m[2];
    out.add(prev);
  }
  return out;
}

export function wordsOf(list: string, everyday: Readonly<Record<string, string>>, accept?: ReadonlySet<string>): Words {
  const all = new Set(list.split('\n').filter(Boolean));
  for (const w of Object.keys(everyday)) all.add(w);
  const sorted = [...all];
  return {
    // any real word (accept.txt), the familiar ones too; the hints only from the familiar
    has: (w) => all.has(w) || !!accept?.has(w),
    ja: (w) => everyday[w] ?? '',
    from(rack, score) {
      const out = sorted.filter((w) => w.length <= rack.length && spellable(w, rack));
      const ev = (w: string) => (w in everyday ? 1 : 0);
      return out.sort((a, b) => ev(b) - ev(a) || score(b) - score(a) || a.length - b.length || (a < b ? -1 : 1));
    },
    starting(prefix) {
      const ev = (w: string) => (w in everyday ? 1 : 0);
      return sorted.filter((w) => w.startsWith(prefix)).sort((a, b) => ev(b) - ev(a) || a.length - b.length || (a < b ? -1 : 1));
    }
  };
}

/** The words, fetched once (a failure tried again next time). */
export const loadWords: () => Promise<Words> = once(() =>
  Promise.all([import('./words.txt?raw'), import('./everyday.json'), import('./accept.txt?raw')]).then(([l, e, a]) => wordsOf(l.default, e.default, decodeAccept(a.default))));
