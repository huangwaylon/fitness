// ききみみ's round engine, its shapes (docs/kikimimi-framework.md §3.1): a game (GameDef) deals rounds from a seed and
// its options, every phone the same; each round's kind (RoundKind) says how long it plays, which answers it takes and
// how they're graded. The session (session.ts) runs any game's rounds on the host's clock and never looks inside one.
// Pure types, no Svelte.
import type { Who } from '../../contract/live-protocol.ts';

/** A game's id on the wire (`gm`): /^[a-z][a-z0-9]{1,7}$/ ('quiz', 'ladder', 'lesson', later 'tile', 'call', …). */
export type GameId = string;
/** An answer: an int 0-255 (a choice), or ≤ 12 ints 0-63 (tiles, memo slots; later games). */
export type AnswerValue = number | readonly number[];

/** Where a game is: none (`idle`, an invite perhaps), the lobby, the 3-2-1, a round's lead-in (the speaker pops in),
 *  its clip playing, its answer window, its reveal, the results. */
export type RoundPhase = 'idle' | 'lobby' | 'countdown' | 'lead' | 'play' | 'answer' | 'reveal' | 'results';

/** The schedule's windows (ms), the same on every phone (?kikimimi=fast: FAST_WINDOWS on all of them). */
export interface RoundWindows {
  /** `go`'s `at` is the host's now + this (the 3-2-1). */
  countdown: number;
  /** A round's lead-in before its clip (a game's kind may use it: the quiz's does). */
  lead: number;
  /** The time limit from the clip's end, by the lobby's こたえる じかん (TIMERS' order: 30, 20, 60 s, none: Infinity,
   *  the reveal once everyone in it has answered). No reveal window: it lasts till つぎへ. */
  answers: readonly [number, number, number, number];
  /** The host's position heard more than this after its round's clip began: that round is sat out. */
  late: number;
  /** A lobby not started within this of its `open` is dropped. */
  openTtl: number;
  /** The host away this long has gone (a moment's reconnect hasn't): its lobby is dropped, and in a game each phone
   *  moves on by itself. */
  hostGrace: number;
  /** The host's beacon: its position at least this often while a game runs. */
  beacon: number;
  /** A reveal that moves on by itself (RoundTiming.auto): the next round this long after it began. */
  auto: number;
}

/** A round's timing (ms), the same on every phone from the round alone. */
interface RoundTiming {
  /** The pop-in before the audio. */
  lead: number;
  /** The audio's length as scheduled (a dialogue's lines and their gaps). */
  play: number;
  /** The time limit from the play's end (Infinity: none, the reveal once everyone in it has answered). */
  answer: number;
  /** Its reveal moves on by itself `windows.auto` after it began (スピード はしご's rungs below the top: nothing to
   *  read); else it waits for つぎへ. */
  auto?: boolean;
}

/** A round as a game deals it: plain data, the same on every phone. */
export interface Round {
  /** Its RoundKind's id ('quiz.word', 'ladder.rung', …). */
  kind: string;
  /** The item's id (the SRS card, the `listen` row's). */
  id: string;
}

export interface Graded {
  ok: boolean;
  pts: number;
}

/** A kind of round: how long it plays, which answers it takes, how one is graded. */
export interface RoundKind<R extends Round = Round> {
  id: string;
  /** The audio's length (ms). */
  play(r: R): number;
  valid(r: R, a: AnswerValue): boolean;
  /** `rp`: how many times it was replayed or slowed before the answer. */
  grade(r: R, a: AnswerValue, rp: number): Graded;
  auto?(r: R): boolean;
}

/** An answer as kept: the value, the replays before it, when it was given or heard (relay clock). */
export interface RoundAnswer {
  a: AnswerValue;
  rp: number;
  t: number;
}

/** What the session sees of a game's deck. Read through at each call: a deck settled in the lobby (にがて れんしゅう's,
 *  on this phone alone) stands in for the one dealt, and the session counts it again at `go`. */
export interface RoundDeck {
  /** Its rounds (at most the game's wire allows: the quiz's 8). */
  readonly count: number;
  round(i: number): Round | undefined;
  timing(i: number): RoundTiming;
  valid(i: number, a: AnswerValue): boolean;
  grade(i: number, a: AnswerValue, rp: number): Graded;
  /** A player's points from their answers when the game scores its rounds together (スピード はしご: the rungs
   *  climbed); else each answer's `grade().pts`. */
  score?(answers: ReadonlyMap<number, RoundAnswer>): number;
  /** The most a running total may say on the wire (the `a`'s `s`). */
  maxScore: number;
}

/** What a game deals from: its unit (a lesson's), its items' ids (the `open`'s `ids`: a deck the host picked, the
 *  tournament's), the windows, its options as on the wire (a deck cache's key). */
interface DeckCtx {
  u?: string;
  ids?: readonly number[];
  w: RoundWindows;
  enc: readonly number[];
}

