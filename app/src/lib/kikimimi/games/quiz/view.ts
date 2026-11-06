// The quiz family's view of a round game (docs/kikimimi.md "UI"): the session's view (round/session.ts RoundView) as
// the quiz's sheet reads it: its level, こたえる じかん and mode (スピード はしご) from the game and its options, each
// answer a choice `k` replayed or not. Pure.
import type { QuizLv, Who } from '../../../contract/live-protocol.ts';
import type { QuizTimer } from '../../seed.ts';
import type { RoundNotice, RoundView } from '../../round/session.ts';
import type { GameId, RoundPhase } from '../../round/types.ts';
import type { Team } from '../../round/tally.ts';
import { quizOpts } from './def.ts';

export type QuizPhase = RoundPhase;

/** An answer: the choice, whether the clip was replayed or slowed first, when it was given or heard (relay clock). */
interface QuizAnswer {
  k: number;
  rp: boolean;
  t: number;
}

/** A player in the game (RoundPlayer): their pick a choice. */
interface QuizPlayer {
  who: Who;
  here: boolean;
  answered: boolean;
  /** Their choice for the current question, in its reveal only (and whether it was right). */
  pick?: { k: number; ok: boolean };
  /** In a reveal: they tapped よみおわった (done reading; the host's つぎへ counts them). */
  ready: boolean;
  score: number;
}

/** A lobby or game someone else opened that I haven't joined: the invite banner's. */
interface QuizInvite {
  g: string;
  host: Who;
  lv: QuizLv;
  /** スピード はしご. */
  ladder: boolean;
  same: boolean;
  /** It's already going (さんか joins at the next question). */
  started: boolean;
}

/** The view (RoundView's fields as the quiz names them; see there). */
export interface QuizView {
  phase: QuizPhase;
  g: string | null;
  host: Who | null;
  amHost: boolean;
  local: boolean;
  /** The game (quiz, ladder, lesson; null outside one), its options as on the wire and its unit: its deck's key
   *  (round/decks.ts gameKey) with the seed. */
  gm: GameId | null;
  o: readonly number[];
  u?: string;
  lv: QuizLv;
  same: boolean;
  seed: number;
  vs: boolean;
  /** スピード はしご (else the quiz at `lv`, or a lesson). */
  ladder: boolean;
  /** こたえる じかん (s; 0: none). */
  timer: QuizTimer;
  speaks: boolean;
  players: QuizPlayer[];
  i: number;
  n: number;
  from: number;
  until: number;
  playAt: number;
  playEnd: number;
  limit: number;
  out: boolean;
  answers: (QuizAnswer | null)[];
  had: boolean[];
  scores: Partial<Record<Who, number>>;
  team: Team;
  teamFirst: number;
  rightNow: number;
  canNext: boolean;
  canReady: boolean;
  ready: { n: number; of: number };
  invite: QuizInvite | null;
  notice: RoundNotice | null;
}

/** The quiz's view of a round game's. */
export function quizView(v: RoundView): QuizView {
  const q = quizOpts.decode(v.o);
  const { players, answers, invite, ...rest } = v;
  const inv = invite && quizOpts.decode(invite.o);
  return {
    ...rest,
    lv: q?.lv ?? 1,
    timer: q?.timer ?? 30,
    ladder: v.gm === 'ladder',
    players: players.map(({ pick, ...p }) => ({ ...p, ...(pick && { pick: { k: pick.a as number, ok: pick.ok } }) })),
    answers: answers.map((a) => a && { k: a.a as number, rp: a.rp > 0, t: a.t }),
    invite: invite && { g: invite.g, host: invite.host, lv: inv?.lv ?? 1, ladder: invite.gm === 'ladder', same: invite.same, started: invite.started }
  };
}
