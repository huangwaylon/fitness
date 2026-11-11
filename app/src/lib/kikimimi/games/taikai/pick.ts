// しずえの しゅうまつ たいかい's deck, chosen (docs/curriculum.md "Modes"): the week's misses of everyone in the lobby,
// interleaved (まぜまぜ: no two of a type or level side by side where the picks allow), the hardest last as the wager.
//
// How the phones agree on it. Each phone knows only its own player's answers in full (the partner's rows reach it as
// summaries: contract/listen.ts), so nobody can deal the others' misses from a seed. Instead:
//   1. each player's phone offers its own misses (`weekMisses` → `offerOf`, ≤ 4 numeric item ids) in the lobby, as
//      `play` events (`ev`, e = EV_MISS, i the slot, x the id; the contract's reserved op, no relay change);
//   2. the host's phone picks the deck from its own misses and the offers it heard (`taikaiPick`: round-robin across the
//      players, fresh items at their levels to fill, interleaved, the wager last) and sends it as the `open`'s `ids`
//      (≤ 8: 7 questions and the wager), sending the open again whenever an offer changes it;
//   3. every phone deals the rounds from the open's `ids` and seed alone (def.ts taikaiItems: the choices shuffled by the
//      seed), so the same open gives the same deck everywhere, whatever each phone knows.
// The numeric ids are each item's place in the index (`numbering`: level by level, each level's items in the bank's
// order), the same on every phone with the same content, which the game's cv (all the levels' content: compile.ts)
// guarantees: a phone with other content is offered the update and never joins. Pure.
import { mulberry32, shuffle } from '#lib/random.ts';
import { firstListenRight } from '../../../contract/listen.ts';
import type { LocalDate, Who } from '../../../types.ts';
import { levelRank, type Entry } from '../../bank.ts';
import { difficulty } from '../../progress.ts';
import { ORDER } from '../../round/session.ts';
import { taikaiDays } from './window.ts';

/** A tournament's rounds at most: the `open`'s `ids` (≤ 8), the last of them the wager. */
export const TAIKAI_ROUNDS = 8;
/** What each player offers of their misses (two players fill the 8; three share them round-robin). */
export const OFFER_MAX = 4;
/** A `play` event's `e` for an offered miss (`i` its slot 0-3, `x` its numeric id). */
export const EV_MISS = 1;

/** An item as the deck picks it: its id, level and type. */
type Pickable = Pick<Entry, 'id' | 'lv' | 'type'>;

/** The index's items numbered: level by level (ascending), each level's items in the bank's order; the same numbers on
 *  every phone with the same content (the game's cv). */
export interface Numbering {
  num(id: string): number | undefined;
  entry(n: number): Pickable | undefined;
}

export function numbering(entries: readonly Pickable[]): Numbering {
  const levels = [...new Set(entries.map((e) => e.lv))].sort((a, b) => a - b);
  const list = levels.flatMap((lv) => entries.filter((e) => e.lv === lv));
  const by = new Map(list.map((e, n) => [e.id, n]));
  return { num: (id) => by.get(id), entry: (n) => list[n] };
}

/** One of my answers as the misses read it (progress.ts Answer). */
interface Answered {
  id: string;
  ok: boolean;
  rp: number;
  d: LocalDate;
}

/**
 * My misses for a tournament (its Friday `fri`), ranked: the items I got wrong on its week's days (taikaiDays) and
 * haven't since got right on the first listen, most missed first, then the latest, then by id. `known`: what the
 * tournament can deal (an item of this build's levels, not a ladder's rung or a unit's own).
 */
export function weekMisses(answers: readonly Answered[], fri: LocalDate, known: (id: string) => boolean): string[] {
  const { from, to } = taikaiDays(fri);
  const by = new Map<string, { n: number; last: LocalDate; fixed: boolean }>();
  for (const a of answers) {
    if (a.d < from || a.d > to || !known(a.id)) continue;
    const m = by.get(a.id) ?? { n: 0, last: a.d, fixed: false };
    if (!a.ok) Object.assign(m, { n: m.n + 1, last: a.d > m.last ? a.d : m.last, fixed: false });
    else if (firstListenRight(a) && m.n) m.fixed = true;
    by.set(a.id, m);
  }
  return [...by]
    .filter(([, m]) => m.n && !m.fixed)
    .sort(([a, x], [b, y]) => y.n - x.n || (x.last < y.last ? 1 : x.last > y.last ? -1 : 0) || (a < b ? -1 : 1))
    .map(([id]) => id);
}

