// The quiz family's rounds (docs/kikimimi-engine.md "The quiz as a GameDef"): one round per item, its kind by the item's type (a
// スピード はしご rung its own), each a choice of 3-4 graded right or wrong (points.ts: 100 a right one; いっぱつ a badge).
// The round carries what the session needs of its item: the right choice (after the deck's shuffle), its clip's length
// as played (clips.json: a dialogue's lines and the gaps), the rung. Pure.
import { ITEM_TYPES, type Item } from '../../bank.ts';
import { SPEEDS } from '../../ladder.ts';
import { points } from '../../score.ts';
import type { AnswerValue, Round, RoundKind } from '../../round/types.ts';

/** A quiz-family round: its item's id, right choice and clip length (ms), and its rung on a ladder. */
export interface QuizRound extends Round {
  answer: number;
  play: number;
  rung?: Item['rung'];
}

/** A clip length the session schedules while an item's clip isn't known (game.svelte.ts's 2 s). */
export const PLAY_UNKNOWN = 2000;

const isChoice = (a: AnswerValue): a is number => typeof a === 'number' && Number.isInteger(a) && a >= 0 && a <= 3;

/** A choice round of `id`: one of 4 at most, right or wrong, 100 a right one (a replay costs nothing: いっぱつ is a
 *  badge, score.ts firstListen). */
const choice = (id: string, auto?: (r: QuizRound) => boolean): RoundKind<QuizRound> => ({
  id,
  play: (r) => r.play,
  valid: (_r, a) => isChoice(a),
  grade: (r, a) => {
    const ok = a === r.answer;
    return { ok, pts: points(ok) };
  },
  ...(auto && { auto })
});

/** A スピード はしご rung below its ladder's top: its reveal hides the line (nothing to read), so it moves on by itself. */
const belowTop = (r: { rung?: Item['rung'] }): boolean => !!r.rung && r.rung.n < SPEEDS.length;

/** The quiz family's kinds: `quiz.<type>` per item type, and `ladder.rung` (its points the ladder's climb: GameDef). */
export const QUIZ_KINDS: Readonly<Record<string, RoundKind<QuizRound>>> = Object.fromEntries([
  ...ITEM_TYPES.map((t) => [`quiz.${t}`, choice(`quiz.${t}`)] as const),
  ['ladder.rung', choice('ladder.rung', belowTop)] as const
]);

/** An item as its round, with its clip's length (ms; unknown: PLAY_UNKNOWN). */
export const roundOf = (it: Item, playMs: number | undefined): QuizRound => ({
  kind: it.rung ? 'ladder.rung' : `quiz.${it.type}`,
  id: it.id,
  answer: it.answer,
  play: playMs ?? PLAY_UNKNOWN,
  ...(it.rung && { rung: it.rung })
});
