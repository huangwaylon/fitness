// 英語すごろく online's moves as kept and heard (docs/sugoroku.md "Online"), light: online.svelte.ts listens with the app
// (an invitation comes on every screen), so this is all it loads then; the rules and the fold (online.ts) come with a
// game, or an invitation's check.
import type { SgIntent } from '#lib/contract/live-protocol.ts';
import type { Who } from '#lib/types.ts';
import { familyOf } from './family.ts';
import type { Level } from './game.ts';

/** A move as kept: the wire's fields and who sent it. */
export type Move = Omit<SgIntent, 'kind'> & { who: Who };

/** The rules' version, on every start (`r`): a phone on another folds nothing and asks for the app's update
 *  (otherRules). Bump it with any change to what a fold makes of the moves: game.ts's rules or save shape, the cards,
 *  the pictures, the board generator (family.ts GEN), the word or line lists (online.test's pin fails until it is). */
export const RULES = '1';
/** Whether the game held was started on another build's rules (or before they were sent): it can't be played here. */
export const otherRules = (log: readonly Move[]): boolean => log[0]?.a === 'start' && log[0].r !== RULES;

/** An online game's id is its board's layout seed (an older 6–8 letter id: the classic board). */
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

/** Two moves the same (their fields in any order). */
const key = (m: Move) => JSON.stringify(Object.entries(m).sort(([a], [b]) => (a < b ? -1 : 1)));
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