/** My offer: my first OFFER_MAX misses as numeric ids. */
export const offerOf = (misses: readonly string[], ids: Numbering): number[] =>
  misses.map((id) => ids.num(id)).filter((n): n is number => n !== undefined).slice(0, OFFER_MAX);

/** An offer as `play` events (the session's `event(i, e, x)`). */
export const offerEvents = (offer: readonly number[]): { i: number; e: number; x: number }[] => offer.map((x, i) => ({ i, e: EV_MISS, x }));

/** The offers heard (the session view's `evs`), by player: each one's ids in slot order. */
export function offersOf(evs: readonly { who: Who; i: number; e: number; x?: number }[]): Partial<Record<Who, number[]>> {
  const out: Partial<Record<Who, number[]>> = {};
  for (const w of ORDER) {
    const mine = evs.filter((v) => v.who === w && v.e === EV_MISS && v.x !== undefined && v.i < OFFER_MAX).sort((a, b) => a.i - b.i);
    if (mine.length) out[w] = mine.map((v) => v.x!);
  }
  return out;
}

interface PickIn {
  /** The lobby's seed (the fillers' draw). */
  seed: number;
  /** Each player's offer (numeric ids, best first), the host's own among them: in A B G order. */
  offers: Partial<Record<Who, readonly number[]>>;
  /** The players' levels (each one's tier's level: def.ts tierLevel), for the fillers. */
  levels: readonly number[];
  /** The items the fillers may come from (numeric ids of the levels this phone offers). */
  pool: readonly number[];
  /** Items to keep out of the fillers (the host's last games: recent.ts). */
  avoid?: ReadonlySet<number>;
  ids: Numbering;
}

/**
 * The deck's ids (≤ TAIKAI_ROUNDS): the offers taken round-robin (A, B, G; each one's best first; no item twice), then
 * fresh items to fill, at each player's level in turn (by the seed, the `avoid`ed last); the hardest of them is the
 * wager, last; the rest interleaved (`interleave`). The host's alone (the others deal from the ids it sends).
 */
export function taikaiPick(o: PickIn): number[] {
  const got: number[] = [];
  const add = (n: number) => {
    if (got.length < TAIKAI_ROUNDS && !got.includes(n) && o.ids.entry(n)) got.push(n);
  };
  const lists = ORDER.map((w) => o.offers[w] ?? []).filter((l) => l.length);
  for (let k = 0; k < OFFER_MAX; k++) for (const l of lists) if (l[k] !== undefined) add(l[k]);
  if (got.length < TAIKAI_ROUNDS) {
    // fresh items to fill: a player's level each in turn (one with none left skipped), then any
    const r = mulberry32((o.seed ^ 0x7a1ca1) >>> 0);
    const fresh = shuffle([...o.pool], r).sort((a, b) => Number(!!o.avoid?.has(a)) - Number(!!o.avoid?.has(b)));
    const levels = (o.levels.length ? o.levels : [3]).map(levelRank);
    for (let k = 0, none = 0; got.length < TAIKAI_ROUNDS && none < levels.length; k++) {
      const n = fresh.find((x) => !got.includes(x) && levelRank(o.ids.entry(x)!.lv) === levels[k % levels.length]);
      if (n === undefined) none++;
      else (none = 0), add(n);
    }
    for (const n of fresh) add(n);
  }
  if (got.length < 2) return got;
  const b = (n: number) => difficulty(o.ids.entry(n)!);
  const wager = got.reduce((m, n) => (b(n) > b(m) ? n : m));
  return [...interleave(got.filter((n) => n !== wager), o.ids), wager];
}

/** The questions in an order where no two side by side share a type, nor a level where it can be helped: at each step,
 *  of those that differ from the one before in both (else in type, else any), the one whose type has the most left (the
 *  greedy that never runs out of others while one can be kept apart), the first of them. */
export function interleave(ns: readonly number[], ids: Numbering): number[] {
  const left = ns.map((n) => ({ n, e: ids.entry(n)! })), out: number[] = [];
  let prev: Pickable | undefined;
  while (left.length) {
    const p = prev;
    const tests = [(e: Pickable) => !p || (e.type !== p.type && e.lv !== p.lv), (e: Pickable) => !p || e.type !== p.type, () => true];
    const ok = left.filter((x) => tests.find((f) => left.some((y) => f(y.e)))!(x.e));
    const count = (t: string) => left.filter((x) => x.e.type === t).length;
    const best = ok.reduce((m, x) => (count(x.e.type) > count(m.e.type) ? x : m));
    left.splice(left.indexOf(best), 1);
    out.push(best.n);
    prev = best.e;
  }
  return out;
}
