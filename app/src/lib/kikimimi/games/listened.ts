// What wave 2's listening games share (ことば タイル, たちぎき, ようじ でんわ: docs/kikimimi-engine.md "ことば タイル"): their
// files at the lobby's place, their lobby options (a place's level, こたえる じかん, the host's ear), a player's tier by
// their ear, a co-op share, and a game over its own rules (each game's def.ts: its rounds at an ear, their timing,
// valid and right, the row's `pick`) as a GameDef and as its `listen` row. Pure.
import { fnv1a } from '#lib/random.ts';
import type { ListenRow } from '../../contract/listen.ts';
import type { Item, Level } from '../bank.ts';
import { PLACES } from '../catalog.ts';
import type { ListenEntry } from '../listen.ts';
import type { Tier } from '../lesson.ts';
import { RIGHT } from '../score.ts';
import { TIMERS, type QuizTimer } from '../seed.ts';
import type { AnswerValue, GameDef, GameId, Graded, Round, RoundDeck, RoundWindows } from '../round/types.ts';

/** A slot, memo row or face not filled (the wire's ints are 0-63). */
export const EMPTY = 63;
/** The roles of a co-op game (two halves, two speakers). */
export const ROLES = 2;
/** The places' `ear` (0 はまべ … 3 やま). */
export const EARS = 4;

/** A listening game's lobby options: its level (a place's first: 3 かわ, 4 もり, 6 やま), こたえる じかん, the host's ear
 *  (each player's own on their join: GameDef.tier). */
export interface ListenOpts {
  lv: Level;
  timer: QuizTimer;
  ear: number;
}

/** A level's place (0 はまべ … 4 ほし; -1 none: アナウンス's 5). */
export const placeOf = (lv: number): number => PLACES.findIndex((p) => p.lvs.includes(lv));

export const listenOpts = {
  encode: (o: ListenOpts): number[] => [o.lv, Math.max(0, TIMERS.indexOf(o.timer)), o.ear],
  decode: (a: readonly number[]): ListenOpts | null => {
    const [lv, ti = 0, ear = 1] = a, timer = TIMERS[ti];
    return Number.isInteger(lv) && placeOf(lv) >= 0 && timer !== undefined && Number.isInteger(ear) && ear >= 0 && ear < EARS ? { lv: lv as Level, timer, ear } : null;
  }
};

/** A game's files a level's deck deals from: the `listened` ones at its place, by name. */
export function filesOf(gm: GameId, lv: number, listen: Readonly<Record<string, ListenEntry>>): string[] {
  const stage = placeOf(lv) + 1;
  return Object.entries(listen).filter(([, [g, st, s]]) => g === gm && st === stage && s === 'listened').map(([u]) => u).sort();
}

/** A player's tier on a deck: their ear against its place (below it easy, above it hard). */
export const tierAt = (ear: number, lv: number): Tier | undefined => {
  const at = placeOf(lv);
  return ear < at ? 'easy' : ear > at ? 'hard' : undefined;
};

/** A role's share of n slots or rows (solo, role null: every one): role 0 the 1st, 3rd…, role 1 the others; `oneBoth`:
 *  a share of one is both roles'. */
export const shareOf = (n: number, role: number | null, oneBoth = false): number[] =>
  Array.from({ length: n }, (_, j) => j).filter((j) => role === null || (oneBoth && n === 1) || j % ROLES === role % ROLES);

/** An answer's filled places. */
export const filled = (a: readonly number[]): number[] => a.flatMap((x, j) => (x === EMPTY ? [] : [j]));

/** An answer as the quiz's view keeps it (a choice its `k`, an array its `a`), raw again; null: none. */
export const rawOf = (x: { k: number; a?: AnswerValue } | null | undefined): AnswerValue | null => (x ? (x.a ?? x.k) : null);

/** A content version over several files' (6 hex; one file: its own; none known: undefined). */
export function cvOver(cvs: readonly (string | undefined)[]): string | undefined {
  if (!cvs.length || cvs.some((c) => c === undefined)) return undefined;
  return cvs.length === 1 ? cvs[0] : (fnv1a(cvs.join(',')) >>> 0).toString(16).padStart(8, '0').slice(0, 6);
}

