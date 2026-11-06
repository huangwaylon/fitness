// The quiz as a GameDef (docs/kikimimi-framework.md §3.3; docs/kikimimi.md "The game"): 8 questions from a seed and a
// level (deck.ts on the phone), each a round of its item's type, graded right or wrong (100 a right one); its options
// the level and こたえる じかん (`o: [lv, timer]`, the timer TIMERS' index). On the `quiz` wire its flags ride the
// seed's low bits (seed.ts: たいせん, スピード はしご, こたえる じかん), so the family's seeds carry them (seedBits) and
// round/wire.ts reads them back. The deck's items come from a source (the phone's decks: game.svelte.ts; a test's).
import { QUIZ_LVS, QUIZ_MAX_S, QUIZ_QS, type QuizLv } from '../../../contract/live-protocol.ts';
import { FLAG_BITS, TIMERS, withLadder, withTimer, withVersus, type QuizTimer } from '../../seed.ts';
import { F_VS, type AnswerValue, type GameDef, type GameId, type Graded, type RoundAnswer, type RoundDeck, type RoundWindows } from '../../round/types.ts';
import { PLAY_UNKNOWN, QUIZ_KINDS, type QuizRound } from './kinds.ts';

/** A quiz lobby's options: its level and こたえる じかん (s; 0: none). */
export interface QuizOpts {
  lv: QuizLv;
  timer: QuizTimer;
}

/** Where a quiz-family game's rounds come from: its game, seed, options as on the wire, unit. Read through at each call
 *  (a deck settled in the lobby stands in for the one dealt: round/decks.ts). */
export interface QuizSource {
  rounds(gm: GameId, seed: number, enc: readonly number[], u?: string): readonly QuizRound[];
}

const isLv = (x: unknown): x is QuizLv => QUIZ_LVS.includes(x as QuizLv);

/** The quiz family's options on the wire: `[lv, timer]` (the timer TIMERS' index), and back (null: not one). */
export const quizOpts = {
  encode: (o: QuizOpts): number[] => [o.lv, Math.max(0, TIMERS.indexOf(o.timer))],
  decode: (a: readonly number[]): QuizOpts | null => {
    const timer = TIMERS[a[1] ?? 0];
    return isLv(a[0]) && timer !== undefined ? { lv: a[0], timer } : null;
  }
};

/** The family's seed bits (the `quiz` wire's, seed.ts): たいせん from `f`, スピード はしご for the ladder, こたえる じかん. */
export const quizSeedBits = (ladder: boolean) => ({
  mask: FLAG_BITS,
  of: (o: { timer: QuizTimer }, f: number): number => withTimer(withLadder(withVersus(0, (f & F_VS) !== 0), ladder), o.timer)
});

/** A quiz-family deck over its rounds: at most the quiz's 8, each with the lobby's lead-in and answer window; graded by
 *  its kind; `score` when the game scores its rounds together (スピード はしご). */
export function quizDeck(rounds: () => readonly QuizRound[], o: { timer: QuizTimer }, w: RoundWindows, score?: (rs: readonly QuizRound[], answers: ReadonlyMap<number, RoundAnswer>) => number): RoundDeck {
  const answer = w.answers[Math.max(0, TIMERS.indexOf(o.timer))];
  const at = (i: number) => {
    const r = rounds()[i];
    return r ? { r, k: QUIZ_KINDS[r.kind] } : null;
  };
  const none: Graded = { ok: false, pts: 0 };
  return {
    get count() {
      return Math.min(QUIZ_QS, rounds().length);
    },
    round: (i) => rounds()[i],
    timing: (i) => {
      const x = at(i);
      return { lead: w.lead, play: x ? (x.k?.play(x.r) ?? x.r.play) : PLAY_UNKNOWN, answer, ...(x?.k?.auto?.(x.r) && { auto: true }) };
    },
    valid: (i, a: AnswerValue) => {
      const x = at(i);
      return !!x?.k && x.k.valid(x.r, a);
    },
    grade: (i, a, rp) => {
      const x = at(i);
      return x?.k ? x.k.grade(x.r, a, rp) : none;
    },
    ...(score && { score: (answers: ReadonlyMap<number, RoundAnswer>) => score(rounds(), answers) }),
    maxScore: QUIZ_MAX_S
  };
}

/** The quiz: a level's 8 questions. */
export function quizGame(src: QuizSource): GameDef<QuizOpts> {
  return {
    id: 'quiz',
    modes: { solo: true, coop: true, vs: true, same: true },
    opts: quizOpts,
    seedBits: quizSeedBits(false),
    deck: (seed, o, ctx) => quizDeck(() => src.rounds('quiz', seed, ctx.enc, ctx.u), o, ctx.w)
  };
}
