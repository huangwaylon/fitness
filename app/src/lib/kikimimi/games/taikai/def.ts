// しずえの しゅうまつ たいかい as a GameDef (docs/curriculum.md "Modes"; docs/kikimimi.md "Navigation", "Mode detail", "The daily menu"): the weekend
// quiz show over the week's misses (pick.ts: who offers what, the host's pick, the `open`'s `ids`), each round an item
// of the quiz's banks with its choices shuffled by the seed, the last one the wager: each player bets 10-100 of the
// round's own chips (CHIPS, worth nothing outside it: no かいがら, the user's decision) on being right, then answers.
//
// Levelled per player: each phone's tier (0-3, its comfortable level: `tierOf`) rides the host's options or the
// player's `join` (GameDef.tier), and each round is scored against what that tier expects (`questionPoints`: 50 for a
// sure thing, up to 150 for a stretch), so in しょうぶ the B1+ partner can win; co-op (the default) counts the rounds the
// team got against しずえ's target (`taikaiTarget`, from everyone's tiers), and the result is a trophy (`trophyOf`),
// written on each player's `listen` row as `gm` 'taikai' and `u` the trophy (`taikaiRow`) and kept in the tent
// (`trophiesOf`). Pure.
import { PLAY_MAX_S } from '../../../contract/live-protocol.ts';
import { mulberry32 } from '#lib/random.ts';
import type { ListenRow } from '../../../contract/listen.ts';
import type { LocalDate } from '../../../types.ts';
import { levelAt, shuffleChoices, type Item } from '../../bank.ts';
import { difficulty } from '../../progress.ts';
import { TIMERS, type QuizTimer } from '../../seed.ts';
import type { AnswerValue, GameDef, Graded, Round, RoundAnswer, RoundDeck, RoundWindows } from '../../round/types.ts';
import { PLAY_UNKNOWN } from '../quiz/kinds.ts';
import { taikaiOfDay } from './window.ts';

// ---------- tiers and points ----------

/** A player's tier: 0 はまべ … 3 やま (their comfortable level's place), on the wire as the options' first or a join's
 *  `tr` (0-3). */
const TIERS = 4;
/** The tier where a player's comfortable level (progress.ts Stats.level, levelRank's scale) is; unmeasured: かわ (1,
 *  B1+: the learners' level). */
export const tierOf = (level: number | null): number => (level === null ? 1 : Math.max(0, Math.min(TIERS - 1, Math.round(level) - 2)));
/** A tier's level (the `listen` row's `lv`, the fillers'): はまべ 2, かわ 3, もり 4, やま 6. */
export const tierLevel = (tier: number): number => levelAt(tier + 2);

/** How likely a player at `tier` gets an item of difficulty `b` (progress.ts's ability scale: a tier's comfortable
 *  level is where it expects 80 %). */
export const expected = (tier: number, b: number): number => 1 / (1 + Math.exp(-(tier + Math.log(4) - b)));
/** A right answer's points at a tier: 100 × (1.5 − expected), 50 for a sure thing up to 150 for a stretch (a hard item
 *  for you earns more: curriculum.md "The couple"'s たいせん against expectation). Wrong: 0. A replay costs nothing. */
export const questionPoints = (tier: number, b: number): number => Math.round(100 * (1.5 - expected(tier, b)));

// ---------- the wager ----------

/** Each player's chips for the wager, the round's alone (never kept, never かいがら). */
export const CHIPS = 100;
/** The bets: 10 to 100 in tens. */
const BET_STEP = 10;
export const BETS: readonly number[] = Array.from({ length: CHIPS / BET_STEP }, (_, k) => (k + 1) * BET_STEP);
/** A bet this high or higher is a confident one: missed, its reveal is the memorable one (the hypercorrection effect:
 *  a confident error, corrected, is the one remembered). */
export const CONFIDENT = 70;

/** The wager round's answer: the choice and the bet (as `[choice, bet / 10]`: the `play` wire's array of small ints). */
export const wagerAnswer = (choice: number, bet: number): number[] => [choice, bet / BET_STEP];
/** A wager answer's choice and bet, or null. */
export function wagerOf(a: AnswerValue): { choice: number; bet: number } | null {
  if (!Array.isArray(a) || a.length !== 2) return null;
  const [choice, k] = a as readonly number[];
  return Number.isInteger(choice) && choice >= 0 && Number.isInteger(k) && k >= 1 && k * BET_STEP <= CHIPS ? { choice, bet: k * BET_STEP } : null;
}
/** An answer's choice, either kind's (the `listen` row's pick). */
export const choiceOf = (a: AnswerValue): number => (typeof a === 'number' ? a : (a[0] ?? -1));
/** The chips after the wager: the bet won (paid ×2) or lost; no answer, the chips kept. */
export const chipsAfter = (w: { bet: number; ok: boolean } | null): number => CHIPS + (w ? (w.ok ? w.bet : -w.bet) : 0);

