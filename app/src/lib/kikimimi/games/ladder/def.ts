// スピード はしご as a GameDef (docs/kikimimi-framework.md §3.3; docs/kikimimi.md "スピード はしご"): two ladders of four
// rungs from a seed (ladder.ts ladderDeck), each rung a round (`ladder.rung`) whose reveal below the top moves on by
// itself; the points the rungs climbed in order on the first listen (ladder.ts ladderPoints), counted over the whole
// deck. Its options are the quiz's (`[lv, timer]`: the lobby's level is kept for the クイズ switch back and the `quiz`
// wire's `lv`; the deck doesn't read it). On the `quiz` wire it's the quiz with the seed's bit 1 (round/wire.ts).
import { ladderPoints } from '../../ladder.ts';
import type { GameDef, RoundAnswer } from '../../round/types.ts';
import { quizDeck, quizOpts, quizSeedBits, type QuizOpts, type QuizSource } from '../quiz/def.ts';
import type { QuizRound } from '../quiz/kinds.ts';

/** A player's points from their answers: RUNG_POINTS a rung climbed (a replay or a miss stops a ladder). */
const ladderScore = (rs: readonly QuizRound[], answers: ReadonlyMap<number, RoundAnswer>): number =>
  ladderPoints(rs, new Map([...answers].map(([i, a]) => [i, { k: a.a as number, rp: a.rp > 0 }])));

export function ladderGame(src: QuizSource): GameDef<QuizOpts> {
  return {
    id: 'ladder',
    modes: { solo: true, coop: true, vs: true, same: true },
    opts: quizOpts,
    seedBits: quizSeedBits(true),
    deck: (seed, o, ctx) => quizDeck(() => src.rounds('ladder', seed, ctx.enc, ctx.u), o, ctx.w, ladderScore)
  };
}
