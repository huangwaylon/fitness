// ききみみ's units' stages and lessons (docs/curriculum-units.md §1, §3): the constants the compiler (units.ts) and the
// phone (lesson.ts, stamps.ts) share, apart so the phone's chunk never carries the compiler's checks. Pure.

/** The curriculum's stages (§3; plan §1), はまべ → ほし: each one's place on levelRank's scale (a unit's items may be one
 *  step from it; きろく's comfortable level falls in a stage within half a step of it), its ★s and CEFR band (きろく),
 *  and the sound features a unit's main one is taken from (curriculum §3's sequence, in the bank's and the drafts'
 *  vocabulary). */
export const STAGES = {
  hama: { rank: 2, stars: 1, cefr: 'A2–B1', sounds: ['l-r', 'vowel', 'teen-ty', 'can-cant', 'ending', 'katakana', 'numbers', 'clock'] },
  kawa: { rank: 3, stars: 2, cefr: 'B1+', sounds: ['weak-form', 'contraction', 'flap', 'elision', 'yod', 'gonna', 'wanna', 'gotta', 't-glottal', 'linking', 'lemme', 'numbers'] },
  mori: { rank: 4, stars: 3, cefr: 'B2', sounds: ['chain', 'dunno', 'lemme', 'kinda', 'h-drop', 'assimilation', 'stress', 'contrast', 'intonation', 'filler', 'self-repair', 'numbers'] },
  yama: { rank: 5, stars: 4, cefr: 'B2+', sounds: ['overlap', 'intonation', 'chain', 'filler', 'idiom', 'stress', 'self-repair'] },
  hoshi: { rank: 6, stars: 5, cefr: 'C1', sounds: ['stress', 'numbers', 'filler', 'overlap', 'intonation', 'ellipsis'] }
} as const;
export type Stage = keyof typeof STAGES;
/** The stages in order. */
export const STAGE_IDS = Object.keys(STAGES) as Stage[];

/** The stage a comfortable level falls in (its rank ± half a step; はまべ's from 1, ほし's open above) and how far
 *  into it (0-1). */
export function stageAt(level: number): { id: Stage; stars: number; cefr: string; into: number } {
  const id = STAGE_IDS.find((s) => level < STAGES[s].rank + 0.5) ?? STAGE_IDS[STAGE_IDS.length - 1];
  const { rank, stars, cefr } = STAGES[id];
  const from = id === STAGE_IDS[0] ? 1 : rank - 0.5, to = rank + 0.5;
  return { id, stars, cefr, into: Math.max(0, Math.min(1, (level - from) / (to - from))) };
}

/** A unit's lessons (plan §3): the 3 core, then the 2 optional extras that never block the stamp. Their order is the
 *  `listen` row's `l` (contract/listen.ts: 1 であい … 3 チェック, the stamp's). */
export const LESSONS = ['deai', 'bamen', 'check', 'oto', 'jissen'] as const;
export type Lesson = (typeof LESSONS)[number];
/** A lesson is one 6-question game (plan §3; the `listen` row's bound). */
export { LESSON_QS } from '../contract/listen.ts';
