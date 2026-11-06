// A unit's lesson as a GameDef (docs/curriculum-units.md §3, §13; docs/kikimimi-framework.md §3.3): 6 questions of a
// unit's lesson from a seed (lesson.ts lessonDeck, over the unit's chunk: `u`), each a quiz round; a player's tier
// swaps in that item's easier or harder choices (the same audio). Its options: the lobby's level and こたえる じかん
// (the quiz's, kept for the way back to the quiz), the lesson (lesson.ts lessonL: 1 であい … 5 じっせん) and the tier
// (0 the authored choices, 1 easy, 2 hard). Co-op from 8c, on `play` (the only wire that carries a unit): the host's
// tier rides its options, each other player's their join's `tr` (GameDef.tier), and each phone deals each player's
// choices at their own tier over the same items and audio.
import { lessonL, lessonOf, type Lesson, type Tier } from '../../lesson.ts';
import type { GameDef } from '../../round/types.ts';
import { quizDeck, quizOpts, quizSeedBits, type QuizOpts, type QuizSource } from '../quiz/def.ts';

export interface LessonOpts extends QuizOpts {
  lesson: Lesson;
  tier?: Tier;
}

const TIERS: readonly (Tier | undefined)[] = [undefined, 'easy', 'hard'];
/** A tier on the wire (the options' 4th, a join's `tr`): 0 the authored choices, 1 easy, 2 hard. */
export const tierIndex = (t: Tier | undefined): number => Math.max(0, TIERS.indexOf(t));

export const lessonOpts = {
  encode: (o: LessonOpts): number[] => [...quizOpts.encode(o), lessonL(o.lesson), tierIndex(o.tier)],
  decode: (a: readonly number[]): LessonOpts | null => {
    const q = quizOpts.decode(a), lesson = lessonOf(a[2] ?? 0), t = a[3] ?? 0;
    if (!q || !lesson || !Number.isInteger(t) || t < 0 || t >= TIERS.length) return null;
    const tier = TIERS[t];
    return { ...q, lesson, ...(tier && { tier }) };
  }
};

export function lessonGame(src: QuizSource): GameDef<LessonOpts> {
  return {
    id: 'lesson',
    modes: { solo: true, coop: true, vs: false, same: true },
    opts: lessonOpts,
    seedBits: quizSeedBits(false),
    deck: (seed, o, ctx) => quizDeck(() => src.rounds('lesson', seed, ctx.enc, ctx.u), o, ctx.w),
    cv: (o, u) => src.cv?.('lesson', lessonOpts.encode(o), u),
    // each player's own choices over the same audio (docs/curriculum-units.md §4): the host's tier in `o`, a player's on
    // their join
    tier: {
      of: (o) => tierIndex(o.tier),
      with: (o, tr) => {
        const { tier: _, ...rest } = o, tier = TIERS[tr];
        return { ...rest, ...(tier && { tier }) };
      }
    }
  };
}
