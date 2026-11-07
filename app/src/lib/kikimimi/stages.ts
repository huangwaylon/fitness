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
/** The lessons that make a unit's stamp (plan §3): であい, ばめん, チェック; おと and じっせん are extras. */
export const CORE: readonly Lesson[] = ['deai', 'bamen', 'check'];

/** The nine domains (plan §1: ともだち, いえ, たべもの, かいもの, たび, しごと, イベント, まち, からだ), a tag on each unit (its
 *  filter chip on the path); `glue` the anchor units (introducing, inviting, asking for clarification, ending a
 *  conversation) that open each stage and count toward no domain. */
export const DOMAINS = ['tomodachi', 'ie', 'tabemono', 'kaimono', 'tabi', 'shigoto', 'ibento', 'machi', 'karada'] as const;
export type Domain = (typeof DOMAINS)[number];
export type UnitDomain = Domain | 'glue';
export const isUnitDomain = (d: string): d is UnitDomain => d === 'glue' || (DOMAINS as readonly string[]).includes(d);

/** A lesson is one 6-question game (plan §3; the `listen` row's bound). */
export { LESSON_QS } from '../contract/listen.ts';

/** Recipe 2 (docs/curriculum-wave2.md §3.1, W2-9): the lessons that play a listening game when the unit names that
 *  content (`lessons.<key>`, ids in content/listen/) and it's `listened`: おと 6 ことば タイル, じっせん たちぎき (1-2
 *  conversations, 3 rounds each), チェック 1 ようじ でんわ call (its 2 memo rounds) and 4 of its own quiz items. Each
 *  lesson's recipe-1 list stays: what it plays while its content isn't ready. */
export const RECIPE2 = {
  oto: { key: 'tiles', game: 'tile' },
  jissen: { key: 'tachi', game: 'tachi' },
  check: { key: 'call', game: 'call' }
} as const;
export type Recipe2Lesson = keyof typeof RECIPE2;
export type KindKey = (typeof RECIPE2)[Recipe2Lesson]['key'];
/** The kinds' keys, as a manifest's `lessons` carries them. */
export const KIND_KEYS: readonly KindKey[] = Object.values(RECIPE2).map((r) => r.key);
