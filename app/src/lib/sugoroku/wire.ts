// 英語すごろく online's moves as kept and heard (docs/sugoroku.md "Online"), light: online.svelte.ts listens with the app
// (an invitation comes on every screen), so this is all it loads then; the rules and the fold (online.ts) come with a
// game, or an invitation's check.
import type { SgIntent } from '#lib/contract/live-protocol.ts';
import type { Who } from '#lib/types.ts';
import { seeded } from '#lib/random.ts';
import { familyOf } from './family.ts';
import type { Level } from './game.ts';

/** A move as kept: the wire's fields, who sent it, and the room's stamp (`t`: a mini-game's clock, mini/clock.ts; my
 *  own, the relay's clock as this phone has it), never the fold's, nor in what makes two moves the same. */
export type Move = Omit<SgIntent, 'kind'> & { who: Who; t?: number };

/** The rules' version, on every start (`r`): a phone on one it doesn't play folds nothing and asks for the app's
 *  update (otherRules). Bump it with any change to what a fold makes of the moves: game.ts's rules, the cards, the
 *  pictures, the board generator (family.ts GEN), the mini-games and their deal, the word or line lists
 *  (mini/online.test's pin fails until it is). A game keeps the rules it started on; this build plays only its own
 *  ('1'–'4' retired 2026-11-20, '5' 2026-11-28). */
export const RULES = '6';
export const playsRules = (r: string | undefined): boolean => r === RULES;
/** Whether the game held was started on rules this build doesn't play (or before they were sent): it can't be played here. */
export const otherRules = (log: readonly Move[]): boolean => log[0]?.a === 'start' && !playsRules(log[0].r);

/** An online game's id is its board's layout seed. */
export const ID_LEN = 10;
/** A new game's id: random, its board's family not the last game's (two games in a row look different). */
export function newGameId(last: string, rnd: () => number = Math.random): string {
  const make = () => Array.from({ length: ID_LEN }, () => '0123456789abcdefghijklmnopqrstuvwxyz'[Math.floor(rnd() * 36)]).join('');
  let id = make();
  for (let k = 0; k < 20 && last.length >= ID_LEN && familyOf(id) === familyOf(last); k++) id = make();
  return id;
}

/** A start's seats ("A2B1G3": who + level, in order). */
export const seatsOf = (s: string): { who: Who; level: Level }[] =>
  (s.match(/[ABG][123]/g) ?? []).map((x) => ({ who: x[0] as Who, level: Number(x[1]) as Level }));
export const seatsCode = (seats: readonly { who: Who; level: Level }[]): string => seats.map((x) => `${x.who}${x.level}`).join('');

/** Who goes first (docs/sugoroku.md "Rules"): a seat drawn from the game's seed (online its id), the table's order
 *  kept from there: the start's seats (and a passed-round game's) begin with it, so the fold is as ever and every phone
 *  the same. `pinned` (an e2e's `sgSeed` / `sgId`): `?sgFirst=<k>`, else the first picked. */
export function firstSeat<T>(seats: readonly T[], seed: string, pinned?: string | null): T[] {
  const k = pinned !== undefined && pinned !== null ? Math.min(Math.max(0, Math.floor(Number(pinned)) || 0), seats.length - 1) : Math.floor(seeded(`${seed}:first`)() * seats.length);
  return [...seats.slice(k), ...seats.slice(0, k)];
}

/** Two moves the same (their fields in any order, the stamp aside). */
const key = ({ t: _t, ...m }: Move) => JSON.stringify(Object.entries(m).sort(([a], [b]) => (a < b ? -1 : 1)));
export const sameMove = (a: Move, b: Move): boolean => key(a) === key(b);

/** What hearing a move did: `clash` a move of mine gave way (the room's at its place, an end before it), `gap` it came
 *  past a missing one (held till the gap fills). */
export interface Heard {
  log: Move[];
  held: Move[];
  why?: 'clash' | 'gap';
}

/**
 * The moves with one more heard (`me`: this phone's person), or null when it changes nothing (a repeat, one past the
 * end). The log grows by the next in order; later ones wait in `held`. The same on every phone, whatever order they
 * come in (the room takes the first of each `i`, relay/src/room.ts):
 * - an end stands at its `i` (the moves it follows), the earliest of them; a move at or past it counts for nothing, so an
 *   end racing the turn's move ends the game at the same place everywhere;
 * - a move heard at the place of one of mine takes it (mine lost the race: the room refused it), mine after it going too.
 */
