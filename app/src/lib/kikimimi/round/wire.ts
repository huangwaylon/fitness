// ききみみ's games on the wire (docs/kikimimi-framework.md §4.3, step 8b): the session speaks its own ops (RoundOut out,
// RoundIn heard: the `play` intent's shape, kind left off), and this file maps them to and from the two intents a phone
// may hear, `quiz` (the quiz's own, every build since 2026-11-05) and `play` (every game's, from 8c on). An 8b phone
// hears both and still sends `quiz` (SEND_PLAY false): it plays with a phone from before over `quiz`, and with an 8c one
// because it hears `play`. Pure.
import type { PlayWire, QuizLv, QuizWire, Relayed, Who } from '../../contract/live-protocol.ts';
import { isLadder, timerIndex, versus, withLadder, withTimer, withVersus, TIMERS } from '../seed.ts';
import { F_SAME, F_VS, type AnswerValue, type GameId } from './types.ts';

/** 8c's switch: games go out as `play` (8b: off, `quiz` only). */
export const SEND_PLAY = true;
/** The quiz family (the quiz, スピード はしご) on `play` too; off: still on `quiz` (a guarded rollout while a phone from
 *  before 8b, which hears only `quiz`, may be about), and only what `quiz` can't carry (a co-op lesson) on `play`. */
export const QUIZ_ON_PLAY = false;

/** How a phone sends: 'quiz' (8b: the `quiz` wire only; the e2e's `?wire=quiz`), 'guarded' (the quiz family on `quiz`,
 *  every other game on `play`), 'play' (every game on `play`). */
export type WireMode = 'quiz' | 'guarded' | 'play';
export const WIRE: WireMode = !SEND_PLAY ? 'quiz' : QUIZ_ON_PLAY ? 'play' : 'guarded';

/** A session's op (sent, before the wire's kind): every game's, `play`'s shape. */
export type RoundOut =
  | { g: string; gm: GameId; op: 'open'; seed: number; f: number; o: readonly number[]; u?: string; cv?: string }
  | { g: string; gm: GameId; op: 'join'; tr?: number }
  | { g: string; gm: GameId; op: 'leave' | 'end' }
  | { g: string; gm: GameId; op: 'go'; at: number; pl?: number }
  | { g: string; gm: GameId; op: 'a'; i: number; k: AnswerValue; rp: number; s: number }
  | { g: string; gm: GameId; op: 'skip'; i: number; at: number };
/** An op heard: who sent it and the relay's clock when it came. */
export type RoundIn = RoundOut & { who: Who; t: number };

/** The quiz intent, sent (live.send) and heard (live.on). */
export type QuizOut = { kind: 'quiz' } & QuizWire;
export type QuizIn = Extract<Relayed, { kind: 'quiz' }>;
/** The game intent, sent and heard. */
export type PlayOut = { kind: 'play' } & PlayWire;
export type PlayIn = Extract<Relayed, { kind: 'play' }>;
/** A game intent heard, either wire. */
export type GameIn = QuizIn | PlayIn;

/** Whether a relayed intent is a game's (either wire). */
export const isGameIn = (m: Relayed): m is GameIn => m.kind === 'quiz' || m.kind === 'play';

/**
 * A `quiz` op as the session's: the game `quiz`, or `ladder` for a スピード はしご seed (bit 1); its options `[lv,
 * timer]` (こたえる じかん from the seed's bits 2-3, TIMERS' index); `f` from おなじへや and the seed's たいせん bit. The
 * seed is kept whole (the deck is dealt from it, flags and all). The other ops name the quiz too: the session goes by
 * `g`, never by an op's `gm` but an open's.
 */
export function quizIn(m: QuizIn): RoundIn {
  const { who, t } = m;
  switch (m.op) {
    case 'open': {
      const f = (m.same ? F_SAME : 0) | (versus(m.seed) ? F_VS : 0);
      return { g: m.g, gm: isLadder(m.seed) ? 'ladder' : 'quiz', op: 'open', seed: m.seed, f, o: [m.lv, timerIndex(m.seed)], who, t };
    }
    case 'a':
      return { g: m.g, gm: 'quiz', op: 'a', i: m.i, k: m.k, rp: m.rp ? 1 : 0, s: m.s, who, t };
    case 'go':
      return { g: m.g, gm: 'quiz', op: 'go', at: m.at, who, t };
    case 'skip':
      return { g: m.g, gm: 'quiz', op: 'skip', i: m.i, at: m.at, who, t };
    default:
      return { g: m.g, gm: 'quiz', op: m.op, who, t };
  }
}