/** How the wager's reveal plays: a confident miss is the big moment (the answer and its trap shown large, しずえ's 「おしい！
 *  これは わすれませんね」, the clip again), a confident right the cheer; the others plain. */
export type WagerReveal = 'confident-miss' | 'confident-right' | 'miss' | 'right';
export const wagerReveal = (bet: number, ok: boolean): WagerReveal => (bet >= CONFIDENT ? (ok ? 'confident-right' : 'confident-miss') : ok ? 'right' : 'miss');

// ---------- rounds and the deck ----------

/** A tournament round: its item's id, the right choice (after the seed's shuffle) and how many, the clip's length (ms),
 *  the item's difficulty; the last one the wager. */
export interface TaikaiRound extends Round {
  kind: 'taikai.q' | 'taikai.wager';
  answer: number;
  choices: number;
  play: number;
  b: number;
}

/** The deck's items from the open's ids (pick.ts numbering: `item` looks one up, loaded) in order, each one's choices
 *  shuffled by the seed: the same on every phone with the same content. Copies (`answer` the shuffled right one). */
export function taikaiItems(seed: number, ids: readonly number[], item: (n: number) => Item | undefined): Item[] {
  const r = mulberry32((seed ^ 0x5e1ec7) >>> 0);
  return ids.map(item).filter((it): it is Item => !!it).map((it) => shuffleChoices(it, r));
}

/** A deck's items as its rounds (each clip's length in ms; unknown: PLAY_UNKNOWN): the last the wager when there are
 *  two or more. */
export const taikaiRounds = (items: readonly Item[], playMs: (it: Item) => number | undefined): TaikaiRound[] =>
  items.map((it, i) => ({
    kind: items.length > 1 && i === items.length - 1 ? 'taikai.wager' : 'taikai.q', id: it.id, answer: it.answer, choices: it.choices.length, play: playMs(it) ?? PLAY_UNKNOWN,
    b: difficulty(it)
  }));

/** The wager's extra answer time (the bet, then the choice). */
const WAGER_MS = 15_000;

/** Where a tournament's rounds come from: its seed and ids (the UI's decks, over the loaded levels: taikaiItems and
 *  taikaiRounds), and the game's content version (levels/index.json's `taikai:all`). */
export interface TaikaiSource {
  rounds(seed: number, ids: readonly number[]): readonly TaikaiRound[];
  cv?(): string | undefined;
}

/** A tournament's options: the host's tier and こたえる じかん (s; 0: none). */
export interface TaikaiOpts {
  tier: number;
  timer: QuizTimer;
}

export const taikaiOpts = {
  encode: (o: TaikaiOpts): number[] => [o.tier, Math.max(0, TIMERS.indexOf(o.timer))],
  decode: (a: readonly number[]): TaikaiOpts | null => {
    const tier = a[0], timer = TIMERS[a[1] ?? 0];
    return Number.isInteger(tier) && tier! >= 0 && tier! < TIERS && timer !== undefined ? { tier: tier!, timer } : null;
  }
};

const isChoice = (r: TaikaiRound, a: AnswerValue): a is number => typeof a === 'number' && Number.isInteger(a) && a >= 0 && a < r.choices;

/** A player's deck at their tier: each question right or wrong, its points by the tier (questionPoints), the wager's the
 *  bet; a player's score the questions' points and their chips after the wager (しょうぶ's ranking). */