export function heard(log: readonly Move[], held: readonly Move[], m: Move, me: Who | null): Heard | null {
  const end = log.at(-1)?.a === 'end' ? log.length - 1 : Infinity;
  if (m.i >= end) return null;
  if (m.i < log.length) {
    const was = log[m.i];
    if (sameMove(was, m) || (m.a !== 'end' && was.who !== me)) return null;
    const cut = log.slice(m.i);
    return drain([...log.slice(0, m.i), m], held, cut.some((x) => x.who === me) ? 'clash' : undefined);
  }
  if (m.i > log.length) {
    const at = held.find((x) => x.i === m.i), heldEnd = held.find((x) => x.a === 'end');
    if ((at && (sameMove(at, m) || m.a !== 'end' || at.a === 'end')) || (heldEnd && m.i >= heldEnd.i)) return null;
    const rest = held.filter((x) => x.i !== m.i && !(m.a === 'end' && x.i > m.i));
    return { log: [...log], held: [...rest, m].sort((a, b) => a.i - b.i), why: 'gap' };
  }
  return drain([...log, m], held);
}

/** The held moves that now follow on, in order (an end the last). */
function drain(log: Move[], held: readonly Move[], why?: Heard['why']): Heard {
  let wait = held.filter((x) => x.i >= log.length);
  while (wait.length && wait[0].i === log.length && log.at(-1)?.a !== 'end') log.push(wait.shift()!);
  if (log.at(-1)?.a === 'end') wait = [];
  return { log, held: wait, ...(why ? { why } : {}) };
}

/** An invitation's game goes stale this long after its last move (a start replayed from the room, a game left). */
export const INVITE_STALE_MS = 30 * 60_000;
/** Whether this phone is invited to the online game it holds (`log`, its moves; `at`, its last move's time): one
 *  someone else started with me seated, not answered here (参加 or ✕: `answered`), not over (an 終了, or `over`: the
 *  fold's end), its last move within INVITE_STALE_MS of `now`. No `me` (no person on this phone): never. */
export function invited(o: { log: readonly Move[]; me: Who | null; at: number; now: number; answered: readonly string[]; over: boolean }): boolean {
  const start = o.log[0];
  if (!start || start.a !== 'start' || !o.me || start.who === o.me) return false;
  if (!seatsOf(start.s ?? '').some((x) => x.who === o.me) || o.answered.includes(start.g)) return false;
  if (o.over || o.log.some((m) => m.a === 'end')) return false;
  return o.now - o.at <= INVITE_STALE_MS;
}

/** A mini-game's moves: plays and the close, from any seat (online.ts), racing for the next `i`. */
export const isMiniMove = (m: Pick<Move, 'a'>): boolean => m.a === 'mp' || m.a === 'mc';
/** When the mini-game on opened: the last pick's (`mg`) stamp (the sheet's clock: mini/clock.ts miniTimes). */
export const miniOpenedAt = (log: readonly Move[]): number | undefined => log.findLast((m) => m.a === 'mg')?.t;

/**
 * My mini-game moves not yet taken by the room (online.svelte.ts), one in flight at a time: the room takes the first of
 * each `i`, so two of mine sent at once could have the later taken and the earlier refused (my log no longer the
 * room's). The first sent at the log's end (`at`); the rest wait. One that lost its race (another phone's heard at its
 * `i`, or the room's refusal) goes again at the new end, once the log is past where it lost (`after`: the winner in),
 * MINI_TRIES times at most; none while a gap is held. Taken (its ack), the next goes.
 */
export interface Outbox { q: { m: Omit<Move, 'g' | 'i' | 'who' | 't'>; at: number | null; tries: number }[]; after: number }
export const OUTBOX: Outbox = { q: [], after: -1 };
const MINI_TRIES = 32;
export const queued = (o: Outbox, m: Outbox['q'][number]['m']): Outbox => ({ ...o, q: [...o.q, { m, at: null, tries: 0 }] });
/** The next to send now, its `i` (the log's end), or null (one in flight, a gap held, the winner not in yet). */
export function toSend(o: Outbox, log: readonly Move[], held: readonly Move[]): { o: Outbox; i: number } | null {
  const head = o.q[0];
  if (!head || head.at !== null || held.length || log.length <= o.after || log.at(-1)?.a === 'end') return null;
  return { o: { ...o, q: [{ ...head, at: log.length }, ...o.q.slice(1)] }, i: log.length };
}
/** The room's answer for the one in flight at `i` (another's: nothing): taken, the next may go; refused, again after
 *  the winner (or given up after MINI_TRIES). */
export function answered(o: Outbox, i: number, ok: boolean): Outbox {
  const head = o.q[0];
  if (!head || head.at !== i) return o;
  if (ok || head.tries + 1 >= MINI_TRIES) return { ...o, q: o.q.slice(1) };
  return { q: [{ ...head, at: null, tries: head.tries + 1 }, ...o.q.slice(1)], after: Math.max(o.after, i) };
}
/** Another phone's move heard at `i`: the one in flight there lost (the room took theirs), it goes again. */
export const beaten = (o: Outbox, i: number): Outbox => answered(o, i, false);
