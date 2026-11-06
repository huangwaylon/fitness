// ききみみ's units' stages and lessons (docs/curriculum-units.md §1, §3): the constants the compiler (units.ts) and the
// phone (lesson.ts, stamps.ts) share, apart so the phone's chunk never carries the compiler's checks. Pure.

/** The stages a unit sits at (curriculum §3; plan §1), each with its place on levelRank's scale (an item may be one
 *  step from it) and the sound features a unit's main one is taken from (curriculum §3's sequence, in the bank's and
 *  the drafts' vocabulary). */
export const STAGES = {
  hama: { rank: 2, sounds: ['l-r', 'vowel', 'teen-ty', 'can-cant', 'ending', 'katakana', 'numbers', 'clock'] },
  kawa: { rank: 3, sounds: ['weak-form', 'contraction', 'flap', 'elision', 'yod', 'gonna', 'wanna', 'gotta', 't-glottal', 'linking', 'lemme', 'numbers'] },
  mori: { rank: 4, sounds: ['chain', 'dunno', 'lemme', 'kinda', 'h-drop', 'assimilation', 'stress', 'contrast', 'intonation', 'filler', 'self-repair', 'numbers'] },
  yama: { rank: 5, sounds: ['overlap', 'intonation', 'chain', 'filler', 'idiom', 'stress', 'self-repair'] },
  hoshi: { rank: 6, sounds: ['stress', 'numbers', 'filler', 'overlap', 'intonation', 'ellipsis'] }
} as const;
export type Stage = keyof typeof STAGES;

/** A unit's lessons (plan §3): the 3 core, then the 2 optional extras that never block the stamp. Their order is the
 *  `listen` row's `l` (contract/listen.ts: 1 であい … 3 チェック, the stamp's). */
export const LESSONS = ['deai', 'bamen', 'check', 'oto', 'jissen'] as const;
export type Lesson = (typeof LESSONS)[number];
/** A lesson is one 6-question game (plan §3). */
export const LESSON_QS = 6;