/** A game. `O`: its options, as `opts` decodes them from the wire's `o`. */
export interface GameDef<O = unknown> {
  id: GameId;
  /** What its lobby offers (a game picker and the switches show only these). */
  modes: { solo: boolean; coop: boolean; vs: boolean; same: boolean };
  /** Its options ↔ the wire's `o` (≤ 4 ints 0-255). */
  opts: { encode(o: O): number[]; decode(a: readonly number[]): O | null };
  /** The bits of a lobby's seed that its options and flags fix (the `quiz` wire's: たいせん, スピード はしご, こたえる
   *  じかん in the seed's low bits, kikimimi/seed.ts), and their mask; the seed's other bits stay the host's pick. */
  seedBits?: { mask: number; of(o: O, f: number): number };
  /** Its deck: pure, deterministic for the seed, options and unit. */
  deck(seed: number, o: O, ctx: DeckCtx): RoundDeck;
  /** Its content version for these options and unit (docs/kikimimi-framework.md §4.2: compiled, levels/index.json's
   *  `games`), sent on a `play` open; undefined: this build hasn't that content. A heard open whose cv isn't this is
   *  blocked (an update offered). */
  cv?(o: O, u?: string): string | undefined;
  /** A player's tier in its options (a lesson's: 0 the authored choices, 1 easy, 2 hard; the same audio): the host's
   *  rides the open's `o`, each other's their `join`'s `tr`, and each phone grades each player on their own. */
  tier?: { of(o: O): number; with(o: O, tr: number): O };
  /** How many roles its rounds deal (a jigsaw's halves): `role = index % roles` over the players at `go` (`pl`). */
  roles?: number;
  /** Adaptive (みみ チェック, solo: nothing on the wire): the next round's item from the answers so far (each round's
   *  item id, whether it was right, and my answer and replays when I gave one), as a numeric id added to the game's
   *  `ids`; null: it's over. The session asks at `go` (none yet) and at each round's reveal. */
  next?(seed: number, o: O, done: readonly { id: string; ok: boolean; a?: AnswerValue; rp?: number }[]): number | null;
}

/** A lobby's set-up: which game, its seed, options (as on the wire), flags (F_SAME, F_VS), unit and items' ids. */
export interface Setup {
  gm: GameId;
  seed: number;
  o: readonly number[];
  f: number;
  u?: string;
  /** The host's pick of items (numeric ids, ≤ 8: the `open`'s `ids`), for a game that deals from them (GameDef.deck's
   *  ctx). */
  ids?: readonly number[];
}

/** A game event (the `play` wire's `ev`: a slot `i`, a kind `e`, a value `x`), kept per player and slot, the latest:
 *  what a game's lobby trades beyond the open (the tournament's offered misses). */
export interface RoundEvent {
  who: Who;
  i: number;
  e: number;
  x?: number;
}

/** The `f` flags (the `play` wire's): おなじへや, たいせん. */
export const F_SAME = 1;
export const F_VS = 2;

/** A game I'm in or have heard of, inside the session. */
export interface Game extends Setup {
  g: string;
  host: Who;
  def: GameDef<unknown>;
  deck: RoundDeck;
  /** Its rounds (the deck's, at most PLAY_ROUNDS). */
  n: number;
  /** When this phone first heard of it, or announced it (the lobby's TTL). */
  opened: number;
  /** My lobby not announced yet: nothing of it is sent. */
  local?: boolean;
  /** Who joined (the host too), and still in it. */
  joined: Set<Who>;
  /** Everyone who has been in it (never shrinks: a player who left keeps their answers in the team's tally). */
  played: Set<Who>;
  /** When each player in it came in (relay clock, as heard: their `join`; the host, -Infinity): they had every round
   *  whose clip began from then on (the team's そろって, the same on every phone). */
  since: Map<Who, number>;
  /** Each player's tier heard on their `join` (`tr`; mine as I joined: GameDef.tier); the host's is in `o`. */
  tiers: Map<Who, number>;
  /** A player's deck: theirs at their own tier (the same rounds and timing, their choices), else `deck`. */
  deckFor(w: Who): RoundDeck;
  /** `go`'s `at` (the host's re-send), and the players in it then (`pl`: A 1, B 2, G 4; the `play` wire's). */
  goAt?: number;
  pl?: number;
  /** Round starts fixed here (`go`: 0; the host's position; n: the results); the rest follow from the one before. */
  starts: Map<number, number>;
  /** When this phone came into the schedule: rounds whose clip began before are sat out. */
  inAt: number;
  answers: Map<Who, Map<number, RoundAnswer>>;
  /** Each other player's latest running total (`a`'s `s`): a lost `a` is made up by the next. */
  totals: Map<Who, { i: number; s: number }>;
  /** When everyone joined and here had answered round i (its early reveal). */
  allIn: Map<number, number>;
  /** The host's position (its own phone's): the latest start it fixed or the round it's in. */
  pos?: { i: number; at: number };
  /** The host's last position sent, and when. */
  beaconed?: { i: number; at: number; t: number };
  /** Each player's よみおわった: the round whose reveal they're done reading (the latest). */
  ready: Map<Who, number>;
  /** The game events heard and mine (`ev`), by player and slot: the latest. */
  evs: Map<Who, Map<number, RoundEvent>>;
  /** An adaptive game's (GameDef.next): the last round whose next was asked. */
  adapted?: number;
  /** The host gone: the furthest a player's つぎへ moved the game (mine or heard), so a phone that sees the host gone a
   *  moment later follows it, and a host back from a lock behind it adopts it. */
  advance?: { i: number; at: number };
}
