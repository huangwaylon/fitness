// 英語すごろく's words (docs/sugoroku.md "Words"): the list (scripts/sugoroku-words.ts: words.txt) and the everyday ones
// with their Japanese (everyday.json), loaded once with the game (their own chunk), and what a rack can make (ヒント).
import { spellable } from './tiles.ts';

export interface Words {
  has(w: string): boolean;
  /** An everyday (A1–A2) word's Japanese, else ''. */
  ja(w: string): string;
  /** The words this rack can make, best first (everyday ones, then the most letters' points; long words last among equals). */
  from(rack: readonly string[], score: (w: string) => number): string[];
}

export function wordsOf(list: string, everyday: Readonly<Record<string, string>>): Words {
  const all = new Set(list.split('\n').filter(Boolean));
  for (const w of Object.keys(everyday)) all.add(w);
  const sorted = [...all];
  return {
    has: (w) => all.has(w),
    ja: (w) => everyday[w] ?? '',
    from(rack, score) {
      const out = sorted.filter((w) => w.length <= rack.length && spellable(w, rack));
      const ev = (w: string) => (w in everyday ? 1 : 0);
      return out.sort((a, b) => ev(b) - ev(a) || score(b) - score(a) || a.length - b.length || (a < b ? -1 : 1));
    }
  };
}

let loading: Promise<Words> | null = null;
/** The words, fetched once. */
export function loadWords(): Promise<Words> {
  return (loading ??= Promise.all([import('./words.txt?raw'), import('./everyday.json')]).then(([l, e]) => wordsOf(l.default, e.default)))
    .catch((err: unknown) => {
      loading = null;
      throw err;
    });
}