/** The games the `quiz` wire carries: the quiz and スピード はしご (a seed bit). Any other (a lesson, later games)
 *  waits for `play` (8c). */
const ON_QUIZ: readonly GameId[] = ['quiz', 'ladder'];

/** A session's op as a `quiz` op, or null for a game the `quiz` wire can't carry. An open's seed carries its flags
 *  already (the quiz family's GameDef.seedBits: たいせん, スピード はしご, こたえる じかん); its `lv` is `o[0]`. */
export function quizOut(m: RoundOut): QuizOut | null {
  switch (m.op) {
    case 'open': {
      if (!ON_QUIZ.includes(m.gm) || m.u !== undefined) return null;
      const seed = withTimer(withLadder(withVersus(m.seed, (m.f & F_VS) !== 0), m.gm === 'ladder'), TIMERS[m.o[1] ?? 0] ?? 30);
      return { kind: 'quiz', g: m.g, op: 'open', seed, lv: m.o[0] as QuizLv, same: (m.f & F_SAME) !== 0 };
    }
    case 'a':
      return typeof m.k === 'number' ? { kind: 'quiz', g: m.g, op: 'a', i: m.i, k: m.k, rp: m.rp > 0, s: m.s } : null;
    case 'go':
      return { kind: 'quiz', g: m.g, op: 'go', at: m.at };
    case 'skip':
      return { kind: 'quiz', g: m.g, op: 'skip', i: m.i, at: m.at };
    default:
      return { kind: 'quiz', g: m.g, op: m.op };
  }
}

/** A `play` op as the session's (its `ev`, reserved, isn't one: null). The `cv` is kept on the open (8c checks it). */
export function playIn(m: PlayIn): RoundIn | null {
  const { who, t, g, gm } = m;
  switch (m.op) {
    case 'open':
      return { g, gm, op: 'open', seed: m.seed, f: m.f, o: m.o, ...(m.u !== undefined && { u: m.u }), cv: m.cv, who, t };
    case 'a':
      return { g, gm, op: 'a', i: m.i, k: m.k, rp: m.rp, s: m.s, who, t };
    case 'go':
      return { g, gm, op: 'go', at: m.at, pl: m.pl, who, t };
    case 'skip':
      return { g, gm, op: 'skip', i: m.i, at: m.at, who, t };
    case 'join':
      return { g, gm, op: 'join', ...(m.tr !== undefined && { tr: m.tr }), who, t };
    case 'leave':
    case 'end':
      return { g, gm, op: m.op, who, t };
    default:
      return null;
  }
}

/** A session's op as a `play` op (8c's), or null while it lacks what `play` needs: an open's `cv`, a go's players. */
export function playOut(m: RoundOut): PlayOut | null {
  switch (m.op) {
    case 'open':
      return m.cv === undefined ? null : { kind: 'play', g: m.g, gm: m.gm, op: 'open', cv: m.cv, seed: m.seed, f: m.f, o: [...m.o], ...(m.u !== undefined && { u: m.u }) };
    case 'a':
      return { kind: 'play', g: m.g, gm: m.gm, op: 'a', i: m.i, k: typeof m.k === 'number' ? m.k : [...m.k], rp: Math.min(99, m.rp), s: m.s };
    case 'go':
      return m.pl === undefined ? null : { kind: 'play', g: m.g, gm: m.gm, op: 'go', at: m.at, pl: m.pl };
    case 'skip':
      return { kind: 'play', g: m.g, gm: m.gm, op: 'skip', i: m.i, at: m.at };
    case 'join':
      return { kind: 'play', g: m.g, gm: m.gm, op: 'join', ...(m.tr !== undefined && { tr: m.tr }) };
    default:
      return { kind: 'play', g: m.g, gm: m.gm, op: m.op };
  }
}

/** A game intent heard (either wire) as the session's op, or null. */
export const gameIn = (m: GameIn): RoundIn | null => (m.kind === 'quiz' ? quizIn(m) : playIn(m));

/** What goes out for a session's op, by the wire mode (WIRE): `play` where it can ('play'; 'guarded': a game the `quiz`
 *  wire can't carry), else `quiz` ('quiz': always); null: nothing. */
export function toWire(m: RoundOut, mode: WireMode = WIRE): QuizOut | PlayOut | null {
  if (mode === 'quiz') return quizOut(m);
  if (mode === 'play' || !ON_QUIZ.includes(m.gm) || (m.op === 'open' && m.u !== undefined)) return playOut(m) ?? quizOut(m);
  return quizOut(m);
}
