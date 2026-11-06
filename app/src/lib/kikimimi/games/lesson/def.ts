// A unit's lesson as a GameDef (docs/curriculum-units.md §3, §13; docs/kikimimi-framework.md §3.3): 6 questions of a
// unit's lesson from a seed (lesson.ts lessonDeck, over the unit's chunk: `u`), each a quiz round; a player's tier
// swaps in that item's easier or harder choices (the same audio). Its options: the lobby's level and こたえる じかん
// (the quiz's, kept for the way back to the quiz), the lesson (lesson.ts lessonL: 1 であい … 5 じっせん) and the tier
// (0 the authored choices, 1 easy, 2 hard). Solo in 8b (a lobby kept alone: nothing on the wire); co-op lessons ride
// `play` from 8c, the only wire that carries a unit.
import { lessonL, lessonOf, type Lesson, type Tier } from '../../lesson.ts';
import type { GameDef } from '../../round/types.ts';
import { quizDeck, quizOpts, quizSeedBits, type QuizOpts, type QuizSource } from '../quiz/def.ts';

export interface LessonOpts extends QuizOpts {
  lesson: Lesson;
  tier?: Tier;
}

const TIERS: readonly (Tier | undefined)[] = [undefined, 'easy', 'hard'];

export const lessonOpts = {
  encode: (o: LessonOpts): number[] => [...quizOpts.encode(o), lessonL(o.lesson), Math.max(0, TIERS.indexOf(o.tier))],
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
    deck: (seed, o, ctx) => quizDeck(() => src.rounds('lesson', seed, ctx.enc, ctx.u), o, ctx.w)
  };
}