/** A game's rules (its def.ts): its rounds at an ear from its cards (`playMs`: a card's clip length, unknown:
 *  undefined), a round's timing from the timer's window, valid and right, and a valid answer as its row's `pick`. */
export interface ListenRules<C extends Item, R extends Round> {
  id: GameId;
  rounds(cards: readonly C[], seed: number, o: ListenOpts, playMs: (c: C) => number | undefined): R[];
  timing(r: R | undefined, answer: number, w: RoundWindows): ReturnType<RoundDeck['timing']>;
  valid(r: R, a: AnswerValue): boolean;
  ok(r: R, a: AnswerValue): boolean;
  pick(r: R, a: AnswerValue): number;
}

/** Where a game's cards come from (the phone's decks: listenLane.ts; a test's), a card's clip length, and its content
 *  version (its files'). */
export interface ListenSource<C extends Item> {
  cards(seed: number, o: ListenOpts): readonly C[];
  playMs(c: C): number | undefined;
  cv?(o: ListenOpts): string | undefined;
}

/** A deck's rounds kept per its cards and ear (the session reads them at every call). */
const ROUNDS = new WeakMap<readonly Item[], Map<string, readonly Round[]>>();
function roundsOf<C extends Item, R extends Round>(g: ListenRules<C, R>, cards: readonly C[], seed: number, o: ListenOpts, playMs: (c: C) => number | undefined): readonly R[] {
  let by = ROUNDS.get(cards);
  if (!by) ROUNDS.set(cards, (by = new Map()));
  const k = `${g.id}:${seed}:${o.lv}:${o.ear}`;
  let rs = by.get(k) as readonly R[] | undefined;
  if (!rs) by.set(k, (rs = g.rounds(cards, seed, o, playMs)));
  return rs;
}

/** A player's deck at their ear: one point a round right. */
function deckOf<R extends Round>(g: Pick<ListenRules<Item, R>, 'timing' | 'valid' | 'ok'>, rounds: () => readonly R[], o: ListenOpts, w: RoundWindows): RoundDeck {
  const answer = w.answers[Math.max(0, TIMERS.indexOf(o.timer))];
  const none: Graded = { ok: false, pts: 0 };
  return {
    get count() {
      return rounds().length;
    },
    round: (i) => rounds()[i],
    timing: (i) => g.timing(rounds()[i], answer, w),
    valid: (i, a) => {
      const r = rounds()[i];
      return !!r && g.valid(r, a);
    },
    grade: (i, a) => {
      const r = rounds()[i];
      if (!r || !g.valid(r, a)) return none;
      const ok = g.ok(r, a);
      return { ok, pts: ok ? RIGHT : 0 };
    },
    get maxScore() {
      return RIGHT * rounds().length;
    }
  };
}

/** A game as a GameDef: solo and co-op (two roles), no たいせん, each player at their own ear. */
export function listenGame<C extends Item, R extends Round>(g: ListenRules<C, R>, src: ListenSource<C>): GameDef<ListenOpts> {
  return {
    id: g.id,
    modes: { solo: true, coop: true, vs: false, same: true },
    opts: listenOpts,
    deck: (seed, o, ctx) => deckOf(g, () => roundsOf(g, src.cards(seed, o), seed, o, src.playMs), o, ctx.w),
    cv: (o) => src.cv?.(o),
    tier: { of: (o) => o.ear, with: (o, tr) => ({ ...o, ear: Math.max(0, Math.min(EARS - 1, tr)) }) },
    roles: ROLES
  };
}

/** My answers of a game as its `listen` row's (contract/listen.ts): each round I had (one not answered only once the
 *  game's done), right or not, the answer's `pick` (-1: none, or not valid), my replays. */
export function listenRecord<R extends Round>(g: Pick<ListenRules<Item, R>, 'valid' | 'ok' | 'pick'>, rounds: readonly R[], answers: readonly (AnswerValue | null)[], had: readonly boolean[], rp: readonly number[], done: boolean): ListenRow['r'] {
  return rounds.flatMap((r, i): ListenRow['r'] => {
    const a = answers[i] ?? null;
    if (!had[i] || (a === null && !done)) return [];
    const valid = a !== null && g.valid(r, a);
    return [[r.id, valid && g.ok(r, a) ? 1 : 0, valid ? g.pick(r, a) : -1, Math.min(99, rp[i] ?? 0)]];
  }).slice(0, 12);
}
