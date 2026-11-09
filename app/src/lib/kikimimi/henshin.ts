// 音の へんしん, the daily connected-speech drill (docs/kikimimi.md "音の へんしん", curriculum.md "Connected speech"): the
// American reductions in the order they're taught, each phrase's phenomenon (its first feature), and how far I've got with
// each one, folded from my answers on the drill's phrases (level 8: the drill's game and おさらい alike). Pure: the drill's
// lane, its mode page and its tests read it; the index's entries say which phrase is which, so nothing need be loaded.
import { HENSHIN_LV, type Entry, type Feature } from './bank.ts';
import type { Answer } from './progress.ts';
import { tagsOf } from './tags.ts';
import { dayNum } from '../contract/tokyo.ts';
import type { LocalDate } from '../types.ts';

/** The phenomena in the order they're taught: the famous spelled ones first, then the sounds that change between words,
 *  then the chains that stack them. Each is a feature (tags.ts: つながる おと). */
export const PHENOMENA = [
  'gonna', 'wanna', 'gotta', 'contraction', 'weak-form', 'flap', 'linking', 'yod', 'lemme', 'kinda', 'dunno', 'elision', 't-glottal', 'h-drop', 'chain'
] as const satisfies readonly Feature[];
export type Phenomenon = (typeof PHENOMENA)[number];

/** A phrase's phenomenon: its first feature, when it's one of the drill's. */
export function phenomenonOf(it: Pick<Entry, 'id' | 'tags'>): Phenomenon | undefined {
  const f = tagsOf(it).features[0];
  return (PHENOMENA as readonly string[]).includes(f) ? (f as Phenomenon) : undefined;
}

/** A phenomenon is 習得 once this share (recency-weighted, first listen 1, after a replay 0.6) holds over this many answers. */
const MASTERED = 0.8;
const MASTERED_N = 6;
/** Past this many answers a phenomenon not yet mastered stops being today's: the drill goes on and it comes back in review. */
const STUCK_N = 24;
/** Shown from this many answers. */
const SHOWN_N = 3;
const HALF_LIFE = 21;

/** How I stand with one phenomenon: answers on its phrases, the share (null below SHOWN_N), mastered. */
export interface PhState {
  id: Phenomenon;
  n: number;
  m: number | null;
  mastered: boolean;
}

/** Each phenomenon's standing from my answers (in order; any game's: the drill's, おさらい's) on the drill's phrases. */
export function phenomenaOf(answers: readonly Pick<Answer, 'id' | 'ok' | 'rp' | 'd'>[], entry: (id: string) => Entry | undefined, today: LocalDate): PhState[] {
  const t = dayNum(today);
  const acc = new Map<Phenomenon, { n: number; w: number; s: number }>();
  for (const a of answers) {
    const it = entry(a.id);
    const ph = it && it.lv === HENSHIN_LV ? phenomenonOf(it) : undefined;
    if (!ph) continue;
    const x = acc.get(ph) ?? { n: 0, w: 0, s: 0 }, w = 0.5 ** (Math.max(0, t - dayNum(a.d)) / HALF_LIFE);
    x.n++;
    x.w += w;
    x.s += w * (a.ok ? (a.rp === 0 ? 1 : 0.6) : 0); // (progress.ts scoreOf)
    acc.set(ph, x);
  }
  return PHENOMENA.map((id) => {
    const x = acc.get(id);
    const m = x && x.n >= SHOWN_N ? x.s / x.w : null;
    return { id, n: x?.n ?? 0, m, mastered: !!x && x.n >= MASTERED_N && m !== null && m >= MASTERED };
  });
}

/** Today's phenomenon: the first in order not yet mastered (one tried STUCK_N times without it waits in review), else
 *  the weakest. Its index in PHENOMENA. */
export function focusOf(states: readonly PhState[]): number {
  const k = states.findIndex((s) => !s.mastered && s.n < STUCK_N);
  if (k >= 0) return k;
  let low = 0;
  states.forEach((s, i) => (s.m ?? 0) < (states[low].m ?? 0) && (low = i));
  return low;
}