export function taikaiDeck(rounds: () => readonly TaikaiRound[], o: TaikaiOpts, w: RoundWindows): RoundDeck {
  const answer = w.answers[Math.max(0, TIMERS.indexOf(o.timer))];
  const none: Graded = { ok: false, pts: 0 };
  const grade = (i: number, a: AnswerValue): Graded => {
    const r = rounds()[i];
    if (!r) return none;
    if (r.kind === 'taikai.wager') {
      const x = wagerOf(a), ok = !!x && x.choice === r.answer;
      return { ok, pts: ok ? x!.bet : 0 };
    }
    const ok = a === r.answer;
    return { ok, pts: ok ? questionPoints(o.tier, r.b) : 0 };
  };
  return {
    get count() {
      return rounds().length;
    },
    round: (i) => rounds()[i],
    timing: (i) => {
      const r = rounds()[i];
      return { lead: w.lead, play: r?.play ?? PLAY_UNKNOWN, answer: r?.kind === 'taikai.wager' ? answer + WAGER_MS : answer };
    },
    valid: (i, a) => {
      const r = rounds()[i];
      if (!r) return false;
      if (r.kind !== 'taikai.wager') return isChoice(r, a);
      const x = wagerOf(a);
      return !!x && x.choice < r.choices;
    },
    grade,
    score: (answers: ReadonlyMap<number, RoundAnswer>) => {
      let s = 0, wager: { bet: number; ok: boolean } | null = null;
      for (const [i, a] of answers) {
        const r = rounds()[i];
        if (r?.kind === 'taikai.wager') wager = { bet: wagerOf(a.a)?.bet ?? 0, ok: grade(i, a.a).ok };
        else s += grade(i, a.a).pts;
      }
      return Math.min(PLAY_MAX_S, s + chipsAfter(wager));
    },
    get maxScore() {
      return Math.min(PLAY_MAX_S, Math.max(0, rounds().length - 1) * 150 + 2 * CHIPS);
    }
  };
}

/** The tournament: co-op by default, しょうぶ optional; solo too (the target is still しずえ's). */
export function taikaiGame(src: TaikaiSource): GameDef<TaikaiOpts> {
  return {
    id: 'taikai',
    modes: { solo: true, coop: true, vs: true, same: true },
    opts: taikaiOpts,
    deck: (seed, o, ctx) => taikaiDeck(() => src.rounds(seed, ctx.ids ?? []), o, ctx.w),
    cv: () => src.cv?.(),
    tier: { of: (o) => o.tier, with: (o, tr) => ({ ...o, tier: Math.max(0, Math.min(TIERS - 1, tr)) }) }
  };
}

// ---------- しずえ's target and the trophies ----------

export type Trophy = 'bronze' | 'silver' | 'gold';
const TROPHIES: readonly Trophy[] = ['bronze', 'silver', 'gold'];

/** しずえ's target for the team: the rounds it's expected to get (each round, the chance that someone gets it at their
 *  tier), rounded, at least 1 and short of all of them: silver; gold two more (at most all). Every phone computes it alike
 *  from the rounds and everyone's tiers (the session view's `tiers`). */
export function taikaiTarget(rounds: readonly Pick<TaikaiRound, 'b'>[], tiers: readonly number[]): { expected: number; silver: number; gold: number } {
  const n = rounds.length;
  const e = rounds.reduce((s, r) => s + 1 - tiers.reduce((miss, t) => miss * (1 - expected(t, r.b)), 1), 0);
  const silver = Math.min(n, Math.max(1, Math.min(n - 1, Math.round(e))));
  return { expected: e, silver, gold: Math.min(n, silver + 2) };
}

/** The trophy for the team's rounds right (the session's team tally): gold at its line, silver at the target, bronze for
 *  taking part. */
export const trophyOf = (right: number, t: { silver: number; gold: number }): Trophy => (right >= t.gold ? 'gold' : right >= t.silver ? 'silver' : 'bronze');

/** What a tournament's `listen` row carries beyond the answers: the game, the trophy as its `u`, my tier's level. */
export const taikaiRow = (trophy: Trophy, tier: number): Pick<ListenRow, 'gm' | 'u' | 'lv'> => ({ gm: 'taikai', u: trophy, lv: tierLevel(tier) });

/** My trophies (the tent's shelf, ずかん's スタンプ): the best per tournament (its Friday) over my rows. */
export function trophiesOf(rows: readonly Pick<ListenRow, 'd' | 'gm' | 'u'>[]): Map<LocalDate, Trophy> {
  const out = new Map<LocalDate, Trophy>();
  for (const r of rows) {
    const k = TROPHIES.indexOf(r.u as Trophy), fri = r.gm === 'taikai' ? taikaiOfDay(r.d) : null;
    if (k < 0 || !fri) continue;
    const was = out.get(fri);
    if (!was || TROPHIES.indexOf(was) < k) out.set(fri, TROPHIES[k]);
  }
  return out;
}
