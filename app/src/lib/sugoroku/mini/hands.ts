// A mini-game's private hands and staged reveals (docs/sugoroku.md "みんなで！"): each seat's share dealt from the
// stone's seed, so every phone computes every hand (hidden only by the sheet: a family table's, no server secrecy;
// passed round, behind a cover); a stage's control move (`op` 'next', `k` its stage) taken once, by whoever sends it
// first after its timer: a second phone's for the same stage is nothing.
import { shuffle } from '#lib/random.ts';
import type { Who } from '#lib/types.ts';
import type { Hand, Play } from './types.ts';

/**
 * `n` items (0..n-1) dealt across the seats, every seat's count within one of the others' (the extra to the stronger):
 * `first` items (in order) to the weakest seat (they act early), `hard` ones to the strongest that has room, the rest
 * shuffled by `r` round the seats with room; `apart` (RULES '3'), the rest in order each to a seat other than its
 * neighbours' where one has room (the most room first, ties by `r`): the turn passes as the line goes. Each item's owner.
 */
export function dealHands(n: number, seats: readonly Hand[], r: () => number, o: { first?: number; hard?: readonly number[]; apart?: boolean } = {}): Who[] {
  if (!seats.length) return [];
  // weakest first (ties: seat order)
  const byLevel = seats.map((s, k) => ({ ...s, k })).sort((a, b) => a.level - b.level || a.k - b.k);
  const room = new Map(byLevel.map((s, j) => [s.who, Math.floor(n / seats.length) + (byLevel.length - 1 - j < n % seats.length ? 1 : 0)]));
  const owner: (Who | null)[] = Array(n).fill(null);
  const give = (i: number, w: Who) => ((owner[i] = w), room.set(w, room.get(w)! - 1));
  const weak = byLevel[0].who;
  for (let i = 0; i < Math.min(o.first ?? 0, n); i++) if (room.get(weak)! > 0) give(i, weak);
  for (const i of o.hard ?? []) {
    if (owner[i] !== null) continue;
    const to = [...byLevel].reverse().find((s) => room.get(s.who)! > 0);
    if (to) give(i, to.who);
  }
  if (o.apart) {
    for (let i = 0; i < n; i++) {
      if (owner[i] !== null) continue;
      const near = (w: Who) => (owner[i - 1] === w ? 1 : 0) + (owner[i + 1] === w ? 1 : 0);
      const open = seats.filter((s) => room.get(s.who)! > 0);
      const fit = Math.min(...open.map((s) => near(s.who))), most = Math.max(...open.filter((s) => near(s.who) === fit).map((s) => room.get(s.who)!));
      const pick = open.filter((s) => near(s.who) === fit && room.get(s.who) === most);
      give(i, pick[Math.floor(r() * pick.length)].who);
    }
    return owner as Who[];
  }
  const rest = shuffle(owner.map((w, i) => (w === null ? i : -1)).filter((i) => i >= 0), r);
  let at = Math.floor(r() * seats.length);
  for (const i of rest) {
    while (room.get(seats[at % seats.length].who)! <= 0) at++;
    give(i, seats[at % seats.length].who);
    at++;
  }
  return owner as Who[];
}

/** Whether a play is the control move for `stage` (the stages counted round 64, the wire's `k`). */
export const isStage = (p: Play, stage: number): boolean => p.op === 'next' && p.k === stage % 64;
/** The control move a phone sends for `stage` (its timer up). */
export const stagePlay = (stage: number): Play => ({ op: 'next', k: stage % 64 });
