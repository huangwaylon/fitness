// ききみみ クイズ: the revealed text as words with its sound marks (docs/kikimimi.md "Visuals", docs/curriculum.md §8), pure:
// Play.svelte and Transcript.svelte render it (SoundLine.svelte) with the karaoke over its words. The words are `en`'s
// whitespace-separated tokens, numbered from 0 (the karaoke's timings, clips.ts wordTimes, count the same way).
import type { SoundMark } from './bank.ts';

/** A piece of the line: a word's text (`w` its index; a word cut by a mark is in several pieces) or the space between
 *  two (`w` -1; `link`: an arc instead, the words joined). `focus`: the item's key words; `drop`: swallowed letters;
 *  `stress`: ● over it (a stressed word's first piece). */
interface Seg {
  t: string;
  w: number;
  focus?: true;
  drop?: true;
  link?: true;
  stress?: true;
}
/** A run of pieces; `say`: the shape it's said in, shown above it. */
export interface Group {
  say?: string;
  segs: Seg[];
}

const W = /[A-Za-z0-9'’]/;

/** `at`'s first whole-word match in `en` as [start, end) (its ends not inside a word: "15" isn't in "815"), or null. */
export function findWords(en: string, at: string, from = 0): [number, number] | null {
  for (let i = en.indexOf(at, from); i >= 0; i = en.indexOf(at, i + 1)) {
    const before = i > 0 && W.test(at[0]) && W.test(en[i - 1]);
    const after = i + at.length < en.length && W.test(at.at(-1)!) && W.test(en[i + at.length]);
    if (!before && !after) return [i, i + at.length];
  }
  return null;
}

/** Each word of `en` as [start, end) (whitespace-separated tokens). */
export const wordSpans = (en: string): [number, number][] => [...en.matchAll(/\S+/g)].map((m) => [m.index, m.index + m[0].length]);

/** Where each mark lands in `en` (null: it doesn't; bank tests require every authored mark to land). */
export function placeMark(en: string, m: SoundMark): [number, number][] | null {
  if (m[0] === 'stress') {
    const out = m[1].split(' ').map((w) => findWords(en, w));
    return out.every(Boolean) ? (out as [number, number][]) : null;
  }
  const r = findWords(en, m[1]);
  if (!r) return null;
  if (m[0] === 'drop') {
    const at = en.slice(r[0], r[1]).lastIndexOf(m[2]);
    return at < 0 ? null : [[r[0] + at, r[0] + at + m[2].length]];
  }
  return [r];
}

/** The line as groups of pieces: the `say` marks' runs (each its own group, the shape above it) and the rest. */
export function soundLine(en: string, focus?: string, marks: readonly SoundMark[] = []): Group[] {
  const n = en.length;
  const word = new Array<number>(n).fill(-1);
  wordSpans(en).forEach(([a, b], k) => word.fill(k, a, b));
  const foc = new Array<boolean>(n).fill(false), drop = new Array<boolean>(n).fill(false), link = new Array<boolean>(n).fill(false);
  const say = new Array<number>(n).fill(-1);
  const stressed = new Set<number>();
  const f = focus ? findWords(en, focus) ?? (en.includes(focus) ? [en.indexOf(focus), en.indexOf(focus) + focus.length] : null) : null;
  if (f) foc.fill(true, f[0], f[1]);
  marks.forEach((m, k) => {
    const at = placeMark(en, m);
    if (!at) return;
    for (const [a, b] of at) {
      if (m[0] === 'say') say.fill(k, a, b);
      else if (m[0] === 'drop') drop.fill(true, a, b);
      else if (m[0] === 'stress') stressed.add(word[a]);
      else for (let i = a; i < b; i++) if (word[i] < 0) link[i] = true;
    }
  });
  const groups: Group[] = [];
  let firstOf = -1, gid = -2;
  for (let i = 0; i < n; i++) {
    const s = say[i];
    if (s !== gid) {
      groups.push(s >= 0 ? { say: marks[s][2] as string, segs: [] } : { segs: [] });
      gid = s;
    }
    const g = groups.at(-1)!;
    const seg = g.segs.at(-1);
    const same = seg && seg.w === word[i] && !!seg.focus === foc[i] && !!seg.drop === drop[i] && !!seg.link === link[i];
    if (same) {
      seg.t += en[i];
      continue;
    }
    const next: Seg = { t: en[i], w: word[i] };
    if (foc[i]) next.focus = true;
    if (drop[i]) next.drop = true;
    if (link[i]) next.link = true;
    if (word[i] >= 0 && stressed.has(word[i]) && firstOf !== word[i]) next.stress = true;
    if (word[i] >= 0) firstOf = word[i];
    g.segs.push(next);
  }
  return groups;
}

/** The mark kinds a line shows (its legend). */
export const markKinds = (marks: readonly SoundMark[] = []): SoundMark[0][] => [...new Set(marks.map((m) => m[0]))];
